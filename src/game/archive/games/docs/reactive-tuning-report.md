# Reactive Tuning Implementation Report

## Current Problem

Tuning values are read **once** during component mount and passed to game objects as static values. Changing values in Tweakpane updates the state, but the game doesn't react to those changes.

```typescript
// Current: Values read once at mount
onMount(async () => {
  const gameTuning = tuning.game();  // Read once
  const tileSize = gameTuning.grid.tileSize;  // Static value
  const game = new CityLinesGame(gpuLoader, tileSize);  // Passed as number
});
```

## Why This Happens

1. **Solid.js Reactivity**: Signals are only reactive when accessed inside `createEffect`, `createMemo`, or JSX
2. **PixiJS Imperative API**: Pixi uses imperative object manipulation, not declarative rendering
3. **One-time Initialization**: Game objects are created once with initial values

## Solution Architecture

### Tier 1: Hot Reload Parameters
Parameters that can update instantly without rebuilding game state.

| Parameter | Update Method |
|-----------|---------------|
| `visuals.backgroundColor` | `app.renderer.background.color = newColor` |
| `visuals.landmarkConnectedScale` | Update sprite scale on existing objects |
| `visuals.landmarkConnectedAlpha` | Update sprite alpha on existing objects |
| `animation.tileRotateDuration` | Store as reactive signal, read during animation |
| `animation.levelCompleteDelay` | Store as reactive signal, read during events |
| All color tints | Update tint property on sprites |

### Tier 2: Soft Reload Parameters
Parameters that require rebuilding visual elements but not game logic.

| Parameter | Update Method |
|-----------|---------------|
| `grid.tileSize` | Rebuild grid container, reposition all tiles |
| `sprites.landmarkScale` | Rebuild sprite dimensions |
| `sprites.connectionIndicatorSize` | Rebuild indicator graphics |

### Tier 3: Hard Reload Parameters
Parameters that require restarting the level/game.

| Parameter | Reason |
|-----------|--------|
| `grid.defaultGridSize` | Changes puzzle dimensions |
| `difficulty.*` | Changes level generation |

---

## Implementation Approaches

### Approach 1: Reactive Game Class (Recommended)

Make `CityLinesGame` accept tuning signals and react to changes internally.

```typescript
// CityLinesGame.ts
import { createEffect } from 'solid-js';
import type { Accessor } from 'solid-js';
import type { CityLinesTuning } from '~/game/tuning';

export class CityLinesGame extends Container {
  private tuning: Accessor<CityLinesTuning>;

  constructor(
    gpuLoader: PixiLoader,
    tuning: Accessor<CityLinesTuning>  // Pass signal accessor
  ) {
    super();
    this.tuning = tuning;
    this.setupReactivity();
  }

  private setupReactivity() {
    // React to tile size changes
    createEffect(() => {
      const tileSize = this.tuning().grid.tileSize;
      this.rebuildGrid(tileSize);
    });

    // React to visual changes
    createEffect(() => {
      const visuals = this.tuning().visuals;
      this.updateVisuals(visuals);
    });

    // React to animation timing changes
    createEffect(() => {
      const animation = this.tuning().animation;
      this.animationConfig = animation;
    });
  }

  private updateVisuals(visuals: VisualsConfig) {
    // Update all landmark tints
    this.landmarks.forEach(landmark => {
      landmark.setConnectedTint(visuals.roadConnectedTint);
      landmark.setDisconnectedTint(visuals.roadDisconnectedTint);
    });
  }
}
```

**Usage in GameScreen:**
```typescript
const game = new CityLinesGame(gpuLoader, () => tuning.game());
```

### Approach 2: Tuning Event Bus

Create a pub/sub system for tuning changes.

