# Landmark and Exit System Report

**Date**: 2026-01-27
**Context**: Level generation integration and gameplay mechanics clarification

---

## Overview

This report clarifies the distinction between **Landmarks** and **Exits** in City Lines, based on the Game Design Document (GDD) and current implementation.

---

## Key Concepts

### What are Exits?

**Exits** (also called "Turnpikes" or "Highway Exits" in the GDD) are the **starting points** of the road network:

- **Visual**: Highway exit sign sprite (`exit.png`)
- **Position**: Placed on the grid edge (typically the top edge in current implementation)
- **Function**: The origin point from which roads must connect
- **Properties**: Has a `facingEdge` that indicates which direction it faces into the grid
- **Gameplay Role**: Acts as the "source" - all landmarks must connect back to this point

**Current Implementation**:
```typescript
export interface ExitPlacement {
  position: GridPosition;      // Where on grid (usually edge)
  facingEdge: Edge;            // Direction facing into grid (e.g., 'south')
}
```

### What are Landmarks?

**Landmarks** are the **target destinations** that players must connect to the exits:

- **Visual**: Building sprites (house, diner, gas station, market, school, etc.)
- **Position**: Placed throughout the grid (interior positions)
- **Function**: The goal destinations that must be connected to the exit via road tiles
- **Properties**: Has `connectableEdges` that define which sides can connect to roads
- **Gameplay Role**: The "destinations" - the puzzle is solved when ALL landmarks are connected to the exit

**Types of Landmarks**:
1. **Common Landmarks** (all counties):
   - House (`house.png`)
   - Gas Station (`gas_station.png`)
   - Diner (`diner.png`)
   - Market (`market.png`)
   - School (`school.png`)

2. **County-Specific Landmarks** (per GDD):
   - Atlantic: Casino, Boardwalk
   - Bergen: Mall, GW Bridge
   - Cape May: Lighthouse, Beach
   - Essex: Airport, Arts Center
   - Hudson: Liberty Park, Waterfront

**Current Implementation**:
```typescript
export interface LandmarkPlacement {
  type: LandmarkType;          // 'house', 'diner', etc.
  position: GridPosition;      // Where on grid (interior)
  connectableEdges?: Edge[];   // Which edges can connect to roads
}
```

---

## How They Work Together

### Game Objective (from GDD)

> "Goal: Connect all landmarks to turnpikes/highway exits with continuous roads"

### Connection System

The game uses a **BFS (Breadth-First Search) algorithm** from exits to determine connectivity:

1. **Start at Exit**: BFS begins at the exit position
2. **Traverse Road Tiles**: Follow connected road tiles (straight, corner, T-junction)
3. **Reach Landmarks**: When a road tile connects to a landmark's `connectableEdges`, the landmark is marked as connected
4. **Completion**: Level is complete when ALL landmarks are connected to the exit

**Visual Feedback**:
- **Connected roads**: Turn green/light up
- **Connected landmarks**: Full brightness, green connection indicators
- **Unconnected roads**: Gray/dim
- **Unconnected landmarks**: Dim, gray connection indicators

### Code Flow

```typescript
// From CityLinesGame.ts - updateConnections()

// 1. Prepare data structures
const tiles: TileData[] = this.roadTiles.map(tile => ({
  type: tile.type,
  rotation: tile.currentRotation,
  position: tile.gridPosition,
}));

const landmarks: LandmarkData[] = this.landmarks.map(l => ({
  id: this.landmarks.indexOf(l),
  position: l.gridPosition,
  connectableEdges: l.connectableEdges,
}));

const exits: ExitData[] = this.exits.map(e => ({
  position: e.gridPosition,
  facingEdge: e.facingEdge,
}));

// 2. Evaluate connections (BFS from exits)
const result = evaluateConnections(this.gridSize, tiles, landmarks, exits);

// 3. Update visuals
// - Road tiles turn green if connected
// - Landmarks show connection status
// - Level completes if all landmarks connected
```

---

## Current Implementation vs GDD

### ✅ Aligned with GDD

1. **Exits as starting points**: Correctly implemented
2. **Landmarks as destinations**: Correctly implemented
3. **BFS pathfinding**: Efficient algorithm matching GDD intent
4. **Visual feedback**: Green roads when connected (per GDD requirement)
5. **Win condition**: All landmarks must connect to exit

### ⚠️ Areas for Clarification

1. **Terminology Inconsistency**:
   - GDD uses: "Turnpike", "Highway Exit"
   - Code uses: `Exit`, `ExitData`
   - **Recommendation**: Consistent use of "Exit" in code is fine, but UI/narrative should use "Highway Exit" or "Turnpike"

