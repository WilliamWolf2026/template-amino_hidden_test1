/**
 * SimpleGame1 — Start screen view.
 *
 * Minimal "Play" button. Loads atlas-tiles-daily-dispatch before navigating to game.
 */

import type { AssetCoordinator } from '~/core/systems/assets';
import type { ScreenId } from '~/core/systems/screens/types';
import type { ScaffoldTuning } from '~/core';
import type { GameTuning } from '~/game/tuning';

const ATLAS_BUNDLE = 'atlas-tiles-daily-dispatch';

interface StartScreenDeps {
  goto: (screen: ScreenId) => void | Promise<void>;
  coordinator: AssetCoordinator;
  initGpu: () => Promise<void>;
  unlockAudio: () => void;
  loadBundle: (name: string, onProgress?: (p: number) => void) => Promise<void>;
  loadCore: (onProgress?: (p: number) => void) => Promise<void>;
  loadAudio: (onProgress?: (p: number) => void) => Promise<void>;
  tuning: { scaffold: ScaffoldTuning; game: GameTuning };
  analytics: { trackGameStart: () => void };
}

interface StartScreenController {
  init: (container: HTMLDivElement) => void;
  destroy: () => void;
  backgroundColor: string;
}

export function setupStartScreen(deps: StartScreenDeps): StartScreenController {
  let wrapper: HTMLDivElement | null = null;

  return {
    backgroundColor: '#BCE083',

    init(container: HTMLDivElement) {
      wrapper = document.createElement('div');
      wrapper.style.cssText =
        'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:24px;';

      const title = document.createElement('h1');
      title.textContent = 'Simple Game 1';
      title.style.cssText =
        'font-size:2.5rem;font-weight:700;color:#2d5016;margin:0;font-family:system-ui,sans-serif;';

      const playBtn = document.createElement('button');
      playBtn.textContent = 'Play';
      playBtn.style.cssText =
        'font-size:1.25rem;font-weight:600;padding:14px 48px;border:none;border-radius:12px;' +
        'background:#4a8c1c;color:#fff;cursor:pointer;font-family:system-ui,sans-serif;' +
        'box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:transform 0.1s,box-shadow 0.1s;';
      playBtn.onmouseenter = () => { playBtn.style.transform = 'scale(1.05)'; };
      playBtn.onmouseleave = () => { playBtn.style.transform = 'scale(1)'; };

      playBtn.addEventListener('click', async () => {
        playBtn.disabled = true;
        playBtn.textContent = 'Loading...';
        await deps.initGpu();
        deps.unlockAudio();
        await deps.loadBundle(ATLAS_BUNDLE);
        await deps.loadCore();
        try {
          await deps.loadAudio();
        } catch {
          /* audio optional */
        }
        deps.analytics.trackGameStart();
        deps.goto('game');
      }, { once: true });

      wrapper.append(title, playBtn);
      container.append(wrapper);
    },

    destroy() {
      wrapper?.remove();
      wrapper = null;
    },
  };
}
