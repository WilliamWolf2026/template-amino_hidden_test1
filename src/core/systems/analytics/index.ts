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

// Types — re-exported from game-components + game-kit
export type {
  AnalyticsCore,
  AnalyticsConfig,
  AnalyticsClient,
  AnalyticsIdentity,
  BaseAnalyticsContext,
  TrackerParams,
} from './types';

export type {
  AnalyticsService,
  PostHog,
} from './types';

export type { GameKitAnalyticsConfig } from './service';
