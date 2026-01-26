import { getCountyConfig } from '../data/counties';

/** Start screen display mode */
export type StartScreenMode = 'new' | 'returning';

/** Start screen configuration */
export interface StartScreenConfig {
  mode: StartScreenMode;
  countyName: string;
  levelNumber: number;
  totalLevels: number;
}

/** localStorage key for tracking if player has started the game before */
const STORAGE_KEY_PLAYED = 'citylines_has_played';

/** Default county for new players */
const DEFAULT_COUNTY_ID = 'atlantic';
const DEFAULT_LEVEL = 1;
const TOTAL_LEVELS_PER_CHAPTER = 10;

/**
 * Determines the start screen mode and content based on debug params
 *
 * Pure function - no side effects, easily testable
 *
 * @param debugProgress - Debug flag to simulate returning player (e.g., from URL param)
 * @returns Configuration for start screen display
 */
export function getStartScreenMode(debugProgress: boolean): StartScreenConfig {
  const mode: StartScreenMode = debugProgress ? 'returning' : 'new';
  const countyConfig = getCountyConfig(DEFAULT_COUNTY_ID);
  const countyName = countyConfig?.name ?? 'Atlantic County';

  // For debug/returning mode, simulate progress at level 3
  const levelNumber = debugProgress ? 3 : DEFAULT_LEVEL;

  return {
    mode,
    countyName,
    levelNumber,
    totalLevels: TOTAL_LEVELS_PER_CHAPTER,
  };
}

/**
 * Checks if the player has started the game before
 *
 * @returns true if player has played before, false otherwise
 */
export function hasPlayedBefore(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY_PLAYED) === 'true';
  } catch {
    return false;
  }
}

/**
 * Marks that the player has started the game
 *
 * Called when player clicks START button for the first time
 */
export function markAsPlayed(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PLAYED, 'true');
  } catch {
    // Ignore storage errors (quota exceeded, privacy mode, etc.)
  }
}
