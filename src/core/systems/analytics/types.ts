// Re-export core types from game-components
export type {
  AnalyticsCore,
  AnalyticsConfig,
  AnalyticsClient,
  AnalyticsIdentity,
} from "@wolfgames/components/core";

// Re-export game-kit types
export type {
  AnalyticsService,
  PostHog,
} from "@wolfgames/game-kit";

// ============================================================================
// GAME-KIT SPECIFIC HELPERS
// ============================================================================

/**
 * Base context interface that all games should extend.
 * Provides session tracking foundation for createBaseDefaults().
 */
export interface BaseAnalyticsContext {
  sessionStartTime: number;
}

/**
 * Helper type to extract tracker parameters from a createTracker call.
 */
export type TrackerParams<T> = T extends (p: infer P) => void ? P : never;
