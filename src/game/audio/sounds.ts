/**
 * Sound Catalog — Daily Dispatch audio definitions
 * Maps GDD sound events to Howler sprite channels.
 *
 * SFX sprites live in sfx-daily-dispatch.
 * Music uses music-warehouse-puzzle channel.
 */

import type { SoundDefinition } from '~/core/systems/audio';

export type { SoundDefinition };

const SFX = 'sfx-daily-dispatch';

// ============================================================================
// UI SOUNDS
// ============================================================================

export const SOUND_BUTTON_CLICK: SoundDefinition = {
  channel: SFX,
  sprite: 'button_click',
  volume: 0.7,
};

// ============================================================================
// GAMEPLAY SOUNDS — Daily Dispatch
// ============================================================================

/** Block slide — plays when a block moves on the grid */
export const SOUND_BLOCK_SLIDE: SoundDefinition = {
  channel: SFX,
  sprite: 'block_slide',
  volume: 0.5,
};

/** Block hit edge — plays when a block can't move further */
export const SOUND_BLOCK_HIT_EDGE: SoundDefinition = {
  channel: SFX,
  sprite: 'block_hit_edge',
  volume: 0.4,
};

/** Block exits dock — plays when a block slides out through a matching dock */
export const SOUND_BLOCK_EXIT: SoundDefinition = {
  channel: SFX,
  sprite: 'block_exit',
  volume: 0.7,
};

/** Level complete — plays when all blocks have exited */
export const SOUND_LEVEL_COMPLETE: SoundDefinition = {
  channel: SFX,
  sprite: 'level_complete',
  volume: 0.8,
};

/** Chapter complete — plays at end of chapter */
export const SOUND_CHAPTER_COMPLETE: SoundDefinition = {
  channel: SFX,
  sprite: 'chapter_complete',
  volume: 0.9,
};

/** Truck door close — plays during chapter-end truck animation */
export const SOUND_TRUCK_CLOSE: SoundDefinition = {
  channel: SFX,
  sprite: 'truck_door_close',
  volume: 0.6,
};

/** Truck drive away — plays after truck door closes */
export const SOUND_TRUCK_DRIVE_AWAY: SoundDefinition = {
  channel: SFX,
  sprite: 'truck_drive_away',
  volume: 0.5,
};

// ============================================================================
// MUSIC
// ============================================================================

/** Background music tracks — warehouse puzzle BGM */
export const MUSIC_TRACKS: readonly SoundDefinition[] = [
  { channel: 'music-warehouse-puzzle', sprite: 'music_1' },
] as const;
