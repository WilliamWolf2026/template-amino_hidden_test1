import { onMount, onCleanup, createEffect, createSignal } from 'solid-js';
import { Application } from 'pixi.js';
import { useAssets } from '~/scaffold/systems/assets';
import { PauseOverlay, useTuning, type ScaffoldTuning } from '~/scaffold';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { CityLinesGame, sampleLevel } from '~/game/citylines';
import type { CityLinesTuning } from '~/game/tuning';
import { CompletionOverlay } from './components';

export function GameScreen() {
  const { coordinator } = useAssets();
  const tuning = useTuning<ScaffoldTuning, CityLinesTuning>();
  let containerRef: HTMLDivElement | undefined;

  // Store references for reactive updates
  const [pixiApp, setPixiApp] = createSignal<Application | null>(null);
  const [gameInstance, setGameInstance] = createSignal<CityLinesGame | null>(null);

  // Completion overlay state
  const [overlayOpen, setOverlayOpen] = createSignal(false);
  const [clueText, setClueText] = createSignal('');
  const [celebrationImageUrl, setCelebrationImageUrl] = createSignal<string | undefined>();
  const [canContinue, setCanContinue] = createSignal(false);

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

    // Load game tiles bundle
    await coordinator.loadBundle('tiles_citylines_v1');

    // Create City Lines game
    if (gpuLoader.hasSheet('tiles_citylines_v1')) {
      // Add background stretched to fill screen
      const background = gpuLoader.createSprite('tiles_citylines_v1', 'background.png');
      background.width = app.screen.width;
      background.height = app.screen.height;
      app.stage.addChild(background);

      const tileSize = gameTuning.grid.tileSize;
      const game = new CityLinesGame(gpuLoader, tileSize);

      // Load sample level
      game.loadLevel(sampleLevel);

      // Center the game on screen
      const gridPixelSize = game.getGridPixelSize();
      game.x = (app.screen.width - gridPixelSize) / 2;
      game.y = (app.screen.height - gridPixelSize) / 2;

      app.stage.addChild(game);
      setGameInstance(game);

      // Wire completion events
      game.onGameEvent('completionStart', (clue) => {
        setOverlayOpen(true);
        setClueText(clue);
        setCanContinue(false);

        const config = game.getCurrentLevelConfig();
        setCelebrationImageUrl(config?.celebrationImageUrl);
      });

      game.onGameEvent('clueTimerEnd', () => {
        setCanContinue(true);
      });

      game.onGameEvent('completionEnd', () => {
        setOverlayOpen(false);
      });

      game.onGameEvent('levelComplete', (payload) => {
        console.log('[GameScreen] Level complete!', payload);
        // Analytics would go here
      });

      console.log('[GameScreen] City Lines game loaded');
    }
  });

  // Handle continue button
  const handleContinue = () => {
    const game = gameInstance();
    if (!game) return;

    const controller = game.getCompletionController();
    controller.continue();

    // Reset the same level
    game.loadLevel(sampleLevel);

    // Re-center game
    const app = pixiApp();
    if (app) {
      const gridPixelSize = game.getGridPixelSize();
      game.x = (app.screen.width - gridPixelSize) / 2;
      game.y = (app.screen.height - gridPixelSize) / 2;
    }
  };

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

    // Update game layout with animation
    game.setTileSize(tileSize);
    game.setGridLayout(padding, cellGap);

    // Re-center the game using calculated grid size
    const gridPixelSize = game.getGridPixelSize();
    game.x = (app.screen.width - gridPixelSize) / 2;
    game.y = (app.screen.height - gridPixelSize) / 2;
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

    const { tileRotateDuration, tileRotateEasing } = tuning.game().animation;
    game.setRotationAnimationConfig({
      duration: tileRotateDuration,
      easing: tileRotateEasing,
    });
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

      {/* Pause overlay */}
      <PauseOverlay />

      {/* Completion overlay */}
      <CompletionOverlay
        open={overlayOpen()}
        clueText={clueText()}
        celebrationImageUrl={celebrationImageUrl()}
        canContinue={canContinue()}
        onContinue={handleContinue}
      />
    </div>
  );
}
