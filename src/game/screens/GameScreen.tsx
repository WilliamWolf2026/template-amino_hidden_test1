import { onMount, onCleanup, createSignal } from 'solid-js';
import { Application, TilingSprite, type Texture } from 'pixi.js';
import { useAssets } from '~/scaffold/systems/assets';
import { PauseOverlay, pauseState } from '~/scaffold';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';

export function GameScreen() {
  const { coordinator } = useAssets();
  let containerRef: HTMLDivElement | undefined;
  let app: Application | null = null;

  const [engineReady, setEngineReady] = createSignal(false);

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

    // Load and create tiling water background
    const gpuLoader = coordinator.getGpuLoader() as PixiLoader;

    if (gpuLoader && gpuLoader.hasSheet('animation-water')) {
      try {
        // Get all frame textures for animation
        const frameNames = [
          'caust_001.png', 'caust_002.png', 'caust_003.png', 'caust_004.png',
          'caust_005.png', 'caust_006.png', 'caust_007.png', 'caust_008.png',
          'caust_009.png', 'caust_010.png', 'caust_011.png', 'caust_012.png',
          'caust_013.png', 'caust_014.png', 'caust_015.png', 'caust_016.png',
        ];
        const frames: Texture[] = frameNames.map((name) =>
          gpuLoader.getTexture('animation-water', name)
        );

        // Create tiling sprite with first frame
        const tilingBg = new TilingSprite({
          texture: frames[0],
          width: app.screen.width,
          height: app.screen.height,
        });
        app.stage.addChild(tilingBg);

        // Animate through frames
        let frameIndex = 0;
        let frameTime = 0;
        const frameDelay = 1 / 24; // 24 fps

        app.ticker.add((ticker) => {
          if (pauseState.paused()) return;

          frameTime += ticker.deltaTime / 60;
          if (frameTime >= frameDelay) {
            frameTime = 0;
            frameIndex = (frameIndex + 1) % frames.length;
            tilingBg.texture = frames[frameIndex];
          }
        });

        console.log('[GameScreen] Tiling water background added');
      } catch (err) {
        console.error('[GameScreen] Failed to create water background:', err);
      }
    }

    setEngineReady(true);

    // Demo: Add something to show it's working
    const graphics = new (await import('pixi.js')).Graphics();
    graphics.circle(app.screen.width / 2, app.screen.height / 2, 50);
    graphics.fill(0x6366f1);
    app.stage.addChild(graphics);

    // Demo animation
    app.ticker.add((ticker) => {
      if (!pauseState.paused()) {
        graphics.rotation += 0.01 * ticker.deltaTime;
      }
    });
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
