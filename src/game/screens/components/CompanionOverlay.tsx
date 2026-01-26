import { Show, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import type { DialogueMessage } from '~/game/citylines';

/**
 * HTML overlay for companion character dialogue
 * Handles text display, tap-to-advance, keyboard controls
 *
 * Positioned based on mode:
 * - 'full': Bottom of screen (above dialogue box sprite)
 * - 'circular': Center of screen (for level completion)
 */
export interface CompanionOverlayProps {
  open: boolean;
  messages: DialogueMessage[];
  currentIndex: number;
  mode: 'full' | 'circular';
  onAdvance: () => void;
  onComplete: () => void;
  darkenBackground?: boolean;
}

export function CompanionOverlay(props: CompanionOverlayProps) {
  // Text visibility for animation
  const [textVisible, setTextVisible] = createSignal(false);

  // Current message helper
  const currentMessage = () => props.messages[props.currentIndex];
  const isLastMessage = () => props.currentIndex >= props.messages.length - 1;

  // Show text with slight delay after overlay opens
  createEffect(() => {
    if (props.open) {
      setTimeout(() => setTextVisible(true), 100);
    } else {
      setTextVisible(false);
    }
  });

  // Handle advance (tap or keyboard)
  const handleAdvance = () => {
    if (!props.open) return;

    if (isLastMessage()) {
      props.onComplete();
    } else {
      // Reset text visibility for next message
      setTextVisible(false);
      setTimeout(() => {
        props.onAdvance();
        setTextVisible(true);
      }, 100);
    }
  };

  // Keyboard support (Space or Enter to advance)
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!props.open) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleAdvance();
    }
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <Show when={props.open}>
      {/* Background darkening */}
      <Show when={props.darkenBackground ?? true}>
        <div class="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
      </Show>

      {/* Text overlay */}
      <div
        class={`fixed inset-0 z-50 flex ${
          props.mode === 'circular'
            ? 'items-center justify-center'
            : 'items-end justify-center pb-24'
        } px-4`}
        onClick={handleAdvance}
        style={{ cursor: 'pointer' }}
      >
        <div class="w-full max-w-[600px] px-8 py-6 transition-opacity duration-200"
             style={{ opacity: textVisible() ? 1 : 0 }}>
          {/* Speaker name (optional) */}
          <Show when={currentMessage()?.speaker}>
            <p class="text-sm font-bold text-yellow-300 mb-2">
              {currentMessage()?.speaker}
            </p>
          </Show>

          {/* Message text */}
          <p class={`text-white leading-relaxed ${
            props.mode === 'circular' ? 'text-base' : 'text-lg'
          }`}>
            {currentMessage()?.text}
          </p>

          {/* Tap indicator */}
          <div class="flex justify-end mt-3">
            <span class="text-gray-300 text-sm animate-pulse">
              {isLastMessage() ? '✓ Close' : '▶ Tap to continue'}
            </span>
          </div>
        </div>
      </div>
    </Show>
  );
}
