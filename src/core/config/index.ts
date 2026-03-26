export {
  Environment,
  type EnvConfig,
  type PosthogConfig,
  getEnvironment,
  getEnvConfig,
  getCdnBaseUrl,
  getCdnHost,
  buildCdnUrl,
  getPosthogConfig,
  isLocal,
  isProduction,
} from './environment';

export { getViewportModeFromUrl } from './viewport';
