import {
  createContext,
  useContext,
  createSignal,
  type ParentComponent,
  onMount,
  onCleanup,
  type Accessor,
} from 'solid-js';
import type { Manifest } from '~/core/systems/assets';

/** Provider mode: standalone (default) or injected (embed/parent context) */
export type ManifestMode = 'standalone' | 'injected';

interface ManifestContextValue {
  /** Asset manifest for bundle loading (consumed by AssetProvider) */
  manifest: Accessor<Manifest>;
  /** Game data from backend (chapters, levels, stories, etc.) */
  gameData: Accessor<unknown>;
  /** Current mode: standalone or injected */
  mode: Accessor<ManifestMode>;
  /** Inject data from parent context (overrides other sources) */
  injectData: (data: unknown) => void;
  /** Accessor for current game data */
  getGameData: () => unknown;
}

export interface ManifestProviderProps {
  /** Default asset manifest */
  manifest: Manifest;
  /** Default game data (chapters, levels, stories) */
  defaultGameData: unknown;
  /** Server storage URL for CDN fetch (null to skip) */
  serverStorageUrl: string | null;
}

const ManifestContext = createContext<ManifestContextValue>();

export const ManifestProvider: ParentComponent<ManifestProviderProps> = (props) => {
  const params = new URLSearchParams(window.location.search);
  const isEmbed = params.get('mode') === 'embed';

  // -- Signals --
  const [manifest, setManifest] = createSignal<Manifest>(props.manifest);
  const [gameData, setGameData] = createSignal<unknown>(props.defaultGameData);
  const [mode, setMode] = createSignal<ManifestMode>(
    isEmbed ? 'injected' : 'standalone'
  );

  // -- Injection subscriber --
  const injectData = (data: unknown) => {
    setGameData(data);
    setMode('injected');
    console.log('[Manifest] Data injected from parent context');
  };

  // -- Data source resolution --
  onMount(async () => {
    // Source 1: Injection via postMessage (highest priority)
    const ac = new AbortController();
    window.addEventListener(
      'message',
      (e) => {
        if (
          e.data &&
          typeof e.data === 'object' &&
          'type' in e.data &&
          'value' in e.data &&
          e.data.type === 'set_manifest'
        ) {
          try {
            const parsed = typeof e.data.value === 'string'
              ? JSON.parse(e.data.value)
              : e.data.value;

            // If it looks like an asset manifest, update manifest signal
            if (parsed && parsed.bundles && parsed.cdnBase) {
              setManifest(parsed);
            }

            // Always update game data (injection overrides everything)
            injectData(parsed);
          } catch (error) {
            console.error('[Manifest] Failed to parse postMessage data:', error);
          }
        }
      },
      { signal: ac.signal }
    );

    onCleanup(() => ac.abort());

    // Source 2: CDN fetch (if not in embed mode waiting for injection)
    if (!isEmbed && props.serverStorageUrl) {
      try {
        const response = await fetch(`${props.serverStorageUrl}/chapters/default.json`);
        if (response.ok) {
          const data = await response.json();

          // If CDN returns an asset manifest shape, update it
          if (data && data.bundles && data.cdnBase) {
            setManifest(data);
          }

          // If CDN returns game data, set it (only if not already injected)
          if (mode() !== 'injected') {
            setGameData(data);
            console.log('[Manifest] Game data loaded from CDN');
          }
        } else {
          console.warn('[Manifest] CDN fetch failed, using local defaults');
        }
      } catch (error) {
        console.warn('[Manifest] CDN fetch error, using local defaults:', error);
      }
    }

    // Source 3: Local defaults are already set via signal initializers
    // manifestDefault is the local asset manifest
    // defaultGameData is the local game data (chapters, levels, stories)
  });

  const value: ManifestContextValue = {
    manifest,
    gameData,
    mode,
    injectData,
    getGameData: () => gameData(),
  };

  return (
    <ManifestContext.Provider value={value}>
      {props.children}
    </ManifestContext.Provider>
  );
};

export function useManifest() {
  const context = useContext(ManifestContext);
  if (!context) {
    throw new Error('useManifest must be used within ManifestProvider');
  }
  return context;
}
