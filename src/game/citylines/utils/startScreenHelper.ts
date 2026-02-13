import { getCountyConfig } from '../data/counties';
import { getCurrentChapter, hasChapterInProgress } from '~/game/services/progress';

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
const STORAGE_KEY_PLAYED = 'game_has_played';

/** Default county for new players */
const DEFAULT_COUNTY_ID = 'atlantic';
const DEFAULT_LEVEL = 1;
const TOTAL_LEVELS_PER_CHAPTER = 10;

/**
 * Determines the start screen mode and content based on saved progress
 *
 * @param debugProgress - Debug flag to simulate returning player (e.g., from URL param)
 * @returns Configuration for start screen display
 */
export function getStartScreenMode(debugProgress: boolean): StartScreenConfig {
  // Check for saved progress first
  const hasProgress = hasChapterInProgress();
  console.log('[startScreenHelper] hasChapterInProgress:', hasProgress);

  if (hasProgress) {
    const chapter = getCurrentChapter();
    console.log('[startScreenHelper] getCurrentChapter:', chapter);
    if (chapter) {
      return {
        mode: 'returning',
        countyName: chapter.countyName,
        levelNumber: chapter.currentLevel,
        totalLevels: chapter.chapterLength,
      };
    }
  }

  // Debug mode to simulate returning player
  if (debugProgress) {
    const countyConfig = getCountyConfig(DEFAULT_COUNTY_ID);
    const countyName = countyConfig?.name ?? 'Atlantic County';
    return {
      mode: 'returning',
      countyName,
      levelNumber: 3,
      totalLevels: TOTAL_LEVELS_PER_CHAPTER,
    };
  }

  // New player
  const countyConfig = getCountyConfig(DEFAULT_COUNTY_ID);
  const countyName = countyConfig?.name ?? 'Atlantic County';

  return {
    mode: 'new',
    countyName,
    levelNumber: DEFAULT_LEVEL,
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
