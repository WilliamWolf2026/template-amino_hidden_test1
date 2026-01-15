import { createContext, useContext, type ParentProps, Show } from 'solid-js';
import { createScreenManager, type ScreenManager, type ScreenManagerOptions } from './manager';
import type { ScreenId } from './types';
import { ScreenBoundary } from '../errors/boundary';
import { errorReporter } from '../errors/reporter';

const ScreenContext = createContext<ScreenManager>();

interface ScreenProviderProps extends ParentProps {
  options?: ScreenManagerOptions;
}

export function ScreenProvider(props: ScreenProviderProps) {
  const manager = createScreenManager({
    ...props.options,
    onScreenChange: (from, to) => {
      errorReporter.setScreen(to);
      props.options?.onScreenChange?.(from, to);
    },
  });

  return (
    <ScreenContext.Provider value={manager}>
      {props.children}
    </ScreenContext.Provider>
  );
}

export function useScreen() {
  const context = useContext(ScreenContext);
  if (!context) {
    throw new Error('useScreen must be used within ScreenProvider');
  }
  return context;
}

// Component that renders based on current screen
interface ScreenRendererProps {
  screens: Record<ScreenId, () => JSX.Element>;
}

export function ScreenRenderer(props: ScreenRendererProps) {
  const { current, transition, getTransitionClass, transitionConfig, goto } = useScreen();

  const handleNavigateToStart = () => {
    goto('start');
  };

  return (
    <div
      class={`transition-all ${getTransitionClass()}`}
      style={{ 'transition-duration': `${transitionConfig.duration}ms` }}
    >
      <ScreenBoundary onNavigate={handleNavigateToStart}>
        <Show when={current() === 'loading'}>{props.screens.loading}</Show>
        <Show when={current() === 'start'}>{props.screens.start}</Show>
        <Show when={current() === 'game'}>{props.screens.game}</Show>
        <Show when={current() === 'results'}>{props.screens.results}</Show>
      </ScreenBoundary>
    </div>
  );
}
