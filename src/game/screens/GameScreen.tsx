import { onMount, onCleanup, createEffect, createSignal } from 'solid-js';
import { Application } from 'pixi.js';
import { useAssets } from '~/scaffold/systems/assets';
import { PauseOverlay, useTuning, type ScaffoldTuning } from '~/scaffold';
import { useAudio } from '~/scaffold/systems/audio';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { CityLinesGame, type LevelConfig } from '~/game/citylines';
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

    // Create City Lines game
    if (gpuLoader.hasSheet(tileBundleName)) {
      // Add background - fit height, maintain aspect ratio, center horizontally
      const background = gpuLoader.createSprite(tileBundleName, 'background.png');
      const scale = app.screen.height / background.texture.height;
      background.scale.set(scale);
      background.anchor.set(0.5);
      background.x = app.screen.width / 2;
      background.y = app.screen.height / 2;
      app.stage.addChild(background);

      const tileSize = gameTuning.grid.tileSize;
      const game = new CityLinesGame(gpuLoader, tileSize);

      // Sample level config - a solvable puzzle
      const sampleLevel: LevelConfig = {
        levelNumber: 1,
        gridSize: 4,
        county: 'atlantic',
        landmarks: [
          { type: 'diner', position: { row: 1, col: 1 } },
          { type: 'gas_station', position: { row: 2, col: 2 } },
        ],
        exits: [
          { position: { row: 0, col: 3 }, facingEdge: 'south' },
        ],
        roadTiles: [
          { type: 'straight', row: 1, col: 3, solutionRotation: 0, initialRotation: 90 },
          { type: 't_junction', row: 2, col: 3, solutionRotation: 180, initialRotation: 0 },
          { type: 'corner', row: 3, col: 3, solutionRotation: 270, initialRotation: 90 },
          { type: 'straight', row: 3, col: 2, solutionRotation: 90, initialRotation: 0 },
          { type: 'corner', row: 3, col: 1, solutionRotation: 0, initialRotation: 180 },
          { type: 'straight', row: 2, col: 1, solutionRotation: 0, initialRotation: 90 },
        ],
      };

      game.loadLevel(sampleLevel);

      // Center the game on screen (pivot is at grid center, so position at screen center)
      game.x = app.screen.width / 2;
      game.y = app.screen.height / 2;

      app.stage.addChild(game);
      setGameInstance(game);

      // Create progress bar HUD
      const countyConfig = getCountyConfig(sampleLevel.county);
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

      game.onGameEvent('levelComplete', () => {
        console.log('[GameScreen] Level complete!');
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
      });

      // landmarkConnected has no sound per GDD (future: news reveal)
      game.onGameEvent('landmarkConnected', (landmark) => {
        console.log('[GameScreen] Landmark connected:', landmark);
      });

      console.log('[GameScreen] City Lines game loaded');
    }
  });

  // Reactive: Background color changes
  createEffect(() => {
    const app = pixiApp();
    if (!app) return;

    const bgColor = tuning.game().visuals.backgroundColor;
    app.renderer.background.color = bgColor;
    console.log('[Tuning] Background color updated:', bgColor);
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

    console.log('[Tuning] Nine-slice updated:', nineSlice);
  });

  // Reactive: Rotation animation config changes
  createEffect(() => {
    const game = gameInstance();
    if (!game) return;

    const { tileRotateDuration, tileRotateEasing } = tuning.game().animation;
    game.setRotationAnimationConfig({
      duration: tileRotateDuration,
      easing: tileRotateEasing,
    });

    console.log('[Tuning] Rotation animation updated:', { tileRotateDuration, tileRotateEasing });
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

  onCleanup(() => {
    const app = pixiApp();
    if (app) {
      app.ticker.stop();
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
    </div>
  );
}
