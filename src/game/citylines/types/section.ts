import type { County } from './level';

/** Valid county values (must match County type in level.ts) */
export const VALID_COUNTIES: County[] = ['atlantic', 'bergen', 'cape_may', 'essex', 'hudson'];

/** Story data for a section */
export interface StoryData {
  headline: string;
  summary: string;
  imageUrl: string;
  articleUrl: string;
  /** Array of 10 clue strings (one per level) */
  clues: string[];
}

/** Section configuration - loaded from URL param or fallback */
export interface SectionConfig {
  /** Story data for clues and chapter-end reveal */
  story: StoryData;

  /** County for theming (must be one of: atlantic, bergen, cape_may, essex, hudson) */
  county: County;

  /** Optional level seeds for reproducible generation (10 seeds) */
  levelSeeds?: number[];

  /** Optional section identifier */
  sectionId?: string;
}

/** Default fallback path for local development */
export const DEFAULT_SECTION_PATH = '/assets/sections/default.json';

/** URL parameter name for section config */
export const SECTION_URL_PARAM = 'section';

/**
 * Load section config from URL param or fallback to default
 */
export async function loadSectionConfig(): Promise<SectionConfig> {
  const urlParams = new URLSearchParams(window.location.search);
  const sectionUrl = urlParams.get(SECTION_URL_PARAM);

  const url = sectionUrl || DEFAULT_SECTION_PATH;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load section config from ${url}`);
  }

  const config = await response.json() as SectionConfig;

  // Validate county is one of the valid options
  if (!VALID_COUNTIES.includes(config.county)) {
    console.warn(`[SectionConfig] Invalid county "${config.county}", defaulting to "atlantic"`);
    config.county = 'atlantic';
  }

  return config;
}

/**
 * Get clue for a specific level (1-indexed)
 */
export function getClueForLevel(config: SectionConfig, levelNumber: number): string | undefined {
  const index = (levelNumber - 1) % 10;
  return config.story.clues[index];
}
