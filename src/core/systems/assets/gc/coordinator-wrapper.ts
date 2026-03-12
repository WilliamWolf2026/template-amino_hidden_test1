/**
 * Wraps @wolfgames/components asset coordinator and loaders to match scaffold's
 * AssetCoordinator API (loadBoot, loadTheme, dom.getFrameURL, audio.play, etc.).
 */

import {
  createAssetCoordinator,
  createDomLoader,
  validateManifest,
  type DomLoader as GcDomLoader,
  type HowlerLoader as GcHowlerLoader,
  type PixiLoader as GcPixiLoader,
} from '@wolfgames/components/core';
import type { LoadingState } from '@wolfgames/components/core';
import { createHowlerLoader } from '@wolfgames/components/howler';
import { createPixiLoader } from '@wolfgames/components/pixi';
import type { Howl } from 'howler';
import { scaffoldManifestToGc } from './manifest-adapter';
import { createDomAdapter } from './dom-adapter';
import type { Manifest as ScaffoldManifest } from '../types';
import type { CoordinatorConfig } from '../coordinator';
import type { ProgressCallback } from '../types';

export interface ScaffoldCoordinatorFromGc {
  loadBundle(name: string, onProgress?: ProgressCallback): Promise<void>;
  loadBoot(onProgress?: ProgressCallback): Promise<void>;
  loadCore(onProgress?: ProgressCallback): Promise<void>;
  loadTheme(onProgress?: ProgressCallback): Promise<void>;
  loadAudio(onProgress?: ProgressCallback): Promise<void>;
  loadScene(sceneName: string, onProgress?: ProgressCallback): Promise<void>;
  initGpu(): Promise<void>;
  getLoadedBundles(): string[];
  isLoaded(name: string): boolean;
  startBackgroundLoading(): Promise<void>;

  /** Loading state from GC (for useLoadingState / progress UI) */
  loadingState: () => LoadingState;

  /** DOM loader adapter (getFrameURL, get, getImage, getSheet) */
  dom: ReturnType<typeof createDomAdapter>;

  /** Audio loader (play, setVolume, mute, unlock) — setMasterVolume aliases to setVolume */
  audio: {
    play(channel: string, sprite?: string, opts?: { volume?: number }): number;
    setMasterVolume(volume: number): void;
    unlock(): Promise<void>;
  };

  /** Pixi loader (after initGpu) */
  getGpuLoader(): GcPixiLoader | null;
}

