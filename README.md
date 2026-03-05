# Game Production Framework

SolidJS game framework with a 3-tier architecture: **Core** (engine), **Modules** (reusable building blocks), and **Game** (your game logic).

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

## Features

- **Engine Agnostic** — Swap between Pixi, Phaser, or Three.js
- **Asset Management** — Layered loading (DOM, GPU, audio)
- **Module System** — Configurable primitives, logic, and prefabs
- **Live Tuning** — Press backtick (`) to adjust parameters in real-time
- **Error Boundaries** — Layered error handling with Sentry + PostHog

## Documentation

See the **[docs folder](docs/README.md)** for full documentation, or use the **[flat index](docs/INDEX.md)** for fast lookup.

### Quick Links

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

## Tech Stack

| Category | Technology |
|----------|------------|
| UI | SolidJS |
| Graphics | PixiJS 8 |
| Audio | Howler.js |
| Animation | GSAP |
| Build | Vite |
| Styling | TailwindCSS |
