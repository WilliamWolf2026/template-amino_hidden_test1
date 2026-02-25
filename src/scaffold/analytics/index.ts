/**
 * Scaffold Analytics Module
 * 
 * Shared analytics infrastructure that all games can use:
 * - Event schemas (session events, generic game events)
 * - Base parameter sets
 * - Helper types and utilities
 * 
 * Games should import from here for shared functionality,
 * and create their own game-specific trackers.
 */

// Event schemas
export {
  baseParamsSet,
  sessionStartSchema,
  sessionPauseSchema,
  sessionResumeSchema,
  sessionEndSchema,
  gameStartSchema,
  audioSettingChangedSchema,
  errorCapturedSchema,
  extendSessionEndSchema,
  type BaseAnalyticsContext,
} from "./events";

// Re-export arktype for convenience
export { type } from "arktype";
