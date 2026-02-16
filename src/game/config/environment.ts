/**
 * Game-specific environment configuration.
 * Extends scaffold config with game-specific paths.
 */

import {
  getEnvironment,
  getCdnBaseUrl,
  isLocal,
  type Environment,
} from "~/scaffold/config";

// Re-export scaffold utilities
export { getEnvironment, isLocal, isProduction } from "~/scaffold/config";
export type { Environment } from "~/scaffold/config";

/** Game-specific path configuration */
const GAME_PATHS = {
  /** Path segment for this game on CDN */
  gamePath: "games/citylines/data",
  /** Local asset path (flat structure) */
  localAssetPath: "/assets",
  /** Local chapters path */
  localChaptersPath: "/chapters",
  /** @deprecated Local levels path (legacy, use localChaptersPath) */
  localLevelsPath: "/levels",
  /** Games index path on server storage */
  gamesIndexPath: "city-lines/games/index.json",
};

/**
 * Server storage base URLs per environment (backend GCS / Firebase emulator).
 * These point to the raw storage buckets, not the CDN.
 */
const SERVER_STORAGE_URLS: Record<Environment, string | null> = {
  // Local: Firebase Storage emulator
  local:
    "http://localhost:4443/download/storage/v1/b/advance-game-manager-bucket/o",
  development:
    "http://localhost:4443/download/storage/v1/b/advance-game-manager-bucket/o", // TBD
  // QA: Direct GCS bucket
  qa: "https://storage.googleapis.com/city-lines-server-qa-storage",
  staging:
    "http://localhost:4443/download/storage/v1/b/advance-game-manager-bucket/o", // TBD
  production:
    "http://localhost:4443/download/storage/v1/b/advance-game-manager-bucket/o", // TBD
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

  // Remote environment - construct full URL (flat structure)
  const cdnUrl = `${baseUrl}/${GAME_PATHS.gamePath}/assets`;
  console.log(`[CDN] Remote: ${cdnUrl}`);
  return cdnUrl;
};

/**
 * Get the chapters URL for the current environment.
 */
export const getChaptersUrl = (): string => {
  const baseUrl = getCdnBaseUrl();

  if (!baseUrl) {
    // Local development
    return GAME_PATHS.localChaptersPath;
  }

  // Remote environment
  return `${baseUrl}/${GAME_PATHS.gamePath}/chapters`;
};

/**
 * @deprecated Use getChaptersUrl() instead.
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
  if (levelParam.startsWith("http") || levelParam.startsWith("/")) {
    return levelParam;
  }
  // Short name like "wonder-nj-2026" -> full URL
  const base = getLevelsUrl();
  return `${base}/${levelParam}.json`;
};

/**
 * Get the server storage base URL for the current environment.
 * Returns null when no server storage is configured (uses local defaults).
 */
export const getServerStorageUrl = (): string | null => {
  return SERVER_STORAGE_URLS[getEnvironment()];
};

/**
 * Get the full games index URL for fetching the chapter catalog.
 * Handles URL encoding for the local Firebase emulator vs direct GCS.
 * Returns null when no server storage is configured.
 */
export const getGamesIndexUrl = (): string | null => {
  const storageUrl = getServerStorageUrl();
  if (!storageUrl) return null;

  // GCS emulator uses encoded slashes + alt=media query param
  // Direct GCS bucket uses regular path slashes
  if (storageUrl.includes("localhost")) {
    const encoded = GAME_PATHS.gamesIndexPath.replace(/\//g, "%2F");
    return `${storageUrl}/${encoded}?alt=media`;
  }
  return `${storageUrl}/${GAME_PATHS.gamesIndexPath}`;
};
