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
};

export const getLocalAssetPath = (): string => GAME_PATHS.localAssetPath;

export const getCdnUrl = (): string => {
  const baseUrl = getCdnBaseUrl();
  if (!baseUrl) return GAME_PATHS.localAssetPath;
  return `${baseUrl}/${GAME_PATHS.gamePath}/assets`;
};

// ============================================================================
// DATA TYPES
//
// Define your game's data schema here.
// These types are used by useGameData() and the ManifestProvider.
// ============================================================================

/** Dialogue message for companion/NPC interactions */
export interface DialogueMessage {
  id: string;
  speaker?: string;
  text: string;
}

/**
 * Game data fetched from server / injected by host.
 * Replace with your game's actual data shape.
 */
export interface GameData {
  uid: string;
  name: string;
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
  serverStorageUrl: null,
};
