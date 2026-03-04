# Modules Index

Reusable building blocks + assembled prefabs. Can import from `core/`. Never imports from `game/`.

## Primitives

Single-purpose, configurable components. No deps on other modules.

| Module | What it does | Path |
|--------|-------------|------|
| sprite-button | Pressable sprite with hover/press animations | primitives/sprite-button/ |
| dialogue-box | 9-slice speech bubble with text rendering | primitives/dialogue-box/ |
| character-sprite | Animated character from texture atlas | primitives/character-sprite/ |
| progress-bar | Segmented progress with milestone markers | primitives/progress-bar/ |

## Logic

Pure logic, no rendering.

| Module | What it does | Path |
|--------|-------------|------|
| level-completion | State machine: playing → completing → complete | logic/level-completion/ |

## Prefabs

Assembled from primitives + logic. Higher-level building blocks.

| Module | What it does | Path |
|--------|-------------|------|
| avatar-popup | Circular avatar + dialogue + show/dismiss | prefabs/avatar-popup/ |

## Module Structure

Every module follows this shape:

```
modules/<category>/<module-name>/
  index.ts          ← public API (barrel export)
  <Module>.ts       ← implementation
  types.ts          ← config interface (future)
  defaults.ts       ← extracted magic numbers (future)
  tuning.ts         ← panel schema for Tweakpane (future)
```

## Where to put new modules

- Single-purpose visual component → `primitives/`
- Pure logic, no rendering → `logic/`
- Assembles multiple primitives → `prefabs/`
- Reusable across games? It belongs here. Game-specific? It goes in `game/`.
