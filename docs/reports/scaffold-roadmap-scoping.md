# Scaffold Roadmap — Scoping Report

Expanded scope, complexity assessment, and status for each proposed enhancement.

---

## Status Overview

| # | Item | Status | Complexity |
|---|------|--------|------------|
| 1 | Biome (linter/formatter) | Done | — |
| 2 | New game bootstrap (single source of truth) | Done | — |
| 3 | Remove game-specific code | Done | — |
| 4 | Version control (modules + scaffold) | TBD | High |
| 5 | Telemetry auto deploy | Not started | Medium |
| 6 | Environments auto setup | Not started | Medium-High |
| 7 | Scaffold as source of truth | In progress | Medium |
| 8 | Scaffold auto-update for existing games | Not started | High |
| 9 | Tuning system overhaul | Not started | High |
| 10 | Asset (manifest) loader | Not started | Medium |
| 11 | Vibe coding asset pipeline | Not started | Medium-High |
| 12 | Semantic router | Exploration | Low-Medium |
| 13 | VFX / particles | Not started | Medium |

---

## Completed Items

### 1. Biome (linter/formatter) — DONE

Standardized formatting and linting across scaffold, games, and game-kit. Config aligned across repos. Contributors run the same checks locally and in CI.

### 2. New game bootstrap (single source of truth) — DONE

Game identity (name, slug, ID) is set once in `src/game/config.ts` and flows to analytics, storage keys, environment URLs, and manifest paths. The `mygame/` template is the starting point; archive holds reference implementations.

**Note:** The factory docs (`docs/factory/newgame.md` and `docs/guides/getting-started/new-game.md`) are stale — they still reference `scaffold/`, `src/game/config/identity.ts`, `src/game/shared/`, and `src/game/citylines/`. These need updating to reflect the Amino refactor (core/, modules/, mygame/, archive/).

### 3. Remove game-specific code — DONE

CityLines and DailyDispatch moved to `src/game/archive/`. Shared components extracted to `src/modules/`. The scaffold template (`mygame/`) is game-agnostic with placeholder bridges.

---

## Active / In Progress

### 7. Scaffold as the source of truth

**Status:** In progress — the architecture is there, but the boundary isn't enforced.

**What exists today:**
- Three-tier architecture (`core/` → `modules/` → `game/`) with clear dependency rules
- `core/` is marked read-only in CLAUDE.md and `.claude/settings.*.json`
- Modules are shared building blocks with no game deps

**What's still needed:**

- **Publish boundary**: Right now "scaffold" is a folder in a monorepo. There's no mechanism to prevent a game repo from editing core files, and no way to receive scaffold updates independently. This ties into items #4 and #8.
- **Upstream discipline**: A process or convention for proposing changes back to scaffold rather than patching locally. Could be as simple as a PR label convention + branch strategy, or as formal as a separate package.
- **Drift detection**: Some way to know when a game repo's core/ has diverged from the canonical scaffold.

