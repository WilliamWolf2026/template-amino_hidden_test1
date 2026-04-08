/**
 * Recipe Hunt — Pure Step Function
 *
 * Deterministic: step(state, action) => newState
 * No DOM, no Math.random(), no side effects.
 */

import type { GameState, Action } from './types';

const COMBO_WINDOW_MS = 2000;
const WRONG_TAP_PENALTY_SECONDS = 3;

/**
 * Apply an action to the game state and return a new state.
 * This function is pure and deterministic.
 */
export function step(state: GameState, action: Action): GameState {
  if (state.status !== 'playing') return state;

  if (action.type === 'TAP') {
    return handleTap(state, action.itemInstanceId, action.timestamp);
  }

  return state;
}

function handleTap(state: GameState, itemInstanceId: string, timestamp: number): GameState {
  const item = state.items.find((i) => i.id === itemInstanceId);
  if (!item) return state;

  // Already found — ignore
  if (item.found) return state;

  const newTotalTaps = state.totalTaps + 1;

  if (item.isRequired) {
    // ── Correct tap ───────────────────────────────────────────────
    const alreadyFound = state.found.includes(item.ingredient.id);
    if (alreadyFound) return state; // ingredient type already collected

    // Combo: within window of last correct tap?
    const withinComboWindow =
      state.lastCorrectTapTime > 0 &&
      timestamp - state.lastCorrectTapTime <= COMBO_WINDOW_MS;
    const newCombo = withinComboWindow ? state.comboStreak + 1 : 1;
    const newMaxCombo = Math.max(state.maxCombo, newCombo);
    const newCorrectTaps = state.correctTaps + 1;

    // Points for this tap
    const comboBonus = newCombo >= 3 ? newCombo * 10 : 0;
    const tapScore = 100 + comboBonus;

    const newFound = [...state.found, item.ingredient.id];
    const newItems = state.items.map((i) =>
      i.id === itemInstanceId ? { ...i, found: true } : i,
    );

    const newScore = state.score + tapScore;

    // Check win: all recipe ingredients found?
    const allFound = state.recipe.ingredients.every((ri) =>
      newFound.includes(ri.item.id),
    );

    return {
      ...state,
      items: newItems,
      found: newFound,
      score: newScore,
      comboStreak: newCombo,
      maxCombo: newMaxCombo,
      totalTaps: newTotalTaps,
      correctTaps: newCorrectTaps,
      lastCorrectTapTime: timestamp,
      status: allFound ? 'won' : 'playing',
    };
  } else {
    // ── Wrong tap (distractor) ────────────────────────────────────
    const newStrikes = state.strikes + 1;
    const newTimeRemaining = state.timeRemaining - WRONG_TAP_PENALTY_SECONDS;
    const isLost = newTimeRemaining <= 0;

    return {
      ...state,
      strikes: newStrikes,
      comboStreak: 0,
      totalTaps: newTotalTaps,
      timeRemaining: Math.max(0, newTimeRemaining),
      status: isLost ? 'lost' : 'playing',
    };
  }
}

/**
 * Tick the timer down by `dt` seconds. Returns new state.
 * Pure — call this from the controller's timer loop.
 */
export function tickTimer(state: GameState, dt: number): GameState {
  if (state.status !== 'playing') return state;
  const newTime = state.timeRemaining - dt;
  if (newTime <= 0) {
    return { ...state, timeRemaining: 0, status: 'lost' };
  }
  return { ...state, timeRemaining: newTime };
}
