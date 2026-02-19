/**
 * Sound Catalog — Daily Dispatch audio definitions
 * Maps GDD sound events to Howler sprite channels.
 *
 * SFX sprites live in sfx-citylines (legacy sprite sheet, reused).
 * Music uses music-warehouse-puzzle channel.
 */

import type { SoundDefinition } from '~/scaffold/systems/audio';

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
// GAMEPLAY SOUNDS — Daily Dispatch
// ============================================================================

/** Block slide — plays when a block moves on the grid */
export const SOUND_BLOCK_SLIDE: readonly SoundDefinition[] = [
  { channel: 'sfx-citylines', sprite: 'tile_rotate_1', volume: 0.5 },
  { channel: 'sfx-citylines', sprite: 'tile_rotate_2', volume: 0.5 },
  { channel: 'sfx-citylines', sprite: 'tile_rotate_3', volume: 0.5 },
  { channel: 'sfx-citylines', sprite: 'tile_rotate_4', volume: 0.5 },
  { channel: 'sfx-citylines', sprite: 'tile_rotate_5', volume: 0.5 },
] as const;

/** Block exits dock — plays when a block slides out through a matching dock */
export const SOUND_BLOCK_EXIT: SoundDefinition = {
  channel: 'sfx-citylines',
  sprite: 'landmark_connect',
  volume: 0.7,
};

/** Level complete — plays when all blocks have exited */
export const SOUND_LEVEL_COMPLETE: SoundDefinition = {
  channel: 'sfx-citylines',
  sprite: 'level_complete',
  volume: 0.8,
};

/** Chapter complete — plays at end of chapter */
export const SOUND_CHAPTER_COMPLETE: SoundDefinition = {
  channel: 'sfx-citylines',
  sprite: 'chapter_complete',
  volume: 0.9,
};

/** Eraser use — plays when eraser removes a block */
export const SOUND_ERASER: SoundDefinition = {
  channel: 'sfx-citylines',
  sprite: 'news_reveal',
  volume: 0.6,
};

/** Truck door close — plays during chapter-end truck animation */
export const SOUND_TRUCK_CLOSE: SoundDefinition = {
  channel: 'sfx-citylines',
  sprite: 'dog_bark',
  volume: 0.6,
};

/** Clue reveal — plays when post-level clue appears */
export const SOUND_CLUE_REVEAL: SoundDefinition = {
  channel: 'sfx-citylines',
  sprite: 'news_reveal',
  volume: 0.7,
};

// ============================================================================
// MUSIC
// ============================================================================

/** Background music tracks — warehouse puzzle BGM */
export const MUSIC_TRACKS: readonly SoundDefinition[] = [
  { channel: 'music-warehouse-puzzle', sprite: 'music_1' },
] as const;
