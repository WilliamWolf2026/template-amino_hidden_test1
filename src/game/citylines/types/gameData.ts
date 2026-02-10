/**
 * Backend schema types for City Lines game data.
 * These types mirror the JSON structure from the game manager API.
 */

/** Texture pack reference */
export interface TexturePackRef {
  uid: string;
  name: string;
  type: 'county-specific' | 'common';
  packFileKey: string;
}

/** County data with texture pack */
export interface CountyRef {
  uid: string;
  name: string;
  texturePack: TexturePackRef;
}

/** Story/info data for a chapter */
export interface StoryRef {
  uid: string;
  /** Introduction text (Good Boy's intro dialogue) */
  info: string;
  headline: string;
  summary: string;
  imageUrl: string;
  articleUrl: string;
}

/** Individual clue within a level */
export interface ClueRef {
  uid: string;
  text: string;
}

/** Level data from backend */
export interface LevelRef {
  uid: string;
  levelNumber: number;
  config: Record<string, unknown>;
  seed: number;
  clues: ClueRef[];
}

/** Chapter data from backend */
export interface ChapterRef {
  id: number;
  uid: string;
  name: string;
  county: CountyRef;
  story: StoryRef;
  texturePack: TexturePackRef;
  levels: LevelRef[];
}

/** Top-level game data from backend */
export interface GameData {
  uid: string;
  name: string;
  chapters: ChapterRef[];
}

/** Games index entry (from the published games list) */
export interface GameIndexEntry {
  uid: string;
  url: string;
  publishDate: string;
}

/** Games index (list of available games) */
export interface GamesIndex {
  games: GameIndexEntry[];
}
