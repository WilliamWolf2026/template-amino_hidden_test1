import { onMount, createSignal, Show } from 'solid-js';
import { useScreen } from '~/scaffold/systems/screens';
import { useAssets } from '~/scaffold/systems/assets';
import { useTuning, type ScaffoldTuning } from '~/scaffold';
import { Spinner } from '~/scaffold/ui/Spinner';
import { ProgressBar } from '~/scaffold/ui/ProgressBar';
import { Logo } from '~/scaffold/ui/Logo';
import { hasChapterInProgress, startChapter } from '~/game/services/progress';
import type { GameTuning } from '~/game/tuning';

export function LoadingScreen() {
  const { goto } = useScreen();
  const { loadBoot, loadTheme, initGpu, unlockAudio, loadCore, loadAudio } = useAssets();
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
    // Tuning panel checkbox
    if (tuning.game.devMode?.skipStartScreen) return true;
    // URL param: ?screen=game
    const params = new URLSearchParams(window.location.search);
    return params.get('screen') === 'game';
  };

  onMount(async () => {
    try {
      const resuming = hasChapterInProgress();
      const skipToGame = shouldSkipStartScreen();

      // Phase weights differ based on path:
      //   New game:  boot 0→5, theme 5→90, done 100
      //   Resuming / skip:  boot 0→5, theme 5→45, gpu 45→55, core 55→60, audio 60→95, done 100
      if (resuming || skipToGame) {
        await loadBoot(phaseProgress(0, 5));
        await loadTheme(phaseProgress(5, 45));
        setThemeLoaded(true);

        // Seed default progress when skipping with no saved chapter
        if (skipToGame && !resuming) {
          console.log('[LoadingScreen] Dev mode: skipping start screen, seeding default progress');
          startChapter({
            manifestUrl: '',
            chapterId: 'default',
            countyName: 'Dev County',
            chapterLength: 10,
          });
        } else {
          console.log('[LoadingScreen] Resuming saved progress, skipping start screen');
        }

        unlockAudio();
        setProgress(45);
        await initGpu();
        setProgress(55);
        await loadCore(phaseProgress(55, 60));
        // Load audio with graceful degradation
        try {
          await loadAudio(phaseProgress(60, 95));
        } catch (error) {
          console.warn('Audio loading failed (assets may not exist yet):', error);
        }
        setProgress(100);
        await new Promise((r) => setTimeout(r, 300));
        await goto('game');
      } else {
        await loadBoot(phaseProgress(0, 5));
        await loadTheme(phaseProgress(5, 90));
        setProgress(100);
        setThemeLoaded(true);

        // Brief pause to show completion
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
          <Spinner size="xl" />
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
