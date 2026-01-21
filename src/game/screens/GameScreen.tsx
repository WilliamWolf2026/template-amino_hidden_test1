import { onMount, onCleanup, createEffect, createSignal } from 'solid-js';
import { Application } from 'pixi.js';
import { useAssets } from '~/scaffold/systems/assets';
import { PauseOverlay, useTuning, type ScaffoldTuning } from '~/scaffold';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { CityLinesGame, type LevelConfig } from '~/game/citylines';
import type { CityLinesTuning } from '~/game/tuning';

export function GameScreen() {
  const { coordinator } = useAssets();
  const tuning = useTuning<ScaffoldTuning, CityLinesTuning>();
  let containerRef: HTMLDivElement | undefined;

  // Store references for reactive updates
  const [pixiApp, setPixiApp] = createSignal<Application | null>(null);
  const [gameInstance, setGameInstance] = createSignal<CityLinesGame | null>(null);

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

      // Center the game on screen
      const gridPixelSize = sampleLevel.gridSize * tileSize;
      game.x = (app.screen.width - gridPixelSize) / 2;
      game.y = (app.screen.height - gridPixelSize) / 2;

      app.stage.addChild(game);
      setGameInstance(game);

      // Listen for level complete
      game.onGameEvent('levelComplete', () => {
        console.log('[GameScreen] Level complete!');
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

    // Update game layout with animation
    game.setTileSize(tileSize);
    game.setGridLayout(padding, cellGap);

    // Re-center the game using calculated grid size
    const gridPixelSize = game.getGridPixelSize();
    game.x = (app.screen.width - gridPixelSize) / 2;
    game.y = (app.screen.height - gridPixelSize) / 2;

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
    </div>
  );
}
