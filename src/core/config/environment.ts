/**
 * Environment configuration for different deployment targets.
 * Controls CDN URLs, API servers, and feature flags per environment.
 *
 * Environment detection is Vite-specific (import.meta.env).
 * URL resolution is delegated to @wolfgames/game-kit factories.
 */

/**
 * Environment configuration for different deployment targets.
 * Controls CDN URLs, API servers, and feature flags per environment.
 *
 * Environment detection is Vite-specific (import.meta.env).
 */

import {
  Environment,
  parseEnvironment,
} from '@wolfgames/game-kit';

export { Environment };

const CDN_HOST_MAP: Record<Environment, string> = {
  [Environment.Production]: "https://media.wolf.games",
  [Environment.Staging]: "https://media.staging.wolf.games",
  [Environment.QA]: "https://media.qa.wolf.games",
  [Environment.Development]: "https://media.dev.wolf.games",
  [Environment.Local]: "",
};

export const getEnvironment = (): Environment => {
  return parseEnvironment(import.meta.env.VITE_GAME_KIT_ENV);
};

export const getCdnHost = (env: Environment): string => {
  return CDN_HOST_MAP[env] || "";
};

export const buildCdnUrl = (env: Environment, gamePath: string): string => {
  const host = getCdnHost(env);
  if (!host) return gamePath;
  return `${host}/${gamePath}`;
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
  /** Posthog analytics configuration */
  posthog: PosthogConfig;
}

const SHARED_POSTHOG = {
  key: import.meta.env.VITE_POSTHOG_API_KEY ?? "",
  host: "https://us.i.posthog.com",
  platform: "advance",
};

export const getEnvConfig = (): EnvConfig => {
  const env = getEnvironment();
  const analyticsEnabled = env !== Environment.Local && env !== Environment.Development;

  return {
    url: getCdnHost(env),
    posthog: {
      ...SHARED_POSTHOG,
      enabled: analyticsEnabled,
    },
  };
};

export const getCdnBaseUrl = (): string => {
  return getEnvConfig().url;
};

export const getPosthogConfig = (): PosthogConfig => {
  return getEnvConfig().posthog;
};

export const isLocal = (): boolean => {
  return getEnvironment() === Environment.Local;
};

export const isProduction = (): boolean => {
  return getEnvironment() === Environment.Production;
};
