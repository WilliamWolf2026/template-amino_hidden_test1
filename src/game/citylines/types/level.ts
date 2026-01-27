import type { GridSize } from './grid';
import type { LandmarkPlacement, ExitPlacement, LandmarkType } from './landmark';

/** New Jersey counties available in the game */
export type County = 'atlantic' | 'bergen' | 'cape_may' | 'essex' | 'hudson';

/** Road tile types */
export type RoadTileType = 'straight' | 'corner' | 't_junction';

/** Road tile placement in level config (aligned with generator: x = column, y = row) */
export interface RoadTilePlacement {
  type: RoadTileType;
  x: number;  // Column (0-based, left to right)
  y: number;  // Row (0-based, top to bottom)
  /** Solution rotation state (0, 1, 2, 3) where 0=0°, 1=90°, 2=180°, 3=270° */
  solutionRotation: number;
  /** Initial scrambled rotation state (0, 1, 2, 3) */
  initialRotation: number;
}

/** Level configuration */
export interface LevelConfig {
  levelNumber: number;
  gridSize: GridSize;
  landmarks: LandmarkPlacement[];
  exits: ExitPlacement[];
  roadTiles: RoadTilePlacement[];
  /** County for theming */
  county: County;
  /** Story clue revealed on completion */
  clue: string;
  /** Optional celebration image URL */
  celebrationImageUrl?: string;
}

/** Chapter configuration */
export interface ChapterConfig {
  chapterNumber: number;
  county: County;
  countyLandmarks: LandmarkType[];
  levels: LevelConfig[];
  storyHeadline: string;
  storySummary: string;
}

/** Difficulty settings per GDD */
export interface DifficultySettings {
  gridSize: GridSize;
  landmarkCount: { min: number; max: number };
  detourProbability: number;
  minPathLength: number;
}

/** Difficulty presets */
export const DIFFICULTY_PRESETS: Record<string, DifficultySettings> = {
  easy: { gridSize: 4, landmarkCount: { min: 2, max: 2 }, detourProbability: 0.1, minPathLength: 3 },
  medium: { gridSize: 5, landmarkCount: { min: 3, max: 3 }, detourProbability: 0.3, minPathLength: 4 },
  hard: { gridSize: 6, landmarkCount: { min: 3, max: 4 }, detourProbability: 0.6, minPathLength: 5 },
};

/**
 * Progressive difficulty curve for chapter levels (10 levels per chapter)
 * Each chapter starts easy and ramps up to hard by level 10
 * Resets at the start of each new chapter
 */
export const CHAPTER_LEVEL_PROGRESSION: DifficultySettings[] = [
  // Level 1: Easy start (4x4, 2 landmarks, minimal wriggle)
  { gridSize: 4, landmarkCount: { min: 2, max: 2 }, detourProbability: 0.1, minPathLength: 3 },
  // Level 2: Still easy
  { gridSize: 4, landmarkCount: { min: 2, max: 2 }, detourProbability: 0.1, minPathLength: 3 },
  // Level 3: Introduce slight wriggle, optional 3rd landmark
  { gridSize: 4, landmarkCount: { min: 2, max: 3 }, detourProbability: 0.15, minPathLength: 3 },
  // Level 4: Jump to 5x5, 3 landmarks
  { gridSize: 5, landmarkCount: { min: 3, max: 3 }, detourProbability: 0.2, minPathLength: 4 },
  // Level 5: Medium difficulty, more wriggle
  { gridSize: 5, landmarkCount: { min: 3, max: 3 }, detourProbability: 0.25, minPathLength: 4 },
  // Level 6: Peak of 5x5 difficulty
  { gridSize: 5, landmarkCount: { min: 3, max: 3 }, detourProbability: 0.3, minPathLength: 4 },
  // Level 7: Jump to 6x6, significant wriggle
  { gridSize: 6, landmarkCount: { min: 3, max: 3 }, detourProbability: 0.4, minPathLength: 5 },
  // Level 8: Hard, optional 4th landmark
  { gridSize: 6, landmarkCount: { min: 3, max: 4 }, detourProbability: 0.5, minPathLength: 5 },
  // Level 9: Very hard, 4 landmarks
  { gridSize: 6, landmarkCount: { min: 4, max: 4 }, detourProbability: 0.55, minPathLength: 5 },
  // Level 10: Chapter finale, maximum difficulty
  { gridSize: 6, landmarkCount: { min: 4, max: 4 }, detourProbability: 0.6, minPathLength: 5 },
];

/**
 * Get difficulty settings for a given level number
 * Levels progress 1-10 per chapter, then reset
 *
 * @param levelNumber - Absolute level number (1-based)
 * @returns Difficulty settings for this level
 *
 * @example
 * getDifficultyForLevel(1)  // Chapter 1, Level 1 (easy)
 * getDifficultyForLevel(10) // Chapter 1, Level 10 (hard)
 * getDifficultyForLevel(11) // Chapter 2, Level 1 (reset to easy)
 */
export function getDifficultyForLevel(levelNumber: number): DifficultySettings {
  // Convert to 0-based index within chapter (0-9)
  const chapterLevelIndex = (levelNumber - 1) % 10;
  return CHAPTER_LEVEL_PROGRESSION[chapterLevelIndex];
}

/**
 * Convert DifficultySettings to GeneratorConfig
 * Maps abstract difficulty settings to concrete generator parameters
 *
 * @param difficulty - The difficulty settings to convert
 * @param baseConfig - Base generator config to merge with (provides wriggle tuning params)
 * @returns Complete generator config with difficulty-based parameters
 */
export function difficultyToGeneratorConfig(
  difficulty: DifficultySettings,
  baseConfig: {
    sidePushRadius: number;
    sidePushFactor: number;
    wriggleDistanceMagnifier: number;
    wriggleExtentChaosFactor: number;
    wrigglePasses: number;
  }
): {
  width: number;
  height: number;
  exitPoints: number;
  pointsSpacing: number;
  sidePushRadius: number;
  sidePushFactor: number;
  wriggleFactor: number;
  wriggleDistanceMagnifier: number;
  wriggleExtent: number;
  wriggleExtentChaosFactor: number;
  wrigglePasses: number;
} {
  // Pick landmark count (randomly between min and max)
  const landmarkCount = Math.floor(
    Math.random() * (difficulty.landmarkCount.max - difficulty.landmarkCount.min + 1)
  ) + difficulty.landmarkCount.min;

  return {
    width: difficulty.gridSize,
    height: difficulty.gridSize,
    exitPoints: landmarkCount,
    pointsSpacing: difficulty.minPathLength,
    sidePushRadius: baseConfig.sidePushRadius,
    sidePushFactor: baseConfig.sidePushFactor,

    // Map detourProbability to wriggleFactor
    // detourProbability 0.1-0.6 → wriggleFactor 0.2-0.999
    // Higher detourProbability = more wriggling
    wriggleFactor: 0.2 + (difficulty.detourProbability * 1.3),

    // Map detourProbability to wriggleExtent
    // More detour = more curve intensity
    wriggleExtent: 0.3 + (difficulty.detourProbability * 0.7),

    wriggleDistanceMagnifier: baseConfig.wriggleDistanceMagnifier,
    wriggleExtentChaosFactor: baseConfig.wriggleExtentChaosFactor,
    wrigglePasses: baseConfig.wrigglePasses,
  };
}
