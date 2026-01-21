# Nine-Slice Grid Background Report

## Current Problem

The `grid_backing.png` sprite is currently rendered **for each grid cell** individually:

```typescript
// CityLinesGame.ts - Current implementation
for (let row = 0; row < this.gridSize; row++) {
  for (let col = 0; col < this.gridSize; col++) {
    const cellBg = this.gpuLoader.createSprite('tiles_citylines_v1', 'grid_backing.png');
    cellBg.anchor.set(0.5);
    cellBg.width = this.tileSize;
    cellBg.height = this.tileSize;
    // ... positioned for each cell
  }
}
```

This creates **16 sprites for a 4×4 grid**, which is inefficient and doesn't match the intended design where `grid_backing.png` should be a **single 9-slice background** behind the entire grid.

---

## What is 9-Slice?

A 9-slice (or 9-patch) sprite divides an image into 9 regions:

```
┌─────┬───────────┬─────┐
│  1  │     2     │  3  │  ← Top row (corners + edge)
├─────┼───────────┼─────┤
│  4  │     5     │  6  │  ← Middle row (edges + center)
├─────┼───────────┼─────┤
│  7  │     8     │  9  │  ← Bottom row (corners + edge)
└─────┴───────────┴─────┘
```

**Behavior when scaled:**
- **Corners (1, 3, 7, 9)** - Stay fixed size, never stretch
- **Horizontal edges (2, 8)** - Stretch horizontally only
- **Vertical edges (4, 6)** - Stretch vertically only
- **Center (5)** - Stretches both directions

This keeps rounded corners crisp while the background scales to any size.

---

## PixiJS Implementation

### NineSliceSprite (PixiJS v8)

```typescript
import { NineSliceSprite, Texture } from 'pixi.js';

// Create from texture
const texture = Texture.from('grid_backing.png');

// Define slice borders (left, top, right, bottom)
const gridBackground = new NineSliceSprite({
  texture,
  leftWidth: 20,    // Left border width (pixels)
  topHeight: 20,    // Top border height (pixels)
  rightWidth: 20,   // Right border width (pixels)
  bottomHeight: 20, // Bottom border height (pixels)
});

// Scale to desired size
gridBackground.width = totalGridWidth;
gridBackground.height = totalGridHeight;
```

### Using with PixiLoader

```typescript
// In CityLinesGame.ts
const texture = this.gpuLoader.getTexture('tiles_citylines_v1', 'grid_backing.png');

const gridBackground = new NineSliceSprite({
  texture,
  leftWidth: 20,
  topHeight: 20,
  rightWidth: 20,
  bottomHeight: 20,
});
```

---

## Recommended Implementation

### Step 1: Update grid_backing.png Asset

Ensure the sprite has appropriate borders for 9-slice:

```
┌────────────────────────┐
│ ╭──╮              ╭──╮ │
│ │  │   (stretch)  │  │ │ ← 20px top border
│ ╰──╯              ╰──╯ │
│                        │
│  (stretch)  (center)   │ ← Stretchable middle
│                        │
│ ╭──╮              ╭──╮ │
│ │  │   (stretch)  │  │ │ ← 20px bottom border
│ ╰──╯              ╰──╯ │
└────────────────────────┘
  ↑                    ↑
  20px left         20px right
```

Recommended source size: **64×64px** or **128×128px** with ~20px borders.

### Step 2: Add NineSliceSprite to CityLinesGame

```typescript
import { Container, NineSliceSprite } from 'pixi.js';

export class CityLinesGame extends Container {
  private gridBackground: NineSliceSprite | null = null;

  // Configurable slice borders (could come from tuning)
  private sliceBorder = 20;

  loadLevel(config: LevelConfig): void {
    this.clearLevel();
    this.gridSize = config.gridSize;

    // Create single 9-slice background
    this.createGridBackground();

    // Create exits, landmarks, road tiles...
    // (NO individual cell backgrounds)
  }

  private createGridBackground(): void {
    const texture = this.gpuLoader.getTexture('tiles_citylines_v1', 'grid_backing.png');

    this.gridBackground = new NineSliceSprite({
      texture,
      leftWidth: this.sliceBorder,
      topHeight: this.sliceBorder,
      rightWidth: this.sliceBorder,
      bottomHeight: this.sliceBorder,
    });

    // Position at origin (0, 0) of game container
    this.gridBackground.x = 0;
    this.gridBackground.y = 0;

    // Size to fit grid with padding
    this.updateGridBackgroundSize();

    // Add as first child (behind everything)
    this.gridContainer.addChild(this.gridBackground);
  }

  private updateGridBackgroundSize(): void {
    if (!this.gridBackground) return;

    const totalWidth = this.getGridPixelSize();
    const totalHeight = this.getGridPixelSize();

    this.gridBackground.width = totalWidth;
    this.gridBackground.height = totalHeight;
  }
}
```

### Step 3: Update Layout Animation

```typescript
private updateLayout(animate = true): void {
  const { duration, ease } = TUNING_ANIMATION;
  const animDuration = animate ? duration : 0;

  // Update 9-slice background size
  if (this.gridBackground) {
    const totalSize = this.getGridPixelSize();

    if (animate) {
      gsap.to(this.gridBackground, {
        width: totalSize,
        height: totalSize,
        duration: animDuration,
        ease,
      });
    } else {
      this.gridBackground.width = totalSize;
      this.gridBackground.height = totalSize;
    }
  }

  // Update exits, landmarks, road tiles...
  // (Same as before)
}
```

