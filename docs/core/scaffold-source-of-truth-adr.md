# ADR: Scaffold Source of Truth & Distribution Model

**Status**: PROPOSED
**Date**: 2026-03-11
**Linear**: [ENG-1674](https://linear.app/wolfgames/issue/ENG-1674/source-management-scaffold-source-of-truth-and-documentation)
**Author**: Daniel Costa
**Downstream**: [ENG-1684](https://linear.app/wolfgames/issue/ENG-1684/source-management-scaffold-version-control-modules) (implementation), [ENG-1726](https://linear.app/wolfgames/issue/ENG-1726/source-management-scaffold-update-workflow-and-automation) (automation)

---

## Context

Scaffold is a 3-tier game framework (`core/` → `modules/` → `game/`) that lives in the `scaffold-production` repo. Games are created by forking the entire repo and replacing `src/game/`. This works for initial creation but has no mechanism for pulling scaffold updates into an existing game repo.

### Current State

| Aspect | How It Works Today |
|--------|-------------------|
| **Canonical location** | `wolfgames/scaffold-production` on GitHub |
| **Consumption model** | Full repo fork — clone, delete `src/game/*`, build new game |
| **Boundary enforcement** | Soft only — `.claude/settings*.json` (3 permission modes: design/dev/admin). Enforced for AI agents, invisible to `vite build` or CI |
| **Public API** | `src/core/index.ts` barrel re-exports ~50 symbols (systems, UI, utils, analytics, dev tools) |
| **Import alias** | `~` → `src/` via Vite. All code uses `~/core/`, `~/modules/`, `~/game/` |
| **Per-game fork points** | 6 files change per game (see table below) |
| **Versioning** | None. `SCAFFOLD_MANIFEST.yml` contains AIDD setup steps, not a version |
| **Existing npm packages** | `@wolfgames/game-kit` (v0.0.41) and `@wolfgames/components` (v0.0.1) — the team already publishes shared code to npm |
| **Asset system** | Recently refactored to wrap `@wolfgames/components` via a GC adapter layer (`src/core/systems/assets/gc/`) |
| **Testing infra** | Vitest (unit), Playwright (E2E), and an evaluation framework for testing scaffold modifications against games |
| **Tech stack** | Solid.js + Vite + Pixi.js v8 + GSAP + Howler.js + Tailwind CSS |

### Per-Game Fork Points

These are the only files a game needs to change when forking scaffold:

| File | What Changes |
|------|-------------|
| `index.html` | Font `<link rel="preload">` path |
| `src/app.tsx` | `GAME_DEFAULTS` import, `manifest`/`defaultGameData` imports |
| `src/app.tsx` | `AnalyticsProvider` and `FeatureFlagProvider` from `~/game/setup/` |
| `src/game/config.ts` | Game identity, CDN paths, manifest, screen wiring, data types |
| `src/game/tuning/` | Game-specific tuning schema and defaults |
| `wolf-game-kit.json` | GameKit project ID and slug |

### Pain Points

1. **No update path** — Once a game is forked, scaffold improvements don't flow downstream. Each game diverges.
2. **No versioning** — No way to know which scaffold version a game is running, or whether it's behind.
3. **Soft boundary only** — A developer (or AI agent in admin mode) can edit `src/core/` in a game repo with no guardrail. No build error, no lint warning.
4. **AIDD workflow consideration** — Daniel flagged the need to sync with William on how Scaffold is used in AI-assisted game building. The distribution model must not break the AIDD pattern where Claude Code has full repo context.

---

## Decision

### 1. Distribution Model: Template Repo + Git-Based Sync

**Chosen**: `scaffold-production` remains a **template repository**. Games are created by forking/cloning it. Scaffold updates are synced into game repos using a **hybrid git workflow**: selective checkout for routine updates, full merge for major versions.

**How it works — two modes**:

#### Routine updates (selective checkout — no conflicts)

For regular scaffold improvements (bugfixes, new modules, system tweaks), pull only the scaffold-owned paths. This is conflict-free because games never edit these directories:

```bash
# One-time setup: add scaffold as a remote
git remote add scaffold git@github.com:wolfgames/scaffold-production.git

# Pull scaffold updates (routine)
git fetch scaffold
git checkout scaffold/main -- src/core/ src/modules/
# Optionally pull root config updates:
git checkout scaffold/main -- vite.config.ts tsconfig.json vitest.config.ts evaluation/

# Commit the update and record the sync point
git add -A
git commit -m "chore: sync scaffold to $(git rev-parse --short scaffold/main)"
```

**Why this works**: `src/core/` and `src/modules/` are read-only in game repos by convention. Overwriting them with the latest scaffold version is always safe — there are no local changes to lose. Zero conflicts, zero merge resolution.

**What it skips**: `src/game/`, `src/app.tsx`, `index.html`, `package.json` — files where both scaffold and game have diverged. These are intentionally left untouched.

#### Major version bumps (full merge — conflicts expected)

When scaffold releases a breaking change (new provider in `app.tsx`, changed game contract, updated `package.json` deps), use a full merge to get git's conflict detection:

```bash
git fetch scaffold
git merge scaffold/main
# Resolve conflicts in app.tsx, package.json, index.html
# src/game/** conflicts: always keep game side (ours)
```

Expected conflict zones and how to resolve:

| File | Conflict type | Resolution |
|------|--------------|------------|
| `src/app.tsx` | Provider stack changed | Manual — review scaffold's new providers, merge into game's wiring |
| `package.json` | New scaffold deps | Manual — accept scaffold's new deps, keep game's deps |
| `index.html` | Rarely conflicts | Accept scaffold side unless game changed the `<head>` |
| `src/game/**` | Always conflicts (both sides modified) | Always keep game side — scaffold's template skeleton is irrelevant |
| `src/core/`, `src/modules/` | Never conflicts | Auto-merges cleanly (game side has no changes) |

> **Tip**: To auto-resolve `src/game/` conflicts in favor of the game, add to `.gitattributes`:
> ```
> src/game/** merge=ours
> ```

**Relationship to `@wolfgames/components`**: The team is already extracting low-level primitives (asset loading, rendering adapters) into `@wolfgames/components` as an npm package. This is complementary, not competing — `@wolfgames/components` provides engine-level building blocks that scaffold's `core/` layer wraps with framework context (providers, hooks, dev tools). The template-repo model governs the scaffold framework; npm packages govern engine primitives. Both can coexist and evolve independently.

**Why this model over alternatives**:

| Model | Verdict | Reason |
|-------|---------|--------|
| **Template + hybrid git sync** | **Chosen** | Zero tooling change. Games keep full repo context (critical for AIDD). Routine updates are conflict-free. Major updates get git's conflict detection. |
| Git subtree | Rejected | Adds cognitive overhead (`git subtree pull`). History grafting is fragile. No real advantage over selective checkout. |
| Git submodule | Rejected | Breaks AIDD workflow — Claude Code cannot see submodule contents without extra setup. Vite alias `~` → `src/` breaks if core is a submodule. |
| npm package (scaffold as pkg) | Rejected | Would require extracting `src/core/` and `src/modules/` into a separate installable package. Breaks the `~/core/` import alias. Loses inline source reading (critical for debugging and AIDD context). Different from `@wolfgames/components` which provides engine primitives, not framework structure. |
| Monorepo | Rejected | Adds workspace tooling complexity (Turborepo/Nx). Overkill for the current 1-scaffold + 2-games scale. Could revisit if the number of games grows past ~5. |
| Full merge only | Rejected | Guaranteed `src/game/` conflicts on every sync, even for trivial scaffold patches. Unnecessary friction for routine updates. |

### 2. Versioning: Single Version, Scaffold + Modules Together

**Decision**: Core and modules share a **single semantic version** tracked in `package.json` via a new `scaffold.version` field. Games record which scaffold version they were last synced from.

```jsonc
// scaffold-production/package.json (scaffold repo)
{
  "scaffold": {
    "version": "1.0.0"
  }
}
```

```jsonc
// my-game/package.json (game repo, after merge)
{
  "scaffold": {
    "version": "1.0.0",
    "syncedAt": "2026-03-11",
    "syncedFrom": "e7b7270"  // scaffold commit hash
  }
}
```

**Rationale**:

- **Single version for core + modules**: They share the same repo, the same release cadence, and the same Vite build. Separate versioning adds bookkeeping with no practical benefit at this scale.
- **Semver**: `MAJOR` = breaking API changes (hook signatures, provider contract). `MINOR` = new features (new module, new core system). `PATCH` = bugfixes.
- **Games track sync state**: The `syncedFrom` commit hash lets a game know exactly how far behind it is (`git log syncedFrom..scaffold/main`).
- **No version pinning**: Games don't "pin" a version — they merge when ready. The git history IS the version pin.
- **npm packages version independently**: `@wolfgames/components` and `@wolfgames/game-kit` follow their own semver in npm. Scaffold version tracks the framework, not the underlying packages.

### 3. Boundary Enforcement: Layered Soft Enforcement

**Decision**: Keep the current `.claude/settings*.json` approach as the primary boundary enforcement, augmented with additional soft layers. No hard packaging boundary.

#### Layer 1: AI Agent Enforcement (existing)

`.claude/settings*.json` with design/dev/admin modes. This is the most effective boundary because the AIDD workflow is the primary way code gets written.

```
Design mode:  can edit game/ only
Dev mode:     can edit game/ + modules/
Admin mode:   unrestricted
```

#### Layer 2: Biome Lint Rule (new)

Add a Biome lint rule that flags imports crossing the boundary in the wrong direction. This catches human developers and provides a CI-enforceable check.

```jsonc
// biome.json — import boundary rule
// core/ must not import from modules/ or game/
// modules/ must not import from game/
```

> Implementation details deferred to ENG-1684.

#### Layer 3: Evaluation Framework (existing, expand)

The recently added evaluation suite (`evaluation/`) already tests scaffold modifications against games in a before/after pattern. This can be expanded to serve as a regression gate:

- Run evaluation suite when merging scaffold updates into a game repo
- Catch breaking changes in asset loading, screen rendering, and bundle behavior
- The `modification-suites.ts` pattern supports adding new test categories

> Expansion details deferred to ENG-1726.

**Why not hard enforcement via packaging**:

- Packaging `core/` as an npm module would break the `~/core/` import alias used everywhere
- It would remove the ability to read and debug core source inline (critical for AIDD)
- The team is small enough that convention + lint + code review is sufficient
- The evaluation framework provides runtime validation that packaging alone cannot
- If the team grows past ~10 engineers or ~5 game repos, revisit packaging

---

## Consequences

### What This Enables

1. **ENG-1684** can implement the hybrid sync workflow (selective checkout scripts, merge guide for major versions)
2. **ENG-1726** can automate the routine sync (`git fetch scaffold && git checkout scaffold/main -- src/core/ src/modules/`), surface "N commits behind" alerts, and expand the evaluation framework for merge validation
3. Games can stay on older scaffold versions safely and merge forward when ready
4. The AIDD workflow is preserved — Claude Code always has full repo context including core source
5. `scaffold.version` in package.json provides a clear "what version am I on?" answer
6. `@wolfgames/components` continues evolving independently as an engine-level package consumed by scaffold's core layer

### What This Doesn't Solve

1. **Automatic migration** — If a scaffold update changes a hook signature, games must manually update their `app.tsx`. Migration scripts (if needed) are scoped to ENG-1726.
2. **Breaking change detection** — The evaluation framework catches runtime regressions, but not compile-time API changes. A CI check that type-checks a game against new scaffold types could be added later.
3. **AIDD alignment** — Daniel's comment about syncing with William on AIDD usage is still pending. The template-repo model is compatible with all AIDD patterns, but specific AIDD workflow docs should be written after that sync.

### Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Merge conflicts in `app.tsx` during major version sync | Medium | Only use full merge for major versions. Document the 6 fork points. Consider extracting game wiring to a config object to shrink `app.tsx` conflict surface. |
| Games never sync scaffold updates | Medium | Automation (ENG-1726) should surface "you are N commits behind scaffold" in CI/dashboard. Routine syncs are frictionless (selective checkout). |
| Selective checkout overwrites local core/ edits | Low | Games should never edit core/. AI settings + Biome lint prevent this. If a game did edit core/, the overwrite is the correct behavior. |
| Core boundary violated by humans | Low | Biome lint + evaluation framework. Small team means social enforcement works. |
| `@wolfgames/components` version breaks scaffold | Low | Pin `@wolfgames/components` version in scaffold's `package.json`. Evaluation suite catches runtime regressions. |
| Scale outgrows this model (>5 games) | Low (near term) | Revisit npm packaging or monorepo if/when this happens. The version field and git history make migration tractable. |

---

## Appendix A: Scaffold Public API

The barrel export (`src/core/index.ts`) is the de facto public API. Any symbol not exported from `index.ts` is internal to core.

Current exports (~50 symbols):
- **Systems**: `useAssets`, `useScreen`, `useTuning`, `useAudio`, `usePause`, `ManifestProvider`
- **UI**: `Button`, `ProgressBar`, `Spinner`, `Logo`, `PauseOverlay`, `MobileViewport`
- **Utils**: `getStored`, `setStored`, `removeStored`, `createVersionedStore`
- **Dev**: `TuningPanel`, `TweakpaneConfig`
- **Analytics**: `getAnalytics`, `resetAnalytics`, `baseParamsSet`, event schemas
- **Config**: `getEnvironment`, `getCdnBaseUrl`, `isLocal`, `isProduction`
- **Errors**: `GlobalBoundary`, `setupGlobalErrorHandlers`
- **Asset GC**: `ScaffoldCoordinatorFromGc` (wraps `@wolfgames/components`)

## Appendix B: Game Contract

What a game must provide for scaffold to function:

| Export | Source File | Consumed By |
|--------|-----------|-------------|
| `gameConfig.screens` | `game/config.ts` | `ScreenProvider` in `app.tsx` |
| `manifest` | `game/config.ts` | `ManifestProvider` in `app.tsx` |
| `defaultGameData` | `game/index.ts` | `ManifestProvider` in `app.tsx` |
| `GAME_DEFAULTS` | `game/tuning/` | `TuningProvider` in `app.tsx` |
| `AnalyticsProvider` | `game/setup/` | `app.tsx` provider stack |
| `FeatureFlagProvider` | `game/setup/` | `app.tsx` provider stack |

## Appendix C: Enforcement Inventory

| File | Layer | Purpose |
|------|-------|---------|
| `.claude/settings.design.json` | AI (existing) | AI: game/ only |
| `.claude/settings.dev.json` | AI (existing) | AI: game/ + modules/ |
| `.claude/settings.admin.json` | AI (existing) | AI: unrestricted |
| `biome.json` | Lint (ENG-1684) | Import boundary rules |
| `evaluation/` | Runtime (existing) | Before/after scaffold modification testing |
| `tests/` | Unit (existing) | Vitest unit tests for core systems |
| `e2e/tests/` | E2E (existing) | Playwright smoke and behavior tests |

---

*This ADR documents decisions only. Implementation is tracked in [ENG-1684](https://linear.app/wolfgames/issue/ENG-1684/source-management-scaffold-version-control-modules) and [ENG-1726](https://linear.app/wolfgames/issue/ENG-1726/source-management-scaffold-update-workflow-and-automation).*
