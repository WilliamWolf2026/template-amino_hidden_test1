import type { Season } from '~/game/tuning';

/**
 * Get the atlas name for a given season
 */
export function getAtlasName(season: Season): string {
  switch (season) {
    case 'fall':
      return 'tiles_citylines_v1_fall';
    case 'winter':
      return 'tiles_citylines_v1_winter';
    default:
      return 'tiles_citylines_v1';
  }
}
