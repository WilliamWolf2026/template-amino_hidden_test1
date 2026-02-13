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
import { getEnvConfig, getEnvironment } from "~/scaffold";
import { getGameKit } from "~/scaffold/lib/gameKit";
import { GetAnalyticsServiceCommand, PostHog } from "@wolfgames/game-kit";
import { setPostHogInstance } from "~/scaffold/lib/posthog";
import { captureException, connectSentryToPostHog, isSentryEnabled } from "~/scaffold/lib/sentry";


// --- 1. STRICT TYPE DEFINITIONS ---

// The Mutable Context State
type CityLinesContext = {
  sessionStartTime: number;
  levelsCompleted: number;
  chaptersCompleted: number;
  storyLinksClicked: number;
  lastChapterCount: number;
  lastLevelOrder: number;
  lastChapterProgress: string;
  lastCountyTheme: string;
};

// Reusable ArkType Schemas
const locationSchema = type({
  chapter_count: "number",
  county_theme: "string",
  level_order: "number",
});

// We define the optional part separately to merge cleanly
const locationOptional = type({
  "chapter_progress?": "string",
});

const cutsceneSchema = type({
  cutscene_id: "string",
  cutscene_type:
    "'chapter_start' | 'post_level_clue' | 'chapter_end_story_reveal' | 'tutorial' | 'other'",
  seconds_viewed: "number",
});

// --- 2. SERVICE INITIALIZATION ---

const { uid, email, name } = getUserData();
const { key, platform, host, enabled } = getEnvConfig().posthog;

const { promise: analyticsServicePromise } = getGameKit().execute(
  new GetAnalyticsServiceCommand({
    enabled,
    userId: uid,
    userEmail: email,
    userName: name,
    platform,
    apiKey: key,
    apiHost: host,
    environment: getEnvironment(),
  })
);

// Initialize Service with Typed Context
const rawService = (await analyticsServicePromise).withContext<CityLinesContext>({
  sessionStartTime: Date.now(),
  levelsCompleted: 0,
  chaptersCompleted: 0,
  storyLinksClicked: 0,
  lastChapterCount: 0,
  lastLevelOrder: 0,
  lastChapterProgress: "0%",
  lastCountyTheme: "none",
});

// Register Parameter Sets (Builder Pattern)
const serviceWithBase = rawService.addParamsSet({
  base: type({
    game_name: "'city_lines'",
    session_elapsed: "number",
  }),
});

// Register 'level_ctx' so it is available for trackers
const serviceWithCtx = serviceWithBase.addParamsSet({
  level_ctx: locationSchema.and(locationOptional),
});

// Define Defaults logic
export const analyticsService = serviceWithCtx.addParamsDefault({
  base: (ctx) => ({
    game_name: "city_lines" as const,
    session_elapsed: parseFloat(
      ((Date.now() - ctx.sessionStartTime) / 1000).toFixed(2)
    ),
  }),
  level_ctx: (ctx) => ({
    chapter_count: ctx.lastChapterCount,
    county_theme: ctx.lastCountyTheme,
    level_order: ctx.lastLevelOrder,
    chapter_progress: ctx.lastChapterProgress,
  }),
});

// --- SURVEY ---

const SURVEY_COOLDOWN_KEY = `citylines_survey_cd_${uid ?? "anon"}`;
const SURVEY_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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

// --- 3. TRACKER IMPLEMENTATION ---

// -- Session --
export const trackSessionStart = analyticsService.createTracker(
  "session_start",
  type({ entry_screen: "string" }),
  ["base"],
  {
    base: (ctx) => {
      ctx.sessionStartTime = Date.now();
      return { game_name: "city_lines" as const, session_elapsed: 0 };
    },
  }
);

export const trackSessionPause = analyticsService.createTracker(
  "session_pause",
  type({ pause_reason: "'tab_hidden' | 'window_blur' | 'app_background'" }),
  ["base"],
  {}
);

export const trackSessionResume = analyticsService.createTracker(
  "session_resume",
  type({
    resume_reason: "'tab_visible' | 'window_focus' | 'app_foreground'",
    pause_duration: "number",
  }),
  ["base"],
  {}
);

