/**
 * Score & Progress Service — Daily Dispatch
 *
 * Handles score calculation and localStorage persistence.
 * Tracks best moves per level and calculates chapter scores
 * including eraser bonuses.
 */

import { createVersionedStore } from '~/core/utils/storage';

// ============================================================================
// Types
// ============================================================================

/** Persisted score/progress data */
export interface ScoreData {
  version: number;
  /** Current chapter index (0-based) */
  currentChapter: number;
  /** Current level within the chapter (0-based) */
  currentLevel: number;
  /** Best move counts keyed by levelId */
  bestMoves: Record<string, number>;
  /** Number of chapters completed */
  chaptersCompleted: number;
}

/** Result of saving a best-moves entry */
export interface SaveResult {
  /** Whether this was a new personal best */
  isNewBest: boolean;
}

/** Score breakdown for a chapter */
export interface ChapterScore {
  /** Points from completed levels (levelsCompleted × 100) */
  levelPoints: number;
  /** Points from unused erasers (unusedErasers × 100) */
  eraserBonus: number;
  /** Total chapter score */
  total: number;
}

// ============================================================================
// Defaults & Store
// ============================================================================

const DEFAULT_SCORE_DATA: ScoreData = {
  version: 1,
  currentChapter: 0,
  currentLevel: 0,
  bestMoves: {},
  chaptersCompleted: 0,
};

const scoreStore = createVersionedStore<ScoreData>({
  key: 'dailydispatch_progress',
  version: 1,
  defaults: DEFAULT_SCORE_DATA,
  validate: (data) => {
    if (typeof data !== 'object' || data === null) return false;
    const d = data as Record<string, unknown>;
    if (typeof d.currentChapter !== 'number') return false;
    if (typeof d.currentLevel !== 'number') return false;
    if (typeof d.bestMoves !== 'object' || d.bestMoves === null) return false;
    if (typeof d.chaptersCompleted !== 'number') return false;
    return true;
  },
});

// ============================================================================
// Score Calculation
// ============================================================================

/**
 * Calculate chapter score.
 *
 * Formula: (levelsCompleted × 100) + (unusedErasers × 100)
 *
 * @param levelsCompleted - Number of levels completed in the chapter
 * @param totalErasers - Total erasers available for the chapter
 * @param erasersUsed - Number of erasers the player used
 */
export function calculateChapterScore(
  levelsCompleted: number,
  totalErasers: number,
  erasersUsed: number,
): ChapterScore {
  const levelPoints = levelsCompleted * 100;
  const unusedErasers = Math.max(0, totalErasers - erasersUsed);
  const eraserBonus = unusedErasers * 100;

  return {
    levelPoints,
    eraserBonus,
    total: levelPoints + eraserBonus,
  };
}

// ============================================================================
// Best Moves
// ============================================================================

/**
 * Get the best (lowest) move count for a level.
 *
 * @param levelId - Unique level identifier
 * @returns Best move count, or null if level has never been completed
 */
export function getBestMoves(levelId: string): number | null {
  const data = scoreStore.load();
  const best = data.bestMoves[levelId];
  return best !== undefined ? best : null;
}

/**
 * Save a move count for a level. Only saves if it's better (lower) than
 * the existing best, or if no previous best exists.
 *
 * @param levelId - Unique level identifier
 * @param moves - Move count to save
 * @returns Whether this was a new personal best
 */
export function saveBestMoves(levelId: string, moves: number): SaveResult {
  const data = scoreStore.load();
  const existing = data.bestMoves[levelId];
  const isNewBest = existing === undefined || moves < existing;

  if (isNewBest) {
    scoreStore.save({
      ...data,
      bestMoves: { ...data.bestMoves, [levelId]: moves },
    });
  }

  return { isNewBest };
}

// ============================================================================
// Chapter / Level Tracking
// ============================================================================

/**
 * Get the current chapter and level indices.
 */
export function getCurrentProgress(): { currentChapter: number; currentLevel: number } {
  const data = scoreStore.load();
  return { currentChapter: data.currentChapter, currentLevel: data.currentLevel };
}

/**
 * Update the current chapter and level.
 */
export function setCurrentProgress(currentChapter: number, currentLevel: number): void {
  const data = scoreStore.load();
  scoreStore.save({ ...data, currentChapter, currentLevel });
}

/**
 * Increment chapters completed count.
 */
export function markChapterCompleted(): void {
  const data = scoreStore.load();
  scoreStore.save({ ...data, chaptersCompleted: data.chaptersCompleted + 1 });
}

/**
 * Get total number of chapters completed.
 */
export function getChaptersCompleted(): number {
  return scoreStore.load().chaptersCompleted;
}

// ============================================================================
// Persistence
// ============================================================================

/**
 * Load the full score data (for debugging or export).
 */
export function loadScoreData(): ScoreData {
  return scoreStore.load();
}

/**
 * Clear all score progress. Used for reset/debug.
 */
export function clearProgress(): void {
  scoreStore.clear();
}
