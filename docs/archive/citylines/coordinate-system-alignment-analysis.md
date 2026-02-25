# Coordinate System Alignment Analysis

**Date**: 2026-01-27
**Question**: Should we adapt the tile rendering to match the generator's coordinate/rotation system?
**Status**: Architectural Decision

---

## Executive Summary

**Current Approach**: Create converter layer (generator format → game format)
**Proposed Approach**: Refactor game to use generator's format directly

**Recommendation**: ✅ **Refactor game to match generator** - cleaner long-term architecture, eliminates translation overhead, single source of truth.

**Reason**: The generator is the authoritative source for level structure. The game should adapt to it, not vice versa.

---

## Current State: Two Incompatible Systems

### Generator's Format (Source of Truth)

**Coordinates**: `(x, y)` where:
- `x` = column (0-based, left to right)
- `y` = row (0-based, top to bottom)
- Standard Cartesian-like system

**Rotations**: `0, 1, 2, 3` (integer states)
- `0` = 0° (no rotation)
- `1` = 90° clockwise
- `2` = 180°
- `3` = 270° clockwise

**Rotation Map**: `number[][]` indexed as `[y][x]`
- `-1` = not a road
- `0-3` = rotation state

**Example**:
```typescript
level.rotationsMap[2][3] // Row 2, Col 3
// Access: [y][x]
```

### Game's Current Format

**Coordinates**: `(row, col)` where:
- `row` = y coordinate
- `col` = x coordinate
- Explicit row/col naming

**Rotations**: `0, 90, 180, 270` (degrees)
- Separate `solutionRotation` and `initialRotation`
- Degrees instead of states

**Tile Placement**:
```typescript
{
  type: 'corner',
  row: 2,
  col: 3,
  solutionRotation: 90,
  initialRotation: 270
}
```

---

## Option A: Converter Approach (Original Plan)

### What It Involves

Create translation layer between formats:

```typescript
// Converter function
function convertGeneratedLevel(level: Level): LevelConfig {
  return {
    roadTiles: level.paths.map(path => ({
      row: point.y,        // y → row
      col: point.x,        // x → col
      solutionRotation: rotation * 90,  // 0-3 → degrees
      // ... tile type inference
    })),
  };
}
```

### Pros
- ✅ No changes to existing game code
- ✅ Supports both handcrafted and generated levels
- ✅ Backwards compatible with `sampleLevel`
- ✅ Clear separation of concerns

### Cons
- ❌ Translation overhead on every level load
- ❌ Two coordinate systems to maintain
- ❌ Potential for conversion bugs
- ❌ Confusion: which system am I working with?
- ❌ Extra complexity: converter + tests

### Effort
- Converter implementation: 2-3 days
- Unit tests: 1 day
- Integration testing: 1 day
- **Total**: 4-5 days

---

## Option B: Align Game to Generator (Proposed)

### What It Involves

Refactor game's coordinate and rotation system to match generator:

1. **Change coordinate naming** throughout game:
   - `(row, col)` → `(x, y)`
   - Update all tile positioning logic
   - Update collision detection

2. **Change rotation format**:
   - `0/90/180/270` degrees → `0/1/2/3` states
   - Update rotation animations
   - Update tile rendering

3. **Adapt tile system** to work with paths:
   - Accept `Point[]` arrays (paths)
   - Infer tile types from connections
   - Use generator's rotation map directly

4. **Update level config**:
   - Replace `RoadTilePlacement[]` with `paths: Point[][]`
   - Add `rotationsMap: number[][]`
   - Keep landmarks/exits but adjust coordinates

### Changes Required

#### 1. Tile Coordinate System

**Before** (current):
```typescript
// Tile placement
interface RoadTilePlacement {
  row: number;  // y
  col: number;  // x
}

// Usage in game
tile.sprite.x = tile.col * tileSize;
tile.sprite.y = tile.row * tileSize;
```

**After** (aligned):
```typescript
// Point-based (generator format)
type Point = { x: number; y: number };

// Usage in game
tile.sprite.x = tile.x * tileSize;
tile.sprite.y = tile.y * tileSize;
```

**Impact**: Update ~50-100 lines across tile rendering, collision detection, grid layout.

