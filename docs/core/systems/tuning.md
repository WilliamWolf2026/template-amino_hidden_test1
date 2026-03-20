# Tuning System

Real-time parameter adjustment for development and QA.

## Overview

The tuning system provides a three-tier configuration:
- **Core tuning** -- Framework-level settings (engine, audio, performance)
- **Modules tuning** -- Shared module settings (primitives, prefabs, logic)
- **Game tuning** -- Game-specific settings (grid, visuals, scoring)

## Accessing the Panel

- **Keyboard**: Press backtick (`) to toggle
- **Settings Menu**: Click wrench icon (dev/QA only)
- **Visibility**: Dev and QA environments only, hidden in production

## Panel Position

Configure via `Core > Tuning Panel > Position`:
- Left (default)
- Center
- Right

## Color Coding

| Section | Color | Description |
|---------|-------|-------------|
| Core | Cyan | Framework settings |
| Modules | Green | Shared module settings (primitives, prefabs, logic) |
| Game | Orange | Game-specific settings |
| Unwired | Red italic | Not connected to reactive effects |

## Wired vs Unwired

- **Wired** (normal text): Changes apply immediately via reactive effects
- **Unwired** (red italic): Setting exists but isn't connected to live updates

Register wired paths in `src/core/dev/tuningRegistry.ts`.

## Actions

- **Save to Browser** -- Persist to localStorage
- **Export JSON** -- Copy config to clipboard
- **Reset to Defaults** -- Clear overrides and reload

---

## Modules Tuning

Each module in `src/modules/` exports a `tuning.ts` file that defines a schema and defaults for its tunable parameters. These are automatically registered in the **green "Modules"** section of the tuning panel.

### Module Tuning Structure

A module tuning file exports an object with:
- **`name`** -- Display name in the panel
- **`defaults`** -- Default values (imported from the module's `defaults.ts`)
- **`schema`** -- Parameter definitions with type, range, and step constraints

### Example: Sprite Button

```typescript
// src/modules/primitives/sprite-button/tuning.ts
import { SPRITE_BUTTON_DEFAULTS } from './defaults';

export const spriteButtonTuning = {
  name: 'Sprite Button',
  defaults: SPRITE_BUTTON_DEFAULTS,
  schema: {
    hoverScale: { type: 'number', min: 1.0, max: 1.3, step: 0.01 },
    pressScale: { type: 'number', min: 0.7, max: 1.0, step: 0.01 },
    pressDuration: { type: 'number', min: 0, max: 0.5, step: 0.01 },
    hoverDuration: { type: 'number', min: 0, max: 0.5, step: 0.01 },
    exitScale: { type: 'number', min: 0.5, max: 1.0, step: 0.01 },
    exitDuration: { type: 'number', min: 0, max: 1.0, step: 0.01 },
    disabledAlpha: { type: 'number', min: 0, max: 1, step: 0.05 },
    ease: { type: 'string' },
  },
} as const;
```

### Example: Progress Bar

```typescript
// src/modules/primitives/progress-bar/tuning.ts
import { PROGRESS_BAR_DEFAULTS } from './defaults';

export const progressBarTuning = {
  name: 'Progress Bar',
  defaults: PROGRESS_BAR_DEFAULTS,
  schema: {
    width: { type: 'number', min: 100, max: 600, step: 10 },
    height: { type: 'number', min: 20, max: 80, step: 2 },
    fillColor: { type: 'color' },
    milestoneColor: { type: 'color' },
    backgroundColor: { type: 'color' },
    borderWidth: { type: 'number', min: 0, max: 10, step: 1 },
    radius: { type: 'number', min: 0, max: 20, step: 1 },
    dotRadius: { type: 'number', min: 2, max: 12, step: 1 },
    animationDuration: { type: 'number', min: 0, max: 2, step: 0.1 },
  },
} as const;
```

### Module Tuning Locations

| Module | Tier | Tuning File |
|--------|------|-------------|
| Sprite Button | `primitives` | `src/modules/primitives/sprite-button/tuning.ts` |
| Progress Bar | `primitives` | `src/modules/primitives/progress-bar/tuning.ts` |
| Dialogue Box | `primitives` | `src/modules/primitives/dialogue-box/tuning.ts` |
| Character Sprite | `primitives` | `src/modules/primitives/character-sprite/tuning.ts` |
| Avatar Popup | `prefabs` | `src/modules/prefabs/avatar-popup/tuning.ts` |
| Level Completion | `logic` | `src/modules/logic/level-completion/tuning.ts` |

### Schema Types

| Type | Panel Control | Properties |
|------|---------------|------------|
| `number` | Slider | `min`, `max`, `step` |
| `string` | Text input (or easing picker if detected) | -- |
| `color` | Color picker | -- |

---

## Adding New Game Tuning Parameters (Step-by-Step)

Follow these steps when adding new tunable parameters to a game.

### Step 1: Define the Type

Add your config interface to `src/game/tuning/types.ts`:

```typescript
// Define a new config interface
export interface MyFeatureConfig {
  /** Description of param @min 0 @max 100 @step 1 */
  someNumber: number;
  /** Color in hex format */
  someColor: string;
  /** Toggle feature on/off */
  enabled: boolean;
}
```

**Type annotations in comments** help the tuning panel infer appropriate UI controls:
- `@min`, `@max`, `@step` -- Numeric slider range
- Hex colors (`#RRGGBB`) auto-detect as color pickers
- Booleans become checkboxes

### Step 2: Add to Main Tuning Interface

Update the `GameTuning` interface:

```typescript
export interface GameTuning extends GameTuningBase {
  // ... existing configs
  myFeature: MyFeatureConfig;  // Add your new config
}
```

### Step 3: Set Default Values

Add defaults to `GAME_DEFAULTS`:

```typescript
export const GAME_DEFAULTS: GameTuning = {
  // ... existing defaults
  myFeature: {
    someNumber: 50,
    someColor: '#FF6B6B',
    enabled: true,
  },
};
```

### Step 4: Export the Type

Update `src/game/tuning/index.ts` to export your new type:

```typescript
export type {
  // ... existing exports
  MyFeatureConfig,
} from './types';
```

### Step 5: Wire to Reactive Effects

In your component, use `createEffect` to react to tuning changes:

```typescript
import { createEffect } from 'solid-js';
import { useTuning } from '~/core';

function MyComponent() {
  const tuning = useTuning<ScaffoldTuning, GameTuning>();

  // Wire the tuning value to reactive updates
  createEffect(() => {
    const { someNumber, someColor, enabled } = tuning.game.myFeature;

    // Apply the values to your game objects
    if (enabled) {
      myGameObject.alpha = someNumber / 100;
      myGameObject.tint = someColor;
    }
  });
}
```

### Step 6: Register as Wired

Add your paths to `src/core/dev/tuningRegistry.ts`:

```typescript
export const WIRED_GAME_PATHS = new Set([
  // ... existing paths

  // MyFeature - wired in MyComponent
  'myFeature.someNumber',
  'myFeature.someColor',
  'myFeature.enabled',
]);
```

**Important:** Only add paths that are actually wired to `createEffect`. Paths not in this set will appear RED in the tuning panel to indicate they need wiring.

---

## Organizing Tuning Parameters

### Grouping Related Settings

Nest related parameters under a parent object to create folder groupings in the UI:

```typescript
// This creates a "Grid" folder with "Vfx" subfolder
export interface GridConfig {
  tileSize: number;
  padding: number;
  vfx: {
    rotateAlpha: number;
    rotateSizePercent: number;
  };
}
```

### Naming Conventions

| Pattern | UI Behavior |
|---------|-------------|
| `*Duration`, `*Delay` | Slider 0-5000ms |
| `*Alpha`, `*Volume` | Slider 0-1 |
| `*Scale` | Slider 0.1-3 |
| `*SizePercent` | Slider 50-300% |
| `*Color` (hex value) | Color picker |
| `*Easing` | Easing curve picker |
| `gridSize`, `tileSize` | Dropdown with presets |

### Special UI Controls

The bindings system auto-detects certain patterns for custom UI:

```typescript
// Easing strings get visual curve picker
tileRotateEasing: string;  // e.g., 'elastic.out(1, 0.5)'

// Hex colors get color picker
backgroundColor: string;   // e.g., '#58A23B'

// Grid sizes get dropdown
gridSize: number;          // Shows 4x4, 5x5, 6x6 options
```

---

## Environment-Based Visibility

The tuning panel visibility is controlled by `VITE_APP_ENV`:

```typescript
// In app.tsx
<Show when={import.meta.env.VITE_APP_ENV !== 'Production'}>
  <TuningPanel />
</Show>
```

| Environment | VITE_APP_ENV | Panel Visible |
|-------------|--------------|---------------|
| Local dev | undefined | Yes |
| Development | Development | Yes |
| QA | QA | Yes |
| Staging | Staging | Yes |
| Production | Production | No |

---

## File Locations

| File | Purpose |
|------|---------|
| `src/core/systems/tuning/types.ts` | Core type definitions & defaults |
| `src/core/dev/TuningPanel.tsx` | Panel UI component |
| `src/core/dev/bindings.ts` | Tweakpane bindings & auto-detection |
| `src/core/dev/tuningRegistry.ts` | Wired path registry |
| `src/core/dev/EasingPicker.ts` | Custom easing dropdown component |
| `src/game/tuning/types.ts` | Game-specific tuning types & defaults |
| `src/game/tuning/index.ts` | Game tuning exports |
| `src/modules/*/tuning.ts` | Module-level tuning schemas & defaults |

## Custom Components

- **[EasingPicker](../components/easing-picker.md)** -- Visual curve preview dropdown for GSAP easing selection

---

## Troubleshooting

### Parameter shows RED in panel
The path is not registered in `tuningRegistry.ts`. Either:
1. Add the path to `WIRED_GAME_PATHS` if it's wired to a `createEffect`
2. Leave it red if it's intentionally not live-wired (e.g., requires level reload)

### Changes don't apply immediately
1. Check that the path is in `tuningRegistry.ts`
2. Verify you're using `createEffect` to read the tuning value
3. Ensure you're not caching the value outside the effect

### Panel not showing
1. Check `VITE_APP_ENV` is not `'Production'`
2. Verify `<TuningPanel />` is rendered in `app.tsx`
3. Try pressing backtick (`) to toggle visibility
