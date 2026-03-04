/**
 * Daily Dispatch Start Screen Controller
 *
 * Factory function that sets up all Daily Dispatch-specific start screen logic,
 * Pixi objects, layout, and event handling.
 *
 * Called at component top-level so Solid.js reactive primitives work.
 * Returns init/destroy lifecycle hooks for the screen to call.
 */

import { createSignal } from 'solid-js';
import { Application, Container, Sprite, Graphics } from 'pixi.js';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';

// Character sprite created directly from atlas (no scaling wrapper)
import { SpriteButton } from '~/game/dailydispatch/core/SpriteButton';
import { setAtlasName } from '~/game/dailydispatch/utils/atlasHelper';
import { getStartScreenMode, hasPlayedBefore, markAsPlayed, type StartScreenConfig } from '~/game/dailydispatch/utils/startScreenHelper';

import { getTileBundleName, type GameTuning } from '~/game/tuning';
import { gameState } from '~/game/state';
import { startChapter, getCurrentChapter } from '~/game/services/progress';
import { GAME_FONT_FAMILY } from '~/game/config/fonts';

import type { ScaffoldTuning } from '~/scaffold';

/** Controller interface returned by setupDailyDispatchStartScreen */
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
  analytics: Pick<ReturnType<typeof import('~/game/setup/AnalyticsContext').useAnalytics>, 'trackGameStart'>;
}

