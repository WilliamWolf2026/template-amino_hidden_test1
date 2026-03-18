# Game Production Framework

A production-ready template for building mobile web games — from prompt to polished, shippable product. Describe a game idea, and AI agents design and build it using the embedded skill pipeline.

**North star:** Games players can't put down. Multiple sessions per day. Instantly playable, deeply satisfying, compulsively replayable, and production ready from day one.

Built on a 3-tier architecture: **Core** (engine), **Modules** (reusable building blocks), and **Game** (your game logic). See [`vision.md`](vision.md) for the full product vision.

## Quick Start

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

Starting a new game? See the **[New Game Guide](docs/guides/getting-started/new-game.md)**.

## Architecture

```
src/
├── core/              # Framework shell — DO NOT EDIT
│   ├── systems/       # Assets, screens, tuning, audio, errors, pause, vfx
│   ├── ui/            # Button, Spinner, MobileViewport, ViewportToggle
│   └── dev/           # TuningPanel (Tweakpane)
│
├── modules/           # Reusable building blocks
│   ├── primitives/    # SpriteButton, DialogueBox, CharacterSprite, ProgressBar
│   ├── logic/         # LevelCompletion, Progress, Catalog, Loader
│   └── prefabs/       # AvatarPopup
│
└── game/              # Game-specific code
    ├── config.ts      # Identity, environment, manifest, types, screen wiring
    ├── state.ts       # Runtime signals (score, health, level)
    ├── screens/       # Solid.js screen shells (Loading, Start, Game, Results)
    ├── setup/         # AnalyticsContext, FeatureFlagContext
    ├── audio/         # GameAudioManager + sound definitions
    ├── tuning/        # Game tuning types + defaults
    └── mygame/        # Your game (Pixi engine, controllers, UI, etc.)
```

### Dependency Rules

```
core/    → no deps on modules/ or game/
modules/ → can import from core/
game/    → can import from core/ + modules/
```

## Where to Put New Code

| What you're building | Where it goes |
|---------------------|---------------|
| Single-purpose reusable component | `src/modules/primitives/<name>/` |
| Pure logic, no rendering | `src/modules/logic/<name>/` |
| Assembled from multiple primitives | `src/modules/prefabs/<name>/` |
| Game screen | `src/game/screens/` |
| Game mechanic / controller | `src/game/<game-name>/` |
| Game state signals | `src/game/state.ts` |
| Game tuning values | `src/game/tuning/` |
| Module configuration for a game | `src/game/setup/` |
| Framework system / provider | `src/core/systems/` (admin only) |

## Features

- **Engine Agnostic** — Swap between Pixi, Phaser, or Three.js
- **Asset Management** — Layered loading (DOM, GPU, audio)
- **Module System** — Configurable primitives, logic, and prefabs
- **Live Tuning** — Press backtick (`) to adjust parameters in real-time
- **Error Boundaries** — Layered error handling with Sentry + PostHog

## Factory Commands

See **[docs/factory/index.md](docs/factory/index.md)** for the full list.

| Command | Purpose |
|---------|---------|
| `/research` | Investigate without code changes |
| `/compare` | Compare solutions with trade-offs |
| `/report` | Generate documentation |
| `/audit` | Systematic codebase review |
| `/debug` | Find bug root cause |
| `/review` | Code quality review |
| `/naming` | Asset naming convention |
| `/commit` | Git commit |
| `/deploy` | Deploy to QA/staging/production |
| `/newgame` | Setup checklist for forking to a new game |
| `/newmodule` | Create a new module in modules/ |

## File Permissions

| Folder | Read | Edit |
|--------|:----:|:----:|
| `src/game/` | Yes | Yes |
| `src/modules/` | Yes | Yes |
| `src/core/` | Yes | **No** |
| `docs/` | Yes | Yes |
| `public/` | Yes | Yes |
| `ai/` | Yes | **No** |

**Switch modes:** See [.claude/README.md](.claude/README.md)
```bash
cp .claude/settings.design.json .claude/settings.local.json  # Design (game only)
cp .claude/settings.dev.json .claude/settings.local.json     # Dev (game + modules)
cp .claude/settings.admin.json .claude/settings.local.json   # Admin (unrestricted)
```

## Tech Stack

| Category | Technology |
|----------|------------|
| UI | SolidJS |
| Graphics | PixiJS 8 |
| Audio | Howler.js |
| Animation | GSAP |
| Build | Vite |
| Styling | TailwindCSS |

## Common Tasks

```bash
bun run dev        # Development server
bun run typecheck  # Type check
bun run build      # Production build
bun run test       # Run tests
```

## Documentation

See the **[docs folder](docs/README.md)** for full documentation, or use the **[flat index](docs/INDEX.md)** for fast lookup.

| Topic | Description |
|-------|-------------|
| [Architecture](docs/core/architecture.md) | System overview and diagrams |
| [Context Map](docs/core/context-map.md) | Node-edge relationship map (AI context) |
| [Module System](docs/modules/index.md) | Primitives, logic, prefabs |
| [Creating a New Game](docs/guides/getting-started/new-game.md) | Step-by-step guide |
| [Audio Setup](docs/guides/assets/audio-setup.md) | Howler.js audio sprites |
| [Debugging](docs/guides/development/debugging.md) | DevTools and troubleshooting |
| [Tuning System](docs/core/systems/tuning.md) | Live parameter adjustment |
| [Game Design Doc](docs/game/gdd.md) | Game design |