export const trackSessionEnd = analyticsService.createTracker(
  "session_end",
  type({
    session_end_reason: "'user_close' | 'timeout' | 'navigation_away'",
    levels_completed_in_session: "number",
    chapters_completed_in_session: "number",
    story_links_clicked_in_session: "number",
    last_chapter_count: "number",
    last_level_order: "number",
    last_chapter_progress: "string",
    last_county_theme: "string",
  }),
  ["base"],
  {
    // Map internal context state to event properties
    base: (ctx) => ({
      game_name: "city_lines" as const,
      session_elapsed: parseFloat(
        ((Date.now() - ctx.sessionStartTime) / 1000).toFixed(2)
      ),
    }),
  }
);

// -- Level (Wrapper Pattern) --

// 1. Raw Tracker (Does not use level_ctx default, because it sets it)
const _trackLevelStart = analyticsService.createTracker(
  "level_start",
  locationSchema.and(locationOptional).and(
    type({
      level_difficulty: "'easy' | 'medium' | 'hard'",
      is_tutorial: "boolean",
      grid_size: "string",
      landmarks_count: "number",
      road_tiles_count: "number",
      min_path_length: "number",
      level_seed: "number",
      // We use string | object for complex configs to avoid 'any' but stay flexible
      "level_config?": "unknown",
    })
  ),
  ["base"],
  {}
);

// 2. Exported Wrapper
export const trackLevelStart = (
  params: typeof _trackLevelStart extends (p: infer P) => void ? P : never
) => {
  analyticsService.updateContext((prev) => ({
    ...prev,
    lastLevelOrder: params.level_order,
    lastChapterCount: params.chapter_count,
    lastCountyTheme: params.county_theme,
    lastChapterProgress: params.chapter_progress ?? prev.lastChapterProgress,
  }));
  _trackLevelStart(params);
};

export const trackLevelComplete = analyticsService.createTracker(
  "level_complete",
  type({
    moves_used: "number",
    optimal_moves: "number",
    time_spent: "number",
    "level_config?": "unknown",
  }),
  ["base", "level_ctx"],
  {
    base: (ctx) => {
      ctx.levelsCompleted++;
      return {
        game_name: "city_lines" as const,
        session_elapsed: parseFloat(
          ((Date.now() - ctx.sessionStartTime) / 1000).toFixed(2)
        ),
      };
    },
  }
);

export const trackLevelRestart = analyticsService.createTracker(
  "level_restart",
  type({ moves_before_restart: "number", "level_config?": "unknown" }),
  ["base", "level_ctx"],
  {}
);

export const trackLevelFail = analyticsService.createTracker(
  "level_fail",
  type({
    moves_used: "number",
    quit_reason: "'user_quit' | 'error' | 'timeout'",
    "level_config?": "unknown",
  }),
  ["base", "level_ctx"],
  {}
);

// -- Chapter (Wrapper Pattern) --

const _trackChapterStart = analyticsService.createTracker(
  "chapter_start",
  type({
    chapter_count: "number",
    county_theme: "string",
    is_tutorial: "boolean",
    chapter_size: "number",
    story_id: "string",
    story_headline: "string",
  }),
  ["base"],
  {}
);

export const trackChapterStart = (
  params: typeof _trackChapterStart extends (p: infer P) => void ? P : never
) => {
  analyticsService.updateContext((prev) => ({
    ...prev,
    lastChapterCount: params.chapter_count,
    lastCountyTheme: params.county_theme,
    lastLevelOrder: 0,
  }));
  _trackChapterStart(params);
};

const _trackChapterComplete = analyticsService.createTracker(
  "chapter_complete",
  type({
    chapter_size: "number",
    time_spent: "number",
    is_tutorial: "boolean",
  }),
  ["base", "level_ctx"],
  {
    base: (ctx) => {
      ctx.chaptersCompleted++;
      return {
        game_name: "city_lines" as const,
        session_elapsed: parseFloat(
          ((Date.now() - ctx.sessionStartTime) / 1000).toFixed(2)
        ),
      };
    },
  }
);

export const trackChapterComplete = (
  params: typeof _trackChapterComplete extends (p: infer P) => void ? P : never
) => {
  _trackChapterComplete(params);
  _hasCompletedChapter = true;
  triggerSurvey("chapter_complete");
};

export const trackChapterFail = analyticsService.createTracker(
  "chapter_fail",
  type({
    is_tutorial: "boolean",
    quit_reason: "'user_quit' | 'error' | 'timeout'",
  }),
  ["base", "level_ctx"],
  {}
);

// -- Game Start --