#### 2. Rotation System

**Before** (current):
```typescript
// Degrees
tile.solutionRotation = 90;  // 90 degrees
tile.sprite.angle = tile.solutionRotation;

// Rotation logic
if (tile.sprite.angle >= 360) {
  tile.sprite.angle -= 360;
}
```

**After** (aligned):
```typescript
// States (0-3)
tile.rotationState = 1;  // 90 degrees
tile.sprite.angle = tile.rotationState * 90;

// Rotation logic
tile.rotationState = (tile.rotationState + 1) % 4;
tile.sprite.angle = tile.rotationState * 90;
```

**Impact**: Update tile rotation animation, solution checking (~20-30 lines).

#### 3. Level Config Structure

**Before** (current):
```typescript
interface LevelConfig {
  roadTiles: RoadTilePlacement[];  // Explicit tiles
  // ...
}

// Usage
game.loadLevel({
  roadTiles: [
    { type: 'corner', row: 2, col: 3, solutionRotation: 90, initialRotation: 0 },
  ],
});
```

**After** (aligned):
```typescript
interface LevelConfig {
  paths: Point[][];           // Generator format
  rotationsMap: number[][];   // Generator format
  // ...
}

// Usage (direct from generator)
const level = generator.generate();
game.loadLevel({
  paths: level.paths,
  rotationsMap: level.rotationsMap,
  entryPoint: level.entryPoint,
  exitPoints: level.exitPoints,
});
```

**Impact**: Refactor `loadLevel()` to build tiles from paths (~100-150 lines).

#### 4. Tile Type Inference (Same as Converter)

This is still needed - generator outputs paths, game needs to know tile types for rendering:

```typescript
// In loadLevel()
function inferTileType(point: Point, paths: Point[][]): RoadTileType {
  const connections = getConnections(point, paths);
  if (connections.length === 2) {
    return areOpposite(connections[0], connections[1])
      ? 'straight'
      : 'corner';
  }
  return 't_junction';
}
```

**Impact**: ~100 lines of tile type inference logic (same as converter).

### Pros
- ✅ **Single coordinate system** (no translation)
- ✅ **No conversion overhead** (direct data flow)
- ✅ **Generator is source of truth** (architectural clarity)
- ✅ **Simpler long-term** (one system to maintain)
- ✅ **Better performance** (no conversion step)
- ✅ **Easier debugging** (coordinates match generator)

### Cons
- ❌ **More invasive changes** (touches existing code)
- ❌ **Requires thorough testing** (coordinate system is fundamental)
- ❌ **Breaks existing `sampleLevel`** (needs conversion once)
- ❌ **Higher upfront effort** (refactoring vs new code)

### Effort
- Coordinate system refactor: 1-2 days
- Rotation system refactor: 1 day
- Level loading refactor: 2 days
- Tile type inference: 1 day
- Testing (critical!): 2 days
- **Total**: 7-8 days

---

## Detailed Comparison

