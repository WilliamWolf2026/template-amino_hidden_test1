# Analytics Implementation Audit Report

Audit of the ENG-1447 analytics integration against the [analytics requirements spec](../game/analytics-requirements.md).

**Branch:** `ENG-1447-implement-posthog`
**Date:** 2026-02-16

---

## Changes Made

The following issues were fixed during this audit:

| # | Fix | Files changed |
|---|-----|---------------|
| 1 | **tile_rotated removed as per-tap event** — converted to `total_rotations` counter rolled into `level_complete` | `GameScreen.tsx`, `trackers.ts`, `AnalyticsContext.tsx` |
| 2 | **chapter_complete: removed fake `score: 0` and `erasers_used: 0`** — these features don't exist yet | `trackers.ts`, `GameScreen.tsx` |
| 3 | **chapter_complete.time_spent fixed** — now measures from chapter start, not last level start | `GameScreen.tsx` (added `chapterStartTimestamp`) |
| 4 | **entry_screen fixed** — changed from `"loading_gate"` to `"start"` per spec | `AnalyticsContext.tsx` |
| 5 | **Event listener cleanup added** — `visibilitychange` and `pagehide` listeners now removed in `onCleanup` | `AnalyticsContext.tsx` |
| 6 | **Debug code removed** — `LAST_SESSION_END` localStorage write, `console.debug` statements, `console.log` in posthog bridge | `AnalyticsContext.tsx`, `posthog.ts` |
| 7 | **Private property access removed** — `analyticsService["context"]` replaced with param set defaults that read from `CityLinesContext` automatically | `AnalyticsContext.tsx` |
| 8 | **session_end restructured** — rollup counters and last-position data now come from `CityLinesContext` via `base` and `level_ctx` param set defaults | `AnalyticsContext.tsx` |

---

## Blocking Issue: `@wolfgames/game-kit` Not Installed

The `@wolfgames/game-kit` package is listed in `package.json` but the `@wolfgames/` directory in `node_modules` is empty. The `.npmrc` requires a `NODE_AUTH_TOKEN` with `read:packages` scope for GitHub Packages.

**The app will not start until this is resolved.** The `gh auth token` (OAuth device token) returns 403 — a PAT with `read:packages` scope is needed.

```bash
# To fix:
export NODE_AUTH_TOKEN=<github-pat-with-read:packages>
bun install
```

---

## Event Coverage Matrix (Post-Fix)

| # | Event | Defined | Wired | Correct | Notes |
|---|-------|:-------:|:-----:|:-------:|-------|
| 1 | `session_start` | Yes | Yes | **Yes** | Fixed: `entry_screen: "start"` |
| 2 | `session_pause` | Yes | Yes | Yes | |
| 3 | `session_resume` | Yes | Yes | Yes | |
| 4 | `session_end` | Yes | Yes | **Yes** | Fixed: reads rollups from context via param set defaults |
| 5 | `game_start` | Yes | Yes | Yes | |
| 6 | `level_start` | Yes | Yes | Yes | |
| 7 | `level_restart` | Yes | **No** | N/A | No restart UI exists yet |
| 8 | `level_complete` | Yes | Yes | **Yes** | Fixed: now includes `total_rotations` |
| 9 | `level_fail` | Yes | **No** | N/A | No fail condition exists yet |
| 10 | `chapter_start` | Yes | Yes | Yes | |
| 11 | `chapter_complete` | Yes | Yes | **Yes** | Fixed: removed fake score/erasers, fixed time_spent |
| 12 | `chapter_fail` | Yes | **No** | N/A | No fail condition exists yet |
| 13 | `cutscene_show` | Yes | **No** | N/A | No cutscene UI wired yet |
| 14 | `cutscene_skip` | Yes | **No** | N/A | |
| 15 | `cutscene_complete` | Yes | **No** | N/A | |
| 16 | `cutscene_interact` | Yes | **No** | N/A | |
| 17 | `story_link_click` | Yes | **No** | N/A | No "Read full story" link exists yet |
| 18 | `tile_rotated` | **Removed** | N/A | N/A | Converted to `total_rotations` counter on `level_complete` |
| 19 | `landmark_connected` | Yes | Yes | Yes | |
| 20 | `audio_setting_changed` | Yes | Yes | Yes | |

### Summary

| Status | Count | Events |
|--------|------:|--------|
| Fully wired + correct | **12** | session_start, session_pause, session_resume, session_end, game_start, level_start, level_complete, chapter_start, chapter_complete, landmark_connected, audio_setting_changed, tile_rotated (as counter) |
| Defined but not wired (no UI yet) | **7** | level_restart, level_fail, chapter_fail, cutscene_show, cutscene_skip, cutscene_complete, cutscene_interact, story_link_click |

**Event coverage: 12/19 wired (63%), 12/19 fully correct (63%)**

The 7 unwired trackers correspond to UI features that don't exist yet (restart button, fail condition, cutscene surfaces, story link). These trackers are ready to be called once the UI is built.

---

## Remaining Issues

### Still needs attention

| # | Issue | Severity | Notes |
|---|-------|----------|-------|
| 1 | **`@wolfgames/game-kit` not installed** | Blocker | Needs `NODE_AUTH_TOKEN` PAT with `read:packages` |
| 2 | **Top-level `await` in `game/analytics/index.ts`** | Major | No error handling — rejection crashes entire import chain |
| 3 | **9 scaffold files modified** | Major | Needs explicit approval or relocation to `src/game/` |
| 4 | **`src/contexts/` outside project structure** | Minor | Should be `src/game/contexts/` |
| 5 | **Module-level side effects** (`getUserData()` at import time) | Minor | SSR-hostile |
| 6 | **PII from URL params** (`helper.ts`) | Minor | No validation on `uid`/`email`/`name` from query string |
| 7 | **FeatureFlagProvider blocks render** up to 2s for first-time users | Minor | `<Show when={state.isReady}>` |

### Feature flags & surveys

Both are implemented correctly per spec. No changes needed.

---

*Generated: 2026-02-16*
