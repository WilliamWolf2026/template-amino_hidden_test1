import { LevelGenerationService } from './LevelGenerationService';
import { getDifficultyForLevel, DIFFICULTY_PRESETS } from '../types/level';
import { getChapterLength } from '../types/section';
import type { LevelConfig } from '../types';
import type { SectionConfig } from '../types/section';

/** Result of generating a full chapter */
export interface GeneratedChapter {
  /** All pre-generated levels for the chapter */
  levels: LevelConfig[];
  /** Seeds used for each level (for debugging/reproducibility) */
  seeds: number[];
  /** Number of levels in this chapter */
  chapterLength: number;
}

/**
 * Service for generating complete chapters with all levels upfront.
 * Uses the sliding puzzle generator with difficulty progression.
 */
export class ChapterGenerationService {
  /**
   * Generate all levels for a chapter upfront.
   *
   * @param config - Section config with seeds and story clues
   * @returns Generated chapter with all levels
   */
  static generateChapter(config: SectionConfig): GeneratedChapter {
    const chapterLength = getChapterLength(config);
    const levels: LevelConfig[] = [];
    const seeds: number[] = [];

    for (let i = 0; i < chapterLength; i++) {
      const levelNumber = i + 1;

      // Get seed from config or generate random
      const seed = config.levelSeeds?.[i] ?? this.generateRandomSeed();
      seeds.push(seed);

      // Get difficulty tier scaled to chapter length
      const tier = getDifficultyForLevel(i, chapterLength);
      const difficulty = DIFFICULTY_PRESETS[tier];

      // Generate level
      const level = LevelGenerationService.generateLevel(levelNumber, difficulty, seed);

      if (level) {
        // Apply clue from section config if available
        const clue = config.story.clues?.[i];
        if (clue) level.clue = clue;

        levels.push(level);
      } else {
        console.warn(`[Chapter] Failed to generate level ${levelNumber}, using fallback`);
        levels.push(this.createFallbackLevel(levelNumber));
      }
    }

    console.log(`[Chapter] Generated ${levels.length}/${chapterLength} levels`);

    return { levels, seeds, chapterLength };
  }

  private static generateRandomSeed(): number {
    return Date.now() ^ (Math.random() * 0x100000000);
  }

  /** Minimal 1-block level as a fallback */
  private static createFallbackLevel(levelNumber: number): LevelConfig {
    return {
      id: `fallback_${levelNumber}`,
      blocks: [
        { id: 'block_blue', color: 'blue', shape: 'I2_H', position: { col: 2, row: 2 } },
      ],
      docks: [
        { id: 'dock_blue', color: 'blue', wall: 'right', wallIndices: [2] },
      ],
      gridSize: 6,
      optimalMoves: 1,
    };
  }
}
