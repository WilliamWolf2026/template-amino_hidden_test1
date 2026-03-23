import { useAnalytics, type AnalyticsCore } from '~/core/systems/analytics';

// ============================================================================
// GAME TRACKING HOOK
// ============================================================================

export interface GameTracking {
  /** Track game start from start screen */
  trackGameStart: () => void;
  /** Track audio setting change (settings menu) */
  trackAudioSettingChanged: () => void;
  /** Raw Core analytics for advanced use / passing to controllers */
  analytics: AnalyticsCore;
}

export function useGameTracking(): GameTracking {
  const analytics = useAnalytics();

  return {
    trackGameStart: () => {
      analytics.capture('game_start');
    },
    trackAudioSettingChanged: () => {
      analytics.capture('audio_setting_changed');
    },
    analytics,
  };
}
