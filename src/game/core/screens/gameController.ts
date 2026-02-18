/**
 * Game Controller — Template Skeleton
 *
 * Factory function that sets up game-specific logic, Pixi objects,
 * event wiring, and reactive effects for the GameScreen.
 *
 * Called at component top-level so Solid.js reactive primitives work.
 * Returns init/destroy lifecycle hooks for the screen to call.
 *
 * Replace this with your game's implementation.
 */

import { createSignal } from 'solid-js';
import { Application } from 'pixi.js';

import type { ScaffoldTuning } from '~/scaffold';

import type { GameTuning } from '~/game/tuning';
import type { useGameData } from '~/game/hooks/useGameData';

/** Controller interface returned by setupGame */
export interface GameScreenController {
  init(container: HTMLDivElement): Promise<void>;
  destroy(): void;
  ariaText: () => string;
}

/** Dependencies injected from the screen component */
export interface GameScreenDeps {
  coordinator: {
    getGpuLoader: () => unknown;
    loadBundle: (name: string) => Promise<void>;
    audio: {
      setMasterVolume: (volume: number) => void;
    };
  };
  tuning: {
    game: GameTuning;
    scaffold: ScaffoldTuning;
  };
  audio: {
    volume: () => number;
    musicEnabled: () => boolean;
  };
  gameData: ReturnType<typeof useGameData>;
  analytics: Pick<
    ReturnType<typeof import('~/scaffold/systems/telemetry/AnalyticsContext').useAnalytics>,
    'trackLevelStart' | 'trackLevelComplete' | 'trackChapterStart' | 'trackChapterComplete' | 'trackLandmarkConnected'
  >;
}

export function setupGame(deps: GameScreenDeps): GameScreenController {
  const { coordinator, tuning, audio, gameData, analytics } = deps;

  const [ariaText, setAriaText] = createSignal('Game loading');

  let app: Application | null = null;

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

    // TODO: Load your assets, create game objects, wire events
    setAriaText('Game started');
  }

  function destroy() {
    if (app) {
      app.destroy(true, { children: true, texture: true });
      app = null;
    }
  }

  return { init, destroy, ariaText };
}
