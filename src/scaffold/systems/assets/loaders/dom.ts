import type { Manifest, SpriteSheetData, LoadedSheet, LoadedImage, AssetLoader, ProgressCallback } from '../types';
import { inferAssetType } from '../types';

type CachedAsset = LoadedSheet | LoadedImage | unknown;

export class DomLoader implements AssetLoader {
  private manifest!: Manifest;
  private cache = new Map<string, CachedAsset>();
  private loading = new Map<string, Promise<CachedAsset>>();
  private loadedBundles = new Set<string>();
  private usingFallback = false;

  init(manifest: Manifest): void {
    this.manifest = manifest;
  }

  private getBaseUrl(): string {
    return this.usingFallback && this.manifest.localBase
      ? this.manifest.localBase
      : this.manifest.cdnBase;
  }

  // XHR download with progress events — returns a Blob
  private xhrBlob(url: string, onProgress?: ProgressCallback): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.responseType = 'blob';
      if (onProgress) {
        xhr.onprogress = (e) => {
          if (e.lengthComputable) {
            onProgress(e.loaded / e.total);
          }
        };
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response as Blob);
        } else {
          reject(new Error(`HTTP ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error(`Network error: ${url}`));
      xhr.send();
    });
  }

  async loadBundle(name: string, onProgress?: ProgressCallback): Promise<void> {
    if (this.loadedBundles.has(name)) {
      onProgress?.(1);
      return;
    }

    const bundle = this.manifest.bundles.find((b) => b.name === name);
    if (!bundle) throw new Error(`Unknown bundle: ${name}`);

    const assets = bundle.assets.filter((p) => !p.includes('audio/'));

    if (assets.length === 0) {
      onProgress?.(1);
      this.loadedBundles.add(name);
      return;
    }

    if (assets.length === 1) {
      // Single-asset bundle: progress maps directly
      await this.loadAsset(assets[0], onProgress);
    } else {
      // Multi-asset: combine per-asset progress
      const perAsset = new Array(assets.length).fill(0);
      await Promise.all(
        assets.map((p, i) =>
          this.loadAsset(p, (prog) => {
            perAsset[i] = prog;
            onProgress?.(perAsset.reduce((a, b) => a + b, 0) / assets.length);
          })
        )
      );
    }

    this.loadedBundles.add(name);
  }

  async loadBundles(prefix: string): Promise<void> {
    const bundles = this.manifest.bundles.filter((b) => b.name.startsWith(prefix));
    await Promise.all(bundles.map((b) => this.loadBundle(b.name)));
  }

  isLoaded(bundle: string): boolean {
    return this.loadedBundles.has(bundle);
  }

  // Load any asset type
  async loadAsset(path: string, onProgress?: ProgressCallback): Promise<CachedAsset> {
    // Use just the filename (without directory and extension) as the key
    // e.g., 'branding/atlas-branding-wolf.json' -> 'atlas-branding-wolf'
    const filename = path.split('/').pop() || path;
    const key = filename.replace(/\.(json|png|jpg|jpeg|webp|gif|svg)$/i, '');

    if (this.cache.has(key)) {
      onProgress?.(1);
      return this.cache.get(key)!;
    }

    if (this.loading.has(key)) {
      return this.loading.get(key)!;
    }

    const type = inferAssetType(path);
    let promise: Promise<CachedAsset>;

    switch (type) {
      case 'spritesheet':
        promise = this.doLoadSheet(path, onProgress);
        break;
      case 'image':
        promise = this.doLoadImage(path, onProgress);
        break;
      case 'json':
        promise = this.doLoadJson(path);
        break;
      default:
        throw new Error(`Unsupported asset type for DomLoader: ${type}`);
    }

    this.loading.set(key, promise);

    try {
      const result = await promise;
      this.cache.set(key, result);
      onProgress?.(1);
      return result;
    } finally {
      this.loading.delete(key);
    }
  }

  // Load spritesheet (JSON + image)
  async loadSheet(jsonPath: string): Promise<LoadedSheet> {
    return this.loadAsset(jsonPath) as Promise<LoadedSheet>;
  }

  private async doLoadSheet(jsonPath: string, onProgress?: ProgressCallback): Promise<LoadedSheet> {
    let baseUrl = this.getBaseUrl();
    let jsonUrl = `${baseUrl}/${jsonPath}`;
    let response: Response;

    try {
      response = await fetch(jsonUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      // If CDN fails and we have a local fallback, try that
      if (!this.usingFallback && this.manifest.localBase) {
        console.warn(`[Assets] CDN failed for ${jsonPath}, falling back to local`);
        this.usingFallback = true;
        baseUrl = this.manifest.localBase;
        jsonUrl = `${baseUrl}/${jsonPath}`;
        response = await fetch(jsonUrl);
        if (!response.ok) {
          throw new Error(`Failed to load ${jsonUrl}: ${response.status}`);
        }
      } else {
        throw new Error(`Failed to load ${jsonUrl}`);
      }
    }

    const json: SpriteSheetData = await response.json();
    onProgress?.(0.1); // JSON metadata loaded (~10%)

    const dir = jsonPath.substring(0, jsonPath.lastIndexOf('/'));
    const imageUrl = `${baseUrl}/${dir}/${json.meta.image}`;

    // Use XHR for image download to get byte-level progress
    const blob = await this.xhrBlob(imageUrl, onProgress ? (p) => {
      onProgress(0.1 + p * 0.9); // Image progress: 10% → 100%
    } : undefined);
    const image = await createImageBitmap(blob);

    return { json, image };
  }

  // Load raw image (PNG, JPG, etc)
  async loadImage(imagePath: string): Promise<LoadedImage> {
    return this.loadAsset(imagePath) as Promise<LoadedImage>;
  }

  private async doLoadImage(imagePath: string, onProgress?: ProgressCallback): Promise<LoadedImage> {
    let url = `${this.getBaseUrl()}/${imagePath}`;

    let blob: Blob;
    try {
      blob = await this.xhrBlob(url, onProgress);
    } catch (error) {
      // If CDN fails and we have a local fallback, try that
      if (!this.usingFallback && this.manifest.localBase) {
        console.warn(`[Assets] CDN failed for ${imagePath}, falling back to local`);
        this.usingFallback = true;
        url = `${this.manifest.localBase}/${imagePath}`;
        blob = await this.xhrBlob(url, onProgress);
      } else {
        throw error;
      }
    }

    const image = await createImageBitmap(blob);

    return {
      image,
      width: image.width,
      height: image.height,
    };
  }

  // Load raw JSON
  async loadJson<T = unknown>(jsonPath: string): Promise<T> {
    return this.loadAsset(jsonPath) as Promise<T>;
  }

  private async doLoadJson(jsonPath: string): Promise<unknown> {
    let url = `${this.getBaseUrl()}/${jsonPath}`;
    let response: Response;

    try {
      response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      // If CDN fails and we have a local fallback, try that
      if (!this.usingFallback && this.manifest.localBase) {
        console.warn(`[Assets] CDN failed for ${jsonPath}, falling back to local`);
        this.usingFallback = true;
        url = `${this.manifest.localBase}/${jsonPath}`;
        response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load ${url}: ${response.status}`);
        }
      } else {
        throw new Error(`Failed to load ${url}`);
      }
    }

    return response.json();
  }

  // ─── Getters ─────────────────────────────────────────────

  get(path: string): CachedAsset | null {
    // Use just the filename (without directory and extension) as the key
    const filename = path.split('/').pop() || path;
    const key = filename.replace(/\.(json|png|jpg|jpeg|webp|gif|svg)$/i, '');
    return this.cache.get(key) ?? null;
  }

  getSheet(path: string): LoadedSheet | null {
    return this.get(path) as LoadedSheet | null;
  }

  getImage(path: string): LoadedImage | null {
    return this.get(path) as LoadedImage | null;
  }

  has(path: string): boolean {
    // Use just the filename (without directory and extension) as the key
    const filename = path.split('/').pop() || path;
    const key = filename.replace(/\.(json|png|jpg|jpeg|webp|gif|svg)$/i, '');
    return this.cache.has(key);
  }

  getFrameNames(sheetPath: string): string[] {
    const sheet = this.getSheet(sheetPath);
    return sheet ? Object.keys(sheet.json.frames) : [];
  }

  // ─── Output Formats ──────────────────────────────────────

  // Get a canvas with just the specified frame from a spritesheet
  getFrameCanvas(sheetPath: string, frameName: string): HTMLCanvasElement {
    const sheet = this.getSheet(sheetPath);
    if (!sheet) throw new Error(`Sheet not loaded: ${sheetPath}`);

    const frameData = sheet.json.frames[frameName];
    if (!frameData) throw new Error(`Frame not found: ${frameName}`);

    const { x, y, w, h } = frameData.frame;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(sheet.image, x, y, w, h, 0, 0, w, h);

    return canvas;
  }

  // Get a canvas from a raw image
  getImageCanvas(imagePath: string): HTMLCanvasElement {
    const loaded = this.getImage(imagePath);
    if (!loaded) throw new Error(`Image not loaded: ${imagePath}`);

    const canvas = document.createElement('canvas');
    canvas.width = loaded.width;
    canvas.height = loaded.height;
    canvas.getContext('2d')!.drawImage(loaded.image, 0, 0);

    return canvas;
  }

  // Get a Blob URL (for <img src> or CSS backgrounds)
  async getFrameURL(sheetPath: string, frameName: string): Promise<string> {
    const canvas = this.getFrameCanvas(sheetPath, frameName);
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });
    return URL.createObjectURL(blob);
  }

  async getImageURL(imagePath: string): Promise<string> {
    const loaded = this.getImage(imagePath);
    if (!loaded) throw new Error(`Image not loaded: ${imagePath}`);

    const canvas = this.getImageCanvas(imagePath);
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });
    return URL.createObjectURL(blob);
  }

  // Get a data URI
  getFrameDataURI(sheetPath: string, frameName: string): string {
    const canvas = this.getFrameCanvas(sheetPath, frameName);
    return canvas.toDataURL('image/png');
  }

  getImageDataURI(imagePath: string): string {
    const canvas = this.getImageCanvas(imagePath);
    return canvas.toDataURL('image/png');
  }

  // Get ImageBitmap of a single frame
  async getFrameBitmap(sheetPath: string, frameName: string): Promise<ImageBitmap> {
    const sheet = this.getSheet(sheetPath);
    if (!sheet) throw new Error(`Sheet not loaded: ${sheetPath}`);

    const frameData = sheet.json.frames[frameName];
    if (!frameData) throw new Error(`Frame not found: ${frameName}`);

    const { x, y, w, h } = frameData.frame;
    return createImageBitmap(sheet.image, x, y, w, h);
  }

  // Get raw ImageBitmap from loaded image
  getImageBitmap(imagePath: string): ImageBitmap | null {
    return this.getImage(imagePath)?.image ?? null;
  }

  // Draw a frame directly to a canvas context
  drawFrame(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    sheetPath: string,
    frameName: string,
    dx: number,
    dy: number,
    dw?: number,
    dh?: number
  ): void {
    const sheet = this.getSheet(sheetPath);
    if (!sheet) throw new Error(`Sheet not loaded: ${sheetPath}`);

    const frameData = sheet.json.frames[frameName];
    if (!frameData) throw new Error(`Frame not found: ${frameName}`);

    const { x, y, w, h } = frameData.frame;
    ctx.drawImage(sheet.image, x, y, w, h, dx, dy, dw ?? w, dh ?? h);
  }

  // Draw a raw image to canvas
  drawImage(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    imagePath: string,
    dx: number,
    dy: number,
    dw?: number,
    dh?: number
  ): void {
    const loaded = this.getImage(imagePath);
    if (!loaded) throw new Error(`Image not loaded: ${imagePath}`);

    ctx.drawImage(loaded.image, dx, dy, dw ?? loaded.width, dh ?? loaded.height);
  }
}
