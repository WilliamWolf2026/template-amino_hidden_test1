import { createContext, useContext, onMount, type ParentProps } from 'solid-js';
import type { AnalyticsState } from './types';
import { createAnalyticsState } from './state';
import { getRegisteredIdentity } from './registry';

const AnalyticsContext = createContext<AnalyticsState>();

export function AnalyticsProvider(props: ParentProps) {
  const { state, initialize } = createAnalyticsState();

  onMount(() => {
    initialize(getRegisteredIdentity());
  });

  return (
    <AnalyticsContext.Provider value={state}>
      {props.children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsState {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}
