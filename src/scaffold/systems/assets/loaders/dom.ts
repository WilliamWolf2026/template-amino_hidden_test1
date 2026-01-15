import type { Manifest, SpriteSheetData, LoadedSheet, LoadedImage, AssetLoader } from '../types';
import { inferAssetType } from '../types';

type CachedAsset = LoadedSheet | LoadedImage | unknown;

export class DomLoader implements AssetLoader {
  private manifest!: Manifest;
  private cache = new Map<string, CachedAsset>();
  private loading = new Map<string, Promise<CachedAsset>>();
  private loadedBundles = new Set<string>();

  init(manifest: Manifest): void {
    this.manifest = manifest;
  }

  async loadBundle(name: string): Promise<void> {
    if (this.loadedBundles.has(name)) return;

    const bundle = this.manifest.bundles.find((b) => b.name === name);
    if (!bundle) throw new Error(`Unknown bundle: ${name}`);

    await Promise.all(
      bundle.assets
        .filter((p) => !p.includes('audio/')) // Audio handled by AudioLoader
        .map((p) => this.loadAsset(p))
    );

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
  async loadAsset(path: string): Promise<CachedAsset> {
    const key = path.replace(/\.(json|png|jpg|jpeg|webp|gif|svg)$/i, '');

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    if (this.loading.has(key)) {
      return this.loading.get(key)!;
    }

    const type = inferAssetType(path);
    let promise: Promise<CachedAsset>;

    switch (type) {
      case 'spritesheet':
        promise = this.doLoadSheet(path);
        break;
      case 'image':
        promise = this.doLoadImage(path);
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
      return result;
    } finally {
      this.loading.delete(key);
    }
  }

  // Load spritesheet (JSON + image)
  async loadSheet(jsonPath: string): Promise<LoadedSheet> {
    return this.loadAsset(jsonPath) as Promise<LoadedSheet>;
  }

  private async doLoadSheet(jsonPath: string): Promise<LoadedSheet> {
    const jsonUrl = `${this.manifest.cdnBase}/${jsonPath}`;
    const response = await fetch(jsonUrl);

    if (!response.ok) {
      throw new Error(`Failed to load ${jsonUrl}: ${response.status}`);
    }

    const json: SpriteSheetData = await response.json();

    const dir = jsonPath.substring(0, jsonPath.lastIndexOf('/'));
    const imageUrl = `${this.manifest.cdnBase}/${dir}/${json.meta.image}`;

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to load ${imageUrl}: ${imageResponse.status}`);
    }

    const blob = await imageResponse.blob();
    const image = await createImageBitmap(blob);

    return { json, image };
  }

  // Load raw image (PNG, JPG, etc)
  async loadImage(imagePath: string): Promise<LoadedImage> {
    return this.loadAsset(imagePath) as Promise<LoadedImage>;
  }

  private async doLoadImage(imagePath: string): Promise<LoadedImage> {
    const url = `${this.manifest.cdnBase}/${imagePath}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }

    const blob = await response.blob();
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
    const url = `${this.manifest.cdnBase}/${jsonPath}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status}`);
    }

    return response.json();
  }

  // ─── Getters ─────────────────────────────────────────────

  get(path: string): CachedAsset | null {
    const key = path.replace(/\.(json|png|jpg|jpeg|webp|gif|svg)$/i, '');
    return this.cache.get(key) ?? null;
  }

  getSheet(path: string): LoadedSheet | null {
    return this.get(path) as LoadedSheet | null;
  }

  getImage(path: string): LoadedImage | null {
    return this.get(path) as LoadedImage | null;
  }

  has(path: string): boolean {
    const key = path.replace(/\.(json|png|jpg|jpeg|webp|gif|svg)$/i, '');
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
