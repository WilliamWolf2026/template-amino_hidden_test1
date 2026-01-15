/**
 * @file AudioControlGroup.tsx
 * @description A component that combines audio toggle and volume slider
 * into a single control group.
 */

import React from 'react'
import AudioToggle from './AudioToggle'
import VolumeSlider from './VolumeSlider'

interface AudioControlGroupProps {
  /**
   * Whether the audio is enabled
   */
  enabled: boolean
  
  /**
   * Current volume value (0-1)
   */
  volume: number
  
  /**
   * Callback when toggle state changes
   */
  onToggle: () => void
  
  /**
   * Callback when volume changes
   */
  onVolumeChange: (volume: number) => void
  
  /**
   * Label text for the toggle
   */
  label: string
  
  /**
   * Label text for the volume control
   * @default "{label} Volume"
   */
  volumeLabel?: string
  
  /**
   * Whether the control is disabled
   * @default false
   */
  disabled?: boolean
  
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * AudioControlGroup Component
 * 
 * Combines an AudioToggle and VolumeSlider into a single control group.
 * Handles the relationship between the toggle state and volume slider.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <AudioControlGroup
 *   enabled={sfxEnabled}
 *   volume={sfxVolume}
 *   onToggle={toggleSfx}
 *   onVolumeChange={setSfxVolume}
 *   label="Sound Effects"
 * />
 * 
 * // With custom volume label
 * <AudioControlGroup
 *   enabled={voEnabled}
 *   volume={voVolume}
 *   onToggle={toggleVo}
 *   onVolumeChange={setVoVolume}
 *   label="Voice-Over"
 *   volumeLabel="Voice Intensity"
 * />
 * ```
 */
const AudioControlGroup: React.FC<AudioControlGroupProps> = ({
  enabled,
  volume,
  onToggle,
  onVolumeChange,
  label,
  volumeLabel,
  disabled = false,
  className = '',
}) => {
  // Default volume label if not provided
  const actualVolumeLabel = volumeLabel || `${label} Volume`
  
  return (
    <div className={`audio-control-group space-y-4 ${className}`}>
      {/* Toggle control */}
      <AudioToggle
        enabled={enabled}
        onToggle={onToggle}
        label={label}
        disabled={disabled}
      />
      
      {/* Volume slider */}
      <VolumeSlider
        volume={volume}
        onVolumeChange={onVolumeChange}
        label={actualVolumeLabel}
        enabled={enabled}
        disabled={disabled}
      />
    </div>
  )
}

export default AudioControlGroup