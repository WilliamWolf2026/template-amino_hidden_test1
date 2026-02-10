import { onMount, createSignal } from 'solid-js';
import { useScreen } from '~/scaffold/systems/screens';
import { useAssets } from '~/scaffold/systems/assets';
import { Spinner } from '~/scaffold/ui/Spinner';
import { ProgressBar } from '~/scaffold/ui/ProgressBar';
import { Logo } from '~/scaffold/ui/Logo';
import { hasChapterInProgress } from '~/game/services/progress';

export function LoadingScreen() {
  const { goto } = useScreen();
  const { loadBoot, loadTheme, initGpu, unlockAudio, loadCore, loadAudio } = useAssets();
  const [progress, setProgress] = createSignal(0);
  const [themeLoaded, setThemeLoaded] = createSignal(false);

  onMount(async () => {
    try {
      setProgress(10);
      await loadBoot();
      setProgress(50);
      await loadTheme();
      setProgress(100);
      setThemeLoaded(true);

      // Brief pause to show completion
      await new Promise((r) => setTimeout(r, 500));

      // Skip start screen and go directly to game if there's saved progress
      if (hasChapterInProgress()) {
        console.log('[LoadingScreen] Resuming saved progress, skipping start screen');
        // Initialize GPU, core, and audio assets (normally done in StartScreen)
        unlockAudio();
        await initGpu();
        await loadCore();
        // Load audio with graceful degradation
        try {
          await loadAudio();
        } catch (error) {
          console.warn('Audio loading failed (assets may not exist yet):', error);
        }
        await goto('game');
      } else {
        await goto('start');
      }
    } catch (error) {
      console.error('Failed to load initial assets:', error);
    }
  });

  return (
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-[#BCE083]">
      <Spinner size="xl" />
      <div class="mt-8 w-64">
        <ProgressBar progress={progress()} />
      </div>

      {/* Logo at bottom center */}
      {themeLoaded() && (
        <div class="absolute bottom-8">
          <Logo />
        </div>
      )}
    </div>
  );
}
