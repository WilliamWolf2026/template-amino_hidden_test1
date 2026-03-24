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
  toGameKitEnvironment,
  ENV_CONFIG,
} from './environment';

export { getViewportModeFromUrl } from './viewport';
