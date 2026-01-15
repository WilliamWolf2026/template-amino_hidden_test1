/**
 * @file AudioControls.tsx
 * @description Audio controls component for managing sound settings.
 * This component provides a clean UI for users to control their audio preferences,
 * including enabling/disabling different audio types and adjusting volume levels.
 */

import React from 'react'
import AudioControlSection from './AudioControlSection'
import { useAudioContext } from '../AudioContext'

/**
 * Props for the AudioControls component
 */
interface AudioControlsProps {
  /**
   * Additional CSS classes to apply to the container
   */
  className?: string
  
  /**
   * Whether to show the component title
   * @default true
   */
  showTitle?: boolean
  
  /**
   * Custom title text
   * @default "Audio Settings"
   */
  title?: string
}

/**
 * AudioControls Component
 * 
 * Provides a user interface for controlling audio settings including:
 * - Enable/disable sound effects, voice-over, and music
 * - Adjust volume levels for each audio type
 * 
 * The component automatically syncs with the AudioContext and persists
 * settings to localStorage following the sound system documentation standards.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <AudioControls />
 * 
 * // In a settings modal
 * <AudioControls 
 *   className="p-4 bg-gray-100 rounded-lg" 
 *   title="Sound Settings"
 * />
 * 
 * // Minimal version without title
 * <AudioControls showTitle={false} />
 * ```
 */
const AudioControls: React.FC<AudioControlsProps> = ({
  className = '',
  showTitle = true,
  title = 'Audio Settings'
}) => {
  const {
    sfxEnabled,
    sfxVolume,
    voEnabled,
    voVolume,
    musicEnabled,
    musicVolume,
    toggleSfx,
    setSfxVolume,
    toggleVo,
    setVoVolume,
    toggleMusic,
    setMusicVolume,
  } = useAudioContext()

  return (
    <div className={`audio-controls ${className}`}>
      {showTitle && (
        <h3 className="text-lg font-bold mb-4 text-brand-text">
          {title}
        </h3>
      )}
      
      {/* SFX Controls Section */}
      <AudioControlSection
        enabled={sfxEnabled}
        volume={sfxVolume}
        onToggle={toggleSfx}
        onVolumeChange={setSfxVolume}
        title="Sound Effects"
        volumeLabel="SFX Volume"
      />
      
      {/* VO Controls Section */}
      <AudioControlSection
        enabled={voEnabled}
        volume={voVolume}
        onToggle={toggleVo}
        onVolumeChange={setVoVolume}
        title="Voice-Over"
        volumeLabel="Voice Volume"
        helpText="Voice-over includes detective commentary and feedback that plays alongside sound effects."
        disabledHelpText="Enable voice-over to hear detective audio."
        className="mt-6"
      />
      
      {/* Music Controls Section */}
      <AudioControlSection
        enabled={musicEnabled}
        volume={musicVolume}
        onToggle={toggleMusic}
        onVolumeChange={setMusicVolume}
        title="Background Music"
        volumeLabel="Music Volume"
        helpText="Background music plays during gameplay to enhance the atmosphere."
        disabledHelpText="Enable background music for the full experience."
        className="mt-6"
      />
    </div>
  )
}

export default AudioControls