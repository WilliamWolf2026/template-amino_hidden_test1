# Documentation

Welcome to the Game Production Scaffold documentation. This framework provides a clean separation between reusable scaffold systems and game-specific implementation.

**[Research Notes](https://www.notion.so/wolfgames/Shared-Game-Functionality-2cb4a33771998081a4f0ce48cf31128b)** - Ongoing research and design documents

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                      TECH STACK                             │
│  Solid.js │ Pixi.js │ Phaser │ Three.js │ GSAP │ Howler     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │     app.tsx     │
                    └────────┬────────┘
                             │
        ┌────────────────────┴────────────────────┐
        ▼                                         ▼
┌───────────────────┐                 ┌───────────────────┐
│  SCAFFOLD         │                 │  GAME             │
│  (Reusable)       │◄── hooks ────-──│  (CityLines)      │
├───────────────────┤                 ├───────────────────┤
│ Providers:        │                 │ Config:           │
│  └─ Tuning        │                 │  └─ manifest.ts   │
│  └─ Assets        │                 │  └─ config.ts     │
│  └─ Screen        │                 │  └─ state.ts      │
│  └─ Audio         │                 │                   │
│                   │                 │ Screens:          │
│ Systems:          │                 │  └─ Loading       │
│  └─ AssetCoord    │                 │  └─ Start         │
│  └─ ScreenMgr     │                 │  └─ Game          │
│  └─ TuningState   │                 │  └─ Results       │
│                   │                 │                   │
│ UI: Button, etc.  │                 │ Core:             │
│ Dev: TuningPanel  │                 │  └─ CityLinesGame │
└───────────────────┘                 └───────────────────┘
```

---

## Quick Navigation

| Section                                    | Description                    |
| ------------------------------------------ | ------------------------------ |
| [Scaffold](scaffold/architecture.md)       | Reusable framework systems     |
| [Game](game/gdd.md)                        | CityLines game documentation   |
| [New Game Guide](guides/new-game.md)       | Create your own game           |
| [Asset Pipeline](guides/asset-pipeline.md) | Sprites, fonts, and atlases    |
| [Audio Setup](guides/audio-setup.md)       | Sound effects and music        |
| [Troubleshooting](guides/troubleshooting.md) | Common issues and solutions  |

---

## Scaffold Framework

The scaffold provides engine-agnostic systems that can power any game.

### Architecture

- **[Architecture Overview](scaffold/architecture.md)** - System overview, diagrams, and design patterns
- **[Deep Dive](scaffold/deep-dive.md)** - Comprehensive technical documentation with data flow analysis

### Systems

| System                                 | Description                          | Hook          |
| -------------------------------------- | ------------------------------------ | ------------- |
| [Assets](scaffold/systems/assets.md)   | Engine-agnostic asset loading        | `useAssets()` |
| [Screens](scaffold/systems/screens.md) | Screen state machine and transitions | `useScreen()` |
| [Tuning](scaffold/systems/tuning.md)   | Live parameter adjustment            | `useTuning()` |
| [Audio](scaffold/systems/audio.md)     | Howler.js audio management           | `useAudio()`  |
| [State](scaffold/systems/state.md)     | Signal-based state management        | -             |
| [Errors](scaffold/systems/errors.md)   | Layered error boundaries             | -             |

### Components

- [Tuning Panel](scaffold/components/tuning-panel.md) - Dev tools UI for live tuning
- [Easing Picker](scaffold/components/easing-picker.md) - GSAP easing selector with previews

---

## Game Layer

Game-specific implementation using the scaffold.

- **[Game Design Document](game/gdd.md)** - CityLines game design and mechanics

### Creating a New Game

See the **[New Game Guide](guides/new-game.md)** for step-by-step instructions on creating a new game using this scaffold.

---

## Guides

### Getting Started
- **[Creating a New Game](guides/new-game.md)** - Step-by-step guide to build your own game
- **[Configuration](guides/configuration.md)** - Environment and build configuration

### Asset & Audio
- **[Asset Pipeline](guides/asset-pipeline.md)** - TexturePacker, sprites, fonts, and atlases
- **[Audio Setup](guides/audio-setup.md)** - Audio sprites, sound effects, and music

### Reference
- **[Troubleshooting](guides/troubleshooting.md)** - Common issues and solutions
- **[AI Development](guides/ai-development.md)** - AI-assisted development guidelines

---

## Patterns

Reusable code patterns documented for the team:

- **[Promise-Wrapped Animations](patterns/promise-wrapped-animations.md)** - Clean async/await with GSAP

---

## Archive

Historical planning documents and implementation reports are preserved in [archive/executed-plans/](archive/executed-plans/).
