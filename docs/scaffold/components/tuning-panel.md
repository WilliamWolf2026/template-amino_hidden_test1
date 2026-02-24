# Tuning Panel

Development UI component for real-time parameter adjustment.

## Overview

The TuningPanel is a collapsible sidebar that provides live access to all tuning parameters during development and QA. It's powered by [Tweakpane](https://tweakpane.github.io/docs/) and integrates with the scaffold's reactive tuning system.

## Visibility

- **Development**: Always available
- **QA Mode**: Always available
- **Production**: Hidden

## Accessing the Panel

| Method | Action |
|--------|--------|
| Keyboard | Press backtick (`) to toggle |
| Settings | Click wrench icon (dev/QA only) |

## Panel Position

The panel can be positioned on the left, center, or right edge of the screen.

Configure via `Scaffold > Tuning Panel > Position` in the panel itself.

```
Left (default)     Center              Right
┌────┬─────────┐   ┌────────────────┐   ┌─────────┬────┐
│    │         │   │    ┌────┐     │   │         │    │
│ TP │  Game   │   │    │ TP │     │   │  Game   │ TP │
│    │         │   │    └────┘     │   │         │    │
└────┴─────────┘   └────────────────┘   └─────────┴────┘
```

## Color Coding

| Color | Section | Meaning |
|-------|---------|---------|
| Cyan | Scaffold | Framework-level settings (engine, audio, performance) |
| Orange | Game | Game-specific settings (grid, visuals, scoring) |
| Red italic | Unwired | Parameter exists but isn't connected to live updates |

### Wired vs Unwired

- **Wired** (normal text): Changes apply immediately via reactive effects
- **Unwired** (red italic): Setting exists but changes require restart or manual application

Register wired paths in `src/scaffold/dev/tuningRegistry.ts`.

---

## Scaffold vs Game Tuning

The tuning system has a clear separation between **scaffold** (framework) and **game** (your specific game) parameters.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Tuning Panel                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │  SCAFFOLD (Cyan)                                │   │
│  │  src/scaffold/systems/tuning/types.ts           │   │
│  │                                                 │   │
│  │  • Engine (FPS, antialias, resolution)          │   │
│  │  • Debug (showFps, logLevel)                    │   │
│  │  • Animation (defaultDuration, defaultEasing)   │   │
│  │  • Audio (volumes, fade durations)              │   │
│  │  • Performance (particles, pooling)             │   │
│  │  • Screens (loading durations)                  │   │
│  │  • Tuning Panel (position)                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  GAME (Orange)                                  │   │
│  │  src/game/tuning/types.ts                       │   │
│  │                                                 │   │
│  │  • Your game-specific parameters                │   │
│  │  • Grid, difficulty, visuals, scoring, etc.     │   │
│  │  • Completely customizable per game             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### What Goes Where?

| Scaffold (framework) | Game (your game) |
|---------------------|------------------|
| Engine rendering settings | Grid/board layout |
| Audio volume levels | Difficulty settings |
| Debug flags | Visual themes/colors |
| Animation defaults | Scoring rules |
| Performance limits | Game-specific timings |
| Screen transitions | Sprite configurations |

### Why This Separation?

1. **Reusability**: Scaffold settings work across all games
2. **Isolation**: Game tuning doesn't affect framework behavior
3. **Portability**: Swap games without touching scaffold
4. **Defaults**: Each layer has independent defaults

---

## Storage System

Scaffold and game tuning are stored **completely separately**, allowing you to swap games without losing framework preferences.

### Storage Locations

```
┌─────────────────────────────────────────────────────────────────┐
│                     LOADING PRIORITY                            │
│                     (checked in order)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. localStorage (fastest, user's saved preferences)            │
│     ├── tuning_scaffold  ← Scaffold settings                    │
│     └── tuning_game      ← Game settings                        │
│                                                                 │
│  2. JSON files in /public/config/tuning/                        │
│     ├── scaffold.json    ← Optional scaffold overrides          │
│     └── game.json        ← Optional game overrides              │
│                                                                 │
│  3. Built-in TypeScript defaults                                │
│     ├── SCAFFOLD_DEFAULTS (src/scaffold/systems/tuning/types.ts)│
│     └── GAME_DEFAULTS     (src/game/tuning/types.ts)            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### How It Works

1. **On Load**: System checks localStorage first, then JSON files, then defaults
2. **Deep Merge**: Partial configs work — missing keys filled from defaults
3. **On Save**: Current values written to localStorage
4. **On Reset**: localStorage cleared, defaults restored

### localStorage Keys

| Key | Content | Persists |
|-----|---------|----------|
| `tuning_scaffold` | Engine, audio, debug, performance | Across all games |
| `tuning_game` | Grid, difficulty, visuals, scoring | Per game |

### Key Insight: Swapping Games

When you create a new game:
- `tuning_scaffold` stays intact (your framework preferences)
- `tuning_game` should be cleared or will be ignored (new defaults take over)

```typescript
// Clear game tuning when switching games
localStorage.removeItem('tuning_game');
```

### Optional JSON Overrides

Create files in `public/config/tuning/` for team-wide defaults:

**public/config/tuning/scaffold.json** (optional):
```json
{
  "engine": {
    "targetFps": 30
  },
  "debug": {
    "showFps": true
  }
}
```

**public/config/tuning/game.json** (optional):
```json
{
  "grid": {
    "tileSize": 80
  }
}
```

These override built-in defaults but are overridden by localStorage.

---

## Setting Up Game Tuning

### Step 1: Define Your Types

Create `src/game/tuning/types.ts`:

```typescript
import type { GameTuningBase } from '~/scaffold/systems/tuning/types';

// Your game's tuning interface
export interface MyGameTuning extends GameTuningBase {
  grid: {
    size: number;
    cellSize: number;
  };
  gameplay: {
    speed: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
  // ... add your parameters
}

// Default values
export const MY_GAME_DEFAULTS: MyGameTuning = {
  version: '1.0.0',
  grid: {
    size: 8,
    cellSize: 64,
  },
  gameplay: {
    speed: 1.0,
    difficulty: 'medium',
  },
};
```

### Step 2: Export from Index

Create `src/game/tuning/index.ts`:

```typescript
export type { MyGameTuning } from './types';
export { MY_GAME_DEFAULTS } from './types';
```

### Step 3: Wire Parameters (Optional)

For live updates, register paths in `src/scaffold/dev/tuningRegistry.ts`:

```typescript
const GAME_WIRED_PATHS = [
  'grid.size',
  'grid.cellSize',
  'gameplay.speed',
  // Add paths you want to update in real-time
];
```

### Step 4: Use in Components

```typescript
import { useTuning } from '~/scaffold/systems/tuning/context';
import type { MyGameTuning } from '~/game/tuning';

function GameComponent() {
  const tuning = useTuning<ScaffoldTuning, MyGameTuning>();

  // Access game tuning (reactive)
  const gridSize = () => tuning.game().grid.size;

  // Access scaffold tuning
  const targetFps = () => tuning.scaffold().engine.targetFps;

  return <div>Grid: {gridSize()} x {gridSize()}</div>;
}
```

---

## Custom Components

The panel includes custom UI components for enhanced parameter editing:

- **[Easing Picker](./easing-picker.md)** — Visual curve preview dropdown for GSAP easing selection

---

## Actions

The panel includes preset controls at the bottom:

| Action | Description |
|--------|-------------|
| Save to Browser | Persist current settings to localStorage |
| Export JSON | Copy full config to clipboard |
| Reset to Defaults | Clear all overrides and reload |

---

## Implementation

**File:** `src/scaffold/dev/TuningPanel.tsx`

The component:
1. Creates a Tweakpane instance on mount
2. Binds all tuning parameters via `bindTuningToPane()`
3. Listens for backtick key to toggle visibility
4. Cleans up on unmount

---

## Related Documentation

- [Tuning System](../services/tuning.md) — How to add and wire tuning parameters
- [Easing Picker](./easing-picker.md) — Custom GSAP easing dropdown component
- [Making a New Game](../../README.md#making-a-new-game) — Guide to creating a new game
