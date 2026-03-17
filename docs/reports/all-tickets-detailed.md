All Tickets — Detailed Breakdown

Combines the Q1 vertical slice tickets with scaffold improvement tickets into one list.

ALIGNMENT (STREAM 0)

**1. Q1 Prompt-to-Play Spec v0**
Owner: Daniel
Complexity: Low
Depends on: none

Current State
No spec exists. The scaffold has a fixed screen flow (Loading > Start > Game > Results) via useScreen().goto(), a provider stack order in app.tsx (GlobalBoundary > TuningProvider > AnalyticsProvider > FeatureFlagProvider > ViewportModeWrapper > PauseProvider > ManifestProvider > AssetProvider > ScreenProvider), and telemetry hooks at src/core/lib/posthog.ts — but zero gameplay analytics exist today, only error and screen_view tracking. Deploy URLs resolve per environment via src/core/config/environment.ts (local, development, QA, staging, production).

Deliverable
A short written contract defining prompt input fields, output requirements (win/lose/restart/telemetry/deploy link), and required artifacts per run (spec, code diff/commit, build logs, deploy URL).

Scope

- Define prompt input fields and constraints
- Define output requirements (screen flow, telemetry, deploy link)
- Define required artifacts per run (spec, code diff, build logs, deploy URL)
- Specify what "telemetry" means for Q1 (error tracking minimum, gameplay events if game-kit adopted)

Acceptance
Everyone uses this as the source of truth for all downstream tickets.

Key Files
src/core/systems/screens/context.tsx, src/core/lib/posthog.ts, src/core/analytics/events.ts, src/core/config/environment.ts, app.tsx

**2. Quality Bar + Smoke Test Checklist v0**
Owner: Jesse + Daniel
Complexity: Low-Medium
Depends on: Ticket 1

Current State
The boot sequence is well-defined (docs/core/entry-points.md): LoadingScreen calls loadBoot() + loadTheme(), StartScreen calls initGpu() + loadCore() + loadAudio() on user click, GameScreen loads scene assets. Error handling via GlobalBoundary (src/core/systems/errors/boundary.tsx) and Sentry (src/core/systems/errors/reporter.ts). A manual QA checklist exists in docs/guides/testing/testing-strategy.md covering gameplay, audio, visual, performance, and platform categories. Playwright E2E blueprints exist but are unimplemented.

Deliverable
Pass/fail checklist for generated games — crash-free load, playable loop, win/lose/restart, required analytics events.

Scope

- Adapt existing QA checklist from testing strategy doc as starting template
- Define crash-free load criteria (no GlobalBoundary catch, no Sentry errors)
- Define playable loop criteria (screen flow completes, canvas interactive)
- Define audio criteria (unlock on gesture, music toggle, SFX timing)
- Define telemetry event requirements

Acceptance
Checklist can be executed in under 10 minutes per generated game.

Key Files
docs/guides/testing/testing-strategy.md, src/core/systems/errors/boundary.tsx, src/core/systems/errors/reporter.ts, docs/core/entry-points.md

STREAM A — SCAFFOLD & ARCHITECTURE (Jesse primary)

**3. Finalize layered architecture + folder boundaries**
Owner: Jesse
Complexity: Medium
Depends on: Ticket 1

Current State
The three-tier architecture is implemented and documented. INDEX.md files exist at three levels: src/core/INDEX.md (87 lines — systems, config, UI, dev tools), src/modules/INDEX.md (63 lines — primitives/logic/prefabs with placement rules), src/game/INDEX.md (game structure). Dependency rules enforced by convention only (core/ > no deps; modules/ > core/; game/ > core/ + modules/). Full relationship diagram in docs/core/context-map.md. Placement table in CLAUDE.md. Missing: machine-readable format of rules, build-time enforcement, formal validation that a generated game maps cleanly. docs/core/architecture.md still references CityLines.

Deliverable
Documented module boundaries and "what goes where" rules. The core/modules/game tier separation with dependency rules, placement tables, and INDEX.md routing.

Scope

- Formalize dependency rules into machine-readable format
- Validate the "mygame" template at src/game/mygame/ maps to boundaries without ambiguity
- Consider build-time dependency enforcement (e.g., ESLint import rules)
- Update any stale docs (architecture.md CityLines references)

Acceptance
At least 1 existing game can be mapped to these boundaries without ambiguity.

Key Files
src/core/INDEX.md, src/modules/INDEX.md, src/game/INDEX.md, docs/core/architecture.md, docs/core/context-map.md, CLAUDE.md

**4. Create Component Registry**
Owner: Jesse
Complexity: Medium-High
Depends on: Ticket 3

