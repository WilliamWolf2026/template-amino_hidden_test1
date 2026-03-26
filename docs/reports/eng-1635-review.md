# ENG-1635 Review Report — Amino Migration: Config

**Date**: 2026-03-25
**PRs**: game-kit #57, template-amino-js #12
**Reviewer**: eronwolf

## PR Comments Summary

### game-kit PR #57 — `url-factories.ts`

| # | File | Comment | Actionable? |
|---|---|---|---|
| 1 | `url-factories.ts:7` | CDN has hardcoded defaults but auth/api hosts return empty string — inconsistent. CDN should pull from `.env` like the others. | Yes |
| 2 | `url-factories.ts:38` | Functions don't need their own file — fold them into `BaseConfigService` so they're co-located with the service that uses them. | Yes |

### template-amino-js PR #12 — `environment.ts`

| # | File | Comment | Actionable? |
|---|---|---|---|
| 3 | `environment.ts:22` | Use game-kit's `Environment` enum directly instead of defining a separate string union type and mapping between them. | Yes |
| 4 | `environment.ts:35` | Infra-side: `VITE_APP_ENV` should match game-kit `Environment` enum values so no mapping is needed. Not actionable in code right now. | No (infra) |
| 5 | `environment.ts:76` | PostHog key and platform are hardcoded — should be removed by the analytics ticket (ENG-1622). | No (ENG-1622) |
| 6 | `environment.ts:104` | The entire `ENV_CONFIG` object could live in game-kit and just be imported, instead of amino rebuilding it. | Yes |

## Proposed Changes

### game-kit

1. **Merge `url-factories.ts` into `base-config.service.ts`** — move `getCdnHost`, `getAuthHost`, `getApiHost`, `buildCdnUrl` and the `DEFAULT_CDN_HOST_MAP` into `base-config.service.ts`. Delete `url-factories.ts`. Update `modules/index.ts` to export from the new location.

2. **Make CDN consistent** — CDN host should read from env vars (`PROD_STORAGE_HOST`, etc.) the same way auth and API hosts do, with the `media.*.wolf.games` defaults as fallback only when env var is empty.

3. **Add `EnvConfig` factory to game-kit** — expose a `buildEnvConfig(env: Environment)` or a pre-built `ENV_CONFIG` record so templates don't need to assemble it themselves. This would include CDN URL, server URL, and a slot for analytics config.

### template-amino

4. **Use `Environment` enum directly** — replace the `type Environment = "local" | "development" | ...` string union with game-kit's `Environment` enum. Drop `ENV_MAP` and `toGameKitEnvironment()`.

5. **Import `ENV_CONFIG` from game-kit** — once game-kit exposes it, amino just imports and optionally extends (e.g. adding PostHog config). Delete `buildEnvConfig()` from amino.

### Deferred (not this ticket)

- **PostHog hardcoded key/platform** — tracked by ENG-1622
- **`VITE_APP_ENV` value alignment** — infra-side change, noted for future

## Current State

Both PRs are open and on branch `jesse/eng-1635-amino-migration-config`. Comments have not been addressed yet.
