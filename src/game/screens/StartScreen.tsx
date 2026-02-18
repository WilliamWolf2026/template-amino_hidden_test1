import { createSignal, onMount, onCleanup } from 'solid-js';
import { Application, Container, Sprite, Text, Graphics, type TextStyle } from 'pixi.js';
import { useScreen } from '~/scaffold/systems/screens';
import { useAssets } from '~/scaffold/systems/assets';
import { useTuning, type ScaffoldTuning } from '~/scaffold';
import { Logo } from '~/scaffold/ui/Logo';
import { gameState } from '~/game/state';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { Character } from '~/game/citylines/core/Character';
import { SpriteButton } from '~/game/citylines/core/SpriteButton';
import { getTileBundleName, type GameTuning } from '~/game/tuning';
import { setAtlasName } from '~/game/citylines/utils/atlasHelper';
import { getStartScreenMode, hasPlayedBefore, markAsPlayed, type StartScreenConfig } from '~/game/citylines/utils/startScreenHelper';
import { startChapter, getCurrentChapter } from '~/game/services/progress';
import { GAME_FONT_FAMILY } from '~/game/config/fonts';
import { useAnalytics } from '~/scaffold/systems/telemetry/AnalyticsContext';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Minimum font size per spec (16pt). Button label is intentionally larger. */
const MIN_FONT_SIZE = 16;
/** Font size sized to sit comfortably inside the button with visible padding on all sides. */
const BUTTON_FONT_SIZE = 46;