Current State
9 modules across 3 categories: 4 primitives (sprite-button, dialogue-box, character-sprite, progress-bar), 4 logic (level-completion, progress, catalog, loader), 1 prefab (avatar-popup). Each module's tuning.ts already exports a machine-readable schema: { name, defaults, schema: { param: { type, min, max, step } } }. 6 modules have tuning files. Core systems not yet cataloged: screens, assets, audio, tuning, pause, error boundary, VFX, manifest. Input handling is not a formal system — handled per-game via Pixi eventMode.

Deliverable
A machine-readable registry (JSON or TS) listing reusable components/systems with id, description, required deps, optional deps, renderer compatibility, and config schema.

Scope

- Define registry format (extend existing tuning.ts shape with deps, renderer compat)
- Catalog all 9 existing modules with full metadata
- Catalog core systems (screens, assets, audio, tuning, pause, errors, VFX, manifest)
- Identify gaps for Q1 minimum set (input handling, physics/collision)
- Publish as JSON or TS for consumption by agents and tooling

Acceptance
Registry covers the minimum set needed for Q1 games — screen flow, input, basic physics/collision, win/lose, restart, telemetry hooks.

Key Files
src/modules/INDEX.md, src/modules/primitives/\*/tuning.ts, src/core/INDEX.md, docs/modules/index.md

**5. Define Game Schema v0**
Owner: Jesse (primary) + Daniel (review)
Complexity: High
Depends on: Ticket 4

Current State
The scaffold defines concrete patterns a schema must map to: screen registration in src/game/config.ts (screens map + initialScreen), asset manifest with bundle prefixes (boot-_, core-_, scene-_, audio-_, fx-_, defer-_, theme-_, data-_), tuning types extending GameTuningBase, audio via SoundDefinition constants + BaseAudioManager extension, state via Solid.js signals (createRoot). Per-game setup: AnalyticsContext, FeatureFlagContext, GAME_PATHS config. No schema exists today.

Deliverable
A schema for a generated game "plan" (mechanic, controls, entities, win/lose, screens, asset placeholders) that maps deterministically to component registry entries.

Scope

- Define schema fields: mechanic, controls, entities, win/lose conditions, screens, assets
- Map each field to concrete scaffold patterns (config.ts, manifest, tuning types, audio)
- Validate mapping determinism — given a spec, two engineers pick the same components 80%+
- Include asset placeholder strategy (Q1 baseline from Ticket 8)
- Include telemetry event mapping

Acceptance
Given a spec, two engineers independently select the same components 80%+ of the time.

Key Files
src/game/config.ts, src/game/tuning/types.ts, src/game/audio/sounds.ts, src/game/audio/manager.ts, src/game/setup/

**6. Standardized templates for reusable game components**
Owner: Jesse
Complexity: Medium
Depends on: Ticket 3

Current State
The writing-a-module guide (docs/modules/writing-a-module.md, 335 lines) documents the 8-step process with a health-bar worked example. Visual module convention: index.ts (barrel), defaults.ts (SCREAMING_SNAKE constants), tuning.ts ({ name, defaults, schema }), renderers/pixi.ts (extends PIXI.Container). Logic module convention: index.ts (create\* factory + types), defaults.ts. Tuning schema types: number (slider), string (text/easing), boolean (checkbox), color (picker). Missing: tests stub (no test infrastructure), automated scaffolding command (see Ticket 27), docs stub beyond INDEX.md registration.

Deliverable
Component template(s) including file structure, config pattern, docs stub, tests stub. Follows the existing module convention.

Scope

- Codify the writing-a-module guide into reusable templates (visual + logic variants)
- Add tests stub template (pending Ticket 25 for infrastructure)
- Add docs stub template (README.md per module)
- Validate templates against all 9 existing modules for consistency
- Feed into /newmodule factory command (Ticket 27)

Acceptance
Adding a new reusable component is a predictable process and produces consistent structure.

Key Files
docs/modules/writing-a-module.md, src/modules/primitives/sprite-button/ (reference implementation), src/modules/logic/progress/ (reference logic module)

**7. Source management: single scaffold source of truth + update strategy**
Owner: Jesse
Complexity: High
Depends on: Ticket 3

Current State
Scaffold lives in scaffold-production repo. Core/ read-only convention enforced via .claude/settings\*.json (design/dev/admin modes) — soft boundary for AI agents, no build enforcement. src/core/index.ts barrel re-exports all public APIs. Environment config already split: src/core/config/ (scaffold-level) and src/game/config/ (game-level). Per-game fork changes defined in docs/core/entry-points.md: font preload, GAME_DEFAULTS import, manifest/data imports, analytics/flag providers, GAME_PATHS. No mechanism for pulling scaffold updates into an existing forked game.

Deliverable
Documented approach for where scaffold lives, how generated games reference it, and how updates propagate.

Scope

- Document canonical scaffold location and access model
- Define how generated games reference scaffold (depends on Ticket 17 distribution model)
- Define update propagation: how existing games get scaffold updates safely
- Demo the update workflow on at least one existing game
- Address the core/ read-only boundary — hard (package) vs. soft (convention)

