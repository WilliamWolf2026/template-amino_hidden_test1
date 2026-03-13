import { createContext, useContext, createSignal, onMount, onCleanup } from 'solid-js';
import type { Accessor, ParentProps } from 'solid-js';
import type { LoadingState } from '@wolfgames/components/core';
import type { ProgressCallback } from './types';
import { createCoordinatorFacade } from './facade';
import type { AssetCoordinatorFacade } from './facade';
import { useManifest } from '~/core/systems/manifest/context';

interface AssetContextValue {
  coordinator: AssetCoordinatorFacade;
  loadingState: Accessor<LoadingState>;
  ready: () => boolean;
  gpuReady: () => boolean;
  loading: () => boolean;
  loadBundle: (name: string, onProgress?: ProgressCallback) => Promise<void>;
  backgroundLoadBundle: (name: string) => Promise<void>;
  preloadScene: (name: string) => Promise<void>;
  loadBoot: (onProgress?: ProgressCallback) => Promise<void>;
  loadCore: (onProgress?: ProgressCallback) => Promise<void>;
  loadTheme: (onProgress?: ProgressCallback) => Promise<void>;
  loadAudio: (onProgress?: ProgressCallback) => Promise<void>;
  loadScene: (name: string, onProgress?: ProgressCallback) => Promise<void>;
  initGpu: () => Promise<void>;
  unlockAudio: () => void;
  unloadBundle: (name: string) => void;
  unloadBundles: (names: string[]) => void;
  unloadScene: (sceneName: string) => void;
}

const AssetContext = createContext<AssetContextValue>();

interface AssetProviderProps extends ParentProps {
  config: { engine: string };
}

export function AssetProvider(props: AssetProviderProps) {
  const { manifest } = useManifest();
  const coordinator = createCoordinatorFacade(manifest());

  const cdnBase = manifest().cdnBase;
  const isRemote = cdnBase.startsWith('http');
  console.log(`[Assets] ${isRemote ? 'CDN' : 'Local'}: ${cdnBase}`);

  const [solidLoadingState, setSolidLoadingState] = createSignal<LoadingState>(
    coordinator.loadingStateSignal.get(),
  );
  const unsubLoadingState = coordinator.loadingStateSignal.subscribe(setSolidLoadingState);

  const [ready, setReady] = createSignal(false);
  const [gpuReady, setGpuReady] = createSignal(false);
  const [loading, setLoading] = createSignal(false);

  const wrapLoad = async (fn: () => Promise<void>) => {
    setLoading(true);
    try { await fn(); }
    finally { setLoading(false); }
  };

  const value: AssetContextValue = {
    coordinator,
    loadingState: solidLoadingState,
    ready,
    gpuReady,
    loading,

    async loadBundle(name: string, onProgress?: ProgressCallback) {
      await wrapLoad(() => coordinator.loadBundle(name, onProgress));
    },
    backgroundLoadBundle(name: string) {
      return coordinator.backgroundLoadBundle(name);
    },
    preloadScene(name: string) {
      return coordinator.preloadScene(name);
    },
    async loadBoot(onProgress?: ProgressCallback) {
      await wrapLoad(async () => {
        await coordinator.loadBoot(onProgress);
        setReady(true);
      });
    },
    async loadCore(onProgress?: ProgressCallback) {
      await wrapLoad(() => coordinator.loadCore(onProgress));
    },
    async loadTheme(onProgress?: ProgressCallback) {
      await wrapLoad(() => coordinator.loadTheme(onProgress));
    },
    async loadAudio(onProgress?: ProgressCallback) {
      await wrapLoad(() => coordinator.loadAudio(onProgress));
    },
    async loadScene(name: string, onProgress?: ProgressCallback) {
      await wrapLoad(() => coordinator.loadScene(name, onProgress));
    },
    async initGpu() {
      await coordinator.initGpu();
      setGpuReady(true);
    },
    unlockAudio() {
      void coordinator.audio.unlock();
    },
    unloadBundle(name: string) {
      coordinator.unloadBundle(name);
    },
    unloadBundles(names: string[]) {
      coordinator.unloadBundles(names);
    },
    unloadScene(sceneName: string) {
      coordinator.unloadScene(sceneName);
    },
  };

  onMount(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      (window as unknown as Record<string, unknown>).__scaffold__ = { coordinator };
    }
  });
  onCleanup(() => {
    unsubLoadingState();
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      delete (window as unknown as Record<string, unknown>).__scaffold__;
    }
  });

  return (
    <AssetContext.Provider value={value}>
      {props.children}
    </AssetContext.Provider>
  );
}

export function useAssets() {
  const context = useContext(AssetContext);
  if (!context) {
    throw new Error('useAssets must be used within AssetProvider');
  }
  return context;
}

export function useAssetCoordinator() {
  return useAssets().coordinator;
}

export function useLoadingState() {
  return useAssets().loadingState;
}

export type { AssetCoordinatorFacade } from './facade';
