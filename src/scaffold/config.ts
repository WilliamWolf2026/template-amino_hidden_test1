import type { EngineType } from "./systems/assets";

// Re-export environment config from config directory
export {
  type Environment,
  type EnvConfig,
  type PosthogConfig,
  getEnvironment,
  getEnvConfig,
  getCdnBaseUrl,
  getPosthogConfig,
  isLocal,
  isProduction,
  ENV_CONFIG,
} from "./config/environment";

export interface ScaffoldConfig {
  engine: EngineType;
  sentry?: {
    dsn: string;
  };
  posthog?: {
    apiKey: string;
    apiHost?: string;
  };
  debug: boolean;
}

export const scaffoldConfig: ScaffoldConfig = {
  engine: "pixi",
  debug: import.meta.env.DEV,

  // Uncomment and fill in for production:
  sentry: {
    dsn: "https://2dca8e7bdb35416abee59ca40bb0f887@o4509084313976832.ingest.us.sentry.io/4510839538384896",
  },
  // posthog: {
  //   apiKey: 'your-posthog-key',
  //   apiHost: 'https://app.posthog.com',
  // },
};
