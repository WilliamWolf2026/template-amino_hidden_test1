import { type } from "arktype";

// ============================================================================
// SHARED PARAMETER SET SCHEMAS
// ============================================================================

/**
 * Base parameter set schema that should be included in every game event.
 * Games should register this with addParamsSet({ base: baseParamsSet })
 */
export const baseParamsSet = type({
  game_name: "string",
  session_elapsed: "number",
});

/**
 * Base context interface that all games should extend.
 * Provides session tracking foundation.
 */
export interface BaseAnalyticsContext {
  sessionStartTime: number;
}

// ============================================================================
// SESSION EVENT SCHEMAS
// ============================================================================

/**
 * Schema for session_start event
 */
export const sessionStartSchema = type({
  entry_screen: "string",
});

/**
 * Schema for session_pause event
 */
export const sessionPauseSchema = type({
  pause_reason: "'tab_hidden' | 'window_blur' | 'app_background'",
});

/**
 * Schema for session_resume event
 */
export const sessionResumeSchema = type({
  resume_reason: "'tab_visible' | 'window_focus' | 'app_foreground'",
  pause_duration: "number",
});

/**
 * Base schema for session_end event
 * Games should extend this with their own session-level context properties
 */
export const sessionEndSchema = type({
  session_end_reason: "'user_close' | 'timeout' | 'navigation_away'",
});

/**
 * Creates an extended session_end schema with game-specific properties
 * @param extraProperties - Additional arktype property definitions
 * @returns Extended schema
 */
export function extendSessionEndSchema(
  extraProperties: Record<string, string>
): ReturnType<typeof type> {
  return type({
    session_end_reason: "'user_close' | 'timeout' | 'navigation_away'",
    ...extraProperties,
  });
}

// ============================================================================
// GENERIC GAME EVENT SCHEMAS
// ============================================================================

/**
 * Schema for game_start event
 */
export const gameStartSchema = type({
  start_source: "string",
  is_returning_player: "boolean",
});

/**
 * Schema for audio_setting_changed event
 * Common across all games
 */
export const audioSettingChangedSchema = type({
  setting_type: "'volume' | 'mute'",
  old_value: "unknown",
  new_value: "unknown",
  screen_name: "string",
});

/**
 * Schema for error_captured event
 */
export const errorCapturedSchema = type({
  error_type: "string",
  user_id: "string",
  session_id: "string",
});

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

export { type } from "arktype";
