/**
 * Scaffold Analytics Module
 *
 * Shared analytics infrastructure that all games can use:
 * - Event schemas (session, navigation, loading, system, gameplay lifecycle)
 * - Base parameter sets
 * - Helper types and utilities
 *
 * Games should import from here for shared functionality,
 * and create their own game-specific trackers.
 */

// Base params and context
export {
  baseParamsSet,
  type BaseAnalyticsContext,
} from "./events";

// Session events (automatic)
export {
  sessionStartSchema,
  sessionPauseSchema,
  sessionResumeSchema,
  sessionEndSchema,
  extendSessionEndSchema,
} from "./events";

// Navigation events (automatic)
export {
  screenEnterSchema,
  screenExitSchema,
} from "./events";

// Loading events (automatic)
export {
  loadingStartSchema,
  loadingCompleteSchema,
  loadingAbandonSchema,
} from "./events";

// System events (automatic)
export {
  errorCapturedSchema,
  audioSettingChangedSchema,
} from "./events";

// Gameplay lifecycle events (AI agent wires)
export {
  gameStartSchema,
  levelStartSchema,
  levelCompleteSchema,
  levelFailSchema,
  levelRestartSchema,
  chapterStartSchema,
  chapterCompleteSchema,
} from "./events";

// Re-export arktype for convenience
export { type } from "arktype";
