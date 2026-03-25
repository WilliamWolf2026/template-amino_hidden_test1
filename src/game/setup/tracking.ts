import { useAnalyticsCore } from '@wolfgames/components/solid';
import type { AnalyticsCore } from '@wolfgames/components/core';

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
  const analytics = useAnalyticsCore();

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
