import { createContext, useContext, createSignal, type ParentProps } from 'solid-js';
import { AssetCoordinator, type CoordinatorConfig } from './coordinator';
import type { Manifest } from './types';

// Context shape
interface AssetContextValue {
  coordinator: AssetCoordinator;
  ready: () => boolean;
  gpuReady: () => boolean;
  loading: () => boolean;
  loadBundle: (name: string) => Promise<void>;
  loadBoot: () => Promise<void>;
  loadCore: () => Promise<void>;
  loadTheme: () => Promise<void>;
  loadAudio: () => Promise<void>;
  loadScene: (name: string) => Promise<void>;
  initGpu: () => Promise<void>;
  unlockAudio: () => void;
}

const AssetContext = createContext<AssetContextValue>();

interface AssetProviderProps extends ParentProps {
  manifest: Manifest;
  config: CoordinatorConfig;
}

export function AssetProvider(props: AssetProviderProps) {
  const coordinator = new AssetCoordinator();
  coordinator.init(props.manifest, props.config);

  // Log asset source
  const cdnBase = props.manifest.cdnBase;
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

    ready,
    gpuReady,
    loading,

    async loadBundle(name: string) {
      await wrapLoad(() => coordinator.loadBundle(name));
    },

    async loadBoot() {
      await wrapLoad(async () => {
        await coordinator.loadBoot();
        setReady(true);
      });
    },

    async loadCore() {
      await wrapLoad(() => coordinator.loadCore());
    },

    async loadTheme() {
      await wrapLoad(() => coordinator.loadTheme());
    },

    async loadAudio() {
      await wrapLoad(() => coordinator.loadAudio());
    },

    async loadScene(name: string) {
      await wrapLoad(() => coordinator.loadScene(name));
    },

    async initGpu() {
      await coordinator.initGpu();
      setGpuReady(true);
    },

    unlockAudio() {
      coordinator.audio.unlock();
    },
  };

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
