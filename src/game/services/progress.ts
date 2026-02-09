/**
 * CityLines Progress Persistence Service
 *
 * Handles saving and loading player progress to localStorage.
 * Uses the scaffold's versioned store pattern for safe persistence.
 */

import { createVersionedStore } from '~/scaffold/utils/storage';

// ============================================================================
// Types
// ============================================================================

/** Progress for the current chapter in progress */
export interface CurrentChapter {
  /** URL used to load the manifest (for resume) */
  manifestUrl: string;
  /** Unique chapter identifier */
  chapterId: string;
  /** Display name of the county */
  countyName: string;
  /** Total levels in this chapter */
  chapterLength: number;
  /** Next level to play (1-based) */
  currentLevel: number;
  /** When the chapter was started */
  startedAt: number;
  /** Tile rotations for current level (saved mid-level) */
  tileRotations?: number[];
  /** Level seed for reproducibility */
  levelSeed?: number;
}

/** Record of a completed chapter */
export interface CompletedChapter {
  chapterId: string;
  countyName: string;
  completedAt: number;
}

/** Main progress data structure */
export interface ProgressData {
  version: number;
  /** Current chapter in progress, or null if none */
  current: CurrentChapter | null;
  /** List of completed chapter IDs */
  completed: CompletedChapter[];
  /** Last time the game was played */
  lastPlayedAt: number;
}

// ============================================================================
// Defaults
// ============================================================================

const DEFAULT_PROGRESS: ProgressData = {
  version: 1,
  current: null,
  completed: [],
  lastPlayedAt: 0,
};

// ============================================================================
// Store
// ============================================================================

/** Progress store - current chapter and completed chapters */
export const progressStore = createVersionedStore<ProgressData>({
  key: 'citylines_progress',
  version: 1,
  defaults: DEFAULT_PROGRESS,
  validate: (data) => {
    if (typeof data !== 'object' || data === null) return false;
    const d = data as Record<string, unknown>;
    // Basic shape validation
    if (d.current !== null && typeof d.current !== 'object') return false;
    if (!Array.isArray(d.completed)) return false;
    return true;
  },
});

// ============================================================================
// Progress API
// ============================================================================

/**
 * Load current progress from storage.
 */
export function loadProgress(): ProgressData {
  const data = progressStore.load();
  console.log('[progress] loadProgress:', data);
  return data;
}

/**
 * Save progress to storage.
 */
export function saveProgress(data: ProgressData): void {
  const saveData = {
    ...data,
    lastPlayedAt: Date.now(),
  };
  console.log('[progress] saveProgress:', saveData);
  progressStore.save(saveData);
}

/**
 * Start a new chapter. Clears any existing current progress.
 */
export function startChapter(chapter: Omit<CurrentChapter, 'currentLevel' | 'startedAt'>): void {
  const progress = loadProgress();
  saveProgress({
    ...progress,
    current: {
      ...chapter,
      currentLevel: 1,
      startedAt: Date.now(),
    },
  });
}

/**
 * Advance to the next level in the current chapter.
 * Returns the new level number, or null if no chapter in progress.
 */
export function advanceLevel(): number | null {
  const progress = loadProgress();
  if (!progress.current) return null;

  const newLevel = progress.current.currentLevel + 1;
  saveProgress({
    ...progress,
    current: {
      ...progress.current,
      currentLevel: newLevel,
    },
  });

  return newLevel;
}

/**
 * Complete the current chapter.
 * Moves it to completed list and clears current.
 */
export function completeChapter(): void {
  const progress = loadProgress();
  if (!progress.current) return;

  const completed: CompletedChapter = {
    chapterId: progress.current.chapterId,
    countyName: progress.current.countyName,
    completedAt: Date.now(),
  };

  saveProgress({
    ...progress,
    current: null,
    completed: [...progress.completed, completed],
  });
}

/**
 * Check if a chapter has been completed.
 */
export function isChapterCompleted(chapterId: string): boolean {
  const progress = loadProgress();
  return progress.completed.some((c) => c.chapterId === chapterId);
}

/**
 * Check if there's a chapter in progress.
 */
export function hasChapterInProgress(): boolean {
  const progress = loadProgress();
  return progress.current !== null;
}

/**
 * Get the current chapter info, or null if none.
 */
export function getCurrentChapter(): CurrentChapter | null {
  const progress = loadProgress();
  return progress.current;
}

/**
 * Clear all progress (for settings menu).
 */
export function clearProgress(): void {
  progressStore.clear();
}

/**
 * Save tile rotations for the current level.
 * Called on every tile rotate to preserve mid-level state.
 */
export function saveTileState(rotations: number[], seed?: number): void {
  const progress = loadProgress();
  if (!progress.current) return;

  saveProgress({
    ...progress,
    current: {
      ...progress.current,
      tileRotations: rotations,
      levelSeed: seed ?? progress.current.levelSeed,
    },
  });
}

/**
 * Get saved tile rotations for the current level.
 * Returns null if no saved state.
 */
export function getTileState(): { rotations: number[]; seed?: number } | null {
  const progress = loadProgress();
  if (!progress.current?.tileRotations) return null;

  return {
    rotations: progress.current.tileRotations,
    seed: progress.current.levelSeed,
  };
}

/**
 * Clear tile state (called when level completes or resets).
 */
export function clearTileState(): void {
  const progress = loadProgress();
  if (!progress.current) return;

  const { tileRotations, levelSeed, ...rest } = progress.current;
  saveProgress({
    ...progress,
    current: rest as CurrentChapter,
  });
}
