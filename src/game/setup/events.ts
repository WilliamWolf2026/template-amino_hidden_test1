import { type } from "arktype";

// ============================================================================
// SHARED PARAMETER SET SCHEMAS
// ============================================================================

/**
 * Base parameter set schema that should be included in every game event.
 * Register with addParamsSet({ base: baseParamsSet })
 */
export const baseParamsSet = type({
  game_name: "string",
  session_elapsed: "number",
});

/**
 * Level context parameter set schema for level-related events.
 * Extend based on your game's specific needs.
 */
export const levelContextParamsSet = type({
  chapter_count: "number",
  county_theme: "string",
  level_order: "number",
  "chapter_progress?": "string",
});

// ============================================================================
// SESSION EVENT SCHEMAS
// ============================================================================

export const sessionStartSchema = type({
  entry_screen: "string",
});

export const sessionPauseSchema = type({
  pause_reason: "'tab_hidden' | 'window_blur' | 'app_background'",
});

export const sessionResumeSchema = type({
  resume_reason: "'tab_visible' | 'window_focus' | 'app_foreground'",
  pause_duration: "number",
});

export const sessionEndSchema = type({
  session_end_reason: "'user_close' | 'timeout' | 'navigation_away'",
});

/**
 * Creates an extended session_end schema with game-specific properties.
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

export const gameStartSchema = type({
  start_source: "string",
  is_returning_player: "boolean",
});

export const audioSettingChangedSchema = type({
  setting_type: "'volume' | 'mute'",
  old_value: "unknown",
  new_value: "unknown",
  screen_name: "string",
});

export const errorCapturedSchema = type({
  error_type: "string",
  user_id: "string",
  session_id: "string",
});

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { type } from "arktype";
