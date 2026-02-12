# Telemetry Integration Report

Event-by-event implementation map for City Lines 1.0 analytics. Covers where each event actually lives in the codebase, what infrastructure is missing, and corrected file references from the Linear ticket.

Source of truth: [City Lines 1.0 Telemetry Spec](https://www.notion.so/wolfgames/) (Notion)

---

## Infrastructure gaps

These need to be built before events can be wired.

### 1. Tab visibility handler (MISSING)

The `PauseProvider` only handles spacebar pause — it has **no awareness of tab switching**.

**What exists:**
```
src/scaffold/systems/pause/
├── state.ts      ← createSignal(false), pause/resume/toggle
├── keyboard.ts   ← Spacebar listener only
└── context.tsx   ← PauseProvider wraps children
```

**What's missing:** Browser visibility events needed for `session_pause` / `session_resume`:

| Browser Event | When it fires | Maps to |
|--------------|--------------|---------|
| `document.visibilitychange` | User switches tabs (hidden/visible) | `session_pause` (pause_reason: `tab_hidden`) / `session_resume` (resume_reason: `tab_visible`) |
| `window.blur` | User clicks outside the browser window | `session_pause` (pause_reason: `window_blur`) |
| `window.focus` | User clicks back on the browser window | `session_resume` (resume_reason: `window_focus`) |
| `window.beforeunload` | User closes tab or navigates away | `session_end` (session_end_reason: `user_close`) |

**Implementation:** Add a visibility listener alongside the existing keyboard listener in `src/scaffold/systems/pause/`. This serves dual purpose — pausing game audio/animation AND firing telemetry events.

```typescript
// New file: src/scaffold/systems/pause/visibility.ts
export function initVisibilityHandler(
  onPause: (reason: 'tab_hidden' | 'window_blur' | 'app_background') => void,
  onResume: (reason: 'tab_visible' | 'window_focus' | 'app_foreground') => void,
  onUnload: () => void
): void {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      onPause('tab_hidden');
    } else {
      onResume('tab_visible');
    }
  });

  window.addEventListener('blur', () => {
    // Only fire if tab is still visible (blur = clicked outside window)
    if (!document.hidden) {
      onPause('window_blur');
    }
  });

  window.addEventListener('focus', () => {
    onResume('window_focus');
  });

  window.addEventListener('beforeunload', () => {
    onUnload();
  });
}
```

### 2. Session rollup state (MISSING)

`session_end` requires accumulated counts. Nothing tracks these today.

| Rollup property | Source |
|----------------|--------|
| `levels_completed_in_session` | Increment on each `level_complete` |
| `chapters_completed_in_session` | Increment on each `chapter_complete` |
| `story_links_clicked_in_session` | Increment on each `story_link_click` |
| `last_chapter_count` | Updated on `chapter_start` |
| `last_level_order` | Updated on `level_start` |
| `last_chapter_progress` | Updated on `level_complete` |
| `last_county_theme` | Updated on `chapter_start` |

**Implementation:** A simple counter object in `src/game/analytics/session.ts`, updated by each tracker function, dumped into `session_end` properties.

### 3. Feature flag methods (MISSING)

`src/scaffold/lib/posthog.ts` has `capture`, `identify`, `setPersonProperties` but no feature flag API.

**Need to add:**
```typescript
export function getFeatureFlag(key: string): string | boolean | undefined {
  if (!ph) return undefined;
  return ph.getFeatureFlag(key);
}

export function isFeatureEnabled(key: string): boolean {
  if (!ph) return false;
  return ph.isFeatureEnabled(key) ?? false;
}

export function onFeatureFlags(callback: () => void): void {
  if (!ph) return;
  ph.onFeatureFlags(callback);
}
```

### 4. PostHog survey wiring (MISSING)

Zero survey code exists. PostHog JS SDK supports surveys natively — they render automatically when triggered by events or conditions configured in the PostHog dashboard.

**Implementation:** PostHog surveys are configured in the PostHog UI, not in code. What we need:
- Ensure `posthog.init()` doesn't disable surveys (current config has `autocapture: false` — surveys are separate from autocapture, so this is fine)
- Fire the trigger events (`chapter_complete`, `session_end`) with the context properties the survey targeting rules will filter on

### 5. Chapter failure logic (MISSING)

No `chapter_fail` path exists. The game currently has no way for a chapter to fail — player can always continue. If this changes, it would be triggered from `GameScreen.tsx`.

---

## Event integration map

### Session events

| Event | Fire when | Correct file | Currently wired? |
|-------|----------|-------------|-----------------|
| `session_start` | App mounts, PostHog initialized | `src/app.tsx` onMount | No |
| `session_pause` | Tab hidden, window blur | **NEW:** `src/scaffold/systems/pause/visibility.ts` | No (file doesn't exist) |
| `session_resume` | Tab visible, window focus | **NEW:** `src/scaffold/systems/pause/visibility.ts` | No (file doesn't exist) |
| `session_end` | `beforeunload`, idle timeout | **NEW:** `src/scaffold/systems/pause/visibility.ts` + idle timer in `src/game/analytics/session.ts` | No |

**`session_start` hook point:**
```
src/app.tsx
  └── onMount()
        ├── initSentry()
        ├── initPostHog()          ← already here
        └── capture('session_start') ← ADD HERE
```

**`session_pause/resume` hook point:**
```
src/app.tsx (or PauseProvider)
  └── onMount()
        └── initVisibilityHandler(
              onPause → capture('session_pause', { pause_reason })
              onResume → capture('session_resume', { resume_reason, pause_duration })
              onUnload → capture('session_end', { ...rollups })
            )
```

### Game start

| Event | Fire when | Correct file | Currently wired? |
|-------|----------|-------------|-----------------|
| `game_start` | Player clicks "Start" on start screen | `src/game/screens/StartScreen.tsx` → `handleStart()` | No |

**Ticket says** `CityLinesGame.ts` — **wrong.** The Start button handler is in StartScreen.tsx.

### Level events

| Event | Fire when | Correct file | Currently wired? |
|-------|----------|-------------|-----------------|
| `level_start` | Grid rendered and interactive | `src/game/screens/GameScreen.tsx` after `game.loadLevel()` | No |
| `level_complete` | Player completes level | `src/game/screens/GameScreen.tsx` → `completionStart` event handler | No |
| `level_restart` | Player restarts level | `src/game/screens/GameScreen.tsx` (restart handler) | No |
| `level_fail` | Level ends without completion | `src/game/screens/GameScreen.tsx` (quit/timeout handler) | No |

**Ticket says** `CityLinesGame.ts` for all level events — **partially wrong.** CityLinesGame emits internal events (`tileRotated`, `levelComplete`, `landmarkConnected`), but the level lifecycle orchestration (loading, completion flow, restart) is in GameScreen.tsx which listens to those events.

**Hook points in GameScreen.tsx:**
```
game.loadLevel(level)                    → fire level_start
game.onGameEvent('completionStart', ...) → fire level_complete
game.onGameEvent('levelComplete', ...)   → (same, alternate path)
// level_restart and level_fail need new paths
```

### Chapter events

| Event | Fire when | Correct file | Currently wired? |
|-------|----------|-------------|-----------------|
| `chapter_start` | New chapter begins | `src/game/screens/GameScreen.tsx` (chapter init) + `src/game/screens/StartScreen.tsx` (first chapter) | No |
| `chapter_complete` | All levels in chapter done | `src/game/screens/GameScreen.tsx` → `completeChapter()` | No |
| `chapter_fail` | Chapter ends without completion | **NOT IMPLEMENTED** — no failure path exists | N/A |

**Ticket says** `LevelCompletionController.ts` — **wrong.** LCC manages level-level completion (playing → completing → complete state machine). Chapter orchestration is in GameScreen.tsx.

### Content engagement events

| Event | Fire when | Correct file | Currently wired? |
|-------|----------|-------------|-----------------|
| `cutscene_show` | Clue popup or story reveal appears | `src/game/screens/GameScreen.tsx` lines 428-469 (completionStart handler) | No |
| `cutscene_skip` | Player skips a skippable cutscene | `src/game/screens/GameScreen.tsx` (companion dialogue skip) | No |
| `cutscene_complete` | Cutscene viewed to end | `src/game/screens/GameScreen.tsx` (CluePopup auto-dismiss, dialogue end) | No |
| `cutscene_interact` | Player taps/advances cutscene | `src/game/screens/GameScreen.tsx` (dialogue advance handler) | No |
| `story_link_click` | Player clicks "Read the full story" | `src/game/screens/components/CompletionOverlay.tsx` or results screen | No |

**Ticket says** `LevelCompletionController.ts` — **wrong.** Cutscene/clue display is triggered in GameScreen.tsx via the `completionStart` event handler, which shows either a `CluePopup` (Pixi) or companion dialogue.

**How cutscenes currently work:**
```
LevelCompletionController fires 'completionStart'
  └── GameScreen.tsx listens (line 428)
        ├── Mid-chapter: shows CluePopup (Pixi overlay with character avatar + speech bubble)
        └── Chapter-end: shows companion slide-in with dialogue box
              └── Player clicks continue → CompletionOverlay.tsx (Solid.js modal)
```

### Advanced gameplay events

| Event | Fire when | Correct file | Currently wired? |
|-------|----------|-------------|-----------------|
| `tile_rotated` | Player rotates a tile | `src/game/citylines/core/CityLinesGame.ts:295` → listened in `GameScreen.tsx:393` | No |
| `landmark_connected` | Landmark connects to road network | `src/game/citylines/core/CityLinesGame.ts:639` → listened in `GameScreen.tsx:423` | No |
| `audio_setting_changed` | Player toggles music/volume | `src/scaffold/utils/SettingsMenu/SettingsMenu.tsx:190-200` | No |

**Ticket says** `CityLinesGame.ts` for all three — **wrong for audio_setting_changed.** Audio settings are in the scaffold SettingsMenu component. CityLinesGame has no audio UI.

**`tile_rotated` and `landmark_connected` are correct** — CityLinesGame emits these events, GameScreen.tsx already listens to them for sound effects. We add telemetry capture alongside.

### Feature flags

| Requirement | Correct file | Currently exists? |
|------------|-------------|------------------|
| Fetch flags on session start | `src/scaffold/lib/posthog.ts` + `src/app.tsx` | No — no feature flag API in posthog.ts |
| `difficulty_curve_variant` | Game tuning / level generation | No |
| `county_theming_enabled` | Theme config | No |
| `clue_display_time` | CluePopup / LevelCompletionController | No |
| `clue_overlay_enabled` | GameScreen.tsx clue display logic | No |

**Needs:** Add `getFeatureFlag()`, `isFeatureEnabled()`, `onFeatureFlags()` to `scaffold/lib/posthog.ts`. Read flags in `app.tsx` after PostHog init, store in a Solid.js signal or context for game code to consume.

### PostHog surveys

| Requirement | Correct file | Currently exists? |
|------------|-------------|------------------|
| Trigger after `chapter_complete` | `src/game/screens/GameScreen.tsx` | No |
| Fallback trigger on `session_end` | `src/game/analytics/session.ts` | No |
| Cooldown (once per user per period) | PostHog dashboard config | No |
| Context props: game_name, session_elapsed, chapter_count, county_theme | Event properties | No |

**Surveys are configured in the PostHog UI**, not in code. Our job is:
1. Fire `chapter_complete` and `session_end` with the right properties
2. PostHog dashboard targets surveys to those events
3. No extra code needed — PostHog SDK renders surveys automatically

---

## Corrected WHERE reference table

For updating the Linear ticket:

| Event | Ticket says | Should say |
|-------|------------|-----------|
| `session_start` | `app.tsx`, `posthog.ts` | `app.tsx` onMount |
| `session_pause/resume` | `app.tsx`, `posthog.ts` | **NEW** `scaffold/systems/pause/visibility.ts` + `app.tsx` |
| `session_end` | `app.tsx`, `posthog.ts` | **NEW** `scaffold/systems/pause/visibility.ts` + `game/analytics/session.ts` |
| `game_start` | `CityLinesGame.ts` | `game/screens/StartScreen.tsx` |
| `level_start/complete/restart/fail` | `CityLinesGame.ts` | `game/screens/GameScreen.tsx` (listens to CityLinesGame events) |
| `chapter_start/complete/fail` | `LevelCompletionController.ts` | `game/screens/GameScreen.tsx` |
| `cutscene_*` | `LevelCompletionController.ts` | `game/screens/GameScreen.tsx` (CluePopup + companion dialogue handlers) |
| `tile_rotated` | `CityLinesGame.ts` | `CityLinesGame.ts` (correct) → listened in `GameScreen.tsx` |
| `landmark_connected` | `CityLinesGame.ts` | `CityLinesGame.ts` (correct) → listened in `GameScreen.tsx` |
| `audio_setting_changed` | `CityLinesGame.ts` | `scaffold/utils/SettingsMenu/SettingsMenu.tsx` |
| Feature flags | `posthog.ts`, `app.tsx` | `posthog.ts` (add methods) + `app.tsx` (read on init) |
| Surveys | `LevelCompletionController.ts` | PostHog dashboard config (no code — just fire trigger events) |

---

## Spec gaps found

| Item | Status | Notes |
|------|--------|-------|
| `eraser_used` in `level_complete` | In spec, missing from ticket | Spec lists it as a level_complete property |
| `level_config` schema | TBD in spec | Spec says "engineering should define" — still undefined |
| Idle timeout value for `session_end` | Undefined | Spec mentions timeout but no duration specified |
| `chapter_fail` | No code path | Game has no chapter failure logic — player can always continue |

---

*Generated: 2026-02-11*
