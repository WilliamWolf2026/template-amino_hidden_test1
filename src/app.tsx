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
  MobileViewport,
} from '~/scaffold';
import { initSentry } from '~/scaffold/lib/sentry';
import { getEnvironment, scaffoldConfig } from '~/scaffold/config';
import { gameConfig } from '~/game';
import { ManifestProvider } from '~/scaffold/systems/manifest/context';
import { CITYLINES_DEFAULTS, getThemeFromUrl } from '~/game/tuning';
import { clearProgress } from '~/game/services/progress';
import './app.css';
import { IS_DEV_ENV } from './scaffold/dev/env';
import { AnalyticsProvider } from '~/contexts/AnalyticsContext';

// Build URL overrides (applied after load, not saved to localStorage)
const urlTheme = getThemeFromUrl();
const environment = getEnvironment();
const urlOverrides = urlTheme ? { 'theme.tileTheme': urlTheme } : undefined;

/** Reset progress and reload the page */
const handleResetProgress = () => {
  clearProgress();
  // Reload to show start screen (since progress is now cleared)
  window.location.reload();
};

export default function App() {
  onMount(() => {
    // Initialize error tracking
      initSentry(environment);
  
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
        <MobileViewport>
          {/* Settings Menu - Top Right Corner */}
          <div class="fixed top-2 right-2 z-[9999]">
            <SettingsMenu onResetProgress={handleResetProgress} />
          </div>
          <AnalyticsProvider>
            <PauseProvider>
              <ManifestProvider>
                <AssetProvider config={{ engine: scaffoldConfig.engine }}>
                  <ScreenProvider options={{ initialScreen: gameConfig.initialScreen }}>
                    <ScreenRenderer screens={gameConfig.screens} />
                  </ScreenProvider>
                </AssetProvider>
              </ManifestProvider>
            </PauseProvider>
          </AnalyticsProvider>
        </MobileViewport>
      </TuningProvider>
    </GlobalBoundary>
  );
}
