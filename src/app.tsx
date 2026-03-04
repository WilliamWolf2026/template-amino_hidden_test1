import { onMount, Show, Switch, Match, type JSX } from 'solid-js';
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
  useTuning,
  type ScaffoldTuning,
} from '~/core';
import { initSentry } from '~/core/lib/sentry';
import { getEnvironment, scaffoldConfig } from '~/core/config';
import { gameConfig, manifest, defaultGameData } from '~/game';
import { ManifestProvider } from '~/core/systems/manifest/context';
import { GAME_DEFAULTS, getThemeFromUrl } from '~/game/tuning';
import { getViewportModeFromUrl } from '~/core/config/viewport';
import { clearProgress } from '~/game/services/progress';
import './app.css';
import { IS_DEV_ENV } from './core/dev/env';
import { AnalyticsProvider, useAnalytics } from '~/game/setup/AnalyticsContext';
import { FeatureFlagProvider } from '~/game/setup/FeatureFlagContext';
import { ViewportToggle } from '~/core/ui/ViewportToggle';

// Build URL overrides (applied after load, not saved to localStorage)
const urlTheme = getThemeFromUrl();
const urlViewportMode = getViewportModeFromUrl();
const environment = getEnvironment();
const urlOverrides = urlTheme ? { 'theme.tileTheme': urlTheme } : undefined;

/** Reset progress and reload the page */
const handleResetProgress = () => {
  clearProgress();
  // Reload to show start screen (since progress is now cleared)
  window.location.reload();
};

/** SettingsMenu wired with game analytics */
function GameSettingsMenu() {
  const { trackAudioSettingChanged } = useAnalytics();
  return (
    <SettingsMenu
      onResetProgress={IS_DEV_ENV ? handleResetProgress : undefined}
      onAudioSettingChanged={trackAudioSettingChanged}
    />
  );
}

/** Reads viewport mode from scaffold tuning and wraps children in the appropriate MobileViewport config */
function ViewportModeWrapper(props: { children: JSX.Element }) {
  const tuning = useTuning<ScaffoldTuning>();
  const mode = () => tuning.scaffold.viewport?.mode ?? 'small';

  onMount(() => {
    // Apply game config default if tuning hasn't been customized yet
    if (gameConfig.defaultViewportMode && tuning.scaffold.viewport?.mode === 'small') {
      tuning.setScaffoldPath('viewport.mode', gameConfig.defaultViewportMode);
    }
    // URL param overrides everything (session only, not persisted)
    if (urlViewportMode) {
      tuning.setScaffoldPath('viewport.mode', urlViewportMode);
    }
  });

  return (
    <Switch fallback={<MobileViewport>{props.children}</MobileViewport>}>
      <Match when={mode() === 'none'}>
        <div class="fixed inset-0">{props.children}</div>
      </Match>
      <Match when={mode() === 'large'}>
        <MobileViewport maxWidth={768}>{props.children}</MobileViewport>
      </Match>
      <Match when={mode() === 'small'}>
        <MobileViewport>{props.children}</MobileViewport>
      </Match>
    </Switch>
  );
}

export default function App() {
  onMount(async () => {
    // Initialize error tracking
    initSentry(environment);

    // Setup global error handlers
    setupGlobalErrorHandlers();

    // Initialize pause keyboard (spacebar)
    initPauseKeyboard();
  });

  return (
    <GlobalBoundary>
      <TuningProvider gameDefaults={GAME_DEFAULTS} urlOverrides={urlOverrides}>
        <Show when={IS_DEV_ENV}>
          <TuningPanel />
        </Show>
        <AnalyticsProvider>
          <FeatureFlagProvider>
            <ViewportModeWrapper>
              {/* Settings Menu - Top Right Corner */}
              <div class="fixed top-2 right-2 z-[9999]">
                <GameSettingsMenu />
              </div>
              {/* Viewport Toggle - Top Left Corner (dev only) */}
              <Show when={IS_DEV_ENV}>
                <div class="fixed top-2 left-2 z-[9999]">
                  <ViewportToggle />
                </div>
              </Show>
              <PauseProvider>
                <ManifestProvider manifest={manifest} defaultGameData={defaultGameData} serverStorageUrl={gameConfig.serverStorageUrl}>
                  <AssetProvider config={{ engine: scaffoldConfig.engine }}>
                    <ScreenProvider options={{ initialScreen: gameConfig.initialScreen }}>
                      <ScreenRenderer screens={gameConfig.screens} />
                    </ScreenProvider>
                  </AssetProvider>
                </ManifestProvider>
              </PauseProvider>
            </ViewportModeWrapper>
          </FeatureFlagProvider>
        </AnalyticsProvider>
      </TuningProvider>
    </GlobalBoundary>
  );
}
