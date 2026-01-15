import { createSignal, createRoot } from 'solid-js';

// localStorage keys
const STORAGE_KEYS = {
  VOLUME: 'app_master_volume',
  MUSIC_ENABLED: 'app_music_enabled',
  AMBIENT_ENABLED: 'app_ambient_enabled',
  VO_ENABLED: 'app_vo_enabled',
} as const;

// Helper to get from localStorage with fallback
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

// Helper to set in localStorage
function setStored(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

export interface AudioState {
  // State
  volume: () => number;
  musicEnabled: () => boolean;
  ambientEnabled: () => boolean;
  voEnabled: () => boolean;

  // Actions
  setVolume: (volume: number) => void;
  toggleMusic: () => void;
  toggleAmbient: () => void;
  toggleVo: () => void;
  setMusicEnabled: (enabled: boolean) => void;
  setAmbientEnabled: (enabled: boolean) => void;
  setVoEnabled: (enabled: boolean) => void;
}

function createAudioState(): AudioState {
  const [volume, setVolumeSignal] = createSignal(getStored(STORAGE_KEYS.VOLUME, 0.5));
  const [musicEnabled, setMusicEnabledSignal] = createSignal(getStored(STORAGE_KEYS.MUSIC_ENABLED, true));
  const [ambientEnabled, setAmbientEnabledSignal] = createSignal(getStored(STORAGE_KEYS.AMBIENT_ENABLED, true));
  const [voEnabled, setVoEnabledSignal] = createSignal(getStored(STORAGE_KEYS.VO_ENABLED, true));

  const setVolume = (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeSignal(clamped);
    setStored(STORAGE_KEYS.VOLUME, clamped);
  };

  const setMusicEnabled = (enabled: boolean) => {
    setMusicEnabledSignal(enabled);
    setStored(STORAGE_KEYS.MUSIC_ENABLED, enabled);
  };

  const setAmbientEnabled = (enabled: boolean) => {
    setAmbientEnabledSignal(enabled);
    setStored(STORAGE_KEYS.AMBIENT_ENABLED, enabled);
  };

  const setVoEnabled = (enabled: boolean) => {
    setVoEnabledSignal(enabled);
    setStored(STORAGE_KEYS.VO_ENABLED, enabled);
  };

  return {
    volume,
    musicEnabled,
    ambientEnabled,
    voEnabled,
    setVolume,
    toggleMusic: () => setMusicEnabled(!musicEnabled()),
    toggleAmbient: () => setAmbientEnabled(!ambientEnabled()),
    toggleVo: () => setVoEnabled(!voEnabled()),
    setMusicEnabled,
    setAmbientEnabled,
    setVoEnabled,
  };
}

export const audioState = createRoot(createAudioState);