Acceptance
Can describe and ideally demo how an existing game gets scaffold updates safely.

Key Files
src/core/index.ts, .claude/settings\*.json, .claude/README.md, src/core/config/, src/game/config/, docs/core/entry-points.md

**8. Asset loading Q1 baseline: naming conventions + loading states contract**
Owner: Daniel (or Jesse), coordinate with Anna
Complexity: Medium
Depends on: Ticket 1, Ticket 2

Might be sunsetted by Anna's planning

Current State
Asset system (src/core/systems/assets/) is engine-agnostic with three loaders: DomLoader (fonts, images), GpuLoader (Pixi textures), AudioLoader (Howler sprites). Bundle prefix convention: boot-_ > dom, core-_/scene-_/fx-_/defer-_ > gpu, audio-_ > audio, theme-_/data-_ > agnostic. Loading flow: LoadingScreen > loadBoot/loadTheme, StartScreen > initGpu/loadCore/loadAudio, GameScreen > loadScene. Directory convention: public/assets/ui/, scenes/, audio/, branding/, data/. Naming guide at docs/guides/assets/naming-convention.md. Pipeline doc at docs/guides/assets/asset-pipeline.md (TexturePacker, 9-slice, atlas format). Audio uses Howler sprite format.

Deliverable
Conventions the generator must follow — asset folder layout, naming, loading progress definition, and placeholder-asset strategy for Q1.

Scope

- Define folder layout the generator must produce (public/assets/ structure)
- Define naming rules per asset type (sprites, audio, fonts, data)
- Define manifest structure requirements (bundle prefixes, asset types)
- Define placeholder-asset strategy (raw PNGs via DomLoader, no atlas required for Q1)
- Define what "loading progress" means (boot > theme > gpu > core > audio > scene)

Acceptance
Generator can include placeholder assets without breaking loader expectations.

Key Files
src/core/systems/assets/coordinator.ts, src/core/systems/assets/loaders/, docs/core/systems/assets.md, docs/guides/assets/naming-convention.md, docs/guides/assets/asset-pipeline.md

STREAM B — UI + ORCHESTRATION (Daniel primary)

**9. Prompt-to-Play UI v0**
Owner: Daniel
Complexity: Medium
Depends on: Ticket 1

Current State
No UI exists. Games are built and deployed manually via CLI (bun run build, bun run dev).

Deliverable
Minimal UI that submits a prompt and shows run status (queued/running/succeeded/failed), artifacts (spec output, build logs, deploy URL).

Scope

- Build prompt submission form
- Show run status with stage tracking (plan > code > build > deploy > smoke test)
- Display artifacts per stage (spec, code diff, build logs, deploy URL)
- Support multiple concurrent runs with unique run IDs

Acceptance
A teammate can run it without local scripting knowledge.

Key Files
(new — external to scaffold repo)

**10. Orchestrator skeleton: run lifecycle + artifact storage**
Owner: Daniel
Complexity: Medium-High
Depends on: Ticket 1, Ticket 2

Current State
Build pipeline: Vite (vite.config.ts), commands: bun run build (production), bun run dev (server), bun run typecheck. Environment config defines CDN URLs per environment: local (relative), development (media.dev.wolf.games), QA (media.qa.wolf.games), staging (media.staging.wolf.games), production (media.wolf.games). Game paths in GAME_PATHS: { gamePath, assetVersion, localAssetPath, localLevelsPath }. Deploy artifacts: dist/ (built output), public/assets/, public/config/ (tuning JSONs), .env with VITE_APP_ENV.

Deliverable
Orchestration service defining stages — plan/spec generation, code generation, build, deploy, smoke test. Stores artifacts per stage with run id.

Scope

- Define run lifecycle stages (plan > code > build > deploy > smoke)
- Implement artifact storage per stage per run
- Handle failure at any stage (partial records preserved)
- Interface with scaffold build pipeline (bun run build, bun run typecheck)
- Interface with environment config for deploy targets

Acceptance
Every run produces a consistent record even on failure.

Key Files
vite.config.ts, package.json, src/core/config/environment.ts, src/game/config/

**11. Minimal agent set integration**
Owner: Daniel
Complexity: High
Depends on: Ticket 10

Current State
AGENTS.md exists at project root. ai/rules/ contains comprehensive standards: javascript.mdc (coding), ui.mdc (UI), review.mdc (code review), tdd.mdc (testing), agent-orchestrator.mdc (orchestration patterns), task-creator.mdc (task creation). Factory commands provide workflows: /review (code quality), /task (atomic breakdown), /debug (root cause analysis).

Deliverable
Implement the Orchestrator / Engineer / Reviewer loop. Manual evaluation allowed in Q1.

Scope

