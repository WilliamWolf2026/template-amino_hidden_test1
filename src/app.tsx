import { onMount, Show, createResource, type ParentComponent } from 'solid-js';
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
  useTuning,
  type ScaffoldTuning,
  FeatureFlagProvider,
} from '~/core';
import { initSentry } from '~/core/lib/sentry';
import { getEnvironment } from '~/core/config';
import { getAnalyticsService } from '~/core/lib/gameKit';
import { gameConfig, manifest, defaultGameData } from '~/game';
import { ManifestProvider, AnalyticsProvider } from '@wolfgames/components/solid';
import {
  ViewportProvider,
  ViewportModeWrapper,
  ViewportToggle,
} from '@wolfgames/components/solid';
import {
  getViewportModeFromUrl,
  type ViewportMode,
} from '@wolfgames/components/core';
import { GAME_DEFAULTS } from '~/game/tuning';
import './app.css';
import { IS_DEV_ENV } from './core/dev/env';
import { useGameTracking } from '~/game/setup/tracking';
import '~/game/setup/flags'; // registers flag config at module load

// Build URL overrides (applied after load, not saved to localStorage)
const urlViewportMode = getViewportModeFromUrl();
const environment = getEnvironment();

/** Reset progress and reload the page */
const handleResetProgress = () => {
  window.location.reload();
};

/** SettingsMenu wired with game analytics */
function GameSettingsMenu() {
  const { trackAudioSettingChanged } = useGameTracking();
  return (
    <SettingsMenu
      onResetProgress={IS_DEV_ENV ? handleResetProgress : undefined}
      onAudioSettingChanged={trackAudioSettingChanged}
    />
  );
}

/**
 * Bridges the tuning system ↔ viewport system.
 * Reads initial mode from tuning (with URL override), syncs changes back.
 */
const TuningViewportBridge: ParentComponent = (props) => {
  const tuning = useTuning<ScaffoldTuning>();

  // Resolve initial mode: URL param > gameConfig default > tuning default
  const resolveInitialMode = (): ViewportMode => {
    if (urlViewportMode) return urlViewportMode;
    if (gameConfig.defaultViewportMode) return gameConfig.defaultViewportMode;
    return tuning.scaffold.viewport?.mode ?? 'small';
  };

  const handleModeChange = (mode: ViewportMode) => {
    tuning.setScaffoldPath('viewport.mode', mode);
    tuning.save();
  };

  return (
    <ViewportProvider
      initialMode={resolveInitialMode()}
      onModeChange={handleModeChange}
    >
      {props.children}
    </ViewportProvider>
  );
};

export default function App() {
  const [analyticsService] = createResource(getAnalyticsService);

  onMount(async () => {
    // Initialize error tracking
    initSentry(environment);

    // Setup global error handlers
    setupGlobalErrorHandlers();

    // Initialize pause keyboard (spacebar)
    initPauseKeyboard();
  });

  return (
    <Show when={analyticsService()} keyed>
      {(service) => (
        <AnalyticsProvider service={service}>
          <GlobalBoundary>
            <TuningProvider gameDefaults={GAME_DEFAULTS}>
              <Show when={IS_DEV_ENV}>
                <TuningPanel />
              </Show>
              <FeatureFlagProvider>
                <TuningViewportBridge>
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
                        <AssetProvider>
                          <ScreenProvider options={{ initialScreen: gameConfig.initialScreen, screenAssets: gameConfig.screenAssets }}>
                            <ScreenRenderer screens={gameConfig.screens} />
                          </ScreenProvider>
                        </AssetProvider>
                      </ManifestProvider>
                    </PauseProvider>
                  </ViewportModeWrapper>
                </TuningViewportBridge>
              </FeatureFlagProvider>
            </TuningProvider>
          </GlobalBoundary>
        </AnalyticsProvider>
      )}
    </Show>
  );
}
