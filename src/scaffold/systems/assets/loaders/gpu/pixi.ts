import { Assets, Texture, Sprite, AnimatedSprite, Rectangle, Cache, type Spritesheet } from 'pixi.js';
import type { Manifest, AssetLoader } from '../../types';

export class PixiLoader implements AssetLoader {
  private manifest!: Manifest;
  private loadedBundles = new Set<string>();
  private initialized = false;
  private usingFallback = false;

  init(manifest: Manifest): void {
    this.manifest = manifest;
    this.registerBundles(manifest.cdnBase);
    this.initialized = true;
  }

  private registerBundles(baseUrl: string): void {
    // Register all bundles with Pixi's native Assets system
    for (const bundle of this.manifest.bundles) {
      const assets: Record<string, string> = {};

      for (const path of bundle.assets) {
        if (path.includes('audio/')) continue; // Skip audio
        // Use just the filename (without directory and extension) as the key
        // e.g., 'atlases/atlas-tiles-citylines.json' -> 'atlas-tiles-citylines'
        const filename = path.split('/').pop() || path;
        const key = filename.replace(/\.json$/, '');
        assets[key] = `${baseUrl}/${path}`;
      }

      if (Object.keys(assets).length > 0) {
        Assets.addBundle(bundle.name, assets);
      }
    }
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

    // For VFX bundles, suppress cache duplicate warnings (harmless - VFX use internal texture maps)
    // Multiple VFX spritesheets may have same frame names (frame_0000, etc.) which causes
    // Pixi to warn about cache collisions, but the VFX still work correctly.
    const isVfxBundle = name.startsWith('vfx-');
    const originalWarn = console.warn;
    if (isVfxBundle) {
      console.warn = (...args: unknown[]) => {
        // Join all args to check full message (Pixi may pass multiple args)
        const msg = args.map((a) => String(a)).join(' ');
        if (!msg.includes('already has key:')) {
          originalWarn.apply(console, args);
        }
      };
    }

    try {
      // Pixi handles everything: fetch, parse, texture creation, caching
      await Assets.loadBundle(name);
      this.loadedBundles.add(name);
    } catch (error) {
      // If CDN fails and we have a local fallback, try that
      if (!this.usingFallback && this.manifest.localBase) {
        console.warn(`[Assets] CDN failed for ${name}, falling back to local`);
        this.usingFallback = true;
        // Re-register bundles with local URLs
        this.registerBundles(this.manifest.localBase);
        // Retry the load
        await Assets.loadBundle(name);
        this.loadedBundles.add(name);
      } else {
        throw error;
      }
    } finally {
      if (isVfxBundle) {
        console.warn = originalWarn;
      }
    }
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
