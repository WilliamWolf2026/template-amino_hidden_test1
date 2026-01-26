import { Show } from 'solid-js';

/**
 * Circular frame overlay for level completion
 * CSS creates circular mask over character head sprite
 *
 * Positioned over Pixi character using absolute positioning
 * Character sprite is rendered in Pixi layer below this HTML overlay
 */
export interface CircularCharacterFrameProps {
  visible: boolean;
  /** Pixi character world position */
  characterPosition: { x: number; y: number };
}

export function CircularCharacterFrame(props: CircularCharacterFrameProps) {
  return (
    <Show when={props.visible}>
      {/* Circular mask positioned over Pixi character */}
      <div
        class="fixed z-45 pointer-events-none transition-opacity duration-300"
        style={{
          width: '120px',
          height: '120px',
          'border-radius': '50%',
          border: '4px solid white',
          'box-shadow': '0 4px 12px rgba(0,0,0,0.3)',
          left: `${props.characterPosition.x - 60}px`,
          top: `${props.characterPosition.y - 60}px`,
          overflow: 'hidden',
          'background-color': 'transparent',
        }}
      />
    </Show>
  );
}
