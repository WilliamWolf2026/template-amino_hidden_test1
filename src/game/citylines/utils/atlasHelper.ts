import type { TileTheme } from '~/game/tuning';

// Module-level state for current atlas name (set at game startup)
let currentAtlasName = 'tiles_citylines_v1';

/**
 * Set the current atlas name based on theme (call once at game startup)
 */
export function setAtlasName(theme: TileTheme): void {
  switch (theme) {
    case 'fall':
      currentAtlasName = 'tiles_citylines_v1_fall';
      break;
    case 'winter':
      currentAtlasName = 'tiles_citylines_v1_winter';
      break;
    default:
      currentAtlasName = 'tiles_citylines_v1';
  }
}

/**
 * Get the current atlas name (used by all game entities)
 */
export function getAtlasName(): string {
  return currentAtlasName;
}
