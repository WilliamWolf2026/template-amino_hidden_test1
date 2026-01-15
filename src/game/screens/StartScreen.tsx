import { createSignal, Show, onMount } from 'solid-js';
import { useScreen } from '~/scaffold/systems/screens';
import { useAssets } from '~/scaffold/systems/assets';
import { Button } from '~/scaffold/ui/Button';
import { ProgressBar } from '~/scaffold/ui/ProgressBar';
import { Logo } from '~/scaffold/ui/Logo';
import { gameState } from '~/game/state';

export function StartScreen() {
  const { goto } = useScreen();
  const { initGpu, unlockAudio, loadCore, loadAudio } = useAssets();
  const [loading, setLoading] = createSignal(false);
  const [progress, setProgress] = createSignal(0);

  // Preload Pixi in background while user views start screen
  onMount(() => {
    initGpu();
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
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black">
      {/* Logo area */}
      <div class="mb-12">
        <h1 class="text-6xl font-bold text-white tracking-tight">GAME</h1>
        <p class="text-center text-gray-400 mt-2">Production Scaffold</p>
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
  );
}
