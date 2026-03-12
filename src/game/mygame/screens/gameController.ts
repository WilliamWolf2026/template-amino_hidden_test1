/**
 * Game Controller
 *
 * Creates and manages the Pixi.js game instance.
 * Called by screens/GameScreen.tsx — this is the bridge between Solid.js and Pixi.
 *
 * Implement your game logic here:
 * 1. Create a Pixi Application
 * 2. Build your scene graph
 * 3. Return signals and cleanup
 */

import { createSignal } from 'solid-js';
import type { AssetCoordinator } from '~/core/systems/assets';
import type { ScaffoldTuning } from '~/core';
import type { GameTuning } from '~/game/tuning';

interface GameControllerDeps {
  coordinator: AssetCoordinator;
  tuning: { scaffold: ScaffoldTuning; game: GameTuning };
  audio: unknown;
  gameData: unknown;
  analytics: unknown;
}

interface GameController {
  init: (container: HTMLDivElement) => void;
  destroy: () => void;
  ariaText: () => string;
}

export function setupGame(_deps: GameControllerDeps): GameController {
  const [ariaText, setAriaText] = createSignal('Game loading...');
  let wrapper: HTMLDivElement | null = null;

  return {
    init(container: HTMLDivElement) {
      console.log('[mygame] Game controller initialized');
      setAriaText('Gameplay Screen');

      wrapper = document.createElement('div');
      wrapper.style.cssText =
        'display:flex;align-items:center;justify-content:center;height:100%;';

      const label = document.createElement('h1');
      label.textContent = 'Gameplay Screen';
      label.style.cssText =
        'font-size:2.5rem;font-weight:700;color:#fff;margin:0;font-family:system-ui,sans-serif;';

      wrapper.append(label);
      container.append(wrapper);
    },

    destroy() {
      wrapper?.remove();
      wrapper = null;
      console.log('[mygame] Game controller destroyed');
    },

    ariaText,
  };
}
