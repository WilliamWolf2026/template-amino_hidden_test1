/**
 * SimpleGame1 — Flip-book game controller.
 *
 * One full-screen background per level (1–12); "Flip" advances.
 * Uses atlas-tiles-daily-dispatch for backgrounds and Flip button.
 */

import { createSignal } from 'solid-js';
import { Application, Sprite } from 'pixi.js';
import type { AssetCoordinator } from '~/core/systems/assets';
import type { PixiLoader } from '~/core/systems/assets/loaders/gpu/pixi';
import type { ScreenId } from '~/core/systems/screens/types';
import type { ScaffoldTuning } from '~/core';
import type { GameTuning } from '~/game/tuning';
import { gameState } from '~/game/state';
import { getBackgroundFrame } from '~/game/simplegame1/data/levelBackgrounds';

const ATLAS_BUNDLE = 'atlas-tiles-daily-dispatch';
const TOTAL_LEVELS = 12;

interface GameControllerDeps {
  coordinator: AssetCoordinator;
  tuning: { scaffold: ScaffoldTuning; game: GameTuning };
  audio: unknown;
  gameData: unknown;
  analytics: unknown;
  goto: (screen: ScreenId) => void | Promise<void>;
}

interface GameController {
  init: (container: HTMLDivElement) => void;
  destroy: () => void;
  ariaText: () => string;
}

export function setupGame(deps: GameControllerDeps): GameController {
  const [ariaText, setAriaText] = createSignal('Game loading...');
  let app: Application | null = null;
  let bgSprite: Sprite | null = null;

  const updateBackground = (gpuLoader: PixiLoader) => {
    if (!bgSprite) return;
    const level = gameState.currentLevel();
    const frame = getBackgroundFrame(level);
    bgSprite.texture = gpuLoader.getTexture(ATLAS_BUNDLE, frame);
    setAriaText(`Level ${level} of ${TOTAL_LEVELS}`);
  };

  return {
    init(container: HTMLDivElement) {
      gameState.setTotalLevels(TOTAL_LEVELS);

      const gpuLoader = deps.coordinator.getGpuLoader() as PixiLoader | null;
      if (!gpuLoader?.hasSheet(ATLAS_BUNDLE)) {
        setAriaText('Atlas not loaded');
        console.error('[simplegame1] Atlas not loaded. Load atlas-tiles-daily-dispatch before entering game.');
        return;
      }

      app = new Application();
      app.init({
        background: '#1a1a1a',
        resizeTo: container,
        antialias: true,
      }).then(() => {
        if (!app) return;
        container.appendChild(app.canvas);

        // Full-screen background
        bgSprite = gpuLoader.createSprite(ATLAS_BUNDLE, getBackgroundFrame(gameState.currentLevel()));
        const bgScale = Math.max(
          app.screen.width / bgSprite.texture.width,
          app.screen.height / bgSprite.texture.height
        );
        bgSprite.scale.set(bgScale);
        bgSprite.anchor.set(0.5);
        bgSprite.x = app.screen.width / 2;
        bgSprite.y = app.screen.height / 2;
        app.stage.addChild(bgSprite);

        // Flip button (center-bottom)
        const flipBtn = gpuLoader.createSprite(ATLAS_BUNDLE, 'ui-button_start.png');
        flipBtn.anchor.set(0.5);
        flipBtn.x = app.screen.width / 2;
        flipBtn.y = app.screen.height - 80;
        flipBtn.eventMode = 'static';
        flipBtn.cursor = 'pointer';
        flipBtn.on('pointerdown', () => {
          gameState.incrementLevel();
          const level = gameState.currentLevel();
          if (level > TOTAL_LEVELS) {
            deps.goto('results');
          } else {
            updateBackground(gpuLoader);
          }
        });
        app.stage.addChild(flipBtn);

        setAriaText(`Level ${gameState.currentLevel()} of ${TOTAL_LEVELS}`);
      }).catch((err) => {
        console.error('[simplegame1] Failed to init Pixi:', err);
        setAriaText('Failed to load game');
      });
    },

    destroy() {
      if (app?.canvas?.parentNode) {
        app.canvas.parentNode.removeChild(app.canvas);
      }
      app?.destroy({ removeView: true }, { children: true });
      app = null;
      bgSprite = null;
    },

    ariaText,
  };
}
