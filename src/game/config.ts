import type { Component } from 'solid-js';
import { LoadingScreen } from './screens/LoadingScreen';
import { StartScreen } from './screens/StartScreen';
import { GameScreen } from './screens/GameScreen';
import { ResultsScreen } from './screens/ResultsScreen';

/**
 * Environment configuration for asset URLs.
 * In production, these would come from environment variables.
 */
const ENV = {
  // CDN base URL for assets (atlas, audio, vfx)
  CDN_URL: '/assets/assets/v1',
  // Levels/manifests URL
  LEVELS_URL: '/assets/levels',
};

/**
 * Get the CDN base URL for assets.
 */
export function getCdnUrl(): string {
  return ENV.CDN_URL;
}

/**
 * Get the levels/manifests URL.
 */
export function getLevelsUrl(): string {
  return ENV.LEVELS_URL;
}

/**
 * Resolve a level URL from a param value.
 * - Full URLs (http/https) pass through
 * - Absolute paths (/assets/...) pass through
 * - Short names resolve to levels directory
 */
export function resolveLevelUrl(param: string): string {
  // Full URL - pass through
  if (param.startsWith('http://') || param.startsWith('https://')) {
    return param;
  }
  // Absolute path - pass through
  if (param.startsWith('/')) {
    return param;
  }
  // Short name - resolve to levels directory
  // Add .json extension if not present
  const filename = param.endsWith('.json') ? param : `${param}.json`;
  return `${getLevelsUrl()}/${filename}`;
}

export interface GameConfig {
  screens: {
    loading: Component;
    start: Component;
    game: Component;
    results: Component;
  };
  initialScreen: 'loading' | 'start' | 'game' | 'results';
}

export const gameConfig: GameConfig = {
  screens: {
    loading: LoadingScreen,
    start: StartScreen,
    game: GameScreen,
    results: ResultsScreen,
  },
  initialScreen: 'loading',
};
