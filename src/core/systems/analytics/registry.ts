import type { AnalyticsIdentity } from './types';

let registeredIdentity: AnalyticsIdentity | undefined;

/**
 * Register the analytics identity for PostHog identification.
 * Call this from game setup before the provider mounts.
 */
export function registerAnalyticsIdentity(identity: AnalyticsIdentity): void {
  registeredIdentity = identity;
}

export function getRegisteredIdentity(): AnalyticsIdentity | undefined {
  return registeredIdentity;
}
