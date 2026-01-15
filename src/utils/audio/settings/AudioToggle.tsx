/**
 * @file AudioToggle.tsx
 * @description A specialized toggle component for audio controls that combines
 * a label, toggle button, and status indicator.
 */

import React from 'react'
import StatusIndicator from './StatusIndicator'
import ToggleButton from '@/src/components/ui/buttons/ToggleButton'

interface AudioToggleProps {
  /**
   * Whether the audio is enabled
   */
  enabled: boolean
  
  /**
   * Callback when toggle state changes
   */
  onToggle: () => void
  
  /**
   * Label text for the toggle
   */
  label: string
  
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
 * AudioToggle Component
 * 
 * A specialized toggle component for audio controls that combines a label,
 * toggle button, and status indicator. Used for enabling/disabling audio categories.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <AudioToggle 
 *   enabled={sfxEnabled}
 *   onToggle={toggleSfx}
 *   label="Sound Effects"
 * />
 * 
 * // Disabled state
 * <AudioToggle
 *   enabled={voEnabled}
 *   onToggle={toggleVo}
 *   label="Voice-Over"
 *   disabled={true}
 * />
 * ```
 */
const AudioToggle: React.FC<AudioToggleProps> = ({
  enabled,
  onToggle,
  label,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`control-group flex items-center justify-between ${className}`}>
      <label className="flex items-center space-x-3 cursor-pointer">
        <ToggleButton
          toggled={enabled}
          onToggle={() => onToggle()}
          accessibleLabel={`Toggle ${label}`}
          disabled={disabled}
          className="mr-3"
        />
        <span className="text-brand-text font-medium">
          {label}
        </span>
      </label>
      
      {/* Status indicator */}
      <StatusIndicator active={enabled} />
    </div>
  )
}

export default AudioToggle