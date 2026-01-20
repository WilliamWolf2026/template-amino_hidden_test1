# Game Production Scaffold

SolidJS game scaffold with engine-agnostic asset management, supporting PixiJS, Phaser, and Three.js.

## Quick Start

```bash
bun install
bun run dev
```

## Features

- **Asset Management** — Layered loading system with DOM, GPU, and audio loaders
- **Engine Agnostic** — Swap between Pixi, Phaser, or Three.js
- **Signal-Based Navigation** — No router, instant screen transitions
- **Error Boundaries** — Layered error handling with Sentry + PostHog

## Development Tools

### Tuning System

The game includes a real-time parameter tuning system for development and QA.

- **Toggle Panel**: Press backtick (`) in dev mode
- **Config Files**: `/public/config/tuning/`
- **Documentation**: [Tuning System Guide](src/game/docs/tuning-system.md)

Features:
- Real-time parameter adjustment via Tweakpane
- Two-tier config: scaffold (framework) + game (CityLines-specific)
- Auto-save to localStorage
- Export/import JSON configs

## Documentation

- [Architecture](docs/architecture.md)
- [Configuration](docs/configuration.md)
- [Screens](docs/screens.md)
- [Assets](docs/assets.md)
- [State Management](docs/state-management.md)
- [Error Handling](docs/error-handling.md)
- [Tuning System](src/game/docs/tuning-system.md)
