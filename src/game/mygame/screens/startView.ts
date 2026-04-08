/**
 * Start Screen — Recipe Hunt
 *
 * Warm kitchen-themed start screen with scattered food emoji decorations.
 * DOM mode: skips initGpu, loads audio and core bundles.
 */

import type {
  StartScreenDeps,
  StartScreenController,
  SetupStartScreen,
} from '~/game/mygame-contract';

// ---------------------------------------------------------------------------
// Decorative food emoji scattered on background
// ---------------------------------------------------------------------------

const DECO_EMOJI = [
  '🍅', '🥕', '🧅', '🍳', '🥦', '🍋', '🧀', '🍗',
  '🍇', '🥑', '🍊', '🌽', '🍓', '🥚', '🫑', '🍌',
  '🥩', '🍞', '🍒', '🧈',
];

// ---------------------------------------------------------------------------
// Attract mode food emoji and recipe for demo
// ---------------------------------------------------------------------------

const ATTRACT_FOOD = [
  '🍅', '🥕', '🧅', '🍳', '🥦', '🍋',
  '🧀', '🍗', '🍇', '🥑', '🍊', '🌽',
];

const ATTRACT_RECIPE = ['🍅', '🥕', '🧅']; // "ingredients" to check off

export const setupStartScreen: SetupStartScreen = (deps: StartScreenDeps): StartScreenController => {
  let wrapper: HTMLDivElement | null = null;
  let styleEl: HTMLStyleElement | null = null;
  let idleTimer: number | null = null;
  let attractActive = false;
  let attractContainer: HTMLDivElement | null = null;
  let attractInterval: number | null = null;
  let attractStep = 0;
  const IDLE_DELAY_MS = 10_000;

  function resetIdleTimer(): void {
    if (idleTimer !== null) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
    if (attractActive) {
      exitAttractMode();
    }
    idleTimer = window.setTimeout(() => {
      enterAttractMode();
    }, IDLE_DELAY_MS);
  }

  function enterAttractMode(): void {
    if (attractActive || !wrapper) return;
    attractActive = true;
    attractStep = 0;

    attractContainer = document.createElement('div');
    attractContainer.style.cssText =
      'position:absolute;inset:0;z-index:5;pointer-events:none;' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
      'animation:rhFadeInAttract 0.5s ease-out;';

    // Mini grid of food emoji
    const grid = document.createElement('div');
    grid.style.cssText =
      'display:grid;grid-template-columns:repeat(4,48px);gap:10px;' +
      'margin-bottom:24px;';
    const gridItems: HTMLDivElement[] = [];
    for (const emoji of ATTRACT_FOOD) {
      const cell = document.createElement('div');
      cell.textContent = emoji;
      cell.style.cssText =
        'font-size:2rem;width:48px;height:48px;display:flex;align-items:center;' +
        'justify-content:center;border-radius:50%;' +
        'background:radial-gradient(ellipse at 35% 35%,rgba(255,245,225,0.9),rgba(210,168,110,0.4));' +
        'box-shadow:0 2px 6px rgba(107,58,31,0.15);transition:all 0.4s ease;';
      grid.appendChild(cell);
      gridItems.push(cell);
    }
    attractContainer.appendChild(grid);

    // Mini recipe card
    const miniCard = document.createElement('div');
    miniCard.style.cssText =
      'background:#FFFDF7;border:2px solid #8B6F47;border-radius:10px;' +
      'padding:8px 16px;box-shadow:0 4px 12px rgba(107,58,31,0.12);' +
      'display:flex;gap:12px;font-size:1.2rem;margin-bottom:16px;';
    const recipeChecks: HTMLSpanElement[] = [];
    for (const emoji of ATTRACT_RECIPE) {
      const item = document.createElement('span');
      item.innerHTML = `${emoji} <span style="color:#ccc;font-weight:bold">&#x2610;</span>`;
      item.style.cssText = 'display:flex;align-items:center;gap:4px;transition:all 0.3s ease;';
      miniCard.appendChild(item);
      recipeChecks.push(item);
    }
    attractContainer.appendChild(miniCard);

    // Hand pointer
    const hand = document.createElement('div');
    hand.textContent = '\uD83D\uDC46';
    hand.style.cssText =
      'position:absolute;font-size:2rem;z-index:6;pointer-events:none;' +
      'transition:all 0.6s ease;opacity:0;';
    attractContainer.appendChild(hand);

    wrapper.appendChild(attractContainer);

    // Simulate taps every 2 seconds
    let recipeIdx = 0;
    attractInterval = window.setInterval(() => {
      if (!attractActive || attractStep >= ATTRACT_FOOD.length) {
        // Loop: reset
        attractStep = 0;
        recipeIdx = 0;
        for (const cell of gridItems) {
          cell.style.transform = 'scale(1)';
          cell.style.opacity = '1';
        }
        for (let i = 0; i < recipeChecks.length; i++) {
          recipeChecks[i]!.innerHTML = `${ATTRACT_RECIPE[i]} <span style="color:#ccc;font-weight:bold">&#x2610;</span>`;
        }
        return;
      }

      const targetCell = gridItems[attractStep];
      if (!targetCell) return;

      // Move hand to target
      const cellRect = targetCell.getBoundingClientRect();
      const containerRect = attractContainer!.getBoundingClientRect();
      hand.style.left = `${cellRect.left - containerRect.left + cellRect.width / 2 - 16}px`;
      hand.style.top = `${cellRect.bottom - containerRect.top}px`;
      hand.style.opacity = '1';

      // Pop the emoji
      setTimeout(() => {
        targetCell.style.transform = 'scale(1.4)';
        targetCell.style.opacity = '0';

        // Check off recipe ingredient if matching
        const targetEmoji = ATTRACT_FOOD[attractStep];
        if (recipeIdx < ATTRACT_RECIPE.length && targetEmoji === ATTRACT_RECIPE[recipeIdx]) {
          recipeChecks[recipeIdx]!.innerHTML =
            `${ATTRACT_RECIPE[recipeIdx]} <span style="color:#4CAF50;font-weight:bold">&#x2611;</span>`;
          recipeIdx++;
        }
      }, 400);

      attractStep++;
    }, 2000);
  }

  function exitAttractMode(): void {
    attractActive = false;
    if (attractInterval !== null) {
      clearInterval(attractInterval);
      attractInterval = null;
    }
    attractContainer?.remove();
    attractContainer = null;
    attractStep = 0;
  }

  return {
    backgroundColor: '#FFF8F0',

    init(container: HTMLDivElement) {
      // Inject keyframes
      styleEl = document.createElement('style');
      styleEl.textContent = `
        @keyframes rhFloat0 { from { transform: translateY(0); } to { transform: translateY(-18px); } }
        @keyframes rhFloat1 { from { transform: translateX(0); } to { transform: translateX(14px); } }
        @keyframes rhFloat2 { from { transform: translate(0,0); } to { transform: translate(10px,-12px); } }
        @keyframes rhBtnPulse {
          0%,100% { transform: scale(1); box-shadow: 0 4px 16px rgba(255,107,53,0.3); }
          50% { transform: scale(1.04); box-shadow: 0 6px 24px rgba(255,107,53,0.5); }
        }
        @keyframes rhFadeInAttract {
          from { opacity:0; }
          to { opacity:1; }
        }
      `;
      document.head.appendChild(styleEl);

      wrapper = document.createElement('div');
      wrapper.style.cssText =
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'height:100%;gap:24px;position:relative;overflow:hidden;' +
        'background:radial-gradient(ellipse at center, #FFF8F0 0%, #FFE0B2 100%);';

      // Scattered food emoji decorations
      const decoLayer = document.createElement('div');
      decoLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
      for (let i = 0; i < DECO_EMOJI.length; i++) {
        const el = document.createElement('div');
        const size = 20 + Math.random() * 20;
        el.textContent = DECO_EMOJI[i]!;
        el.style.cssText =
          `position:absolute;font-size:${size}px;opacity:0.25;` +
          `top:${5 + Math.random() * 90}%;left:${2 + Math.random() * 96}%;` +
          `animation:rhFloat${i % 3} ${4 + Math.random() * 5}s ease-in-out infinite alternate;` +
          'pointer-events:none;';
        decoLayer.appendChild(el);
      }
      wrapper.appendChild(decoLayer);

      // Warm wood-grain subtle overlay
      const woodOverlay = document.createElement('div');
      woodOverlay.style.cssText =
        'position:absolute;inset:0;pointer-events:none;opacity:0.03;' +
        'background:repeating-linear-gradient(90deg,transparent,transparent 40px,#8D6E63 40px,#8D6E63 41px);';
      wrapper.appendChild(woodOverlay);

      // Title — warm brown/orange gradient text
      const title = document.createElement('h1');
      title.textContent = 'Recipe Hunt';
      title.style.cssText =
        'font-size:3.4rem;font-weight:800;margin:0;' +
        'font-family:Georgia,"Times New Roman",serif;z-index:1;' +
        'background:linear-gradient(135deg,#6B3A1F 0%,#E85D3A 50%,#F5C842 100%);' +
        '-webkit-background-clip:text;-webkit-text-fill-color:transparent;' +
        'background-clip:text;' +
        'filter:drop-shadow(0 2px 4px rgba(107,58,31,0.25));' +
        'letter-spacing:-1px;';

      // Dish icon
      const dishIcon = document.createElement('div');
      dishIcon.textContent = '🍽️';
      dishIcon.style.cssText =
        'font-size:3.5rem;z-index:1;margin-top:-8px;' +
        'filter:drop-shadow(0 2px 6px rgba(107,58,31,0.2));';

      // Subtitle
      const subtitle = document.createElement('div');
      subtitle.textContent = 'Find the ingredients!';
      subtitle.style.cssText =
        'font-size:1.15rem;color:#8B6F47;font-family:Georgia,serif;z-index:1;' +
        'margin-top:-12px;font-style:italic;' +
        'text-shadow:0 1px 0 rgba(255,245,225,0.8);';

      // Play button — warm orange gradient, rounded pill
      const playBtn = document.createElement('button');
      playBtn.textContent = 'Play';
      playBtn.style.cssText =
        'font-size:1.5rem;font-weight:700;padding:18px 64px;border:none;border-radius:50px;' +
        'background:linear-gradient(135deg,#FF8A65,#E85D3A);color:#fff;cursor:pointer;' +
        'font-family:system-ui,sans-serif;z-index:1;letter-spacing:0.5px;' +
        'box-shadow:0 6px 20px rgba(232,93,58,0.35),inset 0 1px 0 rgba(255,255,255,0.25);' +
        'transition:transform 0.15s ease,box-shadow 0.15s ease;';
      playBtn.onmouseenter = () => {
        playBtn.style.transform = 'scale(1.06)';
        playBtn.style.boxShadow = '0 6px 24px rgba(255,107,53,0.5),inset 0 1px 0 rgba(255,255,255,0.2)';
      };
      playBtn.onmouseleave = () => {
        playBtn.style.transform = 'scale(1)';
        playBtn.style.boxShadow = '0 4px 16px rgba(255,107,53,0.3),inset 0 1px 0 rgba(255,255,255,0.2)';
      };

      playBtn.addEventListener('click', async () => {
        playBtn.disabled = true;
        playBtn.textContent = 'Loading...';
        playBtn.style.opacity = '0.7';
        playBtn.style.animation = '';

        // DOM mode: skip initGpu, just load audio/core
        deps.unlockAudio();
        try { await deps.loadCore(); } catch { /* core optional for DOM */ }
        try { await deps.loadAudio(); } catch { /* audio optional */ }
        deps.analytics.trackGameStart();
        deps.goto('game');
      }, { once: true });

      wrapper.append(title, dishIcon, subtitle, playBtn);
      container.appendChild(wrapper);

      // Start idle pulse on the button after 8 seconds
      setTimeout(() => {
        if (playBtn && !playBtn.disabled) {
          playBtn.style.animation = 'rhBtnPulse 2s ease-in-out infinite';
        }
      }, 8000);

      // Attract mode: start idle timer, reset on any user input
      const onUserInput = () => resetIdleTimer();
      container.addEventListener('pointerdown', onUserInput);
      container.addEventListener('keydown', onUserInput);
      container.addEventListener('pointermove', onUserInput);
      // Store cleanup reference
      (wrapper as HTMLDivElement & { _attractCleanup?: () => void })._attractCleanup = () => {
        container.removeEventListener('pointerdown', onUserInput);
        container.removeEventListener('keydown', onUserInput);
        container.removeEventListener('pointermove', onUserInput);
      };
      resetIdleTimer();
    },

    destroy() {
      // Clean up attract mode
      if (idleTimer !== null) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
      exitAttractMode();
      if (wrapper) {
        const cleanup = (wrapper as HTMLDivElement & { _attractCleanup?: () => void })._attractCleanup;
        cleanup?.();
      }
      styleEl?.remove();
      styleEl = null;
      wrapper?.remove();
      wrapper = null;
    },
  };
};
