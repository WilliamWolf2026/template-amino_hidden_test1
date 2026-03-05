/**
 * Analytics Context Provider (Skeleton)
 *
 * Provides analytics tracking via Solid.js context.
 * Wire up your game-specific trackers here.
 *
 * See archive/games/analytics/ for the CityLines implementation as reference.
 */

import {
  createContext,
  useContext,
  createSignal,
  type Accessor,
  type JSX,
} from 'solid-js';
import { type PostHog } from '~/core/lib/analytics';

// ============================================================================
// CONTEXT
// ============================================================================

type AnalyticsContextValue = {
  /** PostHog instance (null until initialized) */
  posthog: Accessor<PostHog | null>;
  /** Track game start from start screen */
  trackGameStart: () => void;
  /** Track audio setting change (settings menu) */
  trackAudioSettingChanged: () => void;
};

const AnalyticsContext = createContext<AnalyticsContextValue>();

export function AnalyticsProvider(props: { children: JSX.Element }) {
  const [posthog] = createSignal<PostHog | null>(null);

  const value: AnalyticsContextValue = {
    posthog,
    trackGameStart: () => {
      // TODO: Wire up PostHog / analytics service
      console.log('[analytics] game_start');
    },
    trackAudioSettingChanged: () => {
      console.log('[analytics] audio_setting_changed');
    },
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {props.children}
    </AnalyticsContext.Provider>
  );
}

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return context;
};
