import { onMount, onCleanup, Show, createEffect, createSignal, untrack } from 'solid-js';
import { Pane } from 'tweakpane';
import { useTuning } from '../systems/tuning/context';
import { bindTuningToPane, addPresetControls } from './bindings';
import type { ScaffoldTuning, GameTuningBase } from '../systems/tuning/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PaneInstance = Pane & any;

// Only show in development mode
const SHOW_TUNING_PANEL = import.meta.env.DEV;

// Global keyboard listener for backtick toggle
const [isPanelOpen, setIsPanelOpen] = createSignal(false);

if (typeof window !== 'undefined' && SHOW_TUNING_PANEL) {
  window.addEventListener('keydown', (e) => {
    if (e.key === '`') {
      e.preventDefault();
      setIsPanelOpen((prev) => !prev);
    }
  });
}

export { isPanelOpen, setIsPanelOpen };

interface TuningPanelProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export default function TuningPanel<G extends GameTuningBase = GameTuningBase>(
  props: TuningPanelProps
) {
  let containerRef: HTMLDivElement | undefined;
  let pane: PaneInstance | undefined;
  const tuning = useTuning<ScaffoldTuning, G>();

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  onMount(() => {
    if (!SHOW_TUNING_PANEL || !containerRef) return;

    pane = new Pane({
      container: containerRef,
      title: 'Tuning',
    });

    let hasInitialized = false;

    // Wait for tuning to load before binding (only once)
    createEffect(() => {
      const isLoaded = tuning.isLoaded();

      if (isLoaded && pane && !hasInitialized) {
        hasInitialized = true;

        // Use untrack to prevent re-running when tuning values change
        untrack(() => {
          // Show load source info
          const source = tuning.source();
          pane.addBinding(
            { source: `Scaffold: ${source.scaffold}, Game: ${source.game}` },
            'source',
            { label: 'Loaded from', disabled: true }
          );

          // Bind tuning values
          bindTuningToPane(pane, tuning, {
            onChange: () => {
              // Auto-save on change
              tuning.save();
            },
          });

          // Add preset controls
          addPresetControls(pane, tuning);
        });
      }
    });
  });

  onCleanup(() => {
    pane?.dispose();
  });

  return (
    <Show when={SHOW_TUNING_PANEL}>
      <div
        class={`fixed z-[9999] ${positionClasses[props.position || 'top-right']}`}
        style={{ display: isPanelOpen() ? 'block' : 'none' }}
      >
        <div ref={containerRef} />
        <div class="mt-2 text-xs text-gray-400 text-right">Press ` to toggle</div>
      </div>
    </Show>
  );
}
