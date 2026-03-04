# Landmark Indicators Report

## Issue Summary

The current implementation adds **connection indicators** (small circles) to landmarks and reduces their sprite size to accommodate these indicators. The user reported:

1. "the diner and gas station and these types of tiles look like they have a color background"
2. "the tile is not full tile size because you are drawing indicators on it"
3. Request: "remove that, also dont do that remove the indicators"

## Current Implementation Analysis

### What's Being Drawn (Landmark.ts)

**Connection Indicators** (lines 72-95):
```typescript
private createConnectionIndicators(tileSize: number): void {
  const indicatorSize = tileSize * 0.08;
  const offset = tileSize * 0.42;

  for (const edge of this.connectableEdges) {
    const indicator = new Graphics();
    indicator.circle(0, 0, indicatorSize);
    indicator.fill({ color: 0xcccccc }); // Gray circle
    // Positioned at north/east/south/west edges
    this.connectionIndicators.set(edge, indicator);
    this.addChild(indicator);
  }
}
```

**Visual behavior**:
- Small circles drawn at each connectable edge (north, east, south, west)
- Gray (0xcccccc) when unconnected
- Green (0x27ae60) when connected
- Size: 8% of tile size

**Sprite Size Reduction** (lines 44-45):
```typescript
this.sprite.width = tileSize * 0.85;  // Only 85% of tile
this.sprite.height = tileSize * 0.85;
```

The landmark sprite is shrunk to 85% to leave room for the indicators around the edges.

**Color Tint** (lines 111-117):
```typescript
if (this._isConnectedToExit) {
  this.sprite.tint = 0xffffff;  // White (normal)
  this.sprite.alpha = 1.0;
} else {
  this.sprite.tint = 0xe0e0e0;  // Gray tint
  this.sprite.alpha = 0.9;      // Slightly transparent
}
```

When landmarks are NOT connected to the exit, they get a gray tint and reduced alpha, creating the appearance of a "color background."

---

## What the GDD Says

### Visual Feedback System (GDD lines 441-446)

The GDD specifies visual feedback for **road tiles**, not landmarks:

```
When road tile directly next to highway sign is correctly orientated,
the road on that tile turns green
  - If the tile is not correctly oriented, it doesn't change
All subsequent tiles that are correctly orientated and in contact with
the tile next to the highway also turn green
```

### Connection Feedback (GDD line 50)

"Roads light up when a landmark is connected to the turnpike"

**Key observation**: The GDD talks about **roads lighting up**, not landmarks having indicators.

### Asset List (GDD lines 287-293)

Shared Game Pieces listed:
- House
- Gas station
- Diner
- School
- Exit sign
- Road tiles (straight, L shaped, T junction)

**No mention of connection indicators on landmarks.**

---

## Comparison: Current vs GDD

| Feature | Current Implementation | GDD Specification |
|---------|----------------------|-------------------|
| Landmark sprites | 85% of tile size | Full size implied |
| Connection indicators | Small circles at edges | Not mentioned |
| Visual feedback | Gray tint on landmarks | Roads turn green |
| Landmark appearance | Changes based on connection | Not mentioned |

---

## Conclusion: Should Indicators Be Removed?

**YES** - Based on the GDD, the connection indicators on landmarks should be removed because:

1. **Not in GDD**: Connection indicators are not mentioned anywhere in the game design document
2. **Wrong feedback location**: The GDD specifies that **roads** should provide visual feedback, not landmarks
3. **Size reduction unnecessary**: Landmarks should fill the tile properly
4. **Simpler design**: The GDD emphasizes a clean, readable puzzle interface

---

## Visual Feedback System According to GDD

The correct feedback system should be:

### Current (Incorrect)
```
┌─────────────────┐
│   ╭─────────╮   │
│   │ LANDMARK│   │  ← 85% size
│ • │         │ • │  ← Gray/green circles (indicators)
│   │         │   │
│   ╰─────────╯   │
│        •        │
└─────────────────┘
```

### Correct (Per GDD)
```
┌─────────────────┐
│                 │
│   ╭─────────╮   │
│   │ LANDMARK│   │  ← Full size (95-100%)
│   │         │   │  ← No indicators
│   │         │   │  ← No gray tint
│   ╰─────────╯   │
│                 │
└─────────────────┘
        │
        ↓
   [Road tile]  ← THIS turns green when connected
```

---

## Recommended Changes

### 1. Remove Connection Indicators

**In Landmark.ts:**
- Remove `connectionIndicators` property
- Remove `createConnectionIndicators()` method
- Remove `updateIndicatorPositions()` method
- Remove indicator updates from `updateVisuals()`

### 2. Increase Landmark Sprite Size

Change from 85% to 90-95% of tile:
```typescript
// Current
this.sprite.width = tileSize * 0.85;
this.sprite.height = tileSize * 0.85;

// Recommended
this.sprite.width = tileSize * 0.95;  // Or even 1.0 for full tile
this.sprite.height = tileSize * 0.95;
```

### 3. Remove or Reduce Landmark Tinting

**Option A: Remove completely**
```typescript
// Always show full color
this.sprite.tint = 0xffffff;
this.sprite.alpha = 1.0;
```

**Option B: Subtle scale change** (matches GDD's "light up" concept)
```typescript
if (this._isConnectedToExit) {
  this.sprite.scale.set(1.0);
} else {
  this.sprite.scale.set(0.95);  // Slightly smaller when unconnected
}
```

### 4. Ensure Road Feedback is Correct

Verify that **road tiles** (not landmarks) are providing the green visual feedback when connected. This is likely already correct in RoadTile.ts.

---

## Impact Assessment

### Code Changes Required
| File | Changes | Risk |
|------|---------|------|
| `Landmark.ts` | Remove indicators, increase sprite size, simplify visuals | Low |
| `CityLinesGame.ts` | No changes needed | None |
| `RoadTile.ts` | Verify green feedback works | Low |

### Visual Impact
- **Cleaner**: Landmarks will look more polished without indicator circles
- **Larger**: Landmarks will be more prominent at 95% tile size
- **Simpler**: Visual feedback focuses on roads (as per GDD)

### Gameplay Impact
- **No functional change**: Game logic remains the same
- **Better UX**: Players focus on road connections (the actual puzzle mechanic)
- **Matches design intent**: Aligns with GDD specification

---

## Summary

The connection indicators on landmarks are:
1. ❌ Not specified in the GDD
2. ❌ Causing landmarks to appear smaller than intended
3. ❌ Creating a "color background" appearance due to reduced sprite size + gray tint
4. ❌ Providing feedback in the wrong location (should be on roads, not landmarks)

**Recommendation**: Remove all connection indicators from landmarks, increase sprite size to 95% of tile, and rely on road tile visual feedback as specified in the GDD.
