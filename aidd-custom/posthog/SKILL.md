---
name: posthog
description: >
  Integrate PostHog analytics by configuring a project-specific API key and host
  into the scaffold's existing PostHog plumbing. Use when the user provides a
  PostHog project ID, API key, or wants to connect PostHog to their game.
  Triggers on: posthog, analytics key, posthog api key, connect posthog,
  analytics integration, posthog project.
user-invocable: true
compatibility: Requires posthog-js dependency (already in package.json) and @wolfgames/game-kit.
allowed-tools: Read, Edit, Bash(*), Glob, Grep
---

# PostHog Integration

Act as a senior software engineer to wire a project-specific PostHog API key
into the scaffold's existing analytics infrastructure.

Competencies {
  PostHog JS SDK configuration
  Scaffold environment config structure
  GameKit AnalyticsService initialization
  Feature flag, error reporter, and Sentry bridge verification
}

Constraints {
  The scaffold already has full PostHog plumbing — capture, identify, feature
  flags, error reporter bridge, Sentry bridge. Do NOT recreate any of this.
  Only modify configuration values and verify the wiring works.
  Never hard-delete existing environment overrides (local/dev stay disabled).
  Do not install new packages — posthog-js is already a dependency.
}

## Inputs

The user provides:
- **API key** (required) — PostHog project API key, starts with `phc_`
- **API host** (optional) — defaults to `https://us.i.posthog.com`
- **Platform identifier** (optional) — a string identifying the game/platform in PostHog, defaults to the `gameSlug` from `wolf-game-kit.json`

## Step 1 — Validate Input

```sudolang
validateInput(apiKey, apiHost?, platform?) => config {
  1. Confirm apiKey starts with "phc_"
     - If not, ask the user to double-check — PostHog keys always start with "phc_"
  2. Default apiHost to "https://us.i.posthog.com" if not provided
  3. Read `wolf-game-kit.json` at project root for gameSlug
  4. Default platform to the gameSlug value if not provided
  5. Show the user the resolved config and ask for confirmation:
     - API Key: phc_••••<last4>
     - Host: <host>
     - Platform: <platform>
}
```

## Step 2 — Update Environment Config

**File:** `src/core/config/environment.ts`

Replace the `SHARED_CONFIG.posthog` values:

```typescript
const SHARED_CONFIG = {
  posthog: {
    enabled: true,
    key: "<API_KEY>",
    host: "<API_HOST>",
    platform: "<PLATFORM>",
  },
};
```

The per-environment overrides in `ENV_CONFIG` should remain untouched — local and
development stay `enabled: false`, qa/staging/production inherit from SHARED_CONFIG.

## Step 3 — Update Scaffold Config

**File:** `src/core/config.ts`

Uncomment and populate the `posthog` field in `scaffoldConfig`:

```typescript
export const scaffoldConfig: ScaffoldConfig = {
  engine: "pixi",
  debug: import.meta.env.DEV,
  sentry: {
    dsn: "...",  // leave existing DSN untouched
  },
  posthog: {
    apiKey: "<API_KEY>",
    apiHost: "<API_HOST>",
  },
};
```

## Step 4 — Verify Build

```sudolang
verifyBuild() => pass | fail {
  1. Run `bun run typecheck`
  2. pass => continue to verification
  3. fail => read errors, fix, re-run until clean
}
```

## Step 5 — Verify Wiring

Confirm the existing plumbing connects correctly by reading these files and
checking that they reference the PostHog instance. Do NOT modify them — just
verify they exist and have the expected imports/calls:

```sudolang
verifyWiring() => report {
  checks = [
    // Analytics state initializes PostHog and distributes the instance
    { file: "src/core/systems/analytics/state.ts",
      expect: "initialize() calls GetAnalyticsServiceCommand and sets the PostHog instance" },

    // PostHog bridge receives the instance for scaffold-level access
    { file: "src/core/lib/posthog.ts",
      expect: "setPostHogInstance, capture, identify, setPersonProperties exports" },

    // Error reporter uses the PostHog bridge
    { file: "src/core/systems/errors/reporter.ts",
      expect: "imports capture/identify from posthog bridge" },

    // Feature flags consume PostHog instance from analytics context
    { file: "src/core/systems/feature-flags/context.tsx",
      expect: "reads analytics.posthog() and calls isFeatureEnabled/getFeatureFlag" },

    // Sentry bridge connects error tracking to PostHog
    { file: "src/core/lib/sentry.ts",
      expect: "connectSentryToPostHog function exists" },

    // Analytics lib caches PostHog instance
    { file: "src/core/lib/analytics.ts",
      expect: "cachePostHogInstance and getCachedPostHog exports" },
  ]

  for check in checks {
    Read(check.file)
    verify(check.expect)
    report pass/fail per check
  }

  Print summary table of all checks.
}
```

## Output

Present to the user:

```
PostHog configured:
  API Key:   phc_••••<last4>
  Host:      <host>
  Platform:  <platform>

Files modified:
  - src/core/config/environment.ts  (SHARED_CONFIG.posthog values)
  - src/core/config.ts              (scaffoldConfig.posthog uncommented)

Wiring verified:
  ✓ analytics/state.ts      — initializes PostHog via GameKit
  ✓ lib/posthog.ts          — bridge for scaffold systems
  ✓ errors/reporter.ts      — sends errors to PostHog
  ✓ feature-flags/context   — reads flags from PostHog
  ✓ lib/sentry.ts           — Sentry↔PostHog bridge
  ✓ lib/analytics.ts        — instance caching

Environments:
  local / development  → PostHog disabled
  qa / staging / prod  → PostHog enabled
```

Commands {
  /posthog - integrate a PostHog API key into the scaffold's analytics system
}

### Exit Criteria (Given/Should)

- Given `src/core/config/environment.ts` is read, SHARED_CONFIG.posthog.key should equal the provided API key
- Given `src/core/config/environment.ts` is read, SHARED_CONFIG.posthog.host should equal the provided or default host
- Given `src/core/config.ts` is read, scaffoldConfig.posthog should be uncommented with the correct apiKey and apiHost
- Given `bun run typecheck` is run, should produce zero errors
- Given ENV_CONFIG.local.posthog.enabled is checked, should be false
- Given ENV_CONFIG.production.posthog.enabled is checked, should be true (inherited from SHARED_CONFIG)
- Given all 6 wiring verification files are read, each should contain the expected PostHog integration points
