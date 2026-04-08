/**
 * Game Controller — Recipe Hunt (DOM mode)
 *
 * Hidden-object game: find recipe ingredients among scattered food items.
 * Integrates pure engine with DOM rendering, game state signals,
 * meso-loop state machine, persistence, hint system, and macro loop.
 */

import type {
  GameControllerDeps,
  GameController,
  SetupGame,
} from '~/game/mygame-contract';
import { gameState } from '~/game/state';
import { pauseState } from '~/core/systems/pause/state';
import {
  generateLevelConfig,
  placeItems,
  step,
  tickTimer,
  calculateScore,
  calculateStars,
  estimateMaxScore,
  createMesoStateMachine,
  getTierName,
  type GameState as EngineState,
  type LevelConfig,
  type PlacedItem,
  type MesoStateMachine,
} from '../engine';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ITEM_SIZE = 52;
const MIN_SPACING = 56;
const HINT_IDLE_MS = 10_000;
const HINT_PULSE_DURATION_MS = 1500;

// Food emoji for confetti
const CONFETTI_EMOJI = [
  '🍅', '🥕', '🧅', '🥦', '🍋', '🧀', '🍗', '🍇',
  '🥑', '🍊', '🌽', '🍓', '🥚', '🫑', '🍌', '🍒',
];

// ---------------------------------------------------------------------------
// Persistence keys
// ---------------------------------------------------------------------------

const STORAGE_HIGHEST_LEVEL = 'recipeHunt_highestLevel';
const STORAGE_LEVEL_STARS = 'recipeHunt_levelStars';
const STORAGE_TOTAL_SCORE = 'recipeHunt_totalScore';
const STORAGE_COOKBOOK = 'recipeHunt_cookbook';

// ---------------------------------------------------------------------------
// Persistence helpers (pure reads/writes, no throw)
// ---------------------------------------------------------------------------

function loadNumber(key: string, fallback: number): number {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? Number(v) || fallback : fallback;
  } catch {
    return fallback;
  }
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveNumber(key: string, value: number): void {
  try { localStorage.setItem(key, String(value)); } catch { /* quota */ }
}

