import type { GridSize } from './grid';
import type { LandmarkPlacement, ExitPlacement, LandmarkType } from './landmark';

/** Road tile types */
export type RoadTileType = 'straight' | 'corner' | 't_junction';

/** Road tile placement in level config */
export interface RoadTilePlacement {
  type: RoadTileType;
  row: number;
  col: number;
  /** Solution rotation (0, 90, 180, 270) */
  solutionRotation: number;
  /** Initial scrambled rotation */
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
  county: string;
  /** Story clue revealed on completion */
  clue?: string;
}

/** Chapter configuration */
export interface ChapterConfig {
  chapterNumber: number;
  county: string;
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
