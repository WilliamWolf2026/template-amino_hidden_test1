/**
 * Recipe Hunt — Scoring
 *
 * Deterministic scoring: base + multipliers.
 * base = (ingredientsFound * 100) + (timeRemaining * 10)
 * final = floor(base * accuracy_mult * combo_mult * speed_mult)
 */

import type { GameState } from './types';
import { getTierForLevel } from './recipes';

export interface ScoreBreakdown {
  base: number;
  ingredientPoints: number;
  timePoints: number;
  accuracyMult: number;
  comboMult: number;
  speedMult: number;
  tierMult: number;
  finalScore: number;
}

/**
 * Calculate full score breakdown from a completed game state.
 */
export function calculateScore(state: GameState): ScoreBreakdown {
  const ingredientPoints = state.found.length * 100;
  const timePoints = state.status === 'won' ? Math.max(0, Math.floor(state.timeRemaining)) * 10 : 0;
  const base = ingredientPoints + timePoints;

  // accuracy_mult = 1.0 + (0.5 * (correct / total))  — ranges from 1.0 to 1.5
  const accuracyMult =
    state.totalTaps > 0
      ? 1.0 + 0.5 * (state.correctTaps / state.totalTaps)
      : 1.0;

  // combo_mult = 1.0 + (0.1 * maxCombo)
  const comboMult = 1.0 + 0.1 * state.maxCombo;

  // speed_mult = 1.3 if won in under half the time limit, else 1.0
  const halfTime = state.config.timeLimit / 2;
  const timeUsed = state.config.timeLimit - state.timeRemaining;
  const speedMult = state.status === 'won' && timeUsed < halfTime ? 1.3 : 1.0;

  // level_tier_mult = tier (1-4) per macro loop scoring spec
  const tierMult = getTierForLevel(state.config.level);

  const finalScore = Math.floor(base * accuracyMult * comboMult * speedMult * tierMult);

  return {
    base,
    ingredientPoints,
    timePoints,
    accuracyMult,
    comboMult,
    speedMult,
    tierMult,
    finalScore,
  };
}

/**
 * Calculate star rating from score.
 * 1 star at 50%, 2 stars at 75%, 3 stars at 95% of max possible.
 */
export function calculateStars(score: number, maxPossible: number): number {
  if (maxPossible <= 0) return 0;
  const ratio = score / maxPossible;
  if (ratio >= 0.95) return 3;
  if (ratio >= 0.75) return 2;
  if (ratio >= 0.50) return 1;
  return 0;
}

/**
 * Estimate the maximum possible score for a level config.
 * Assumes perfect play: all found, full time remaining, 100% accuracy, max combo, speed bonus.
 */
export function estimateMaxScore(
  ingredientCount: number,
  timeLimit: number,
  level: number = 1,
): number {
  const base = ingredientCount * 100 + timeLimit * 10;
  const accuracyMult = 1.5; // perfect accuracy
  const comboMult = 1.0 + 0.1 * ingredientCount; // max combo = all ingredients
  const speedMult = 1.3; // speed bonus
  const tierMult = getTierForLevel(level);
  return Math.floor(base * accuracyMult * comboMult * speedMult * tierMult);
}
