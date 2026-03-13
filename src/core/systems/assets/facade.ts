/**
 * Facade over GC asset coordinator that provides scaffold convenience methods.
 *
 * Pure TS (no JSX) — keeps all coordinator logic, loaders, and DOM/audio
 * adapters out of the .tsx provider file.
 */

import {
  createAssetCoordinator,
  createDomLoader,
  validateManifest,
  type Manifest,
  type LoadingState,
  type Signal,
  type DomLoader,
} from '@wolfgames/components/core';
import { createHowlerLoader } from '@wolfgames/components/howler';
import { createPixiLoader, type PixiLoader } from '@wolfgames/components/pixi';
import type { Howl } from 'howler';
import type { ProgressCallback } from './types';

async function getFrameURLFromSheet(
  domLoader: DomLoader,
  sheetAlias: string,
  frameName: string
): Promise<string> {
  const sheet = domLoader.getSpritesheet(sheetAlias);
  if (!sheet) throw new Error(`Sheet not loaded: ${sheetAlias}`);

  const frameData = sheet.frames[frameName];
  if (!frameData) throw new Error(`Frame not found: ${frameName}`);

  const { x, y, w, h } = frameData.frame;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(sheet.image, x, y, w, h, 0, 0, w, h);

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/png');
  });
  return URL.createObjectURL(blob);
}

export interface AssetCoordinatorFacade {
  loadBundle(name: string, onProgress?: ProgressCallback): Promise<void>;
  backgroundLoadBundle(name: string): Promise<void>;
  preloadScene(sceneName: string): Promise<void>;
  loadBoot(onProgress?: ProgressCallback): Promise<void>;
  loadCore(onProgress?: ProgressCallback): Promise<void>;
  loadTheme(onProgress?: ProgressCallback): Promise<void>;
  loadAudio(onProgress?: ProgressCallback): Promise<void>;
  loadScene(sceneName: string, onProgress?: ProgressCallback): Promise<void>;
  initGpu(): Promise<void>;
  getLoadedBundles(): string[];
  isLoaded(name: string): boolean;
  unloadBundle(name: string): void;
  unloadBundles(names: string[]): void;
  unloadScene(sceneName: string): void;
  startBackgroundLoading(): Promise<void>;
  loadingState: () => LoadingState;
  loadingStateSignal: Signal<LoadingState>;
  dom: {
    getFrameURL(sheetAlias: string, frameName: string): Promise<string>;
    get(alias: string): unknown;
    getImage(alias: string): HTMLImageElement | null;
    getSheet(alias: string): {
      image: HTMLImageElement;
      json: { frames: Record<string, unknown> };
    } | null;
  };
  audio: {
    play(channel: string, sprite?: string, opts?: { volume?: number }): number;
    setMasterVolume(volume: number): void;
    unlock(): Promise<void>;
  };
  getGpuLoader(): PixiLoader | null;
}

