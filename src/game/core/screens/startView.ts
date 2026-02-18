/**
 * Start Screen Controller — Template Skeleton
 *
 * Factory function that sets up game-specific start screen logic,
 * Pixi objects, layout, and event handling.
 *
 * Called at component top-level so Solid.js reactive primitives work.
 * Returns init/destroy lifecycle hooks for the screen to call.
 *
 * Replace this with your game's implementation.
 */

import { createSignal } from 'solid-js';
import { Application, Text, type TextStyle } from 'pixi.js';

import type { ScaffoldTuning } from '~/scaffold';

import type { GameTuning } from '~/game/tuning';
import { GAME_FONT_FAMILY } from '~/game/config/fonts';

/** Controller interface returned by setupStartScreen */
export interface StartScreenController {
  init(container: HTMLDivElement): Promise<void>;
  destroy(): void;
  loading: () => boolean;
  backgroundColor: string;
}

/** Dependencies injected from the screen component */
export interface StartScreenDeps {
  goto: ReturnType<typeof import('~/scaffold/systems/screens').useScreen>['goto'];
  coordinator: {
    getGpuLoader: () => unknown;
    loadBundle: (name: string) => Promise<void>;
  };
  initGpu: () => Promise<void>;
  unlockAudio: () => void;
  loadCore: () => Promise<void>;
  loadAudio: () => Promise<void>;
  tuning: {
    game: GameTuning;
    scaffold: ScaffoldTuning;
  };
  analytics: Pick<ReturnType<typeof import('~/scaffold/systems/telemetry/AnalyticsContext').useAnalytics>, 'trackGameStart'>;
}

const TITLE_STYLE: Partial<TextStyle> = {
  fontFamily: GAME_FONT_FAMILY,
  fontSize: 48,
  fontWeight: 'bold',
  fill: '#FFFFFF',
  align: 'center',
};

export function setupStartScreen(deps: StartScreenDeps): StartScreenController {
  const { goto, coordinator, initGpu, unlockAudio, loadCore, loadAudio, tuning, analytics } = deps;

  const [loading, setLoading] = createSignal(false);

  let app: Application | null = null;

  async function handleStart() {
    if (loading()) return;
    setLoading(true);

    unlockAudio();
    await initGpu();
    await loadCore();
    await loadAudio();

    analytics.trackGameStart({ firstPlay: true });
    await goto('game');
  }

  async function init(container: HTMLDivElement) {
    app = new Application();
    await app.init({
      resizeTo: container,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    container.appendChild(app.canvas as HTMLCanvasElement);

    // TODO: Create your start screen visuals (title, character, play button)
    const title = new Text({ text: 'Your Game Title', style: TITLE_STYLE });
    title.anchor.set(0.5);
    title.x = app.screen.width / 2;
    title.y = app.screen.height / 3;
    app.stage.addChild(title);

    // Wire tap-to-start on the stage
    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;
    app.stage.on('pointertap', handleStart);
  }

  function destroy() {
    if (app) {
      app.stage.off('pointertap', handleStart);
      app.destroy(true, { children: true, texture: true });
      app = null;
    }
  }

  return {
    init,
    destroy,
    loading,
    backgroundColor: '#1a1a2e',
  };
}
