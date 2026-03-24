import { onMount, onCleanup, Show, type JSX, type ParentProps } from 'solid-js';
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
import { gameConfig, manifest, defaultGameData } from '~/game';
import { ManifestProvider, AnalyticsProvider } from '@wolfgames/components/solid';
import { useAnalyticsCore } from '@wolfgames/components/solid';
import { GAME_DEFAULTS } from '~/game/tuning';
import { getViewportModeFromUrl } from '~/core/config/viewport';
// TODO: Wire up progress reset when new game implements progress service
// import { clearProgress } from '~/game/services/progress';
import './app.css';
import { IS_DEV_ENV } from './core/dev/env';
import { setCoreInstance } from '~/core/systems/analytics/service';
import { useGameTracking } from '~/game/setup/tracking';
import '~/game/setup/flags'; // registers flag config at module load
import { ViewportToggle } from '~/core/ui/ViewportToggle';

// Build URL overrides (applied after load, not saved to localStorage)
const urlViewportMode = getViewportModeFromUrl();
const environment = getEnvironment();

/**
 * Registers the provider-owned AnalyticsCore for imperative access
 * (error reporter, etc.) via setCoreInstance in service.ts.
 */
function AnalyticsBridge(props: ParentProps) {
  const core = useAnalyticsCore();
  setCoreInstance(core);
  onCleanup(() => setCoreInstance(null));
  return <>{props.children}</>;
}

/** Reset progress and reload the page */
const handleResetProgress = () => {
  // TODO: Wire up clearProgress() when new game implements progress service
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
 * Reads viewport mode from scaffold tuning and wraps children in the appropriate viewport config.
 * Uses reactive styles on a stable DOM tree so children are never destroyed when mode changes.
 */
function ViewportModeWrapper(props: { children: JSX.Element }) {
  const tuning = useTuning<ScaffoldTuning>();
  const mode = () => tuning.scaffold.viewport?.mode ?? 'small';

  onMount(() => {
    if (gameConfig.defaultViewportMode && tuning.scaffold.viewport?.mode === 'small') {
      tuning.setScaffoldPath('viewport.mode', gameConfig.defaultViewportMode);
    }
    if (urlViewportMode) {
      tuning.setScaffoldPath('viewport.mode', urlViewportMode);
    }
  });

  const constrained = () => mode() !== 'none';
  const maxW = () => mode() === 'large' ? 768 : 430;
  const ar = 9 / 16;

  return (
    <div
      class="fixed inset-0"
      classList={{ flex: constrained(), 'items-center': constrained(), 'justify-center': constrained() }}
      style={{ "background-color": constrained() ? '#1a1a1a' : 'transparent' }}
    >
      <div
        class="relative overflow-hidden"
        style={constrained() ? {
          width: `min(${maxW()}px, calc(100vh * ${ar}))`,
          height: `min(100vh, calc(${maxW()}px / ${ar}))`,
          "max-width": `${maxW()}px`,
          "border-radius": "24px",
          "box-shadow": "0 0 0 8px #333, 0 25px 50px -12px rgba(0,0,0,0.5)",
          transform: "translateZ(0)",
        } : {
          width: '100%',
          height: '100%',
        }}
      >
        {props.children}
      </div>
    </div>
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
      <TuningProvider gameDefaults={GAME_DEFAULTS}>
        <Show when={IS_DEV_ENV}>
          <TuningPanel />
        </Show>
        <AnalyticsProvider>
          <AnalyticsBridge>
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
                  <AssetProvider>
                    <ScreenProvider options={{ initialScreen: gameConfig.initialScreen, screenAssets: gameConfig.screenAssets }}>
                      <ScreenRenderer screens={gameConfig.screens} />
                    </ScreenProvider>
                  </AssetProvider>
                </ManifestProvider>
              </PauseProvider>
            </ViewportModeWrapper>
          </FeatureFlagProvider>
          </AnalyticsBridge>
        </AnalyticsProvider>
      </TuningProvider>
    </GlobalBoundary>
  );
}
