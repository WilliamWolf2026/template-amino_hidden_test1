import type { GameTuningBase } from '~/scaffold/systems/tuning/types';
import type { GridSize } from '~/game/citylines/types/grid';

// ============================================
// CITYLINES TUNING TYPES
// ============================================

export type TileTheme = 'regular' | 'fall' | 'winter';

export interface ThemeConfig {
  tileTheme: TileTheme;
}

/** Map tile theme to bundle name */
export function getTileBundleName(theme: TileTheme): string {
  switch (theme) {
    case 'fall':
      return 'tiles_citylines_v1_fall';
    case 'winter':
      return 'tiles_citylines_v1_winter';
    default:
      return 'tiles_citylines_v1';
  }
}

/** Parse theme from URL params (?theme=fall or ?theme=winter) */
export function getThemeFromUrl(): TileTheme | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const theme = params.get('theme');
  if (theme === 'fall' || theme === 'winter' || theme === 'regular') {
    return theme;
  }
  return null;
}

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
  tileRotateDuration: number;
  tileRotateEasing: string;
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
}

export interface SpritesConfig {
  landmarkScale: number;
  exitScale: number;
  connectionIndicatorSize: number;
  connectionIndicatorOffset: number;
}

export interface GameAnimationConfig {
  connectionPulseDuration: number;
  levelCompleteDelay: number;
}

export interface VfxConfig {
  rotateAlpha: number;
  rotateSizePercent: number;
}

export interface CompanionAnimationConfig {
  // Slide-in animation timing
  slideInDelay: number;
  slideInDuration: number;
  slideInEasing: string;
  // Slide-out animation timing
  slideOutDuration: number;
  slideOutEasing: string;
  // Overlay fade timing
  overlayFadeInDuration: number;
  overlayFadeOutDuration: number;
  overlayAlpha: number;
}

export interface CluePopupConfig {
  /** Duration popup is displayed before auto-dismiss (ms) @min 1000 @max 10000 @step 500 */
  displayDuration: number;
  /** Fade in duration (ms) @min 100 @max 1000 @step 50 */
  fadeInDuration: number;
  /** Fade out duration (ms) @min 100 @max 1000 @step 50 */
  fadeOutDuration: number;
}

export interface CompletionPaintConfig {
  /** Time for pulse to travel between tiles (ms) @min 20 @max 200 @step 10 */
  staggerDelay: number;
  /** How long each tile stays bright as pulse passes (ms) @min 50 @max 300 @step 25 */
  tileDuration: number;
  /** Easing function for flash fade */
  easing: string;
  /** Size of blast VFX as percentage of tile size @min 50 @max 400 @step 10 */
  blastSizePercent: number;
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

export interface LevelTransitionConfig {
  /** Delay before transition starts (ms) @min 0 @max 1000 @step 50 */
  startDelay: number;
  /** Duration of each element's animation (ms) @min 100 @max 1000 @step 50 */
  elementDuration: number;
  /** Delay between diagonal waves (ms) @min 0 @max 200 @step 10 */
  diagonalStagger: number;
  /** Delay between elements in same diagonal (ms) @min 0 @max 100 @step 5 */
  elementStagger: number;
  /** Easing function for element pop-in */
  elementEasing: string;
  /** Easing function for background resize */
  backgroundEasing: string;
  /** Whether to animate background resize */
  animateBackground: boolean;
}

export interface GeneratorConfig {
  /** Grid width (4-6 per GDD, max 12) @min 4 @max 12 @step 1 */
  width: number;
  /** Grid height (4-6 per GDD, max 12) @min 4 @max 12 @step 1 */
  height: number;
  /** Number of exit points (landmarks) @min 1 @max 4 @step 1 */
  exitPoints: number;
  /** Points spacing (must be < (width+height)/2, conservative max for small grids) @min 1 @max 4 @step 1 */
  pointsSpacing: number;
  /** Side push radius (must be <= max(width,height)/2, conservative max for small grids) @min 0 @max 2 @step 1 */
  sidePushRadius: number;
  /** Side push factor @min 0 @max 2 @step 0.1 */
  sidePushFactor: number;
  /** Wriggle factor (path curvature) @min 0 @max 1 @step 0.001 */
  wriggleFactor: number;
  /** Wriggle distance magnifier @min 0 @max 10 @step 0.5 */
  wriggleDistanceMagnifier: number;
  /** Wriggle extent (curve intensity) @min 0 @max 1 @step 0.05 */
  wriggleExtent: number;
  /** Wriggle extent chaos factor @min 0 @max 1 @step 0.05 */
  wriggleExtentChaosFactor: number;
  /** Number of wriggle passes @min 1 @max 5 @step 1 */
  wrigglePasses: number;
}

export interface CityLinesTuning extends GameTuningBase {
  theme: ThemeConfig;
  grid: GridConfig;
  difficulty: {
    easy: DifficultyConfig;
    medium: DifficultyConfig;
    hard: DifficultyConfig;
  };
  visuals: VisualsConfig;
  sprites: SpritesConfig;
  animation: GameAnimationConfig;
  vfx: VfxConfig;
  companion: CompanionAnimationConfig;
  cluePopup: CluePopupConfig;
  completionPaint: CompletionPaintConfig;
  scoring: ScoringConfig;
  screens: GameScreensConfig;
  generator: GeneratorConfig;
  levelTransition: LevelTransitionConfig;
}

// ============================================
// DEFAULT VALUES
// ============================================

export const CITYLINES_DEFAULTS: CityLinesTuning = {
  version: '1.0.0',
  theme: {
    tileTheme: 'regular',
  },
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
    tileRotateDuration: 600,
    tileRotateEasing: 'elastic.out(1, 0.5)',
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
  },
  sprites: {
    landmarkScale: 0.85,
    exitScale: 0.85,
    connectionIndicatorSize: 0.08,
    connectionIndicatorOffset: 0.42,
  },
  animation: {
    connectionPulseDuration: 300,
    levelCompleteDelay: 500,
  },
  vfx: {
    rotateAlpha: 1,
    rotateSizePercent: 165,
  },
  companion: {
    slideInDelay: 500,
    slideInDuration: 500,
    slideInEasing: 'elastic.out(1, 0.5)',
    slideOutDuration: 400,
    slideOutEasing: 'power2.in',
    overlayFadeInDuration: 400,
    overlayFadeOutDuration: 300,
    overlayAlpha: 0.6,
  },
  cluePopup: {
    displayDuration: 3000,
    fadeInDuration: 400,
    fadeOutDuration: 300,
  },
  completionPaint: {
    staggerDelay: 50,
    tileDuration: 150,
    easing: 'power2.out',
    blastSizePercent: 200,
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
  generator: {
    width: 4,
    height: 4,
    exitPoints: 1,
    pointsSpacing: 3,
    sidePushRadius: 2,
    sidePushFactor: 1,
    wriggleFactor: 0.999,
    wriggleDistanceMagnifier: 4,
    wriggleExtent: 0.7,
    wriggleExtentChaosFactor: 0.8,
    wrigglePasses: 2,
  },
  levelTransition: {
    startDelay: 200,
    elementDuration: 300,
    diagonalStagger: 50,
    elementStagger: 20,
    elementEasing: 'back.out(1.2)',
    backgroundEasing: 'power2.out',
    animateBackground: true,
  },
};
