import { onMount, onCleanup, createEffect, createSignal } from 'solid-js';
import { Application, Graphics, Container, BlurFilter } from 'pixi.js';
import gsap from 'gsap';
import { useAssets } from '~/scaffold/systems/assets';
import { PauseOverlay, useTuning, type ScaffoldTuning } from '~/scaffold';
import { useAudio } from '~/scaffold/systems/audio';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { CityLinesGame, CompanionCharacter, DialogueBox, LevelGenerationService, getDifficultyForLevel, difficultyToGeneratorConfig } from '~/game/citylines';
import { getTileBundleName, type CityLinesTuning } from '~/game/tuning';
import { setAtlasName } from '~/game/citylines/utils/atlasHelper';
import { GameAudioManager } from '~/game/audio/manager';
import { ProgressBar } from '~/game/citylines/core/ProgressBar';
import { getCountyConfig } from '~/game/citylines/data/counties';
import { gameState } from '~/game/state';
import { getDebugParams } from '~/game/utils/debugParams';

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
  let isShowingCompletionClue = false; // Track if currently showing level completion

  // Helper: Generate level with progressive difficulty
  const generateLevelWithProgression = (levelNumber: number) => {
    const baseTuning = tuning.game();
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
    const gameTuning = tuning.game();

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

    // Load VFX bundle
    await coordinator.loadBundle('vfx-rotate');

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

      // Load generated level
      game.loadLevel(currentLevel());

      // Center the game on screen (pivot is at grid center, so position at screen center)
      game.x = app.screen.width / 2;
      game.y = app.screen.height / 2;

      app.stage.addChild(game);
      setGameInstance(game);

      // Create progress bar HUD
      const countyConfig = getCountyConfig(currentLevel().county);
      const barWidth = Math.min(320, app.screen.width - 48);
      const bar = new ProgressBar(gpuLoader, tileBundleName, {
        width: barWidth,
        height: 36,
        themeColor: countyConfig?.themeColor,
        tileTheme: tileTheme,
      });

      // Position at top with safe spacing
      bar.x = (app.screen.width - barWidth) / 2;
      bar.y = 24;
      app.stage.addChild(bar);
      setProgressBar(bar);

      // TEMPORARY DEBUG SUPPORT - Chapter Progress Fill Bar Ticket Only
      // TODO: Remove this block once real multi-level chapter progression is implemented
      // This debug logic allows testing progress bar states via URL params:
      // - ?debugLevel=N (0-10): simulates chapter progress
      // - ?debugProgressAnim=1: triggers fill animation
      const debugParams = getDebugParams();
      if (debugParams.debugLevel !== undefined) {
        gameState.setCurrentLevel(debugParams.debugLevel);
        bar.setProgress(debugParams.debugLevel, 10);
        console.log('[GameScreen] Debug: Set progress to', debugParams.debugLevel);
      } else {
        bar.setProgress(gameState.currentLevel(), gameState.totalLevels());
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

        // Update progress
        gameState.incrementLevel();
        const current = gameState.currentLevel();
        const total = gameState.totalLevels();
        bar.setProgress(current, total);

        // Announce to screen readers
        if (ariaLiveRef) {
          ariaLiveRef.textContent = `Chapter progress: ${current} of ${total}`;
        }

        console.log('[GameScreen] Progress updated:', current, '/', total);
        // Analytics would go here
      });

      // landmarkConnected has no sound per GDD (future: news reveal)
      game.onGameEvent('landmarkConnected', (landmark) => {
        console.log('[GameScreen] Landmark connected:', landmark);
      });

      // Wire completion events - reuse companion dialogue to show clue
      game.onGameEvent('completionStart', (clue) => {
        console.log('[GameScreen] Level complete! Showing companion with clue:', clue);

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
            },
          });
        }, companionConfig.slideInDelay);
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

        // Fade out dark overlay
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
              const controller = game.getCompletionController();
              controller.continue();

              // Generate new level with progressive difficulty
              const newLevel = generateLevelWithProgression(
                currentLevel().levelNumber + 1
              );
              setCurrentLevel(newLevel);

              game.loadLevel(newLevel);
              game.x = app.screen.width / 2;
              game.y = app.screen.height / 2;

              // Play level transition animation
              game.playLevelTransition().catch(err => {
                console.error('[GameScreen] Level transition animation error:', err);
              });
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
          },
        });
      }, companionConfig.slideInDelay);

      // Resize handler for responsive behavior
      resizeHandler = () => {
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

  // Reactive: Background color changes
  createEffect(() => {
    const app = pixiApp();
    if (!app) return;

    const bgColor = tuning.game().visuals.backgroundColor;
    app.renderer.background.color = bgColor;
  });

  // Reactive: Grid layout changes (tile size, padding, cell gap)
  createEffect(() => {
    const app = pixiApp();
    const game = gameInstance();
    if (!app || !game) return;

    const { tileSize, padding, cellGap } = tuning.game().grid;

    // Update game layout with animation (pivot updates automatically for center-based scaling)
    game.setTileSize(tileSize);
    game.setGridLayout(padding, cellGap);

    // Keep game at screen center (pivot is at grid center)
    game.x = app.screen.width / 2;
    game.y = app.screen.height / 2;

    console.log('[Tuning] Grid layout updated:', { tileSize, padding, cellGap });
  });

  // Reactive: 9-slice border changes
  createEffect(() => {
    const game = gameInstance();
    if (!game) return;

    const { nineSlice } = tuning.game().grid;
    game.setNineSlice(nineSlice);
  });

  // Reactive: Rotation animation config changes
  createEffect(() => {
    const game = gameInstance();
    if (!game) return;

    const { tileRotateDuration, tileRotateEasing } = tuning.game().grid;
    game.setRotationAnimationConfig({
      duration: tileRotateDuration,
      easing: tileRotateEasing,
    });
  });

  // Reactive: VFX config changes
  createEffect(() => {
    const game = gameInstance();
    if (!game) return;

    const { rotateAlpha, rotateSizePercent } = tuning.game().vfx;
    game.setVfxConfig({
      alpha: rotateAlpha,
      sizePercent: rotateSizePercent,
    });
  });

  // Progress bar theme changes
  createEffect(() => {
    const bar = progressBar();
    if (!bar) return;

    const { tileTheme } = tuning.game().theme;
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
      tuning.game().generator
    );
    setCurrentLevel(newLevel);

    game.loadLevel(newLevel);
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

      {/* Level completion companion is now handled by Pixi (completionCompanionGroup) */}
    </div>
  );
}
