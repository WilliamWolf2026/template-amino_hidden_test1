# Animated Tuning Transitions Report

## Current State

Tuning changes update **instantly** - values snap from old to new. This works but feels jarring, especially for spatial changes like tile size.

## Goal

Animate tuning changes using GSAP for smooth, polished transitions during development/QA testing.

---

## Implementation Approaches

### Approach 1: Animate in setTileSize (Recommended)

Modify each `setTileSize()` method to use GSAP instead of direct property assignment.

```typescript
// CityLinesGame.ts
import gsap from 'gsap';

setTileSize(newSize: number, animate = true): void {
  if (newSize === this.tileSize) return;

  const oldSize = this.tileSize;
  this.tileSize = newSize;

  const duration = animate ? 0.3 : 0;
  const ease = 'power2.out';

  // Animate grid cells
  let cellIndex = 0;
  for (let row = 0; row < this.gridSize; row++) {
    for (let col = 0; col < this.gridSize; col++) {
      const cell = this.gridContainer.children[cellIndex];
      if (cell) {
        gsap.to(cell, {
          width: newSize,
          height: newSize,
          x: col * newSize + newSize / 2,
          y: row * newSize + newSize / 2,
          duration,
          ease,
        });
      }
      cellIndex++;
    }
  }

  // Animate exits, landmarks, road tiles
  for (const exit of this.exits) {
    exit.animateToTileSize(newSize, duration);
  }
  for (const landmark of this.landmarks) {
    landmark.animateToTileSize(newSize, duration);
  }
  for (const tile of this.roadTiles) {
    tile.animateToTileSize(newSize, duration);
  }
}
```

**Exit.ts example:**
```typescript
animateToTileSize(newSize: number, duration: number): void {
  this.tileSize = newSize;

  gsap.to(this, {
    x: this.gridPosition.col * newSize + newSize / 2,
    y: this.gridPosition.row * newSize + newSize / 2,
    duration,
    ease: 'power2.out',
  });

  gsap.to(this.sprite, {
    width: newSize * 0.85,
    height: newSize * 0.85,
    duration,
    ease: 'power2.out',
  });
}
```

### Approach 2: Tweened Signal Wrapper

Create a utility that wraps tuning values with GSAP tweening.

```typescript
// tuningTween.ts
import { createSignal, createEffect } from 'solid-js';
import gsap from 'gsap';

export function createTweenedValue(
  getValue: () => number,
  duration = 0.3
) {
  const [tweened, setTweened] = createSignal(getValue());

  createEffect(() => {
    const target = getValue();
    gsap.to({ value: tweened() }, {
      value: target,
      duration,
      ease: 'power2.out',
      onUpdate: function() {
        setTweened(this.targets()[0].value);
      },
    });
  });

  return tweened;
}

// Usage in GameScreen
const tweenedTileSize = createTweenedValue(
  () => tuning.game().grid.tileSize
);

createEffect(() => {
  const size = tweenedTileSize(); // Smoothly interpolated
  game.setTileSize(size, false); // No internal animation
});
```

### Approach 3: Tuning Animation Config

Add animation settings to the tuning config itself.

```json
// game.json
{
  "tuningAnimation": {
    "enabled": true,
    "duration": 0.3,
    "ease": "power2.out",
    "stagger": 0.02
  }
}
```

```typescript
// In CityLinesGame
setTileSize(newSize: number): void {
  const config = this.tuning().tuningAnimation;
  const duration = config.enabled ? config.duration : 0;

  // Use config.stagger for wave effect
  gsap.to(this.roadTiles, {
    // ... properties
    duration,
    stagger: config.stagger,
  });
}
```

---

## Padding & Cell Gap Implementation

Currently `padding` and `cellGap` are not reactive. Here's how to implement them:

### Grid Layout with Padding and Gap