export function setupDailyDispatchStartScreen(deps: StartScreenDeps): StartScreenController {
  const { goto, coordinator, initGpu, unlockAudio, loadCore, loadAudio, tuning, analytics } = deps;
  const { trackGameStart } = analytics;

  const [loading, setLoading] = createSignal(false);
  const [screenConfig, setScreenConfig] = createSignal<StartScreenConfig | null>(null);
  let app: Application | null = null;
  let background: Sprite | null = null;
  let uiContainer: Container | null = null;
  let titleSprite: Sprite | null = null;
  let character: Sprite | null = null;
  let characterShadow: Graphics | null = null;
  let startButton: SpriteButton | null = null;

  const handleStart = async () => {
    if (loading()) return;
    setLoading(true);
    startButton?.setEnabled(false);
    startButton?.playExitAnimation();

    try {
      const isReturning = hasPlayedBefore();
      markAsPlayed();

      const config = screenConfig();
      console.log('[StartScreen] handleStart - config:', config);
      if (config && config.mode === 'new') {
        console.log('[StartScreen] Starting new chapter');
        startChapter({
          manifestUrl: '',
          chapterId: 'default',
          countyName: config.countyName,
          chapterLength: config.totalLevels,
        });
      }

      const savedChapter = getCurrentChapter();
      trackGameStart({
        start_source: config?.mode === 'new' ? 'new_game' : 'continue',
        is_returning_player: isReturning,
        chapter_id: savedChapter?.chapterId ?? 'default',
        chapter_count: savedChapter?.catalogIndex != null ? savedChapter.catalogIndex + 1 : 1,
        county_theme: config?.countyName ?? 'unknown',
      });

      unlockAudio();
      await initGpu();
      await loadCore();

      try {
        await loadAudio();
      } catch (error) {
        console.warn('Audio loading failed (assets may not exist yet):', error);
      }

      gameState.reset();
      await new Promise((r) => setTimeout(r, 200));
      await goto('game');
    } catch (error) {
      console.error('Failed to start game:', error);
      setLoading(false);
      startButton?.setEnabled(true);
    }
  };

  const handleResize = () => {
    if (!app || !background || !uiContainer) return;

    const screenWidth = app.screen.width;
    const screenHeight = app.screen.height;
    const centerX = screenWidth / 2;

    const bgScale = screenHeight / background.texture.height;
    background.scale.set(bgScale);
    background.x = centerX;
    background.y = screenHeight / 2;

    const topMargin = 40;
    const bottomMargin = 60;
    const availableHeight = screenHeight - topMargin - bottomMargin;

    const titleHeight = titleSprite?.height ?? 0;
    const characterHeight = character?.height ?? 0;
    const buttonHeight = startButton?.height ?? 80;

    const idealGaps = { titleBottom: 32, characterBottom: 32 };
    const minGaps = { titleBottom: 20, characterBottom: 24 };

    const totalIdealHeight =
      titleHeight + idealGaps.titleBottom +
      characterHeight + idealGaps.characterBottom +
      buttonHeight;

    let gaps = { ...idealGaps };
    let contentScale = 1;

    if (totalIdealHeight > availableHeight) {
      const totalMinHeight =
        titleHeight + minGaps.titleBottom +
        characterHeight + minGaps.characterBottom +
        buttonHeight;

      if (totalMinHeight > availableHeight) {
        contentScale = availableHeight / totalMinHeight;
        gaps = { ...minGaps };
      } else {
        const ratio = (availableHeight - totalMinHeight) / (totalIdealHeight - totalMinHeight);
        gaps = {
          titleBottom: minGaps.titleBottom + (idealGaps.titleBottom - minGaps.titleBottom) * ratio,
          characterBottom: minGaps.characterBottom + (idealGaps.characterBottom - minGaps.characterBottom) * ratio,
        };
      }
    }

    uiContainer.scale.set(contentScale);

    const startY = topMargin / contentScale;
    const titleY = startY + titleHeight / 2;
    const characterY = titleY + titleHeight / 2 + gaps.titleBottom + characterHeight / 2 - 10;
    const buttonY = characterY + characterHeight / 2 + gaps.characterBottom + buttonHeight / 2 + 15;

    if (titleSprite) { titleSprite.x = centerX / contentScale; titleSprite.y = titleY; }
    // Align Marty's left edge with the title's left edge
    const titleLeftEdge = (centerX / contentScale) - (titleSprite?.width ?? 0) / 2;
    const characterX = titleLeftEdge + (character?.width ?? 0) / 2;
    if (characterShadow && character) {
      characterShadow.x = characterX;
      characterShadow.y = characterY + (character.height / 2) - 10;
    }
    if (character) { character.x = characterX; character.y = characterY; }
    if (startButton) { startButton.x = centerX / contentScale; startButton.y = buttonY; }
  };

  return {
    loading,
    backgroundColor: '#4A3728',

    async init(container: HTMLDivElement) {
      await initGpu();

      const urlParams = new URLSearchParams(window.location.search);
      const debugProgress = urlParams.get('debugProgress') === '1';
      const config = getStartScreenMode(debugProgress);
      setScreenConfig(config);

      app = new Application();
      await app.init({
        background: '#4A3728',
        resizeTo: container,
      });
      container.appendChild(app.canvas);

      const tileTheme = tuning.game.theme.tileTheme;
      setAtlasName(tileTheme);
      const tileBundleName = getTileBundleName(tileTheme);
      try {
        await coordinator.loadBundle(tileBundleName);
      } catch (error) {
        console.error(`[StartScreen] Failed to load tiles (${tileBundleName}):`, error);
        return;
      }
      const gpuLoader = coordinator.getGpuLoader() as PixiLoader;

      if (gpuLoader?.hasSheet(tileBundleName)) {
        background = gpuLoader.createSprite(tileBundleName, 'bg-warehouse_interior.png');
        background.anchor.set(0.5);
        app.stage.addChild(background);

        uiContainer = new Container();
        app.stage.addChild(uiContainer);

        titleSprite = gpuLoader.createSprite(tileBundleName, 'ui-title.png');
        titleSprite.anchor.set(0.5);
        uiContainer.addChild(titleSprite);

        console.log('[StartScreen] county:', config.countyName);

        characterShadow = new Graphics();
        characterShadow.ellipse(0, 0, 70, 20);
        characterShadow.fill({ color: 0x000000, alpha: 0.25 });
        uiContainer.addChild(characterShadow);

        character = gpuLoader.createSprite(tileBundleName, 'character-marty_idle.png');
        character.anchor.set(0.5);
        character.scale.set(1.35);
        uiContainer.addChild(character);

        const buttonLabel = config.mode === 'new' ? 'START' : 'CONTINUE';
        startButton = new SpriteButton(gpuLoader, {
          atlasName: tileBundleName,
          spriteName: 'ui-button_start.png',
          label: buttonLabel,
          width: 200,
          height: 80,
          use9Slice: true,
          nineSliceBorders: { leftWidth: 32, topHeight: 32, rightWidth: 32, bottomHeight: 32 },
          labelStyle: {
            fontFamily: GAME_FONT_FAMILY,
            fontSize: 36,
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: { color: '#000000', width: 4 },
          },
          onClick: handleStart,
        });
        uiContainer.addChild(startButton);

        handleResize();
        window.addEventListener('resize', handleResize);
      }
    },

    destroy() {
      window.removeEventListener('resize', handleResize);
      if (app) {
        app.destroy(true, { children: true });
        app = null;
      }
    },
  };
}
