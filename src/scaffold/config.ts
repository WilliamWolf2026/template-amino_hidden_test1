import type { EngineType } from './systems/assets';

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
  engine: 'pixi',
  debug: import.meta.env.DEV,

  // Uncomment and fill in for production:
  // sentry: {
  //   dsn: 'https://your-sentry-dsn',
  // },
  // posthog: {
  //   apiKey: 'your-posthog-key',
  //   apiHost: 'https://app.posthog.com',
  // },
};
