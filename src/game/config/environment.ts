/**
 * Game-specific environment configuration.
 * Extends scaffold config with game-specific paths.
 */

import {
  getEnvironment,
  getCdnBaseUrl,
  isLocal,
  type Environment,
} from '~/scaffold/config';

// Re-export scaffold utilities
export { getEnvironment, isLocal, isProduction } from '~/scaffold/config';
export type { Environment } from '~/scaffold/config';

/** Game-specific path configuration */
const GAME_PATHS = {
  /** Path segment for this game on CDN */
  gamePath: 'games/citylines/data',
  /** Asset version */
  assetVersion: 'v1',
  /** Local asset path (when CDN base is empty) */
  localAssetPath: '/assets/assets/v1',
  /** Local levels path */
  localLevelsPath: '/assets/levels',
};

/**
 * Get the local asset path (used as fallback when CDN fails).
 */
export const getLocalAssetPath = (): string => {
  return GAME_PATHS.localAssetPath;
};

/**
 * Get the CDN URL for assets in the current environment.
 */
export const getCdnUrl = (): string => {
  const baseUrl = getCdnBaseUrl();

  if (!baseUrl) {
    // Local development - use relative paths
    console.log(`[CDN] Local: ${GAME_PATHS.localAssetPath}`);
    return GAME_PATHS.localAssetPath;
  }

  // Remote environment - construct full URL
  const cdnUrl = `${baseUrl}/${GAME_PATHS.gamePath}/assets/${GAME_PATHS.assetVersion}`;
  console.log(`[CDN] Remote: ${cdnUrl}`);
  return cdnUrl;
};

/**
 * Get the levels URL for the current environment.
 */
export const getLevelsUrl = (): string => {
  const baseUrl = getCdnBaseUrl();

  if (!baseUrl) {
    // Local development
    return GAME_PATHS.localLevelsPath;
  }

  // Remote environment
  return `${baseUrl}/${GAME_PATHS.gamePath}/levels`;
};

/**
 * Resolve a level name to a full URL.
 * - Full URLs (http/https) pass through unchanged
 * - Absolute paths (/assets/...) pass through unchanged
 * - Short names resolve to environment's levelsUrl
 */
export const resolveLevelUrl = (levelParam: string): string => {
  if (levelParam.startsWith('http') || levelParam.startsWith('/')) {
    return levelParam;
  }
  // Short name like "wonder-nj-2026" -> full URL
  const base = getLevelsUrl();
  return `${base}/${levelParam}.json`;
};
