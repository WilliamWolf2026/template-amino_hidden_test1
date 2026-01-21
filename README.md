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

## Documentation

### Architecture & Setup
- [Architecture](docs/architecture.md) — System overview and design patterns
- [Configuration](docs/configuration.md) — Environment and build config
- [Screens](docs/screens.md) — Screen navigation system

### Systems
- [Assets](docs/assets.md) — Asset loading and management
- [State Management](docs/state-management.md) — Signal-based state
- [Error Handling](docs/error-handling.md) — Error boundaries and logging

### Development Tools
- [Tuning System](docs/services/tuning.md) — Real-time parameter adjustment
- [AI-Driven Development](docs/aidd.md) — AI coding guidelines

### Components
- [Tuning Panel](docs/components/tuning-panel.md) — Dev tuning UI component
- [Easing Picker](docs/components/easing-picker.md) — GSAP easing dropdown with curve previews

### Game
- [Game Design Document](docs/game/gdd.md) — City Lines game design
