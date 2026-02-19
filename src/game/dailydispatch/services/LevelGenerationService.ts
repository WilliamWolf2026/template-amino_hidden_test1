import type { LevelConfig, DifficultySettings } from '../types/level';
import { generatePuzzle } from '../core/SlidingPuzzleGenerator';

/**
 * Service for generating procedural sliding block puzzle levels.
 * Uses backward generation + BFS solver verification.
 */
export class LevelGenerationService {
  /**
   * Generate a new sliding block puzzle level.
   *
   * @param levelNumber - Level number (1-based)
   * @param difficulty - Difficulty settings for the level
   * @param seed - Seed for reproducible generation
   * @returns Generated LevelConfig, or null if generation failed
   */
  static generateLevel(
    levelNumber: number,
    difficulty: DifficultySettings,
    seed: number,
  ): LevelConfig | null {
    return generatePuzzle({
      difficulty,
      seed,
      levelId: `level_${levelNumber}`,
    });
  }
}
