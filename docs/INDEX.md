# Project Index

Flat routing table for fast navigation. One file read, zero hops.
Paths prefixed `src/` are source code. Paths without prefix are relative to `docs/`.

---

## Architecture & Understanding

| Intent | Path |
|--------|------|
| System architecture diagram | core/architecture.md |
| Architecture mermaid map | core/architecture-map.md |
| How the app boots, entry points, startup | core/entry-points.md |
| Entry point mermaid map | core/entry-point-map.md |
| Dependency edges, context map for AI | core/context-map.md |
| Pixi scene graph, container hierarchy | core/scene-graph.md |
| Deep technical reference | core/deep-dive.md |
| Scaffold inventory & migration | core/scaffold-overview-and-migration.md |

## Core Systems (source)

| Intent | Path |
|--------|------|
| Asset loading, coordination, preloading | src/core/systems/assets/facade.ts |
| Asset context provider, useAssets hook | src/core/systems/assets/context.tsx |
| Asset type definitions | src/core/systems/assets/types.ts |
| GPU texture loader (Pixi) | src/core/systems/assets/loaders/gpu/pixi.ts |
| Audio asset loader (Howler) | src/core/systems/assets/loaders/audio.ts |
| DOM asset loader (fonts, images) | src/core/systems/assets/loaders/dom.ts |
| Base audio manager, sound playback | src/core/systems/audio/base-manager.ts |
| Audio context provider, useAudio hook | src/core/systems/audio/context.tsx |
| Audio state (mute, volume) | src/core/systems/audio/state.ts |
| Audio type definitions, SoundDefinition | src/core/systems/audio/types.ts |
| Screen manager, navigation logic | src/core/systems/screens/manager.ts |
| Screen context provider, useScreen hook | src/core/systems/screens/context.tsx |
| Screen type definitions | src/core/systems/screens/types.ts |
| Tuning loader, remote config fetch | src/core/systems/tuning/loader.ts |
| Tuning context provider, useTuning hook | src/core/systems/tuning/context.tsx |
| Tuning state management | src/core/systems/tuning/state.ts |
| Tuning type definitions, GameTuningBase | src/core/systems/tuning/types.ts |
| Error boundary component | src/core/systems/errors/boundary.tsx |
| Error reporter (Sentry) | src/core/systems/errors/reporter.ts |
| Pause state, visibility change | src/core/systems/pause/context.tsx |
| Pause keyboard controls | src/core/systems/pause/keyboard.ts |
| Particle effect runtime, VFX | src/core/systems/vfx/particleRuntime.ts |
| VFX type definitions | src/core/systems/vfx/types.ts |
| Manifest provider, asset registry | src/core/systems/manifest/context.tsx |
| Analytics context, PostHog | src/core/systems/telemetry/AnalyticsContext.tsx |
| Feature flags | src/core/systems/telemetry/FeatureFlagContext.tsx |

## Core UI & Dev Tools (source)

| Intent | Path |
|--------|------|
| Button component (scaffold) | src/core/ui/Button.tsx |
| Logo component | src/core/ui/Logo.tsx |
| Mobile viewport wrapper | src/core/ui/MobileViewport.tsx |
| Pause overlay screen | src/core/ui/PauseOverlay.tsx |
| Progress bar (scaffold) | src/core/ui/ProgressBar.tsx |
| Loading spinner | src/core/ui/Spinner.tsx |
| Settings menu | src/core/utils/SettingsMenu/SettingsMenu.tsx |
| Local storage utilities | src/core/utils/storage.ts |
| Tuning panel (dev tools, Tweakpane) | src/core/dev/TuningPanel.tsx |
| Easing picker (GSAP curves) | src/core/dev/EasingPicker.ts |
| Tweakpane integration | src/core/dev/Tweakpane.tsx |
| Dev tool bindings | src/core/dev/bindings.ts |
| Tuning registry | src/core/dev/tuningRegistry.ts |

## Core Config & Libs (source)

| Intent | Path |
|--------|------|
| Viewport constraints, min width, touch targets | src/core/config/viewport.ts |
| Environment variables | src/core/config/environment.ts |
| PostHog analytics client | src/core/lib/posthog.ts |
| Sentry error tracking | src/core/lib/sentry.ts |
| Wolf Game Kit integration | src/core/lib/gameKit.ts |
| Analytics base | src/core/lib/analytics.ts |

