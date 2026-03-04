# Module System Overview

Reusable building blocks that sit between core (framework) and game (specific).

## Purpose

Modules are self-contained, game-agnostic pieces of functionality that can be shared across projects. They depend on core but never import from game code. Games import and configure modules to suit their needs.

```
  core/                modules/               game/
  (framework)          (reusable blocks)       (specific)
+-------------+     +------------------+     +-------------+
|  Rendering  | <-- |  Sprite Button   | <-- |  City Lines |
|  Audio      | <-- |  Dialogue Box    | <-- |  Screens    |
|  Tuning     | <-- |  Progress Bar    | <-- |  Audio Mgr  |
|  Assets     | <-- |  Level Complet.  | <-- |  Tuning     |
|  Viewport   | <-- |  Avatar Popup    | <-- |  Gameplay   |
+-------------+     +------------------+     +-------------+
     ^                      ^                      ^
     |                      |                      |
  DO NOT EDIT          SHARED LAYER            EDITABLE
```

**Dependency flow**: `core --> modules --> game` (left to right). A module may import from `~/core/` but never from `~/game/`. Game code imports from both `~/core/` and `~/modules/`.

## Categories

### Primitives

Single-purpose, configurable components. No dependencies on other modules.

Each primitive owns its rendering implementation (Pixi.js, with optional Phaser/Three.js variants) and exposes tuning parameters via a `tuning.ts` schema.

| Module | What it does |
|--------|-------------|
| sprite-button | Pressable sprite with hover/press/exit animations |
| dialogue-box | 9-slice speech bubble with text rendering |
| character-sprite | Animated character from texture atlas |
| progress-bar | Segmented progress with milestone markers |

### Logic

Pure logic, no rendering. Exposed as factory functions that games configure with their own types.

| Module | What it does |
|--------|-------------|
| level-completion | State machine: playing -> completing -> complete |
| progress | Save/load progress backed by localStorage |
| catalog | Ordered content catalog with navigation |
| loader | Fetch + transform content pipeline |

### Prefabs

Assembled from primitives and/or logic modules. Higher-level building blocks.

| Module | What it does | Composed from |
|--------|-------------|---------------|
| avatar-popup | Circular avatar + dialogue + show/dismiss | character-sprite, dialogue-box |

## Module Structure Convention

### Visual modules (primitives, prefabs)

```
modules/<category>/<module-name>/
  index.ts          -- public API (barrel export)
  defaults.ts       -- extracted magic numbers
  tuning.ts         -- panel schema for Tweakpane
  renderers/        -- visual modules only
    pixi.ts         -- Pixi.js implementation
```

### Logic modules (factory functions)

```
modules/logic/<module-name>/
  index.ts          -- factory function + types + public API
  defaults.ts       -- default config values
  tuning.ts         -- panel schema for Tweakpane
```

Logic modules export a `create*` factory function that the game code calls with its own configuration:

```typescript
// Game code configures a logic module
import { createProgressService } from '~/modules/logic/progress';

const progress = createProgressService<MyProgress>({
  key: 'mygame_progress',
  version: 1,
  defaults: { version: 1, score: 0, level: 1 },
});
```

## Current Inventory

| Category | Module | Path | Has Tuning | Has Renderer |
|----------|--------|------|:----------:|:------------:|
| Primitives | sprite-button | `src/modules/primitives/sprite-button/` | Yes | Yes |
| Primitives | dialogue-box | `src/modules/primitives/dialogue-box/` | Yes | Yes |
| Primitives | character-sprite | `src/modules/primitives/character-sprite/` | Yes | Yes |
| Primitives | progress-bar | `src/modules/primitives/progress-bar/` | Yes | Yes |
| Logic | level-completion | `src/modules/logic/level-completion/` | Yes | No |
| Logic | progress | `src/modules/logic/progress/` | No | No |
| Logic | catalog | `src/modules/logic/catalog/` | No | No |
| Logic | loader | `src/modules/logic/loader/` | No | No |
| Prefabs | avatar-popup | `src/modules/prefabs/avatar-popup/` | Yes | Yes |

## Factory Pattern Example

The progress service demonstrates the factory pattern used by logic modules:

```typescript
// src/modules/logic/progress/index.ts

export interface ProgressServiceConfig<T extends BaseProgress> {
  key: string;           // localStorage key
  version: number;       // schema version (bump to reset)
  defaults: T;           // default progress state
  validate?: (data: unknown) => boolean;
}

export function createProgressService<T extends BaseProgress>(
  config: ProgressServiceConfig<T>
): ProgressService<T> {
  const store = createVersionedStore<T>({
    key: config.key,
    version: config.version,
    defaults: config.defaults,
    validate: config.validate,
  });

  return {
    load: () => store.load(),
    save: (data: T) => store.save(data),
    clear: () => store.clear(),
  };
}
```

The game provides the generic type and configuration; the module provides the implementation.

## How Modules Integrate with the Tuning Panel

Any module that exports a `tuning.ts` file with the standard shape automatically appears in the **Modules** section (green) of the [Tuning Panel](../core/components/tuning-panel.md):

```typescript
// src/modules/primitives/sprite-button/tuning.ts
import { SPRITE_BUTTON_DEFAULTS } from './defaults';

export const spriteButtonTuning = {
  name: 'Sprite Button',             // Display name in panel
  defaults: SPRITE_BUTTON_DEFAULTS,  // Default values
  schema: {                          // Tweakpane control definitions
    hoverScale: { type: 'number', min: 1.0, max: 1.3, step: 0.01 },
    pressScale: { type: 'number', min: 0.7, max: 1.0, step: 0.01 },
    // ...
  },
} as const;
```

The panel auto-discovers these exports and renders a collapsible subfolder for each module. No manual registration is needed.

## Placement Rules

When deciding where to put new code:

| Condition | Location |
|-----------|----------|
| Single-purpose visual component | `modules/primitives/` |
| Pure logic, no rendering | `modules/logic/` |
| Assembles multiple primitives/logic | `modules/prefabs/` |
| Reusable across games | `modules/` (pick the right category) |
| Game-specific, not reusable | `game/` (not a module) |
| Framework-level, all games need it | `core/` (not a module) |

## Related Documentation

- [Writing a Module](./writing-a-module.md) -- Step-by-step guide to creating a new module
- [Tuning Panel](../core/components/tuning-panel.md) -- How the panel renders module tuning sections
- [Module INDEX.md](../../src/modules/INDEX.md) -- Source-level module registry