export default function StartScreen() {
  const { goto } = useScreen();
  const { coordinator, initGpu, unlockAudio, loadCore, loadAudio } = useAssets();
  const tuning = useTuning<ScaffoldTuning, GameTuning>();
  const { trackGameStart } = useAnalytics();

  const [loading, setLoading] = createSignal(false);
  const [screenConfig, setScreenConfig] = createSignal<StartScreenConfig | null>(null);

  let containerRef: HTMLDivElement | undefined;
  let app: Application | null = null;
  let background: Sprite | null = null;
  let uiContainer: Container | null = null;
  let titleSprite: Sprite | null = null;
  let character: Character | null = null;
  let startButton: SpriteButton | null = null;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleStart = async () => {
    if (loading()) return;
    setLoading(true);

    // Disable button during loading
    startButton?.setEnabled(false);
    startButton?.playExitAnimation();

    try {
      // Mark that player has played (for future sessions)
      const isReturning = hasPlayedBefore();
      markAsPlayed();

      // Start a new chapter if this is a new game (not continuing)
      const config = screenConfig();
      console.log('[StartScreen] handleStart - config:', config);
      if (config && config.mode === 'new') {
        console.log('[StartScreen] Starting new chapter');
        startChapter({
          manifestUrl: '', // TODO: Get actual manifest URL when available
          chapterId: 'default',
          countyName: config.countyName,
          chapterLength: config.totalLevels,
        });
      }

      // Track game start event
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

      // Load audio with graceful degradation
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

  // ─── Layout ─────────────────────────────────────────────────────────────────

  const handleResize = () => {
    if (!app || !background || !uiContainer) return;

    const screenWidth = app.screen.width;
    const screenHeight = app.screen.height;
    const centerX = screenWidth / 2;

    // Background - fit height, maintain aspect ratio, center horizontally
    const bgScale = screenHeight / background.texture.height;
    background.scale.set(bgScale);
    background.x = centerX;
    background.y = screenHeight / 2;

    // Scale title sprite to ~88% of screen width (dominant, like the mock)
    if (titleSprite && titleSprite.texture.width > 0) {
      const titleTargetW = screenWidth * 0.88;
      const titleScale = titleTargetW / titleSprite.texture.width;
      titleSprite.scale.set(titleScale);
    }

    // Layout zones (relative to screen, in uiContainer local space)
    const topPad = Math.max(screenHeight * 0.04, 24);
    // Reserve bottom space: Logo height (~40px) + safe gap (48px) + bottom inset
    const bottomPad = Math.max(screenHeight * 0.14, 100);
    const availableH = screenHeight - topPad - bottomPad;

    const titleH = titleSprite?.height ?? 0;
    const charH = character?.height ?? 0;
    const btnH = startButton?.height ?? 80;

    // Gaps between elements
    const gapTitleChar = availableH * 0.04;
    const gapCharBtn = availableH * 0.05;

    const totalContentH = titleH + gapTitleChar + charH + gapCharBtn + btnH;

    let contentScale = 1;
    if (totalContentH > availableH) {
      contentScale = availableH / totalContentH;
    }

    uiContainer.scale.set(contentScale);

    const localCenterX = centerX / contentScale;
    const startY = topPad / contentScale;

    const titleY = startY + titleH / 2;
    const charY = titleY + titleH / 2 + gapTitleChar / contentScale + charH / 2;
    const btnY = charY + charH / 2 + gapCharBtn / contentScale + btnH / 2;

    if (titleSprite) {
      titleSprite.x = localCenterX;
      titleSprite.y = titleY;
    }

    if (character) {
      character.x = localCenterX;
      character.y = charY;
    }

    if (startButton) {
      startButton.x = localCenterX;
      startButton.y = btnY;
    }
  };

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  onMount(async () => {
    if (!containerRef) return;

    await initGpu();

    const urlParams = new URLSearchParams(window.location.search);
    const debugProgress = urlParams.get('debugProgress') === '1';
    const config = getStartScreenMode(debugProgress);
    setScreenConfig(config);

    // ── Debug: county name goes to console only ──
    console.log(`[StartScreen] County: "${config.countyName}" | Mode: ${config.mode}`);

    app = new Application();
    await app.init({
      background: '#B2DD53',
      resizeTo: containerRef,
    });
    containerRef.appendChild(app.canvas);

    // Load tile bundle based on theme setting
    const tileTheme = tuning.game.theme.tileTheme;
    setAtlasName(tileTheme); // Set global atlas name for all game entities
    const tileBundleName = getTileBundleName(tileTheme);
    await coordinator.loadBundle(tileBundleName);
    const gpuLoader = coordinator.getGpuLoader() as PixiLoader;

    if (gpuLoader?.hasSheet(tileBundleName)) {
      // Background with aspect-ratio cover scaling
      background = gpuLoader.createSprite(tileBundleName, 'background.png');
      background.anchor.set(0.5);
      app.stage.addChild(background);

      // UI container (separate from background for independent scaling)
      uiContainer = new Container();
      app.stage.addChild(uiContainer);

      // Title sprite
      titleSprite = gpuLoader.createSprite(tileBundleName, 'title.png');
      titleSprite.anchor.set(0.5);
      uiContainer.addChild(titleSprite);

      // Character (News Hound)
      character = new Character('news_hound', gpuLoader, 0.92);
      uiContainer.addChild(character);

      // Start / Continue button
      const buttonLabel = config.mode === 'new' ? 'START' : 'CONTINUE';

      // Measure text first so button width hugs the label with consistent H padding
      const BUTTON_H_PAD = 24; // tight padding matching the mock
      const BUTTON_HEIGHT = 96;
      const tempText = new (await import('pixi.js')).Text({
        text: buttonLabel,
        style: {
          fontFamily: GAME_FONT_FAMILY,
          fontSize: BUTTON_FONT_SIZE,
          fontWeight: 'bold',
          padding: 8,
        } as Partial<TextStyle>,
      });
      const buttonWidth = Math.ceil(tempText.width) + BUTTON_H_PAD * 2;
      tempText.destroy();

      startButton = new SpriteButton(gpuLoader, {
        atlasName: tileBundleName,
        spriteName: 'button.png',
        label: buttonLabel,
        width: buttonWidth,
        height: BUTTON_HEIGHT,
        use9Slice: true,
        nineSliceBorders: {
          leftWidth: 32,
          topHeight: 32,
          rightWidth: 32,
          bottomHeight: 32,
        },
        labelStyle: {
          fontFamily: GAME_FONT_FAMILY,
          fontSize: BUTTON_FONT_SIZE, // large, fills button
          fontWeight: 'bold',
          fill: '#ffffff',
          stroke: { color: '#1a3a00', width: 8 },
          dropShadow: {
            alpha: 0.35,
            angle: Math.PI / 2,
            blur: 0,
            distance: 3,
            color: '#000000',
          },
          letterSpacing: 1,
          padding: 8, // prevents stroke clipping at edges
        } as Partial<TextStyle>,
        onClick: handleStart,
      });
      uiContainer.addChild(startButton);

      // Initial layout
      handleResize();

      // Listen for resize
      window.addEventListener('resize', handleResize);
    }
  });

  onCleanup(() => {
    window.removeEventListener('resize', handleResize);
    if (app) {
      app.destroy(true, { children: true });
      app = null;
    }
  });

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div class="fixed inset-0 bg-[#B2DD53]">
      {/* Pixi canvas container */}
      <div ref={containerRef} class="absolute inset-0" />

      {/* Logo pinned to bottom — canvas reserves space above so it's always visible */}
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2">
        <Logo />
      </div>
    </div>
  );
}