2. **Exit Rotation**:
   - GDD doesn't specify if exits should rotate
   - **Current Implementation**: Fixed rotation (per user request "we should not rotate exit ever")
   - **Status**: ✅ Correct - exits are visual markers, not puzzle pieces

3. **Multiple Exits**:
   - GDD mentions "turnpikes" (plural) but examples show single exit
   - **Current Implementation**: Supports multiple exits via `exitPoints` parameter
   - **Status**: ✅ Flexible design allows for future complexity

---

## Level Generation

### Entry Points vs Exit Points (Naming Confusion)

In the `LevelGenerator`, there's a naming quirk:
- `entryPoint`: The player's entry into the level (becomes the **exit** in game terminology)
- `exitPoints`: The destinations to reach (NOT used as landmarks in current implementation)

**Current LevelGenerationService Behavior**:
```typescript
// The generator's "entryPoint" becomes our game's "exit"
exits: [
  {
    position: entryPoint,        // Generator's entry
    facingEdge: entryFacingEdge, // Direction into grid
  },
],

// We place landmarks separately along the path
landmarks: this.placeLandmarks(paths, entryPoint, exitPoints, seed),
```

**Landmark Placement Strategy**:
1. Generate paths from entry to exit points
2. Place 2 landmarks at strategic positions (1/3 and 2/3 along main path)
3. Skip positions that overlap with entry/exit points
4. Calculate `connectableEdges` based on path direction

---

## ASCII Visualization Example

```
E L─┐
│ │ └─┐
│ └─┐ │
└───L X
```

- **E**: Exit (highway entrance - starting point)
- **L**: Landmark (destination - must be connected)
- **─│┌┐└┘**: Road tiles (player rotates these)
- **X**: Generator's exit point (not used as landmark in current implementation)

**Correct Path**: E → road tiles → L → road tiles → L → (reaches generator's exit point)

---

## Recommendations

### 1. Terminology Consistency

**Code** (keep as-is):
- `Exit` / `ExitData` - clear and concise
- `Landmark` / `LandmarkData` - clear and concise

**UI/Narrative** (update for clarity):
- "Highway Exit" or "Turnpike" instead of just "Exit"
- This matches GDD language and is more intuitive for players

### 2. Generator Integration

**Current Approach** (using `entryPoint` as exit):
```typescript
// ✅ Correct
exits: [{
  position: entryPoint,
  facingEdge: entryFacingEdge,
}]
```

**Landmark Placement** (2 landmarks along path):
```typescript
// ✅ Correct - places buildings at 1/3 and 2/3 positions
landmarks: this.placeLandmarks(paths, entryPoint, exitPoints, seed)
```

**Future Enhancement**: Use generator's `exitPoints` as potential landmark positions, but this is not required for MVP.

### 3. Visual Clarity

Add to asset list:
- **Highway exit sign** with clear directional arrow
- **Landmark connection indicators** (already implemented - green dots)
- **Road highlighting** when connected (already implemented - green tint)

---

## Common Questions

### Q: Why is the exit not a landmark?

**A**: The exit is the **starting point** of the road network, not a destination. Landmarks are the **goals** that must be connected. This is a fundamental game design choice that creates the puzzle:
- Without exits, there's no "source" to connect from
- Without landmarks, there's no "goal" to connect to

### Q: Can we have multiple exits?

**A**: Yes, the code supports multiple exits via the `exitPoints` parameter in generator config. Increasing `exitPoints` from 1 to 2+ creates more complex levels with intersecting paths and T-junctions.

### Q: Should exits rotate?

**A**: No. Exits are visual markers indicating the highway entrance. The `facingEdge` property indicates direction, but the sprite itself should remain fixed (per user request and current implementation).

### Q: How many landmarks should a level have?

**A**: Per GDD difficulty scaling:
- Easy (4×4 grid): 2 landmarks
- Medium (5×5 grid): 3 landmarks
- Hard (6×6 grid): 3-4 landmarks

Current implementation places 2 landmarks regardless of difficulty, which is suitable for MVP.

---

## Summary

- **Exits** = Highway entrances (starting points, visual markers)
- **Landmarks** = Buildings/destinations (goals to connect)
- **Road Tiles** = Player-rotatable puzzle pieces (connect exits to landmarks)
- **Win Condition** = All landmarks connected to at least one exit via continuous roads

The current implementation correctly distinguishes between exits and landmarks, aligning with the GDD's vision of a path-connection puzzle game.