```typescript
// tuningEvents.ts
type TuningPath = string;
type TuningListener = (path: TuningPath, value: unknown) => void;

class TuningEventBus {
  private listeners = new Map<string, Set<TuningListener>>();

  subscribe(pathPattern: string, listener: TuningListener) {
    if (!this.listeners.has(pathPattern)) {
      this.listeners.set(pathPattern, new Set());
    }
    this.listeners.get(pathPattern)!.add(listener);
    return () => this.listeners.get(pathPattern)?.delete(listener);
  }

  emit(path: string, value: unknown) {
    this.listeners.forEach((listeners, pattern) => {
      if (path.startsWith(pattern) || pattern === '*') {
        listeners.forEach(fn => fn(path, value));
      }
    });
  }
}

export const tuningEvents = new TuningEventBus();
```

**Usage in bindings.ts:**
```typescript
bindTuningToPane(pane, tuning, {
  onChange: (path, value) => {
    tuning.save();
    tuningEvents.emit(path, value);  // Notify subscribers
  },
});
```

**Usage in game objects:**
```typescript
class Landmark extends Container {
  constructor() {
    // Subscribe to visual changes
    tuningEvents.subscribe('visuals', (path, value) => {
      if (path === 'visuals.landmarkConnectedScale') {
        this.connectedScale = value as number;
      }
    });
  }
}
```

### Approach 3: Centralized Tuning Manager

Create a singleton that game objects can query and subscribe to.

```typescript
// TuningManager.ts
import { createRoot, createEffect, createSignal } from 'solid-js';

class TuningManager {
  private game = createSignal<CityLinesTuning>(CITYLINES_DEFAULTS);

  // Expose specific reactive values
  readonly tileSize = () => this.game[0]().grid.tileSize;
  readonly backgroundColor = () => this.game[0]().visuals.backgroundColor;
  readonly animationDuration = () => this.game[0]().animation.tileRotateDuration;

  // Methods for game objects to call
  getTileSize() { return this.tileSize(); }
  getAnimationDuration() { return this.animationDuration(); }

  // Update from tuning panel
  update(tuning: CityLinesTuning) {
    this.game[1](tuning);
  }
}

export const tuningManager = createRoot(() => new TuningManager());
```

---

## Specific Parameter Implementation

### Grid Size (Constrained: 4, 5, 6)

The grid size must be constrained to valid values for the puzzle logic.

```typescript
// In bindings.ts - add custom handling for gridSize
if (key === 'defaultGridSize' || key === 'gridSize') {
  parent.addBinding(obj, key, {
    label,
    options: {
      '4×4': 4,
      '5×5': 5,
      '6×6': 6,
    },
  }).on('change', (ev) => onUpdate(ev.value));
  return;
}
```

**For reactive grid size changes:**
```typescript
// In CityLinesGame
private setupGridSizeReactivity() {
  let currentSize = this.tuning().grid.defaultGridSize;

  createEffect(() => {
    const newSize = this.tuning().grid.defaultGridSize;
    if (newSize !== currentSize) {
      currentSize = newSize;
      // Grid size change requires level restart
      this.emit('gridSizeChanged', newSize);
      // Show notification to user
      console.log(`[Tuning] Grid size changed to ${newSize}×${newSize}. Restart level to apply.`);
    }
  });
}
```

### Tile Size (Hot Reload)

Tile size can be updated live by repositioning all elements.

```typescript
private setupTileSizeReactivity() {
  createEffect(() => {
    const tileSize = this.tuning().grid.tileSize;

    // Update all road tiles
    this.roadTiles.forEach((tile, index) => {
      const row = Math.floor(index / this.gridSize);
      const col = index % this.gridSize;
      tile.x = col * tileSize + tileSize / 2;
      tile.y = row * tileSize + tileSize / 2;
      tile.width = tileSize;
      tile.height = tileSize;
    });

    // Update all landmarks
    this.landmarks.forEach(landmark => {
      landmark.updateTileSize(tileSize);
    });

    // Update exits
    this.exits.forEach(exit => {
      exit.updateTileSize(tileSize);
    });
  });
}
```

### Background Color (Hot Reload)

```typescript
// In GameScreen.tsx
createEffect(() => {
  const bgColor = tuning.game().visuals.backgroundColor;
  if (app) {
    app.renderer.background.color = bgColor;
  }
});
```

### Animation Durations (Hot Reload)

Store as reactive getter, not static value.

