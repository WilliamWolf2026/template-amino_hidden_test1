// Reactive layer (SolidJS) — thin wrapper around game-components core
export { AnalyticsProvider, useAnalytics } from './context';

// Imperative access (for non-SolidJS code like error reporter)
export {
  capture,
  identify,
  setPersonProperties,
  getClient,
  getAnalyticsCore,
  resetAnalyticsCore,
  createGameKitInitClient,
  createBaseDefaults,
  GetAnalyticsServiceCommand,
} from './service';

// Event schemas (game-specific)
export {
  baseParamsSet,
  levelContextParamsSet,
  sessionStartSchema,
  sessionPauseSchema,
  sessionResumeSchema,
  sessionEndSchema,
  extendSessionEndSchema,
  gameStartSchema,
  audioSettingChangedSchema,
  errorCapturedSchema,
} from './events';

// Types — re-exported from game-components + game-kit helpers
export type {
  AnalyticsCore,
  AnalyticsConfig,
  AnalyticsClient,
  AnalyticsIdentity,
  AnalyticsService,
  PostHog,
  BaseAnalyticsContext,
  TrackerParams,
} from './types';

export type { GameKitAnalyticsConfig } from './service';
