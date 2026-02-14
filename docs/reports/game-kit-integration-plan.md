# Game Kit Analytics Integration Plan

Install `@wolfgames/game-kit` and wire it as the analytics foundation. This replaces the scaffold's bare PostHog wrapper and provides typed tracker infrastructure for the telemetry spec.

**Prerequisite:** [Game-kit assessment](game-kit-analytics-integration.md)

---

## Status: BLOCKED

**Game-kit v0.0.38 does not include `GetAnalyticsServiceCommand` or any PostHog analytics module.**

### What v0.0.38 actually provides

| Module | Commands | Relevant? |
|--------|----------|-----------|
| **Sentry** | `InitSentryCommand`, `ConnectTrackerCommand`, `LogErrorCommand`, `SetUserCommand`, `AddBreadcrumbCommand` | Partially — could replace `scaffold/lib/sentry.ts` |
| **Data** | CRUD for JSON data on server | Not for analytics |
| **Asset** | Upload/delete assets | Not for analytics |
| **Auth** | Authentication | Not for analytics |
| **Game Save** | Save/load game state | Not for analytics |
| **Player Identity** | Player ID management | Potentially useful |
| **Local Storage** | Abstracted local storage | Not for analytics |

The `ConnectTrackerCommand` bridges Sentry errors to a callback (intended for PostHog), but there are no:
- `GetAnalyticsServiceCommand`
- `AnalyticsService` with `createTracker()`
- Typed event trackers
- PostHog init/identify/capture wrappers
- Predefined params or reserved key stripping

### Install note

The package is on a private GitHub repo. Install via:
```bash
bun add git+ssh://git@github.com/wolfgames/game-kit.git
```
(Not on npm. Requires SSH key access to wolfgames org.)

---

## When to resume

Resume this plan when game-kit ships a version with:
- [ ] `GetAnalyticsServiceCommand` (or equivalent PostHog analytics command)
- [ ] `AnalyticsService` with `createTracker()` for typed events
- [ ] Predefined params support (`game_name`, `session_elapsed` auto-attached)
- [ ] `getPosthog()` escape hatch for direct access

Once those land, the integration plan below applies.

---

## Planned integration (when analytics module ships)

### New file: `src/game/analytics.ts`

Central analytics config and service. Game code imports from here.

```typescript
import { GameKIT, GetAnalyticsServiceCommand } from '@wolfgames/game-kit';
import { getEnvironment } from '~/scaffold/config';
import { getEnvConfig } from '~/scaffold/config/environment';

const envConfig = getEnvConfig();
const environment = getEnvironment();

let analyticsPromise: ReturnType<typeof createAnalytics> | null = null;

function createAnalytics() {
  const gameKit = new GameKIT({});

  const { promise } = gameKit.execute(
    new GetAnalyticsServiceCommand({
      enabled: envConfig.posthog.enabled,
      platform: envConfig.posthog.platform,       // 'advance'
      environment,                                  // 'local' | 'production' | etc.
      apiKey: envConfig.posthog.key,
      apiHost: envConfig.posthog.host,
    })
  );

  return promise;
}

/** Get the singleton analytics service. Lazy — created on first call. */
export async function getAnalytics() {
  if (!analyticsPromise) {
    analyticsPromise = createAnalytics();
  }
  return analyticsPromise;
}

/** Required properties included in every City Lines event */
export const GAME_NAME = 'city_lines' as const;

const sessionStartTime = Date.now();

/** Seconds since session started */
export function getSessionElapsed(): number {
  return (Date.now() - sessionStartTime) / 1000;
}
```

### Modified: `src/app.tsx`

Replace `initPostHog()` with game-kit init.

```diff
- import { initPostHog } from '~/scaffold/lib/posthog';
+ import { getAnalytics } from '~/game/analytics';

  onMount(async () => {
    await initSentry(environment);

-   if (scaffoldConfig.posthog?.apiKey) {
-     await initPostHog(scaffoldConfig.posthog.apiKey, scaffoldConfig.posthog.apiHost);
-   }
+   await getAnalytics();

    setupGlobalErrorHandlers();
    initPauseKeyboard();
  });
```

### errorReporter strategy

Start with **Option B** (dual init — keep `scaffold/lib/posthog.ts` unchanged, both it and game-kit call `posthog.init()`). PostHog deduplicates internally. Migrate to a bridge later.

### Config cleanup

Remove redundant `posthog` field from `ScaffoldConfig` — `ENV_CONFIG` already has the per-environment PostHog config.

---

## Config flow (current → planned)

### Current

```
scaffoldConfig.posthog?.apiKey          (src/scaffold/config.ts)
  → app.tsx reads key
    → initPostHog(apiKey, apiHost)      (src/scaffold/lib/posthog.ts)
      → posthog.init()
        → errorReporter calls capture() directly
```

### Planned (when game-kit analytics ships)

```
ENV_CONFIG[env].posthog                 (src/scaffold/config/environment.ts)
  → game/analytics.ts reads config
    → GetAnalyticsServiceCommand(...)   (@wolfgames/game-kit)
      → game-kit calls posthog.init()
        → getAnalytics() returns singleton AnalyticsService
          → game code: createTracker() for typed events
          → errorReporter: still calls capture() via bridge or dual-init
```

---

## Telemetry spec mapping

The telemetry spec defines 20+ events. Game-kit's `createTracker()` will handle type-safe event creation:

```typescript
const trackLevelComplete = analytics.createTracker(
  'level_complete',
  levelCompleteValidator,
  ['game_name', 'session_elapsed'],
  {
    game_name: GAME_NAME,
    get session_elapsed() { return getSessionElapsed(); },
  }
);

trackLevelComplete({
  chapter_count: 1,
  county_theme: 'atlantic',
  level_order: 5,
  moves_used: 21,
  optimal_moves: 19,
  time_spent: 23.6,
});
```

---

## What can be done NOW (without game-kit analytics)

If we don't want to wait, we can build a lightweight typed tracker layer directly on the existing `scaffold/lib/posthog.ts`:

1. Define event types in `src/game/analytics/events.ts`
2. Create a thin `track()` function that validates properties and calls `capture()`
3. Add `GAME_NAME` and `getSessionElapsed()` as common properties
4. Wire into game code

This gives us type safety without game-kit. When game-kit analytics ships, we swap the transport layer (from raw `capture()` to `createTracker()`), keeping the event definitions.

---

*Generated: 2026-02-11, Updated: 2026-02-11*