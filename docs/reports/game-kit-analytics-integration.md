# Game Kit Analytics Integration Report

Analysis of `@wolfgames/game-kit` PostHog analytics vs the current scaffold PostHog integration.

---

## Current State

### What exists today

The scaffold has a minimal PostHog wrapper in `src/scaffold/lib/posthog.ts` (45 lines):

```
initPostHog(apiKey, apiHost)  →  lazy import('posthog-js'), call posthog.init()
capture(event, properties)    →  posthog.capture()
identify(userId, properties)  →  posthog.identify()
setPersonProperties(props)    →  posthog.people.set()
```

**Who calls it:**

| Caller | What it does |
|--------|-------------|
| `app.tsx` onMount | `initPostHog(apiKey, apiHost)` — init on boot if key configured |
| `errorReporter.capture()` | `capture('error', { error_name, severity, screen })` |
| `errorReporter.setUser()` | `identify(userId)` |
| `errorReporter.setScreen()` | `capture('screen_view', { screen })` |

**Who does NOT call it:** Game code. Zero `capture()` or `identify()` calls from anywhere in `src/game/`. PostHog is currently error-tracking + screen-view only — no gameplay analytics.

### Config flow

```
scaffoldConfig.posthog.apiKey  (src/scaffold/config.ts — hardcoded, currently commented out)
ENV_CONFIG[env].posthog        (src/scaffold/config/environment.ts — per-environment)
  → app.tsx reads scaffoldConfig.posthog?.apiKey
  → calls initPostHog() in onMount
```

PostHog is disabled in `local` and `development`, enabled in `qa`/`staging`/`production`.

---

## What Game Kit Brings

### Key differences

| Feature | Current scaffold | game-kit |
|---------|-----------------|----------|
| Init pattern | `initPostHog(key, host)` | `GetAnalyticsServiceCommand({ enabled, platform, environment, userId, ... })` |
| Type safety | None — `capture(string, Record<string, unknown>)` | ArkType-validated trackers with typed params |
| User identity at init | Not set until `errorReporter.setUser()` | Passed in command config (`userId`, `userName`, `userEmail`) |
| Consent support | None — init fires immediately | `analytics.init()` deferred — pass `false` to skip auto-init |
| Event creation | Raw `capture('event_name', { ... })` | `analytics.createTracker('event_name', validator, predefinedKeys, defaults)` |
| Reserved keys | No protection | Auto-strips `platform`, `userId`, `sessionId` from custom params |
| Singleton | Module-level `let ph` variable | Command returns singleton service |
| posthog-js bundling | Direct import (lazy) | Peer dependency — consuming project installs |

### What it adds that we don't have

1. **Type-safe event trackers** — define event schemas with ArkType validators, get compile-time + runtime safety on every `tracker()` call
2. **Predefined params** — common fields (platform, environment) auto-attached without repeating them
3. **Consent-gated init** — `analytics.init()` can be deferred until user consents (GDPR/privacy)
4. **Direct PostHog access** — `analytics.getPosthog()` for escape hatch
5. **Command pattern** — consistent with other game-kit services

---

## Gap Analysis

### What changes if we adopt game-kit analytics

#### Scaffold changes needed

| File | Current | After game-kit |
|------|---------|---------------|
| `scaffold/lib/posthog.ts` | Owns PostHog init + capture | **Remove or reduce to re-export** — game-kit owns the PostHog instance |
| `scaffold/systems/errors/reporter.ts` | Calls `capture()` and `identify()` from `posthog.ts` | Route through game-kit's `AnalyticsService` or keep thin wrapper for error-only events |
| `scaffold/config.ts` | `posthog?: { apiKey, apiHost }` in ScaffoldConfig | May remove — config moves to game-kit command params |
| `scaffold/config/environment.ts` | `PosthogConfig` per environment | Keep for environment awareness, but init moves to game-kit |
| `app.tsx` | `initPostHog(apiKey, apiHost)` in onMount | Replace with `gameKit.execute(new GetAnalyticsServiceCommand(...))` |

#### Game changes needed

| File | Change |
|------|--------|
| `game/config.ts` or new `game/analytics.ts` | Define game-kit analytics config (apiKey, platform, environment, user info) |
| Game screens / gameplay code | Add typed trackers for gameplay events (level_started, level_completed, etc.) |
| `package.json` | Add `@wolfgames/game-kit` + `posthog-js` as dependencies |

### The errorReporter question

The biggest architectural question: `errorReporter` in scaffold directly imports from `scaffold/lib/posthog.ts`. If game-kit owns the PostHog instance, there are two options:

**Option A: game-kit owns everything.** Scaffold's `errorReporter` receives an analytics service via dependency injection. No direct PostHog import in scaffold.

**Option B: dual path.** Scaffold keeps its thin PostHog wrapper for error tracking. Game-kit owns gameplay analytics. Two PostHog init calls, same API key — PostHog handles this fine (it's the same instance internally), but it's messy.

**Recommendation: Option A.** The errorReporter should accept an analytics interface (inject at app.tsx level). This keeps scaffold decoupled from both PostHog directly AND from game-kit.

---

## Migration Path

### Phase 1: Install and init (low risk)

1. `bun add @wolfgames/game-kit posthog-js`
2. Create `src/game/analytics.ts` — game-kit analytics config
3. In `app.tsx`, replace `initPostHog()` with `GetAnalyticsServiceCommand`
4. Wire the analytics service into a Solid.js context or module singleton
5. Keep `scaffold/lib/posthog.ts` working for errorReporter (dual path temporarily)

### Phase 2: Typed trackers (gameplay value)

1. Define event schemas for gameplay events:
   - `level_started` (levelId, chapter, gridSize)
   - `level_completed` (levelId, moves, duration, clue)
   - `chapter_completed` (chapterId, totalTime)
   - `hint_used` (levelId, hintType)
2. Create trackers in game code using `analytics.createTracker()`
3. Call trackers from GameScreen, LevelCompletionController, etc.

### Phase 3: Unify error reporting (clean architecture)

1. Abstract `errorReporter` to accept an `AnalyticsCapture` interface
2. Implement that interface using game-kit's analytics service
3. Remove `scaffold/lib/posthog.ts` entirely
4. Single PostHog instance owned by game-kit

---

## Assessment

### Worth doing?

**Yes, for two reasons:**

1. **The scaffold has zero gameplay analytics today.** Every `capture()` call is error-related. Game-kit's typed trackers are the right way to add gameplay events — untyped `capture('event', { ... })` calls scattered through game code would be technical debt from day one.

2. **Consent support is table stakes.** The current init-on-boot pattern can't support GDPR consent flows. Game-kit's deferred init handles this cleanly.

### What's NOT worth doing

- Don't rush Phase 3 (errorReporter refactor). The dual-path is fine temporarily. The errorReporter works and error tracking is separate from gameplay analytics.
- Don't over-architect the tracker schemas. Start with 3-4 events, expand as you see what questions you actually ask in PostHog dashboards.

### Risk

Low. PostHog is already a dependency (lazy-loaded). Game-kit wraps the same library. The main risk is two init paths during the transition (Phase 1-2), which PostHog handles gracefully since it's singleton internally.

---

*Generated: 2026-02-11*
