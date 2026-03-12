/**
 * Game Configuration
 *
 * Single source of truth for game identity, environment URLs,
 * asset manifest, screen wiring, fonts, and data types.
 *
 * When forking for a new game, update this file.
 */

import { lazy, type Component } from 'solid-js';
import type { ViewportMode } from '~/core/systems/tuning/types';
import {
  getEnvironment,
  getCdnBaseUrl,
  isLocal,
  type Environment,
} from '~/core/config';
import { LoadingScreen } from './screens/LoadingScreen';
import { ResultsScreen } from './screens/ResultsScreen';

// Re-export scaffold utilities for convenience
export { getEnvironment, isLocal, isProduction } from '~/core/config';
export type { Environment } from '~/core/config';

// ============================================================================
// IDENTITY
// ============================================================================

/** Analytics event tag and GameKit project ID */
export const GAME_ID = 'mygame';

/** URL-safe slug used in CDN paths, asset names, storage keys */
export const GAME_SLUG = 'mygame';

/** Human-readable display name */
export const GAME_NAME = 'My Game';

/** CDN path segment for this game's assets and data */
export const GAME_CDN_PATH = `games/${GAME_SLUG}/data`;

/** localStorage key prefix for analytics */
export const GAME_STORAGE_PREFIX = `${GAME_SLUG}_`;

/** Game font family — loaded via @font-face in app.css */
export const GAME_FONT_FAMILY = 'Baloo, system-ui, sans-serif';

// ============================================================================
// ENVIRONMENT
// ============================================================================

const GAME_PATHS = {
  gamePath: GAME_CDN_PATH,
  localAssetPath: '/assets',
  localChaptersPath: '/chapters',
  /** @deprecated Use localChaptersPath */
  localLevelsPath: '/levels',
  gamesIndexPath: `${GAME_SLUG}/games/index.json`,
};

const SERVER_STORAGE_URLS: Record<Environment, string | null> = {
  local: 'http://localhost:4443/download/storage/v1/b/advance-game-manager-bucket/o',
  development: 'http://localhost:4443/download/storage/v1/b/advance-game-manager-bucket/o',
  qa: 'https://storage.googleapis.com/daily-dispatch-server-qa-storage',
  staging: 'http://localhost:4443/download/storage/v1/b/advance-game-manager-bucket/o',
  production: 'http://localhost:4443/download/storage/v1/b/advance-game-manager-bucket/o',
};

export const getLocalAssetPath = (): string => GAME_PATHS.localAssetPath;

export const getCdnUrl = (): string => {
  const baseUrl = getCdnBaseUrl();
  if (!baseUrl) return GAME_PATHS.localAssetPath;
  return `${baseUrl}/${GAME_PATHS.gamePath}/assets`;
};

export const getChaptersUrl = (): string => {
  const baseUrl = getCdnBaseUrl();
  if (!baseUrl) return GAME_PATHS.localChaptersPath;
  return `${baseUrl}/${GAME_PATHS.gamePath}/chapters`;
};

/** @deprecated Use getChaptersUrl() */
export const getLevelsUrl = (): string => {
  const baseUrl = getCdnBaseUrl();
  if (!baseUrl) return GAME_PATHS.localLevelsPath;
  return `${baseUrl}/${GAME_PATHS.gamePath}/levels`;
};

export const resolveLevelUrl = (levelParam: string): string => {
  if (levelParam.startsWith('http') || levelParam.startsWith('/')) return levelParam;
  return `${getLevelsUrl()}/${levelParam}.json`;
};

export const getServerStorageUrl = (): string | null => {
  return SERVER_STORAGE_URLS[getEnvironment()];
};

export const getGamesIndexUrl = (): string | null => {
  const storageUrl = getServerStorageUrl();
  if (!storageUrl) return null;
  if (storageUrl.includes('localhost')) {
    const encoded = GAME_PATHS.gamesIndexPath.replace(/\//g, '%2F');
    return `${storageUrl}/${encoded}?alt=media`;
  }
  return `${storageUrl}/${GAME_PATHS.gamesIndexPath}`;
};

// ============================================================================
// DATA TYPES (backend schema)
// ============================================================================

export interface TexturePackRef {
  uid: string;
  name: string;
  type: 'county-specific' | 'common';
  packFileKey: string;
}

export interface CountyRef {
  uid: string;
  name: string;
  texturePack: TexturePackRef;
}

export interface StoryRef {
  uid: string;
  intro?: string;
  chapterStart?: string;
  completion?: string;
  headline: string;
  imageUrl: string;
  articleUrl: string;
  /** @deprecated Use `intro` */
  info?: string;
  /** @deprecated Use `chapterStart` */
  summary?: string;
}

export interface ClueRef {
  uid: string;
  text: string;
}

export interface LevelRef {
  uid: string;
  levelNumber: number;
  config: Record<string, unknown>;
  seed: number;
  clues: ClueRef[];
}

export interface ChapterRef {
  id: number;
  uid: string;
  name: string;
  county: CountyRef;
  story: StoryRef;
  texturePack: TexturePackRef;
  levels: LevelRef[];
}

export interface GameData {
  uid: string;
  name: string;
  chapters: ChapterRef[];
}

export interface GameIndexEntry {
  uid: string;
  url: string;
  publishDate: string;
}

export interface GamesIndex {
  games: GameIndexEntry[];
}

export interface DialogueMessage {
  id: string;
  speaker?: string;
  text: string;
}

// ============================================================================
// MANIFEST
// ============================================================================

import { manifest as _manifest } from './asset-manifest';
import type { Manifest } from '~/core/systems/assets';

export const manifest: Manifest = {
  ..._manifest,
  cdnBase: getCdnUrl(),
};

// ============================================================================
// SCREEN WIRING
// ============================================================================

export interface GameConfig {
  screens: {
    loading: Component;
    start: Component;
    game: Component;
    results: Component;
  };
  initialScreen: 'loading' | 'start' | 'game' | 'results';
  serverStorageUrl: string | null;
  defaultViewportMode?: ViewportMode;
}

export const gameConfig: GameConfig = {
  screens: {
    loading: LoadingScreen,
    start: lazy(() => import('./screens/StartScreen')),
    game: lazy(() => import('./screens/GameScreen')),
    results: ResultsScreen,
  },
  initialScreen: 'loading',
  defaultViewportMode: 'small',
  serverStorageUrl: getServerStorageUrl(),
};
