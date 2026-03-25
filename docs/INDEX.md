# Project Index

Flat routing table for fast navigation. One file read, zero hops.
Paths prefixed `src/` are source code. Paths without prefix are relative to `docs/`.

---

## Architecture & Understanding

| Intent | Path |
|--------|------|
| Design rationale, tier contracts, extension rules, anti-patterns | core/amino-architecture.md |
| System architecture diagram | core/architecture.md |
| Architecture mermaid map | core/architecture-map.md |
| How the app boots, entry points, startup | core/entry-points.md |
| Entry point mermaid map | core/entry-point-map.md |
| Dependency edges, context map for AI | core/context-map.md |
| Pixi scene graph, container hierarchy | core/scene-graph.md |
| Deep technical reference | core/deep-dive.md |
| Amino architecture overview & migration guide | core/scaffold-overview-and-migration.md |

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
| Button component | src/core/ui/Button.tsx |
| Logo component | src/core/ui/Logo.tsx |
| Mobile viewport wrapper | src/core/ui/MobileViewport.tsx |
| Pause overlay screen | src/core/ui/PauseOverlay.tsx |
| Progress bar | src/core/ui/ProgressBar.tsx |
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
| useGameData hook | src/game/screens/useGameData.ts |

## Game Setup (source)

| Intent | Path |
|--------|------|
| Analytics context provider | src/game/setup/AnalyticsContext.tsx |
| Feature flag context provider | src/game/setup/FeatureFlagContext.tsx |
| Player identity (via game-kit PlayerIdentityService) | src/game/setup/tracking.ts, src/game/setup/flags.ts |

## Game Logic — mygame/ (source)

| Intent | Path |
|--------|------|
| Game module root export | src/game/mygame/index.ts |
| Game controller (Pixi ↔ GameScreen bridge) | src/game/mygame/screens/gameController.ts |
| Start view (Pixi ↔ StartScreen bridge) | src/game/mygame/screens/startView.ts |

## Public Assets & Data

| Intent | Path |
|--------|------|
| Branding sprite atlas (Wolf logo) | public/assets/atlas-branding-wolf.json |
| Default particle effect | public/assets/vfx/effects/default.json |
| Game tuning parameters | public/config/tuning/game.json |
| Core tuning parameters | public/config/tuning/core.json |
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
| Sound effects style guide | game/sound-effects-style-guide.md |
| Analytics requirements | game/analytics-requirements.md |


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
| Evaluation test suite (before/after) | evaluation/README.md |
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
| Add a new game tuning param | src/game/tuning/types.ts, public/config/tuning/game.json |
| Add a new asset / sprite | src/game/asset-manifest.ts, public/assets/ |
| Add game logic | src/game/mygame/ |
| Add a new module | src/modules/<category>/<name>/, docs/modules/writing-a-module.md |
