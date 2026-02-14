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
  createSignal,
  Accessor,
} from "solid-js";
import { type } from "arktype";
import { getUserData } from "./helper";
import { getEnvironment } from "~/scaffold";
import {
  getSessionElapsed,
  resetSessionTimer,
  cachePostHogInstance,
  type PostHog,
} from "~/scaffold/lib/analytics";
import {
  sessionStartSchema,
  sessionPauseSchema,
  sessionResumeSchema,
  audioSettingChangedSchema,
  errorCapturedSchema,
} from "~/scaffold/analytics/events";
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
  trackTileRotated,
  trackLandmarkConnected,
} from "~/game/analytics/trackers";
import { setPostHogInstance } from "~/scaffold/lib/posthog";
import {
  connectSentryToPostHog,
  isSentryEnabled,
} from "~/scaffold/lib/sentry";

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
      return { game_name: "city_lines" as const, session_elapsed: 0 };
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
    levels_completed_in_session: "number",
    chapters_completed_in_session: "number",
    story_links_clicked_in_session: "number",
    last_chapter_id: "string",
    last_chapter_count: "number",
    last_level_order: "number",
    last_chapter_progress: "string",
    last_county_theme: "string",
  }),
  ["base"],
  {
    base: (ctx: CityLinesContext) => ({
      game_name: "city_lines" as const,
      session_elapsed: getSessionElapsed(),
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
const SURVEY_COOLDOWN_KEY = `citylines_survey_cd_${uid ?? "anon"}`;
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
    game_name: "city_lines",
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
  trackTileRotated: typeof trackTileRotated;
  trackLandmarkConnected: typeof trackLandmarkConnected;
  trackAudioSettingChanged: typeof trackAudioSettingChanged;
};

const AnalyticsContext = createContext<AnalyticsContextValue>();

export function AnalyticsProvider(props: { children: JSX.Element }) {
  const [ph, setPh] = createSignal<PostHog | null>(null);

  onMount(async () => {
    analyticsService.init();
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
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        _pauseStartTime = Date.now();
        trackSessionPause({ pause_reason: "tab_hidden" });
      } else {
        const duration = _pauseStartTime > 0
          ? parseFloat(((Date.now() - _pauseStartTime) / 1000).toFixed(2))
          : 0;
        trackSessionResume({ resume_reason: "tab_visible", pause_duration: duration });
      }
    });

    // Session end handler
    window.addEventListener("beforeunload", () => {
      const ctx = analyticsService["context"] as CityLinesContext;

      if (!_hasCompletedChapter) {
        triggerSurvey("session_end_fallback");
      }

      trackSessionEnd({
        session_end_reason: "user_close",
        levels_completed_in_session: ctx.levelsCompleted,
        chapters_completed_in_session: ctx.chaptersCompleted,
        story_links_clicked_in_session: ctx.storyLinksClicked,
        last_chapter_id: ctx.lastChapterId,
        last_chapter_count: ctx.lastChapterCount,
        last_level_order: ctx.lastLevelOrder,
        last_chapter_progress: ctx.lastChapterProgress,
        last_county_theme: ctx.lastCountyTheme,
      });
    });

    trackSessionStart({ entry_screen: "loading_gate" });
    console.log("[Analytics] City Lines initialized.");
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
        trackTileRotated,
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
