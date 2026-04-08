import type { GameTuningBase } from '~/core/systems/tuning/types';

// ============================================
// GAME TUNING TYPES — Recipe Hunt
//
// Add your game-specific tuning interfaces here.
// Each section maps to a Tweakpane folder in dev mode.
// ============================================

export interface DevModeConfig {
  /** Skip the start screen and go directly into gameplay */
  skipStartScreen: boolean;
}

export interface GameScreensConfig {
  startBackgroundColor: string;
  loadingBackgroundColor: string;
}

export interface GameplayConfig {
  basePointsPerIngredient: number;
  timePointsPerSecond: number;
  wrongTapPenaltySeconds: number;
  comboWindowMs: number;
  hintDelaySeconds: number;
  minItemSpacingPx: number;
  tapTargetMinPx: number;
  popDurationMs: number;
  shakeDurationMs: number;
  itemFadeInMs: number;
}

export interface GameTuning extends GameTuningBase {
  devMode: DevModeConfig;
  screens: GameScreensConfig;
  gameplay: GameplayConfig;
}

// ============================================
// DEFAULT VALUES
// ============================================

export const GAME_DEFAULTS: GameTuning = {
  version: '1.0.0',
  devMode: {
    skipStartScreen: false,
  },
  screens: {
    startBackgroundColor: '#FFF8F0',
    loadingBackgroundColor: '#FFF8F0',
  },
  gameplay: {
    basePointsPerIngredient: 100,
    timePointsPerSecond: 10,
    wrongTapPenaltySeconds: 3,
    comboWindowMs: 2000,
    hintDelaySeconds: 10,
    minItemSpacingPx: 44,
    tapTargetMinPx: 44,
    popDurationMs: 150,
    shakeDurationMs: 200,
    itemFadeInMs: 300,
  },
};

// ============================================
// HELPERS
// ============================================

/** Parse theme from URL params — override in your game if needed */
export function getThemeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('theme') ?? null;
}
