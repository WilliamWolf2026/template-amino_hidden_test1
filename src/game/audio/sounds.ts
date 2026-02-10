/**
 * Sound Catalog - GDD-compliant audio definitions
 * Defines all game sounds per Game Design Document requirements
 */

import type { SoundDefinition } from '~/scaffold/systems/audio';

// Re-export for convenience
export type { SoundDefinition };

// ============================================================================
// UI SOUNDS
// ============================================================================

export const SOUND_BUTTON_CLICK: SoundDefinition = {
  channel: 'sfx-citylines',
  sprite: 'button_click',
  volume: 0.7,
};

// ============================================================================
// GAMEPLAY SOUNDS
// ============================================================================

/**
 * Tile rotation sounds (5-10 variations per GDD)
 * System picks randomly from this pool to prevent audio fatigue
 */
export const SOUND_TILE_ROTATE: readonly SoundDefinition[] = [
  { channel: 'sfx-citylines', sprite: 'tile_rotate_1', volume: 0.5 },
  { channel: 'sfx-citylines', sprite: 'tile_rotate_2', volume: 0.5 },
  { channel: 'sfx-citylines', sprite: 'tile_rotate_3', volume: 0.5 },
  { channel: 'sfx-citylines', sprite: 'tile_rotate_4', volume: 0.5 },
  { channel: 'sfx-citylines', sprite: 'tile_rotate_5', volume: 0.5 },
] as const;

/**
 * Level complete sound
 * Plays when all landmarks are connected to exits
 */
export const SOUND_LEVEL_COMPLETE: SoundDefinition = {
  channel: 'sfx-citylines',
  sprite: 'level_complete',
  volume: 0.8,
};

/**
 * Landmark connected sound
 * Plays when a landmark becomes connected to the exit
 */
export const SOUND_LANDMARK_CONNECT: SoundDefinition = {
  channel: 'sfx-citylines',
  sprite: 'landmark_connect',
  volume: 0.6,
};

/**
 * News reveal sound
 * Plays when companion shows completion clue
 */
export const SOUND_NEWS_REVEAL: SoundDefinition = {
  channel: 'sfx-citylines',
  sprite: 'news_reveal',
  volume: 0.7,
};

/**
 * Dog bark sound
 * Plays when companion character appears
 */
export const SOUND_DOG_BARK: SoundDefinition = {
  channel: 'sfx-citylines',
  sprite: 'dog_bark',
  volume: 0.5,
};

/**
 * Dog pant sound
 * Plays when clue popup appears after level completion
 */
export const SOUND_DOG_PANT: SoundDefinition = {
  channel: 'sfx-citylines',
  sprite: 'dog_pant',
  volume: 0.5,
};

// ============================================================================
// MUSIC TRACKS
// ============================================================================

/**
 * Background music tracks (3-5 jazzy tracks per GDD)
 * Rotates between chapters
 */
export const MUSIC_TRACKS: readonly SoundDefinition[] = [
  { channel: 'sfx-citylines', sprite: 'bg_track_1' },
  { channel: 'sfx-citylines', sprite: 'bg_track_2' },
  { channel: 'sfx-citylines', sprite: 'bg_track_3' },
] as const;

// ============================================================================
// FUTURE SOUNDS (Not implemented yet - awaiting game features)
// ============================================================================

// Chapter complete sound (after 10 levels)
// export const SOUND_CHAPTER_COMPLETE: SoundDefinition = {
//   channel: 'sfx-citylines',
//   sprite: 'chapter_complete',
//   volume: 0.9,
// };

// News reveal interstitial sound (newspaper spinning animation)
// export const SOUND_NEWS_REVEAL: SoundDefinition = {
//   channel: 'sfx-citylines',
//   sprite: 'news_reveal',
//   volume: 0.8,
// };
