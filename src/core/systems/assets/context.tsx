import { createContext, useContext, createSignal, onMount, onCleanup, type ParentProps } from 'solid-js';
import type { CoordinatorConfig } from './coordinator';
import type { ProgressCallback } from './types';
import { useManifest } from '~/core/systems/manifest/context';
import { createScaffoldCoordinatorFromGc, type ScaffoldCoordinatorFromGc } from './gc/coordinator-wrapper';

// Context shape (coordinator is GC-based wrapper from @wolfgames/components)
interface AssetContextValue {
  coordinator: ScaffoldCoordinatorFromGc;
  /** Reactive loading state from GC coordinator (loading/loaded/errors/progress) */
  loadingState: () => ReturnType<ScaffoldCoordinatorFromGc['loadingState']>;
  ready: () => boolean;
  gpuReady: () => boolean;
  loading: () => boolean;
  loadBundle: (name: string, onProgress?: ProgressCallback) => Promise<void>;
  loadBoot: (onProgress?: ProgressCallback) => Promise<void>;
  loadCore: (onProgress?: ProgressCallback) => Promise<void>;
  loadTheme: (onProgress?: ProgressCallback) => Promise<void>;
  loadAudio: (onProgress?: ProgressCallback) => Promise<void>;
  loadScene: (name: string, onProgress?: ProgressCallback) => Promise<void>;
  initGpu: () => Promise<void>;
  unlockAudio: () => void;
}

const AssetContext = createContext<AssetContextValue>();

interface AssetProviderProps extends ParentProps {
  config: CoordinatorConfig;
}

export function AssetProvider(props: AssetProviderProps) {
  const { manifest } = useManifest();
  const coordinator = createScaffoldCoordinatorFromGc(manifest(), props.config);

  // Log asset source
  const cdnBase = manifest().cdnBase;
  const isRemote = cdnBase.startsWith('http');
  console.log(`[Assets] ${isRemote ? 'CDN' : 'Local'}: ${cdnBase}`);

  const [ready, setReady] = createSignal(false);
  const [gpuReady, setGpuReady] = createSignal(false);
  const [loading, setLoading] = createSignal(false);

  const wrapLoad = async (fn: () => Promise<void>) => {
    setLoading(true);
    try {
      await fn();
    } finally {
      setLoading(false);
    }
  };

  const value: AssetContextValue = {
    coordinator,
    loadingState: coordinator.loadingState,

    ready,
    gpuReady,
    loading,

    async loadBundle(name: string, onProgress?: ProgressCallback) {
      await wrapLoad(() => coordinator.loadBundle(name, onProgress));
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
  };

  // Expose coordinator to window in dev so E2E can call getLoadedBundles (real app, no mocks)
  onMount(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      (window as unknown as { __scaffold__?: { coordinator: ScaffoldCoordinatorFromGc } }).__scaffold__ = { coordinator };
    }
  });
  onCleanup(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined' && (window as unknown as { __scaffold__?: unknown }).__scaffold__) {
      delete (window as unknown as { __scaffold__?: unknown }).__scaffold__;
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

// Direct access to coordinator for advanced usage
export function useAssetCoordinator() {
  return useAssets().coordinator;
}

/** Reactive loading state from GC asset coordinator (use within AssetProvider) */
export function useLoadingState() {
  return useAssets().loadingState;
}
