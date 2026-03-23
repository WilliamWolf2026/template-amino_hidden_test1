// Reactive layer (SolidJS)
export { AnalyticsProvider, useAnalytics } from './context';

// Identity registration
export { registerAnalyticsIdentity } from './registry';

// Imperative service (for non-SolidJS code)
export {
  capture,
  identify,
  setPersonProperties,
  getPostHogInstance,
  setPostHogInstance,
  getAnalytics,
  resetAnalytics,
  getSessionElapsed,
  getSessionStartTime,
  resetSessionTimer,
  createBaseDefaults,
  GetAnalyticsServiceCommand,
} from './service';

// Event schemas
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

// Types
export type {
  AnalyticsIdentity,
  AnalyticsState,
  BaseAnalyticsContext,
  TrackerParams,
  AnalyticsService,
  AnalyticsConfig,
  PostHog,
} from './types';