const _trackGameStart = analyticsService.createTracker(
  "game_start",
  type({
    start_source: "string",
    is_returning_player: "boolean",
    chapter_count: "number",
    county_theme: "string",
  }),
  ["base"],
  {}
);

export const trackGameStart = (
  params: typeof _trackGameStart extends (p: infer P) => void ? P : never
) => {
  analyticsService.updateContext((prev) => ({
    ...prev,
    lastChapterCount: params.chapter_count,
    lastCountyTheme: params.county_theme,
  }));
  _trackGameStart(params);
};

// -- Content Engagement --

export const trackCutsceneShow = analyticsService.createTracker(
  "cutscene_show",
  cutsceneSchema.and(type({ interaction_type: "'auto' | 'tap' | 'other'" })),
  ["base", "level_ctx"],
  {}
);

export const trackCutsceneSkip = analyticsService.createTracker(
  "cutscene_skip",
  cutsceneSchema.and(
    type({ interaction_type: "'skip_button' | 'tap' | 'other'" })
  ),
  ["base", "level_ctx"],
  {}
);

export const trackCutsceneComplete = analyticsService.createTracker(
  "cutscene_complete",
  cutsceneSchema.and(type({ interaction_type: "string" })),
  ["base", "level_ctx"],
  {}
);

export const trackCutsceneInteract = analyticsService.createTracker(
  "cutscene_interact",
  cutsceneSchema.and(type({ interaction_type: "string" })),
  ["base", "level_ctx"],
  {}
);

export const trackStoryLinkClick = analyticsService.createTracker(
  "story_link_click",
  type({ article_url: "string" }),
  ["base", "level_ctx"],
  {
    base: (ctx) => {
      ctx.storyLinksClicked++;
      return {
        game_name: "city_lines" as const,
        session_elapsed: parseFloat(
          ((Date.now() - ctx.sessionStartTime) / 1000).toFixed(2)
        ),
      };
    },
  }
);

// -- Advanced Metrics --

export const trackTileRotated = analyticsService.createTracker(
  "tile_rotated",
  type({
    tile_position: type({ x: "number", y: "number" }),
    rotation_direction: "'clockwise' | 'counter_clockwise'",
    total_rotations_in_level: "number",
  }),
  ["base", "level_ctx"],
  {}
);

export const trackLandmarkConnected = analyticsService.createTracker(
  "landmark_connected",
  type({
    landmark_id: "string",
    landmark_type: "'common' | 'county_specific' | 'other'",
    connection_order: "number",
    time_to_connect_seconds: "number",
    landmarks_remaining: "number",
  }),
  ["base", "level_ctx"],
  {}
);

export const trackAudioSettingChanged = analyticsService.createTracker(
  "audio_setting_changed",
  type({
    setting_type: "'volume' | 'mute'",
    old_value: "unknown",
    new_value: "unknown",
    screen_name: "string",
  }),
  ["base"],
  {}
);

// -- Sentry Bridge --
export const trackErrorCaptured = analyticsService.createTracker(
  "error_captured",
  type({ error_type: "string", user_id: "string", session_id: "string" }),
  [],
  {}
);

// --- 4. PROVIDER ---

// Define the shape of the Context Value
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
    }
    const sessionId = analyticsService.getSessionId();
    if (isSentryEnabled()) {
        connectSentryToPostHog(trackErrorCaptured, {
            userId: uid,
            email: email || undefined,
            sessionId: sessionId,
        });
        }

    // Handlers
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

    window.addEventListener("beforeunload", () => {
      // Manually retrieve context state for the final payload
      // We know the shape because we typed it on initialization
      const ctx = analyticsService["context"] as CityLinesContext;

      // Survey fallback: trigger if no chapter was completed this session
      if (!_hasCompletedChapter) {
        triggerSurvey("session_end_fallback");
      }

      trackSessionEnd({
        session_end_reason: "user_close",
        levels_completed_in_session: ctx.levelsCompleted,
        chapters_completed_in_session: ctx.chaptersCompleted,
        story_links_clicked_in_session: ctx.storyLinksClicked,
        last_chapter_count: ctx.lastChapterCount,
        last_level_order: ctx.lastLevelOrder,
        last_chapter_progress: ctx.lastChapterProgress,
        last_county_theme: ctx.lastCountyTheme,
      });
    });

    trackSessionStart({ entry_screen: "loading_gate" });
    console.log("[Analytics] City Lines initialized.");
  });

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
        trackChapterComplete,
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