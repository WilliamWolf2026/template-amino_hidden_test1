/**
 * @file AudioContext.tsx
 * @description Audio context provider for managing sound effects and voice-over throughout the application.
 * This implementation manages both SFX and VO audio categories, allowing them to play simultaneously.
 * Follows the sound system documentation standards for simplified, maintainable audio management.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AUDIO_ASSETS,
  SfxKey,
  VoKey,
  MusicKey,
  DEFAULT_AUDIO_SETTINGS,
  AUDIO_STORAGE_KEYS,
} from './constants';
import { AudioContext, AudioContextType } from './AudioContext';

const getLocal = (key: AUDIO_STORAGE_KEYS) => {
  try {
    const saved = localStorage.getItem(key);
    return saved !== null ? JSON.parse(saved) : DEFAULT_AUDIO_SETTINGS[key];
  } catch (error) {
    console.warn(
      `Failed to load "${key}" setting from localStorage:`,
      error,
    );
    return DEFAULT_AUDIO_SETTINGS[key];
  }
}

const setLocal = (key: AUDIO_STORAGE_KEYS, value) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(value),
    );
  } catch (error) {
    console.warn(`Failed to save "${key}" setting to localStorage:`, error);
  }
}

/**
 * Audio Provider Component
 * Manages SFX state and provides audio functionality to child components
 */