## Core Systems (docs)

| Intent | Path |
|--------|------|
| How asset loading works | core/systems/assets.md |
| Asset progress tracking, per-bundle progress | core/systems/assets.md#progress-tracking |
| Asset unloading, memory lifecycle, GPU cleanup | core/systems/assets.md#unloading--memory-lifecycle |
| Manifest contract (bundle/path rules, validation) | core/manifest-contract.md |
| How screen navigation works | core/systems/screens.md |
| Automatic bundle unloading on screen transitions | core/systems/screens.md#automatic-unloading |
| How tuning / live config works | core/systems/tuning.md |
| How the audio engine works | core/systems/audio.md |
| How state persistence works | core/systems/state.md |
| How error boundaries work | core/systems/errors.md |
| How viewport modes work | core/systems/viewport-mode.md |
| Tuning panel docs | core/components/tuning-panel.md |
| Easing picker docs | core/components/easing-picker.md |

## Modules (docs)

| Intent | Path |
|--------|------|
| Module system overview, categories | modules/index.md |
| How to create a new module | modules/writing-a-module.md |

## Modules (source)

| Intent | Path |
|--------|------|
| Module index & placement rules | src/modules/INDEX.md |
| SpriteButton (pressable sprite) | src/modules/primitives/sprite-button/ |
| DialogueBox (9-slice bubble) | src/modules/primitives/dialogue-box/ |
| CharacterSprite (animated atlas) | src/modules/primitives/character-sprite/ |
| ProgressBar (segmented progress) | src/modules/primitives/progress-bar/ |
| LevelCompletionController (state machine) | src/modules/logic/level-completion/ |
| Progress service factory | src/modules/logic/progress/ |
| Catalog service factory | src/modules/logic/catalog/ |
| Content loader factory | src/modules/logic/loader/ |
| AvatarPopup (avatar + dialogue) | src/modules/prefabs/avatar-popup/ |

## Game Config & Setup (source)

| Intent | Path |
|--------|------|
| Game config (identity, environment, manifest, types, screen mappings) | src/game/config.ts |
| Global game state | src/game/state.ts |
| Game tuning defaults | src/game/tuning/index.ts |
| Game tuning type definitions | src/game/tuning/types.ts |
| Game module root export | src/game/index.ts |
| Game index (structure reference) | src/game/INDEX.md |

## Game Screens (source)

| Intent | Path |
|--------|------|
| Loading screen | src/game/screens/LoadingScreen.tsx |
| Start screen, main menu | src/game/screens/StartScreen.tsx |
| Main gameplay screen | src/game/screens/GameScreen.tsx |
| Results screen, game over | src/game/screens/ResultsScreen.tsx |
| Level completion overlay | src/game/screens/components/CompletionOverlay.tsx |
| useGameData hook | src/game/screens/useGameData.ts |
| useCompanionDialogue hook | src/game/screens/useCompanionDialogue.ts |

## Game Audio (source)

| Intent | Path |
|--------|------|
| GameAudioManager, extends BaseAudioManager | src/game/audio/manager.ts |
| Sound effect definitions, SFX constants | src/game/audio/sounds.ts |

## Game Setup (source)

| Intent | Path |
|--------|------|
| Analytics context provider | src/game/setup/AnalyticsContext.tsx |
| Feature flag context provider | src/game/setup/FeatureFlagContext.tsx |
| Analytics helper (getUserData) | src/game/setup/helper.ts |

## Game Logic — mygame/ (source)

| Intent | Path |
|--------|------|
| Game controller (Pixi ↔ GameScreen bridge) | src/game/mygame/screens/gameController.ts |
| Start view (Pixi ↔ StartScreen bridge) | src/game/mygame/screens/startView.ts |
| Game engine classes | src/game/mygame/core/ |
| Controllers | src/game/mygame/controllers/ |
| Systems | src/game/mygame/systems/ |
| UI components | src/game/mygame/ui/ |
| Static data | src/game/mygame/data/ |
| Types | src/game/mygame/types/ |
| Services | src/game/mygame/services/ |

## Archive — Old Games (source)

Previous game implementations preserved for reference:

