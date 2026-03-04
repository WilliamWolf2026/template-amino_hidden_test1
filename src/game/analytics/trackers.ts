/**
 * City Lines Game-Specific Trackers
 * 
 * All trackers unique to City Lines gameplay:
 * - Level progression (start, complete, restart, fail)
 * - Chapter progression (start, complete, fail)
 * - Content engagement (cutscenes, story links)
 * - Game mechanics (tile rotation, landmark connections)
 * 
 * Events use param sets to auto-fill common properties:
 * - base: game_name, session_elapsed
 * - level_ctx: chapter_id, chapter_count, county_theme, level_order, chapter_progress
 * - level_config: level_id, level_difficulty, is_tutorial, level_seed
 */

import { type } from "arktype";
import {
  analyticsService,
  CityLinesContext,
  cutsceneSchema,
} from "./index";
import { getSessionElapsed } from "~/core/lib/analytics";
import { GAME_ID } from "~/game/config/identity";

// ============================================================================
// TYPING HELPER
// ============================================================================

/**
 * Helper type to extract tracker parameters from a createTracker call.
 * Useful for creating wrapper functions.
 */
export type TrackerParams<T> = T extends (p: infer P) => void ? P : never;

// ============================================================================
// LEVEL TRACKERS
// ============================================================================

/**
 * Fired when a level becomes interactive.
 * Uses level_ctx and level_config param sets for location and level metadata.
 */
const _trackLevelStart = analyticsService.createTracker(
  "level_start",
  type({
    // Level configuration (in addition to level_config param set)
    grid_size: "number",          // Changed from string to number per spec
    landmarks_count: "number",
    road_tiles_count: "number",
    min_path_length: "number",
    "level_config?": "unknown",
  }),
  ["base", "level_ctx", "level_config"],  // Uses all three param sets
  {}
);

export const trackLevelStart = (params: TrackerParams<typeof _trackLevelStart> & {
  // Additional context update properties
  chapter_id: string;
  chapter_count: number;
  county_theme: string;
  level_order: number;
  chapter_progress?: string;
  level_id: string;
  level_difficulty: "easy" | "medium" | "hard";
  is_tutorial: boolean;
  level_seed: number;
}) => {
  // Update all context values at once
  analyticsService.updateContext((prev) => ({
    ...prev,
    // Location context
    lastChapterId: params.chapter_id,
    lastChapterCount: params.chapter_count,
    lastCountyTheme: params.county_theme,
    lastLevelOrder: params.level_order,
    lastChapterProgress: params.chapter_progress ?? prev.lastChapterProgress,
    // Level config context
    lastLevelId: params.level_id,
    lastLevelDifficulty: params.level_difficulty,
    lastIsTutorial: params.is_tutorial,
    lastLevelSeed: params.level_seed,
  }));
  _trackLevelStart(params);
};

/**
 * Fired when the player completes a level.
 * Uses level_ctx and level_config param sets.
 */
export const trackLevelComplete = analyticsService.createTracker(
  "level_complete",
  type({
    moves_used: "number",
    optimal_moves: "number",
    time_spent: "number",
    total_rotations: "number",
    "eraser_used?": "boolean",
    "level_config?": "unknown",
  }),
  ["base", "level_ctx", "level_config"],
  {
    base: (ctx: CityLinesContext) => {
      ctx.levelsCompleted++;
      return {
        game_name: GAME_ID as const,
        session_elapsed: getSessionElapsed(),
      };
    },
  }
);

/**
 * Fired when the player restarts a level.
 * Uses level_ctx and level_config param sets.
 */
export const trackLevelRestart = analyticsService.createTracker(
  "level_restart",
  type({
    moves_before_restart: "number",
    "level_config?": "unknown",
  }),
  ["base", "level_ctx", "level_config"],  // Now includes level_id, level_difficulty, etc.
  {}
);

/**
 * Fired when the level ends without completion.
 * Uses level_ctx and level_config param sets.
 */
export const trackLevelFail = analyticsService.createTracker(
  "level_fail",
  type({
    moves_used: "number",
    quit_reason: "'user_quit' | 'error' | 'timeout'",
    "level_config?": "unknown",
  }),
  ["base", "level_ctx", "level_config"],  // Now includes level_id, level_difficulty, etc.
  {}
);

// ============================================================================
// CHAPTER TRACKERS
// ============================================================================

/**
 * Fired when a new chapter begins.
 */
const _trackChapterStart = analyticsService.createTracker(
  "chapter_start",
  type({
    chapter_id: "string",
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

export const trackChapterStart = (params: TrackerParams<typeof _trackChapterStart>) => {
  analyticsService.updateContext((prev) => ({
    ...prev,
    lastChapterId: params.chapter_id,
    lastChapterCount: params.chapter_count,
    lastCountyTheme: params.county_theme,
    lastLevelOrder: 0,
    lastIsTutorial: params.is_tutorial,
  }));
  _trackChapterStart(params);
};

/**
 * Fired when the chapter is completed.
 */
const _trackChapterComplete = analyticsService.createTracker(
  "chapter_complete",
  type({
    chapter_id: "string",
    time_spent: "number",
    is_tutorial: "boolean",
  }),
  ["base", "level_ctx"],
  {
    base: (ctx: CityLinesContext) => {
      ctx.chaptersCompleted++;
      return {
        game_name: GAME_ID as const,
        session_elapsed: getSessionElapsed(),
      };
    },
  }
);

export const trackChapterComplete = (params: TrackerParams<typeof _trackChapterComplete>) => {
  _trackChapterComplete(params);
};

/**
 * Fired when a chapter ends without completion.
 */
export const trackChapterFail = analyticsService.createTracker(
  "chapter_fail",
  type({
    chapter_id: "string",
    is_tutorial: "boolean",
    quit_reason: "'user_quit' | 'error' | 'timeout'",
  }),
  ["base", "level_ctx"],
  {}
);

// ============================================================================
// CONTENT ENGAGEMENT TRACKERS
// ============================================================================

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
  type({
    chapter_id: "string",
    chapter_count: "number",
    article_url: "string",
  }),
  ["base", "level_ctx"],
  {
    base: (ctx: CityLinesContext) => {
      ctx.storyLinksClicked++;
      return {
        game_name: GAME_ID as const,
        session_elapsed: getSessionElapsed(),
      };
    },
  }
);

// ============================================================================
// GAME MECHANIC TRACKERS
// ============================================================================

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
