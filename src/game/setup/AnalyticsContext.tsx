/**
 * Analytics Context Provider
 * 
 * This module combines:
 * - Shared scaffold analytics infrastructure (session management, base schemas)
 * - Game-specific City Lines analytics (levels, chapters, mechanics)
 * 
 * Games should create their own version of this file using their specific trackers.
 */

import {
  createContext,
  useContext,
  JSX,
  onMount,
  onCleanup,
  createSignal,
  Accessor,
} from "solid-js";
import { type } from "arktype";
import { getUserData } from "./helper";
import { getEnvironment } from "~/core/config";
import { GAME_ID, GAME_STORAGE_PREFIX } from "~/game/config/identity";
import {
  getSessionElapsed,
  resetSessionTimer,
  cachePostHogInstance,
  type PostHog,
} from "~/core/lib/analytics";
import {
  sessionStartSchema,
  sessionPauseSchema,
  sessionResumeSchema,
  audioSettingChangedSchema,
  errorCapturedSchema,
} from "~/core/analytics/events";
import {
  analyticsService,
  CityLinesContext,
} from "~/game/analytics";
import {
  trackLevelStart,
  trackLevelComplete,
  trackLevelRestart,
  trackLevelFail,
  trackChapterStart,
  trackChapterComplete,
  trackChapterFail,
  trackCutsceneShow,
  trackCutsceneSkip,
  trackCutsceneComplete,
  trackCutsceneInteract,
  trackStoryLinkClick,
  trackLandmarkConnected,
} from "~/game/analytics/trackers";
import { setPostHogInstance } from "~/core/lib/posthog";
import {
  connectSentryToPostHog,
  isSentryEnabled,
} from "~/core/lib/sentry";

// ============================================================================
// SHARED SESSION TRACKERS
// ============================================================================

const trackSessionStart = analyticsService.createTracker(
  "session_start",
  sessionStartSchema,
  ["base"],
  {
    base: (ctx: CityLinesContext) => {
      ctx.sessionStartTime = Date.now();
      resetSessionTimer();
      return { game_name: GAME_ID as const, session_elapsed: 0 };
    },
  }
);

const trackSessionPause = analyticsService.createTracker(
  "session_pause",
  sessionPauseSchema,
  ["base"],
  {}
);

const trackSessionResume = analyticsService.createTracker(
  "session_resume",
  sessionResumeSchema,
  ["base"],
  {}
);

const trackSessionEnd = analyticsService.createTracker(
  "session_end",
  type({
    session_end_reason: "'user_close' | 'timeout' | 'navigation_away'",
  }),
  ["base", "level_ctx"],
  {
    base: (ctx: CityLinesContext) => ({
      game_name: GAME_ID as const,
      session_elapsed: getSessionElapsed(),
      levels_completed_in_session: ctx.levelsCompleted,
      chapters_completed_in_session: ctx.chaptersCompleted,
      story_links_clicked_in_session: ctx.storyLinksClicked,
    }),
    level_ctx: (ctx: CityLinesContext) => ({
      chapter_id: ctx.lastChapterId,
      chapter_count: ctx.lastChapterCount,
      county_theme: ctx.lastCountyTheme,
      level_order: ctx.lastLevelOrder,
      chapter_progress: ctx.lastChapterProgress,
    }),
  }
);

// ============================================================================
// GAME-SPECIFIC TRACKERS
// ============================================================================

const _trackGameStart = analyticsService.createTracker(
  "game_start",
  type({
    start_source: "string",
    is_returning_player: "boolean",
    chapter_id: "string",
    chapter_count: "number",
    county_theme: "string",
  }),
  ["base"],
  {}
);

const trackGameStart = (params: Parameters<typeof _trackGameStart>[0]) => {
  analyticsService.updateContext((prev) => ({
    ...prev,
    lastChapterId: params.chapter_id,
    lastChapterCount: params.chapter_count,
    lastCountyTheme: params.county_theme,
  }));
  _trackGameStart(params);
};

const trackAudioSettingChanged = analyticsService.createTracker(
  "audio_setting_changed",
  audioSettingChangedSchema,
  ["base"],
  {}
);

const trackErrorCaptured = analyticsService.createTracker(
  "error_captured",
  errorCapturedSchema,
  [],
  {}
);

// ============================================================================
// SURVEY LOGIC
// ============================================================================

const { uid, email } = getUserData();
const SURVEY_COOLDOWN_KEY = `${GAME_STORAGE_PREFIX}survey_cd_${uid ?? "anon"}`;
const SURVEY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

let _phRef: PostHog | null = null;
let _pauseStartTime = 0;
let _hasCompletedChapter = false;

function canShowSurvey(): boolean {
  try {
    const last = localStorage.getItem(SURVEY_COOLDOWN_KEY);
    if (last && Date.now() - parseInt(last, 10) < SURVEY_COOLDOWN_MS) return false;
  } catch { /* noop */ }
  return true;
}