function saveJson(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

// ---------------------------------------------------------------------------
// setupGame
// ---------------------------------------------------------------------------

export const setupGame: SetupGame = (deps: GameControllerDeps): GameController => {
  let container: HTMLDivElement | null = null;
  let wrapper: HTMLDivElement | null = null;
  let styleEl: HTMLStyleElement | null = null;
  let timerHandle: number | null = null;
  let lastFrameTime = 0;
  let engineState: EngineState | null = null;
  let mesoMachine: MesoStateMachine = createMesoStateMachine();

  // Freeze-frame state (combo 3+ micro-pause)
  let freezeUntil = 0;

  // Hint system
  let lastSuccessfulTapTime = 0;
  let hintTimeoutHandle: number | null = null;
  let hintedItemId: string | null = null;

  // Persistence state (loaded on init)
  let highestLevel = 1;
  let levelStars: Record<number, number> = {};
  let totalScore = 0;
  let cookbook: string[] = [];

  // FTUE tutorial state
  const STORAGE_HAS_PLAYED = 'recipeHunt_hasPlayed';
  let tutorialActive = false;
  let tutorialStep = 0; // 0=not started, 1=tap-to-find, 2=check-recipe, 3=watch-timer, 4=free-play
  let tutorialOverlayEl: HTMLDivElement | null = null;
  let tutorialSkipBtn: HTMLButtonElement | null = null;
  let tutorialAutoSkipTimer: number | null = null;
  let tutorialDismissTimer: number | null = null;
  let tutorialCorrectTapCount = 0;

  // DOM references
  let timerBarFill: HTMLDivElement | null = null;
  let timerBarTrack: HTMLDivElement | null = null;
  let timerSecondsEl: HTMLSpanElement | null = null;
  let scoreEl: HTMLSpanElement | null = null;
  let comboEl: HTMLDivElement | null = null;
  let levelEl: HTMLSpanElement | null = null;
  let recipeCardEl: HTMLDivElement | null = null;
  let playAreaEl: HTMLDivElement | null = null;
  let overlayEl: HTMLDivElement | null = null;
  let itemElements: Map<string, HTMLDivElement> = new Map();

  // -----------------------------------------------------------------------
  // Persistence
  // -----------------------------------------------------------------------

  function loadProgress(): void {
    highestLevel = loadNumber(STORAGE_HIGHEST_LEVEL, 1);
    levelStars = loadJson<Record<number, number>>(STORAGE_LEVEL_STARS, {});
    totalScore = loadNumber(STORAGE_TOTAL_SCORE, 0);
    cookbook = loadJson<string[]>(STORAGE_COOKBOOK, []);
  }

  function saveProgress(): void {
    saveNumber(STORAGE_HIGHEST_LEVEL, highestLevel);
    saveJson(STORAGE_LEVEL_STARS, levelStars);
    saveNumber(STORAGE_TOTAL_SCORE, totalScore);
    saveJson(STORAGE_COOKBOOK, cookbook);
  }

  // -----------------------------------------------------------------------
  // Signal sync
  // -----------------------------------------------------------------------

  function syncSignals(): void {
    if (!engineState) return;
    gameState.setScore(engineState.score);
    gameState.setTimeRemaining(Math.ceil(engineState.timeRemaining));
    gameState.setIngredientsFound(engineState.found.length);
    gameState.setTotalIngredients(engineState.recipe.ingredients.length);
    gameState.setComboStreak(engineState.comboStreak);
    gameState.setMaxCombo(engineState.maxCombo);
    gameState.setStrikes(engineState.strikes);
    gameState.setTotalTaps(engineState.totalTaps);
    gameState.setCorrectTaps(engineState.correctTaps);
    gameState.setRecipeName(engineState.recipe.name);
    gameState.setDishEmoji(engineState.recipe.dishEmoji);
  }

  // -----------------------------------------------------------------------
  // HUD updates
  // -----------------------------------------------------------------------

  function updateTimerBar(): void {
    if (!engineState || !timerBarFill || !timerBarTrack) return;
    const pct = Math.max(0, (engineState.timeRemaining / engineState.config.timeLimit) * 100);
    timerBarFill.style.width = `${pct}%`;

    if (timerSecondsEl) {
      timerSecondsEl.textContent = `${Math.ceil(engineState.timeRemaining)}s`;
    }

    // Gradient from green -> orange -> red as time decreases
    if (pct > 60) {
      timerBarFill.style.background = 'linear-gradient(90deg,#6BCB77,#FFA94D)';
      timerBarFill.style.boxShadow = '0 1px 3px rgba(107,58,31,0.15)';
      timerBarTrack.style.animation = '';
    } else if (pct > 30) {
      timerBarFill.style.background = 'linear-gradient(90deg,#FFA94D,#FF8A65)';
      timerBarFill.style.boxShadow = '0 1px 4px rgba(255,169,77,0.3)';
      timerBarTrack.style.animation = '';
    } else if (engineState.timeRemaining <= 10) {
      timerBarFill.style.background = 'linear-gradient(90deg,#FF6B6B,#E53935)';
      timerBarFill.style.boxShadow = '0 1px 6px rgba(229,57,53,0.4)';
      timerBarTrack.style.animation = 'rhTimerPulse 0.5s ease-in-out infinite';
    } else {
      timerBarFill.style.background = 'linear-gradient(90deg,#FF8A65,#FF6B6B)';
      timerBarFill.style.boxShadow = '0 1px 4px rgba(255,107,107,0.3)';
      timerBarTrack.style.animation = '';
    }
  }

  function updateHUD(): void {
    if (!engineState) return;
    if (scoreEl) scoreEl.textContent = String(engineState.score);
    if (levelEl) {
      const tierName = getTierName(engineState.config.level);
      levelEl.textContent = `Level ${engineState.config.level} - ${tierName}`;
    }
    if (comboEl) {
      if (engineState.comboStreak >= 2) {
        comboEl.textContent = `x${engineState.comboStreak} Combo!`;
        comboEl.style.opacity = '1';
        comboEl.style.animation = 'rhComboIn 0.3s ease-out forwards';
        // Also trigger juice combo text
        showComboText(engineState.comboStreak);
      } else {
        comboEl.style.opacity = '0';
        comboEl.style.animation = '';
      }
    }
  }

  function updateRecipeCard(): void {
    if (!engineState || !recipeCardEl) return;
    const checkItems = recipeCardEl.querySelectorAll('[data-ingredient-id]');
    checkItems.forEach((el) => {
      const ingId = (el as HTMLElement).dataset.ingredientId;
      if (ingId && engineState!.found.includes(ingId)) {
        (el as HTMLElement).classList.add('rh-found');
      }
    });
  }

  // -----------------------------------------------------------------------
  // Hint system
  // -----------------------------------------------------------------------

  function resetHintTimer(): void {
    if (hintTimeoutHandle !== null) {
      clearTimeout(hintTimeoutHandle);
      hintTimeoutHandle = null;
    }
    clearHintPulse();
    lastSuccessfulTapTime = Date.now();

    if (engineState && engineState.status === 'playing') {
      hintTimeoutHandle = window.setTimeout(() => {
        showHintPulse();
      }, HINT_IDLE_MS);
    }
  }

  function showHintPulse(): void {
    if (!engineState || engineState.status !== 'playing') return;

    mesoMachine.transition('no_tap_for_10_seconds');

    // Find an unfound required item
    const unfoundItem = engineState.items.find(
      (i) => i.isRequired && !i.found && !engineState!.found.includes(i.ingredient.id),
    );
    if (!unfoundItem) return;

    hintedItemId = unfoundItem.id;
    const el = itemElements.get(unfoundItem.id);
    if (el) {
      el.classList.add('rh-hint-pulse');
    }

    // Remove pulse after duration and return to PLAYING
    setTimeout(() => {
      clearHintPulse();
      mesoMachine.transition('pulse_animation_done');
      // Re-arm the hint timer
      resetHintTimer();
    }, HINT_PULSE_DURATION_MS);
  }

  function clearHintPulse(): void {
    if (hintedItemId) {
      const el = itemElements.get(hintedItemId);
      if (el) {
        el.classList.remove('rh-hint-pulse');
      }
      hintedItemId = null;
    }
  }

  // -----------------------------------------------------------------------
  // FTUE Tutorial
  // -----------------------------------------------------------------------

  function isTutorialNeeded(): boolean {
    try {
      return localStorage.getItem(STORAGE_HAS_PLAYED) === null;
    } catch {
      return false;
    }
  }

  function completeTutorial(): void {
    tutorialActive = false;
    tutorialStep = 4;
    clearTutorialOverlay();
    try {
      localStorage.setItem(STORAGE_HAS_PLAYED, 'true');
    } catch { /* quota */ }
  }

  function clearTutorialOverlay(): void {
    if (tutorialAutoSkipTimer !== null) {
      clearTimeout(tutorialAutoSkipTimer);
      tutorialAutoSkipTimer = null;
    }
    if (tutorialDismissTimer !== null) {
      clearTimeout(tutorialDismissTimer);
      tutorialDismissTimer = null;
    }
    tutorialOverlayEl?.remove();
    tutorialOverlayEl = null;
    tutorialSkipBtn?.remove();
    tutorialSkipBtn = null;
  }

  function createTutorialSkipButton(): void {
    if (tutorialSkipBtn || !wrapper) return;
    tutorialSkipBtn = document.createElement('button');
    tutorialSkipBtn.textContent = 'Skip';
    tutorialSkipBtn.style.cssText =
      'position:absolute;top:8px;right:8px;z-index:210;' +
      'font-size:0.75rem;font-weight:600;padding:6px 14px;border:none;border-radius:20px;' +
      'background:rgba(93,64,55,0.6);color:#FFF8F0;cursor:pointer;' +
      'font-family:system-ui,sans-serif;backdrop-filter:blur(4px);' +
      'transition:opacity 0.2s ease;';
    tutorialSkipBtn.addEventListener('click', () => {
      completeTutorial();
    });
    wrapper.appendChild(tutorialSkipBtn);
  }

  function showTutorialStep(stepNum: number): void {
    if (!wrapper || !tutorialActive) return;
    clearTutorialOverlay();

    tutorialOverlayEl = document.createElement('div');
    tutorialOverlayEl.style.cssText =
      'position:absolute;inset:0;z-index:200;pointer-events:none;' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;';

    if (stepNum === 1) {
      // Step 1: "Tap to find" — highlight one correct ingredient
      const unfoundItem = engineState?.items.find(
        (i) => i.isRequired && !i.found && !engineState!.found.includes(i.ingredient.id),
      );
      if (unfoundItem) {
        const el = itemElements.get(unfoundItem.id);
        if (el) {
          el.classList.add('rh-hint-pulse');
          hintedItemId = unfoundItem.id;
        }
      }

      // Hand gesture pointing
      const hand = document.createElement('div');
      hand.textContent = '\uD83D\uDC46';
      hand.style.cssText =
        'font-size:2.5rem;position:absolute;z-index:201;pointer-events:none;' +
        'animation:rhTutorialBounce 1s ease-in-out infinite;';
      if (unfoundItem) {
        const el = itemElements.get(unfoundItem.id);
        if (el && playAreaEl) {
          const rect = el.getBoundingClientRect();
          const parentRect = playAreaEl.getBoundingClientRect();
          hand.style.left = `${rect.left - parentRect.left + rect.width / 2 - 16 + playAreaEl.offsetLeft}px`;
          hand.style.top = `${rect.top - parentRect.top + rect.height + playAreaEl.offsetTop}px`;
        }
      }
      tutorialOverlayEl.appendChild(hand);

      // Text overlay
      const text = document.createElement('div');
      text.textContent = 'Tap the ingredient!';
      text.style.cssText =
        'position:absolute;bottom:80px;left:50%;transform:translateX(-50%);' +
        'background:rgba(107,58,31,0.85);color:#FFF8F0;padding:10px 24px;' +
        'border-radius:20px;font-size:1.1rem;font-weight:700;white-space:nowrap;' +
        'font-family:system-ui,sans-serif;pointer-events:none;' +
        'box-shadow:0 4px 16px rgba(107,58,31,0.3);';
      tutorialOverlayEl.appendChild(text);

      // Auto-skip if player taps correctly within 2s
      tutorialAutoSkipTimer = window.setTimeout(() => {
        // If still on step 1 after 2s, keep showing — it won't auto-skip
        tutorialAutoSkipTimer = null;
      }, 2000);

    } else if (stepNum === 2) {
      // Step 2: "Check the recipe" — arrow pointing at recipe card
      const arrow = document.createElement('div');
      arrow.textContent = '\u2B06';
      arrow.style.cssText =
        'position:absolute;z-index:201;font-size:2rem;pointer-events:none;' +
        'animation:rhTutorialBounce 1s ease-in-out infinite;color:#E85D3A;';
      if (recipeCardEl) {
        const rect = recipeCardEl.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        arrow.style.left = `${rect.left - wrapperRect.left + rect.width / 2 - 14}px`;
        arrow.style.top = `${rect.bottom - wrapperRect.top + 4}px`;
      }
      tutorialOverlayEl.appendChild(arrow);

      const text = document.createElement('div');
      text.textContent = 'Check off ingredients!';
      text.style.cssText =
        'position:absolute;bottom:80px;left:50%;transform:translateX(-50%);' +
        'background:rgba(107,58,31,0.85);color:#FFF8F0;padding:10px 24px;' +
        'border-radius:20px;font-size:1.1rem;font-weight:700;white-space:nowrap;' +
        'font-family:system-ui,sans-serif;pointer-events:none;' +
        'box-shadow:0 4px 16px rgba(107,58,31,0.3);';
      tutorialOverlayEl.appendChild(text);

      // Dismiss after checkmark appears (auto-dismiss after 3s fallback)
      tutorialDismissTimer = window.setTimeout(() => {
        advanceTutorial();
      }, 3000);

    } else if (stepNum === 3) {
      // Step 3: "Wrong taps lose time" — warning near play area
      const warning = document.createElement('div');
      warning.textContent = '\u26A0\uFE0F';
      warning.style.cssText =
        'position:absolute;z-index:201;font-size:2.5rem;pointer-events:none;' +
        'top:50%;left:50%;transform:translate(-50%,-50%);' +
        'animation:rhTutorialBounce 1s ease-in-out infinite;';
      tutorialOverlayEl.appendChild(warning);

      const text = document.createElement('div');
      text.textContent = 'Wrong taps lose 3 seconds!';
      text.style.cssText =
        'position:absolute;top:60px;left:50%;transform:translateX(-50%);' +
        'background:rgba(229,57,53,0.88);color:#FFF8F0;padding:10px 24px;' +
        'border-radius:20px;font-size:1.1rem;font-weight:700;white-space:nowrap;' +
        'font-family:system-ui,sans-serif;pointer-events:none;' +
        'box-shadow:0 4px 16px rgba(229,57,53,0.3);';
      tutorialOverlayEl.appendChild(text);

      // Dismiss after 3 seconds or next tap
      tutorialDismissTimer = window.setTimeout(() => {
        advanceTutorial();
      }, 3000);
    }

    wrapper.appendChild(tutorialOverlayEl);
    createTutorialSkipButton();
  }

  function advanceTutorial(): void {
    if (!tutorialActive) return;

    // Clean up current step visuals
    if (tutorialStep === 1) {
      clearHintPulse();
    } else if (tutorialStep === 3) {
      // No timer spotlight to clean up — step 3 now shows warning indicator
    }

    clearTutorialOverlay();

    if (tutorialStep < 3) {
      tutorialStep++;
      showTutorialStep(tutorialStep);
    } else {
      // Step 4: free play, tutorial complete
      completeTutorial();
    }
  }

  function onTutorialCorrectTap(): void {
    if (!tutorialActive) return;
    tutorialCorrectTapCount++;

    if (tutorialStep === 1) {
      // Step 1 done — player tapped a correct ingredient
      // If they tapped before auto-skip timer (2s), skip the rest
      if (tutorialAutoSkipTimer !== null) {
        clearTimeout(tutorialAutoSkipTimer);
        tutorialAutoSkipTimer = null;
        // Player acted before hints fully set in — auto-skip tutorial
        completeTutorial();
        return;
      }
      advanceTutorial();
    } else if (tutorialStep === 2) {
      // After first correct tap in step 2, advance (checkmark appeared)
      advanceTutorial();
    } else if (tutorialStep === 3) {
      // Any tap dismisses step 3
      advanceTutorial();
    }

    // After 3 correct taps, show step 3 if not already past it
    if (tutorialCorrectTapCount === 3 && tutorialStep === 2) {
      advanceTutorial();
    }
  }

  function startTutorial(): void {
    if (!isTutorialNeeded()) return;
    tutorialActive = true;
    tutorialStep = 1;
    tutorialCorrectTapCount = 0;
    showTutorialStep(1);
  }

  // -----------------------------------------------------------------------
  // Item tap handling
  // -----------------------------------------------------------------------

  function handleItemTap(itemId: string): void {
    if (!engineState || engineState.status !== 'playing') return;
    if (pauseState.paused()) return;

    mesoMachine.transition('tap_food_item');

    const prevFound = engineState.found.length;
    const prevStrikes = engineState.strikes;

    engineState = step(engineState, {
      type: 'TAP',
      itemInstanceId: itemId,
      timestamp: Date.now(),
    });

    const isCorrect = engineState.found.length > prevFound;
    const isWrong = engineState.strikes > prevStrikes;

    if (isCorrect) {
      mesoMachine.transition('item_matches_ingredient');
    } else if (isWrong) {
      mesoMachine.transition('item_is_distractor');
    }

    syncSignals();
    updateHUD();
    updateRecipeCard();

    const itemEl = itemElements.get(itemId);

    if (isCorrect && itemEl) {
      // Correct tap pop: scale 1.3x then fade (150ms)
      itemEl.style.transition = 'transform 150ms ease-out, opacity 150ms ease-out';
      itemEl.style.transform = 'scale(1.3)';
      itemEl.style.opacity = '0';
      itemEl.style.pointerEvents = 'none';
      clearHintPulse();

      // Sparkle particles burst outward (3-5)
      const rect = itemEl.getBoundingClientRect();
      const parentRect = playAreaEl?.getBoundingClientRect();
      if (parentRect) {
        const cx = rect.left - parentRect.left + rect.width / 2;
        const cy = rect.top - parentRect.top + rect.height / 2;
        spawnParticles(cx, cy, 3 + Math.floor(Math.random() * 3));
      }

      // Tutorial callback for correct tap
      if (tutorialActive) {
        onTutorialCorrectTap();
      }

      // Score popup
      const comboText = engineState.comboStreak >= 3
        ? `+100 x${engineState.comboStreak}`
        : '+100';
      showScorePopup(itemEl, comboText);

      // Combo 3+ juice: brief white flash + freeze-frame
      if (engineState.comboStreak >= 3) {
        flashOverlay('rgba(255,255,255,0.3)', 60);
        // 2-frame freeze (~33ms): pause timer tick and scale-punch the board
        freezeUntil = performance.now() + 33;
        if (playAreaEl) {
          playAreaEl.style.transition = 'transform 33ms ease-out';
          playAreaEl.style.transform = 'scale(1.01)';
          setTimeout(() => {
            if (playAreaEl) {
              playAreaEl.style.transform = 'scale(1)';
            }
          }, 33);
        }
      }
      // Combo 5+ juice: stronger flash + mini confetti
      if (engineState.comboStreak >= 5) {
        flashOverlay('rgba(245,200,66,0.2)', 80);
        spawnConfetti(8);
      }

      // Animate done -> combo check
      setTimeout(() => {
        mesoMachine.transition('item_removed_animation_done');
        if (engineState!.status === 'won') {
          mesoMachine.transition('all_ingredients_found');
        } else {
          mesoMachine.transition('ingredients_remain');
        }
      }, 150);

      // Reset hint timer on correct tap
      resetHintTimer();
    } else if (isWrong && itemEl) {
      // Tutorial: any tap on step 3 dismisses it
      if (tutorialActive && tutorialStep === 3) {
        advanceTutorial();
      }
      // Wrong tap: red flash overlay + screen shake
      flashOverlay('rgba(229,57,53,0.2)', 100);
      shakeScreen(2, 80);

      // Item shake animation
      itemEl.classList.add('rh-shake');
      itemEl.style.background = 'rgba(229, 57, 53, 0.3)';
      setTimeout(() => {
        if (itemEl) {
          itemEl.classList.remove('rh-shake');
          itemEl.style.background =
            'radial-gradient(ellipse at 35% 35%,rgba(255,245,225,0.9) 0%,rgba(255,240,210,0.7) 50%,rgba(210,168,110,0.4) 100%)';
        }
        // Penalty applied
        if (engineState!.status === 'lost') {
          mesoMachine.transition('penalty_applied_and_timer_lte_0');
        } else {
          mesoMachine.transition('penalty_applied_and_timer_gt_0');
        }
      }, 300);

      // Flash timer bar
      if (timerBarTrack) {
        timerBarTrack.style.background = '#FFCDD2';
        setTimeout(() => {
          if (timerBarTrack) timerBarTrack.style.background = 'rgba(107,58,31,0.08)';
        }, 300);
      }
      updateTimerBar();
    }

    // Check game end
    if (engineState.status === 'won') {
      // Recipe complete confetti: 25-30 food emoji
      spawnConfetti(25 + Math.floor(Math.random() * 6));
      endGame(true);
    } else if (engineState.status === 'lost') {
      endGame(false);
    }
  }

  function showScorePopup(anchor: HTMLElement, text: string): void {
    const popup = document.createElement('div');
    popup.textContent = text;
    popup.style.cssText =
      'position:absolute;font-size:1.3rem;font-weight:800;color:#E85D3A;' +
      'pointer-events:none;z-index:20;' +
      'text-shadow:0 1px 3px rgba(107,58,31,0.25),0 0 8px rgba(232,93,58,0.2);' +
      'animation:rhScorePop 0.5s ease-out forwards;';
    const rect = anchor.getBoundingClientRect();
    const parentRect = playAreaEl?.getBoundingClientRect();
    if (parentRect) {
      popup.style.left = `${rect.left - parentRect.left + rect.width / 2 - 20}px`;
      popup.style.top = `${rect.top - parentRect.top - 8}px`;
    }
    playAreaEl?.appendChild(popup);
    setTimeout(() => popup.remove(), 600);
  }

  // -----------------------------------------------------------------------
  // Juice helpers (cosmetic only — no state changes)
  // -----------------------------------------------------------------------

  function spawnParticles(x: number, y: number, count: number, emoji?: string): void {
    if (!playAreaEl) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const dist = 20 + Math.random() * 30;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      p.textContent = emoji || (Math.random() > 0.5 ? '✨' : '·');
      p.style.cssText =
        `position:absolute;left:${x}px;top:${y}px;font-size:${emoji ? '1rem' : '0.7rem'};` +
        'pointer-events:none;z-index:25;' +
        `transition:all 0.4s ease-out;opacity:1;color:#F5C842;` +
        'text-shadow:0 0 4px rgba(245,200,66,0.5);';
      playAreaEl.appendChild(p);
      requestAnimationFrame(() => {
        p.style.transform = `translate(${dx}px,${dy}px) scale(0.3)`;
        p.style.opacity = '0';
      });
      setTimeout(() => p.remove(), 450);
    }
  }

  function shakeScreen(intensity: number, duration: number): void {
    if (!wrapper) return;
    wrapper.style.animation = `rhScreenShake ${duration}ms ease-in-out`;
    setTimeout(() => {
      if (wrapper) wrapper.style.animation = '';
    }, duration);
  }

  function flashOverlay(color: string, duration: number): void {
    if (!wrapper) return;
    const flash = document.createElement('div');
    flash.style.cssText =
      `position:absolute;inset:0;pointer-events:none;z-index:50;` +
      `background:${color};animation:rhFlashOverlay ${duration}ms ease-out forwards;`;
    wrapper.appendChild(flash);
    setTimeout(() => flash.remove(), duration + 10);
  }

  function spawnConfetti(count: number): void {
    if (!wrapper) return;
    const w = wrapper.clientWidth || 360;
    for (let i = 0; i < count; i++) {
      const c = document.createElement('div');
      const emoji = CONFETTI_EMOJI[Math.floor(Math.random() * CONFETTI_EMOJI.length)]!;
      c.textContent = emoji;
      const left = Math.random() * w;
      const delay = Math.random() * 400;
      const dur = 1000 + Math.random() * 400;
      c.style.cssText =
        `position:absolute;top:-30px;left:${left}px;font-size:${1.2 + Math.random() * 0.8}rem;` +
        `pointer-events:none;z-index:60;opacity:0.9;` +
        `animation:rhConfettiFall ${dur}ms ease-in ${delay}ms forwards;`;
      wrapper.appendChild(c);
      setTimeout(() => c.remove(), dur + delay + 50);
    }
  }

  function showComboText(combo: number): void {
    if (!playAreaEl) return;
    const text = document.createElement('div');
    text.textContent = `x${combo}!`;
    text.style.cssText =
      'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
      `font-size:${1.8 + Math.min(combo, 5) * 0.2}rem;font-weight:900;` +
      'color:#E85D3A;pointer-events:none;z-index:30;' +
      'text-shadow:0 0 12px rgba(232,93,58,0.4),0 2px 4px rgba(107,58,31,0.2);' +
      'animation:rhComboIn 0.3s ease-out forwards;opacity:0;';
    playAreaEl.appendChild(text);
    setTimeout(() => {
      text.style.transition = 'opacity 0.3s ease-out';
      text.style.opacity = '0';
    }, 400);
    setTimeout(() => text.remove(), 750);
  }

  // -----------------------------------------------------------------------
  // Timer loop
  // -----------------------------------------------------------------------

  function startTimer(): void {
    lastFrameTime = performance.now();
    mesoMachine.transition('timer_start');

    const tick = (now: number): void => {
      if (!engineState || engineState.status !== 'playing') return;
      if (pauseState.paused()) {
        lastFrameTime = now;
        timerHandle = requestAnimationFrame(tick);
        return;
      }
      const dt = (now - lastFrameTime) / 1000;
      lastFrameTime = now;

      // Freeze-frame: skip timer tick during micro-pause (combo 3+)
      if (now < freezeUntil) {
        timerHandle = requestAnimationFrame(tick);
        return;
      }

      engineState = tickTimer(engineState, dt);
      syncSignals();
      updateTimerBar();

      if (engineState.status === 'lost') {
        mesoMachine.transition('timer_expired');
        endGame(false);
        return;
      }
      timerHandle = requestAnimationFrame(tick);
    };
    timerHandle = requestAnimationFrame(tick);
  }

  // -----------------------------------------------------------------------
  // End game overlay
  // -----------------------------------------------------------------------

  function endGame(won: boolean): void {
    if (timerHandle !== null) {
      cancelAnimationFrame(timerHandle);
      timerHandle = null;
    }
    if (hintTimeoutHandle !== null) {
      clearTimeout(hintTimeoutHandle);
      hintTimeoutHandle = null;
    }
    clearHintPulse();
    if (tutorialActive) {
      completeTutorial();
    }

    if (!engineState || !wrapper) return;

    const breakdown = calculateScore(engineState);
    const maxScore = estimateMaxScore(
      engineState.recipe.ingredients.length,
      engineState.config.timeLimit,
      engineState.config.level,
    );
    const stars = won ? calculateStars(breakdown.finalScore, maxScore) : 0;
    gameState.setScore(breakdown.finalScore);
    gameState.setStars(stars);

    // Update persistence
    const currentLevel = engineState.config.level;
    totalScore += breakdown.finalScore;
    if (won) {
      if (currentLevel >= highestLevel) {
        highestLevel = currentLevel + 1;
      }
      const prevStars = levelStars[currentLevel] ?? 0;
      if (stars > prevStars) {
        levelStars[currentLevel] = stars;
      }
      if (!cookbook.includes(engineState.recipe.id)) {
        cookbook.push(engineState.recipe.id);
      }
    }
    saveProgress();

    // Trigger animation transitions
    if (won) {
      mesoMachine.transition('win_animation_done');
    } else {
      mesoMachine.transition('loss_animation_done');
    }

    // Build overlay — frosted glass effect
    overlayEl = document.createElement('div');
    overlayEl.style.cssText =
      'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' +
      'justify-content:center;background:rgba(255,248,240,0.85);z-index:100;gap:16px;' +
      'animation:rhFadeIn 0.3s ease-out;' +
      'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';

    const title = document.createElement('h2');
    title.textContent = won ? 'Recipe Complete!' : "Time's Up!";
    title.style.cssText =
      'font-size:2rem;font-weight:800;color:#6B3A1F;margin:0;' +
      'font-family:Georgia,"Times New Roman",serif;' +
      'text-shadow:0 1px 0 rgba(255,245,225,0.8);';

    const dishEmoji = document.createElement('div');
    dishEmoji.textContent = won ? engineState.recipe.dishEmoji : '';
    dishEmoji.style.cssText = 'font-size:4rem;';

    const recipeName = document.createElement('div');
    recipeName.textContent = won ? engineState.recipe.name : '';
    recipeName.style.cssText =
      'font-size:1.2rem;color:#8B6F47;font-family:Georgia,"Times New Roman",serif;' +
      'font-style:italic;';

    // Stars with pop-in animation
    const starsEl = document.createElement('div');
    starsEl.style.cssText = 'font-size:2.2rem;letter-spacing:10px;display:flex;gap:4px;';
    for (let i = 0; i < 3; i++) {
      const star = document.createElement('span');
      star.textContent = i < stars ? '\u2B50' : '\u2606';
      star.style.cssText =
        `display:inline-block;opacity:0;` +
        `animation:rhStarPop 0.4s ease-out ${0.2 + i * 0.15}s forwards;`;
      if (i >= stars) star.style.cssText += 'filter:grayscale(1);opacity:0.4;animation:none;';
      starsEl.appendChild(star);
    }

    // 3-star bonus confetti + golden sparkles
    if (stars === 3) {
      spawnConfetti(15);
      setTimeout(() => {
        if (playAreaEl) {
          const cx = (wrapper?.clientWidth ?? 360) / 2;
          spawnParticles(cx, 200, 8, '✨');
        }
      }, 300);
    }

    // Score breakdown card with paper texture
    const scoreBreak = document.createElement('div');
    scoreBreak.style.cssText =
      'text-align:center;font-size:0.9rem;color:#5D4037;line-height:1.8;' +
      'font-family:system-ui,sans-serif;' +
      'background:#FFFDF7;padding:16px 24px;border-radius:12px;' +
      'border:1px solid rgba(139,111,71,0.2);' +
      'box-shadow:0 4px 16px rgba(107,58,31,0.12);';
    const accuracy = engineState.totalTaps > 0
      ? Math.round((engineState.correctTaps / engineState.totalTaps) * 100)
      : 0;
    scoreBreak.innerHTML =
      `Ingredients: ${engineState.found.length}/${engineState.recipe.ingredients.length}<br>` +
      `Accuracy: ${accuracy}%<br>` +
      `Max Combo: x${engineState.maxCombo}<br>` +
      `Time Bonus: ${breakdown.timePoints}<br>` +
      `Tier Bonus: x${breakdown.tierMult}<br>` +
      `<strong style="font-size:1.4rem;color:#FF6B35">Score: ${breakdown.finalScore}</strong>`;

    // Buttons
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:12px;margin-top:8px;';

    if (won) {
      const nextBtn = createButton('Next Level', '#FF6B35', () => {
        gameState.incrementLevel();
        startLevel(gameState.level());
      });
      btnRow.appendChild(nextBtn);
    } else {
      const retryBtn = createButton('Retry', '#FF6B35', () => {
        startLevel(engineState!.config.level);
      });
      const resultsBtn = createButton('Results', '#8D6E63', () => {
        // Navigate to the full ResultsScreen
        if (deps && (deps as unknown as { goto?: (s: string) => void }).goto) {
          (deps as unknown as { goto: (s: string) => void }).goto('results');
        }
      });
      const menuBtn = createButton('Menu', '#8D6E63', () => {
        // Go back to start screen
        if (deps && (deps as unknown as { goto?: (s: string) => void }).goto) {
          (deps as unknown as { goto: (s: string) => void }).goto('start');
        }
      });
      btnRow.append(retryBtn, resultsBtn, menuBtn);
    }

    // Auto-advance on win after 2 seconds (or button click)
    let autoAdvanceTimer: number | null = null;
    if (won) {
      autoAdvanceTimer = window.setTimeout(() => {
        if (overlayEl && overlayEl.parentNode) {
          gameState.incrementLevel();
          startLevel(gameState.level());
        }
      }, 2000);
      // Cancel auto-advance if user clicks Next Level
      const origNextClick = btnRow.firstElementChild as HTMLButtonElement | null;
      if (origNextClick) {
        const origHandler = origNextClick.onclick;
        origNextClick.onclick = null;
        origNextClick.addEventListener('click', () => {
          if (autoAdvanceTimer !== null) clearTimeout(autoAdvanceTimer);
        }, { once: true });
      }
    }

    overlayEl.append(title, dishEmoji, recipeName, starsEl, scoreBreak, btnRow);
    wrapper.appendChild(overlayEl);
  }

  function createButton(text: string, bg: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    const isOrange = bg.includes('FF6B35') || bg.includes('E85D3A');
    const gradient = isOrange
      ? 'linear-gradient(135deg,#FF8A65,#E85D3A)'
      : `linear-gradient(135deg,${bg},${bg})`;
    btn.style.cssText =
      `font-size:1.1rem;font-weight:700;padding:14px 36px;border:none;border-radius:50px;` +
      `background:${gradient};color:#fff;cursor:pointer;font-family:system-ui,sans-serif;` +
      `box-shadow:0 4px 14px rgba(107,58,31,0.2),inset 0 1px 0 rgba(255,255,255,0.2);` +
      `transition:transform 0.15s ease,box-shadow 0.15s ease;`;
    btn.onmouseenter = () => {
      btn.style.transform = 'scale(1.05)';
      btn.style.boxShadow = '0 6px 20px rgba(107,58,31,0.3),inset 0 1px 0 rgba(255,255,255,0.2)';
    };
    btn.onmouseleave = () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = '0 4px 14px rgba(107,58,31,0.2),inset 0 1px 0 rgba(255,255,255,0.2)';
    };
    btn.addEventListener('click', onClick, { once: true });
    return btn;
  }

  // -----------------------------------------------------------------------
  // Level setup
  // -----------------------------------------------------------------------

  function startLevel(level: number): void {
    if (!wrapper) return;

    // Clean up previous level
    if (timerHandle !== null) {
      cancelAnimationFrame(timerHandle);
      timerHandle = null;
    }
    if (hintTimeoutHandle !== null) {
      clearTimeout(hintTimeoutHandle);
      hintTimeoutHandle = null;
    }
    clearHintPulse();
    overlayEl?.remove();
    overlayEl = null;

    // Reset state machine
    mesoMachine.reset();

    // Clear play area and recipe card
    if (playAreaEl) playAreaEl.innerHTML = '';
    if (recipeCardEl) recipeCardEl.innerHTML = '';
    itemElements.clear();

    // Generate level
    const config = generateLevelConfig(level);
    const requiredIngredients = config.recipe.ingredients.map((ri) => ri.item);

    // Get container dimensions for layout
    const areaWidth = wrapper.clientWidth || 360;
    const areaHeight = Math.max(600, (wrapper.clientHeight || 700) - 200);

    const items = placeItems(
      requiredIngredients,
      config.distractors,
      areaWidth - 20,
      areaHeight,
      MIN_SPACING,
      createSeededRng(config.seed),
    );

    // Build engine state
    engineState = {
      items,
      recipe: config.recipe,
      found: [],
      score: 0,
      timeRemaining: config.timeLimit,
      comboStreak: 0,
      maxCombo: 0,
      strikes: 0,
      totalTaps: 0,
      correctTaps: 0,
      lastCorrectTapTime: 0,
      status: 'playing',
      config,
    };

    gameState.setLevel(level);
    syncSignals();
    updateTimerBar();
    updateHUD();

    // Build recipe card
    buildRecipeCard(config);

    // Place items in play area
    buildPlayArea(items);

    // Start timer and hint system
    startTimer();
    resetHintTimer();

    // Start FTUE tutorial on first play
    if (level === 1) {
      startTutorial();
    }
  }

  function createSeededRng(seed: number): () => number {
    let s = seed | 0;
    return (): number => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // -----------------------------------------------------------------------
  // DOM builders
  // -----------------------------------------------------------------------

  function buildRecipeCard(config: LevelConfig): void {
    if (!recipeCardEl) return;
    recipeCardEl.innerHTML = '';

    const header = document.createElement('div');
    header.style.cssText =
      'display:flex;align-items:center;gap:8px;margin-bottom:8px;';
    const dishIcon = document.createElement('span');
    dishIcon.textContent = config.recipe.dishEmoji;
    dishIcon.style.fontSize = '1.6rem';
    const nameEl = document.createElement('span');
    nameEl.textContent = config.recipe.name;
    nameEl.style.cssText =
      'font-size:1.15rem;font-weight:700;color:#6B3A1F;font-family:Georgia,"Times New Roman",serif;' +
      'text-shadow:0 1px 0 rgba(255,245,225,0.6);';
    header.append(dishIcon, nameEl);
    recipeCardEl.appendChild(header);

    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px 12px;';

    for (const ri of config.recipe.ingredients) {
      const item = document.createElement('div');
      item.dataset.ingredientId = ri.item.id;
      item.style.cssText =
        'display:flex;align-items:center;gap:4px;font-size:0.9rem;color:#5D4037;' +
        'font-family:system-ui,sans-serif;transition:all 0.3s ease;padding:2px 6px;' +
        'border-radius:8px;background:rgba(255,255,255,0.5);';
      item.innerHTML =
        `<span style="font-size:1.3rem">${ri.item.emoji}</span>` +
        `<span class="rh-ing-name" style="color:#6B3A1F">${ri.item.displayName}</span>` +
        `<span class="rh-check" style="opacity:0;color:#4CAF50;font-weight:bold;margin-left:2px;font-size:1.1rem;text-shadow:0 1px 2px rgba(76,175,80,0.3)">&#10003;</span>`;
      list.appendChild(item);
    }

    recipeCardEl.appendChild(list);

    // Inject found-state style via class
    const style = document.createElement('style');
    style.textContent = `
      .rh-found .rh-ing-name { text-decoration: line-through; opacity: 0.5; }
      .rh-found .rh-check { opacity: 1 !important; }
      .rh-found { background: rgba(76,175,80,0.12) !important; }
    `;
    recipeCardEl.appendChild(style);
  }

  function buildPlayArea(items: PlacedItem[]): void {
    if (!playAreaEl) return;
    playAreaEl.innerHTML = '';

    for (const item of items) {
      const el = document.createElement('div');
      el.style.cssText =
        `position:absolute;left:${item.position.x}px;top:${item.position.y}px;` +
        `width:${ITEM_SIZE}px;height:${ITEM_SIZE}px;` +
        'display:flex;align-items:center;justify-content:center;' +
        'font-size:2.2rem;cursor:pointer;border-radius:50%;' +
        'background:radial-gradient(ellipse at 35% 35%,rgba(255,245,225,0.9) 0%,rgba(255,240,210,0.7) 50%,rgba(210,168,110,0.4) 100%);' +
        'box-shadow:0 2px 6px rgba(107,58,31,0.2),inset 0 -2px 4px rgba(107,58,31,0.06);' +
        'transition:transform 0.15s ease,box-shadow 0.15s ease;' +
        'user-select:none;-webkit-user-select:none;' +
        'animation:rhItemIn 0.3s ease-out backwards,rhBreathe 3s ease-in-out infinite;' +
        `animation-delay:${Math.floor(Math.random() * 300)}ms,${Math.floor(Math.random() * 3000)}ms;`;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', item.ingredient.displayName);
      el.textContent = item.ingredient.emoji;

      // Hover/press visual feedback
      el.addEventListener('pointerenter', () => {
        el.style.transform = 'scale(1.05)';
        el.style.boxShadow = '0 4px 10px rgba(107,58,31,0.3),inset 0 -2px 4px rgba(107,58,31,0.06)';
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 2px 6px rgba(107,58,31,0.2),inset 0 -2px 4px rgba(107,58,31,0.06)';
      });

      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        // Tier 1 tap punch
        el.style.transform = 'scale(1.05)';
        setTimeout(() => {
          if (el.style.opacity !== '0') el.style.transform = 'scale(1)';
        }, 50);
        handleItemTap(item.id);
      });

      playAreaEl!.appendChild(el);
      itemElements.set(item.id, el);
    }
  }

  // -----------------------------------------------------------------------
  // Continue/restart prompt
  // -----------------------------------------------------------------------

  function showContinuePrompt(savedLevel: number): void {
    if (!wrapper) return;

    overlayEl = document.createElement('div');
    overlayEl.style.cssText =
      'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' +
      'justify-content:center;background:rgba(255,248,240,0.88);z-index:100;gap:16px;' +
      'animation:rhFadeIn 0.3s ease-out;' +
      'backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';

    const title = document.createElement('h2');
    title.textContent = 'Welcome Back!';
    title.style.cssText =
      'font-size:1.8rem;font-weight:800;color:#6B3A1F;margin:0;' +
      'font-family:Georgia,"Times New Roman",serif;' +
      'text-shadow:0 1px 0 rgba(255,245,225,0.8);';

    const info = document.createElement('div');
    info.style.cssText =
      'text-align:center;font-size:1rem;color:#5D4037;line-height:1.8;' +
      'font-family:system-ui,sans-serif;' +
      'background:#FFFDF7;padding:16px 24px;border-radius:12px;' +
      'border:1px solid rgba(139,111,71,0.15);' +
      'box-shadow:0 4px 14px rgba(107,58,31,0.1);';
    info.innerHTML =
      `Highest level reached: <strong>${savedLevel}</strong><br>` +
      `Total score: <strong>${totalScore}</strong><br>` +
      `Recipes completed: <strong>${cookbook.length}</strong>`;

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:12px;margin-top:8px;';

    const continueBtn = createButton(`Continue (Lv.${savedLevel})`, '#FF6B35', () => {
      overlayEl?.remove();
      overlayEl = null;
      gameState.setLevel(savedLevel);
      startLevel(savedLevel);
    });

    const restartBtn = createButton('Restart', '#8D6E63', () => {
      overlayEl?.remove();
      overlayEl = null;
      gameState.setLevel(1);
      startLevel(1);
    });

    btnRow.append(continueBtn, restartBtn);
    overlayEl.append(title, info, btnRow);
    wrapper.appendChild(overlayEl);
  }

  // -----------------------------------------------------------------------
  // GameController interface
  // -----------------------------------------------------------------------

  return {
    gameMode: 'dom',

    init(cont: HTMLDivElement) {
      container = cont;

      // Load saved progress
      loadProgress();

      // Inject keyframes
      styleEl = document.createElement('style');
      styleEl.textContent = `
        @keyframes rhItemIn {
          from { opacity:0; transform:scale(0.5) rotate(-8deg); }
          to { opacity:1; transform:scale(1) rotate(0deg); }
        }
        @keyframes rhFadeIn {
          from { opacity:0; transform:scale(0.95); }
          to { opacity:1; transform:scale(1); }
        }
        @keyframes rhTimerPulse {
          0%,100% { opacity:1; transform:scaleX(1); }
          50% { opacity:0.7; transform:scaleX(1.01); }
        }
        @keyframes rhShake {
          0%,100% { transform:translateX(0); }
          20% { transform:translateX(-6px); }
          40% { transform:translateX(6px); }
          60% { transform:translateX(-4px); }
          80% { transform:translateX(4px); }
        }
        .rh-shake { animation: rhShake 0.3s ease-in-out; }
        @keyframes rhHintPulse {
          0%,100% { box-shadow: 0 0 6px 3px rgba(255,183,77,0.3), 0 2px 6px rgba(107,58,31,0.2); }
          50% { box-shadow: 0 0 18px 10px rgba(255,183,77,0.6), 0 2px 6px rgba(107,58,31,0.2); }
        }
        .rh-hint-pulse {
          animation: rhHintPulse 0.75s ease-in-out infinite;
          z-index: 15;
        }
        @keyframes rhBreathe {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.003); }
        }
        @keyframes rhScorePop {
          0% { opacity:1; transform:translateY(0) scale(1); }
          100% { opacity:0; transform:translateY(-40px) scale(1.1); }
        }
        @keyframes rhComboIn {
          0% { transform: scale(0.3); opacity:0; }
          60% { transform: scale(1.4); }
          100% { transform: scale(1); opacity:1; }
        }
        @keyframes rhConfettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity:1; }
          80% { opacity:1; }
          100% { transform: translateY(calc(100vh)) rotate(720deg); opacity:0; }
        }
        @keyframes rhSparkle {
          0% { transform: translate(0,0) scale(1); opacity:1; }
          100% { opacity:0; }
        }
        @keyframes rhFlashOverlay {
          0% { opacity:0.3; }
          100% { opacity:0; }
        }
        @keyframes rhTutorialBounce {
          0%,100% { transform:translateY(0); }
          50% { transform:translateY(-8px); }
        }
        @keyframes rhScreenShake {
          0%,100% { transform:translate(0,0); }
          25% { transform:translate(-2px,1px); }
          50% { transform:translate(2px,-1px); }
          75% { transform:translate(-1px,2px); }
        }
        @keyframes rhStarPop {
          0% { transform:scale(0) rotate(-30deg); opacity:0; }
          60% { transform:scale(1.3) rotate(5deg); opacity:1; }
          100% { transform:scale(1) rotate(0deg); opacity:1; }
        }
      `;
      document.head.appendChild(styleEl);

      // Main wrapper — warm butcher-block aesthetic
      wrapper = document.createElement('div');
      wrapper.style.cssText =
        'position:relative;width:100%;height:100%;display:flex;flex-direction:column;' +
        'background:#FFF8F0;font-family:system-ui,sans-serif;overflow:hidden;';

      // Wood-grain overlay
      const woodGrain = document.createElement('div');
      woodGrain.style.cssText =
        'position:absolute;inset:0;pointer-events:none;z-index:0;opacity:0.03;' +
        'background:repeating-linear-gradient(90deg,transparent,transparent 38px,#8B6F47 38px,#8B6F47 39px),' +
        'repeating-linear-gradient(90deg,transparent,transparent 67px,#6B3A1F 67px,#6B3A1F 68px);';
      wrapper.appendChild(woodGrain);

      // Vignette overlay
      const vignette = document.createElement('div');
      vignette.style.cssText =
        'position:absolute;inset:0;pointer-events:none;z-index:1;' +
        'background:radial-gradient(ellipse at center,transparent 55%,rgba(107,58,31,0.15) 100%);'
      wrapper.appendChild(vignette);

      // -- Top bar: level + timer + combo + score --
      const topBar = document.createElement('div');
      topBar.style.cssText =
        'display:flex;align-items:center;gap:8px;padding:10px 14px;' +
        'background:linear-gradient(180deg,rgba(139,111,71,0.08) 0%,rgba(139,111,71,0.02) 100%);' +
        'flex-shrink:0;flex-wrap:wrap;z-index:2;border-bottom:1px solid rgba(139,111,71,0.1);';

      levelEl = document.createElement('span');
      levelEl.style.cssText =
        'font-weight:700;color:#5D4037;font-size:0.85rem;min-width:120px;white-space:nowrap;' +
        'text-shadow:0 1px 0 rgba(255,245,225,0.8);';

      const timerRow = document.createElement('div');
      timerRow.style.cssText = 'display:flex;align-items:center;gap:6px;flex:1;min-width:100px;';

      timerBarTrack = document.createElement('div');
      timerBarTrack.style.cssText =
        'flex:1;height:12px;border-radius:6px;background:rgba(107,58,31,0.08);overflow:hidden;' +
        'transition:background 0.3s ease;box-shadow:inset 0 1px 3px rgba(107,58,31,0.1);';
      timerBarFill = document.createElement('div');
      timerBarFill.style.cssText =
        'height:100%;border-radius:6px;background:linear-gradient(90deg,#6BCB77,#FFA94D);' +
        'transition:width 0.3s linear;width:100%;' +
        'box-shadow:0 1px 3px rgba(107,58,31,0.15);';
      timerBarTrack.appendChild(timerBarFill);

      timerSecondsEl = document.createElement('span');
      timerSecondsEl.style.cssText =
        'font-size:0.8rem;font-weight:700;color:#5D4037;min-width:28px;text-align:right;' +
        'text-shadow:0 1px 0 rgba(255,245,225,0.8);';

      timerRow.append(timerBarTrack, timerSecondsEl);

      comboEl = document.createElement('div');
      comboEl.style.cssText =
        'font-weight:800;color:#E85D3A;font-size:1rem;min-width:80px;text-align:center;' +
        'opacity:0;white-space:nowrap;' +
        'text-shadow:0 0 8px rgba(232,93,58,0.3),0 1px 0 rgba(255,245,225,0.8);';

      scoreEl = document.createElement('span');
      scoreEl.style.cssText =
        'font-weight:800;color:#E85D3A;font-size:1.15rem;min-width:60px;text-align:right;' +
        'text-shadow:0 0 10px rgba(232,93,58,0.25),0 1px 0 rgba(255,245,225,0.8);';

      topBar.append(levelEl, timerRow, comboEl, scoreEl);

      // -- Recipe card (paper_card material) --
      recipeCardEl = document.createElement('div');
      recipeCardEl.style.cssText =
        'margin:8px 12px;padding:14px 18px;background:#FFFDF7;' +
        'border:2px solid #8B6F47;border-radius:12px;' +
        'box-shadow:0 4px 16px rgba(107,58,31,0.15),0 1px 3px rgba(107,58,31,0.08);' +
        'flex-shrink:0;z-index:2;position:relative;' +
        'background-image:url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100\' height=\'100\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E"),' +
        'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cline x1=\'5\' y1=\'12\' x2=\'18\' y2=\'13\' stroke=\'%238B6F47\' stroke-width=\'0.5\' opacity=\'0.04\'/%3E%3Cline x1=\'35\' y1=\'42\' x2=\'50\' y2=\'43\' stroke=\'%238B6F47\' stroke-width=\'0.4\' opacity=\'0.03\'/%3E%3Ccircle cx=\'28\' cy=\'8\' r=\'0.5\' fill=\'%238B6F47\' opacity=\'0.05\'/%3E%3Ccircle cx=\'52\' cy=\'30\' r=\'0.4\' fill=\'%238B6F47\' opacity=\'0.04\'/%3E%3C/svg%3E");';

      // -- Play area with warm cream + wood-grain --
      playAreaEl = document.createElement('div');
      playAreaEl.style.cssText =
        'position:relative;flex:1;overflow:auto;margin:8px 12px 12px;' +
        'background:#FFF8F0;border-radius:12px;z-index:2;' +
        'box-shadow:inset 0 2px 8px rgba(107,58,31,0.06);' +
        'background-image:repeating-linear-gradient(90deg,transparent,transparent 45px,rgba(139,111,71,0.03) 45px,rgba(139,111,71,0.03) 46px);';

      wrapper.append(topBar, recipeCardEl, playAreaEl);
      container.appendChild(wrapper);

      // If returning player, show continue/restart prompt
      if (highestLevel > 1) {
        showContinuePrompt(highestLevel);
      } else {
        startLevel(gameState.level());
      }
    },

    destroy() {
      if (timerHandle !== null) {
        cancelAnimationFrame(timerHandle);
        timerHandle = null;
      }
      if (hintTimeoutHandle !== null) {
        clearTimeout(hintTimeoutHandle);
        hintTimeoutHandle = null;
      }
      clearTutorialOverlay();
      tutorialActive = false;
      styleEl?.remove();
      styleEl = null;
      wrapper?.remove();
      wrapper = null;
      container = null;
      itemElements.clear();
      engineState = null;
    },

    ariaText(): string {
      if (!engineState) return 'Recipe Hunt game loading';
      if (engineState.status === 'won') return `Recipe complete! Score: ${engineState.score}`;
      if (engineState.status === 'lost') return `Time is up! Score: ${engineState.score}`;
      return (
        `Recipe Hunt level ${engineState.config.level}. ` +
        `Finding ingredients for ${engineState.recipe.name}. ` +
        `${engineState.found.length} of ${engineState.recipe.ingredients.length} found. ` +
        `${Math.ceil(engineState.timeRemaining)} seconds remaining.`
      );
    },
  };
};
