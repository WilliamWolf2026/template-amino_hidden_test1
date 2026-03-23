import {
  createContext,
  createSignal,
  useContext,
  onMount,
  createEffect,
  onCleanup,
  Show,
  type ParentProps,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import type { AnalyticsClient } from '~/core/systems/analytics/types';
import { useAnalytics } from '../analytics/context';
import type { FeatureFlagState } from './types';
import { getRegisteredFlagConfig } from './registry';
import { loadFlagCache, saveFlagCache, validateFlags } from './cache';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FeatureFlagContext = createContext<FeatureFlagState<any>>();

export function FeatureFlagProvider(props: ParentProps) {
  const config = getRegisteredFlagConfig();

  if (!config) {
    throw new Error(
      'FeatureFlagProvider: no config registered. Call registerFlagConfig() before mounting.',
    );
  }

  const { defaults, validators, storagePrefix, userId, timeoutMs = 2000 } = config;
  const cached = loadFlagCache(storagePrefix, userId, defaults, validators);
  const analytics = useAnalytics();
  const defs = defaults as Record<string, unknown>;

  const [state, setState] = createStore<FeatureFlagState<typeof defaults>>({
    flags: cached ?? defaults,
    isReady: !!cached,
  });

  let isSettled = false;

  // Bridge game-components Signal → Solid signal for reactivity
  const [client, setClient] = createSignal<AnalyticsClient | null>(null);
  const unsubClient = analytics.client.subscribe((c) => setClient(() => c));
  onCleanup(() => unsubClient());

  const processFlags = (ph: AnalyticsClient, source: string) => {
    const raw: Record<string, unknown> = {};

    for (const key of Object.keys(defaults)) {
      if (typeof defs[key] === 'boolean') {
        raw[key] = ph.isFeatureEnabled(key);
      } else {
        raw[key] = ph.getFeatureFlag(key);
      }
    }

    const nextFlags = validateFlags(raw, defaults, validators);

    setState('flags', nextFlags);
    setState('isReady', true);
    saveFlagCache(storagePrefix, userId, nextFlags);

    // Register flag values as super properties
    const superProps: Record<string, unknown> = {};
    for (const key of Object.keys(nextFlags as object)) {
      superProps[key] = (nextFlags as Record<string, unknown>)[key];
    }
    ph.register(superProps);

    console.debug(`[FeatureFlags] Resolved via ${source}`, nextFlags);
    isSettled = true;
  };

  // Watch for analytics client initialization
  createEffect(() => {
    const ph = client();

    if (ph) {
      const stopListening = ph.onFeatureFlags(() => processFlags(ph, 'posthog_update'));

      // Immediate check in case flags are already loaded
      const firstKey = Object.keys(defaults)[0];
      if (firstKey && ph.getFeatureFlag(firstKey) !== undefined) {
        processFlags(ph, 'immediate_check');
      }

      onCleanup(() => {
        if (typeof stopListening === 'function') stopListening();
      });
    }
  });

  // Timeout fallback — unblock UI even if PostHog never loads
  onMount(() => {
    const timeoutId = window.setTimeout(() => {
      if (!isSettled) {
        console.warn('[FeatureFlags] Timeout exceeded. Unblocking UI with current data.');
        setState('isReady', true);
        isSettled = true;
      }
    }, timeoutMs);

    onCleanup(() => clearTimeout(timeoutId));
  });

  return (
    <FeatureFlagContext.Provider value={state}>
      <Show when={state.isReady}>
        {props.children}
      </Show>
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags<T extends object = Record<string, unknown>>(): FeatureFlagState<T> {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context as FeatureFlagState<T>;
}
