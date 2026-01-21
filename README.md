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

Real-time parameter tuning for development and QA.

- **Toggle**: Press backtick (`) or click wrench icon in settings
- **Documentation**: [Tuning System](docs/services/tuning.md)

## Documentation

### Scaffold
- [Architecture](docs/architecture.md)
- [Configuration](docs/configuration.md)
- [Screens](docs/screens.md)
- [Assets](docs/assets.md)
- [State Management](docs/state-management.md)
- [Error Handling](docs/error-handling.md)
- [Tuning System](docs/services/tuning.md)

### Game
- [Game Design Document](docs/game/gdd.md)
