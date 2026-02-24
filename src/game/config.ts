import { lazy, type Component } from 'solid-js';
import type { ViewportMode } from '~/scaffold/systems/tuning/types';
import { LoadingScreen } from './screens/LoadingScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { getServerStorageUrl } from './config/environment';

// Re-export environment config from config directory
export {
  type Environment,
  getEnvironment,
  isLocal,
  isProduction,
  getLocalAssetPath,
  getCdnUrl,
  getLevelsUrl,
  resolveLevelUrl,
  getServerStorageUrl,
  getGamesIndexUrl,
} from './config/environment';

export interface GameConfig {
  screens: {
    loading: Component;
    start: Component;
    game: Component;
    results: Component;
  };
  initialScreen: 'loading' | 'start' | 'game' | 'results';
  /** URL to fetch manifest from server (null for local static manifest) */
  serverStorageUrl: string | null;
  /** Default viewport mode for desktop preview. Overridden by tuning panel, URL param, or toggle. */
  defaultViewportMode?: ViewportMode;
}

export const gameConfig: GameConfig = {
  screens: {
    loading: LoadingScreen,
    start: lazy(() => import('./screens/StartScreen')),
    game: lazy(() => import('./screens/GameScreen')),
    results: ResultsScreen,
  },
  initialScreen: 'loading',
  defaultViewportMode: 'small',
  // Old: serverStorageUrl: null, // no server storage, uses static manifest only
  // Now resolved per environment (local emulator, QA GCS bucket, etc.)
  serverStorageUrl: getServerStorageUrl(),
};
