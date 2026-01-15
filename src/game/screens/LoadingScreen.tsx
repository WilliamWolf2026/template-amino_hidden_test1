import { onMount, createSignal } from 'solid-js';
import { useScreen } from '~/scaffold/systems/screens';
import { useAssets } from '~/scaffold/systems/assets';
import { ProgressBar } from '~/scaffold/ui/ProgressBar';
import { Logo } from '~/scaffold/ui/Logo';

export function LoadingScreen() {
  const { goto } = useScreen();
  const { loadBoot, loadTheme } = useAssets();
  const [progress, setProgress] = createSignal(0);
  const [themeLoaded, setThemeLoaded] = createSignal(false);

  onMount(async () => {
    try {
      setProgress(20);
      await loadBoot();

      setProgress(60);
      await loadTheme();
      setThemeLoaded(true);

      setProgress(100);

      // Brief pause to show completion
      await new Promise((r) => setTimeout(r, 500));

      await goto('start');
    } catch (error) {
      console.error('Failed to load initial assets:', error);
    }
  });

  return (
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-black">
      <h1 class="text-4xl font-bold text-white mb-8">GAME</h1>
      <ProgressBar progress={progress()} label="Loading..." />

      {/* Logo at bottom center */}
      {themeLoaded() && (
        <div class="absolute bottom-8">
          <Logo class="opacity-50" />
        </div>
      )}
    </div>
  );
}
