import { createContext, useContext, type ParentProps, Show, Suspense } from 'solid-js';
import { useAnalytics } from '@wolfgames/components/solid';
import { createScreenManager, type ScreenManager, type ScreenManagerOptions } from './manager';
import type { ScreenId, ScreenAssetConfig } from './types';
import { ScreenBoundary } from '../errors/boundary';
import { errorReporter } from '../errors/reporter';
import { useAssets } from '../assets';

const ScreenContext = createContext<ScreenManager>();

interface ScreenProviderProps extends ParentProps {
  options?: ScreenManagerOptions;
}

export function ScreenProvider(props: ScreenProviderProps) {
  const analytics = useAnalytics();
  const assets = useAssets();

  const getBundlesForScreen = (screen: ScreenId | null): string[] => {
    if (!screen) return [];
    const config = props.options?.screenAssets?.[screen];
    if (!config) return [];
    return [...(config.required ?? []), ...(config.optional ?? [])];
  };

  const manager = createScreenManager({
    ...props.options,
    onBeforeScreenChange: async (_from, _to, config) => {
      if (!config) return;
      if (config.required?.length) {
        await Promise.all(
          config.required
            .filter((b) => !assets.coordinator.isLoaded(b))
            .map((b) => assets.loadBundle(b)),
        );
      }
      if (config.optional?.length) {
        for (const name of config.optional) {
          if (!assets.coordinator.isLoaded(name)) {
            assets.backgroundLoadBundle(name);
          }
        }
      }
    },
    onScreenChange: (from, to) => {
      errorReporter.setScreen(to);
      analytics.capture('screen_view', { screen: to });

      const fromBundles = getBundlesForScreen(from);
      if (fromBundles.length > 0) {
        const toBundles = new Set(getBundlesForScreen(to));
        const toUnload = fromBundles.filter((b) => !toBundles.has(b));
        if (toUnload.length > 0) {
          assets.unloadBundles(toUnload);
        }
      }

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
        <Suspense>
          <Show when={current() === 'loading'}>{props.screens.loading}</Show>
          <Show when={current() === 'start'}>{props.screens.start}</Show>
          <Show when={current() === 'game'}>{props.screens.game}</Show>
          <Show when={current() === 'results'}>{props.screens.results}</Show>
        </Suspense>
      </ScreenBoundary>
    </div>
  );
}