| Aspect | Converter Approach | Alignment Approach |
|--------|-------------------|-------------------|
| **Coordinate System** | Two systems (conversion needed) | One system (generator's) |
| **Runtime Performance** | Conversion overhead per level | Direct data flow |
| **Code Complexity** | Converter layer + dual systems | Single system |
| **Maintenance Burden** | Maintain converter + both systems | Maintain one system |
| **Testing Surface** | Converter tests + game tests | Game tests only |
| **Future Proofing** | Generator changes = update converter | Generator changes = compatible |
| **Debugging** | Confusion: which coords am I in? | Clear: always generator coords |
| **Upfront Effort** | 4-5 days | 7-8 days |
| **Long-term Cost** | Higher (maintain dual systems) | Lower (single system) |
| **Risk** | Low (isolated changes) | Medium (touches core systems) |
| **Backwards Compat** | Easy (supports old format) | Requires migration |

---

## Recommendation: Align Game to Generator

### Why Alignment Wins

1. **Architectural Purity**: Generator is the canonical source. Game should speak its language.

2. **Performance**: No conversion step = faster level loading.

3. **Simplicity**: One coordinate system across entire codebase.

4. **Maintainability**: Future generator changes don't require converter updates.

5. **Developer Experience**: No mental translation between systems.

6. **Scalability**: If we add more generator features (e.g., diagonal paths, elevation), no converter changes needed.

### The ROI Calculation

**Converter Approach**:
- Upfront: 4-5 days
- Ongoing: Maintain converter forever, debug conversion issues, update on generator changes
- Complexity: Dual systems + translation layer

**Alignment Approach**:
- Upfront: 7-8 days (3 days more)
- Ongoing: Maintain one system, no translation, direct compatibility
- Complexity: Single system

**Break-even**: After a few generator updates or feature additions, alignment approach pays off.

**Long-term**: Alignment is clearly superior.

---

## Implementation Strategy

### Phase 1: Coordinate System Migration (Days 1-2)

**Goal**: Change all `(row, col)` references to `(x, y)`

**Files to Update**:
1. `/src/game/citylines/types/level.ts`
   - Update `RoadTilePlacement` to use `x, y`
   - Update `ExitPlacement` to use `x, y`
   - Update `LandmarkPlacement` to use `x, y`

2. `/src/game/citylines/core/Tile.ts`
   - Change `row, col` properties to `x, y`
   - Update position calculations

3. `/src/game/citylines/core/CityLinesGame.ts`
   - Update grid layout logic
   - Update collision detection
   - Update tile positioning

4. `/src/game/citylines/core/GridLayout.ts` (if exists)
   - Update grid coordinate calculations

**Testing**:
- Run existing game with `sampleLevel`
- Verify tiles render at correct positions
- Verify collision detection still works

### Phase 2: Rotation System Migration (Day 3)

**Goal**: Change rotation degrees to states

**Files to Update**:
1. `/src/game/citylines/core/Tile.ts`
   - Change `solutionRotation: number` (degrees) to `rotationState: number` (0-3)
   - Update rotation animation to use states
   - Convert display: `sprite.angle = rotationState * 90`

2. `/src/game/citylines/core/CityLinesGame.ts`
   - Update solution checking: compare states instead of degrees
   - Update rotation logic: `(state + 1) % 4`

**Testing**:
- Verify tile rotation animations work
- Verify solution detection works
- Verify rotation wraps correctly (3 → 0)

### Phase 3: Level Config Refactor (Days 4-5)

**Goal**: Accept generator's path-based format

**Changes**:
1. Update `LevelConfig` interface:
```typescript
export interface LevelConfig {
  levelNumber: number;
  gridSize: number;           // Just one number (width = height)
  entryPoint: Point;          // NEW: direct from generator
  exitPoints: Point[];        // NEW: direct from generator
  paths: Point[][];           // NEW: instead of roadTiles
  rotationsMap: number[][];   // NEW: instead of initialRotation
  landmarks: LandmarkPlacement[];  // Keep, but use x,y
  county: string;
  clue: string;
}
```

2. Update `loadLevel()` to build tiles from paths:
```typescript
loadLevel(config: LevelConfig): void {
  // For each path point (except entry/exits)
  config.paths.forEach(path => {
    path.forEach(point => {
      // Infer tile type from connections
      const tileType = inferTileType(point, config.paths);

      // Get solution rotation from connections
      const solutionState = calculateSolutionState(point, config.paths);

      // Get initial rotation from rotationsMap
      const initialState = config.rotationsMap[point.y][point.x];

      // Create tile
      const tile = new Tile(point.x, point.y, tileType, solutionState, initialState);
      this.tiles.push(tile);
    });
  });
}
```

**Testing**:
- Load generator level directly
- Verify all tiles created correctly
- Verify tile types inferred correctly
- Verify rotations set correctly

### Phase 4: Tile Type Inference (Day 6)

**Goal**: Implement robust tile type detection

**Implementation**:
```typescript
function inferTileType(point: Point, paths: Point[][]): RoadTileType {
  const connections = getConnectedDirections(point, paths);

  if (connections.length === 2) {
    const [dir1, dir2] = connections;

    // Check if opposite (straight) or adjacent (corner)
    if (
      (dir1 === 'north' && dir2 === 'south') ||
      (dir1 === 'east' && dir2 === 'west')
    ) {
      return 'straight';
    }
    return 'corner';
  }

  if (connections.length === 3) {
    return 't_junction';
  }

  throw new Error(`Invalid tile at (${point.x}, ${point.y}): ${connections.length} connections`);
}

function getConnectedDirections(point: Point, paths: Point[][]): Direction[] {
  const directions: Direction[] = [];
  const pointStr = `${point.x},${point.y}`;

  // Check all 4 neighbors
  const neighbors = [
    { dx: 0, dy: -1, dir: 'north' },
    { dx: 0, dy: 1, dir: 'south' },
    { dx: 1, dy: 0, dir: 'east' },
    { dx: -1, dy: 0, dir: 'west' },
  ];

  for (const n of neighbors) {
    const neighborStr = `${point.x + n.dx},${point.y + n.dy}`;

    // Check if neighbor is in any path
    for (const path of paths) {
      if (path.some(p => `${p.x},${p.y}` === neighborStr)) {
        // Check if consecutive in path
        const pointIndex = path.findIndex(p => `${p.x},${p.y}` === pointStr);
        const neighborIndex = path.findIndex(p => `${p.x},${p.y}` === neighborStr);

        if (Math.abs(pointIndex - neighborIndex) === 1) {
          directions.push(n.dir as Direction);
          break;
        }
      }
    }
  }

  return directions;
}

function calculateSolutionState(point: Point, paths: Point[][]): number {
  const connections = getConnectedDirections(point, paths);

  // For straight tiles
  if (connections.includes('north') && connections.includes('south')) return 0;  // Vertical
  if (connections.includes('east') && connections.includes('west')) return 1;    // Horizontal

  // For corner tiles (NE = 0°, SE = 1, SW = 2, NW = 3)
  if (connections.includes('north') && connections.includes('east')) return 0;
  if (connections.includes('south') && connections.includes('east')) return 1;
  if (connections.includes('south') && connections.includes('west')) return 2;
  if (connections.includes('north') && connections.includes('west')) return 3;

  // For T-junctions
  if (!connections.includes('north')) return 2;  // Open south (T upside down)
  if (!connections.includes('south')) return 0;  // Open north (T normal)
  if (!connections.includes('east')) return 3;   // Open west (T rotated left)
  if (!connections.includes('west')) return 1;   // Open east (T rotated right)

  return 0;
}
```

**Testing**:
- Test all tile type patterns
- Test all rotation calculations
- Test edge cases (ends of paths, junctions)

### Phase 5: Migration & Integration (Day 7)

**Goal**: Integrate generator, migrate existing level

**Tasks**:
1. Convert `sampleLevel` to new format:
```typescript
// Old format → new format converter (one-time use)
const newSampleLevel = convertOldLevelFormat(oldSampleLevel);
```

2. Wire up generator:
```typescript
import { LevelGenerator } from '~/game/citylines/core/LevelGenerator';

const generator = new LevelGenerator({
  seed: Date.now(),
  width: 4,
  height: 4,
  exitPoints: 1,
  pointsSpacing: 3,
  distanceFormula: 'euclideanDistance',
  sidePushRadius: 2,
  sidePushFactor: 1,
});

const generatedLevel = generator.generate();
const complexLevel = generator.addComplexityMultiple(generatedLevel, [...]);
const rotatedLevel = generator.addRotations(complexLevel, { rotationFactor: 0.6 });

// Convert to LevelConfig (add landmarks, clue, etc.)
const levelConfig = {
  ...rotatedLevel,
  levelNumber: 1,
  county: 'atlantic',
  clue: 'Generated clue',
  landmarks: placeLandmarks(rotatedLevel, 2),
};

game.loadLevel(levelConfig);
```

**Testing**:
- Load converted `sampleLevel`, verify identical behavior
- Load generated level, verify playability
- Test multiple generated levels

### Phase 6: Testing & Polish (Day 8)

**Goal**: Comprehensive testing and bug fixes

**Test Plan**:
1. Unit tests for coordinate conversions
2. Unit tests for tile type inference
3. Unit tests for rotation calculations
4. Integration tests: load 50 generated levels, verify all solvable
5. Visual regression tests: screenshots of tile rendering
6. Performance tests: level loading time
7. Gameplay tests: solve multiple levels, verify completion detection

---

## Risk Mitigation

### Risk 1: Coordinate System Bugs

**Risk**: Wrong coordinates break tile positioning, collision, etc.

**Mitigation**:
- Incremental changes (Phase 1 first, test extensively)
- Visual debugging (render coordinate labels on tiles)
- Automated tests for each file changed
- Manual QA: play through multiple levels

### Risk 2: Rotation State Confusion

**Risk**: Mixing up rotation states vs degrees breaks animations.

**Mitigation**:
- Create utility functions: `stateToAngle()`, `angleToState()`
- Centralize rotation logic (don't scatter conversions)
- Unit tests for all rotation operations
- Clear variable naming: `rotationState` not `rotation`

### Risk 3: Tile Type Inference Bugs

**Risk**: Wrong tile types make levels unsolvable.

**Mitigation**:
- Extensive unit tests (all tile patterns)
- Validation pass after level load (check connectivity)
- Fallback: if inference fails, regenerate level
- Manual testing: visually verify tile types match roads

### Risk 4: Regression in Existing Gameplay

**Risk**: Refactoring breaks working features.

**Mitigation**:
- Keep `sampleLevel` working throughout (convert to new format)
- Regression test suite (automated gameplay tests)
- QA checklist: rotation, collision, completion, sounds, etc.
- Git branch for refactor (can revert if needed)

---

## Alternative: Hybrid Approach

**Idea**: Keep game's current system, but add generator format support.

**Implementation**:
```typescript
interface LevelConfig {
  // Legacy format (for handcrafted levels)
  roadTiles?: RoadTilePlacement[];

  // Generator format (for generated levels)
  paths?: Point[][];
  rotationsMap?: number[][];

  // Common fields
  landmarks: LandmarkPlacement[];
  // ...
}

// In loadLevel()
if (config.roadTiles) {
  // Use old loading logic
  this.loadFromTilePlacements(config.roadTiles);
} else if (config.paths) {
  // Use new loading logic
  this.loadFromPaths(config.paths, config.rotationsMap);
}
```

**Pros**:
- ✅ Supports both formats
- ✅ Gradual migration possible
- ✅ Less risk (old code untouched)

**Cons**:
- ❌ Still maintains dual systems
- ❌ Doesn't solve coordinate confusion
- ❌ More complex (two loading paths)
- ❌ Technical debt accumulates

**Verdict**: ⚠️ Acceptable compromise if full alignment too risky.

---

## Final Recommendation

### Go with Alignment Approach

**Reasons**:
1. **3 extra days** of work pays off in long-term maintainability
2. **Generator is the future** - game should adapt to it
3. **Single source of truth** eliminates entire class of bugs
4. **Performance benefit** from eliminating conversion
5. **Cleaner codebase** easier for future development

### Implementation Timeline

- **Days 1-2**: Coordinate system migration (x, y)
- **Day 3**: Rotation system migration (states)
- **Days 4-5**: Level config refactor (path-based)
- **Day 6**: Tile type inference
- **Day 7**: Generator integration
- **Day 8**: Testing & polish

**Total**: 8 days (vs 5 days for converter)
**Extra Cost**: 3 days
**Long-term Benefit**: Eliminates ongoing maintenance burden

### Success Criteria

- ✅ All existing gameplay works with new coordinate system
- ✅ Generator levels load and play correctly
- ✅ Tile types inferred accurately (100% success rate)
- ✅ Rotations work correctly (visual + solution checking)
- ✅ Performance: level loading <100ms
- ✅ Code: single coordinate system throughout
- ✅ Tests: 90%+ coverage on critical paths

---

## Conclusion

**User's intuition was correct**: aligning the game to the generator's coordinate system is the better architectural decision.

While it requires **3 more days** of upfront work than a converter approach, it results in:
- Simpler codebase (one system, not two)
- Better performance (no conversion)
- Easier maintenance (no converter to update)
- Clearer architecture (generator is source of truth)

**Recommendation**: Proceed with alignment approach. The extra effort is a worthwhile investment for long-term code health.

**Next Step**: Start with Phase 1 (coordinate migration) and validate the approach before committing to full refactor.
