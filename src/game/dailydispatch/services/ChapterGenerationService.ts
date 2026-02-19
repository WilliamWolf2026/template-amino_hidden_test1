import { LevelGenerationService } from './LevelGenerationService';
import { getDifficultyForLevel, difficultyToGeneratorConfig } from '../types/level';
import { getChapterLength } from '../types/section';
import type { LevelConfig } from '../types';
import type { SectionConfig } from '../types/section';
import type { GeneratorConfig } from '~/game/tuning';

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
 * This enables reproducible chapters via seeds and variable chapter lengths.
 */
export class ChapterGenerationService {
  /**
   * Generate all levels for a chapter upfront
   *
   * @param config - Section config with seeds and story clues
   * @param baseGeneratorConfig - Base tuning parameters for generation
   * @returns Generated chapter with all levels
   */
  static generateChapter(
    config: SectionConfig,
    baseGeneratorConfig: Partial<GeneratorConfig>
  ): GeneratedChapter {
    const chapterLength = getChapterLength(config);
    const levels: LevelConfig[] = [];
    const seeds: number[] = [];

    for (let i = 0; i < chapterLength; i++) {
      const levelNumber = i + 1;

      // Get seed from config or generate random
      const seed = config.levelSeeds?.[i] ?? this.generateRandomSeed();
      seeds.push(seed);

      // Get difficulty scaled to chapter length
      const difficulty = getDifficultyForLevel(levelNumber, chapterLength);

      // Convert to generator config
      const generatorConfig = difficultyToGeneratorConfig(difficulty, {
        sidePushRadius: baseGeneratorConfig.sidePushRadius ?? 2,
        sidePushFactor: baseGeneratorConfig.sidePushFactor ?? 1,
        wriggleDistanceMagnifier: baseGeneratorConfig.wriggleDistanceMagnifier ?? 4,
        wriggleExtentChaosFactor: baseGeneratorConfig.wriggleExtentChaosFactor ?? 0.8,
        wrigglePasses: baseGeneratorConfig.wrigglePasses ?? 2,
      });

      // Generate level with seed
      const level = LevelGenerationService.generateLevel(levelNumber, generatorConfig, seed);

      // Apply county from section config
      level.county = config.county;

      levels.push(level);
    }

    console.log(`[Chapter] Loaded ${chapterLength} levels`);

    return { levels, seeds, chapterLength };
  }

  /**
   * Generate a random seed for level generation
   */
  private static generateRandomSeed(): number {
    return Date.now() ^ (Math.random() * 0x100000000);
  }
}