export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // === STATE MANAGEMENT WITH LOCALSTORAGE PERSISTENCE ===

  /**
   * SFX Enabled State - persisted to localStorage
   * Default: true (SFX enabled by default)
   */
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(getLocal(AUDIO_STORAGE_KEYS.SFX_ENABLED));

  /**
   * SFX Volume State - persisted to localStorage
   * Default: 0.5 (50% volume as recommended in documentation)
   */
  const [sfxVolume, setSfxVolumeState] = useState<number>(getLocal(AUDIO_STORAGE_KEYS.SFX_VOLUME));

  /**
   * VO Enabled State - persisted to localStorage
   * Default: true (VO enabled by default)
   */
  const [voEnabled, setVoEnabled] = useState<boolean>(getLocal(AUDIO_STORAGE_KEYS.VO_ENABLED));

  /**
   * VO Volume State - persisted to localStorage
   * Default: 0.7 (70% volume for voice clarity)
   */
  const [voVolume, setVoVolumeState] = useState<number>(getLocal(AUDIO_STORAGE_KEYS.VO_VOLUME));

  /**
   * Ambient Enabled State - persisted to localStorage
   * Default: true (Ambient enabled by default)
   */
  const [ambientEnabled, setAmbientEnabled] = useState<boolean>(getLocal(AUDIO_STORAGE_KEYS.AMBIENT_ENABLED));

  /**
   * Ambient Volume State - persisted to localStorage
   * Default: 0.5 (50% volume for ambient sounds)
   */
  const [ambientVolume, setAmbientVolumeState] = useState<number>(getLocal(AUDIO_STORAGE_KEYS.AMBIENT_VOLUME));

  /**
   * Music Enabled State - persisted to localStorage
   * Default: true (Music enabled by default)
   */
  const [musicEnabled, setMusicEnabled] = useState<boolean>(getLocal(AUDIO_STORAGE_KEYS.MUSIC_ENABLED));

  /**
   * Music Volume State - persisted to localStorage
   * Default: 0.4 (40% volume for background music)
   */
  const [musicVolume, setMusicVolumeState] = useState<number>(getLocal(AUDIO_STORAGE_KEYS.MUSIC_VOLUME));

  // === PERSISTENCE EFFECTS ===

  /**
   * Persist SFX enabled setting to localStorage
   */
  useEffect(() => {
    setLocal(AUDIO_STORAGE_KEYS.SFX_ENABLED, sfxEnabled);
  }, [sfxEnabled]);

  /**
   * Persist SFX volume setting to localStorage
   */
  useEffect(() => {
    setLocal(AUDIO_STORAGE_KEYS.SFX_VOLUME, sfxVolume)
  }, [sfxVolume]);

  /**
   * Persist VO enabled setting to localStorage
   */
  useEffect(() => {
    setLocal(AUDIO_STORAGE_KEYS.VO_ENABLED, voEnabled)
  }, [voEnabled]);

  /**
   * Persist VO volume setting to localStorage
   */
  useEffect(() => {
    setLocal(AUDIO_STORAGE_KEYS.VO_VOLUME, voVolume)
  }, [voVolume]);

  /**
   * Persist Ambient enabled setting to localStorage
   */
  useEffect(() => {
    setLocal(AUDIO_STORAGE_KEYS.AMBIENT_ENABLED, ambientEnabled)
  }, [ambientEnabled]);

  /**
   * Persist Ambient volume setting to localStorage
   */
  useEffect(() => {
    setLocal(AUDIO_STORAGE_KEYS.AMBIENT_VOLUME, ambientVolume)
  }, [ambientVolume]);

  /**
   * Persist music enabled setting to localStorage
   */
  useEffect(() => {
    setLocal(AUDIO_STORAGE_KEYS.MUSIC_ENABLED, musicEnabled);
  }, [musicEnabled]);

  /**
   * Persist music volume setting to localStorage
   */
  useEffect(() => {
    setLocal(AUDIO_STORAGE_KEYS.MUSIC_VOLUME, JSON.stringify(musicVolume));
  }, [musicVolume]);

  // === ACTION HANDLERS ===

  /**
   * Toggle SFX enabled/disabled state
   */
  const toggleSfx = useCallback(() => {
    setSfxEnabled((prev) => !prev);
  }, []);

  /**
   * Set SFX volume with automatic clamping to valid range (0-1)
   * @param volume - Volume level between 0 and 1
   */
  const setSfxVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setSfxVolumeState(clampedVolume);
  }, []);

  /**
   * Toggle VO enabled/disabled state
   */
  const toggleVo = useCallback(() => {
    setVoEnabled((prev) => !prev);
  }, []);

  /**
   * Set VO volume with automatic clamping to valid range (0-1)
   * @param volume - Volume level between 0 and 1
   */
  const setVoVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setVoVolumeState(clampedVolume);
  }, []);

  /**
   * Toggle Ambient enabled/disabled state
   */
  const toggleAmbient = useCallback(() => {
    setAmbientEnabled((prev) => !prev);
  }, []);

  /**
   * Set Ambient volume with automatic clamping to valid range (0-1)
   * @param volume - Volume level between 0 and 1
   */
  const setAmbientVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setAmbientVolumeState(clampedVolume);
  }, []);

  /**
   * Toggle music enabled/disabled state
   * Preserves the current music state (doesn't restart music)
   */
  const toggleMusic = useCallback(() => {
    setMusicEnabled((prev) => {
      if (!prev) {
        if (
          currentMusicRef.current &&
          currentMusicRef.current.paused &&
          musicVolume > 0
        ) {
          wasExplicitlyPausedRef.current = false;
          currentMusicRef.current.play().catch((err) => {
            console.warn('Failed to resume music after toggling on:', err);
          });
        }
      }

      if (prev && currentMusicRef.current && !currentMusicRef.current.paused) {
        wasExplicitlyPausedRef.current = false;
        currentMusicRef.current.pause();
      }

      return !prev;
    });
  }, [musicVolume]);

  /**
   * Set music volume with automatic clamping to valid range (0-1)
   * Preserves the current music state (doesn't restart music)
   * @param volume - Volume level between 0 and 1
   */
  // Track if music was explicitly paused by the user
  const wasExplicitlyPausedRef = useRef<boolean>(false);

  const setMusicVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setMusicVolumeState(clampedVolume);

    if (currentMusicRef.current) {
      currentMusicRef.current.volume = clampedVolume;

      if (clampedVolume === 0) {
        wasExplicitlyPausedRef.current = false;
        currentMusicRef.current.pause();
      }
    }
  }, []);

  const playingSfxRef = useRef<Map<SfxKey, Set<HTMLAudioElement>>>(new Map());

  /**
   * Play a sound effect by key
   * Implements graceful degradation - failures won't break the application
   * @param key - SFX key from the AUDIO_ASSETS configuration
   */
  const playSfx = useCallback(
    (key: SfxKey, options?: { loop?: boolean }) => {
      try {
        // Only attempt to play if SFX is enabled
        if (!sfxEnabled) {
          return;
        }

        // Get the sound URL from our assets configuration
        const soundUrl = AUDIO_ASSETS.SFX[key];
        if (!soundUrl) {
          console.warn(`No sound URL found for SFX key: ${key}`);
          return;
        }

        // Create and play audio element
        const audio = new Audio(soundUrl);
        // Use sfxVolume as multiplier with base volume of 1.0
        // This matches the behavior of the hooks
        const effectiveVolume = 1.0 * sfxVolume;
        audio.volume = Math.max(0, Math.min(1, effectiveVolume));
        
        if (options?.loop) {
          audio.loop = true;
        }

        if (!playingSfxRef.current.has(key)) {
          playingSfxRef.current.set(key, new Set());
        }
        playingSfxRef.current.get(key)!.add(audio);

        // Only add the ended event listener for non-looping sounds
        if (!options?.loop) {
          audio.addEventListener('ended', () => {
            playingSfxRef.current.get(key)?.delete(audio);
            if (playingSfxRef.current.get(key)?.size === 0) {
              playingSfxRef.current.delete(key);
            }
          });
        }

        // Play the sound with error handling
        audio.play().catch((error) => {
          console.warn(`Failed to play SFX: ${key}`, error);
          playingSfxRef.current.get(key)?.delete(audio);
        });
      } catch (error) {
        console.warn(`Error in playSfx for key: ${key}`, error);
      }
    },
    [sfxEnabled, sfxVolume],
  );

  /**
   * Stop playing sound effects
   * @param key - Optional SFX key to stop specific sounds, or undefined to stop all SFX
   */
  const stopSfx = useCallback((key?: SfxKey) => {
    try {
      if (key) {
        // Stop specific SFX by key
        const sounds = playingSfxRef.current.get(key);
        if (sounds && sounds.size > 0) {
          sounds.forEach((audio) => {
            audio.pause();
            audio.currentTime = 0;
          });
          sounds.clear();
          playingSfxRef.current.delete(key);
        }
      } else {
        // Stop all SFX sounds
        playingSfxRef.current.forEach((sounds) => {
          sounds.forEach((audio) => {
            audio.pause();
            audio.currentTime = 0;
          });
          sounds.clear();
        });
        playingSfxRef.current.clear();
      }
    } catch (error) {
      console.warn(`Error stopping SFX${key ? ` key: ${key}` : 's'}`, error);
    }
  }, []);

  /**
   * Play a voice-over by key
   * Implements graceful degradation - failures won't break the application
   * @param key - VO key from the AUDIO_ASSETS configuration
   */
  const playVo = useCallback(
    (key: VoKey) => {
      try {
        // Only attempt to play if VO is enabled
        if (!voEnabled) {
          return;
        }

        // Get the sound URL from our assets configuration
        const soundUrl = AUDIO_ASSETS.VO[key];
        if (!soundUrl) {
          console.warn(`No sound URL found for VO key: ${key}`);
          return;
        }

        // Create and play audio element
        const audio = new Audio(soundUrl);
        audio.volume = voVolume;

        // Play the sound with error handling
        audio.play().catch((error) => {
          console.warn(`Failed to play VO: ${key}`, error);
          // Continue without audio - graceful degradation
        });
      } catch (error) {
        console.warn(`Error in playVo for key: ${key}`, error);
        // Continue without audio - graceful degradation
      }
    },
    [voEnabled, voVolume],
  );

  // Reference to the currently playing music
  const currentMusicRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Play a music track by key
   * Implements graceful degradation - failures won't break the application
   * @param key - Music key from the AUDIO_ASSETS configuration
   */
  const currentMusicKeyRef = useRef<MusicKey | null>(null);

  const playMusic = useCallback(
    (key: MusicKey) => {
      try {
        if (currentMusicKeyRef.current === key && currentMusicRef.current) {
          if (
            musicEnabled &&
            musicVolume > 0 &&
            currentMusicRef.current.paused &&
            !wasExplicitlyPausedRef.current
          ) {
            currentMusicRef.current.volume = musicVolume;
            currentMusicRef.current.play().catch((error) => {
              console.warn(`Failed to resume Music: ${key}`, error);
            });
          }
          return;
        }

        if (currentMusicRef.current) {
          currentMusicRef.current.pause();
          currentMusicRef.current = null;
        }

        wasExplicitlyPausedRef.current = false;

        if (!musicEnabled || musicVolume === 0) {
          currentMusicKeyRef.current = key;
          return;
        }

        const musicUrl = AUDIO_ASSETS.MUSIC[key];
        if (!musicUrl) {
          console.warn(`No music URL found for Music key: ${key}`);
          return;
        }

        const audio = new Audio(musicUrl);
        audio.volume = musicVolume;
        audio.loop = true;

        audio.play().catch((error) => {
          console.warn(`Failed to play Music: ${key}`, error);
        });

        currentMusicRef.current = audio;
        currentMusicKeyRef.current = key;
      } catch (error) {
        console.warn(`Error in playMusic for key: ${key}`, error);
      }
    },
    [musicEnabled, musicVolume],
  );

  /**
   * Stop the currently playing music
   */
  const stopMusic = useCallback(() => {
    if (currentMusicRef.current) {
      currentMusicRef.current.pause();
    }
  }, []);

  useEffect(() => {
    if (currentMusicRef.current) {
      if (!musicEnabled) {
        currentMusicRef.current.pause();
      } else if (
        musicVolume > 0 &&
        currentMusicRef.current.paused &&
        !wasExplicitlyPausedRef.current
      ) {
        currentMusicRef.current.play().catch((err) => {
          console.warn('Failed to resume music after enabling:', err);
        });
      }
    } else if (musicEnabled && musicVolume > 0) {
      playMusic('MAIN_TRACK');
    }
  }, [musicEnabled, musicVolume, playMusic]);

  const contextValue: AudioContextType = {
    // SFX State
    sfxEnabled,
    sfxVolume,

    // VO State
    voEnabled,
    voVolume,

    // Ambient State
    ambientEnabled,
    ambientVolume,

    // Music State
    musicEnabled,
    musicVolume,

    // SFX Actions
    toggleSfx,
    setSfxVolume,
    playSfx,
    stopSfx,

    // VO Actions
    toggleVo,
    setVoVolume,
    playVo,

    // Ambient Actions
    toggleAmbient,
    setAmbientVolume,

    // Music Actions
    toggleMusic,
    setMusicVolume,
    playMusic,
    stopMusic,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

export default AudioProvider;
