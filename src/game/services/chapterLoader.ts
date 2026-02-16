/**
 * Chapter loader service.
 * Fetches game data from the games index, loads individual game manifests,
 * and converts the new backend schema into the existing LevelManifest format.
 */

import type { GameData, GamesIndex, ChapterRef } from '~/game/citylines/types/gameData';
import type { County } from '~/game/citylines/types/level';
import type { LevelManifest, StoryData } from '~/game/citylines/types/section';
import { VALID_COUNTIES } from '~/game/citylines/types/section';

async function fetchJson<T>(url: string, label: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`[ChapterLoader] Failed to fetch ${label}: HTTP ${response.status}`);
  }
  return response.json();
}

/** Fetch the games index from a URL. */
export const fetchGamesIndex = (url: string) => fetchJson<GamesIndex>(url, 'games index');

/** Fetch game data from a game's download URL. */
export const fetchGameData = (url: string) => fetchJson<GameData>(url, 'game data');

/**
 * Convert a ChapterRef from the new backend schema into a LevelManifest
 * for backward compatibility with the existing game systems.
 */
export function chapterRefToLevelManifest(chapter: ChapterRef): LevelManifest {
  // Resolve county — validate against known counties, fallback to 'atlantic'
  const countyName = chapter.county.name as County;
  const county: County = VALID_COUNTIES.includes(countyName) ? countyName : 'atlantic';

  // Flatten clues: take the first clue text from each level's clues array
  const clues: string[] = chapter.levels.map((level) => {
    if (level.clues.length > 0) {
      return level.clues[0].text;
    }
    return '';
  });

  // Extract seeds from levels
  const levelSeeds: number[] = chapter.levels.map((level) => level.seed);

  // Build story data (prefer new field names, fall back to legacy)
  const story: StoryData = {
    headline: chapter.story.headline,
    summary: chapter.story.chapterStart ?? chapter.story.summary ?? '',
    completion: chapter.story.completion ?? '',
    imageUrl: chapter.story.imageUrl,
    articleUrl: chapter.story.articleUrl,
    clues,
  };

  return {
    levelId: chapter.uid,
    county,
    story,
    levelSeeds,
  };
}

/**
 * Get the introduction text for a chapter (Goodboi's intro dialogue).
 * Prefers `story.intro`, falls back to legacy `story.info`.
 */
export function getChapterIntroduction(chapter: ChapterRef): string {
  return chapter.story.intro ?? chapter.story.info ?? '';
}

/**
 * Get the texture pack file key for a chapter.
 * Returns the chapter-level texture pack (common type).
 */
export function getChapterTexturePack(chapter: ChapterRef): string {
  return chapter.texturePack.packFileKey;
}

/**
 * Get the county-specific texture pack file key.
 */
export function getCountyTexturePack(chapter: ChapterRef): string {
  return chapter.county.texturePack.packFileKey;
}

/**
 * Select a chapter from game data by index (0-based).
 * Returns null if the index is out of bounds.
 */
export function getChapterByIndex(gameData: GameData, index: number): ChapterRef | null {
  if (index < 0 || index >= gameData.chapters.length) {
    return null;
  }
  return gameData.chapters[index];
}

/**
 * Select a chapter from game data by UID.
 */
export function getChapterByUid(gameData: GameData, uid: string): ChapterRef | null {
  return gameData.chapters.find((c) => c.uid === uid) ?? null;
}
