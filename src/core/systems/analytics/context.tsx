import { createContext, useContext, onMount, onCleanup, type ParentProps } from 'solid-js';
import type { AnalyticsCore } from '@wolfgames/components/core';
import { getAnalyticsCore } from './service';

/**
 * Props for the AnalyticsProvider.
 * The core is created via getAnalyticsCore() from service.ts,
 * ensuring the same instance is available imperatively.
 */
export interface AnalyticsProviderProps extends ParentProps {}

const AnalyticsContext = createContext<AnalyticsCore>();

export function AnalyticsProvider(props: AnalyticsProviderProps) {
  const core = getAnalyticsCore();

  onMount(() => {
    core.init();
  });

  onCleanup(() => {
    core.dispose();
  });

  return (
    <AnalyticsContext.Provider value={core}>
      {props.children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const core = useContext(AnalyticsContext);
  if (!core) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return core;
}
