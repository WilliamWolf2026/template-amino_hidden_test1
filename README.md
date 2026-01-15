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
- **DOM HUD Overlay** — UI layer on top of game canvas

## Documentation

- [Asset Management](docs/assets.md) — Manifest structure, loaders, and usage

## Project Structure

```
src/
├── config/           # Game configuration
├── systems/
│   ├── assets/       # Asset loading system
│   ├── screens/      # Screen management
│   └── errors/       # Error boundaries & reporting
├── screens/          # Screen components
├── components/
│   ├── ui/           # Buttons, spinners, progress bars
│   └── hud/          # In-game HUD overlay
├── game/
│   ├── manifest.ts   # Asset manifest
│   └── state.ts      # Game state signals
└── lib/              # Sentry, PostHog init
```

## Screen Flow

```
LoadingScreen → StartScreen → GameScreen → ResultsScreen
     │              │              │
   boot-*      [Start click]    scene-*
   theme-*      initGpu()       gameplay
                core-*
                audio-*
```

## Configuration

Edit `src/config/game.config.ts`:

```typescript
export const gameConfig: GameConfig = {
  engine: 'pixi',  // 'pixi' | 'phaser' | 'three'
  debug: import.meta.env.DEV,
  sentry: { dsn: '...' },
  posthog: { apiKey: '...' },
};
```

## Scripts

```bash
bun run dev     # Start dev server
bun run build   # Production build
bun run start   # Run production build
```
