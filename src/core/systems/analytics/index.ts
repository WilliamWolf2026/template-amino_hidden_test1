// Provider & hooks — from game-components (NOT defined here)
export {
  AnalyticsProvider,
  useAnalytics,
  useAnalyticsCore,
} from '@wolfgames/components/solid';

// Imperative access bridge (for non-SolidJS code like error reporter)
export {
  capture,
  identify,
  setPersonProperties,
  getClient,
  setCoreInstance,
  createGameKitInitClient,
} from './service';

// Types — direct from packages (no local re-export layer)
export type {
  AnalyticsCore,
  AnalyticsConfig,
  AnalyticsClient,
  AnalyticsIdentity,
  BaseAnalyticsContext,
  TrackerParams,
} from '@wolfgames/components/core';

export type {
  AnalyticsService,
  PostHog,
} from '@wolfgames/game-kit';

export type { GameKitAnalyticsConfig } from './service';
