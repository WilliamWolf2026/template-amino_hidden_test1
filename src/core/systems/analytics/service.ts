import {
  type AnalyticsService,
  type GameKIT,
  GetAnalyticsServiceCommand,
  type PostHog,
  type AnalyticsConfig,
} from "@wolfgames/game-kit";

// ============================================================================
// POSTHOG SINGLETON
// ============================================================================

let posthogInstance: PostHog | null = null;

/**
 * Store the PostHog instance for imperative access.
 * Called once during analytics initialization.
 */
export function setPostHogInstance(instance: PostHog | null): void {
  posthogInstance = instance;
}

/**
 * Get the cached PostHog instance.
 * Returns null before initialization.
 */
export function getPostHogInstance(): PostHog | null {
  return posthogInstance;
}

/**
 * Capture an analytics event imperatively (outside SolidJS context).
 * Use `useAnalytics().capture()` in components instead.
 */
export function capture(event: string, properties?: Record<string, unknown>) {
  if (!posthogInstance) {
    console.warn(`[analytics] capture called before init: ${event}`);
    return;
  }
  posthogInstance.capture(event, properties);
}

/**
 * Identify a user imperatively (outside SolidJS context).
 */
export function identify(userId: string, properties?: Record<string, unknown>) {
  posthogInstance?.identify(userId, properties);
}

/**
 * Set person properties imperatively.
 */
export function setPersonProperties(properties: Record<string, unknown>) {
  posthogInstance?.people.set(properties);
}

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
 * Get or create the singleton AnalyticsService via GameKit.
 * Lazy initialization — service is created on first call.
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
// DEFAULT PARAMETER GENERATORS
// ============================================================================

/**
 * Creates the base default parameter generator function.
 * Use with addParamsDefault({ base: createBaseDefaults(...) })
 *
 * @param gameName - The name of the game (e.g., 'city_lines')
 * @returns A function that generates base defaults from context
 */
export function createBaseDefaults<T extends { sessionStartTime: number }, const G extends string>(
  gameName: G,
): (ctx: T) => { game_name: G; session_elapsed: number } {
  return (ctx: T) => ({
    game_name: gameName,
    session_elapsed: parseFloat(
      ((Date.now() - ctx.sessionStartTime) / 1000).toFixed(2)
    ),
  });
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export {
  type AnalyticsService,
  type AnalyticsConfig,
  type PostHog,
  type GameKIT,
  GetAnalyticsServiceCommand,
} from "@wolfgames/game-kit";