- Implement Orchestrator agent (manages run lifecycle, dispatches to Engineer/Reviewer)
- Implement Engineer agent (generates code following CLAUDE.md rules and ai/rules/ standards)
- Implement Reviewer agent (validates output using /review patterns, checks guardrails)
- Implement at least one retry path (reviewer detects failure, triggers repair)
- Wire agents to factory commands (/review, /task, /debug) for workflow reuse

Acceptance
At least one retry path exists (reviewer detects build failure, triggers one repair attempt).

Key Files
AGENTS.md, ai/rules/agent-orchestrator.mdc, ai/rules/review.mdc, ai/rules/task-creator.mdc, docs/factory/review.md

**12. Guardrails / constraints pack v0**
Owner: Jesse (rules) + Daniel (enforcement plumbing)
Complexity: Medium-High
Depends on: Ticket 3, Ticket 10

Current State
Dependency rules documented but not enforced at build time. Provider stack order in app.tsx is critical (11 nested providers). Required patterns: screens in config.ts, tuning extending GameTuningBase, audio extending BaseAudioManager, assets in manifest with bundle prefixes. ai/rules/ has patterns for JS standards, security, UI, review. No automated constraint checking exists.

Deliverable
Explicit constraints — allowed stack, forbidden patterns, required integration points.

Scope

- Define allowed stack (Pixi for Q1, scaffold conventions, Solid.js)
- Define forbidden patterns (direct DOM hacks, bypassing asset/screen/telemetry systems, core/ internal imports)
- Define required integration points (provider stack order, screen registration, audio unlock on gesture, telemetry calls)
- Implement enforcement (linting rules, reviewer agent checks, or build-time validation)
- Package as a constraints doc + automated checks the reviewer agent can execute

Acceptance
Reviewer can automatically flag violations and block deploy.

Key Files
app.tsx, src/core/index.ts, src/game/config.ts, ai/rules/, CLAUDE.md

**13. Prompt format v0**
Owner: Daniel
Complexity: Medium
Depends on: Ticket 1, Ticket 5

Current State
No prompt compiler exists. The semantic router concept (@wolfgames/semantic-router v0.1.2) maps design language to engineering concepts. INDEX.md files serve as intent-to-path routing tables. The game config pattern (src/game/config.ts) ties screens, assets, and identity together. Per-game changes list in docs/core/entry-points.md defines the complete surface area of what a generated game must produce.

Deliverable
A prompt "compiler" that takes free-text input and produces a structured spec matching Game Schema v0.

Scope

- Build prompt parser that extracts game concepts (mechanic, controls, entities, win/lose)
- Map concepts to scaffold patterns (screen registrations, asset bundles, tuning params, modules)
- Produce a structured spec matching Game Schema v0
- Ensure same prompt yields stable spec shape across runs

Acceptance
The same prompt yields a stable spec shape even if content varies.

Key Files
src/game/config.ts, docs/core/entry-points.md, src/modules/INDEX.md

STREAM C — END-TO-END VALIDATION (shared)

**14. Golden prompts regression set**
Owner: Jesse + Daniel
Complexity: Low
Depends on: Ticket 2, Ticket 13

Current State
No regression set exists. Archive contains two reference implementations: CityLines (src/game/archive/games/citylines/ — grid/path puzzle with level generation) and DailyDispatch (src/game/archive/games/dailydispatch/). These demonstrate what passing games look like within the scaffold.

Deliverable
3-5 prompts with expected minimum outcomes (mechanic type, must include win/lose/restart).

Scope

- Write 3-5 golden prompts covering diverse mechanics
- Define expected minimum outcomes per prompt (mechanic type, required screen flow, required events)
- Map outcomes to quality bar checklist from Ticket 2
- Set up as a repeatable regression suite with pass rate tracking

Acceptance
Can run them repeatedly and compare pass rate over time.

Key Files
src/game/archive/games/citylines/, src/game/archive/games/dailydispatch/

**15. Automated smoke test runner v0**
Owner: Daniel
Complexity: Medium
Depends on: Ticket 2, Ticket 10

Current State
Testing strategy doc has Playwright blueprints: navigate to /, wait for loading hidden, click Play, verify canvas, check HUD. Audio unlock test: check Howler.ctx.state from 'suspended' to 'running'. CI template: GitHub Actions with bun + playwright. None of this is implemented.

Deliverable
Script/checks that validate build succeeded, game loads, interaction present, telemetry events fired.

Scope

- Implement build validation (bun run build exits 0, bun run typecheck exits 0)
- Implement load validation (game loads in iframe without console errors)
- Implement flow validation (loading > start > game screen transitions complete)
- Implement interaction validation (canvas present, receives events)
- Wire into orchestrator (Ticket 10) for automatic pass/fail marking

Acceptance
Orchestrator can mark a run pass/fail automatically for Q1 bar.

Key Files
docs/guides/testing/testing-strategy.md, package.json (build/typecheck scripts)

**16. Generate 5 games validation milestone**
Owner: Jesse + Daniel
Complexity: varies
Depends on: Tickets 9-15

