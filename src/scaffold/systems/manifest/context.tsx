import {
  createContext,
  useContext,
  type ParentComponent,
  createResource,
  Show,
  onMount,
  onCleanup,
  type Accessor,
} from 'solid-js';
import type { Manifest } from '~/scaffold/systems/assets';
import { manifest as manifestDefault } from '~/game';
import { gameConfig } from '~/game/config';

interface ManifestContextValue {
  manifest: Accessor<Manifest>;
}

const ManifestContext = createContext<ManifestContextValue>();

export const ManifestProvider: ParentComponent = (props) => {
  const params = new URLSearchParams(window.location.search);
  const isEmbed = params.get('mode') === 'embed';

  const [manifest, { mutate }] = createResource<Manifest>(async () => {
    // Embed mode: wait for parent to send manifest via postMessage
    if (isEmbed) {
      return undefined as unknown as Manifest;
    }

    // No server URL configured: use static manifest (local development)
    if (!gameConfig.serverStorageUrl) {
      return manifestDefault;
    }

    // Fetch manifest from server
    try {
      const response = await fetch(`${gameConfig.serverStorageUrl}/manifest.json`);
      if (!response.ok) {
        console.warn('[Manifest] Server fetch failed, using default');
        return manifestDefault;
      }
      return response.json();
    } catch (error) {
      console.warn('[Manifest] Server fetch error, using default:', error);
      return manifestDefault;
    }
  });

  onMount(() => {
    const ac = new AbortController();

    // Listen for manifest updates via postMessage (for embed mode)
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
            mutate(parsed);
          } catch (error) {
            console.error('[Manifest] Failed to parse postMessage manifest:', error);
          }
        }
      },
      { signal: ac.signal }
    );

    onCleanup(() => {
      ac.abort();
    });
  });

  return (
    <Show when={manifest()} fallback={<div>Loading manifest...</div>}>
      {(m) => (
        <ManifestContext.Provider value={{ manifest: m }}>
          {props.children}
        </ManifestContext.Provider>
      )}
    </Show>
  );
};

export function useManifest() {
  const context = useContext(ManifestContext);
  if (!context) {
    throw new Error('useManifest must be used within ManifestProvider');
  }
  return context;
}
