/**
 * @file AudioControlSection.tsx
 * @description A component that wraps AudioControlGroup with section styling
 * and optional help text.
 */

import React from 'react'
import AudioControlGroup from './AudioControlGroup'

interface AudioControlSectionProps {
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
   * Title text for the section
   */
  title: string
  
  /**
   * Label text for the volume control
   * @default "{title} Volume"
   */
  volumeLabel?: string
  
  /**
   * Help text to display below the controls
   */
  helpText?: string
  
  /**
   * Additional help text to display when the audio is disabled
   */
  disabledHelpText?: string
  
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
 * AudioControlSection Component
 * 
 * Wraps AudioControlGroup with section styling and optional help text.
 * Provides a complete section for a specific audio category.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <AudioControlSection
 *   enabled={sfxEnabled}
 *   volume={sfxVolume}
 *   onToggle={toggleSfx}
 *   onVolumeChange={setSfxVolume}
 *   title="Sound Effects"
 * />
 * 
 * // With help text
 * <AudioControlSection
 *   enabled={voEnabled}
 *   volume={voVolume}
 *   onToggle={toggleVo}
 *   onVolumeChange={setVoVolume}
 *   title="Voice-Over"
 *   helpText="Voice-over includes detective commentary and feedback."
 *   disabledHelpText="Enable voice-over to hear detective audio."
 * />
 * ```
 */
const AudioControlSection: React.FC<AudioControlSectionProps> = ({
  enabled,
  volume,
  onToggle,
  onVolumeChange,
  title,
  volumeLabel,
  helpText,
  disabledHelpText,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`audio-control-section space-y-4 ${className}`}>
      {/* Audio control group */}
      <AudioControlGroup
        enabled={enabled}
        volume={volume}
        onToggle={onToggle}
        onVolumeChange={onVolumeChange}
        label={title}
        volumeLabel={volumeLabel}
        disabled={disabled}
      />
      
      {/* Help text */}
      {(helpText || (!enabled && disabledHelpText)) && (
        <div className="help-text">
          <p className="text-sm text-brand-text-secondary">
            {helpText}
            {!enabled && disabledHelpText && ` ${disabledHelpText}`}
          </p>
        </div>
      )}
    </div>
  )
}

export default AudioControlSection