import type { AudioLoader } from '~/scaffold/systems/assets/loaders/audio';
import { BaseAudioManager } from '~/scaffold/systems/audio';
import {
  SOUND_TILE_ROTATE,
  SOUND_LEVEL_COMPLETE,
  SOUND_LANDMARK_CONNECT,
  SOUND_NEWS_REVEAL,
  SOUND_DOG_BARK,
  SOUND_DOG_PANT,
  MUSIC_TRACKS,
} from './sounds';

/**
 * Game Audio Manager
 * Extends BaseAudioManager with game-specific sound methods
 *
 * Inherited from BaseAudioManager:
 * - playSound() / playRandomSound() - Sound playback
 * - startMusic() / stopMusic() - Music with fade
 * - isMusicPlaying() - Music state check
 */
export class GameAudioManager extends BaseAudioManager {
  private currentMusicIndex = 0;

  constructor(audioLoader: AudioLoader) {
    super(audioLoader);
  }

  // ============================================================================
  // GAME-SPECIFIC SOUND METHODS
  // ============================================================================

  /**
   * Play tile rotation sound
   * Randomly selects from variations to prevent audio fatigue
   */
  playTileRotate(): void {
    this.playRandomSound(SOUND_TILE_ROTATE);
  }

  /**
   * Play level complete sound
   */
  playLevelComplete(): void {
    this.playSound(SOUND_LEVEL_COMPLETE);
  }

  /**
   * Play landmark connected sound
   */
  playLandmarkConnect(): void {
    this.playSound(SOUND_LANDMARK_CONNECT);
  }

  /**
   * Play news reveal sound
   */
  playNewsReveal(): void {
    this.playSound(SOUND_NEWS_REVEAL);
  }

  /**
   * Play dog bark sound
   */
  playDogBark(): void {
    this.playSound(SOUND_DOG_BARK);
  }

  /**
   * Play dog pant sound
   */
  playDogPant(): void {
    this.playSound(SOUND_DOG_PANT);
  }

  // ============================================================================
  // MUSIC CONTROL
  // ============================================================================

  /**
   * Start background music from current track
   */
  startGameMusic(): void {
    const track = MUSIC_TRACKS[this.currentMusicIndex];
    this.startMusic(track);
  }

  /**
   * Switch to next music track
   */
  nextTrack(): void {
    this.stopMusic();
    this.currentMusicIndex = (this.currentMusicIndex + 1) % MUSIC_TRACKS.length;
    this.startGameMusic();
  }
}
