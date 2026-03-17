/**
 * Feature Flag Context Provider (Skeleton)
 *
 * Provides feature flags via Solid.js context.
 * Wire up PostHog feature flags when your game needs A/B testing.
 *
 * See archive/games/ for a full PostHog implementation as reference.
 */

import {
  createContext,
  useContext,
  type JSX,
} from 'solid-js';
import { createStore } from 'solid-js/store';

// ============================================================================
// Define your game's feature flags here
// ============================================================================

export interface FeatureFlags {
  // Example: enable_tutorial: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  // Example: enable_tutorial: true,
};

// ============================================================================
// Context
// ============================================================================

type FeatureFlagContextState = {
  flags: FeatureFlags;
  isReady: boolean;
};

const FeatureFlagContext = createContext<FeatureFlagContextState>();

export function FeatureFlagProvider(props: { children: JSX.Element }) {
  const [state] = createStore<FeatureFlagContextState>({
    flags: DEFAULT_FLAGS,
    isReady: true,
  });

  return (
    <FeatureFlagContext.Provider value={state}>
      {props.children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}
