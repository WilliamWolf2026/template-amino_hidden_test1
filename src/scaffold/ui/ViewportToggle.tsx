import { useTuning, type ScaffoldTuning, type ViewportMode } from '~/scaffold';

const MODES: ViewportMode[] = ['small', 'large', 'none'];

const MODE_LABELS: Record<ViewportMode, string> = {
  small: 'S',
  large: 'L',
  none: '∞',
};

const MODE_TITLES: Record<ViewportMode, string> = {
  small: 'Small (430px phone)',
  large: 'Large (768px tablet)',
  none: 'None (full desktop)',
};

export function ViewportToggle() {
  const tuning = useTuning<ScaffoldTuning>();
  const mode = () => tuning.scaffold.viewport?.mode ?? 'small';

  const cycle = () => {
    const currentIndex = MODES.indexOf(mode());
    const nextMode = MODES[(currentIndex + 1) % MODES.length];
    tuning.setScaffoldPath('viewport.mode', nextMode);
    tuning.save();
  };

  return (
    <button
      class="w-9 h-9 flex items-center justify-center rounded-lg bg-black/40 text-white text-sm font-bold cursor-pointer border border-white/20 hover:bg-black/60 transition-colors duration-150"
      onClick={cycle}
      title={MODE_TITLES[mode()]}
      aria-label={`Viewport: ${MODE_TITLES[mode()]}. Click to cycle.`}
    >
      {MODE_LABELS[mode()]}
    </button>
  );
}