Current State
No generated games exist. All infrastructure from Tickets 9-15 must be in place.

Deliverable
5 deployed links + run artifacts + pass/fail checklist results.

Scope

- Run 5 golden prompts through the full pipeline
- Collect run artifacts per game (spec, code, build logs, deploy URL)
- Execute quality bar checklist on each deployed game
- Document pass/fail results and any patterns in failures
- Iterate on pipeline if pass rate is below target

Acceptance
Meets the Q1 outcome definition.

Key Files
(outputs from Tickets 9-15)

SCAFFOLD IMPROVEMENT TICKETS

**17. Version control (modules + scaffold)**
Owner: Jesse
Complexity: High
Depends on: none

Current State
Scaffold lives in scaffold-production repo. File permissions enforced via .claude/settings\*.json (design/dev/admin modes) — soft boundary, no build enforcement. src/core/index.ts barrel re-exports all public APIs. Games fork the entire repo — no mechanism for pulling scaffold updates into existing games. Environment config already split: src/core/config/ (scaffold-level) and src/game/config/ (game-level).

Deliverable
Versioning strategy chosen and implemented. Games can pin versions and receive updates safely.

Scope

- Evaluate distribution models: git subtree, git submodule, npm/bun package, template repo + migration scripts, monorepo
- Decide: scaffold + modules version together or separately?
- Decide: games pin versions or track latest?
- Decide: core/ read-only becomes hard boundary (package) or stays soft (convention)?
- Implement chosen model
- Add build-time dependency rule enforcement if feasible
- Document migration path for existing games and update workflow

Acceptance
An existing game can pull a scaffold update safely.

Key Files
src/core/index.ts, .claude/settings\*.json, .claude/README.md, src/core/config/, src/game/config/, package.json

Unblocks: Ticket 7 (source of truth), Ticket 19 (environments), Ticket 27 (/newmodule registry)

**18. Telemetry auto deploy (PostHog + Sentry)**
Owner: Daniel
Complexity: Medium
Depends on: Ticket 17

Current State
PostHog initialized in app.tsx via initPostHog() from src/core/lib/posthog.ts (45-line wrapper: initPostHog, capture, identify, setPersonProperties). Per-environment config in src/core/config/environment.ts: disabled in local/development, enabled in QA/staging/production. Sentry via src/core/lib/sentry.ts, error reporting through src/core/systems/errors/reporter.ts. Zero gameplay analytics — all capture() calls are error/screen_view only. Game Kit integration report (docs/reports/game-kit-analytics-integration.md) recommends GetAnalyticsServiceCommand for typed trackers and consent-gated init but is not yet adopted.

Deliverable
CLI script that provisions PostHog + Sentry projects and injects keys into environment config.

Scope

- CLI to provision PostHog project via API, get per-environment keys
- CLI to provision Sentry project via API, get per-environment DSNs
- Generate .env files with keys for all 5 environments (local, Development, QA, Staging, Production)
- Inject keys into src/core/config/environment.ts ENV_CONFIG entries
- Document manual fallback path
- Consider game-kit Phase 1 integration (replace initPostHog with GetAnalyticsServiceCommand)

Acceptance
New game creation automatically gets telemetry keys without manual provisioning.

Key Files
src/core/lib/posthog.ts, src/core/lib/sentry.ts, src/core/config/environment.ts, src/core/systems/errors/reporter.ts, docs/reports/game-kit-analytics-integration.md, wolf-game-kit.json

**19. Environments auto setup**
Owner: Daniel
Complexity: Medium-High
Depends on: Ticket 17, Ticket 18

Current State
Environment detection via VITE_APP_ENV (src/core/config/environment.ts). Five environments with CDN mapping: local (relative), Development (media.dev.wolf.games), QA (media.qa.wolf.games), Staging (media.staging.wolf.games), Production (media.wolf.games). Game paths in GAME_PATHS: { gamePath: 'games/{slug}', assetVersion: 'v1' }. URL resolution: getCdnUrl(), getLevelsUrl(), resolveLevelUrl(). No CI/CD exists — testing strategy doc has a GitHub Actions template but never implemented.

Deliverable
CLI command that provisions full environment structure for a new game from a slug.

Scope

- CLI: given a game slug, create hosting targets ({slug}.wolf.games per environment)
- Configure DNS entries with predictable naming
- Generate GitHub Actions workflow for build/test/deploy per environment
- Generate .env files with VITE_APP_ENV per environment
- Template GAME_PATHS with the game slug
- Wire telemetry keys from Ticket 18
- CDN path pattern: media.{env}.wolf.games/games/{slug}/assets/{version}

Acceptance
Can run one command with a game slug and get the full environment structure provisioned.

Key Files
src/core/config/environment.ts, src/game/config/, docs/guides/deployment/environment-config.md

**20. Tuning system overhaul**
Owner: Jesse
Complexity: High
Depends on: Ticket 29

