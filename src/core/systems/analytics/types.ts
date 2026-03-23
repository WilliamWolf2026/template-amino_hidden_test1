import type { Accessor } from 'solid-js';
import type { PostHog } from '@wolfgames/game-kit';

// ============================================================================
// IDENTITY
// ============================================================================

export interface AnalyticsIdentity {
  userId: string;
  email?: string;
  name?: string;
}

// ============================================================================
// REACTIVE STATE (SolidJS)
// ============================================================================

export interface AnalyticsState {
  /** PostHog instance (null until initialized) */
  posthog: Accessor<PostHog | null>;
  /** Whether analytics has finished initializing (true even if disabled/failed) */
  isReady: Accessor<boolean>;
  /** Capture a named event with optional properties */
  capture: (event: string, properties?: Record<string, unknown>) => void;
  /** Identify a user with optional properties */
  identify: (userId: string, properties?: Record<string, unknown>) => void;
  /** Register super properties for all future events */
  register: (properties: Record<string, unknown>) => void;
}

// ============================================================================
// CONTEXT HELPERS
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
 *
 * @example
 * const _trackLevelStart = analyticsService.createTracker(...);
 * export const trackLevelStart = (params: TrackerParams<typeof _trackLevelStart>) => { ... }
 */
export type TrackerParams<T> = T extends (p: infer P) => void ? P : never;

// ============================================================================
// RE-EXPORTS
// ============================================================================

export type {
  AnalyticsService,
  AnalyticsConfig,
  PostHog,
} from '@wolfgames/game-kit';
