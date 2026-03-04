# Tuning Panel

Development UI component for real-time parameter adjustment.

## Overview

The TuningPanel is a collapsible sidebar that provides live access to all tuning parameters during development and QA. It is powered by [Tweakpane](https://tweakpane.github.io/docs/) and integrates with the core reactive tuning system. Parameters are organized into three color-coded sections: Core, Modules, and Game.

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

Configure via `Core > Tuning Panel > Position` in the panel itself.

```
Left (default)     Center              Right
+---------+------+   +----------------+   +------+---------+
|         |      |   |    +----+      |   |      |         |
|   TP    | Game |   |    | TP |      |   | Game |   TP    |
|         |      |   |    +----+      |   |      |         |
+---------+------+   +----------------+   +------+---------+
```

## Three-Section Layout

The panel organizes all parameters into three collapsible sections, each with a distinct color:

```
+-----------------------------+
| Tuning                    ` |
+-----------------------------+
| > Core           (cyan)    |
| v Modules        (green)   |
|   > Sprite Button           |
|   > Dialogue Box            |
|   > Progress Bar            |
|   > Level Completion        |
| > Game           (orange)  |
+-----------------------------+
```

### Section Breakdown

| Color | Section | Source | Contents |
|-------|---------|--------|----------|
| Cyan | Core | `src/core/systems/tuning/types.ts` | Framework-level settings (engine, audio, debug, performance, screens, panel position) |
| Green | Modules | Auto-generated from `src/modules/**/tuning.ts` | One folder per module that exports a tuning schema (sprite-button, dialogue-box, progress-bar, level-completion, etc.) |
| Orange | Game | `src/game/tuning/types.ts` | Game-specific settings (grid, difficulty, visuals, scoring, etc.) |

### How Modules Register

Every module that wants a tuning section exports a `tuning.ts` file with a standard shape:

```typescript
import { MY_MODULE_DEFAULTS } from './defaults';

export const myModuleTuning = {
  name: 'My Module',             // Display name in panel
  defaults: MY_MODULE_DEFAULTS,  // Default values object
  schema: {                      // Tweakpane control definitions
    myParam: { type: 'number', min: 0, max: 1, step: 0.01 },
  },
} as const;
```

The panel discovers all module tuning exports at build time and generates a subfolder under the green **Modules** section for each one. No manual registration step is required -- exporting a conforming `tuning.ts` from a module is sufficient.

### Wired vs Unwired

- **Wired** (normal text): Changes apply immediately via reactive effects
- **Unwired** (red italic): Setting exists but changes require restart or manual application

Register wired paths in `src/core/dev/tuningRegistry.ts`.

---

## Architecture

```
+-----------------------------------------------------------+
|                      Tuning Panel                          |
+-----------------------------------------------------------+
|  +-----------------------------------------------------+  |
|  |  CORE (Cyan)                                        |  |
|  |  src/core/systems/tuning/types.ts                   |  |
|  |                                                     |  |
|  |  - Engine (FPS, antialias, resolution)              |  |
|  |  - Debug (showFps, logLevel)                        |  |
|  |  - Animation (defaultDuration, defaultEasing)       |  |
|  |  - Audio (volumes, fade durations)                  |  |
|  |  - Performance (particles, pooling)                 |  |
|  |  - Screens (loading durations)                      |  |
|  |  - Tuning Panel (position)                          |  |
|  +-----------------------------------------------------+  |
|                                                            |
|  +-----------------------------------------------------+  |
|  |  MODULES (Green)                                    |  |
|  |  Auto-discovered from src/modules/**/tuning.ts      |  |
|  |                                                     |  |
|  |  - Sprite Button (hover, press, easing)             |  |
|  |  - Dialogue Box (typewriter speed, padding)         |  |
|  |  - Progress Bar (segment count, fill speed)         |  |
|  |  - Level Completion (celebration, chime)             |  |
|  |  - Avatar Popup (circle size, show/hide anim)       |  |
|  |  - Character Sprite (frame rate, scale)             |  |
|  +-----------------------------------------------------+  |
|                                                            |
|  +-----------------------------------------------------+  |
|  |  GAME (Orange)                                      |  |
|  |  src/game/tuning/types.ts                           |  |
|  |                                                     |  |
|  |  - Your game-specific parameters                    |  |
|  |  - Grid, difficulty, visuals, scoring, etc.         |  |
|  |  - Completely customizable per game                 |  |
|  +-----------------------------------------------------+  |
+------------------------------------------------------------+
```

### What Goes Where?

| Core (framework) | Modules (shared) | Game (your game) |
|-------------------|-------------------|------------------|
| Engine rendering | Button animation | Grid/board layout |
| Audio volumes | Dialogue box styles | Difficulty settings |
| Debug flags | Progress bar segments | Visual themes/colors |
| Animation defaults | Level completion timing | Scoring rules |
| Performance limits | Avatar popup sizing | Game-specific timings |
| Screen transitions | Character sprite config | Sprite configurations |

### Why Three Sections?

1. **Core stays stable**: Framework settings work across all games and modules
2. **Modules self-register**: Each module owns its own tuning without touching core or game code
3. **Game stays isolated**: Game tuning does not affect framework or module behavior
4. **Portability**: Swap games without touching core; swap modules without touching game
5. **Defaults at every layer**: Core, modules, and game each have independent defaults

---

## Storage System

Core, modules, and game tuning are stored **separately**, allowing you to swap games without losing framework or module preferences.

### Storage Locations

```
+----------------------------------------------------------------+
|                       LOADING PRIORITY                          |
|                       (checked in order)                        |
+----------------------------------------------------------------+
|                                                                 |
|  1. localStorage (fastest, user's saved preferences)            |
|     +-- tuning_core     <-- Core settings                       |
|     +-- tuning_modules  <-- Module settings                     |
|     +-- tuning_game     <-- Game settings                       |
|                                                                 |
|  2. JSON files in /public/config/tuning/                        |
|     +-- core.json       <-- Optional core overrides             |
|     +-- game.json       <-- Optional game overrides             |
|                                                                 |
|  3. Built-in TypeScript defaults                                |
|     +-- CORE_DEFAULTS    (src/core/systems/tuning/types.ts)     |
|     +-- <module>_DEFAULTS (src/modules/**/defaults.ts)          |
|     +-- GAME_DEFAULTS    (src/game/tuning/types.ts)             |
|                                                                 |
+----------------------------------------------------------------+
```

### How It Works

1. **On Load**: System checks localStorage first, then JSON files, then defaults
2. **Deep Merge**: Partial configs work -- missing keys filled from defaults
3. **On Save**: Current values written to localStorage
4. **On Reset**: localStorage cleared, defaults restored

### localStorage Keys

| Key | Content | Persists |
|-----|---------|----------|
| `tuning_core` | Engine, audio, debug, performance | Across all games |
| `tuning_modules` | Per-module parameter overrides | Across all games |
| `tuning_game` | Grid, difficulty, visuals, scoring | Per game |

### Key Insight: Swapping Games

When you create a new game:
- `tuning_core` stays intact (your framework preferences)
- `tuning_modules` stays intact (module preferences are game-agnostic)
- `tuning_game` should be cleared or will be ignored (new defaults take over)

```typescript
// Clear game tuning when switching games
localStorage.removeItem('tuning_game');
```

### Optional JSON Overrides

Create files in `public/config/tuning/` for team-wide defaults:

**public/config/tuning/core.json** (optional):
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
import type { GameTuningBase } from '~/core/systems/tuning/types';

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

For live updates, register paths in `src/core/dev/tuningRegistry.ts`:

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
import { useTuning } from '~/core/systems/tuning/context';
import type { MyGameTuning } from '~/game/tuning';

function GameComponent() {
  const tuning = useTuning<CoreTuning, MyGameTuning>();

  // Access game tuning (reactive)
  const gridSize = () => tuning.game().grid.size;

  // Access core tuning
  const targetFps = () => tuning.core().engine.targetFps;

  return <div>Grid: {gridSize()} x {gridSize()}</div>;
}
```

---

## Custom Components

The panel includes custom UI components for enhanced parameter editing:

- **[Easing Picker](./easing-picker.md)** -- Visual curve preview dropdown for GSAP easing selection

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

**File:** `src/core/dev/TuningPanel.tsx`

The component:
1. Creates a Tweakpane instance on mount
2. Binds core parameters from `src/core/systems/tuning/types.ts`
3. Auto-discovers module tuning schemas from `src/modules/**/tuning.ts`
4. Binds game parameters from `src/game/tuning/types.ts`
5. Listens for backtick key to toggle visibility
6. Cleans up on unmount

---

## Related Documentation

- [Tuning System](../services/tuning.md) -- How to add and wire tuning parameters
- [Easing Picker](./easing-picker.md) -- Custom GSAP easing dropdown component
- [Module System](../../modules/index.md) -- How modules register their tuning schemas
