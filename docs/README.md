# Documentation

Welcome to the Game Production Framework documentation. This framework uses a 3-tier architecture separating reusable core systems, configurable modules, and game-specific implementation.

**[Research Notes](https://www.notion.so/wolfgames/Shared-Game-Functionality-2cb4a33771998081a4f0ce48cf31128b)** - Ongoing research and design documents

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                      TECH STACK                             │
│  Solid.js | Pixi.js | Phaser | Three.js | GSAP | Howler    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │     app.tsx      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                     ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│  CORE             │ │  MODULES          │ │  GAME             │
│  (Framework)      │ │  (Building Blocks)│ │  (Your Game)      │
├───────────────────┤ ├───────────────────┤ ├───────────────────┤
│ Providers:        │ │ Primitives:       │ │ Infrastructure:   │
│  └─ Tuning        │ │  └─ SpriteButton  │ │  └─ config.ts     │
│  └─ Assets        │ │  └─ DialogueBox   │ │  └─ state.ts      │
│  └─ Screen        │ │  └─ ProgressBar   │ │  └─ tuning/       │
│  └─ Audio         │ │  └─ CharacterSprite│ │  └─ setup/        │
│  └─ Pause         │ │                   │ │                   │
│                   │ │ Logic:            │ │ Screens:          │
│ Systems:          │ │  └─ LevelComplete │ │  └─ Loading        │
│  └─ AssetCoord    │ │  └─ Progress      │ │  └─ Start          │
│  └─ ScreenMgr     │ │  └─ Catalog       │ │  └─ Game           │
│  └─ TuningState   │ │  └─ Loader        │ │  └─ Results        │
│                   │ │                   │ │                   │
│ UI: Button, etc.  │ │ Prefabs:          │ │ Game Logic:       │
│ Dev: TuningPanel  │ │  └─ AvatarPopup   │ │  └─ mygame/       │
└───────────────────┘ └───────────────────┘ └───────────────────┘

Dependency flow: core ← modules ← game
```

---

## Quick Navigation

| Section                                    | Description                    |
| ------------------------------------------ | ------------------------------ |
| [Core Architecture](core/architecture.md)  | Framework systems & diagrams   |
| [Entry Points](core/entry-points.md)       | How the app boots              |
| [Context Map](core/context-map.md)         | Node-edge relationship map for AI |
| [Module System](modules/index.md)          | Primitives, logic, prefabs     |
| [Game Design Document](game/gdd.md)        | Game design                    |
| [Creating a New Game](guides/getting-started/new-game.md) | Step-by-step setup guide |
| [Shared Components](guides/development/shared-components.md) | Reusable component catalog |
| [Debugging](guides/development/debugging.md) | Daily debugging reference    |
| [Animation Cookbook](guides/development/animation-cookbook.md) | GSAP patterns |
| [Asset Pipeline](guides/assets/asset-pipeline.md) | Sprites, fonts, and atlases |
| [Audio Setup](guides/assets/audio-setup.md) | Howler.js, audio sprites      |
| [Performance](guides/platform/performance.md) | 60fps optimization          |
| [Mobile](guides/platform/mobile/index.md)  | iOS/Android comprehensive guide |
| [Progress Persistence](guides/progress-persistence.md) | Save/load player progress |
| [Troubleshooting](guides/troubleshooting.md) | Common issues and solutions  |
| [All Guides](guides/index.md)              | Complete guide index           |
| [Factory Commands](factory/index.md)       | Workflow commands              |

---

## Core Framework

The core provides engine-agnostic systems that can power any game.

### Architecture

- **[Architecture Overview](core/architecture.md)** - System overview, diagrams, and design patterns
- **[Deep Dive](core/deep-dive.md)** - Comprehensive technical documentation with data flow analysis
- **[Context Map](core/context-map.md)** - Node-edge relationship map for AI context engineering
- **[Overview & Migration Guide](core/scaffold-overview-and-migration.md)** - Complete inventory and game fork guide

### Systems

| System                                 | Description                          | Hook          |
| -------------------------------------- | ------------------------------------ | ------------- |
| [Assets](core/systems/assets.md)      | Engine-agnostic asset loading        | `useAssets()` |
| [Screens](core/systems/screens.md)    | Screen state machine and transitions | `useScreen()` |
| [Tuning](core/systems/tuning.md)      | Live parameter adjustment            | `useTuning()` |
| [Audio](core/systems/audio.md)        | Howler.js audio management           | `useAudio()`  |
| [State](core/systems/state.md)        | Signal-based state management        | -             |
| [Errors](core/systems/errors.md)      | Layered error boundaries             | -             |

### Components

- [Tuning Panel](core/components/tuning-panel.md) - Dev tools UI with 3-section color coding
- [Easing Picker](core/components/easing-picker.md) - GSAP easing selector with previews

---

## Modules

Reusable building blocks between the core framework and game-specific code.

- **[Module System Overview](modules/index.md)** - Categories, structure, inventory
- **[Writing a Module](modules/writing-a-module.md)** - Step-by-step guide

### Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| Primitives | Single-purpose components | SpriteButton, DialogueBox, ProgressBar |
| Logic | Pure logic, no rendering | LevelCompletion, Progress, Catalog, Loader |
| Prefabs | Assembled from primitives | AvatarPopup |

---

## Game Layer

Game-specific implementation using core systems and modules.

- **[Game Design Document](game/gdd.md)** - Game design and mechanics
- **[Chapter Generation](game/chapter-generation.md)** - Level generation system

### Creating a New Game

See the **[New Game Guide](guides/getting-started/new-game.md)** for step-by-step instructions on creating a new game using this framework.

---

## Guides

### Getting Started
- **[Creating a New Game](guides/getting-started/new-game.md)** - Step-by-step guide to build your own game
- **[Configuration](guides/getting-started/configuration.md)** - Environment and build configuration

### Development (Daily Use)
- **[Debugging](guides/development/debugging.md)** - Pixi DevTools, console helpers, common issues
- **[Animation Cookbook](guides/development/animation-cookbook.md)** - GSAP patterns, easings, button states
- **[State Management](guides/development/state-management.md)** - Solid.js signals, game state
- **[Progress Persistence](guides/progress-persistence.md)** - Save/load player progress with localStorage

### Assets & Media
- **[Naming Convention](guides/assets/naming-convention.md)** - Standard naming for raw assets
- **[Asset Pipeline](guides/assets/asset-pipeline.md)** - TexturePacker, sprites, fonts, and atlases
- **[Audio Setup](guides/assets/audio-setup.md)** - Audio sprites, sound effects, and music
- **[UID Asset Storage](guides/assets/uid-asset-storage.md)** - GCS asset management

### Platform (Pre-Launch)
- **[Performance](guides/platform/performance.md)** - 60fps targets, Pixi optimization
- **[Mobile Overview](guides/platform/mobile/index.md)** - iOS/Android comprehensive guide
  - [Viewport](guides/platform/mobile/viewport.md) - Mobile viewport meta tags
  - [Gestures](guides/platform/mobile/gestures.md) - Touch interaction patterns
  - [Keyboard](guides/platform/mobile/keyboard.md) - Virtual keyboard handling
  - [Canvas Resize](guides/platform/mobile/canvas-resize.md) - Dynamic canvas sizing
  - [Pull-to-Refresh](guides/platform/mobile/pull-to-refresh.md) - Disable browser refresh

### Deployment & Infrastructure
- **[Environment Config](guides/deployment/environment-config.md)** - Multi-environment setup (local, QA, production)
- **[Level Manifests](guides/deployment/unified-manifest-design.md)** - Level manifest architecture and GCS deployment

### Quality
- **[Testing Strategy](guides/testing/testing-strategy.md)** - Unit tests, E2E, QA checklist

### Reference
- **[Troubleshooting](guides/troubleshooting.md)** - Common issues and solutions
- **[All Guides](guides/index.md)** - Complete guide index

---

## Patterns

Reusable code patterns documented for the team:

- **[Promise-Wrapped Animations](patterns/promise-wrapped-animations.md)** - Clean async/await with GSAP

---

## Factory Commands

AI workflow commands for development tasks. See [factory/index.md](factory/index.md) for full documentation.

| Command | Description |
|---------|-------------|
| [plan](factory/plan.md) | Create implementation plans |
| [task](factory/task.md) | Execute tracked tasks |
| [commit](factory/commit.md) | Conventional commit messages |
| [review](factory/review.md) | Code review |
| [audit](factory/audit.md) | System auditing |
| [debug](factory/debug.md) | Debug assistance |
| [discover](factory/discover.md) | Codebase exploration |
| [research](factory/research.md) | Research tasks |
| [compare](factory/compare.md) | Code comparison |
| [report](factory/report.md) | Generate reports |
| [execute](factory/execute.md) | Execute plans |
| [run-test](factory/run-test.md) | Run tests |
| [user-test](factory/user-test.md) | User testing |
| [update-docs](factory/update-docs.md) | Documentation updates |
| [naming](factory/naming.md) | Naming conventions |
| [log](factory/log.md) | Log analysis |
| [help](factory/help.md) | Command help |

---

## AI-Driven Development (AIDD) — How It Connects

`CLAUDE.md` is the entry point. Claude Code loads it every session as a system prompt, and two bullet points trigger the entire system:

```
You type a request
        │
        ▼
CLAUDE.md loaded (system prompt)
        │
        ├─► Activity detected? ──► ai/rules/*.mdc consulted (coding standards)
        ├─► Architecture question? ──► docs/**/*.md consulted (ground truth)
        ├─► Slash command? ──► docs/factory/*.md loaded (workflow template)
        └─► Edit attempted? ──► .claude/settings.local.json (permission gate)
```

### Connection Graph

```
                        ┌──────────────────────────────────┐
                        │       Claude Code Session        │
                        │  (loads CLAUDE.md at startup)    │
                        └──────────────┬───────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────────┐
                        │           CLAUDE.md              │
                        ├──────────────────────────────────┤
                        │ • Quick Context (3-tier arch)    │
                        │ • Coding Standards & Docs ─────────── trigger words
                        │ • Factory Commands (table) ────────── slash commands
                        │ • File Permissions               │
                        │ • Tech Stack / Structure         │
                        └───┬──────────┬──────────┬────────┘
                            │          │          │
              ┌─────────────┘          │          └─────────────┐
              ▼                        ▼                        ▼
┌─────────────────────────┐ ┌──────────────────┐ ┌──────────────────────────┐
│    ai/rules/ (AIDD)     │ │     docs/        │ │   docs/factory/          │
│    READ-ONLY            │ │     EDITABLE     │ │   (workflow commands)    │
├─────────────────────────┤ ├──────────────────┤ ├──────────────────────────┤
│                         │ │                  │ │                          │
│ Always Active:          │ │ core/            │ │ Research (no code):      │
│ ├─ agent-orchestrator   │ │ ├─ architecture  │ │ ├─ /research             │
│ └─ please.mdc           │ │ ├─ context-map   │ │ ├─ /compare              │
│                         │ │ └─ systems/      │ │ ├─ /report               │
│ Activity-Matched:       │ │                  │ │ ├─ /audit                │
│ ├─ review.mdc           │ │ modules/         │ │ ├─ /review               │
│ ├─ javascript.mdc       │ │ ├─ index         │ │ └─ /naming               │
│ ├─ ui.mdc               │ │ └─ writing guide │ │                          │
│ ├─ tdd.mdc              │ │                  │ │ Action (changes code):   │
│ ├─ task-creator.mdc     │ │ game/            │ │ ├─ /debug                │
│ ├─ productmanager.mdc   │ │ ├─ gdd           │ │ ├─ /plan                 │
│ ├─ requirements.mdc     │ │ └─ chapter-gen   │ │ ├─ /task                 │
│ └─ log.mdc              │ │                  │ │ ├─ /commit               │
│                         │ │ guides/          │ │ └─ /update-docs          │
│ Subdirectories:         │ │ ├─ getting-started│ │                          │
│ ├─ javascript/          │ │ ├─ development   │ └──────────────────────────┘
│ ├─ security/            │ │ ├─ assets        │
│ └─ frameworks/          │ │ ├─ platform      │
└─────────────────────────┘ │ └─ deployment    │
                            │                  │
                            │ patterns/        │
                            │ reports/         │
                            └──────────────────┘
                    ┌──────────────────────────────────┐
                    │        .claude/                   │
                    ├──────────────────────────────────┤
                    │ settings.local.json ← ACTIVE     │
                    │ settings.admin.json  (full access)│
                    │ settings.restricted.json (safe)   │
                    └──────────────────────────────────┘
```

### How Each Connection Works

| Connection | Trigger | What Happens |
|------------|---------|--------------|
| **CLAUDE.md → ai/rules/** | "consult `ai/rules/`" instruction | Claude name-matches your activity to rule files (e.g. code review → `review.mdc`, UI work → `ui.mdc`) |
| **CLAUDE.md → docs/** | "consult `docs/`" instruction | Claude reads architecture/design docs as ground truth before making changes |
| **CLAUDE.md → docs/factory/** | Slash command table | `/review`, `/commit`, `/debug` etc. load the corresponding workflow template |
| **.claude/ → permissions** | Every edit attempt | `settings.local.json` gates what Claude can modify (`src/core/` and `ai/` are read-only in restricted mode) |

### Toggle Modes

| Switch | Command | Effect |
|--------|---------|--------|
| Full context | `git checkout CLAUDE.md` | AI reads coding standards + docs before every change |
| Lite context | `cp CLAUDE.lite.md CLAUDE.md` | Minimal prompt, no rule/doc lookups (faster) |
| Admin permissions | `cp .claude/settings.admin.json .claude/settings.local.json` | Full edit access |
| Restricted permissions | `cp .claude/settings.restricted.json .claude/settings.local.json` | Protects core + ai/ |

See [Claude Code Setup Guide](guides/claude-code-setup-prompt.md) for applying this pattern to a new repo.

---

## Archive

Archive was cleared (2026-03-19). Historical docs were superseded by `docs/core/`. Backup at `Nucleo/.nucleo/archive-backup/template-amino-docs-archive/`.
