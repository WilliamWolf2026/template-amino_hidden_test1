# Tuning System

The tuning system provides real-time parameter adjustment for gameplay development and QA testing.

## Overview

The system uses a two-tier architecture:
- **Scaffold tuning** - Framework-level parameters (engine, audio, performance)
- **Game tuning** - Game-specific parameters (grid, difficulty, visuals, scoring)

## File Locations

| Purpose | Location |
|---------|----------|
| Scaffold config | `/public/config/tuning/scaffold.json` |
| Game config | `/public/config/tuning/game.json` |
| System logic | `/src/scaffold/systems/tuning/` |
| Game types | `/src/game/tuning/` |

## Usage

### Accessing Tuning Values

```tsx
import { useTuning, type ScaffoldTuning } from '~/scaffold';
import type { CityLinesTuning } from '~/game/tuning';

function MyComponent() {
  const tuning = useTuning<ScaffoldTuning, CityLinesTuning>();

  // Access scaffold tuning
  const fps = tuning.scaffold().engine.targetFps;

  // Access game tuning
  const tileSize = tuning.game().grid.tileSize;
  const backgroundColor = tuning.game().visuals.backgroundColor;

  return <div>Tile size: {tileSize}</div>;
}
```

### Reactive Updates

The tuning system uses Solid.js signals, so values update reactively:

```tsx
import { createEffect } from 'solid-js';

function MyComponent() {
  const tuning = useTuning<ScaffoldTuning, CityLinesTuning>();

  // This effect re-runs when tuning values change
  createEffect(() => {
    const tileSize = tuning.game().grid.tileSize;
    console.log('Tile size changed to:', tileSize);
  });
}
```

## Tweakpane Panel

In development mode, press the **backtick key (`)** to toggle the Tweakpane panel.

The panel provides:
- Real-time parameter sliders and inputs
- Color pickers for visual parameters
- Save to browser (localStorage)
- Export to JSON (clipboard)
- Reset to defaults

## JSON Structure

### scaffold.json

```json
{
  "version": "1.0.0",
  "engine": {
    "targetFps": 60,
    "antialias": true,
    "backgroundAlpha": 1.0,
    "resolution": 1
  },
  "debug": {
    "showFps": false,
    "showHitboxes": false,
    "logLevel": "warn"
  },
  "animation": {
    "defaultDuration": 300,
    "transitionDuration": 300,
    "transitionType": "fade"
  },
  "audio": {
    "masterVolume": 0.5,
    "musicVolume": 0.8,
    "sfxVolume": 1.0
  },
  "performance": {
    "maxParticles": 1000,
    "spritePoolSize": 100,
    "enableCulling": true
  },
  "screens": {
    "loadingMinDuration": 500,
    "loadingFadeOut": 300
  }
}
```

### game.json (CityLines)

```json
{
  "version": "1.0.0",
  "grid": {
    "tileSize": 100,
    "defaultGridSize": 4,
    "padding": 20,
    "cellGap": 0
  },
  "difficulty": {
    "easy": { "gridSize": 4, "landmarkCount": { "min": 2, "max": 2 } },
    "medium": { "gridSize": 5, "landmarkCount": { "min": 3, "max": 3 } },
    "hard": { "gridSize": 6, "landmarkCount": { "min": 3, "max": 4 } }
  },
  "visuals": {
    "backgroundColor": "#1a1a2e",
    "roadConnectedTint": "#ffffff",
    "landmarkConnectedScale": 1.1
  },
  "animation": {
    "tileRotateDuration": 200,
    "levelCompleteDelay": 500
  },
  "scoring": {
    "baseScore": 100,
    "timeBonus": 10,
    "perfectBonus": 50
  }
}
```

## Adding New Parameters

1. **Update the JSON file** with the new parameter
2. **Update the TypeScript interface** in the types file
3. **Update the defaults** constant to match
4. The Tweakpane panel auto-generates controls based on value types

### Type Inference

The system automatically infers control types:
- `boolean` → Checkbox
- `number` → Slider (with inferred ranges)
- `string` starting with `#` → Color picker
- Other `string` → Text input

### Range Inference

Numeric parameters get ranges based on key names:
- `*volume*`, `*alpha*` → 0-1
- `*duration*`, `*delay*` → 0-5000ms
- `*scale*` → 0.1-3
- `*size*` → 1-500
- `*probability*` → 0-1

## Persistence

- **localStorage** - Changes are auto-saved and persist across browser sessions
- **Export** - Click "Export JSON" to copy current tuning to clipboard
- **Reset** - Click "Reset to Defaults" to clear localStorage and reload defaults

## Loading Priority

1. **localStorage** (user's saved preferences)
2. **JSON files** in `/public/config/tuning/`
3. **Built-in defaults** (TypeScript constants)

## Creating a New Game

When using this scaffold for a new game:

1. Keep `/src/scaffold/` unchanged
2. Keep `/public/config/tuning/scaffold.json` unchanged
3. Replace `/public/config/tuning/game.json` with new game config
4. Create new `/src/game/tuning/types.ts` with game-specific interfaces
5. Update `/src/game/tuning/index.ts` to export new types

## Visibility

The Tweakpane panel is **only visible in development mode** (`import.meta.env.DEV`).

It is automatically hidden in production builds.

## Reactive Updates

By default, tuning values are read once at component mount. For live updates while the game is running, see:

**[Reactive Tuning Implementation Report](reactive-tuning-report.md)**

This report covers:
- Hot reload parameters (colors, timing)
- Soft reload parameters (sizing)
- Hard reload parameters (grid size, difficulty)
- Implementation patterns for Pixi.js reactivity
