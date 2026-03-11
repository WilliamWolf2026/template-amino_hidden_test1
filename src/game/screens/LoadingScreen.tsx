import { onMount, createSignal, Show } from 'solid-js';
import { Spinner } from '@wolfgames/components/solid';
import { useScreen } from '~/core/systems/screens';
import { useAssets } from '~/core/systems/assets';
import { useTuning, type ScaffoldTuning } from '~/core';
import { ProgressBar } from '~/core/ui/ProgressBar';
import { Logo } from '~/core/ui/Logo';
import type { GameTuning } from '~/game/tuning';

export function LoadingScreen() {
  const { goto } = useScreen();
  const { loadBoot, loadTheme, initGpu, unlockAudio, loadCore, loadAudio, loadBundle } = useAssets();
  const tuning = useTuning<ScaffoldTuning, GameTuning>();
  const [progress, setProgress] = createSignal(0);
  const [themeLoaded, setThemeLoaded] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Map a phase's 0→1 progress into a weighted range of the overall bar
  const phaseProgress = (phaseStart: number, phaseEnd: number) => {
    return (p: number) => setProgress(phaseStart + p * (phaseEnd - phaseStart));
  };

  /** Check if we should skip the start screen and go straight to gameplay */
  const shouldSkipStartScreen = (): boolean => {
    if (tuning.game.devMode?.skipStartScreen) return true;
    const params = new URLSearchParams(window.location.search);
    return params.get('screen') === 'game';
  };

  onMount(async () => {
    try {
      const skipToGame = shouldSkipStartScreen();

      if (skipToGame) {
        // Dev shortcut: skip start screen, load everything
        await loadBoot(phaseProgress(0, 5));
        await loadTheme(phaseProgress(5, 45));
        setThemeLoaded(true);

        unlockAudio();
        setProgress(45);
        await initGpu();
        setProgress(55);
        await loadBundle('atlas-tiles-daily-dispatch', phaseProgress(55, 60));
        await loadCore(phaseProgress(60, 65));
        try {
          await loadAudio(phaseProgress(65, 95));
        } catch (error) {
          console.warn('Audio loading failed:', error);
        }
        setProgress(100);
        await new Promise((r) => setTimeout(r, 300));
        await goto('game');
      } else {
        // Normal flow: load theme, go to start screen
        await loadBoot(phaseProgress(0, 5));
        await loadTheme(phaseProgress(5, 90));
        setProgress(100);
        setThemeLoaded(true);

        await new Promise((r) => setTimeout(r, 500));
        await goto('start');
      }
    } catch (err) {
      console.error('Failed to load initial assets:', err);
      setError('Failed to load game assets. Please check your connection and try again.');
    }
  });

  return (
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-[#BCE083]">
      <Show when={error()} fallback={
        <>
          <Spinner size="lg" class="w-24 h-24 text-gray-800" />
          <div class="mt-8 w-64">
            <ProgressBar progress={progress()} />
          </div>
        </>
      }>
        <div class="text-center max-w-sm px-6">
          <p class="text-lg font-semibold text-gray-800 mb-2">Unable to load</p>
          <p class="text-sm text-gray-600 mb-6">{error()}</p>
          <button
            onClick={() => window.location.reload()}
            class="px-6 py-3 bg-white text-gray-800 rounded-xl font-medium shadow-md hover:shadow-lg active:scale-95 transition-all"
          >
            Retry
          </button>
        </div>
      </Show>

      {/* Logo at bottom center */}
      {themeLoaded() && (
        <div class="absolute bottom-8">
          <Logo />
        </div>
      )}
    </div>
  );
}
