/**
 * City Lines Game-Specific Analytics
 * 
 * This module contains all City Lines-specific event schemas, trackers,
 * and the analytics service initialization.
 * 
 * Shared infrastructure (session management, base params) is imported from scaffold.
 */

import { type } from "arktype";
import { getEnvConfig, getEnvironment } from "~/scaffold";
import { getGameKit } from "~/scaffold/lib/gameKit";
import {
  GetAnalyticsServiceCommand,
  getSessionElapsed,
  type PostHog,
} from "~/scaffold/lib/analytics";
import { baseParamsSet } from "~/scaffold/analytics/events";
import { getUserData } from "~/game/setup/helper";
import { GAME_ID } from "~/game/config/identity";

// ============================================================================
// GAME-SPECIFIC CONTEXT TYPE
// ============================================================================

/**
 * Extended context for City Lines analytics.
 * Games can extend this with their own state that needs to be tracked.
 */
export interface CityLinesContext {
  sessionStartTime: number;
  levelsCompleted: number;
  chaptersCompleted: number;
  storyLinksClicked: number;
  // Current level/chapter location
  lastChapterId: string;
  lastChapterCount: number;
  lastLevelId: string;
  lastLevelOrder: number;
  lastChapterProgress: string;
  lastCountyTheme: string;
  // Current level configuration
  lastLevelDifficulty: "easy" | "medium" | "hard";
  lastIsTutorial: boolean;
  lastLevelSeed: number;
}

// ============================================================================
// GAME-SPECIFIC PARAMETER SET SCHEMAS
// ============================================================================

/**
 * Location context for level/chapter-related events.
 * Tracks where in the game structure the player is.
 * Maps to: chapter_id (as chapter_count), county_theme, level_order, chapter_progress
 */
export const locationSchema = type({
  chapter_id: "string",        // chapter identifier
  chapter_count: "number",     // chapter number/index
  county_theme: "string",
  level_order: "number",
});

export const locationOptionalSchema = type({
  "chapter_progress?": "string",
});

/**
 * Level configuration context.
 * Tracks the current level's configuration properties.
 * Used by all level-related events to auto-fill level metadata.
 */
export const levelConfigSchema = type({
  level_id: "string",
  level_difficulty: "'easy' | 'medium' | 'hard'",
  is_tutorial: "boolean",
  level_seed: "number",
});

/**
 * Schema for cutscene-related events.
 */
export const cutsceneSchema = type({
  cutscene_id: "string",
  cutscene_type:
    "'chapter_start' | 'post_level_clue' | 'chapter_end_story_reveal' | 'tutorial' | 'other'",
  seconds_viewed: "number",
});

// ============================================================================
// SERVICE INITIALIZATION
// ============================================================================

const { key, platform, host, enabled } = getEnvConfig().posthog;
const { uid, email, name } = getUserData();

/**
 * Promise that resolves to the configured AnalyticsService for City Lines.
 * This is awaited at the module level to make track exports synchronous.
 */
export const analyticsServicePromise = getGameKit().execute(
  new GetAnalyticsServiceCommand({
    enabled,
    userId: uid ?? '',
    userEmail: email ?? '',
    userName: name ?? '',
    platform,
    apiKey: key,
    apiHost: host,
    environment: getEnvironment(),
  })
).promise;

// Initialize Service with Typed Context using method chaining
export const analyticsService = (await analyticsServicePromise)
  .withContext<CityLinesContext>({
    sessionStartTime: Date.now(),
    levelsCompleted: 0,
    chaptersCompleted: 0,
    storyLinksClicked: 0,
    // Location context
    lastChapterId: "",
    lastChapterCount: 0,
    lastLevelId: "",
    lastLevelOrder: 0,
    lastChapterProgress: "0%",
    lastCountyTheme: "none",
    // Level config context
    lastLevelDifficulty: "easy",
    lastIsTutorial: false,
    lastLevelSeed: 0,
  })
  .addParamsSet({
    base: baseParamsSet,
  })
  .addParamsSet({
    level_ctx: locationSchema.and(locationOptionalSchema),
  })
  .addParamsSet({
    level_config: levelConfigSchema,
  })
  .addParamsDefault({
    base: (ctx: CityLinesContext) => ({
      game_name: GAME_ID as const,
      session_elapsed: getSessionElapsed(),
    }),
    level_ctx: (ctx) => ({
      chapter_id: ctx.lastChapterId,
      chapter_count: ctx.lastChapterCount,
      county_theme: ctx.lastCountyTheme,
      level_order: ctx.lastLevelOrder,
      chapter_progress: ctx.lastChapterProgress,
    }),
    level_config: (ctx) => ({
      level_id: ctx.lastLevelId,
      level_difficulty: ctx.lastLevelDifficulty,
      is_tutorial: ctx.lastIsTutorial,
      level_seed: ctx.lastLevelSeed,
    }),
  });

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

export type { PostHog } from "@wolfgames/game-kit";
export { type } from "arktype";
