/**
 * Audio loader interface consumed by BaseAudioManager.
 * The facade's coordinator.audio implements this shape at runtime.
 */

export interface PlayOptions {
  volume?: number;
  rate?: number;
  loop?: boolean;
}

export interface MusicOptions extends PlayOptions {
  fadeIn?: number;
}

export interface AudioLoader {
  play(channel: string, sprite: string, options?: PlayOptions): number | null;
  playMusic(channel: string, sprite: string, options?: MusicOptions): number | null;
  stopMusic(fadeOut?: number): void;
}
