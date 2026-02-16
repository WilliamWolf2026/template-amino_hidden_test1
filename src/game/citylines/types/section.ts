import type { County } from './level';
import { getCdnUrl, getLevelsUrl, resolveLevelUrl } from '~/game/config';

/** Valid county values (must match County type in level.ts) */
export const VALID_COUNTIES: County[] = ['atlantic', 'bergen', 'cape_may', 'essex', 'hudson'];

/** Story data for a section */
export interface StoryData {
  headline: string;
  summary: string;
  /** Celebratory text shown when the chapter is completed */
  completion?: string;
  imageUrl: string;
  articleUrl: string;
  /** Array of clue strings (one per level, determines chapter length) */
  clues: string[];
}

/** Asset references in level manifest */
export interface LevelAssets {
  /** Base URL for all assets (local path or GCS URL) */
  base: string;
  /** Branding assets */
  branding?: {
    atlas: string;
  };
  /** Game tile atlases */
  atlases?: {
    tiles: string;
    tiles_fall?: string;
    tiles_winter?: string;
  };
  /** VFX assets */
  vfx?: {
    rotate?: string;
    blast?: string;
  };
  /** Audio assets */
  audio?: {
    sfx: string;
  };
}

/** Level manifest - loaded from URL param or fallback */
export interface LevelManifest {
  /** Unique level identifier */
  levelId?: string;

  /** Manifest version */
  version?: string;

  /** Asset configuration with base URL */
  assets?: LevelAssets;

  /** Story data for clues and chapter-end reveal */
  story: StoryData;

  /** County for theming (must be one of: atlantic, bergen, cape_may, essex, hudson) */
  county: County;

  /** Tile theme variant */
  tileTheme?: 'default' | 'fall' | 'winter';

  /** Optional level seeds for reproducible generation (one per level) */
  levelSeeds?: number[];
}

/** @deprecated Use LevelManifest instead */
export type SectionConfig = LevelManifest;

/** Default level filename */
export const DEFAULT_LEVEL_NAME = 'default';

/** @deprecated Use environment config instead */
export const DEFAULT_LEVEL_PATH = '/assets/levels/default.json';

/** @deprecated Use DEFAULT_LEVEL_PATH instead */
export const DEFAULT_SECTION_PATH = DEFAULT_LEVEL_PATH;

/** @deprecated Use getCdnUrl() from config instead */
export const DEFAULT_ASSET_BASE = '/assets/assets/v1';

/** URL parameter name for level manifest */
export const LEVEL_URL_PARAM = 'level';

/** @deprecated Use LEVEL_URL_PARAM instead */
export const SECTION_URL_PARAM = 'section';

/** Result of loading level config */
export interface LevelLoadResult {
  /** The level manifest */
  manifest: LevelManifest;
  /** Resolved asset base URL */
  assetBase: string;
}

/**
 * Load level manifest from URL param or fallback to default.
 * Returns both the manifest and the resolved asset base URL.
 *
 * URL resolution:
 * - Full URLs (http/https) load directly
 * - Absolute paths (/assets/...) load from current origin
 * - Short names (wonder-nj-2026) resolve via environment config
 * - No param loads default.json from environment's levelsUrl
 */
export async function loadLevelManifest(): Promise<LevelLoadResult> {
  const urlParams = new URLSearchParams(window.location.search);

  // Check for ?level= param first, fall back to legacy ?section= param
  const levelParam = urlParams.get(LEVEL_URL_PARAM) || urlParams.get(SECTION_URL_PARAM);

  // Resolve to full URL using environment config
  const url = levelParam
    ? resolveLevelUrl(levelParam)
    : `${getLevelsUrl()}/${DEFAULT_LEVEL_NAME}.json`;

  let manifest: LevelManifest;
  let assetBase: string;

  // Get environment CDN URL as fallback
  const envCdnUrl = getCdnUrl();

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    manifest = await response.json() as LevelManifest;

    // Use asset base from manifest if provided, otherwise use environment CDN
    assetBase = manifest.assets?.base || envCdnUrl;
  } catch (error) {
    // If level manifest fails to load, use environment defaults
    console.warn(`[Level] Failed to load manifest:`, error);

    // Return minimal manifest with environment CDN
    assetBase = envCdnUrl;
    manifest = {
      county: 'atlantic',
      story: {
        headline: 'Default Level',
        summary: '',
        imageUrl: '',
        articleUrl: '',
        clues: ['Welcome to the game!'],
      },
    };
  }

  // Validate county
  if (!VALID_COUNTIES.includes(manifest.county)) {
    console.warn(`[LevelManifest] Invalid county "${manifest.county}", defaulting to "atlantic"`);
    manifest.county = 'atlantic';
  }

  return { manifest, assetBase };
}

/**
 * @deprecated Use loadLevelManifest() instead
 */
export async function loadSectionConfig(): Promise<LevelManifest> {
  const { manifest } = await loadLevelManifest();
  return manifest;
}

/**
 * Get the asset base URL from a level manifest.
 * Falls back to environment CDN if not specified in manifest.
 */
export function getAssetBase(manifest: LevelManifest): string {
  return manifest.assets?.base || getCdnUrl();
}

/**
 * Get chapter length from config (inferred from clues array length)
 */
export function getChapterLength(config: SectionConfig): number {
  return config.story.clues.length;
}

/**
 * Get clue for a specific level (1-indexed)
 */
export function getClueForLevel(config: SectionConfig, levelNumber: number): string | undefined {
  const chapterLength = getChapterLength(config);
  const index = (levelNumber - 1) % chapterLength;
  return config.story.clues[index];
}

/**
 * Get seed for a specific level (1-indexed)
 * Returns undefined if no seed provided (will generate random)
 */
export function getSeedForLevel(config: SectionConfig, levelNumber: number): number | undefined {
  if (!config.levelSeeds) return undefined;
  const chapterLength = getChapterLength(config);
  const index = (levelNumber - 1) % chapterLength;
  return config.levelSeeds[index];
}
