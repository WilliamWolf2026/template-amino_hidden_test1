# Tuning Wiring Indicator Report

## Goal

Visually indicate in Tweakpane which tuning parameters are **wired up** (actually used in reactive effects) vs **not wired** (defined but not yet connected to game logic).

```
┌─ Tuning ──────────────────────────┐
│                                   │
│ ▼ Grid                            │
│   Tile Size     [96px ▼]  ✓ green │
│   Padding       [20    ]  ✓ green │
│   Cell Gap      [0     ]  ✓ green │
│   ▼ Nine Slice                    │
│     Left Width  [20    ]  ✓ green │
│     Top Height  [20    ]  ✓ green │
│                                   │
│ ▼ Visuals                         │
│   Background    [██████]  ✓ green │
│   Road Tint     [██████]  ✗ RED   │  ← Not wired!
│   Landmark Scale[1.1   ]  ✗ RED   │  ← Not wired!
│                                   │
└───────────────────────────────────┘
```

---

## Implementation Approaches

### Approach 1: Manual Registry (Recommended)

Create a registry of wired paths that gets updated as we implement features.

**File: `src/scaffold/dev/tuningRegistry.ts`**

```typescript
/**
 * Registry of tuning paths that are wired up to reactive effects.
 * Add paths here as they get implemented.
 */
export const WIRED_TUNING_PATHS = new Set([
  // Grid
  'grid.tileSize',
  'grid.padding',
  'grid.cellGap',
  'grid.nineSlice.leftWidth',
  'grid.nineSlice.topHeight',
  'grid.nineSlice.rightWidth',
  'grid.nineSlice.bottomHeight',

  // Visuals
  'visuals.backgroundColor',

  // Scaffold
  'scaffold.engine.antialias',
  'scaffold.audio.masterVolume',
]);

export function isPathWired(path: string): boolean {
  return WIRED_TUNING_PATHS.has(path);
}
```

**Update `bindings.ts`:**

```typescript
import { isPathWired } from './tuningRegistry';

function createBinding(
  parent: FolderOrPane,
  key: string,
  value: unknown,
  onUpdate: (value: unknown) => void,
  fullPath: string  // Add full path parameter
): void {
  const label = formatLabel(key);
  const obj = { [key]: value };
  const isWired = isPathWired(fullPath);

  // Add visual indicator based on wiring status
  const styledLabel = isWired ? label : `⚠️ ${label}`;

  if (typeof value === 'boolean') {
    const binding = parent.addBinding(obj, key, { label: styledLabel });

    // Apply CSS class for styling
    if (!isWired) {
      binding.element.classList.add('tp-unwired');
    }

    binding.on('change', (ev: { value: boolean }) => onUpdate(ev.value));
    return;
  }
  // ... rest of binding types
}
```

**CSS Styling:**

```css
/* Add to app.css or inject via JS */
.tp-unwired .tp-lblv_l {
  color: #ff6b6b !important;
}

.tp-unwired .tp-lblv_v {
  border-color: #ff6b6b !important;
}
```

### Approach 2: Runtime Tracking

Track which paths are actually accessed during reactive effects.

```typescript
// tuningTracker.ts
const accessedPaths = new Set<string>();

export function trackAccess(path: string) {
  accessedPaths.add(path);
}

export function getAccessedPaths(): Set<string> {
  return accessedPaths;
}

export function isPathAccessed(path: string): boolean {
  return accessedPaths.has(path);
}
```

**Wrap tuning accessor:**

```typescript
// In TuningProvider
function createTrackedAccessor<T>(getter: () => T, basePath: string): () => T {
  return () => {
    const value = getter();
    return new Proxy(value as object, {
      get(target, prop) {
        const path = `${basePath}.${String(prop)}`;
        trackAccess(path);
        return target[prop as keyof typeof target];
      }
    }) as T;
  };
}
```

**Downside:** Only tracks paths accessed at least once, not all paths that *would* be reactive.

### Approach 3: Declarative Wiring Metadata

Add metadata to the tuning types themselves.

```typescript
// types.ts
export interface TunableParam<T> {
  value: T;
  wired: boolean;
  description?: string;
}

export interface GridConfig {
  tileSize: TunableParam<number>;
  padding: TunableParam<number>;
  // ...
}
```

**Downside:** Significantly changes the tuning structure.

---

## Recommended Implementation

### Step 1: Create Wiring Registry

**File: `src/scaffold/dev/tuningRegistry.ts`**

```typescript
/**
 * Registry of wired tuning paths.
 *
 * Add a path here when you wire it up in a createEffect.
 * Paths not in this list will appear red in Tweakpane.
 */

// Game tuning paths that are wired
export const WIRED_GAME_PATHS = new Set([
  // Grid - all wired
  'grid.tileSize',
  'grid.defaultGridSize',
  'grid.padding',
  'grid.cellGap',
  'grid.nineSlice.leftWidth',
  'grid.nineSlice.topHeight',
  'grid.nineSlice.rightWidth',
  'grid.nineSlice.bottomHeight',

  // Visuals - partially wired
  'visuals.backgroundColor',
  // NOT WIRED: roadConnectedTint, roadDisconnectedTint, landmarkConnectedScale, etc.

  // Screens - wired
  'screens.startBackgroundColor',
  'screens.loadingBackgroundColor',
]);

// Scaffold tuning paths that are wired
export const WIRED_SCAFFOLD_PATHS = new Set([
  'engine.antialias',
  'engine.backgroundAlpha',
  'audio.masterVolume',
  'audio.musicVolume',
  'audio.sfxVolume',
  'screens.loadingMinDuration',
  'screens.loadingFadeOut',
]);

export function isGamePathWired(path: string): boolean {
  return WIRED_GAME_PATHS.has(path);
}

export function isScaffoldPathWired(path: string): boolean {
  return WIRED_SCAFFOLD_PATHS.has(path);
}
```

