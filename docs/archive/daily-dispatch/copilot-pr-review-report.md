# Copilot PR Review — Applicability Report

> PR #1: Phase 1-5 Engine Retrofit
> Reviewed: 2026-02-19

## Summary

GitHub Copilot flagged 8 items on the PR. Of these, **1 is a real bug** requiring an immediate fix, **2 are valid improvements**, **3 are informational/low-priority**, and **2 do not apply**.

---

## Actionable

### 1. `wolf-game-kit.json` — projectId mismatch (BUG)
| Severity | Status |
|----------|--------|
| **High** | Fix required |

**Finding:** `projectId` is still `"city_lines"` but `GAME_ID` in `src/game/config/identity.ts` is `"daily_dispatch"`. The file's own `$comment` says these must match.

**Fix:** Change `projectId` to `"daily_dispatch"`.

---

### 2. `src/game/config/environment.ts` — TBD placeholder URLs
| Severity | Status |
|----------|--------|
| **Medium** | Track for later |

**Finding:** Lines 41, 45, 47 have staging/production storage URLs pointing to `localhost:4443` with `// TBD` comments. These are intentional placeholders — the QA URL (`daily-dispatch-server-qa-storage`) is already correct for the current environment. Staging and production URLs need to be filled in when those environments are provisioned.

**Action:** No code change now. This is a deployment prerequisite, not a code bug.

---

### 3. `src/game/config/environment.ts` — hardcoded bucket name
| Severity | Status |
|----------|--------|
| **Low** | Optional improvement |

**Finding:** Copilot suggests deriving the QA bucket name from `GAME_SLUG` instead of hardcoding `daily-dispatch-server-qa-storage`. The bucket name format (`{game}-server-{env}-storage`) doesn't directly match `GAME_SLUG` (`dailydispatch` — no hyphens), so a simple template substitution wouldn't work. The current approach (explicit URLs per environment) is clearer and avoids assumptions about bucket naming conventions.

**Action:** No change. The current explicit mapping is correct and easier to maintain than a derived pattern that might not hold across all environments.

---

## Not Applicable

### 4. `src/scaffold/systems/assets/loaders/gpu/pixi.ts` — `as any` cast
| Severity | Status |
|----------|--------|
| N/A | **Read-only file** |

**Finding:** Copilot flagged an `as any` type cast in the Pixi loader for resolver cache clearing. This file is in `src/scaffold/` which is **read-only** per project rules. The cast is necessary because Pixi's internal resolver cache API is not publicly typed.

**Action:** None. Scaffold is not editable.

---

### 5. `src/game/core/screens/startView.ts` — trackGameStart parameter schema
| Severity | Status |
|----------|--------|
| N/A | **File doesn't exist at that path** |

**Finding:** Copilot referenced `src/game/core/screens/startView.ts` but this path doesn't exist. The actual start view files are:
- `src/game/dailydispatch/screens/startView.ts` (active)
- `src/game/citylines/screens/startView.ts` (legacy)

Both already use the correct `trackGameStart()` parameter schema with `{ start_source, is_returning_player, chapter_id, chapter_count, county_theme }`. The `{ firstPlay: true }` pattern Copilot described is not present anywhere in the codebase.

**Action:** None. False positive.

---

## Informational

### 6. `src/game/services/chapterCatalog.ts` — fallback chapter URL
| Severity | Status |
|----------|--------|
| **Info** | Intentional |

**Finding:** The fallback chapter URL is `patrol-1.json` instead of a generic `default.json`. This is correct — `patrol-1` is the first playable chapter of Daily Dispatch. Using a real chapter name ensures the fallback is actually playable rather than pointing to a nonexistent file.

**Action:** None.

---

### 7. `docs/factory/newgame.md` — missing template skeleton mention
| Severity | Status |
|----------|--------|
| **Info** | Nice-to-have |

**Finding:** The newgame factory doc could mention the template skeleton structure more explicitly. This is a documentation enhancement, not a code issue.

**Action:** Optional future docs improvement.

---

### 8. `docs/guides/development/code-chopper-setup.md` — command injection risk
| Severity | Status |
|----------|--------|
| N/A | **Library removed** |

**Finding:** Copilot flagged a potential command injection in an example script. The user confirmed this library is no longer in use and the doc should be removed.

**Action:** Delete the file if it references a removed dependency.

---

## Action Items

| # | Action | File | Priority |
|---|--------|------|----------|
| 1 | Change `projectId` from `"city_lines"` to `"daily_dispatch"` | `wolf-game-kit.json` | **High** |
| 2 | Track staging/production URL provisioning | `src/game/config/environment.ts` | Medium (ops) |
| 3 | Consider removing dead code-chopper doc | `docs/guides/development/code-chopper-setup.md` | Low |
