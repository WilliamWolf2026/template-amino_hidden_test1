import type { TileTheme } from '~/game/tuning';

// Module-level state for current atlas name (set at game startup)
let currentAtlasName = 'atlas-tiles-citylines';

/**
 * Set the current atlas name based on theme (call once at game startup)
 */
export function setAtlasName(theme: TileTheme): void {
  switch (theme) {
    case 'fall':
      currentAtlasName = 'atlas-tiles-citylines-fall';
      break;
    case 'winter':
      currentAtlasName = 'atlas-tiles-citylines-winter';
      break;
    default:
      currentAtlasName = 'atlas-tiles-citylines';
  }
}

/**
 * Get the current atlas name (used by all game entities)
 */
export function getAtlasName(): string {
  return currentAtlasName;
}
