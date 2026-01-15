import { createSignal, Show, onMount, onCleanup } from 'solid-js';
import { Application } from 'pixi.js';
import { useScreen } from '~/scaffold/systems/screens';
import { useAssets } from '~/scaffold/systems/assets';
import { Button } from '~/scaffold/ui/Button';
import { ProgressBar } from '~/scaffold/ui/ProgressBar';
import { Logo } from '~/scaffold/ui/Logo';
import { gameState } from '~/game/state';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';

export function StartScreen() {
  const { goto } = useScreen();
  const { coordinator, initGpu, unlockAudio, loadCore, loadAudio } = useAssets();
  const [loading, setLoading] = createSignal(false);
  const [progress, setProgress] = createSignal(0);
  let containerRef: HTMLDivElement | undefined;
  let app: Application | null = null;

  // Initialize Pixi and show background
  onMount(async () => {
    if (!containerRef) return;

    await initGpu();

    app = new Application();
    await app.init({
      background: '#BCE083',
      resizeTo: containerRef,
    });
    containerRef.appendChild(app.canvas);

    // Load and display background
    await coordinator.loadBundle('tiles_citylines_v1');
    const gpuLoader = coordinator.getGpuLoader() as PixiLoader;

    if (gpuLoader?.hasSheet('tiles_citylines_v1')) {
      const background = gpuLoader.createSprite('tiles_citylines_v1', 'start_screen_background.png');
      background.width = app.screen.width;
      background.height = app.screen.height;
      app.stage.addChild(background);
    }
  });

  onCleanup(() => {
    if (app) {
      app.destroy(true, { children: true });
      app = null;
    }
  });

  const handleStart = async () => {
    setLoading(true);
    setProgress(0);

    try {
      unlockAudio();
      setProgress(10);

      await initGpu();
      setProgress(30);

      await loadCore();
      setProgress(60);

      await loadAudio();
      setProgress(90);

      gameState.reset();
      setProgress(100);

      await new Promise((r) => setTimeout(r, 200));
      await goto('game');
    } catch (error) {
      console.error('Failed to start game:', error);
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div class="fixed inset-0 bg-[#BCE083]">
      {/* Pixi canvas container */}
      <div ref={containerRef} class="absolute inset-0" />

      {/* UI overlay */}
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        {/* Logo area */}
        <div class="mb-12">
          <h1 class="text-6xl font-bold text-white tracking-tight drop-shadow-lg">GAME</h1>
          <p class="text-center text-gray-200 mt-2 drop-shadow">Production Scaffold</p>
        </div>

        {/* Start button or progress bar */}
        <Show
          when={!loading()}
          fallback={
            <ProgressBar progress={progress()} label="Loading game..." class="w-64" />
          }
        >
          <Button size="lg" onClick={handleStart} class="min-w-[200px]">
            Start Game
          </Button>
        </Show>

        {/* Logo at bottom center */}
        <div class="absolute bottom-8">
          <Logo class="opacity-50" />
        </div>
      </div>
    </div>
  );
}
