import { onMount, createSignal } from 'solid-js';
import { useScreen } from '~/scaffold/systems/screens';
import { useAssets } from '~/scaffold/systems/assets';
import { Spinner } from '~/scaffold/ui/Spinner';
import { ProgressBar } from '~/scaffold/ui/ProgressBar';
import { Logo } from '~/scaffold/ui/Logo';

export function LoadingScreen() {
  const { goto } = useScreen();
  const { loadBoot, loadTheme } = useAssets();
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

      await goto('start');
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
