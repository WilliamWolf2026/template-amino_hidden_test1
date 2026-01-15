import { onMount, onCleanup } from 'solid-js';
import { Application } from 'pixi.js';
import { useAssets } from '~/scaffold/systems/assets';
import { PauseOverlay } from '~/scaffold';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { CityLinesGame, type LevelConfig } from '~/game/citylines';

export function GameScreen() {
  const { coordinator } = useAssets();
  let containerRef: HTMLDivElement | undefined;
  let app: Application | null = null;

  onMount(async () => {
    if (!containerRef) return;

    // Create Pixi application
    app = new Application();

    await app.init({
      background: '#1a1a2e',
      resizeTo: containerRef,
      antialias: true,
    });

    // Mount canvas
    containerRef.appendChild(app.canvas);

    const gpuLoader = coordinator.getGpuLoader() as PixiLoader;

    // Animated water background (commented out for now)
    // if (gpuLoader && gpuLoader.hasSheet('animation-water')) {
    //   try {
    //     const frameNames = [
    //       'caust_001.png', 'caust_002.png', 'caust_003.png', 'caust_004.png',
    //       'caust_005.png', 'caust_006.png', 'caust_007.png', 'caust_008.png',
    //       'caust_009.png', 'caust_010.png', 'caust_011.png', 'caust_012.png',
    //       'caust_013.png', 'caust_014.png', 'caust_015.png', 'caust_016.png',
    //     ];
    //     const frames: Texture[] = frameNames.map((name) =>
    //       gpuLoader.getTexture('animation-water', name)
    //     );
    //     const tilingBg = new TilingSprite({
    //       texture: frames[0],
    //       width: app.screen.width,
    //       height: app.screen.height,
    //     });
    //     app.stage.addChild(tilingBg);
    //     let frameIndex = 0;
    //     let frameTime = 0;
    //     const frameDelay = 1 / 24;
    //     app.ticker.add((ticker) => {
    //       if (pauseState.paused()) return;
    //       frameTime += ticker.deltaTime / 60;
    //       if (frameTime >= frameDelay) {
    //         frameTime = 0;
    //         frameIndex = (frameIndex + 1) % frames.length;
    //         tilingBg.texture = frames[frameIndex];
    //       }
    //     });
    //     console.log('[GameScreen] Tiling water background added');
    //   } catch (err) {
    //     console.error('[GameScreen] Failed to create water background:', err);
    //   }
    // }

    // Load game tiles bundle
    await coordinator.loadBundle('tiles_citylines_v1');

    // Create City Lines game
    if (gpuLoader.hasSheet('tiles_citylines_v1')) {
      const tileSize = 100;
      const game = new CityLinesGame(gpuLoader, tileSize);

      // Sample level config
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
        roadTiles: [],
      };

      game.loadLevel(sampleLevel);

      // Center the game on screen
      const gridPixelSize = sampleLevel.gridSize * tileSize;
      game.x = (app.screen.width - gridPixelSize) / 2;
      game.y = (app.screen.height - gridPixelSize) / 2;

      app.stage.addChild(game);

      // Listen for level complete
      game.onGameEvent('levelComplete', () => {
        console.log('[GameScreen] Level complete!');
      });

      console.log('[GameScreen] City Lines game loaded');
    }
  });

  onCleanup(() => {
    // Keep app cached for potential return (don't destroy)
    // If you want to destroy: app?.destroy(true, { children: true });
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
