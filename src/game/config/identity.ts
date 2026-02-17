/**
 * Game identity constants — single source of truth for game naming.
 * When forking for a new game, update these values and all references follow.
 */

/** Analytics event tag and GameKit project ID (e.g. "city_lines") */
export const GAME_ID = "city_lines";

/** URL-safe slug used in CDN paths, asset names, storage keys (e.g. "citylines") */
export const GAME_SLUG = "citylines";

/** Human-readable display name (e.g. "City Lines") */
export const GAME_NAME = "City Lines";

/** CDN path segment for this game's assets and data */
export const GAME_CDN_PATH = `games/${GAME_SLUG}/data`;

/** localStorage key prefix for analytics (survey cooldown, feature flags, etc.) */
export const GAME_STORAGE_PREFIX = `${GAME_SLUG}_`;
