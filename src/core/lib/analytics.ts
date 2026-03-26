import {
  type AnalyticsService,
  type GameKIT,
  GetAnalyticsServiceCommand,
  type PostHog,
  type AnalyticsConfig,
} from "@wolfgames/game-kit";
import { type } from "arktype";

// Re-export the AnalyticsConfig type from game-kit
export type { AnalyticsConfig } from "@wolfgames/game-kit";

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

let sessionStartTime = Date.now();

/**
 * Reset the session timer to now. Call this when a new session starts.
 */
export function resetSessionTimer(): void {
  sessionStartTime = Date.now();
}

/**
 * Get the session start timestamp.
 */
export function getSessionStartTime(): number {
  return sessionStartTime;
}

/**
 * Get seconds elapsed since session started.
 * Useful for the `session_elapsed` property in analytics events.
 */
export function getSessionElapsed(): number {
  return parseFloat(((Date.now() - sessionStartTime) / 1000).toFixed(2));
}

// ============================================================================
// ANALYTICS SERVICE INITIALIZATION
// ============================================================================

let analyticsPromise: Promise<AnalyticsService> | null = null;

async function createAnalytics(
  gameKit: GameKIT,
  config: AnalyticsConfig,
): Promise<AnalyticsService> {
  const { promise } = gameKit.execute(
    new GetAnalyticsServiceCommand(config),
  );

  return promise;
}

/**
 * Get or create the singleton AnalyticsService.
 * Lazy initialization - service is created on first call.
 */
export async function getAnalytics(
  gameKit: GameKIT,
  config: AnalyticsConfig,
): Promise<AnalyticsService> {
  if (!analyticsPromise) {
    analyticsPromise = createAnalytics(gameKit, config);
  }
  return analyticsPromise;
}

/**
 * Reset the analytics singleton. Useful for testing.
 */
export function resetAnalytics(): void {
  analyticsPromise = null;
}

// ============================================================================
// COMMON PARAMETER SETS (for use with addParamsSet)
// ============================================================================

/**
 * Base parameter set schema that should be included in every game event.
 * Games should register this with addParamsSet({ base: baseParamsSet })
 */
export const baseParamsSet = type({
  game_name: "string",
  game_slug: "string",
  game_id: "string",
  session_elapsed: "number",
});

/**
 * Level context parameter set schema for level-related events.
 * Games should extend this based on their specific needs.
 */
export const levelContextParamsSet = type({
  chapter_count: "number",
  county_theme: "string",
  level_order: "number",
  "chapter_progress?": "string",
});

// ============================================================================
// DEFAULT PARAMETER GENERATORS
// ============================================================================

/**
 * Creates the base default parameter generator function.
 * This should be used with addParamsDefault({ base: createBaseDefaults(...) })
 *
 * @param gameName - Human-readable game name (e.g., "City Lines")
 * @param gameSlug - URL-safe game identifier (e.g., "city-lines")
 * @param gameId - Unique identifier for the game instance
 * @returns A function that generates base defaults from context
 */
export function createBaseDefaults<T extends { sessionStartTime: number }, const G extends string>(
  gameName: G,
  gameSlug: string,
  gameId: string,
): (ctx: T) => { game_name: G; game_slug: string; game_id: string; session_elapsed: number } {
  return (ctx: T) => ({
    game_name: gameName,
    game_slug: gameSlug,
    game_id: gameId,
    session_elapsed: parseFloat(
      ((Date.now() - ctx.sessionStartTime) / 1000).toFixed(2)
    ),
  });
}

// ============================================================================
// TYPING HELPERS
// ============================================================================

/**
 * Base context interface that all games should extend.
 * Provides session tracking and game identity.
 */
export interface BaseAnalyticsContext {
  sessionStartTime: number;
  gameSlug: string;
  gameId: string;
}

/**
 * Helper type to extract tracker parameters from a createTracker call.
 * Useful for creating wrapper functions.
 * 
 * @example
 * const _trackLevelStart = analyticsService.createTracker(...);
 * export const trackLevelStart = (
 *   params: TrackerParams<typeof _trackLevelStart>
 * ) => { ... }
 */
export type TrackerParams<T> = T extends (p: infer P) => void ? P : never;

// ============================================================================
// POSTHOG ACCESS
// ============================================================================

let cachedPostHog: PostHog | null = null;

/**
 * Cache the PostHog instance for direct access.
 * Call this after analytics service initialization.
 */
export function cachePostHogInstance(ph: PostHog | null): void {
  cachedPostHog = ph;
}

/**
 * Get the cached PostHog instance.
 * Returns null if cachePostHogInstance hasn't been called.
 */
export function getCachedPostHog(): PostHog | null {
  return cachedPostHog;
}

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

export {
  type AnalyticsService,
  type PostHog,
  GetAnalyticsServiceCommand,
} from "@wolfgames/game-kit";
export { type } from "arktype";
