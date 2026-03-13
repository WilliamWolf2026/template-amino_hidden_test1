import { createContext, useContext, createSignal, onCleanup } from 'solid-js';
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
  const facade = createCoordinatorFacade(manifest());

  const cdnBase = manifest().cdnBase;
  const isRemote = cdnBase.startsWith('http');
  console.log(`[Assets] ${isRemote ? 'CDN' : 'Local'}: ${cdnBase}`);

  const [solidLoadingState, setSolidLoadingState] = createSignal<LoadingState>(
    facade.loadingStateSignal.get(),
  );
  const unsubLoadingState = facade.loadingStateSignal.subscribe(setSolidLoadingState);

  const [ready, setReady] = createSignal(false);
  const [gpuReady, setGpuReady] = createSignal(false);

  const value: AssetContextValue = {
    coordinator: facade,
    loadingState: solidLoadingState,
    ready,
    gpuReady,

    loadBundle: (name, onProgress?) => facade.loadBundle(name, onProgress),
    backgroundLoadBundle: (name) => facade.backgroundLoadBundle(name),
    preloadScene: (name) => facade.preloadScene(name),

    async loadBoot(onProgress?) {
      await facade.loadBoot(onProgress);
      setReady(true);
    },
    loadCore: (onProgress?) => facade.loadCore(onProgress),
    loadTheme: (onProgress?) => facade.loadTheme(onProgress),
    loadAudio: (onProgress?) => facade.loadAudio(onProgress),
    loadScene: (name, onProgress?) => facade.loadScene(name, onProgress),

    async initGpu() {
      await facade.initGpu();
      setGpuReady(true);
    },
    unlockAudio() {
      void facade.audio.unlock();
    },
    unloadBundle: (name) => facade.unloadBundle(name),
    unloadBundles: (names) => facade.unloadBundles(names),
    unloadScene: (sceneName) => facade.unloadScene(sceneName),
  };

  onCleanup(() => {
    unsubLoadingState();
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
