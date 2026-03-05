import type { Manifest, AssetLoader, ProgressCallback } from './types';
import { getBundleTarget } from './types';
import { DomLoader } from './loaders/dom';
import { AudioLoader } from './loaders/audio';
import { createGpuLoader, type EngineType } from './loaders/gpu';

export interface CoordinatorConfig {
  engine: EngineType;
}

export class AssetCoordinator {
  private manifest!: Manifest;
  private config!: CoordinatorConfig;

  // Loaders
  readonly dom = new DomLoader();
  readonly audio = new AudioLoader();
  private gpuLoader: AssetLoader | null = null;
  private gpuLoaderPromise: Promise<AssetLoader> | null = null;

  // Queue for gpu bundles requested before engine ready
  private gpuQueue: string[] = [];

  init(manifest: Manifest, config: CoordinatorConfig): void {
    this.manifest = manifest;
    this.config = config;

    this.dom.init(manifest);
    this.audio.init(manifest);
  }

  // Initialize GPU loader (call when engine is ready)
  async initGpu(): Promise<void> {
    if (this.gpuLoader) return;

    if (this.gpuLoaderPromise) {
      await this.gpuLoaderPromise;
      return;
    }

    this.gpuLoaderPromise = createGpuLoader(this.config.engine);
    this.gpuLoader = await this.gpuLoaderPromise;
    this.gpuLoader.init(this.manifest);

    // Flush queued bundles
    if (this.gpuQueue.length > 0) {
      await Promise.all(this.gpuQueue.map((name) => this.gpuLoader!.loadBundle(name)));
      this.gpuQueue = [];
    }
  }

  isGpuReady(): boolean {
    return this.gpuLoader !== null;
  }

  getGpuLoader(): AssetLoader | null {
    return this.gpuLoader;
  }

  // Load a bundle, routing to correct loader based on target
  async loadBundle(name: string, onProgress?: ProgressCallback): Promise<void> {
    const bundle = this.manifest.bundles.find((b) => b.name === name);
    if (!bundle) throw new Error(`Unknown bundle: ${name}`);

    const target = getBundleTarget(bundle);

    switch (target) {
      case 'dom':
        await this.dom.loadBundle(name, onProgress);
        break;

      case 'gpu':
        if (this.gpuLoader) {
          await this.gpuLoader.loadBundle(name, onProgress);
        } else {
          // Queue for later
          if (!this.gpuQueue.includes(name)) {
            this.gpuQueue.push(name);
          }
        }
        break;

      case 'agnostic':
        // Load with dom loader for raw access, audio handled separately
        if (name.startsWith('audio-') || bundle.assets.some((p) => p.includes('audio/'))) {
          await this.audio.loadBundle(name, onProgress);
        } else {
          await this.dom.loadBundle(name, onProgress);
        }
        break;
    }
  }

  // Load all bundles matching a prefix
  async loadBundles(prefix: string, onProgress?: ProgressCallback): Promise<void> {
    const bundles = this.manifest.bundles.filter((b) => b.name.startsWith(prefix));
    if (bundles.length === 0) {
      onProgress?.(1);
      return;
    }

    if (bundles.length === 1) {
      await this.loadBundle(bundles[0].name, onProgress);
      return;
    }

    // Multi-bundle: combine per-bundle progress
    const perBundle = new Array(bundles.length).fill(0);
    await Promise.all(
      bundles.map((b, i) =>
        this.loadBundle(b.name, (p) => {
          perBundle[i] = p;
          onProgress?.(perBundle.reduce((a, v) => a + v, 0) / bundles.length);
        })
      )
    );
  }

  // Convenience methods for common loading phases
  async loadBoot(onProgress?: ProgressCallback): Promise<void> {
    await this.loadBundles('boot-', onProgress);
  }

  async loadCore(onProgress?: ProgressCallback): Promise<void> {
    await this.loadBundles('core-', onProgress);
  }

  async loadTheme(onProgress?: ProgressCallback): Promise<void> {
    await this.loadBundles('theme-', onProgress);
  }

  async loadAudio(onProgress?: ProgressCallback): Promise<void> {
    await this.loadBundles('audio-', onProgress);
  }

  async loadScene(name: string, onProgress?: ProgressCallback): Promise<void> {
    await this.loadBundle(`scene-${name}`, onProgress);
  }

  // Check if bundle is loaded
  isLoaded(name: string): boolean {
    const bundle = this.manifest.bundles.find((b) => b.name === name);
    if (!bundle) return false;

    const target = getBundleTarget(bundle);

    switch (target) {
      case 'dom':
        return this.dom.isLoaded(name);
      case 'gpu':
        return this.gpuLoader?.isLoaded(name) ?? false;
      case 'agnostic':
        if (name.startsWith('audio-') || bundle.assets.some((p) => p.includes('audio/'))) {
          return bundle.assets
            .filter((p) => p.endsWith('.json'))
            .every((p) => this.audio.hasChannel(p.replace(/\.json$/, '')));
        }
        return this.dom.isLoaded(name);
    }
  }

  // Background loading for deferred bundles
  async startBackgroundLoading(): Promise<void> {
    const deferredBundles = this.manifest.bundles
      .filter((b) => b.name.startsWith('defer-') || b.name.startsWith('fx-'))
      .map((b) => b.name);

    for (const name of deferredBundles) {
      if (!this.isLoaded(name)) {
        // Yield to main thread between bundles
        await new Promise((resolve) => {
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => resolve(undefined), { timeout: 2000 });
          } else {
            setTimeout(resolve, 50);
          }
        });
        await this.loadBundle(name);
      }
    }
  }
}