export function createScaffoldCoordinatorFromGc(
  scaffoldManifest: ScaffoldManifest,
  config: CoordinatorConfig
): ScaffoldCoordinatorFromGc {
  const { gcManifest, scaffoldToGc, gcToScaffold } = scaffoldManifestToGc(scaffoldManifest);

  // Validate the adapted manifest before handing to GC coordinator.
  // createAssetCoordinator also validates internally, but checking here
  // lets us surface errors referencing scaffold bundle names.
  const validation = validateManifest(gcManifest);
  if (!validation.valid) {
    const summary = validation.errors
      .map((e: { path: string; message: string }) => {
        const scaffoldCtx = e.path.match(/bundles\[(\d+)\]/);
        const hint = scaffoldCtx
          ? ` (scaffold: "${gcManifest.bundles[Number(scaffoldCtx[1])]?.name}")`
          : '';
        return `  ${e.path}${hint}: ${e.message}`;
      })
      .join('\n');
    throw new Error(`Invalid manifest after adaptation:\n${summary}`);
  }

  const coordinator = createAssetCoordinator({
    manifest: gcManifest,
    loaders: {
      dom: createDomLoader(),
      audio: createHowlerLoader(),
    },
  });

  let pixiLoader: GcPixiLoader | null = null;
  let gpuInitPromise: Promise<void> | null = null;

  const gcNamesByPrefix = (prefix: string): string[] =>
    gcManifest.bundles.filter((b) => b.name.startsWith(prefix)).map((b) => b.name);

  const scaffoldNamesByPrefix = (prefix: string): string[] =>
    scaffoldManifest.bundles.filter((b) => b.name.startsWith(prefix)).map((b) => b.name);

  const suppressPixiCacheWarnings = async <T>(fn: () => Promise<T>): Promise<T> => {
    const origWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      const msg = args.map(String).join(' ');
      if (msg.includes('[Cache] already has key')) return;
      origWarn.apply(console, args);
    };
    try {
      return await fn();
    } finally {
      console.warn = origWarn;
    }
  };

  const loadWithProgress = async (
    gcNames: string[],
    onProgress?: ProgressCallback
  ): Promise<void> => {
    if (gcNames.length === 0) {
      onProgress?.(1);
      return;
    }
    onProgress?.(0);
    await suppressPixiCacheWarnings(() => coordinator.loadBundles(gcNames));
    onProgress?.(1);
  };

  const loadBundle = async (name: string, onProgress?: ProgressCallback): Promise<void> => {
    const gcName = scaffoldToGc.get(name) ?? name;
    onProgress?.(0);
    await suppressPixiCacheWarnings(() => coordinator.loadBundle(gcName));
    onProgress?.(1);
  };

  const loadBoot = async (onProgress?: ProgressCallback): Promise<void> => {
    const gcNames = gcNamesByPrefix('boot-');
    await loadWithProgress(gcNames, onProgress);
  };

  const loadCore = async (onProgress?: ProgressCallback): Promise<void> => {
    const gcNames = gcNamesByPrefix('core-');
    await loadWithProgress(gcNames, onProgress);
  };

  const loadTheme = async (onProgress?: ProgressCallback): Promise<void> => {
    const names = scaffoldNamesByPrefix('theme-');
    const gcNames = names.map((n) => scaffoldToGc.get(n)!).filter(Boolean);
    await loadWithProgress(gcNames, onProgress);
  };

  const loadAudio = async (onProgress?: ProgressCallback): Promise<void> => {
    const gcNames = gcNamesByPrefix('audio-');
    await loadWithProgress(gcNames, onProgress);
  };

  const loadScene = async (sceneName: string, onProgress?: ProgressCallback): Promise<void> => {
    const gcNames = gcNamesByPrefix('scene-').filter((n) => n.includes(sceneName));
    if (gcNames.length === 0) {
      const sceneBundle = `scene-${sceneName}`;
      await loadBundle(sceneBundle, onProgress);
      return;
    }
    await loadWithProgress(gcNames, onProgress);
  };

  const initGpu = async (): Promise<void> => {
    if (pixiLoader) return;
    if (gpuInitPromise) {
      await gpuInitPromise;
      return;
    }
    gpuInitPromise = (async () => {
      if (config.engine !== 'pixi') {
        throw new Error('Only pixi engine is supported with game-components integration');
      }
      const loader = createPixiLoader();
      // Skip manual init — coordinator.initLoader calls loader.init(manifest)
      coordinator.initLoader('gpu', loader);
      pixiLoader = loader;
    })();
    await gpuInitPromise;
  };

  const getLoadedBundles = (): string[] => {
    const loaded = coordinator.loadingState.get().loaded;
    return loaded.map((gcName) => gcToScaffold.get(gcName) ?? gcName);
  };

  const isLoaded = (name: string): boolean => {
    const gcName = scaffoldToGc.get(name) ?? name;
    return coordinator.loadingState.get().loaded.includes(gcName);
  };

  const startBackgroundLoading = async (): Promise<void> => {
    const deferred = scaffoldManifest.bundles
      .filter(
        (b) =>
          (b.name.startsWith('defer-') || b.name.startsWith('fx-')) && !isLoaded(b.name)
      )
      .map((b) => b.name);
    for (const name of deferred) {
      await loadBundle(name);
    }
  };

  const domLoader = coordinator.getLoader<GcDomLoader>('dom')!;
  const howlerLoader = coordinator.getLoader<GcHowlerLoader>('audio')!;

  return {
    loadBundle,
    loadBoot,
    loadCore,
    loadTheme,
    loadAudio,
    loadScene,
    initGpu,
    getLoadedBundles,
    isLoaded,
    startBackgroundLoading,
    loadingState: coordinator.loadingState.get,
    dom: createDomAdapter(domLoader),
    audio: {
      play(channel: string, sprite?: string, opts?: { volume?: number }): number {
        const howl = howlerLoader.get(channel) as Howl | null;
        if (!howl) return -1;
        if (opts?.volume != null) howl.volume(opts.volume);
        return howl.play(sprite);
      },
      setMasterVolume(volume: number): void {
        howlerLoader.setVolume(volume);
      },
      unlock(): Promise<void> {
        return howlerLoader.unlock();
      },
    },
    getGpuLoader: () => pixiLoader,
  };
}
