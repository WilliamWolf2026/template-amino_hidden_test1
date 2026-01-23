import type { GameTuningBase } from '~/scaffold/systems/tuning/types';
import type { GridSize } from '~/game/citylines/types/grid';

// ============================================
// CITYLINES TUNING TYPES
// ============================================

export interface NineSliceConfig {
  leftWidth: number;
  topHeight: number;
  rightWidth: number;
  bottomHeight: number;
}

export interface GridConfig {
  tileSize: number;
  defaultGridSize: GridSize;
  padding: number;
  cellGap: number;
  nineSlice: NineSliceConfig;
}

export interface LandmarkCountRange {
  min: number;
  max: number;
}

export interface DifficultyConfig {
  gridSize: GridSize;
  landmarkCount: LandmarkCountRange;
  detourProbability: number;
  minPathLength: number;
}

export interface VisualsConfig {
  backgroundColor: string;
  roadConnectedTint: string;
  roadDisconnectedTint: string;
  landmarkConnectedScale: number;
  landmarkConnectedAlpha: number;
  landmarkDisconnectedAlpha: number;
  highlightColor: string;
  connectedIndicatorColor: string;
  disconnectedIndicatorColor: string;
}

export interface SpritesConfig {
  landmarkScale: number;
  exitScale: number;
  connectionIndicatorSize: number;
  connectionIndicatorOffset: number;
}

export interface GameAnimationConfig {
  tileRotateDuration: number;
  tileRotateEasing: string;
  connectionPulseDuration: number;
  levelCompleteDelay: number;
}

export interface ScoringConfig {
  baseScore: number;
  timeBonus: number;
  perfectBonus: number;
  movesPenalty: number;
}

export interface GameScreensConfig {
  startBackgroundColor: string;
  loadingBackgroundColor: string;
}

export interface CityLinesTuning extends GameTuningBase {
  grid: GridConfig;
  difficulty: {
    easy: DifficultyConfig;
    medium: DifficultyConfig;
    hard: DifficultyConfig;
  };
  visuals: VisualsConfig;
  sprites: SpritesConfig;
  animation: GameAnimationConfig;
  scoring: ScoringConfig;
  screens: GameScreensConfig;
}

// ============================================
// DEFAULT VALUES
// ============================================

export const CITYLINES_DEFAULTS: CityLinesTuning = {
  version: '1.0.0',
  grid: {
    tileSize: 96,
    defaultGridSize: 4,
    padding: 20,
    cellGap: 0,
    nineSlice: {
      leftWidth: 20,
      topHeight: 20,
      rightWidth: 20,
      bottomHeight: 20,
    },
  },
  difficulty: {
    easy: {
      gridSize: 4,
      landmarkCount: { min: 2, max: 2 },
      detourProbability: 0.1,
      minPathLength: 3,
    },
    medium: {
      gridSize: 5,
      landmarkCount: { min: 3, max: 3 },
      detourProbability: 0.3,
      minPathLength: 4,
    },
    hard: {
      gridSize: 6,
      landmarkCount: { min: 3, max: 4 },
      detourProbability: 0.6,
      minPathLength: 5,
    },
  },
  visuals: {
    backgroundColor: '#58A23B',
    roadConnectedTint: '#ffffff',
    roadDisconnectedTint: '#888888',
    landmarkConnectedScale: 1.1,
    landmarkConnectedAlpha: 1.0,
    landmarkDisconnectedAlpha: 0.9,
    highlightColor: '#ffcc00',
    connectedIndicatorColor: '#27ae60',
    disconnectedIndicatorColor: '#cccccc',
  },
  sprites: {
    landmarkScale: 0.85,
    exitScale: 0.85,
    connectionIndicatorSize: 0.08,
    connectionIndicatorOffset: 0.42,
  },
  animation: {
    tileRotateDuration: 200,
    tileRotateEasing: 'elastic.out(1, 0.5)',
    connectionPulseDuration: 300,
    levelCompleteDelay: 500,
  },
  scoring: {
    baseScore: 100,
    timeBonus: 10,
    perfectBonus: 50,
    movesPenalty: 5,
  },
  screens: {
    startBackgroundColor: '#BCE083',
    loadingBackgroundColor: '#BCE083',
  },
};
