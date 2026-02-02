import { onMount, onCleanup, createEffect, createSignal } from 'solid-js';
import { Application, Graphics, Container, BlurFilter, Text } from 'pixi.js';
import gsap from 'gsap';

import { useAssets } from '~/scaffold/systems/assets';
import { PauseOverlay, useTuning, type ScaffoldTuning } from '~/scaffold';
import { Logo } from '~/scaffold/ui/Logo';
import { useAudio } from '~/scaffold/systems/audio';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { CityLinesGame, CompanionCharacter, DialogueBox, CluePopup, LevelGenerationService, getDifficultyForLevel, difficultyToGeneratorConfig } from '~/game/citylines';
import { getTileBundleName, type CityLinesTuning } from '~/game/tuning';
import { setAtlasName } from '~/game/citylines/utils/atlasHelper';
import { GameAudioManager } from '~/game/audio/manager';
import { ProgressBar } from '~/game/citylines/core/ProgressBar';
import { getCountyConfig } from '~/game/citylines/data/counties';
import { gameState } from '~/game/state';
import { getDebugParams } from '~/game/utils/debugParams';
import { GAME_FONT_FAMILY } from '~/game/config/fonts';

export function GameScreen() {
  const { coordinator } = useAssets();
  const tuning = useTuning<ScaffoldTuning, CityLinesTuning>();
  const audio = useAudio();
  let containerRef: HTMLDivElement | undefined;

  // Store references for reactive updates
  const [pixiApp, setPixiApp] = createSignal<Application | null>(null);
  const [gameInstance, setGameInstance] = createSignal<CityLinesGame | null>(null);
  const [audioManager, setAudioManager] = createSignal<GameAudioManager | null>(null);
  const [progressBar, setProgressBar] = createSignal<ProgressBar | null>(null);
  let resizeHandler: (() => void) | null = null;

  // Companion dialogue references (reused for both intro and completion)
  let companionGroup: Container | null = null;
  let companionDialogueBox: DialogueBox | null = null;
  let companionCharacter: CompanionCharacter | null = null;
  let darkOverlay: Graphics | null = null;
  let isCompanionAnimating = false;
  let isShowingCompletionClue = false; // Track if currently showing level completion (chapter end overlay)

  // Pixi-based CluePopup for levels 1-9
  let cluePopup: CluePopup | null = null;

  // Chapter label text (above progress bar)
  let chapterLabel: Text | null = null;

  // Helper: Generate level with progressive difficulty
  const generateLevelWithProgression = (levelNumber: number) => {
    const baseTuning = tuning.game;
    const difficulty = getDifficultyForLevel(levelNumber);
    const generatorConfig = difficultyToGeneratorConfig(difficulty, {
      sidePushRadius: baseTuning.generator.sidePushRadius,
      sidePushFactor: baseTuning.generator.sidePushFactor,
      wriggleDistanceMagnifier: baseTuning.generator.wriggleDistanceMagnifier,
      wriggleExtentChaosFactor: baseTuning.generator.wriggleExtentChaosFactor,
      wrigglePasses: baseTuning.generator.wrigglePasses,
    });

    console.log(`[Progressive Difficulty] Level ${levelNumber}:`, {
      gridSize: difficulty.gridSize,
      landmarks: `${difficulty.landmarkCount.min}-${difficulty.landmarkCount.max}`,
      detourProbability: difficulty.detourProbability,
      minPathLength: difficulty.minPathLength,
      wriggleFactor: generatorConfig.wriggleFactor.toFixed(3),
      wriggleExtent: generatorConfig.wriggleExtent.toFixed(2),
    });

    return LevelGenerationService.generateLevel(levelNumber, generatorConfig);
  };

  // Current level (generated procedurally with progressive difficulty)
  const [currentLevel, setCurrentLevel] = createSignal(
    generateLevelWithProgression(1)
  );

  // Accessibility: aria-live announcements
  let ariaLiveRef: HTMLDivElement | undefined;

  onMount(async () => {
    if (!containerRef) return;

    // Get initial tuning values
    const gameTuning = tuning.game;

    // Create Pixi application
    const app = new Application();

    await app.init({
      background: gameTuning.visuals.backgroundColor,
      resizeTo: containerRef,
      antialias: true,
    });

    // Mount canvas
    containerRef.appendChild(app.canvas);
    setPixiApp(app);

    const gpuLoader = coordinator.getGpuLoader() as PixiLoader;

    // Load game tiles bundle based on theme setting
    const tileTheme = gameTuning.theme.tileTheme;
    setAtlasName(tileTheme); // Set global atlas name for all game entities
    const tileBundleName = getTileBundleName(tileTheme);
    await coordinator.loadBundle(tileBundleName);

    // Load VFX bundles
    await coordinator.loadBundle('vfx-rotate');
    await coordinator.loadBundle('vfx-blast');

    // Create City Lines game
    if (gpuLoader.hasSheet(tileBundleName)) {
      // Add background - fit height, maintain aspect ratio, center horizontally
      const background = gpuLoader.createSprite(tileBundleName, 'background.png');
      const scale = app.screen.height / background.texture.height;
      background.scale.set(scale);
      background.anchor.set(0.5);
      background.x = app.screen.width / 2;
      background.y = app.screen.height / 2;

      // Add blur filter to background
      const blurFilter = new BlurFilter({ strength: 8 });
      background.filters = [blurFilter];

      app.stage.addChild(background);

      const tileSize = gameTuning.grid.tileSize;
      const game = new CityLinesGame(gpuLoader, tileSize);

      // Set grid layout BEFORE loading level to ensure proper initial positioning
      const { padding, cellGap } = gameTuning.grid;
      game.setGridLayout(padding, cellGap, false);

      // Configure level transition animation
      game.setLevelTransitionConfig(gameTuning.levelTransition);

      // Configure completion paint animation
      game.setCompletionPaintConfig(gameTuning.completionPaint);

      // Load generated level
      game.loadLevel(currentLevel());

      // Auto-size to viewport (shrink tiles if grid is too large)
      game.autoSizeToViewport(
        app.screen.width,
        app.screen.height,
        tileSize,  // max tile size from tuning
        80,        // reserved top (progress bar area)
        100        // reserved bottom (logo area)
      );

      // Center the game on screen (pivot is at grid center, so position at screen center)
      game.x = app.screen.width / 2;
      game.y = app.screen.height / 2;

      app.stage.addChild(game);
      setGameInstance(game);

      // Create progress bar HUD
      const countyConfig = getCountyConfig(currentLevel().county);

      // Create progress label text (positioned above progress bar)
      chapterLabel = new Text({
        text: `${gameState.currentLevel()} / ${gameState.totalLevels()}`,
        style: {
          fontFamily: GAME_FONT_FAMILY,
          fontSize: 24,
          fontWeight: 'bold',
          fill: '#ffffff',
          stroke: { color: '#000000', width: 5 },
          dropShadow: {
            color: '#000000',
            alpha: 0.5,
            blur: 3,
            distance: 2,
          },
        },
      });
      chapterLabel.anchor.set(0.5);
      app.stage.addChild(chapterLabel);
      const barWidth = Math.min(320, app.screen.width - 48);
      const bar = new ProgressBar(gpuLoader, tileBundleName, {
        width: barWidth,
        height: 36,
        themeColor: countyConfig?.themeColor,
        tileTheme: tileTheme,
        showLabel: false, // Label is shown above the bar instead
      });
      app.stage.addChild(bar);
      setProgressBar(bar);

      // Helper: Position progress bar and label above the grid
      const positionProgressUI = () => {
        const gridPixelSize = game.getGridPixelSize();
        const gridTop = app.screen.height / 2 - gridPixelSize / 2;
        const barY = gridTop - 50;
        const barWidth = Math.min(320, app.screen.width - 48);
        bar.x = (app.screen.width - barWidth) / 2;
        bar.y = barY;
        if (chapterLabel) {
          chapterLabel.x = app.screen.width / 2;
          chapterLabel.y = barY - 24;
        }
      };

      // Helper: Fade out progress bar and label
      const fadeOutProgressUI = () => {
        gsap.to(bar, { alpha: 0.15, duration: 0.3, ease: 'power2.out' });
        if (chapterLabel) gsap.to(chapterLabel, { alpha: 0.15, duration: 0.3, ease: 'power2.out' });
      };

      // Helper: Fade in progress bar and label
      const fadeInProgressUI = () => {
        gsap.to(bar, { alpha: 1, duration: 0.3, ease: 'power2.out' });
        if (chapterLabel) gsap.to(chapterLabel, { alpha: 1, duration: 0.3, ease: 'power2.out' });
      };

      // Helper: Load next level and play transition animation
      const loadNextLevelWithTransition = async () => {
        const controller = game.getCompletionController();
        controller.continue();

        const newLevel = generateLevelWithProgression(currentLevel().levelNumber + 1);
        setCurrentLevel(newLevel);
        game.loadLevel(newLevel);

        game.autoSizeToViewport(
          app.screen.width,
          app.screen.height,
          gameTuning.grid.tileSize,
          80,
          100
        );
        game.x = app.screen.width / 2;
        game.y = app.screen.height / 2;

        // Reposition progress bar above new grid size
        positionProgressUI();

        try {
          await game.playLevelTransition();
          const current = gameState.currentLevel();
          const total = gameState.totalLevels();
          bar.setProgress(current, total);
          if (chapterLabel) chapterLabel.text = `${current} / ${total}`;
          if (ariaLiveRef) ariaLiveRef.textContent = `Chapter progress: ${current} of ${total}`;
          console.log('[GameScreen] Progress updated after transition:', current, '/', total);
        } catch (err) {
          console.error('[GameScreen] Level transition animation error:', err);
        }
      };

      // Position progress bar and label just above the tiles
      positionProgressUI();

      // Create CluePopup for levels 1-9 (Pixi-based)
      cluePopup = new CluePopup(gpuLoader);
      app.stage.addChild(cluePopup);

      // TEMPORARY DEBUG SUPPORT - Chapter Progress Fill Bar Ticket Only
      // TODO: Remove this block once real multi-level chapter progression is implemented
      // This debug logic allows testing progress bar states via URL params:
      // - ?debugLevel=N (0-10): simulates chapter progress
      // - ?debugProgressAnim=1: triggers fill animation
      const debugParams = getDebugParams();
      if (debugParams.debugLevel !== undefined) {
        gameState.setCurrentLevel(debugParams.debugLevel);
        bar.setProgress(debugParams.debugLevel, 10, false); // No animation on initial load
        console.log('[GameScreen] Debug: Set progress to', debugParams.debugLevel);
      } else {
        bar.setProgress(gameState.currentLevel(), gameState.totalLevels(), false); // No animation on initial load
      }

      if (debugParams.debugProgressAnim) {
        bar.playFillAnimation();
        console.log('[GameScreen] Debug: Playing fill animation');
      }
      // END TEMPORARY DEBUG SUPPORT

      // Update bar animation on every frame
      app.ticker.add(() => {
        bar.update();
      });

      // Create audio manager
      const manager = new GameAudioManager(coordinator.audio);
      setAudioManager(manager);

      // Wire game events to audio
      game.onGameEvent('tileRotated', () => {
        manager.playTileRotate();
      });

      game.onGameEvent('levelComplete', (payload) => {
        console.log('[GameScreen] Level complete!', payload);
        manager.playLevelComplete();

        // Note: Progress update is deferred until after level transition completes
        // This happens in the completionStart callback after playLevelTransition()
        gameState.incrementLevel();
        console.log('[GameScreen] Level complete, progress will update after transition');
      });

      // Landmark connected event (no sound - too noisy during gameplay)
      game.onGameEvent('landmarkConnected', (landmark) => {
        console.log('[GameScreen] Landmark connected:', landmark);
      });

      // Wire completion events - show CluePopup for levels 1-9, full overlay for chapter end (level 10)
      game.onGameEvent('completionStart', (clue, levelNumber) => {
        const isChapterEnd = levelNumber % 10 === 0; // Level 10, 20, 30, etc.
        console.log('[GameScreen] Level complete!', { levelNumber, isChapterEnd, clue });

        // Play news reveal sound
        manager.playNewsReveal();

        if (isChapterEnd) {
          // Chapter end (level 10, 20, etc.) - show full companion overlay
          if (!companionDialogueBox || !companionGroup || !darkOverlay) return;

          // Update clue text (reusing the same dialogue box)
          companionDialogueBox.setText(clue);

          // Show companion group again
          companionGroup.visible = true;
          companionGroup.x = app.screen.width + 400; // Reset to off-screen right
          companionGroup.alpha = 1;

          // Mark that we're showing completion clue (for dismiss handler)
          isShowingCompletionClue = true;

          // Start animation
          isCompanionAnimating = true;

          // Fade in dark overlay
          gsap.to(darkOverlay, {
            alpha: companionConfig.overlayAlpha,
            duration: companionConfig.overlayFadeInDuration / 1000,
            ease: 'power2.out',
          });

          // Slide companion in from right (same animation as intro)
          setTimeout(() => {
            gsap.to(companionGroup, {
              x: app.screen.width / 2,
              duration: companionConfig.slideInDuration / 1000,
              ease: companionConfig.slideInEasing,
              delay: 0.2,
              onComplete: () => {
                isCompanionAnimating = false;
                if (darkOverlay) {
                  darkOverlay.eventMode = 'static'; // Enable clicks
                }
                // Play dog bark after slide-in completes
                manager.playDogBark();
              },
            });
          }, companionConfig.slideInDelay);
        } else {
          // Regular level (1-9) - show lightweight Pixi CluePopup
          if (cluePopup) {
            manager.playDogPant();
            fadeOutProgressUI();

            // Calculate grid top position (game is centered, pivot at grid center)
            const gridPixelSize = game.getGridPixelSize();
            const gridTop = app.screen.height / 2 - gridPixelSize / 2;
            cluePopup.show(
              clue,
              app.screen.width,
              gridTop,
              gameTuning.cluePopup.displayDuration,
              () => {
                fadeInProgressUI();
                loadNextLevelWithTransition();
              }
            );
          }
        }
      });

      console.log('[GameScreen] City Lines game loaded');

      // Create companion dialogue group (reused for intro and completion)
      companionGroup = new Container();
      companionGroup.label = 'companion-dialogue-group';

      // Create dialogue box with text (store reference for reuse)
      companionDialogueBox = new DialogueBox(gpuLoader, app.screen.width, app.screen.height, 2.5);
      companionDialogueBox.setText("Hi there, let's solve some tile puzzles. Blah blah blah, New Jersey something, something.");
      companionDialogueBox.alpha = 1; // Make visible (constructor sets to 0)

      // Position dialogue box at center of screen
      companionDialogueBox.x = 0; // Relative to group
      companionDialogueBox.y = 0;
      companionGroup.addChild(companionDialogueBox);

      // Create character - positioned relative to dialogue box (store reference for reuse)
      companionCharacter = new CompanionCharacter('news_hound', gpuLoader, 'full');
      companionCharacter.alpha = 1; // Make visible

      // Calculate character dimensions
      const charWidth = 222 * 0.8;   // 177.6px
      const charHeight = 243 * 0.8;  // 194.4px

      // Position character on left side, with 3/4 above dialogue box
      const dialogueBoxLeftEdge = -(companionDialogueBox.getWidth() / 2);
      companionCharacter.x = dialogueBoxLeftEdge + (charWidth / 2); // Left edge aligned
      companionCharacter.y = -companionDialogueBox.getHeight() - (charHeight * 0.25); // 3/4 above, 1/4 below

      // Add character BEFORE dialogue box (behind it)
      companionGroup.addChildAt(companionCharacter, 0);

      // Calculate vertical center offset for the group
      // Dialogue box bottom is at y=0, character top is at companionCharacter.y - charHeight/2
      const groupTop = companionCharacter.y - (charHeight / 2);
      const groupBottom = 0; // Dialogue box bottom
      const groupVerticalCenter = (groupTop + groupBottom) / 2;

      // Position group at center of screen, adjusted for group's vertical center
      companionGroup.x = app.screen.width / 2;
      companionGroup.y = app.screen.height / 2 - groupVerticalCenter;

      // Get companion animation settings from tuning
      const companionConfig = gameTuning.companion;

      // Add dark overlay (blocks clicks, positioned UNDER companion group)
      darkOverlay = new Graphics();
      darkOverlay.rect(0, 0, app.screen.width, app.screen.height);
      darkOverlay.fill({ color: 0x000000, alpha: 1.0 }); // Fill with solid black
      darkOverlay.alpha = 0; // Start transparent (animate this property)
      darkOverlay.eventMode = 'none'; // Start disabled, enable after animation completes
      darkOverlay.cursor = 'pointer';
      darkOverlay.on('pointertap', () => {
        // Prevent clicks during animation
        if (isCompanionAnimating || !darkOverlay) return;

        isCompanionAnimating = true;
        darkOverlay.eventMode = 'none'; // Disable further clicks

        // Dismiss dialogue with slide-left + fade animation
        gsap.to(companionGroup, {
          x: -400, // Slide off to the left
          alpha: 0, // Fade out
          duration: companionConfig.slideOutDuration / 1000,
          ease: companionConfig.slideOutEasing,
        });

        // Fade out dark overlay with completion callback
        gsap.to(darkOverlay, {
          alpha: 0,
          duration: companionConfig.overlayFadeOutDuration / 1000,
          ease: 'power2.in',
          onComplete: () => {
            if (companionGroup) {
              companionGroup.visible = false;
            }
            isCompanionAnimating = false;

            // If we were showing completion clue, generate and load a new level
            if (isShowingCompletionClue) {
              isShowingCompletionClue = false;
              loadNextLevelWithTransition();
            }
          },
        });
      });
      app.stage.addChild(darkOverlay);

      // Add companion group to stage ABOVE overlay (starts off-screen right)
      companionGroup.x = app.screen.width + 400; // Off-screen right
      companionGroup.y = app.screen.height / 2 - groupVerticalCenter; // Set initial y position
      companionGroup.alpha = 1;
      app.stage.addChild(companionGroup);

      // Animate group sliding in from right
      isCompanionAnimating = true;
      setTimeout(() => {
        // Fade in dark overlay
        gsap.to(darkOverlay, {
          alpha: companionConfig.overlayAlpha,
          duration: companionConfig.overlayFadeInDuration / 1000,
          ease: 'power2.out',
        });

        // Calculate target position
        const groupTop = companionCharacter.y - (charHeight / 2);
        const groupBottom = 0;
        const groupVerticalCenter = (groupTop + groupBottom) / 2;

        // Slide group from right
        gsap.to(companionGroup, {
          x: app.screen.width / 2,
          y: app.screen.height / 2 - groupVerticalCenter,
          duration: companionConfig.slideInDuration / 1000,
          ease: companionConfig.slideInEasing,
          delay: 0.2,
          onComplete: () => {
            // Enable clicks after animation completes
            isCompanionAnimating = false;
            if (darkOverlay) {
              darkOverlay.eventMode = 'static';
            }
            // Play dog bark after slide-in completes
            manager.playDogBark();
          },
        });
      }, companionConfig.slideInDelay);

      // Resize handler for responsive behavior
      resizeHandler = () => {
        // Auto-size game to new viewport dimensions
        game.autoSizeToViewport(
          app.screen.width,
          app.screen.height,
          gameTuning.grid.tileSize,  // max tile size from tuning
          80,        // reserved top (progress bar area)
          100        // reserved bottom (logo area)
        );

        // Re-center game
        game.x = app.screen.width / 2;
        game.y = app.screen.height / 2;

        // Reposition progress bar and chapter label
        positionProgressUI();

        // Update dark overlay size
        if (darkOverlay) {
          const currentAlpha = darkOverlay.alpha; // Preserve current alpha
          darkOverlay.clear();
          darkOverlay.rect(0, 0, app.screen.width, app.screen.height);
          darkOverlay.fill({ color: 0x000000, alpha: 1.0 }); // Always solid black
          darkOverlay.alpha = currentAlpha; // Restore alpha
        }

        // Update dialogue box dimensions
        companionDialogueBox.resize(app.screen.width, app.screen.height);

        // Recalculate character position relative to new dialogue box size
        const dialogueBoxLeftEdge = -(companionDialogueBox.getWidth() / 2);
        companionCharacter.x = dialogueBoxLeftEdge + (charWidth / 2);
        companionCharacter.y = -companionDialogueBox.getHeight() - (charHeight * 0.25);

        // Recalculate vertical center offset
        const groupTop = companionCharacter.y - (charHeight / 2);
        const groupBottom = 0;
        const groupVerticalCenter = (groupTop + groupBottom) / 2;

        // Reposition group at center
        if (companionGroup && companionGroup.visible) {
          companionGroup.x = app.screen.width / 2;
          companionGroup.y = app.screen.height / 2 - groupVerticalCenter;
        }
      };

      window.addEventListener('resize', resizeHandler);

      console.log('[GameScreen] Companion dialogue setup complete (reused for intro and completion)');
    }
  });

  // Track previous background color for comparison guard
  let prevBgColor = '';

  // Reactive: Background color changes
  createEffect(() => {
    const app = pixiApp();
    if (!app) return;

    const bgColor = tuning.game.visuals.backgroundColor;

    // Guard: Skip if unchanged
    if (bgColor === prevBgColor) return;

    prevBgColor = bgColor;
    app.renderer.background.color = bgColor;
  });

  // Track previous grid values for comparison guards
  let prevGridValues = { tileSize: -1, padding: -1, cellGap: -1 };

  // Reactive: Grid layout changes (tile size, padding, cell gap)
  // With stores, this effect only runs when grid values actually change
  createEffect(() => {
    const app = pixiApp();
    const game = gameInstance();
    if (!app || !game) return;

    const { tileSize, padding, cellGap } = tuning.game.grid;

    // Guard: Check what actually changed
    const tileSizeChanged = tileSize !== prevGridValues.tileSize;
    const layoutChanged = padding !== prevGridValues.padding || cellGap !== prevGridValues.cellGap;

    // Skip if nothing changed (can happen on initial mount)
    if (!tileSizeChanged && !layoutChanged) {
      return;
    }

    // Update previous values
    prevGridValues = { tileSize, padding, cellGap };

    // Only call the method that needs updating to avoid double updateLayout calls
    if (layoutChanged && tileSizeChanged) {
      // Both changed - call setGridLayout with animate=false, then setTileSize with animation
      // This prevents two competing animations
      game.setGridLayout(padding, cellGap, false);
      game.setTileSize(tileSize);
    } else if (layoutChanged) {
      game.setGridLayout(padding, cellGap);
    } else if (tileSizeChanged) {
      game.setTileSize(tileSize);
    }

    // Keep game at screen center (pivot is at grid center)
    game.x = app.screen.width / 2;
    game.y = app.screen.height / 2;

    console.log('[Tuning] Grid layout updated:', { tileSize, padding, cellGap });
  });

  // Track previous 9-slice values for comparison guards
  let prevNineSlice = { leftWidth: -1, topHeight: -1, rightWidth: -1, bottomHeight: -1 };

  // Reactive: 9-slice border changes
  // With stores, this effect only runs when nineSlice values actually change
  createEffect(() => {
    const game = gameInstance();
    if (!game) return;

    const { nineSlice } = tuning.game.grid;

    // Guard: Check if anything actually changed
    const changed =
      nineSlice.leftWidth !== prevNineSlice.leftWidth ||
      nineSlice.topHeight !== prevNineSlice.topHeight ||
      nineSlice.rightWidth !== prevNineSlice.rightWidth ||
      nineSlice.bottomHeight !== prevNineSlice.bottomHeight;

    if (!changed) return;

    prevNineSlice = { ...nineSlice };
    game.setNineSlice(nineSlice);
  });

  // Track previous rotation config for comparison guards
  let prevRotationConfig = { duration: -1, easing: '' };

  // Reactive: Rotation animation config changes
  createEffect(() => {
    const game = gameInstance();
    if (!game) return;

    const { tileRotateDuration, tileRotateEasing } = tuning.game.grid;

    // Guard: Skip if unchanged
    if (tileRotateDuration === prevRotationConfig.duration && tileRotateEasing === prevRotationConfig.easing) {
      return;
    }

    prevRotationConfig = { duration: tileRotateDuration, easing: tileRotateEasing };
    game.setRotationAnimationConfig({
      duration: tileRotateDuration,
      easing: tileRotateEasing,
    });
  });

  // Track previous VFX config for comparison guards
  let prevVfxConfig = { alpha: -1, sizePercent: -1 };

  // Reactive: VFX config changes
  createEffect(() => {
    const game = gameInstance();
    if (!game) return;

    const { rotateAlpha, rotateSizePercent } = tuning.game.grid.vfx;

    // Guard: Skip if unchanged
    if (rotateAlpha === prevVfxConfig.alpha && rotateSizePercent === prevVfxConfig.sizePercent) {
      return;
    }

    prevVfxConfig = { alpha: rotateAlpha, sizePercent: rotateSizePercent };
    game.setVfxConfig({
      alpha: rotateAlpha,
      sizePercent: rotateSizePercent,
    });
  });

  // Track previous completion paint config for comparison guards
  let prevCompletionPaint = { staggerDelay: -1, tileDuration: -1, blastSizePercent: -1 };

  // Reactive: Completion paint animation config changes
  createEffect(() => {
    const game = gameInstance();
    if (!game) return;

    const { staggerDelay, tileDuration, easing, blastSizePercent } = tuning.game.completionPaint;

    // Guard: Skip if unchanged
    if (
      staggerDelay === prevCompletionPaint.staggerDelay &&
      tileDuration === prevCompletionPaint.tileDuration &&
      blastSizePercent === prevCompletionPaint.blastSizePercent
    ) {
      return;
    }

    prevCompletionPaint = { staggerDelay, tileDuration, blastSizePercent };
    game.setCompletionPaintConfig({ staggerDelay, tileDuration, easing, blastSizePercent });
    console.log('[Tuning] Completion paint config updated:', { staggerDelay, tileDuration, blastSizePercent });
  });

  // Progress bar theme changes
  createEffect(() => {
    const bar = progressBar();
    if (!bar) return;

    const { tileTheme } = tuning.game.theme;
    const game = gameInstance();
    if (!game) return;

    // Get current county from level config (future: track active county)
    // For now, default to atlantic if not set
    const countyConfig = getCountyConfig('atlantic');
    bar.setTheme(countyConfig?.themeColor, tileTheme);

    console.log('[Tuning] Progress bar theme updated:', { tileTheme });
  });

  // Reactive: Audio volume changes
  createEffect(() => {
    const volume = audio.volume();
    coordinator.audio.setMasterVolume(volume);
    console.log('[Audio] Master volume updated:', volume);
  });

  // Reactive: Music enabled/disabled
  createEffect(() => {
    const manager = audioManager();
    if (!manager) return;

    if (audio.musicEnabled()) {
      manager.startMusic();
    } else {
      manager.stopMusic();
    }
  });

  // Function to regenerate current level with new config
  const regenerateLevel = () => {
    const game = gameInstance();
    const app = pixiApp();
    if (!game || !app) return;

    const newLevel = LevelGenerationService.generateLevel(
      currentLevel().levelNumber,
      tuning.game.generator
    );
    setCurrentLevel(newLevel);

    game.loadLevel(newLevel);

    // Auto-size to viewport (regenerated level may have different grid size)
    game.autoSizeToViewport(
      app.screen.width,
      app.screen.height,
      tuning.game.grid.tileSize,
      80,
      100
    );

    game.x = app.screen.width / 2;
    game.y = app.screen.height / 2;

    // Play level transition animation
    game.playLevelTransition().catch(err => {
      console.error('[GameScreen] Level transition animation error:', err);
    });

    console.log('[Generator] Level regenerated with new config');
  };

  // Expose regenerateLevel to window for Tweakpane button
  if (typeof window !== 'undefined') {
    (window as any).regenerateLevel = regenerateLevel;
  }

  onCleanup(() => {
    const app = pixiApp();
    if (app) {
      app.ticker.stop();
    }

    // Clean up resize listener
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
    }
  });

  return (
    <div class="fixed inset-0 bg-black">
      {/* Engine canvas container */}
      <div
        ref={containerRef}
        class="absolute inset-0"
      />

      {/* Accessibility: Screen reader announcements */}
      <div
        ref={ariaLiveRef}
        class="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        Chapter progress: {gameState.currentLevel()} of {gameState.totalLevels()}
      </div>

      {/* Pause overlay */}
      <PauseOverlay />

      {/* CluePopup is now Pixi-based, rendered in the Pixi stage */}

      {/* Wolf Games logo at bottom center */}
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2">
        <Logo />
      </div>

      {/* Level completion companion overlay is handled by Pixi (for chapter end only) */}
    </div>
  );
}