Current State
Three-tier tuning: Core (cyan), Modules (green), Game (orange). Panel UI at src/core/dev/TuningPanel.tsx, Tweakpane at src/core/dev/Tweakpane.tsx, bindings (easing/color/grid auto-detection) at src/core/dev/bindings.ts. Wired/unwired registry at src/core/dev/tuningRegistry.ts — two manual Sets: WIRED_GAME_PATHS (62 entries) and WIRED_SCAFFOLD_PATHS (22 entries). Paths not in sets show RED in panel. Tuning loader at src/core/systems/tuning/loader.ts (localStorage, deep merge). 6 module tuning files exist, each exporting { name, defaults, schema }. Docs claim auto-discovery but panel likely uses static imports. Panel hidden in Production (VITE_APP_ENV check).

Deliverable
Simplified tuning system with auto-registration, scoped views, and resolved global vs. instance tuning.

Scope

- Auto-registration: scan modules/ for tuning.ts exports (Vite import.meta.glob or generated registry)
- Scoped view: show only tuning for active screen's modules vs. show all with filter
- Panel controls: pause/lock values, filter by category, search by param name
- Storage simplification: handle stale localStorage keys from removed params
- Resolve global vs. instance tuning (all SpriteButtons share one value vs. individual overrides)
- Replace or auto-generate wired/unwired registry to eliminate manual drift

Acceptance
Adding a new module with tuning.ts automatically appears in the panel without manual imports or registry updates.

Key Files
src/core/dev/TuningPanel.tsx, src/core/dev/Tweakpane.tsx, src/core/dev/bindings.ts, src/core/dev/tuningRegistry.ts, src/core/systems/tuning/context.tsx, src/core/systems/tuning/loader.ts, src/core/systems/tuning/types.ts, src/modules/\*/tuning.ts

**21. Vibe coding asset pipeline**
Owner: Jesse
Complexity: Medium-High
Depends on: none

Current State
Asset system (src/core/systems/assets/) is manifest-driven with three loaders: DomLoader (images, fonts), GpuLoader (Pixi textures), AudioLoader (Howler sprites). Bundle prefix convention infers loader target. Production pipeline uses TexturePacker for sprite atlases, Howler sprite format for audio. No "raw mode" — all assets must be in the manifest with correct bundle prefix. Dropping a raw PNG in public/assets/ won't work without manifest registration.

Deliverable
Dual-mode asset pipeline: raw/vibe (drop files, auto-discovered) and production (packed, optimized, CDN-ready). Game code unchanged between modes.

Scope

- Raw asset auto-discovery: scan folder (e.g., public/assets/raw/) and generate manifest entries
- Support individual images (not just atlases) through DomLoader path
- Support individual audio files (not just sprites) through direct Howler load
- Asset build pipeline: CLI to pack raw > production (TexturePacker, audiosprite, image optimization)
- Abstraction layer: useAssets() API resolves raw or atlas transparently
- Migration guide: how to move from vibe to production
- UID asset storage compatibility (docs/guides/assets/uid-asset-storage.md)

Acceptance
Can drop PNGs and MP3s into a folder and the game picks them up. Can run a build command to pack for production. Game code doesn't change between modes.

Key Files
src/core/systems/assets/coordinator.ts, src/core/systems/assets/loaders/dom.ts, src/core/systems/assets/loaders/gpu/pixi.ts, src/core/systems/assets/loaders/audio.ts, docs/guides/assets/asset-pipeline.md

**22. Semantic router**
Owner: Jesse
Complexity: Low-Medium
Depends on: Ticket 3

Current State
INDEX.md files are already semantic routing: docs/INDEX.md (365-line flat routing table), src/core/INDEX.md (system intents > hooks/paths), src/modules/INDEX.md (module names > paths). Factory commands (docs/factory/index.md) route workflows by intent. Common Tasks table in docs/INDEX.md maps high-level tasks to files. @wolfgames/semantic-router package exists at v0.1.2. CLAUDE.md is the primary AI agent entry point.

Deliverable
Machine-readable semantic router that maps design language to engineering concepts for humans, agents, and tooling.

Scope

- Formalize INDEX.md routing tables into machine-readable format (JSON or TS)
- Connect to factory commands (auto-discover relevant files by intent)
- Connect to tuning panel (map design terms to tuning params)
- Connect to AI agents (faster navigation via semantic vocabulary)
- Integrate with component registry (Ticket 4) for concept > module mapping
- Decide: build-time artifact vs. runtime utility

Acceptance
Tooling and agents can resolve design intent to file paths and components programmatically.

Key Files
docs/INDEX.md, src/core/INDEX.md, src/modules/INDEX.md, docs/factory/index.md, @wolfgames/semantic-router

**23. VFX / particles**
Owner: Jesse
Complexity: Medium
Depends on: none

