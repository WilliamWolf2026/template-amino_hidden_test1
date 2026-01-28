import type { AudioLoader } from '~/scaffold/systems/assets/loaders/audio';
import { audioState } from '~/scaffold/systems/audio';
import {
  SOUND_TILE_ROTATE,
  SOUND_LEVEL_COMPLETE,
  SOUND_LANDMARK_CONNECT,
  SOUND_NEWS_REVEAL,
  SOUND_DOG_BARK,
  SOUND_DOG_PANT,
  MUSIC_TRACKS,
  type SoundDefinition,
} from './sounds';

/**
 * Game Audio Manager
 * Handles game-specific audio logic including:
 * - Random sound variations (tile rotations)
 * - Music playback control (start/stop/fade)
 * - Respects audio state settings (musicEnabled, volume)
 */
export class GameAudioManager {
  private audioLoader: AudioLoader;
  private currentMusicIndex = 0;
  private currentMusicId: number | null = null;

  constructor(audioLoader: AudioLoader) {
    this.audioLoader = audioLoader;
  }

  /**
   * Play tile rotation sound
   * Randomly selects from 5-10 variations to prevent audio fatigue
   */
  playTileRotate(): void {
    const sound = this.getRandomSound(SOUND_TILE_ROTATE);
    this.playSound(sound);
  }

  /**
   * Play level complete sound
   * Triggered when all landmarks are connected to exits
   */
  playLevelComplete(): void {
    this.playSound(SOUND_LEVEL_COMPLETE);
  }

  /**
   * Play landmark connected sound
   * Triggered when a landmark becomes connected to the exit
   */
  playLandmarkConnect(): void {
    this.playSound(SOUND_LANDMARK_CONNECT);
  }

  /**
   * Play news reveal sound
   * Triggered when companion shows completion clue
   */
  playNewsReveal(): void {
    this.playSound(SOUND_NEWS_REVEAL);
  }

  /**
   * Play dog bark sound
   * Triggered when companion character appears
   */
  playDogBark(): void {
    this.playSound(SOUND_DOG_BARK);
  }

  /**
   * Play dog pant sound
   * Triggered when clue popup appears after level completion
   */
  playDogPant(): void {
    this.playSound(SOUND_DOG_PANT);
  }

  /**
   * Start background music
   * Respects musicEnabled state and fades in over 1 second
   */
  startMusic(): void {
    if (!audioState.musicEnabled()) return;

    const track = MUSIC_TRACKS[this.currentMusicIndex];
    this.currentMusicId = this.audioLoader.playMusic(track.channel, track.sprite, {
      fadeIn: 1000,
      volume: 0.6,
    });
  }

  /**
   * Stop background music
   * Fades out over 500ms
   */
  stopMusic(): void {
    if (this.currentMusicId !== null) {
      this.audioLoader.stopMusic(500);
      this.currentMusicId = null;
    }
  }

  /**
   * Switch to next music track
   * Stops current track and starts the next one in the playlist
   */
  nextTrack(): void {
    this.stopMusic();
    this.currentMusicIndex = (this.currentMusicIndex + 1) % MUSIC_TRACKS.length;
    this.startMusic();
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Play a sound effect
   * Applies volume from sound definition
   */
  private playSound(sound: SoundDefinition): void {
    this.audioLoader.play(sound.channel, sound.sprite, {
      volume: sound.volume,
    });
  }

  /**
   * Get random sound from an array of sound definitions
   * Used for tile rotation variations
   */
  private getRandomSound(sounds: readonly SoundDefinition[]): SoundDefinition {
    return sounds[Math.floor(Math.random() * sounds.length)];
  }
}
