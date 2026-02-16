/**
 * Chapter Catalog Service
 *
 * Fetches the chapter index (index.json) and provides navigation
 * through the ordered list of chapters. Resolves chapter URLs
 * against the current environment's chapters base URL.
 */

import type { GameData, GamesIndex, GameIndexEntry } from '~/game/citylines/types/gameData';
import { getChaptersUrl, getGamesIndexUrl } from '~/game/config/environment';
import { fetchGamesIndex, fetchGameData } from './chapterLoader';

// ============================================================================
// Types
// ============================================================================

interface CatalogState {
  index: GamesIndex;
  currentIndex: number;
}

// ============================================================================
// Module state
// ============================================================================

let catalog: CatalogState | null = null;

// ============================================================================
// URL resolution
// ============================================================================

/**
 * Resolve a chapter entry URL to an absolute fetch URL.
 * Full URLs pass through; relative names resolve against getChaptersUrl().
 */
export function resolveChapterUrl(url: string): string {
  if (url.startsWith('http')) return url;
  return `${getChaptersUrl()}/${url}`;
}

// ============================================================================
// Catalog API
// ============================================================================

/**
 * Initialize the catalog by fetching index.json.
 * On failure, returns a single-entry fallback catalog.
 */
export async function initCatalog(): Promise<CatalogState> {
  try {
    // Prefer server storage URL, fall back to CDN chapters path
    // Old: const url = `${getChaptersUrl()}/index.json`;
    const url = getGamesIndexUrl() ?? `${getChaptersUrl()}/index.json`;
    console.log('[Catalog] Fetching index:', url);
    const index = await fetchGamesIndex(url);
    catalog = { index, currentIndex: 0 };
    console.log(`[Catalog] Loaded ${index.games.length} chapters`);
  } catch (err) {
    console.warn('[Catalog] Failed to fetch index, using fallback:', err);
    catalog = {
      index: { games: [{ uid: 'fallback', url: 'default.json', publishDate: '' }] },
      currentIndex: 0,
    };
  }
  return catalog;
}

/** Get current catalog state. Must call initCatalog() first. */
export function getCatalog(): CatalogState | null {
  return catalog;
}

/** Set current chapter index (used for resume). */
export function setCatalogIndex(index: number): void {
  if (!catalog) return;
  catalog.currentIndex = Math.max(0, Math.min(index, catalog.index.games.length - 1));
}

/** Check if there's a chapter after the current one. */
export function hasNextChapter(): boolean {
  if (!catalog) return false;
  return catalog.currentIndex < catalog.index.games.length - 1;
}

/** Get the current catalog entry. */
export function getCurrentEntry(): GameIndexEntry | null {
  if (!catalog) return null;
  return catalog.index.games[catalog.currentIndex] ?? null;
}

/**
 * Fetch the chapter at a specific catalog index.
 * Returns null if out of bounds or fetch fails.
 */
export async function fetchChapterAtIndex(index: number): Promise<GameData | null> {
  if (!catalog || index < 0 || index >= catalog.index.games.length) return null;

  const entry = catalog.index.games[index];
  const url = resolveChapterUrl(entry.url);

  try {
    console.log(`[Catalog] Fetching chapter ${index}: ${url}`);
    const data = await fetchGameData(url);
    catalog.currentIndex = index;
    return data;
  } catch (err) {
    console.error(`[Catalog] Failed to fetch chapter ${index}:`, err);
    return null;
  }
}

/**
 * Advance to the next chapter and fetch it.
 * Returns null if no more chapters or fetch fails.
 */
export async function fetchNextChapter(): Promise<GameData | null> {
  if (!catalog || !hasNextChapter()) return null;
  return fetchChapterAtIndex(catalog.currentIndex + 1);
}

/**
 * Find a chapter's catalog index by its uid.
 * Returns -1 if not found.
 */
export function findIndexByUid(uid: string): number {
  if (!catalog) return -1;
  return catalog.index.games.findIndex((g) => g.uid === uid);
}
