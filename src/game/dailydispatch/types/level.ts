import type { BlockPlacement, BlockShape } from './block';
import type { DockPlacement } from './dock';

/**
 * New Jersey counties (kept for section.ts / manifest compatibility).
 * Used for story theming, not core game mechanics.
 */
export type County = 'atlantic' | 'bergen' | 'cape_may' | 'essex' | 'hudson';

/** Complete level configuration for a sliding block puzzle */
export interface LevelConfig {
  id: string;
  blocks: BlockPlacement[];
  docks: DockPlacement[];
  gridSize: number;
  /** Story clue revealed on completion */
  clue?: string;
  /** Minimum moves to solve (set by BFS solver) */
  optimalMoves?: number;
}

/** Difficulty tier */
export type DifficultyTier = 'easy' | 'medium' | 'hard';

/** Settings per difficulty tier for level generation */
export interface DifficultySettings {
  /** Number of colored blocks with matching docks */
  colorCount: number;
  /** Number of obstacle blocks (no matching dock) */
  obstacleCount: number;
  /** Max scramble moves during backward generation */
  scrambleMoves: number;
  /** Shapes allowed at this difficulty */
  allowedShapes: BlockShape[];
}

/** Difficulty presets */
export const DIFFICULTY_PRESETS: Record<DifficultyTier, DifficultySettings> = {
  easy: {
    colorCount: 2,
    obstacleCount: 0,
    scrambleMoves: 4,
    allowedShapes: ['DOT', 'I2_H', 'I2_V', 'I3_H', 'I3_V'],
  },
  medium: {
    colorCount: 3,
    obstacleCount: 1,
    scrambleMoves: 6,
    allowedShapes: ['DOT', 'I2_H', 'I2_V', 'I3_H', 'I3_V', 'L', 'J', 'T', 'O'],
  },
  hard: {
    colorCount: 4,
    obstacleCount: 2,
    scrambleMoves: 8,
    allowedShapes: ['DOT', 'I2_H', 'I2_V', 'I3_H', 'I3_V', 'I4_H', 'I4_V', 'L', 'J', 'T', 'O', 'S', 'Z'],
  },
};

/**
 * Chapter level progression: difficulty tier per level index.
 * Keys = chapter length, values = difficulty per level.
 */
export const CHAPTER_LEVEL_PROGRESSION: Record<number, DifficultyTier[]> = {
  5: ['easy', 'medium', 'medium', 'medium', 'hard'],
  6: ['easy', 'medium', 'medium', 'medium', 'hard', 'hard'],
  7: ['easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard'],
  8: ['easy', 'easy', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard'],
  9: ['easy', 'easy', 'medium', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard'],
  10: ['easy', 'easy', 'easy', 'medium', 'medium', 'medium', 'medium', 'hard', 'hard', 'hard'],
};

/** Get difficulty tier for a specific level within a chapter */
export function getDifficultyForLevel(levelIndex: number, chapterLength: number): DifficultyTier {
  const progression = CHAPTER_LEVEL_PROGRESSION[chapterLength];
  if (!progression) {
    const ratio = levelIndex / Math.max(1, chapterLength - 1);
    if (ratio < 0.3) return 'easy';
    if (ratio < 0.7) return 'medium';
    return 'hard';
  }
  return progression[Math.min(levelIndex, progression.length - 1)];
}
