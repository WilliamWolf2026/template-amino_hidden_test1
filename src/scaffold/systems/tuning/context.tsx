import { createContext, useContext, onMount, type ParentProps, type JSX } from 'solid-js';
import type { ScaffoldTuning, GameTuningBase, TuningState } from './types';
import { SCAFFOLD_DEFAULTS } from './types';
import { createTuningState, scaffoldTuningState } from './state';

// Generic context type
type TuningContextValue<S extends ScaffoldTuning, G extends GameTuningBase> = TuningState<S, G>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TuningContext = createContext<TuningContextValue<any, any>>();

export interface TuningProviderProps<S extends ScaffoldTuning, G extends GameTuningBase>
  extends ParentProps {
  scaffoldDefaults?: S;
  gameDefaults: G;
  autoLoad?: boolean;
}

/**
 * Provider component for tuning state
 */
export function TuningProvider<
  S extends ScaffoldTuning = ScaffoldTuning,
  G extends GameTuningBase = GameTuningBase
>(props: TuningProviderProps<S, G>): JSX.Element {
  const state = createTuningState(
    props.scaffoldDefaults ?? (SCAFFOLD_DEFAULTS as S),
    props.gameDefaults
  );

  onMount(() => {
    if (props.autoLoad !== false) {
      state.load();
    }
  });

  return <TuningContext.Provider value={state}>{props.children}</TuningContext.Provider>;
}

/**
 * Hook to access tuning state
 * Must be used within a TuningProvider
 */
export function useTuning<
  S extends ScaffoldTuning = ScaffoldTuning,
  G extends GameTuningBase = GameTuningBase
>(): TuningState<S, G> {
  const context = useContext(TuningContext);
  if (!context) {
    // Return scaffold-only singleton if used outside provider
    return scaffoldTuningState as unknown as TuningState<S, G>;
  }
  return context as TuningState<S, G>;
}

/**
 * Convenience hook for scaffold-only access
 */
export function useScaffoldTuning() {
  const tuning = useTuning();
  return tuning.scaffold;
}
