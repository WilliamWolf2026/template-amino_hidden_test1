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
  /** Analytics core for advanced use / passing to controllers */
  core: AnalyticsCore;
}

export function useGameTracking(): GameTracking {
  const core = useAnalyticsCore();

  return {
    trackGameStart: () => {
      core.capture('game_start');
    },
    trackAudioSettingChanged: () => {
      core.capture('audio_setting_changed');
    },
    core,
  };
}
