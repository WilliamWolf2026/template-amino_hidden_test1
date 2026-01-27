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
