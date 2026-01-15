import { onMount } from 'solid-js';
import {
  GlobalBoundary,
  setupGlobalErrorHandlers,
  AssetProvider,
  ScreenProvider,
  ScreenRenderer,
  PauseProvider,
  initPauseKeyboard,
} from '~/scaffold';
import { initSentry } from '~/scaffold/lib/sentry';
import { initPostHog } from '~/scaffold/lib/posthog';
import { scaffoldConfig } from '~/scaffold/config';
import { manifest, gameConfig } from '~/game';
import { TweakpaneConfig } from '~/utils';
import './app.css';

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
      <TweakpaneConfig />
      <PauseProvider>
        <AssetProvider manifest={manifest} config={{ engine: scaffoldConfig.engine }}>
          <ScreenProvider options={{ initialScreen: gameConfig.initialScreen }}>
            <ScreenRenderer screens={gameConfig.screens} />
          </ScreenProvider>
        </AssetProvider>
      </PauseProvider>
    </GlobalBoundary>
  );
}