function markSurveyShown() {
  try {
    localStorage.setItem(SURVEY_COOLDOWN_KEY, String(Date.now()));
  } catch { /* noop */ }
}

function triggerSurvey(trigger: string) {
  if (!_phRef || !canShowSurvey()) return;
  _phRef.capture("survey_eligible", {
    game_name: GAME_ID,
    trigger,
  });
  markSurveyShown();
}

// ============================================================================
// PROVIDER
// ============================================================================

type AnalyticsContextValue = {
  posthog: Accessor<PostHog | null>;
  trackSessionStart: typeof trackSessionStart;
  trackSessionPause: typeof trackSessionPause;
  trackSessionResume: typeof trackSessionResume;
  trackSessionEnd: typeof trackSessionEnd;
  trackGameStart: typeof trackGameStart;
  trackLevelStart: typeof trackLevelStart;
  trackLevelComplete: typeof trackLevelComplete;
  trackLevelRestart: typeof trackLevelRestart;
  trackLevelFail: typeof trackLevelFail;
  trackChapterStart: typeof trackChapterStart;
  trackChapterComplete: typeof trackChapterComplete;
  trackChapterFail: typeof trackChapterFail;
  trackCutsceneShow: typeof trackCutsceneShow;
  trackCutsceneSkip: typeof trackCutsceneSkip;
  trackCutsceneComplete: typeof trackCutsceneComplete;
  trackCutsceneInteract: typeof trackCutsceneInteract;
  trackStoryLinkClick: typeof trackStoryLinkClick;
  trackLandmarkConnected: typeof trackLandmarkConnected;
  trackAudioSettingChanged: typeof trackAudioSettingChanged;
};

const AnalyticsContext = createContext<AnalyticsContextValue>();

export function AnalyticsProvider(props: { children: JSX.Element }) {
  const [ph, setPh] = createSignal<PostHog | null>(null);

  onMount(async () => {
    // Only init if PostHog hasn't been loaded yet (prevents double-init warning)
    if (!analyticsService.getPosthog()) {
      analyticsService.init();
    }

    // Always hydrate local state from the (possibly pre-existing) service
    const instance = analyticsService.getPosthog();
    setPh(instance);
    if (instance) {
      setPostHogInstance(instance);
      _phRef = instance;
      cachePostHogInstance(instance);
    }
    const sessionId = analyticsService.getSessionId();
    if (isSentryEnabled()) {
      connectSentryToPostHog(trackErrorCaptured, {
        userId: uid,
        email: email || undefined,
        sessionId: sessionId,
      });
    }

    // Session pause/resume handlers
    const handleVisibilityChange = () => {
      if (document.hidden) {
        _pauseStartTime = Date.now();
        trackSessionPause({ pause_reason: "tab_hidden" });
      } else {
        const now = Date.now();
        const duration = (_pauseStartTime > 0)
          ? parseFloat(((now - _pauseStartTime) / 1000).toFixed(2))
          : 0;
        _pauseStartTime = 0;
        trackSessionResume({ resume_reason: "tab_visible", pause_duration: duration });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Session end handler
    // NOTE: 'pagehide' is more reliable than 'beforeunload' on mobile browsers
    const handlePageHide = () => {
      if (!_hasCompletedChapter) {
        triggerSurvey("session_end_fallback");
      }
      // Rollup counters and last-position data come from CityLinesContext via param set defaults
      trackSessionEnd({ session_end_reason: "user_close" });
    };
    window.addEventListener("pagehide", handlePageHide);

    // Cleanup event listeners on unmount
    onCleanup(() => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    });

    trackSessionStart({ entry_screen: "start" });
  });

  // Wrap trackChapterComplete to trigger survey
  const wrappedTrackChapterComplete = (params: Parameters<typeof trackChapterComplete>[0]) => {
    trackChapterComplete(params);
    _hasCompletedChapter = true;
    triggerSurvey("chapter_complete");
  };

  return (
    <AnalyticsContext.Provider
      value={{
        posthog: ph,
        trackSessionStart,
        trackSessionPause,
        trackSessionResume,
        trackSessionEnd,
        trackGameStart,
        trackLevelStart,
        trackLevelComplete,
        trackLevelRestart,
        trackLevelFail,
        trackChapterStart,
        trackChapterComplete: wrappedTrackChapterComplete,
        trackChapterFail,
        trackCutsceneShow,
        trackCutsceneSkip,
        trackCutsceneComplete,
        trackCutsceneInteract,
        trackStoryLinkClick,
        trackLandmarkConnected,
        trackAudioSettingChanged,
      }}
    >
      {props.children}
    </AnalyticsContext.Provider>
  );
}

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context)
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  return context;
};

// Re-export for direct imports
export { analyticsService } from "~/game/analytics";
export type { CityLinesContext } from "~/game/analytics";
