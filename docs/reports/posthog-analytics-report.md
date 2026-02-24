# PostHog Analytics — Full Technical Report

Complete reference for how PostHog analytics works in City Lines, covering initialization, the event system, every tracked event, feature flags, surveys, and error tracking.

**Branch:** `ENG-1447-implement-posthog`
**Date:** 2026-02-16

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Initialization Flow](#2-initialization-flow)
3. [The Analytics Service](#3-the-analytics-service)
4. [Parameter Sets & Defaults](#4-parameter-sets--defaults)
5. [Context Management](#5-context-management)
6. [Complete Event Reference](#6-complete-event-reference)
7. [Feature Flags](#7-feature-flags)
8. [Survey Integration](#8-survey-integration)
9. [Sentry ↔ PostHog Bridge](#9-sentry--posthog-bridge)
10. [Environment Configuration](#10-environment-configuration)
11. [File Map](#11-file-map)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ @wolfgames/game-kit                                             │
│  ┌──────────────┐    ┌─────────────────────┐                    │
│  │ GameKIT      │───►│ GetAnalyticsService  │──► AnalyticsService│
│  │ (singleton)  │    │ Command              │   (wraps PostHog)  │
│  └──────────────┘    └─────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─── scaffold/ ──────────────────────────────────────────────────┐
│  lib/gameKit.ts      getGameKit()  — singleton factory          │
│  lib/analytics.ts    session timer, PostHog cache, re-exports   │
│  lib/posthog.ts      bridge — capture/identify for scaffold     │
│  lib/sentry.ts       Sentry init + PostHog error bridge         │
│  analytics/events.ts shared schemas (session, audio, error)     │
│  config/environment  PostHog key/host per environment           │
└────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─── game/ ──────────────────────────────────────────────────────┐
│  analytics/index.ts   service init, context type, param sets    │
│  analytics/trackers.ts all 19 game-specific tracker definitions │
└────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─── contexts/ ──────────────────────────────────────────────────┐
│  AnalyticsContext.tsx  Solid.js provider, session lifecycle      │
│  FeatureFlagContext.tsx feature flags from PostHog               │
│  helper.ts             user identity from URL/localStorage      │
└────────────────────────────────────────────────────────────────┘
```

**Key design decisions:**

- PostHog is accessed exclusively through `@wolfgames/game-kit`'s `AnalyticsService`, never directly
- All events are typed at compile time (TypeScript) and validated at runtime (ArkType schemas)
- A "param sets" system auto-fills common properties so trackers only specify unique fields
- `CityLinesContext` holds mutable session state (counters, last-known position) that param set defaults read from

---

## 2. Initialization Flow

### Step-by-step sequence

```
1. app.tsx mounts
2. <AnalyticsProvider> renders
   │
   ├── import game/analytics/index.ts (top-level await)
   │   ├── getUserData() → reads uid/email/name from URL params or localStorage
   │   ├── getEnvConfig().posthog → reads key, host, enabled, platform
   │   ├── getGameKit().execute(new GetAnalyticsServiceCommand({...}))
   │   │   └── GameKIT creates PostHog instance internally
   │   ├── .withContext<CityLinesContext>({...}) → sets initial mutable state
   │   ├── .addParamsSet({ base, level_ctx, level_config }) → registers schemas
   │   └── .addParamsDefault({...}) → registers default value generators
   │
   ├── onMount():
   │   ├── analyticsService.init() → finalizes PostHog (if not already)
   │   ├── setPh(analyticsService.getPosthog()) → stores in Solid signal
   │   ├── setPostHogInstance(instance) → bridges to scaffold/lib/posthog.ts
   │   ├── cachePostHogInstance(instance) → stores in scaffold/lib/analytics.ts
   │   ├── connectSentryToPostHog(...) → if Sentry is enabled
   │   ├── addEventListener("visibilitychange", ...) → pause/resume
   │   ├── addEventListener("pagehide", ...) → session_end
   │   └── trackSessionStart({ entry_screen: "start" })
   │
   └── <FeatureFlagProvider> renders (child of AnalyticsProvider)
       ├── reads PostHog signal from useAnalytics()
       ├── loads cached flags from localStorage
       ├── onFeatureFlags() listener for async flag delivery
       └── 2s timeout fallback → unblocks UI with defaults/cache
```

### User identity

`helper.ts` resolves identity in priority order:

| Source | Fields |
|--------|--------|
| URL params (`?uid=...&email=...&name=...`) | uid, email, name |
| localStorage (persisted from previous session) | uid, email, name |
| Fallback | `anonymous_{uuid}` for uid, empty string for email/name |

Identity is passed to `GetAnalyticsServiceCommand` and used for PostHog `identify()`.

---

## 3. The Analytics Service

The core `analyticsService` object (from `@wolfgames/game-kit`) provides:

| Method | Purpose |
|--------|---------|
| `createTracker(name, schema, paramSets, overrides)` | Creates a typed, validated tracker function |
| `withContext<T>(initial)` | Attaches mutable state that param set defaults can read |
| `updateContext(fn)` | Updates context via reducer function |
| `addParamsSet({ name: schema })` | Registers a named parameter set with ArkType schema |
| `addParamsDefault({ name: fn })` | Registers default value generators for param sets |
| `init()` | Finalizes PostHog initialization |
| `getPosthog()` | Returns the underlying PostHog instance |
| `getSessionId()` | Returns PostHog session ID |

### How `createTracker` works

```typescript
const trackLevelComplete = analyticsService.createTracker(
  "level_complete",       // PostHog event name
  type({                  // ArkType schema for THIS tracker's unique fields
    moves_used: "number",
    time_spent: "number",
    total_rotations: "number",
  }),
  ["base", "level_ctx", "level_config"],  // param sets to auto-include
  {                                        // param set overrides (optional)
    base: (ctx) => {
      ctx.levelsCompleted++;
      return { game_name: "city_lines", session_elapsed: getSessionElapsed() };
    },
  }
);
```

When `trackLevelComplete({ moves_used: 5, time_spent: 12.3, total_rotations: 8 })` is called:

1. **Param set defaults run** — `base`, `level_ctx`, `level_config` each generate their default values from `CityLinesContext`
2. **Overrides replace defaults** — the `base` override runs instead of the registered base default (and increments `levelsCompleted`)
3. **Caller params merge** — `moves_used`, `time_spent`, `total_rotations` merge in
4. **ArkType validates** — the full merged object is validated against all schemas
5. **PostHog captures** — `posthog.capture("level_complete", { ...mergedProperties })`

---

## 4. Parameter Sets & Defaults

Three param sets are registered. Every tracker declares which it uses via the `paramSets` array.

### `base` — included in every event

| Property | Type | Source |
|----------|------|--------|
| `game_name` | `"city_lines"` | Hardcoded |
| `session_elapsed` | `number` (seconds, 2 decimal) | `getSessionElapsed()` |

### `level_ctx` — location within the game

| Property | Type | Source |
|----------|------|--------|
| `chapter_id` | `string` | `ctx.lastChapterId` |
| `chapter_count` | `number` | `ctx.lastChapterCount` |
| `county_theme` | `string` | `ctx.lastCountyTheme` |
| `level_order` | `number` | `ctx.lastLevelOrder` |
| `chapter_progress` | `string` (optional) | `ctx.lastChapterProgress` |

### `level_config` — current level metadata

| Property | Type | Source |
|----------|------|--------|
| `level_id` | `string` | `ctx.lastLevelId` |
| `level_difficulty` | `"easy" \| "medium" \| "hard"` | `ctx.lastLevelDifficulty` |
| `is_tutorial` | `boolean` | `ctx.lastIsTutorial` |
| `level_seed` | `number` | `ctx.lastLevelSeed` |

---

## 5. Context Management

`CityLinesContext` is the mutable state object shared across all trackers:

```typescript
interface CityLinesContext {
  // Session rollup counters
  sessionStartTime: number;
  levelsCompleted: number;
  chaptersCompleted: number;
  storyLinksClicked: number;

  // Last-known location (for session_end snapshot)
  lastChapterId: string;
  lastChapterCount: number;
  lastLevelId: string;
  lastLevelOrder: number;
  lastChapterProgress: string;
  lastCountyTheme: string;

  // Last-known level config
  lastLevelDifficulty: "easy" | "medium" | "hard";
  lastIsTutorial: boolean;
  lastLevelSeed: number;
}
```

**Who updates context:**

| Tracker | Updates |
|---------|---------|
| `trackGameStart` | `lastChapterId`, `lastChapterCount`, `lastCountyTheme` |
| `trackLevelStart` | All `last*` fields (location + config) |
| `trackChapterStart` | `lastChapterId`, `lastChapterCount`, `lastCountyTheme`, `lastLevelOrder`, `lastIsTutorial` |
| `trackLevelComplete` (override) | `levelsCompleted++` |
| `trackChapterComplete` (override) | `chaptersCompleted++` |
| `trackStoryLinkClick` (override) | `storyLinksClicked++` |
| `trackSessionStart` (override) | `sessionStartTime = Date.now()` |

---

## 6. Complete Event Reference

### 6.1 Session Events

#### `session_start`
**Fired:** Once on page load (in `AnalyticsProvider.onMount`)
**Param sets:** `base`

| Property | Type | Value |
|----------|------|-------|
| `game_name` | string | `"city_lines"` |
| `session_elapsed` | number | `0` |
| `entry_screen` | string | `"start"` |

**Side effect:** Resets session timer, sets `ctx.sessionStartTime`

---

#### `session_pause`
**Fired:** When tab becomes hidden (`document.hidden === true`)
**Param sets:** `base`

| Property | Type | Value |
|----------|------|-------|
| `game_name` | string | `"city_lines"` |
| `session_elapsed` | number | Seconds since session start |
| `pause_reason` | enum | `"tab_hidden"` |

---

#### `session_resume`
**Fired:** When tab becomes visible again
**Param sets:** `base`

| Property | Type | Value |
|----------|------|-------|
| `game_name` | string | `"city_lines"` |
| `session_elapsed` | number | Seconds since session start |
| `resume_reason` | enum | `"tab_visible"` |
| `pause_duration` | number | Seconds the tab was hidden |

---

#### `session_end`
**Fired:** On `pagehide` event (tab close, navigation away)
**Param sets:** `base` (with override), `level_ctx`

| Property | Type | Source |
|----------|------|--------|
| `game_name` | string | `"city_lines"` |
| `session_elapsed` | number | `getSessionElapsed()` |
| `session_end_reason` | enum | `"user_close"` |
| `levels_completed_in_session` | number | `ctx.levelsCompleted` |
| `chapters_completed_in_session` | number | `ctx.chaptersCompleted` |
| `story_links_clicked_in_session` | number | `ctx.storyLinksClicked` |
| `chapter_id` | string | `ctx.lastChapterId` |
| `chapter_count` | number | `ctx.lastChapterCount` |
| `county_theme` | string | `ctx.lastCountyTheme` |
| `level_order` | number | `ctx.lastLevelOrder` |
| `chapter_progress` | string | `ctx.lastChapterProgress` |

**Note:** Also triggers `survey_eligible` if no chapter was completed in this session.

---

### 6.2 Game Lifecycle Events

#### `game_start`
**Fired:** When player taps "Play" on StartScreen
**Param sets:** `base`

| Property | Type | Notes |
|----------|------|-------|
| `game_name` | string | `"city_lines"` |
| `session_elapsed` | number | |
| `start_source` | string | e.g. `"start_screen"` |
| `is_returning_player` | boolean | Has saved progress |
| `chapter_id` | string | Starting chapter |
| `chapter_count` | number | Starting chapter number |
| `county_theme` | string | Starting county |

**Side effect:** Updates `lastChapterId`, `lastChapterCount`, `lastCountyTheme` in context.

---

### 6.3 Level Events

#### `level_start`
**Fired:** When a level becomes interactive
**Param sets:** `base`, `level_ctx`, `level_config`

| Property | Type | Notes |
|----------|------|-------|
| `grid_size` | number | Grid dimension |
| `landmarks_count` | number | Number of landmarks in level |
| `road_tiles_count` | number | Number of road tiles |
| `min_path_length` | number | Optimal path length |
| *+ all base, level_ctx, level_config properties* | | Auto-filled |

**Side effect:** Updates all `last*` context fields (location + config).

---

#### `level_complete`
**Fired:** When player completes a level
**Param sets:** `base` (with override), `level_ctx`, `level_config`

| Property | Type | Notes |
|----------|------|-------|
| `moves_used` | number | Total moves made |
| `optimal_moves` | number | Minimum possible moves |
| `time_spent` | number | Seconds on this level |
| `total_rotations` | number | Total tile rotations (counter, not per-tap) |
| `eraser_used` | boolean (optional) | Reserved for future use |
| *+ all base, level_ctx, level_config properties* | | Auto-filled |

**Side effect:** `ctx.levelsCompleted++`

---

#### `level_restart`
**Fired:** When player restarts a level (UI not yet built)
**Param sets:** `base`, `level_ctx`, `level_config`

| Property | Type | Notes |
|----------|------|-------|
| `moves_before_restart` | number | Moves made before restart |
| *+ all base, level_ctx, level_config properties* | | Auto-filled |

**Status:** Defined but not wired — no restart UI exists yet.

---

#### `level_fail`
**Fired:** When level ends without completion (no fail condition exists yet)
**Param sets:** `base`, `level_ctx`, `level_config`

| Property | Type | Notes |
|----------|------|-------|
| `moves_used` | number | |
| `quit_reason` | enum | `"user_quit" \| "error" \| "timeout"` |
| *+ all base, level_ctx, level_config properties* | | Auto-filled |

**Status:** Defined but not wired — no fail condition exists yet.

---

### 6.4 Chapter Events

#### `chapter_start`
**Fired:** When a new chapter begins
**Param sets:** `base`

| Property | Type | Notes |
|----------|------|-------|
| `chapter_id` | string | |
| `chapter_count` | number | |
| `county_theme` | string | |
| `is_tutorial` | boolean | |
| `chapter_size` | number | Number of levels in chapter |
| `story_id` | string | Associated story identifier |
| `story_headline` | string | Story headline text |

**Side effect:** Updates location context fields, resets `lastLevelOrder` to 0.

---

#### `chapter_complete`
**Fired:** When all levels in a chapter are completed
**Param sets:** `base` (with override), `level_ctx`

| Property | Type | Notes |
|----------|------|-------|
| `chapter_id` | string | |
| `time_spent` | number | Time since `chapterStartTimestamp` (seconds) |
| `is_tutorial` | boolean | |
| *+ all base, level_ctx properties* | | Auto-filled |

**Side effects:**
- `ctx.chaptersCompleted++`
- Triggers `survey_eligible` event (with 7-day cooldown)
- Sets `_hasCompletedChapter = true` (prevents session_end fallback survey)

---

#### `chapter_fail`
**Fired:** When chapter ends without completion (no fail condition exists yet)
**Param sets:** `base`, `level_ctx`

| Property | Type | Notes |
|----------|------|-------|
| `chapter_id` | string | |
| `is_tutorial` | boolean | |
| `quit_reason` | enum | `"user_quit" \| "error" \| "timeout"` |

**Status:** Defined but not wired — no fail condition exists yet.

---

### 6.5 Content Engagement Events

All cutscene events share a common base schema:

```typescript
cutsceneSchema = type({
  cutscene_id: "string",
  cutscene_type: "'chapter_start' | 'post_level_clue' | 'chapter_end_story_reveal' | 'tutorial' | 'other'",
  seconds_viewed: "number",
});
```

#### `cutscene_show`
**Param sets:** `base`, `level_ctx`
**Extra:** `interaction_type: "auto" | "tap" | "other"`
**Status:** Not wired — no cutscene UI yet.

#### `cutscene_skip`
**Param sets:** `base`, `level_ctx`
**Extra:** `interaction_type: "skip_button" | "tap" | "other"`
**Status:** Not wired.

#### `cutscene_complete`
**Param sets:** `base`, `level_ctx`
**Extra:** `interaction_type: string`
**Status:** Not wired.

#### `cutscene_interact`
**Param sets:** `base`, `level_ctx`
**Extra:** `interaction_type: string`
**Status:** Not wired.

#### `story_link_click`
**Param sets:** `base` (with override), `level_ctx`

| Property | Type |
|----------|------|
| `chapter_id` | string |
| `chapter_count` | number |
| `article_url` | string |

**Side effect:** `ctx.storyLinksClicked++`
**Status:** Not wired — no "Read full story" link exists yet.

---

### 6.6 Game Mechanic Events

#### `landmark_connected`
**Fired:** When player connects a landmark during gameplay
**Param sets:** `base`, `level_ctx`

| Property | Type | Notes |
|----------|------|-------|
| `landmark_id` | string | |
| `landmark_type` | enum | `"common" \| "county_specific" \| "other"` |
| `connection_order` | number | Nth landmark connected in this level |
| `time_to_connect_seconds` | number | Time since level start or last connection |
| `landmarks_remaining` | number | Landmarks left to connect |

---

### 6.7 Settings Events

#### `audio_setting_changed`
**Fired:** When player changes volume or mute in settings menu
**Param sets:** `base`

| Property | Type | Notes |
|----------|------|-------|
| `setting_type` | enum | `"volume" \| "mute"` |
| `old_value` | unknown | Previous value |
| `new_value` | unknown | New value |
| `screen_name` | string | Which screen the change was made on |

---

### 6.8 Error Events

#### `error_captured`
**Fired:** Automatically via Sentry `beforeSend` hook
**Param sets:** none

| Property | Type | Notes |
|----------|------|-------|
| `error_type` | string | Exception type from Sentry (e.g. `"TypeError"`) |
| `user_id` | string | Current user ID |
| `session_id` | string | PostHog session ID |

---

### Event Coverage Summary

| Status | Count | Events |
|--------|------:|--------|
| Fully wired + correct | **12** | session_start, session_pause, session_resume, session_end, game_start, level_start, level_complete, chapter_start, chapter_complete, landmark_connected, audio_setting_changed, error_captured |
| Defined but not wired | **7** | level_restart, level_fail, chapter_fail, cutscene_show, cutscene_skip, cutscene_complete, cutscene_interact, story_link_click |

The 7 unwired trackers correspond to UI features that don't exist yet. The tracker functions are exported and ready to call.

---

## 7. Feature Flags

### Implementation (`FeatureFlagContext.tsx`)

The `FeatureFlagProvider` sits inside `AnalyticsProvider` and reads flags from PostHog's SDK.

### Available Flags

| Flag | Type | Default | Values |
|------|------|---------|--------|
| `difficulty_curve_variant` | string enum | `"medium_start"` | `"easy_start"`, `"medium_start"`, `"hard_start"` |
| `county_theming_enabled` | boolean | `false` | `true`, `false` |
| `clue_display_time` | string enum | `"3s"` | `"2s"`, `"3s"`, `"5s"` |
| `clue_overlay_enabled` | boolean | `false` | `true`, `false` |

### Resolution Strategy

```
1. Load from localStorage cache (instant, per-user key)
2. If cache exists → render immediately with cached values
3. PostHog SDK delivers flags async → processFlags() validates & updates
4. If PostHog fails or takes > 2s → timeout unblocks UI with cache or defaults
```

### Validation

Every flag value is validated before use:
- `isDifficultyVariant()` — checks against allowed string literals
- `isClueDisplayTime()` — checks against allowed string literals
- `safeBoolean()` — strict `typeof value === "boolean"` check
- Invalid values fall back to `DEFAULT_FLAGS`

### Super Properties

When flags resolve, they're registered as PostHog "super properties" (attached to all subsequent events):

```typescript
ph.register({
  difficulty_variant: nextFlags.difficulty_curve_variant,
  county_theming: nextFlags.county_theming_enabled,
  clue_time: nextFlags.clue_display_time,
  overlay_enabled: nextFlags.clue_overlay_enabled,
});
```

### Caching

- Key: `citylines_ff_{uid}` in localStorage
- Written on every successful flag resolution
- Read on mount (before PostHog loads) for instant startup

---

## 8. Survey Integration

### How it works

Surveys use PostHog's server-side survey targeting. The game fires a `survey_eligible` event at strategic moments; PostHog decides whether to show a survey based on targeting rules.

### Triggers

| Trigger | When | Condition |
|---------|------|-----------|
| `"chapter_complete"` | After `trackChapterComplete` fires | Always (subject to cooldown) |
| `"session_end_fallback"` | On `pagehide` event | Only if no chapter was completed this session |

### Cooldown

- 7-day cooldown per user
- Key: `citylines_survey_cd_{uid}` in localStorage
- Value: timestamp of last survey trigger
- Checked before every `triggerSurvey()` call

### Event payload

```typescript
posthog.capture("survey_eligible", {
  game_name: "city_lines",
  trigger: "chapter_complete" | "session_end_fallback",
});
```

---

## 9. Sentry ↔ PostHog Bridge

### How it works

When Sentry catches an exception, its `beforeSend` hook fires `trackErrorCaptured()` which sends `error_captured` to PostHog. This creates a cross-reference between Sentry error events and PostHog user sessions.

### Connection flow

```
AnalyticsProvider.onMount()
  └── connectSentryToPostHog(trackErrorCaptured, { userId, email, sessionId })
        ├── Stores tracker reference in sentry.ts module scope
        ├── Sets Sentry user context (id, email)
        └── Sets Sentry session context (session_id)

Later, when an error occurs:
  Sentry.beforeSend(event)
    └── errorTracker({ error_type, user_id, session_id })
          └── PostHog.capture("error_captured", {...})
```

### Environment gates

| Environment | Sentry | PostHog |
|-------------|:------:|:-------:|
| local | Off | Off |
| development | Off | Off |
| qa | On | On |
| staging | On | On |
| production | On | On |

---

## 10. Environment Configuration

PostHog configuration is defined in `scaffold/config/environment.ts`:

```typescript
const SHARED_CONFIG = {
  posthog: {
    enabled: true,
    key: "phc_RFhmtnQWjam4fNHYyn89lf0WVW6qF5bVYMwoXO8dSpR",
    host: "https://us.i.posthog.com",
    platform: "advance",
  },
};
```

| Environment | PostHog Enabled |
|-------------|:---------------:|
| local | No |
| development | No |
| qa | Yes |
| staging | Yes |
| production | Yes |

All environments share the same API key and host. The `platform` field is `"advance"`.

---

## 11. File Map

| File | Layer | Role |
|------|-------|------|
| `scaffold/config/environment.ts` | Scaffold | PostHog key, host, enabled per env |
| `scaffold/lib/gameKit.ts` | Scaffold | GameKIT singleton factory |
| `scaffold/lib/analytics.ts` | Scaffold | Session timer, PostHog cache, `GetAnalyticsServiceCommand` re-export |
| `scaffold/lib/posthog.ts` | Scaffold | Bridge for scaffold systems (capture/identify) |
| `scaffold/lib/sentry.ts` | Scaffold | Sentry init + PostHog error bridge |
| `scaffold/analytics/events.ts` | Scaffold | Shared ArkType schemas (session, audio, error) |
| `game/analytics/index.ts` | Game | Service init, `CityLinesContext`, param set registration |
| `game/analytics/trackers.ts` | Game | All 19 tracker definitions |
| `contexts/AnalyticsContext.tsx` | Game | Solid.js provider, session lifecycle, survey logic |
| `contexts/FeatureFlagContext.tsx` | Game | Feature flag resolution, caching, timeout |
| `contexts/helper.ts` | Game | User identity from URL/localStorage |

---

*Generated: 2026-02-16*