```typescript
// CityLinesGame.ts
private padding: number;
private cellGap: number;

setGridLayout(padding: number, cellGap: number, animate = true): void {
  this.padding = padding;
  this.cellGap = cellGap;

  const duration = animate ? 0.3 : 0;
  const effectiveTileSize = this.tileSize + cellGap;

  let cellIndex = 0;
  for (let row = 0; row < this.gridSize; row++) {
    for (let col = 0; col < this.gridSize; col++) {
      const cell = this.gridContainer.children[cellIndex];
      if (cell) {
        gsap.to(cell, {
          x: padding + col * effectiveTileSize + this.tileSize / 2,
          y: padding + row * effectiveTileSize + this.tileSize / 2,
          duration,
          ease: 'power2.out',
        });
      }
      cellIndex++;
    }
  }

  // Update all game objects with new positions
  for (const exit of this.exits) {
    const pos = exit.gridPosition;
    gsap.to(exit, {
      x: padding + pos.col * effectiveTileSize + this.tileSize / 2,
      y: padding + pos.row * effectiveTileSize + this.tileSize / 2,
      duration,
    });
  }
  // ... same for landmarks and road tiles
}
```

### GameScreen Reactive Effect

```typescript
// GameScreen.tsx
createEffect(() => {
  const game = gameInstance();
  if (!game) return;

  const { padding, cellGap } = tuning.game().grid;
  game.setGridLayout(padding, cellGap);
});
```

---

## Position Calculation Formula

With padding and gap, the position formula changes:

```
Without gap/padding:
  x = col * tileSize + tileSize / 2
  y = row * tileSize + tileSize / 2

With gap/padding:
  effectiveSize = tileSize + cellGap
  x = padding + col * effectiveSize + tileSize / 2
  y = padding + row * effectiveSize + tileSize / 2

Grid total size:
  gridPixelSize = padding * 2 + gridSize * tileSize + (gridSize - 1) * cellGap
```

---

## Animation Configurations

### Tile Size Change
```typescript
{
  duration: 0.3,
  ease: 'power2.out',
  stagger: 0.02, // Wave effect across tiles
}
```

### Color/Tint Change
```typescript
{
  duration: 0.2,
  ease: 'power1.out',
}
```

### Scale Change (landmarks)
```typescript
{
  duration: 0.25,
  ease: 'back.out(1.7)', // Slight overshoot
}
```

### Gap/Padding Change
```typescript
{
  duration: 0.4,
  ease: 'power3.out',
  stagger: 0.01, // Subtle wave
}
```

---

## Implementation Priority

| Feature | Effort | Impact |
|---------|--------|--------|
| Animated tile size | Medium | High - most noticeable |
| Animated padding/gap | Medium | Medium - layout changes |
| Animated colors | Low | Low - already fast |
| Stagger effects | Low | Medium - polish |

---

## Files to Modify

| File | Changes |
|------|---------|
| `CityLinesGame.ts` | Add `setGridLayout()`, update `setTileSize()` with GSAP |
| `Exit.ts` | Add `animateToTileSize()`, `animateToPosition()` |
| `Landmark.ts` | Add `animateToTileSize()`, `animateToPosition()` |
| `RoadTile.ts` | Add `animateToTileSize()`, `animateToPosition()` |
| `GameScreen.tsx` | Add effect for padding/cellGap |
| `game.json` | (Optional) Add `tuningAnimation` config |

---

## Example: Full Animated setTileSize

```typescript
// RoadTile.ts
import gsap from 'gsap';

animateToTileSize(
  newSize: number,
  padding: number,
  cellGap: number,
  duration = 0.3
): void {
  this.tileSize = newSize;

  const effectiveSize = newSize + cellGap;
  const newX = padding + this.gridPosition.col * effectiveSize + newSize / 2;
  const newY = padding + this.gridPosition.row * effectiveSize + newSize / 2;

  // Animate position
  gsap.to(this, {
    x: newX,
    y: newY,
    duration,
    ease: 'power2.out',
  });

  // Animate sprite sizes
  gsap.to(this.defaultSprite, {
    width: newSize,
    height: newSize,
    duration,
    ease: 'power2.out',
  });

  gsap.to(this.completedSprite, {
    width: newSize,
    height: newSize,
    duration,
    ease: 'power2.out',
  });
}
```

---

## Summary

1. **Recommended**: Modify existing `setTileSize()` methods to use GSAP
2. **Add** `setGridLayout()` for padding/cellGap with animation
3. **Keep** instant mode available (duration=0) for initial load
4. **Consider** tuning config for animation settings
5. **Use** stagger for wave effects across multiple tiles

The key insight is that GSAP can animate any numeric property on PixiJS objects directly. The challenge is coordinating multiple animations (position + size) to feel cohesive.
