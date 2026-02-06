import { onMount, Show } from 'solid-js';
import {
  GlobalBoundary,
  setupGlobalErrorHandlers,
  AssetProvider,
  ScreenProvider,
  ScreenRenderer,
  PauseProvider,
  initPauseKeyboard,
  SettingsMenu,
  TuningProvider,
  TuningPanel,
} from '~/scaffold';
import { initSentry } from '~/scaffold/lib/sentry';
import { initPostHog } from '~/scaffold/lib/posthog';
import { scaffoldConfig } from '~/scaffold/config';
import { gameConfig } from '~/game';
import { ManifestProvider } from '~/scaffold/systems/manifest/context';
import { CITYLINES_DEFAULTS, getThemeFromUrl } from '~/game/tuning';
import './app.css';
import { IS_DEV_ENV } from './scaffold/dev/env';

// Build URL overrides (applied after load, not saved to localStorage)
const urlTheme = getThemeFromUrl();
const urlOverrides = urlTheme ? { 'theme.tileTheme': urlTheme } : undefined;

export default function App() {
  onMount(() => {
    // Initialize error tracking
    if (scaffoldConfig.sentry?.dsn) {
      initSentry(scaffoldConfig.sentry.dsn);
    }
    if (scaffoldConfig.posthog?.apiKey) {
      initPostHog(scaffoldConfig.posthog.apiKey, scaffoldConfig.posthog.apiHost);
    }

    // Setup global error handlers
    setupGlobalErrorHandlers();

    // Initialize pause keyboard (spacebar)
    initPauseKeyboard();
  });

  return (
    <GlobalBoundary>
      <TuningProvider gameDefaults={CITYLINES_DEFAULTS} urlOverrides={urlOverrides}>
        <Show when={IS_DEV_ENV}>
          <TuningPanel />
        </Show>
        {/* Settings Menu - Top Right Corner */}
        <div class="fixed top-2 right-2 z-[9999]">
          <SettingsMenu />
        </div>
        <PauseProvider>
          <ManifestProvider>
            <AssetProvider config={{ engine: scaffoldConfig.engine }}>
              <ScreenProvider options={{ initialScreen: gameConfig.initialScreen }}>
                <ScreenRenderer screens={gameConfig.screens} />
              </ScreenProvider>
            </AssetProvider>
          </ManifestProvider>
        </PauseProvider>
      </TuningProvider>
    </GlobalBoundary>
  );
}