| Intent | Path |
|--------|------|
| CityLines (archived) | src/game/archive/games/citylines/ |
| DailyDispatch (archived) | src/game/archive/games/dailydispatch/ |
| Old analytics (archived) | src/game/archive/games/analytics/ |
| Old services (archived) | src/game/archive/games/services/ |
| Old game docs (archived) | src/game/archive/games/docs/ |

## Public Assets & Data

| Intent | Path |
|--------|------|
| Branding sprite atlas (Wolf logo) | public/assets/atlas-branding-wolf.json |
| Daily Dispatch tile atlas | public/assets/atlas-tiles-daily-dispatch.json |
| CityLines sound effects | public/assets/sfx-citylines.json |
| Daily Dispatch sound effects | public/assets/sfx-daily-dispatch.json |
| Warehouse puzzle music | public/assets/music-warehouse-puzzle.json |
| Default particle effect | public/assets/vfx/effects/default.json |
| Game tuning parameters | public/config/tuning/game.json |
| Scaffold tuning parameters | public/config/tuning/scaffold.json |
| Chapter catalog / manifest | public/chapters/index.json |
| Dispatch chapter 1–10 | public/chapters/dispatch-1.json … dispatch-10.json |
| Baloo font (web) | public/assets/fonts/Baloo-Regular.woff2 |

## AI Rules & Standards

| Intent | Path |
|--------|------|
| Rules index | ai/rules/index.md |
| JavaScript coding standards | ai/rules/javascript.mdc |
| Core JS patterns | ai/rules/javascript/javascript.mdc |
| Common JS error patterns | ai/rules/javascript/error-causes.mdc |
| IO & network patterns | ai/rules/javascript/javascript-io-network-effects.mdc |
| UI development standards | ai/rules/ui.mdc |
| Code review standards | ai/rules/review.mdc |
| Code review example | ai/rules/review-example.md |
| Logging standards | ai/rules/log.mdc |
| Test-driven development | ai/rules/tdd.mdc |
| Requirements specs | ai/rules/requirements.mdc |
| Task creation patterns | ai/rules/task-creator.mdc |
| Product management guidelines | ai/rules/productmanager.mdc |
| Tech stack documentation | ai/rules/stack.mdc |
| User testing procedures | ai/rules/user-testing.mdc |
| Agent orchestration patterns | ai/rules/agent-orchestrator.mdc |
| JWT security patterns | ai/rules/security/jwt-security.mdc |
| Timing-safe comparisons | ai/rules/security/timing-safe-compare.mdc |
| Timing attack vulnerabilities | ai/rules/security/timing-safe-compare-vulnerabilities.mdc |

## Root Config

| Intent | Path |
|--------|------|
| Dependencies & scripts | package.json |
| TypeScript config | tsconfig.json |
| Vite build config | vite.config.ts |
| Wolf Game Kit config | wolf-game-kit.json |
| Project vision | vision.md |
| Agent orchestration doc | AGENTS.md |
| Claude Code instructions | CLAUDE.md |
| Claude settings docs | .claude/README.md |

## Game Design (docs)

| Intent | Path |
|--------|------|
| Game design document | game/gdd.md |
| Chapter generation system | game/chapter-generation.md |
| Fallback chapter data | game/fallback-patrol-chapters.md |
| CDN chapter loading | game/cdn-chapter-loading-plan.md |
| Sound effects style guide | game/sound-effects-style-guide.md |

## Getting Started (docs)

| Intent | Path |
|--------|------|
| Create a new game | guides/getting-started/new-game.md |
| Configuration & tuning setup | guides/getting-started/configuration.md |

## Development (docs)

| Intent | Path |
|--------|------|
| Shared component catalog | guides/development/shared-components.md |
| Debugging techniques | guides/development/debugging.md |
| Animation patterns (GSAP) | guides/development/animation-cookbook.md |
| State management (signals) | guides/development/state-management.md |
| Promise-wrapped animations | patterns/promise-wrapped-animations.md |

## Assets & Media (docs)

| Intent | Path |
|--------|------|
| Asset naming rules | guides/assets/naming-convention.md |
| Asset naming schema (machine-readable) | guides/assets/naming-convention.schema.json |
| Manifest JSON schema | schemas/manifest.schema.json |
| Sprite atlas pipeline | guides/assets/asset-pipeline.md |
| Audio sprites & music | guides/assets/audio-setup.md |
| Cloud storage (UID assets) | guides/assets/uid-asset-storage.md |

