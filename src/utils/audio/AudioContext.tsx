/**
 * @file AudioContext.tsx
 * @description Audio context provider for managing sound effects and voice-over throughout the application.
 * This implementation manages both SFX and VO audio categories, allowing them to play simultaneously.
 * Follows the sound system documentation standards for simplified, maintainable audio management.
 */

import { createContext, useContext } from 'react'
import { SfxKey, VoKey, MusicKey } from './constants'

/**
 * Audio Context Type Definition
 * Manages both SFX and VO audio categories with flat state structure
 */
export interface AudioContextType {
  // SFX State
  sfxEnabled: boolean
  sfxVolume: number

  // VO State
  voEnabled: boolean
  voVolume: number

  // Ambient State
  ambientEnabled: boolean
  ambientVolume: number

  // Music State
  musicEnabled: boolean
  musicVolume: number

  // SFX Actions
  toggleSfx: () => void
  setSfxVolume: (volume: number) => void
  playSfx: (key: SfxKey, options?: { loop?: boolean }) => void
  stopSfx: (key?: SfxKey) => void

  // VO Actions
  toggleVo: () => void
  setVoVolume: (volume: number) => void
  playVo: (key: VoKey) => void

  // Ambient Actions
  toggleAmbient: () => void
  setAmbientVolume: (volume: number) => void

  // Music Actions
  toggleMusic: () => void
  setMusicVolume: (volume: number) => void
  playMusic: (key: MusicKey) => void
  stopMusic: () => void
}

/**
 * Audio Context - provides SFX management throughout the app
 */
export const AudioContext = createContext<AudioContextType | null>(null)

/**
 * Custom hook to access the Audio Context
 * Throws an error if used outside of AudioProvider
 */
export const useAudioContext = (): AudioContextType => {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudioContext must be used within AudioProvider')
  }
  return context
}