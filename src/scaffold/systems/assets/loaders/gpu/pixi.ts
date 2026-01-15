import { Assets, Texture, Sprite, AnimatedSprite, Rectangle, type Spritesheet } from 'pixi.js';
import type { Manifest, AssetLoader } from '../../types';

export class PixiLoader implements AssetLoader {
  private manifest!: Manifest;
  private loadedBundles = new Set<string>();
  private initialized = false;

  init(manifest: Manifest): void {
    this.manifest = manifest;

    // Register all bundles with Pixi's native Assets system
    for (const bundle of manifest.bundles) {
      const assets: Record<string, string> = {};

      for (const path of bundle.assets) {
        if (path.includes('audio/')) continue; // Skip audio
        const key = path.replace(/\.json$/, '');
        assets[key] = `${manifest.cdnBase}/${path}`;
      }

      if (Object.keys(assets).length > 0) {
        Assets.addBundle(bundle.name, assets);
      }
    }

    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async loadBundle(name: string): Promise<void> {
    if (this.loadedBundles.has(name)) return;

    const bundle = this.manifest.bundles.find((b) => b.name === name);
    if (!bundle) throw new Error(`Unknown bundle: ${name}`);

    // Check if bundle has any non-audio assets
    const hasAssets = bundle.assets.some((p) => !p.includes('audio/'));
    if (!hasAssets) {
      this.loadedBundles.add(name);
      return;
    }

    // Pixi handles everything: fetch, parse, texture creation, caching
    await Assets.loadBundle(name);
    this.loadedBundles.add(name);
  }

  async loadBundles(prefix: string): Promise<void> {
    const bundles = this.manifest.bundles.filter((b) => b.name.startsWith(prefix));
    await Promise.all(bundles.map((b) => this.loadBundle(b.name)));
  }

  isLoaded(bundle: string): boolean {
    return this.loadedBundles.has(bundle);
  }

  // Get texture for a specific frame
  getTexture(sheet: string, frame: string): Texture {
    const sheetKey = sheet.replace(/\.json$/, '');
    const data = Assets.get<Spritesheet>(sheetKey);

    if (!data) {
      throw new Error(`Sheet not loaded: ${sheetKey}`);
    }

    const texture = data.textures?.[frame];
    if (!texture) {
      throw new Error(`Frame not found: ${frame} in ${sheetKey}`);
    }

    return texture;
  }

  // Create a sprite from a frame
  createSprite(sheet: string, frame: string): Sprite {
    return new Sprite(this.getTexture(sheet, frame));
  }

  // Create an animated sprite from an animation
  createAnimatedSprite(sheet: string, animation: string): AnimatedSprite {
    const sheetKey = sheet.replace(/\.json$/, '');
    const data = Assets.get<Spritesheet>(sheetKey);

    if (!data) {
      throw new Error(`Sheet not loaded: ${sheetKey}`);
    }

    const frames = data.animations?.[animation];
    if (!frames) {
      throw new Error(`Animation not found: ${animation} in ${sheetKey}`);
    }

    return new AnimatedSprite(frames);
  }

  // Get all frame names in a sheet
  getFrameNames(sheet: string): string[] {
    const sheetKey = sheet.replace(/\.json$/, '');
    const data = Assets.get<Spritesheet>(sheetKey);

    if (!data?.textures) return [];
    return Object.keys(data.textures);
  }

  // Get all animation names in a sheet
  getAnimationNames(sheet: string): string[] {
    const sheetKey = sheet.replace(/\.json$/, '');
    const data = Assets.get<Spritesheet>(sheetKey);

    if (!data?.animations) return [];
    return Object.keys(data.animations);
  }

  // Check if a sheet is loaded
  hasSheet(sheet: string): boolean {
    const sheetKey = sheet.replace(/\.json$/, '');
    return Assets.get(sheetKey) !== undefined;
  }
}
