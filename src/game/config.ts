import { lazy, type Component } from 'solid-js';
import type { ViewportMode } from '~/scaffold/systems/tuning/types';
import { LoadingScreen } from './screens/LoadingScreen';
import { ResultsScreen } from './screens/ResultsScreen';

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
  // Set to null for local development (uses static manifest)
  // Set to server URL for remote manifest fetching
  serverStorageUrl: null,
};