Current State
VFX in src/core/systems/vfx/: types.ts (316 lines — VFXData, SpawnerData, ParticleConfig with 40+ properties including Unity-compatible modules: shape, velocity, noise, forces, curves, trails) and particleRuntime.ts (Pixi-specific — imports Application, Container, Sprite, Texture). Helper functions: createDefaultSpawner(), normalizeParticleConfig(), getDefaultVFXData(). Default effect at public/assets/vfx/effects/default.json. Performance tuning: maxParticles and spritePoolSize in WIRED_SCAFFOLD_PATHS. Tightly coupled to Pixi.js, no module system integration, no tuning panel exposure.

Deliverable
VFX extracted to module system with tuning panel support and vibe pipeline compatibility.

Scope

- Evaluate extracting from core/ to module (modules/primitives/vfx/ or modules/logic/vfx/)
- Decouple Pixi runtime into renderers/pixi.ts, keep types shared
- Add tuning.ts: expose key ParticleConfig params (spawnRate, maxParticles, speed, gravity, lifetime, blendMode)
- Vibe pipeline compatibility: drop VFX JSON in public/assets/vfx/effects/ and auto-load via fx-\* prefix
- Clarify asset loading: VFX configs use data-_ prefix (data), VFX textures use fx-_ prefix (GPU)

Acceptance
VFX is a module games can opt into. Effect parameters are tunable via the panel. Dropping a particle config JSON works without manual registration.

Key Files
src/core/systems/vfx/types.ts, src/core/systems/vfx/particleRuntime.ts, public/assets/vfx/effects/default.json

**24. Doc hygiene — stale references**
Owner: Jesse
Complexity: Low
Depends on: none

Current State
7 docs reference pre-Amino structure:

- docs/core/architecture.md — Section 7 "Game (CityLines Implementation)"
- docs/core/context-map.md — diagram references citylines/, CityLinesGame
- docs/factory/newgame.md — references scaffold/ (now core/), src/game/config/identity.ts (now config.ts)
- docs/guides/getting-started/new-game.md — references src/game/shared/ (removed)
- docs/guides/development/shared-components.md — references src/game/shared/
- docs/guides/testing/testing-strategy.md — examples reference citylines scoring
- docs/core/systems/tuning.md — references CityLinesTuning, CITYLINES_DEFAULTS

Deliverable
All docs updated to reflect the current three-tier layout.

Scope

- Find-and-replace: scaffold/ > core/, src/game/shared/ > src/modules/, src/game/citylines/ > src/game/mygame/ (or generic)
- Verify all referenced paths still exist
- Update code examples to current module/game structure
- Architecture deep-dive needs the most work (make generic, not CityLines-specific)

Acceptance
No doc references scaffold/, src/game/shared/, or src/game/citylines/ as current paths.

Key Files
docs/core/architecture.md, docs/core/context-map.md, docs/factory/newgame.md, docs/guides/getting-started/new-game.md, docs/guides/development/shared-components.md, docs/guides/testing/testing-strategy.md, docs/core/systems/tuning.md

**25. Testing infrastructure**
Owner: Jesse
Complexity: Medium
Depends on: none

Current State
docs/guides/testing/testing-strategy.md (300 lines) has the full plan: vitest for unit, Playwright for E2E, GitHub Actions CI template. Good unit test candidates: game logic, state, utilities. E2E patterns: game flow, audio unlock, visual regression. Reality: zero test files, no vitest.config.ts, no playwright.config.ts, no test scripts in package.json, no .github/workflows/.

Deliverable
Working test infrastructure: vitest configured, starter tests, Playwright E2E, CI pipeline.

Scope

- Configure vitest (vitest.config.ts, test scripts in package.json)
- Write starter unit tests: modules/logic/progress/ (save/load/clear), modules/logic/level-completion/ (state transitions), modules/logic/catalog/ (navigation)
- Configure Playwright (playwright.config.ts, e2e scripts)
- Write 1-2 E2E smoke tests (load game, verify screen flow, canvas visible)
- Create .github/workflows/test.yml from testing strategy template
- Update testing strategy doc to remove CityLines references

Acceptance
bun run test passes, CI runs tests on push.

Key Files
package.json, docs/guides/testing/testing-strategy.md, src/modules/logic/progress/, src/modules/logic/level-completion/, src/modules/logic/catalog/

**26. Utility algorithm modules**
Owner: Jesse
Complexity: Low-Medium
Depends on: none

Current State
Archive at src/game/archive/games/citylines/core/LevelGenerator/: PriorityQueue.ts (min-heap), Dijkstra.ts (shortest path), XoroShiro128Plus.ts (fast PRNG). Also: ConnectionDetector.ts (graph connectivity), evaluateConnections.ts (path evaluation), LevelGenerationService.ts, ChapterGenerationService.ts. Pure logic, zero rendering deps.

Deliverable
Utility algorithms extracted into shared logic modules.

