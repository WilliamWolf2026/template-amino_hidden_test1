import type { Component } from 'solid-js';
import { LoadingScreen } from './screens/LoadingScreen';
import { StartScreen } from './screens/StartScreen';
import { GameScreen } from './screens/GameScreen';
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
}

export const gameConfig: GameConfig = {
  screens: {
    loading: LoadingScreen,
    start: StartScreen,
    game: GameScreen,
    results: ResultsScreen,
  },
  initialScreen: 'loading',
  // Set to null for local development (uses static manifest)
  // Set to server URL for remote manifest fetching
  serverStorageUrl: null,
};
