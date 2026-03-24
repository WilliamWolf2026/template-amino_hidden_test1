import {
  type GameKIT,
  GetAnalyticsServiceCommand,
  type AnalyticsConfig as GameKitAnalyticsConfig,
} from "@wolfgames/game-kit";
import type { AnalyticsCore, AnalyticsClient } from "@wolfgames/components/core";

// ============================================================================
// IMPERATIVE CORE BRIDGE
//
// The AnalyticsProvider from @wolfgames/components/solid owns the core.
// AnalyticsBridge (see app.tsx) registers the instance here so non-SolidJS
// code (error reporter, etc.) can capture events imperatively.
// ============================================================================

let coreInstance: AnalyticsCore | null = null;

/** Called by AnalyticsBridge to register the provider's core instance. */
export function setCoreInstance(core: AnalyticsCore | null): void {
  coreInstance = core;
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
    return service as unknown as AnalyticsClient;
  };
}

// ============================================================================
// IMPERATIVE ACCESS (for non-SolidJS code like error reporter)
// ============================================================================

export function capture(event: string, properties?: Record<string, unknown>) {
  if (coreInstance) {
    coreInstance.capture(event, properties);
  } else {
    console.warn(`[analytics] capture called before init: ${event}`);
  }
}

export function identify(userId: string, properties?: Record<string, unknown>) {
  coreInstance?.identify(userId, properties);
}

export function setPersonProperties(properties: Record<string, unknown>) {
  coreInstance?.setPersonProperties(properties);
}

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
