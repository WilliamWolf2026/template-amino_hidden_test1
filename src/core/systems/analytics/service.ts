import {
  type GameKIT,
  GetAnalyticsServiceCommand,
  type AnalyticsConfig as GameKitAnalyticsConfig,
} from "@wolfgames/game-kit";
import {
  createAnalyticsCore,
  type AnalyticsCore,
  type AnalyticsClient,
} from "@wolfgames/components/core";

// ============================================================================
// CORE INSTANCE
// ============================================================================

let coreInstance: AnalyticsCore | null = null;

/**
 * Get or create the singleton AnalyticsCore.
 * Called by the provider on mount; available imperatively for non-SolidJS code.
 */
export function getAnalyticsCore(): AnalyticsCore {
  if (!coreInstance) {
    coreInstance = createAnalyticsCore();
  }
  return coreInstance;
}

/**
 * Reset the core instance. Useful for testing.
 */
export function resetAnalyticsCore(): void {
  coreInstance?.dispose();
  coreInstance = null;
}

// ============================================================================
// GAMEKIT INITIALIZATION
// ============================================================================

/**
 * Creates an initClient function for the AnalyticsProvider config.
 * Wires up GameKit's analytics service and returns the PostHog client.
 */
export function createGameKitInitClient(
  gameKit: GameKIT,
  config: GameKitAnalyticsConfig,
): () => Promise<AnalyticsClient | null> {
  return async () => {
    const { promise } = gameKit.execute(
      new GetAnalyticsServiceCommand(config),
    );
    const service = await promise;
    // The GameKit AnalyticsService exposes PostHog as the underlying client
    return service as unknown as AnalyticsClient;
  };
}

// ============================================================================
// IMPERATIVE ACCESS (for non-SolidJS code like error reporter)
// ============================================================================

/**
 * Capture an analytics event imperatively.
 * Use `useAnalytics().capture()` in components instead.
 */
export function capture(event: string, properties?: Record<string, unknown>) {
  const core = coreInstance;
  if (core) {
    core.capture(event, properties);
  } else {
    console.warn(`[analytics] capture called before init: ${event}`);
  }
}

/**
 * Identify a user imperatively.
 */
export function identify(userId: string, properties?: Record<string, unknown>) {
  coreInstance?.identify(userId, properties);
}

/**
 * Set person properties imperatively.
 */
export function setPersonProperties(properties: Record<string, unknown>) {
  coreInstance?.setPersonProperties(properties);
}

/**
 * Get the underlying analytics client for direct access.
 */
export function getClient(): AnalyticsClient | null {
  return coreInstance?.client.get() ?? null;
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export {
  type AnalyticsConfig as GameKitAnalyticsConfig,
  type GameKIT,
  GetAnalyticsServiceCommand,
} from "@wolfgames/game-kit";

export {
  createAnalyticsCore,
  createBaseDefaults,
  type AnalyticsCore,
  type AnalyticsConfig,
  type AnalyticsClient,
  type AnalyticsIdentity,
} from "@wolfgames/components/core";
