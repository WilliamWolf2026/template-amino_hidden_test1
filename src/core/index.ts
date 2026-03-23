// Config
export * from './config';

// Systems
export * from './systems/analytics';
export * from './systems/assets';
export * from './systems/feature-flags';
export * from './systems/screens';
export * from './systems/errors';
export * from './systems/pause';
export * from './systems/audio';
export * from './systems/tuning';

// UI Components
export { Button } from './ui/Button';
export { Logo } from './ui/Logo';
export { PauseOverlay } from './ui/PauseOverlay';
export { MobileViewport } from './ui/MobileViewport';

// Utils
export { default as SettingsMenu } from './utils/SettingsMenu';
export {
  getStored,
  setStored,
  removeStored,
  createVersionedStore,
  type VersionedStore,
  type VersionedStoreConfig,
} from './utils/storage';

// Dev Tools
export { TweakpaneConfig, isOpen, setIsOpen } from './dev';
export { TuningPanel, isPanelOpen, setIsPanelOpen } from './dev';

// Analytics (consolidated — service, events, types all live in systems/analytics/)
export {
  // Service (imperative)
  getAnalytics,
  resetAnalytics,
  getSessionElapsed,
  getSessionStartTime,
  resetSessionTimer,
  getPostHogInstance,
  setPostHogInstance,
  capture,
  identify,
  setPersonProperties,
  createBaseDefaults,
  GetAnalyticsServiceCommand,
  // Event schemas
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
  // Types
  type AnalyticsConfig,
  type AnalyticsService,
  type PostHog,
  type BaseAnalyticsContext,
  type TrackerParams,
} from './systems/analytics';