export function createCoordinatorFacade(manifest: Manifest): AssetCoordinatorFacade {
  const validation = validateManifest(manifest);
  if (!validation.valid) {
    const summary = validation.errors
      .map((e: { path: string; message: string }) => `  ${e.path}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid manifest:\n${summary}`);
  }

  const domLoader = createDomLoader();
  const howlerLoader = createHowlerLoader();

  const coordinator = createAssetCoordinator({
    manifest,
    loaders: {
      dom: domLoader,
      audio: howlerLoader,
    },
  });

  let pixiLoader: PixiLoader | null = null;
  let gpuInitPromise: Promise<void> | null = null;

  const bundlesByPrefix = (prefix: string): string[] =>
    manifest.bundles.filter((b) => b.name.startsWith(prefix)).map((b) => b.name);

  const isLoaded = (name: string): boolean => coordinator.isLoaded(name);

  /** Filter out already-loaded bundles before passing to coordinator. */
  const pendingOnly = (names: string[]): string[] =>
    names.filter((n) => !isLoaded(n));

  const loadWithProgress = async (
    names: string[],
    onProgress?: ProgressCallback
  ): Promise<void> => {
    const toLoad = pendingOnly(names);
    if (toLoad.length === 0) { onProgress?.(1); return; }
    onProgress?.(0);
    await coordinator.loadBundles(toLoad);
    onProgress?.(1);
  };

  const loadBundle = async (name: string, onProgress?: ProgressCallback): Promise<void> => {
    if (isLoaded(name)) { onProgress?.(1); return; }
    onProgress?.(0);
    await coordinator.loadBundle(name);
    onProgress?.(1);
  };

  const backgroundLoadBundle = async (name: string): Promise<void> => {
    if (isLoaded(name)) return;
    await coordinator.loadBundle(name, { background: true });
  };

  const preloadScene = async (sceneName: string): Promise<void> => {
    const names = bundlesByPrefix('scene-').filter((n) => n.includes(sceneName));
    const targets = names.length > 0 ? names : [`scene-${sceneName}`];
    await Promise.all(pendingOnly(targets).map(backgroundLoadBundle));
  };

  const loadBoot = (onProgress?: ProgressCallback) =>
    loadWithProgress(bundlesByPrefix('boot-'), onProgress);

  const loadCore = (onProgress?: ProgressCallback) =>
    loadWithProgress(bundlesByPrefix('core-'), onProgress);

  const loadTheme = (onProgress?: ProgressCallback) =>
    loadWithProgress(bundlesByPrefix('theme-'), onProgress);

  const loadAudio = (onProgress?: ProgressCallback) =>
    loadWithProgress(bundlesByPrefix('audio-'), onProgress);

  const loadScene = async (sceneName: string, onProgress?: ProgressCallback): Promise<void> => {
    const names = bundlesByPrefix('scene-').filter((n) => n.includes(sceneName));
    if (names.length === 0) {
      await loadBundle(`scene-${sceneName}`, onProgress);
      return;
    }
    await loadWithProgress(names, onProgress);
  };

  const initGpu = async (): Promise<void> => {
    if (pixiLoader) return;
    if (gpuInitPromise) { await gpuInitPromise; return; }
    gpuInitPromise = (async () => {
      const loader = createPixiLoader();
      coordinator.initLoader('gpu', loader);
      pixiLoader = loader;
    })();
    await gpuInitPromise;
  };

  const getLoadedBundles = (): string[] => coordinator.loadingState.get().loaded;

  const unloadBundle = (name: string): void => coordinator.unloadBundle(name);
  const unloadBundles = (names: string[]): void => coordinator.unloadBundles(names);
  const unloadScene = (sceneName: string): void => {
    const names = bundlesByPrefix('scene-').filter((n) => n.includes(sceneName));
    if (names.length === 0) {
      coordinator.unloadBundle(`scene-${sceneName}`);
      return;
    }
    coordinator.unloadBundles(names);
  };

  const startBackgroundLoading = async (): Promise<void> => {
    const deferred = manifest.bundles
      .filter((b) => (b.name.startsWith('defer-') || b.name.startsWith('fx-')) && !isLoaded(b.name))
      .map((b) => b.name);
    for (const name of deferred) {
      await loadBundle(name);
    }
  };

  return {
    loadBundle,
    backgroundLoadBundle,
    preloadScene,
    loadBoot,
    loadCore,
    loadTheme,
    loadAudio,
    loadScene,
    initGpu,
    getLoadedBundles,
    isLoaded,
    unloadBundle,
    unloadBundles,
    unloadScene,
    startBackgroundLoading,
    loadingState: coordinator.loadingState.get,
    loadingStateSignal: coordinator.loadingState,
    dom: {
      async getFrameURL(sheetAlias: string, frameName: string): Promise<string> {
        return getFrameURLFromSheet(domLoader, sheetAlias, frameName);
      },
      get(alias: string): unknown {
        return domLoader.get(alias);
      },
      getImage(alias: string): HTMLImageElement | null {
        return domLoader.getImage(alias);
      },
      getSheet(alias: string) {
        const sheet = domLoader.getSpritesheet(alias);
        if (!sheet) return null;
        return {
          image: sheet.image,
          json: { frames: sheet.frames as Record<string, unknown> },
        };
      },
    },
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