**Depends on:** Version control strategy (#4), auto-update mechanism (#8).

---

## Not Started

### 4. Version control (modules + scaffold structure)

**Complexity: High** — this is an architectural decision that affects everything downstream.

**The core question:** How do scaffold and modules get versioned and distributed across game repos?

**Options to scope:**

| Approach | Pros | Cons |
|----------|------|------|
| **Git subtree** | Games carry scaffold source directly; easy to read/debug | Merge conflicts on update; manual sync |
| **Git submodule** | Clean separation; pinned versions | DX friction; detached HEAD confusion; CI complexity |
| **npm/bun package** | Standard versioning (semver); clean dependency | Can't easily read/edit scaffold source during dev; build step needed |
| **Template repo + migration scripts** | Simple start; full control | No automatic updates; drift inevitable |
| **Monorepo (Turborepo/Nx)** | All code in one place; atomic changes | Requires all games in one repo; doesn't fit fork model |

**Decisions needed:**
- Should scaffold and modules be versioned together or separately?
- Do games pin to a specific scaffold version, or always track latest?
- How do module-level updates propagate without breaking game code?
- Does the current `core/` read-only convention become a hard boundary (package) or stay soft (convention)?

**Downstream impact:** Affects #7 (source of truth), #8 (auto-update), and #5/#6 (auto-provisioning on new game creation).

---

### 5. Telemetry auto deploy (PostHog + Sentry)

**Complexity: Medium** — mostly automation/scripting, not architecture.

**What exists today:**
- PostHog client in `src/core/lib/posthog.ts` — initialized manually with project key
- Sentry client in `src/core/lib/sentry.ts` — initialized manually with DSN
- Game Kit has Sentry commands (`InitSentryCommand`, `ConnectTrackerCommand`) but no PostHog analytics module yet (blocked — see `docs/reports/game-kit-integration-plan.md`)
- Analytics context in `src/game/setup/AnalyticsContext.tsx` reads from environment config
- Feature flags in `src/game/setup/FeatureFlagContext.tsx` read from PostHog

**Scope:**
- **Project creation automation**: Script or CLI that creates a PostHog project + Sentry project for a new game, using their respective APIs
- **Key injection**: Generated keys (PostHog project key, Sentry DSN) written to environment config or `.env` files automatically
- **Game Kit flow**: Once game-kit ships its analytics module, keys should flow through Game Kit's init commands rather than raw env vars
- **Per-environment keys**: Dev/QA/staging/prod each need their own project or at minimum their own environment tag

**Deliverables:**
- CLI command or script: `bun run setup:telemetry --game=<slug>`
- PostHog API integration (create project, get key)
- Sentry API integration (create project, get DSN)
- Template `.env` generation with the correct values
- Documentation for manual setup as fallback

---

### 6. Environments auto setup

**Complexity: Medium-High** — touches infrastructure, DNS, CI/CD, and secrets management.

**What exists today:**
- Environment detection in `src/core/config/environment.ts` — reads `VITE_APP_ENV`
- Environment config doc at `docs/guides/deployment/environment-config.md`
- Deploy factory command at `docs/factory/deploy.md`
- No automation — environments are set up by hand

**Scope:**
- **Consistent shape**: Every game gets the same environment structure (local, dev, QA, staging, production) with predictable naming (`<slug>-dev.wolfgames.com`, etc.)
- **Provisioning script**: Given a game slug, create the hosting targets (Vercel projects, GCS buckets, or whatever the infra is) with correct env vars
- **DNS automation**: Create subdomain records pointing to the correct hosting
- **CI/CD templates**: Generate GitHub Actions workflows (or equivalent) pre-configured for the new game's environments
- **Secrets flow**: Telemetry keys (#5), CDN paths, API endpoints injected per-environment

**Deliverables:**
- CLI command: `bun run setup:environments --game=<slug>`
- Infrastructure-as-code templates (or API scripts) for hosting provider
- CI/CD workflow templates
- Environment variable matrix documentation

**Depends on:** Telemetry auto deploy (#5) for key injection. Version control strategy (#4) for CI/CD shape.

---

### 8. Scaffold auto-update for existing games

**Complexity: High** — the hardest item on the list. Requires both a technical mechanism and a migration strategy.

**The problem:** When scaffold improves (new system, bug fix, performance optimization), existing games should benefit without manual copy-paste. Currently there's no update path — games fork and diverge.

**Scope:**

- **Update mechanism** (depends heavily on #4):
  - If npm package: `bun update @wolfgames/scaffold` + migration guide per version
  - If git subtree: `git subtree pull` + conflict resolution
  - If template: migration scripts that diff and patch

- **Breaking change management**:
  - Scaffold changes can break game code at the `core/` ↔ `game/` boundary (hooks, providers, types)
  - Need a changelog or migration guide per scaffold version
  - Potentially: codemods that auto-transform game code for known breaking changes

- **Non-breaking update path**:
  - New systems/features should be additive (game doesn't use it = game isn't affected)
  - Deprecation warnings before removal
  - Version field in tuning types (`GameTuningBase.version`) could gate migrations

- **Module updates**:
  - Modules (`src/modules/`) are a separate concern — a module update (e.g., new SpriteButton renderer) shouldn't require a scaffold update
  - But modules depend on core types, so core updates may require module updates

**Deliverables:**
- Decision on update mechanism (tied to #4)
- Changelog/migration guide format
- Versioning scheme (semver for scaffold, semver for modules, or unified)
- Optional: codemod tooling for common migrations
- Smoke test script that validates a game still builds/runs after scaffold update

---

### 9. Tuning system overhaul

**Complexity: High** — touches core, modules, game, dev tools, and the runtime data flow.

**What exists today:**
- Three-tier tuning: core (`ScaffoldTuning`) → modules (per-module `tuning.ts`) → game (`GameTuning`)
- Storage: `tuning_scaffold` and `tuning_game` in localStorage, with JSON file fallbacks in `public/config/tuning/`
- Dev panel: Tweakpane-based `TuningPanel.tsx` with auto-detection of control types (sliders, color pickers, easing pickers)
- Wired/unwired tracking: `tuningRegistry.ts` marks which paths are connected to `createEffect`
- Module tuning schemas exist (sprite-button, progress-bar, dialogue-box, character-sprite, avatar-popup, level-completion) but their connection to the panel is not fully automatic

**Pain points to address:**

1. **Module registration is implicit**: Each module exports a `tuning.ts`, but there's no auto-discovery or registry that collects them. The panel needs to know about them somehow — currently seems manual.

2. **"Tune what you see" vs. "tune ahead of time"**: Right now all tunables show in one flat panel. No concept of scoping the panel to what's currently active on screen vs. showing everything.

3. **Wired/unwired is fragile**: The registry in `tuningRegistry.ts` is a manual `Set` of string paths. Easy to forget, easy to drift.

4. **Panel UX**: No filtering, no search, no grouping beyond folder structure. As modules grow, the panel becomes unwieldy.

**Scope:**

- **Auto-registration**: Modules declare their tuning schema; the system discovers and registers them automatically (import-time registration, or a build-step manifest)
- **Scoped view**: Panel mode that shows only tunables relevant to what's currently rendered (requires runtime tracking of which modules are active)
- **Pre-tune mode**: Panel mode that shows all tunables, even for modules not currently on screen, so designers can set values before navigating to that screen
- **Panel controls**: Pause/lock the current view (freeze the game to tune without state advancing), filter by module/category, search by parameter name
- **Wiring improvements**: Either auto-detect wired paths (via reactive subscriptions) or generate the registry from code analysis
- **Storage simplification**: Consider unified storage with namespacing rather than separate `tuning_scaffold` / `tuning_game` keys

**Deliverables:**
- Module tuning auto-registration mechanism
- Panel UI: scoped view, filter/search, pause control
- Wired path detection (automatic or improved manual)
- Updated tuning docs
- Migration path from current system

---

### 10. Asset (manifest) loader evolution

**Complexity: Medium** — the architecture is solid, this is about smoothing edges.

**What exists today:**
- Manifest-driven loading via `AssetCoordinator` with three loader types (DOM, GPU, Audio)
- Bundle prefixes determine loader routing (`boot-` → DOM, `core-` → GPU, `audio-` → Audio, etc.)
- GPU loader is Pixi-specific (`PixiLoader`); the architecture doc says "engine-agnostic" but only Pixi is implemented
- Asset types inferred from file extension
- Loading phases: boot → theme → GPU init → core → audio → scene → deferred

**Scope:**

- **Multi-renderer GPU loaders**: The `GpuLoader` interface exists but only `PixiLoader` is implemented. Adding Phaser/Three.js loaders (like we did with SpriteButton renderers) would complete the engine-agnostic promise. This means a `PhaserLoader` and `ThreeLoader` alongside `PixiLoader`.

- **Manifest ergonomics**: Currently assets are string paths in bundle arrays. Consider:
  - Type-safe manifest with autocomplete (generated from `public/assets/` directory)
  - Manifest validation (does the file actually exist? are referenced sprites in the atlas?)
  - Manifest splitting (per-screen or per-feature manifests that compose)

- **Dynamic asset discovery**: For vibe-coding workflows (#11), support dropping files into a directory and having them auto-discovered without manual manifest entries.

- **Loading progress granularity**: Current progress is per-bundle. Finer-grained per-asset progress would improve loading screen UX.

- **CDN / versioning**: Cache-busting strategy, CDN path composition, asset versioning beyond filename conventions.

**Deliverables:**
- GPU loader interface formalization + at least one additional loader (Phaser or Three.js)
- Manifest validation tooling (CLI or build-time)
- Manifest generation from directory structure (optional/additive)
- Loading progress improvements
- Updated asset system docs

---

### 11. Vibe coding asset pipeline

**Complexity: Medium-High** — workflow design + tooling, not just code.

**What exists today:**
- TexturePacker-based atlas pipeline (manual export)
- Audio sprites via Howler JSON format (manual creation)
- Assets live in `public/assets/` with naming conventions documented in `docs/guides/assets/`
- No build step between raw assets and production assets

**The two-mode vision:**

**Mode 1 — Raw/Vibe (early development):**
- Drop individual PNGs, MP3s, JSON files into a known directory
- Loader picks them up directly — no atlas packing, no audio spriting
- Instant iteration: change a sprite, refresh, see it
- Naming convention is loose — `my-button.png` just works
- Manifest is auto-generated from directory contents

**Mode 2 — Production (shipping):**
- Assets are packed into atlases (TexturePacker or equivalent)
- Audio files are sprited (single file + offset map)
- Images are optimized (compression, format selection, size variants)
- Manifest is generated from build output with content hashes
- CDN-ready paths with cache busting

**The bridge between modes:**
- A build command that takes raw assets and produces production bundles
- The game code doesn't change — the loader abstraction handles both
- Convention: `public/assets/raw/` for vibe mode, `public/assets/packed/` for production
- Build step: `bun run assets:pack` produces packed from raw

**Scope:**
- Define the raw asset directory convention and auto-discovery rules
- Loader changes to support both individual files and packed atlases transparently
- Asset build tooling (TexturePacker CLI integration, audio sprite generator, image optimizer)
- CLI commands: `bun run assets:pack`, `bun run assets:validate`
- Documentation: workflow guide for both modes

**Deliverables:**
- Raw asset auto-discovery loader mode
- Asset build pipeline (pack, sprite, optimize)
- CLI commands
- Workflow documentation
- Migration guide for existing projects

---

### 12. Semantic router

**Complexity: Low-Medium** — exploration / convention work, not heavy implementation.

**What exists today:**
- `@wolfgames/semantic-router` package at `^0.1.2` in package.json
- INDEX.md files throughout the codebase act as semantic routing tables (intent → path)
- Module structure uses category-based naming (primitives, logic, prefabs)
- Factory commands use intent-based naming (`/research`, `/debug`, `/commit`)

**The idea:** Map design language and labels to engineering concepts so that when a designer says "the bounce effect on the play button," the system (or an AI agent) can route to `src/modules/primitives/sprite-button/defaults.ts → pressScale, pressDuration`.

**Scope:**
- **Vocabulary mapping**: A registry that connects human-readable terms (design language) to code paths. "Button press feel" → tuning params. "Loading spinner" → core/ui/Spinner.tsx.
- **INDEX.md as the foundation**: The existing intent → path tables are already a form of semantic routing. Formalize this pattern and make it machine-readable (JSON or structured markdown).
- **Integration with tooling**: AI agents (Claude Code), factory commands, and the tuning panel could all consume the same semantic map.
- **Cross-repo consistency**: If multiple game repos share scaffold, the semantic vocabulary should be consistent across them.

**Deliverables:**
- Formalized semantic map format (building on INDEX.md pattern)
- Vocabulary registry for design ↔ engineering terms
- Integration points identified (AI agents, tuning panel, docs)
- Guidelines for maintaining the vocabulary as the codebase grows

---

### 13. VFX / particles

**Complexity: Medium** — integration work, not from-scratch implementation.

**What exists today:**
- Particle runtime in `src/core/systems/vfx/particleRuntime.ts`
- VFX types in `src/core/systems/vfx/types.ts` (ParticleConfig, SpawnerData)
- Default particle effect at `public/assets/vfx/effects/default.json`
- VFX bundles use `fx-` prefix in manifest for loader routing
- No VFX module in `src/modules/` yet — it's all in core

**Scope:**

- **Asset compatibility**: VFX data (particle configs, effect definitions) should flow through the same manifest/loader pipeline as everything else. Currently the `fx-` prefix routes to GpuLoader, but VFX configs are JSON data that could be loaded via DomLoader. Clarify the loading path.

- **Module extraction**: Consider whether VFX should become a module (`src/modules/logic/vfx/` or `src/modules/primitives/vfx/`) rather than living in core. This would let games opt in/out and would align with the module tuning pattern.

- **Effect authoring**: Define how effects are created and stored:
  - JSON config files (current approach — `default.json`)
  - Visual editor export format?
  - Runtime API for programmatic effects?

- **Tuning integration**: VFX should have a `tuning.ts` like other modules, so effect parameters (spawn rate, lifetime, colors, gravity) are tunable via the panel.

- **Vibe coding support** (#11): In raw mode, dropping a particle config JSON into the right directory should make it available. In production mode, configs are bundled and validated.

**Deliverables:**
- Clarify VFX asset loading path (data vs. GPU)
- Evaluate module extraction (core → modules)
- VFX tuning schema + panel integration
- Effect authoring workflow documentation
- Compatibility with vibe coding pipeline (#11)

---

## Dependency Map

```
                    ┌──────────────────┐
                    │ 4. Version       │
                    │    Control       │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
     ┌────────────┐  ┌─────────────┐  ┌────────────┐
     │ 7. Source  │  │ 8. Auto-    │  │ 6. Env     │
     │ of Truth   │  │ Update      │  │ Auto Setup │
     └────────────┘  └─────────────┘  └──────┬─────┘
                                              │
                                       ┌──────┘
                                       ▼
                                ┌─────────────┐
                                │ 5. Telemetry│
                                │ Auto Deploy │
                                └─────────────┘

     ┌────────────┐       ┌─────────────┐
     │ 9. Tuning  │──────▶│ 12. Semantic│
     │ Overhaul   │       │ Router      │
     └──────┬─────┘       └─────────────┘
            │
     ┌──────┼──────────────┐
     ▼      ▼              ▼
  ┌─────┐ ┌──────────┐ ┌──────┐
  │ 10. │ │ 11. Vibe │ │ 13.  │
  │Asset│ │ Pipeline │ │ VFX  │
  └─────┘ └──────────┘ └──────┘
```

## Suggested Priority Order

**Phase 1 — Foundation (do first, everything depends on it):**
1. **#4 Version control** — The biggest decision. Unblocks #7, #8.

**Phase 2 — Automation (reduce manual setup overhead):**
2. **#5 Telemetry auto deploy** — Quick win, mostly scripting.
3. **#6 Environments auto setup** — Builds on #5.

**Phase 3 — Developer experience (make building games faster):**
4. **#9 Tuning overhaul** — High impact on daily workflow.
5. **#10 Asset loader evolution** — Incremental improvements.
6. **#11 Vibe coding pipeline** — Builds on #10.

**Phase 4 — Polish & integration:**
7. **#13 VFX / particles** — Integration with #10 and #9.
8. **#12 Semantic router** — Exploration, can happen anytime.
9. **#8 Scaffold auto-update** — Requires #4 to be settled first.