Scope

- Extract modules/logic/random/: XoroShiro128Plus with createSeededRandom factory (index.ts, defaults.ts)
- Extract modules/logic/pathfinding/: Dijkstra + PriorityQueue with createPathfinder factory
- Follow module convention: index.ts barrel, defaults.ts, no renderers needed
- Register in src/modules/INDEX.md under Logic category
- Consider additional algorithms for generation: A\*, flood fill, noise (Perlin/Simplex), grid utilities

Acceptance
Algorithms importable from ~/modules/logic/random and ~/modules/logic/pathfinding.

Key Files
src/game/archive/games/citylines/core/LevelGenerator/PriorityQueue.ts, src/game/archive/games/citylines/core/LevelGenerator/Dijkstra.ts, src/game/archive/games/citylines/core/LevelGenerator/XoroShiro128Plus.ts, src/modules/INDEX.md

**27. /newmodule factory command**
Owner: Jesse
Complexity: Low
Depends on: Ticket 6

Current State
CLAUDE.md lists /newmodule but it doesn't exist. Factory index (docs/factory/index.md) doesn't include it. No docs/factory/newmodule.md. The writing-a-module guide covers the 8-step manual process. Factory commands follow a consistent format: emoji header, one-line description, Constraints {}, Process {}, Output {}.

Deliverable
Automated factory command that scaffolds a new module with the standard file structure.

Scope

- Create docs/factory/newmodule.md following factory command format
- Prompt for category (primitive/logic/prefab) using decision tree
- Prompt for module name
- Scaffold folder structure: index.ts, defaults.ts, tuning.ts, renderers/pixi.ts (visual) or index.ts, defaults.ts (logic)
- Generate barrel exports and default tuning schema
- Register in src/modules/INDEX.md
- Add to docs/factory/index.md quick reference and action tables

Acceptance
Running /newmodule produces a complete, convention-compliant module skeleton.

Key Files
docs/factory/index.md, docs/factory/newmodule.md (new), docs/modules/writing-a-module.md, src/modules/INDEX.md

**28. Ad unit / embed integration**
Owner: Daniel
Complexity: Medium
Depends on: none

Current State
Partially implemented for Advance backend. Viewport system at src/core/config/viewport.ts (constraints, min width, touch targets). MobileViewport wrapper at src/core/ui/MobileViewport.tsx (small/large/none modes). ViewportToggle at src/core/ui/ViewportToggle.tsx (dev-only). Pause system handles visibility change events (src/core/systems/pause/context.tsx) — relevant for iframes. Dynamic viewport height (--dynamic-vh CSS variable in index.html) handles mobile chrome. PostHog tracks in-game only, no publisher analytics bridging.

Deliverable
Embed-aware infrastructure for games running as ad units on publisher sites.

Scope

- Define postMessage protocol: game ready, game complete, score, resize, pause/resume from host
- Handle viewport constraints from ad container via postMessage (extend existing viewport system)
- Analytics bridging: forward key events to host page for publisher tracking correlation
- Document iframe sandbox requirements (allow-scripts, allow-same-origin)
- Verify pause visibility handler in iframe context
- Address --dynamic-vh behavior inside fixed-size containers

Acceptance
A game embedded in an iframe can communicate state to the host page and respect container constraints.

Key Files
src/core/config/viewport.ts, src/core/ui/MobileViewport.tsx, src/core/systems/pause/context.tsx, src/core/lib/posthog.ts, index.html

**29. Tuning auto-discovery gap**
Owner: Jesse
Complexity: Medium
Depends on: none

Current State
Contradiction: docs/modules/index.md says "No manual registration needed. Export the tuning schema, and the panel picks it up." docs/core/systems/tuning.md says "Register wired paths in src/core/dev/tuningRegistry.ts." The tuningRegistry.ts has two manual Sets: WIRED_GAME_PATHS (62 entries) and WIRED_SCAFFOLD_PATHS (22 entries) with helpers isGamePathWired(), isScaffoldPathWired(), areAllChildrenWired(). TuningPanel likely uses static imports, not true auto-discovery. 6 module tuning files exist following { name, defaults, schema } shape.

Deliverable
Docs-vs-reality gap resolved. Clear, accurate documentation of how tuning discovery actually works.

Scope

- Option A: Implement true auto-discovery (Vite import.meta.glob for module tuning files)
- Option B: Correct docs to describe current static import approach
- Resolve panel behavior: auto-open active screen's modules vs. show all with filter
- Address global vs. per-instance tuning design question
- Feed findings into Ticket 20 (tuning overhaul)

Acceptance
Docs and implementation agree. A developer reading the docs can correctly add tuning to a new module on the first try.

Key Files
docs/modules/index.md, docs/core/systems/tuning.md, src/core/dev/tuningRegistry.ts, src/core/dev/TuningPanel.tsx, src/modules/\*/tuning.ts