### Step 4: Remove Individual Cell Backgrounds

Delete the loop that creates per-cell backgrounds:

```typescript
// REMOVE THIS:
for (let row = 0; row < this.gridSize; row++) {
  for (let col = 0; col < this.gridSize; col++) {
    const cellBg = this.gpuLoader.createSprite('tiles_citylines_v1', 'grid_backing.png');
    // ...
  }
}
```

---

## Tuning Parameters

Add slice border to tuning config:

```json
// game.json
{
  "grid": {
    "tileSize": 96,
    "defaultGridSize": 4,
    "padding": 20,
    "cellGap": 0,
    "backgroundSliceBorder": 20
  }
}
```

```typescript
// types.ts
export interface GridConfig {
  tileSize: number;
  defaultGridSize: GridSize;
  padding: number;
  cellGap: number;
  backgroundSliceBorder: number;
}
```

---

## Position Calculation

The 9-slice background should be positioned to include the padding:

```
Grid Background (9-slice):
┌─────────────────────────────────────┐
│         padding                     │
│    ┌───────────────────────────┐    │
│    │  Tile  │  Gap  │  Tile   │    │
│ p  ├────────┼───────┼─────────┤  p │
│ a  │  Tile  │  Gap  │  Tile   │  a │
│ d  ├────────┼───────┼─────────┤  d │
│    │  Tile  │  Gap  │  Tile   │    │
│    └───────────────────────────┘    │
│         padding                     │
└─────────────────────────────────────┘
```

**Total size formula:**
```typescript
getGridPixelSize(): number {
  return this.padding * 2
       + this.gridSize * this.tileSize
       + (this.gridSize - 1) * this.cellGap;
}
```

**Tile positions (relative to background):**
```typescript
const tileX = this.padding + col * (this.tileSize + this.cellGap) + this.tileSize / 2;
const tileY = this.padding + row * (this.tileSize + this.cellGap) + this.tileSize / 2;
```

---

## Full Implementation Example

```typescript
// CityLinesGame.ts
import { Container, NineSliceSprite } from 'pixi.js';
import gsap from 'gsap';

export class CityLinesGame extends Container {
  private gridBackground: NineSliceSprite | null = null;
  private sliceBorder = 20;

  loadLevel(config: LevelConfig): void {
    this.clearLevel();
    this.gridSize = config.gridSize;
    this.connectionDetector = new ConnectionDetector(this.gridSize);

    // Create 9-slice grid background (single sprite)
    const texture = this.gpuLoader.getTexture('tiles_citylines_v1', 'grid_backing.png');
    this.gridBackground = new NineSliceSprite({
      texture,
      leftWidth: this.sliceBorder,
      topHeight: this.sliceBorder,
      rightWidth: this.sliceBorder,
      bottomHeight: this.sliceBorder,
    });

    const totalSize = this.getGridPixelSize();
    this.gridBackground.width = totalSize;
    this.gridBackground.height = totalSize;
    this.gridContainer.addChild(this.gridBackground);

    // Create exits...
    // Create landmarks...
    // Create road tiles...
  }

  clearLevel(): void {
    this.gridContainer.removeChildren();
    this.gridBackground = null;
    // ... rest of cleanup
  }

  private updateLayout(animate = true): void {
    const { duration, ease } = TUNING_ANIMATION;
    const animDuration = animate ? duration : 0;
    const totalSize = this.getGridPixelSize();

    // Animate 9-slice background
    if (this.gridBackground) {
      if (animate) {
        gsap.to(this.gridBackground, {
          width: totalSize,
          height: totalSize,
          duration: animDuration,
          ease,
        });
      } else {
        this.gridBackground.width = totalSize;
        this.gridBackground.height = totalSize;
      }
    }

    // Update game objects...
  }
}
```

---

## Performance Benefits

| Approach | Sprites | Draw Calls |
|----------|---------|------------|
| Current (per-cell) | 16 (4×4) to 36 (6×6) | Multiple |
| 9-Slice (single) | 1 | 1 |

The 9-slice approach is significantly more efficient:
- **Fewer sprites** - 1 instead of N²
- **Fewer draw calls** - All in one batch
- **Better scaling** - Corners stay sharp at any size
- **Cleaner code** - No loops for background creation

---

## Files to Modify

| File | Changes |
|------|---------|
| `CityLinesGame.ts` | Replace cell loop with NineSliceSprite |
| `game.json` | Add `backgroundSliceBorder` param |
| `types.ts` | Add to GridConfig interface |
| `grid_backing.png` | Ensure proper border regions |

---

## Summary

1. **Replace** per-cell background sprites with single `NineSliceSprite`
2. **Size** the background to `getGridPixelSize()` (includes padding + gaps)
3. **Animate** width/height with GSAP when tuning changes
4. **Position** tiles relative to padding offset
5. **Optionally** add `backgroundSliceBorder` to tuning config

This matches the intended design where the grid background is a single scalable panel behind all game elements.