## Platform & Mobile (docs)

| Intent | Path |
|--------|------|
| Performance & 60fps | guides/platform/performance.md |
| Mobile overview | guides/platform/mobile/index.md |
| Mobile viewport height | guides/platform/mobile/viewport.md |
| Touch gestures | guides/platform/mobile/gestures.md |
| Virtual keyboard | guides/platform/mobile/keyboard.md |
| Canvas resize (Pixi) | guides/platform/mobile/canvas-resize.md |
| Pull-to-refresh disable | guides/platform/mobile/pull-to-refresh.md |

## Deployment (docs)

| Intent | Path |
|--------|------|
| Environment config (local/QA/prod) | guides/deployment/environment-config.md |
| Level manifest & GCS | guides/deployment/unified-manifest-design.md |

## Quality (docs)

| Intent | Path |
|--------|------|
| Testing strategy | guides/testing/testing-strategy.md |
| Scaffold evaluation test suite (before/after) | evaluation/README.md |
| Save/load progress | guides/progress-persistence.md |
| Common issues | guides/troubleshooting.md |

## Factory Commands

| Command | Intent | Path |
|---------|--------|------|
| `/research` | Investigate without code changes | factory/research.md |
| `/compare` | Compare solutions with trade-offs | factory/compare.md |
| `/report` | Generate documentation | factory/report.md |
| `/audit` | Systematic codebase review | factory/audit.md |
| `/review` | Code quality review | factory/review.md |
| `/debug` | Find bug root cause | factory/debug.md |
| `/naming` | Asset naming quick ref | factory/naming.md |
| `/commit` | Conventional commit | factory/commit.md |
| `/plan` | Suggest next steps | factory/plan.md |
| `/task` | Break down into atomic tasks | factory/task.md |
| `/discover` | Map user journeys | factory/discover.md |
| `/execute` | Execute planned tasks | factory/execute.md |
| `/update-docs` | Sync doc indexes | factory/update-docs.md |
| `/run-test` | Run test suite | factory/run-test.md |
| `/user-test` | User testing workflow | factory/user-test.md |
| `/log` | Log analysis | factory/log.md |
| `/deploy` | Deploy to QA/staging/production | factory/deploy.md |
| `/help` | Command reference | factory/help.md |

## Reports (Historical)

| Topic | Path |
|-------|------|
| Bundle size analysis | reports/chunk-size-audit.md |
| Doc traversal optimization | reports/doc-index-optimization.md |
| Level progression curves | reports/level-progression-report.md |
| Scaffold extraction analysis | reports/scaffold-extraction-candidates.md |
| File organization analysis | reports/extraction-file-analysis.md |
| Scaffold & docs audit | reports/scaffold-and-docs-audit.md |
| GameKit integration plan | reports/game-kit-integration-plan.md |
| GameKit implementation | reports/game-kit-analytics-integration.md |
| Telemetry implementation | reports/telemetry-integration-report.md |
| Chapter index analysis | reports/chapter-index-report.md |
| Music loading analysis | reports/music-loading-report.md |
| AIDD vs factory comparison | reports/aidd-vs-factory-comparison.md |

## Archive

| Topic | Path |
|-------|------|
| CityLines learnings | archive/citylines/citylines-learnings.md |
| Documentation planning | archive/next-game-documentation-plan.md |
| Executed plans (13 reports) | archive/executed-plans/ |

## Setup & Meta

| Intent | Path |
|--------|------|
| Claude Code setup | guides/claude-code-setup-prompt.md |
| Docs hub (human navigation) | README.md |
| All guides index | guides/index.md |
| Factory command index | factory/index.md |

## Common Tasks (multi-file recipes)

| Task | Files to touch |
|------|---------------|
| Add a new screen | src/game/screens/*.tsx, src/game/config.ts |
| Add a new sound effect | src/game/audio/sounds.ts, src/game/audio/manager.ts |
| Add a new game tuning param | src/game/tuning/types.ts, public/config/tuning/game.json |
| Add a new asset / sprite | src/game/config.ts (manifest section), public/assets/ |
| Add a new chapter | public/chapters/*.json, public/chapters/index.json |
| Add game logic | src/game/mygame/core/, src/game/mygame/controllers/ |
| Add a new module | src/modules/<category>/<name>/, docs/modules/writing-a-module.md |
