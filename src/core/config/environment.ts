/**
 * Environment configuration for different deployment targets.
 * Controls CDN URLs, API servers, and feature flags per environment.
 *
 * Environment detection is Vite-specific (import.meta.env).
 * URL resolution is delegated to @wolfgames/game-kit factories.
 */

import {
  Environment as GKEnvironment,
  getCdnHost,
} from '@wolfgames/game-kit';

export type Environment =
  | "local"
  | "development"
  | "staging"
  | "qa"
  | "production";

/** Map amino environment strings to game-kit's Environment enum. */
const ENV_MAP: Record<Environment, GKEnvironment> = {
  local: GKEnvironment.Local,
  development: GKEnvironment.Development,
  staging: GKEnvironment.Staging,
  qa: GKEnvironment.QA,
  production: GKEnvironment.Production,
};

export function toGameKitEnvironment(env: Environment): GKEnvironment {
  return ENV_MAP[env];
}

export const getEnvironment = (): Environment => {
  const env = import.meta.env.VITE_APP_ENV;

  // Default to local if not set
  if (!env) {
    return "local";
  }

  const normalized = env.toLowerCase();
  if (
    !["local", "development", "staging", "qa", "production"].includes(
      normalized,
    )
  ) {
    console.warn(
      `[Environment] Invalid VITE_APP_ENV: ${env}, defaulting to local`,
    );
    return "local";
  }

  return normalized as Environment;
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
  const gkEnv = toGameKitEnvironment(env);
  const analyticsEnabled = env !== "local" && env !== "development";

  return {
    url: getCdnHost(gkEnv),
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
  local: buildEnvConfig("local"),
  development: buildEnvConfig("development"),
  qa: buildEnvConfig("qa"),
  staging: buildEnvConfig("staging"),
  production: buildEnvConfig("production"),
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
  return getEnvironment() === "local";
};

/**
 * Check if running in production.
 */
export const isProduction = (): boolean => {
  return getEnvironment() === "production";
};
