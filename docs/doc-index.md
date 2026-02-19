# Doc Index

Flat routing table for fast navigation. One file read, zero hops.

## Architecture & Understanding

| Intent | Path |
|--------|------|
| System architecture diagram | scaffold/architecture.md |
| Architecture mermaid map | scaffold/architecture-map.md |
| How the app boots | scaffold/entry-points.md |
| Entry point mermaid map | scaffold/entry-point-map.md |
| Dependency edges for AI | scaffold/context-map.md |
| Pixi scene graph | scaffold/scene-graph.md |
| Deep technical reference | scaffold/deep-dive.md |
| Scaffold inventory & migration | scaffold/scaffold-overview-and-migration.md |

## Scaffold Systems

| Intent | Path |
|--------|------|
| Asset loading & coordination | scaffold/systems/assets.md |
| Screen navigation & routing | scaffold/systems/screens.md |
| Tuning / live config | scaffold/systems/tuning.md |
| Audio engine (Howler) | scaffold/systems/audio.md |
| State persistence | scaffold/systems/state.md |
| Error boundaries & recovery | scaffold/systems/errors.md |
| Viewport modes | scaffold/systems/viewport-mode.md |

## Scaffold Components

| Intent | Path |
|--------|------|
| Tuning panel (dev tools) | scaffold/components/tuning-panel.md |
| Easing picker (GSAP) | scaffold/components/easing-picker.md |

## Game Design

| Intent | Path |
|--------|------|
| Game design document | game/gdd.md |
| Chapter generation system | game/chapter-generation.md |
| Fallback chapter data | game/fallback-patrol-chapters.md |
| CDN chapter loading | game/cdn-chapter-loading-plan.md |

## Getting Started

| Intent | Path |
|--------|------|
| Create a new game | guides/getting-started/new-game.md |
| Configuration & tuning setup | guides/getting-started/configuration.md |

## Development

| Intent | Path |
|--------|------|
| Shared component catalog | guides/development/shared-components.md |
| Debugging techniques | guides/development/debugging.md |
| Animation patterns (GSAP) | guides/development/animation-cookbook.md |
| State management (signals) | guides/development/state-management.md |
| Promise-wrapped animations | patterns/promise-wrapped-animations.md |

## Assets & Media

| Intent | Path |
|--------|------|
| Asset naming rules | guides/assets/naming-convention.md |
| Sprite atlas pipeline | guides/assets/asset-pipeline.md |
| Audio sprites & music | guides/assets/audio-setup.md |
| Cloud storage (UID assets) | guides/assets/uid-asset-storage.md |

## Platform & Mobile

| Intent | Path |
|--------|------|
| Performance & 60fps | guides/platform/performance.md |
| Mobile overview | guides/platform/mobile/index.md |
| Mobile viewport height | guides/platform/mobile/viewport.md |
| Touch gestures | guides/platform/mobile/gestures.md |
| Virtual keyboard | guides/platform/mobile/keyboard.md |
| Canvas resize (Pixi) | guides/platform/mobile/canvas-resize.md |
| Pull-to-refresh disable | guides/platform/mobile/pull-to-refresh.md |

## Deployment

| Intent | Path |
|--------|------|
| Environment config (local/QA/prod) | guides/deployment/environment-config.md |
| Level manifest & GCS | guides/deployment/unified-manifest-design.md |

## Quality

| Intent | Path |
|--------|------|
| Testing strategy | guides/testing/testing-strategy.md |
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
