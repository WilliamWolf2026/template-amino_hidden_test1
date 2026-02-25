import type { AudioLoader } from '~/scaffold/systems/assets/loaders/audio';
import { BaseAudioManager } from '~/scaffold/systems/audio';
import {
  SOUND_BUTTON_CLICK,
  SOUND_BLOCK_SLIDE,
  SOUND_BLOCK_HIT_EDGE,
  SOUND_BLOCK_EXIT,
  SOUND_LEVEL_COMPLETE,
  SOUND_CHAPTER_COMPLETE,
  SOUND_TRUCK_CLOSE,
  SOUND_TRUCK_DRIVE_AWAY,
  MUSIC_TRACKS,
} from './sounds';

/**
 * Game Audio Manager — Daily Dispatch
 * Extends BaseAudioManager with game-specific sound methods.
 *
 * Inherited from BaseAudioManager:
 * - playSound() / playRandomSound() — sound playback
 * - startMusic() / stopMusic() — music with fade
 * - isMusicPlaying() — music state check
 */
export class GameAudioManager extends BaseAudioManager {
  private currentMusicIndex = 0;

  constructor(audioLoader: AudioLoader) {
    super(audioLoader);
  }

  // ============================================================================
  // UI SOUNDS
  // ============================================================================

  /** Play button click sound */
  playButtonClick(): void {
    this.playSound(SOUND_BUTTON_CLICK);
  }

  // ============================================================================
  // GAMEPLAY SOUNDS
  // ============================================================================

  /** Play block slide sound */
  playBlockSlide(): void {
    this.playSound(SOUND_BLOCK_SLIDE);
  }

  /** Play block hit edge sound (blocked move) */
  playBlockHitEdge(): void {
    this.playSound(SOUND_BLOCK_HIT_EDGE);
  }

  /** Play block exit sound (block leaves through dock) */
  playBlockExit(): void {
    this.playSound(SOUND_BLOCK_EXIT);
  }

  /** Play level complete sound */
  playLevelComplete(): void {
    this.playSound(SOUND_LEVEL_COMPLETE);
  }

  /** Play chapter complete sound */
  playChapterComplete(): void {
    this.playSound(SOUND_CHAPTER_COMPLETE);
  }

  /** Play truck door close sound */
  playTruckClose(): void {
    this.playSound(SOUND_TRUCK_CLOSE);
  }

  /** Play truck driving away sound */
  playTruckDriveAway(): void {
    this.playSound(SOUND_TRUCK_DRIVE_AWAY);
  }

  // ============================================================================
  // MUSIC
  // ============================================================================

  /** Start background music from current track */
  startGameMusic(): void {
    const track = MUSIC_TRACKS[this.currentMusicIndex];
    this.startMusic(track);
  }

  /** Switch to next music track */
  nextTrack(): void {
    this.stopMusic();
    this.currentMusicIndex = (this.currentMusicIndex + 1) % MUSIC_TRACKS.length;
    this.startGameMusic();
  }
}
