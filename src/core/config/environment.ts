/**
 * Environment configuration for different deployment targets.
 * Controls CDN URLs, API servers, and feature flags per environment.
 *
 * Environment detection is Vite-specific (import.meta.env).
 * URL resolution is delegated to @wolfgames/game-kit factories.
 */

import {
  Environment,
  parseEnvironment,
  getCdnHost,
} from '@wolfgames/game-kit';

export { Environment };

export const getEnvironment = (): Environment => {
  return parseEnvironment(import.meta.env.VITE_APP_ENV);
};

export interface PosthogConfig {
  enabled: boolean;
  key: string;
  host: string;
  platform: string;
}

export interface EnvConfig {
  /** Base URL for media/assets CDN */
  url: string;
  /** API server URL (if applicable) */
  server?: string;
  /** Posthog analytics configuration */
  posthog: PosthogConfig;
}

const SHARED_POSTHOG = {
  key: "phc_RFhmtnQWjam4fNHYyn89lf0WVW6qF5bVYMwoXO8dSpR",
  host: "https://us.i.posthog.com",
  platform: "advance",
};

/**
 * Build env config using game-kit CDN factories + local posthog settings.
 */
function buildEnvConfig(env: Environment): EnvConfig {
  const analyticsEnabled = env !== Environment.Local && env !== Environment.Development;

  return {
    url: getCdnHost(env),
    posthog: {
      ...SHARED_POSTHOG,
      enabled: analyticsEnabled,
    },
  };
}

/**
 * Base environment config (scaffold-level).
 * CDN URLs are resolved via game-kit factories.
 */
export const ENV_CONFIG: Record<Environment, EnvConfig> = {
  [Environment.Local]: buildEnvConfig(Environment.Local),
  [Environment.Development]: buildEnvConfig(Environment.Development),
  [Environment.QA]: buildEnvConfig(Environment.QA),
  [Environment.Staging]: buildEnvConfig(Environment.Staging),
  [Environment.Production]: buildEnvConfig(Environment.Production),
};

export const getEnvConfig = (): EnvConfig => {
  const env = getEnvironment();
  return ENV_CONFIG[env];
};

/**
 * Get the CDN base URL for the current environment.
 */
export const getCdnBaseUrl = (): string => {
  return getEnvConfig().url;
};

/**
 * Get the posthog config for the current environment.
 */
export const getPosthogConfig = (): PosthogConfig => {
  return getEnvConfig().posthog;
};

/**
 * Check if running in local development mode.
 */
export const isLocal = (): boolean => {
  return getEnvironment() === Environment.Local;
};

/**
 * Check if running in production.
 */
export const isProduction = (): boolean => {
  return getEnvironment() === Environment.Production;
};
