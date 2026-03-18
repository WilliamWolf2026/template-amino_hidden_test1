import { registerAnalyticsIdentity } from '~/core/systems/analytics';
import { useAnalytics, type AnalyticsState } from '~/core/systems/analytics';
import { getUserData } from './helper';

// ============================================================================
// REGISTRATION (runs at module load)
// ============================================================================

const { uid, email, name } = getUserData();

registerAnalyticsIdentity({ userId: uid, email, name });

// ============================================================================
// GAME TRACKING HOOK
// ============================================================================

export interface GameTracking {
  /** Track game start from start screen */
  trackGameStart: () => void;
  /** Track audio setting change (settings menu) */
  trackAudioSettingChanged: () => void;
  /** Raw Core analytics for advanced use / passing to controllers */
  analytics: AnalyticsState;
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
