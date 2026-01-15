/**
 * @file VolumeSlider.tsx
 * @description A specialized volume slider component with percentage display
 * and level indicators for audio controls.
 */

import React from 'react'

interface VolumeSliderProps {
  /**
   * Current volume value (0-1)
   */
  volume: number
  
  /**
   * Callback when volume changes
   */
  onVolumeChange: (volume: number) => void
  
  /**
   * Label text for the volume control
   */
  label: string
  
  /**
   * Whether the control is enabled
   */
  enabled: boolean
  
  /**
   * Whether the control is disabled (overrides enabled)
   * @default false
   */
  disabled?: boolean
  
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * VolumeSlider Component
 * 
 * A specialized volume slider component with percentage display and level indicators.
 * Features a gradient-filled track that updates based on the current volume level.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <VolumeSlider
 *   volume={sfxVolume}
 *   onVolumeChange={setSfxVolume}
 *   label="SFX Volume"
 *   enabled={sfxEnabled}
 * />
 * 
 * // Disabled state
 * <VolumeSlider
 *   volume={voVolume}
 *   onVolumeChange={setVoVolume}
 *   label="Voice Volume"
 *   enabled={voEnabled}
 *   disabled={true}
 * />
 * ```
 */
const VolumeSlider: React.FC<VolumeSliderProps> = ({
  volume,
  onVolumeChange,
  label,
  enabled,
  disabled = false,
  className = '',
}) => {
  // Calculate volume percentage for display and styling
  const volumePercentage = Math.round(volume * 100)
  
  // Handle volume slider changes
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    onVolumeChange(newVolume)
  }
  
  // Determine if the control should be disabled
  const isDisabled = disabled || !enabled
  
  return (
    <div className={`control-group ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-brand-text font-medium">
          {label}
        </label>
        <span className="text-sm text-brand-text-secondary">
          {volumePercentage}%
        </span>
      </div>
      
      <div className="volume-slider-container">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          disabled={isDisabled}
          className={`w-full h-2 bg-brand-surface rounded-lg appearance-none cursor-pointer slider ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{
            background: !isDisabled
              ? `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volumePercentage}%, #e5e7eb ${volumePercentage}%, #e5e7eb 100%)`
              : '#e5e7eb'
          }}
        />
      </div>
      
      {/* Volume level indicators */}
      <div className="flex justify-between text-xs text-brand-text-secondary mt-1">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

export default VolumeSlider