### Step 2: Update Bindings

```typescript
// bindings.ts
import { isGamePathWired, isScaffoldPathWired } from './tuningRegistry';

function createBinding(
  parent: FolderOrPane,
  key: string,
  value: unknown,
  onUpdate: (value: unknown) => void,
  options: {
    fullPath: string;
    isScaffold: boolean;
  }
): void {
  const { fullPath, isScaffold } = options;
  const isWired = isScaffold
    ? isScaffoldPathWired(fullPath)
    : isGamePathWired(fullPath);

  const label = formatLabel(key);
  const obj = { [key]: value };

  // Create binding with indicator
  let binding: any;

  if (typeof value === 'boolean') {
    binding = parent.addBinding(obj, key, { label });
    binding.on('change', (ev: { value: boolean }) => onUpdate(ev.value));
  }
  // ... other types

  // Style unwired bindings
  if (binding && !isWired) {
    const element = binding.element as HTMLElement;
    element.style.setProperty('--tp-base-background-color', 'rgba(255, 100, 100, 0.2)');
    element.querySelector('.tp-lblv_l')?.classList.add('unwired-label');
  }
}

function bindObjectToPane(
  parent: FolderOrPane,
  obj: Record<string, unknown>,
  onUpdate: (path: string, value: unknown) => void,
  options: {
    pathPrefix?: string;
    isScaffold: boolean;
  }
): void {
  const { pathPrefix = '', isScaffold } = options;

  for (const [key, value] of Object.entries(obj)) {
    if (key === 'version') continue;

    const path = pathPrefix ? `${pathPrefix}.${key}` : key;

    if (value === null || value === undefined) continue;

    if (typeof value === 'object' && !Array.isArray(value)) {
      // Check if ANY child is unwired
      const hasUnwiredChild = !allChildrenWired(value, path, isScaffold);

      const folder = parent.addFolder({
        title: formatLabel(key) + (hasUnwiredChild ? ' ⚠️' : ''),
        expanded: false,
      });

      bindObjectToPane(folder, value as Record<string, unknown>, onUpdate, {
        pathPrefix: path,
        isScaffold,
      });
    } else {
      createBinding(parent, key, value, (newValue) => onUpdate(path, newValue), {
        fullPath: path,
        isScaffold,
      });
    }
  }
}

function allChildrenWired(
  obj: object,
  basePath: string,
  isScaffold: boolean
): boolean {
  const checker = isScaffold ? isScaffoldPathWired : isGamePathWired;

  for (const [key, value] of Object.entries(obj)) {
    const path = `${basePath}.${key}`;
    if (typeof value === 'object' && value !== null) {
      if (!allChildrenWired(value, path, isScaffold)) return false;
    } else {
      if (!checker(path)) return false;
    }
  }
  return true;
}
```

### Step 3: Add CSS

```typescript
// Inject styles in TuningPanel.tsx
const UNWIRED_STYLES = `
  .unwired-label {
    color: #ff6b6b !important;
    font-style: italic;
  }
  .tp-fldv_t:has(.unwired-indicator) {
    color: #ff9999;
  }
`;

// In onMount:
const styleEl = document.createElement('style');
styleEl.textContent = UNWIRED_STYLES;
document.head.appendChild(styleEl);
```

---

## Visual Design Options

### Option A: Red Text
```
Landmark Scale    [1.1   ]  ← Label in red
```

### Option B: Warning Emoji
```
⚠️ Landmark Scale [1.1   ]
```

### Option C: Background Tint
```
┌────────────────────────────┐
│ Landmark Scale  [1.1   ]   │  ← Row has red background tint
└────────────────────────────┘
```

### Option D: Folder Badge
```
▼ Visuals ⚠️ (3 unwired)
```

---

## Maintaining the Registry

### Convention
When you wire up a tuning value:

1. Add `createEffect` in GameScreen or relevant component
2. Add the path to `WIRED_GAME_PATHS` in tuningRegistry.ts
3. The red indicator automatically disappears

### Example Workflow

```typescript
// 1. Add effect in GameScreen.tsx
createEffect(() => {
  const game = gameInstance();
  if (!game) return;

  const { landmarkConnectedScale } = tuning.game().visuals;
  game.setLandmarkScale(landmarkConnectedScale);
});

// 2. Add to registry
WIRED_GAME_PATHS.add('visuals.landmarkConnectedScale');

// 3. Tweakpane now shows it as green/normal
```

---

## Files to Create/Modify

| File | Changes |
|------|---------|
| `src/scaffold/dev/tuningRegistry.ts` | NEW - wired paths registry |
| `src/scaffold/dev/bindings.ts` | Pass path to createBinding, add styling |
| `src/scaffold/dev/TuningPanel.tsx` | Inject CSS styles |

---

## Summary

1. **Manual registry** is most practical - explicitly declare wired paths
2. **Visual indicator** in Tweakpane (red text/background for unwired)
3. **Folder badges** show if any children are unwired
4. **Easy maintenance** - add path to registry when wiring up

This gives QA immediate visibility into which tuning params actually do something.
