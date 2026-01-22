import { Howl, Howler } from 'howler';
import type { Manifest, AudioSpriteData } from '../types';

interface ChannelState {
  howl: Howl;
  volume: number;
  muted: boolean;
}

export interface PlayOptions {
  volume?: number;
  rate?: number;
  loop?: boolean;
}

export interface MusicOptions extends PlayOptions {
  fadeIn?: number;
}

export class AudioLoader {
  private manifest!: Manifest;
  private channels = new Map<string, ChannelState>();
  private currentMusic: { channel: string; id: number } | null = null;
  private masterVolume = 1;
  private masterMuted = false;
  private initialized = false;

  init(manifest: Manifest): void {
    this.manifest = manifest;
  }

  // Must be called after user gesture (e.g., start button click)
  unlock(): void {
    if (this.initialized) return;

    // Howler auto-unlocks on first user interaction, but we mark our state
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Register an audio sprite from loaded JSON
  async register(jsonPath: string): Promise<void> {
    const key = jsonPath.replace(/\.json$/, '');
    if (this.channels.has(key)) return;

    const jsonUrl = `${this.manifest.cdnBase}/${jsonPath}`;
    const response = await fetch(jsonUrl);

    if (!response.ok) {
      throw new Error(`Failed to load audio: ${jsonUrl}`);
    }

    const json: AudioSpriteData = await response.json();

    // Resolve src paths relative to JSON location
    const dir = jsonPath.substring(0, jsonPath.lastIndexOf('/'));
    const resolvedSrc = json.src.map((s) => `${this.manifest.cdnBase}/${dir}/${s}`);

    const howl = new Howl({
      src: resolvedSrc,
      sprite: json.sprite,
      preload: true,
      volume: this.masterVolume,
    });

    // Wait for load
    await new Promise<void>((resolve, reject) => {
      howl.once('load', () => resolve());
      howl.once('loaderror', (_, err) => reject(new Error(`Audio load error: ${err}`)));
    });

    this.channels.set(key, {
      howl,
      volume: 1,
      muted: false,
    });
  }

  // Load all audio bundles from manifest
  async loadBundle(name: string): Promise<void> {
    const bundle = this.manifest.bundles.find((b) => b.name === name);
    if (!bundle) throw new Error(`Unknown bundle: ${name}`);

    await Promise.all(
      bundle.assets
        .filter((p) => p.endsWith('.json'))
        .map((p) => this.register(p))
    );
  }

  // Play a sound sprite
  play(channel: string, sprite: string, options?: PlayOptions): number | null {
    const key = channel.replace(/\.json$/, '');
    const state = this.channels.get(key);
    if (!state) {
      console.warn(`Audio channel not found: ${key}`);
      return null;
    }

    const id = state.howl.play(sprite);

    if (typeof id !== 'number') return null;

    const effectiveVolume = this.masterMuted || state.muted
      ? 0
      : this.masterVolume * state.volume * (options?.volume ?? 1);

    state.howl.volume(effectiveVolume, id);

    if (options?.rate) {
      state.howl.rate(options.rate, id);
    }

    if (options?.loop) {
      state.howl.loop(true, id);
    }

    return id;
  }

  // Play music with optional fade in and looping
  playMusic(channel: string, sprite: string, options?: MusicOptions): number | null {
    // Fade out current music
    if (this.currentMusic) {
      const currentState = this.channels.get(this.currentMusic.channel);
      if (currentState && options?.fadeIn) {
        const { howl, volume } = currentState;
        const currentId = this.currentMusic.id;
        howl.fade(howl.volume(currentId) as number, 0, options.fadeIn, currentId);
        howl.once('fade', () => howl.stop(currentId), currentId);
      } else if (currentState) {
        currentState.howl.stop(this.currentMusic.id);
      }
    }

    const key = channel.replace(/\.json$/, '');
    const state = this.channels.get(key);
    if (!state) {
      console.warn(`Audio channel not found: ${key}`);
      return null;
    }

    const id = state.howl.play(sprite);
    if (typeof id !== 'number') return null;

    state.howl.loop(true, id);

    const targetVolume = this.masterMuted || state.muted
      ? 0
      : this.masterVolume * state.volume * (options?.volume ?? 1);

    if (options?.fadeIn) {
      state.howl.volume(0, id);
      state.howl.fade(0, targetVolume, options.fadeIn, id);
    } else {
      state.howl.volume(targetVolume, id);
    }

    this.currentMusic = { channel: key, id };
    return id;
  }

  // Stop music with optional fade out
  stopMusic(fadeOut?: number): void {
    if (!this.currentMusic) return;

    const state = this.channels.get(this.currentMusic.channel);
    if (!state) return;

    const { howl } = state;
    const { id } = this.currentMusic;

    if (fadeOut) {
      howl.fade(howl.volume(id) as number, 0, fadeOut, id);
      howl.once('fade', () => howl.stop(id), id);
    } else {
      howl.stop(id);
    }

    this.currentMusic = null;
  }

  // Stop a specific sound or all sounds in a channel
  stop(channel: string, id?: number): void {
    const key = channel.replace(/\.json$/, '');
    const state = this.channels.get(key);
    if (!state) return;

    if (id !== undefined) {
      state.howl.stop(id);
    } else {
      state.howl.stop();
    }
  }

  // Stop all sounds
  stopAll(): void {
    Howler.stop();
    this.currentMusic = null;
  }

  // Master volume control
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.masterVolume);
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  // Master mute control
  mute(muted: boolean): void {
    this.masterMuted = muted;
    Howler.mute(muted);
  }

  isMuted(): boolean {
    return this.masterMuted;
  }

  // Per-channel volume
  setChannelVolume(channel: string, volume: number): void {
    const key = channel.replace(/\.json$/, '');
    const state = this.channels.get(key);
    if (state) {
      state.volume = Math.max(0, Math.min(1, volume));
    }
  }

  // Per-channel mute
  muteChannel(channel: string, muted: boolean): void {
    const key = channel.replace(/\.json$/, '');
    const state = this.channels.get(key);
    if (state) {
      state.muted = muted;
    }
  }

  // Get sprite names for a channel
  getSpriteNames(channel: string): string[] {
    const key = channel.replace(/\.json$/, '');
    const state = this.channels.get(key);
    if (!state) return [];

    const sprite = (state.howl as any)._sprite;
    return sprite ? Object.keys(sprite) : [];
  }

  // Check if channel is registered
  hasChannel(channel: string): boolean {
    const key = channel.replace(/\.json$/, '');
    return this.channels.has(key);
  }
}
