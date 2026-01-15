/**
 * @file StatusIndicator.tsx
 * @description A simple status indicator component that displays active/inactive state
 * with appropriate styling. Used primarily in audio controls to show on/off status.
 */

import React from 'react'

interface StatusIndicatorProps {
  /**
   * Whether the status is active
   */
  active: boolean
  
  /**
   * Text to display when active
   * @default "On"
   */
  activeText?: string
  
  /**
   * Text to display when inactive
   * @default "Off"
   */
  inactiveText?: string
  
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * StatusIndicator Component
 * 
 * Displays a badge showing active/inactive status with appropriate styling.
 * Used in audio controls to show enabled/disabled state.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <StatusIndicator active={true} />
 * 
 * // Custom text
 * <StatusIndicator 
 *   active={isEnabled} 
 *   activeText="Enabled" 
 *   inactiveText="Disabled" 
 * />
 * ```
 */
const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  active,
  activeText = 'On',
  inactiveText = 'Off',
  className = '',
}) => {
  return (
    <span 
      className={`text-sm px-2 py-1 rounded ${
        active 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-600'
      } ${className}`}
    >
      {active ? activeText : inactiveText}
    </span>
  )
}

export default StatusIndicator