```typescript
class RoadTile extends Container {
  private getRotationDuration: () => number;

  constructor(tuning: Accessor<CityLinesTuning>) {
    this.getRotationDuration = () => tuning().animation.tileRotateDuration;
  }

  rotate() {
    gsap.to(this, {
      rotation: this.targetRotation,
      duration: this.getRotationDuration() / 1000,  // Called at animation time
      ease: 'back.out',
    });
  }
}
```

---

## Recommended Implementation Plan

### Phase 1: Hot Reload Visuals
1. Pass tuning signal accessor to game objects
2. Add `createEffect` for background color in GameScreen
3. Add `createEffect` for tint colors in Landmark class
4. Add `createEffect` for alpha values

### Phase 2: Hot Reload Sizing
1. Add `updateTileSize()` method to all game objects
2. Add `createEffect` in CityLinesGame to call updates
3. Test with tile size slider

### Phase 3: Constrained Selectors
1. Update bindings.ts to use dropdown for gridSize
2. Add validation for constrained values
3. Show "restart required" message for hard reload params

### Phase 4: Animation Timing
1. Change animation methods to read duration at call time
2. Use getter functions instead of stored values

---

## File Changes Required

| File | Changes |
|------|---------|
| `CityLinesGame.ts` | Accept tuning accessor, add reactivity setup |
| `RoadTile.ts` | Accept tuning accessor for animation timing |
| `Landmark.ts` | Add `updateTileSize()`, `updateVisuals()` methods |
| `Exit.ts` | Add `updateTileSize()` method |
| `GameScreen.tsx` | Pass tuning accessor, add background effect |
| `bindings.ts` | Add dropdown for gridSize, add path to onChange |

---

## Example: Full Reactive GameScreen

```typescript
export function GameScreen() {
  const { coordinator } = useAssets();
  const tuning = useTuning<ScaffoldTuning, CityLinesTuning>();
  let containerRef: HTMLDivElement | undefined;
  let app: Application | null = null;
  let game: CityLinesGame | null = null;

  onMount(async () => {
    if (!containerRef) return;

    app = new Application();
    await app.init({
      background: tuning.game().visuals.backgroundColor,
      resizeTo: containerRef,
      antialias: tuning.scaffold().engine.antialias,
    });
    containerRef.appendChild(app.canvas);

    const gpuLoader = coordinator.getGpuLoader() as PixiLoader;
    await coordinator.loadBundle('tiles_citylines_v1');

    if (gpuLoader.hasSheet('tiles_citylines_v1')) {
      // Pass tuning accessor for reactive updates
      game = new CityLinesGame(gpuLoader, () => tuning.game());
      game.loadLevel(sampleLevel);
      app.stage.addChild(game);
    }
  });

  // Reactive background color
  createEffect(() => {
    if (app) {
      app.renderer.background.color = tuning.game().visuals.backgroundColor;
    }
  });

  // Reactive game positioning (when tile size changes)
  createEffect(() => {
    if (game && app) {
      const tileSize = tuning.game().grid.tileSize;
      const gridPixelSize = game.gridSize * tileSize;
      game.x = (app.screen.width - gridPixelSize) / 2;
      game.y = (app.screen.height - gridPixelSize) / 2;
    }
  });

  // ... rest of component
}
```

---

## Summary

| Tuning Category | Reactivity Level | Implementation Effort |
|-----------------|------------------|----------------------|
| Colors/Tints | Hot reload | Low - just update properties |
| Alpha/Opacity | Hot reload | Low - just update properties |
| Animation timing | Hot reload | Low - use getters |
| Tile size | Soft reload | Medium - reposition all objects |
| Sprite scales | Soft reload | Medium - rebuild sprites |
| Grid size | Hard reload | Low - show restart message |
| Difficulty presets | Hard reload | Low - show restart message |

The key insight is that PixiJS objects need explicit updates when values change - they don't automatically react like JSX. The solution is to:

1. Pass signal accessors (not values) to game objects
2. Use `createEffect` to watch for changes
3. Call update methods on Pixi objects when changes occur
4. For hard reload params, show a notification that restart is required
