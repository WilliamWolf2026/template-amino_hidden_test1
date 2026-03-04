import type { AudioLoader } from '../assets/loaders/audio';
import type { SoundDefinition } from './types';
import { getRandomSound } from './utils';
import { audioState } from './state';

/**
 * Base Audio Manager
 * Extend this class for game-specific audio management
 *
 * Provides:
 * - Sound playback with volume control
 * - Music playback with fade in/out
 * - Random sound selection for variations
 * - Respects audioState settings
 *
 * @example
 * ```typescript
 * class MyGameAudioManager extends BaseAudioManager {
 *   playShoot(): void {
 *     this.playSound(SOUND_SHOOT);
 *   }
 *
 *   playExplosion(): void {
 *     this.playRandomSound(EXPLOSION_SOUNDS);
 *   }
 * }
 * ```
 */
export abstract class BaseAudioManager {
  protected audioLoader: AudioLoader;
  protected currentMusicId: number | null = null;

  constructor(audioLoader: AudioLoader) {
    this.audioLoader = audioLoader;
  }

  /**
   * Play a sound effect
   */
  protected playSound(sound: SoundDefinition): void {
    this.audioLoader.play(sound.channel, sound.sprite, {
      volume: sound.volume,
    });
  }

  /**
   * Play a random sound from an array (for variations)
   */
  protected playRandomSound(sounds: readonly SoundDefinition[]): void {
    const sound = getRandomSound(sounds);
    this.playSound(sound);
  }

  /**
   * Start music playback
   * Override to customize music behavior
   */
  startMusic(track: SoundDefinition, fadeIn = 1000): void {
    if (!audioState.musicEnabled()) return;

    this.currentMusicId = this.audioLoader.playMusic(track.channel, track.sprite, {
      fadeIn,
      volume: track.volume ?? 0.6,
    });
  }

  /**
   * Stop music playback
   */
  stopMusic(fadeOut = 500): void {
    if (this.currentMusicId !== null) {
      this.audioLoader.stopMusic(fadeOut);
      this.currentMusicId = null;
    }
  }

  /**
   * Check if music is currently playing
   */
  isMusicPlaying(): boolean {
    return this.currentMusicId !== null;
  }
}
