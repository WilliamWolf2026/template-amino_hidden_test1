# Game Production Scaffold

SolidJS game scaffold with engine-agnostic asset management, supporting PixiJS, Phaser, and Three.js.

## Quick Start

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

Starting a new game? See the **[New Game Guide](docs/guides/getting-started/new-game.md)**.

## Project Structure

```
src/
├── scaffold/          # Reusable framework (don't modify for game logic)
│   ├── systems/       # Assets, screens, tuning, audio, errors
│   ├── ui/            # Shared UI components
│   └── dev/           # Dev tools (tuning panel)
│
└── game/              # Game-specific code
    ├── screens/       # Loading, Start, Game, Results
    ├── citylines/     # Game logic and entities
    ├── manifest.ts    # Asset definitions
    └── tuning/        # Game parameters
```

## Features

- **Engine Agnostic** — Swap between Pixi, Phaser, or Three.js
- **Asset Management** — Layered loading (DOM, GPU, audio)
- **Live Tuning** — Press backtick (`) to adjust parameters in real-time
- **Error Boundaries** — Layered error handling with Sentry + PostHog

## Documentation

See the **[docs folder](docs/README.md)** for full documentation.

### Quick Links

| Topic | Description |
|-------|-------------|
| [Architecture](docs/scaffold/architecture.md) | System overview and diagrams |
| [Context Map](docs/scaffold/context-map.md) | Node-edge relationship map (AI context) |
| [Creating a New Game](docs/guides/getting-started/new-game.md) | Step-by-step guide |
| [Audio Setup](docs/guides/assets/audio-setup.md) | Howler.js audio sprites |
| [Debugging](docs/guides/development/debugging.md) | DevTools and troubleshooting |
| [Tuning System](docs/scaffold/systems/tuning.md) | Live parameter adjustment |
| [Game Design Doc](docs/game/gdd.md) | CityLines game design |

## Tech Stack

| Category | Technology |
|----------|------------|
| UI | SolidJS |
| Graphics | PixiJS 8 |
| Audio | Howler.js |
| Animation | GSAP |
| Build | Vinxi |
| Styling | TailwindCSS |
