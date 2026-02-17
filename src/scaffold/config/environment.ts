/**
 * Environment configuration for different deployment targets.
 * Controls CDN URLs, API servers, and feature flags per environment.
 *
 * This is scaffold-level config - reusable across games.
 * Game-specific paths are configured separately.
 */

export type Environment =
  | "local"
  | "development"
  | "staging"
  | "qa"
  | "production";

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

const SHARED_CONFIG = {
  posthog: {
    enabled: true,
    key: "phc_RFhmtnQWjam4fNHYyn89lf0WVW6qF5bVYMwoXO8dSpR",
    host: "https://us.i.posthog.com",
    platform: "advance",
  },
};

/**
 * Base environment config (scaffold-level).
 * Games extend this with their specific paths.
 */
export const ENV_CONFIG: Record<Environment, EnvConfig> = {
  local: {
    url: "", // Empty = relative paths, games provide their own
    ...SHARED_CONFIG,
    posthog: { ...SHARED_CONFIG.posthog, enabled: false },
  },
  development: {
    url: "https://media.dev.wolf.games",
    ...SHARED_CONFIG,
    posthog: { ...SHARED_CONFIG.posthog, enabled: false },
  },
  qa: {
    url: "https://media.qa.wolf.games",
    ...SHARED_CONFIG,
  },
  staging: {
    url: "https://media.staging.wolf.games",
    ...SHARED_CONFIG,
  },
  production: {
    url: "https://media.wolf.games",
    ...SHARED_CONFIG,
  },
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
