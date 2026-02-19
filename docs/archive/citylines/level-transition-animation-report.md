# Level Transition Animation System - Design Report

**Date**: 2026-01-27
**Context**: Adding visual polish to level loading with diagonal wave animation

---

## Overview

This report outlines the design and implementation approach for a level transition animation system that creates a visually appealing "wave" effect when loading new levels, animating tiles and decorations from top-left to bottom-right in a diagonal sweep.

---

## Requirements Summary

### Visual Goals
1. **Diagonal Wave Pattern**: Elements animate in sequence from top-left corner to bottom-right corner
2. **45-Degree Propagation**: Animation flows diagonally across the grid
3. **Staggered Timing**: Gaps between element animations create wave effect
4. **Smooth Transitions**: Background resizes smoothly when grid size changes
5. **Start Delay**: Brief pause before animation begins

### Technical Goals
1. Integrate with existing GSAP animation system
2. Work with any grid size (4×4, 5×5, 6×6)
3. Respect tuning parameters for customization
4. Performant on mobile devices
5. Non-blocking (player can't interact during transition)

---

## Current State Analysis

### Existing Animation Infrastructure

**File**: `src/game/citylines/core/CityLinesGame.ts`

#### GSAP Integration
```typescript
const TUNING_ANIMATION = {
  duration: 0.3,
  ease: 'power2.out',
  stagger: 0.015,
};
```

#### Existing Animation Methods
1. **updateLayout()**: Animates tiles/landmarks to new positions
   - Used for live tuning adjustments
   - Has stagger support (0.015s between elements)
   - Uses `animateToLayout()` on individual elements

2. **animateToLayout()**: Per-element animation
   - Implemented in RoadTile, Landmark, Exit classes
   - Accepts duration and delay parameters
   - Uses GSAP tweens

#### Grid Background Animation
```typescript
// From updateLayout()
if (this.gridBackground) {
  gsap.to(this.gridBackground, {
    width: totalSize,
    height: totalSize,
    duration: animDuration,
    ease,
  });
}
```

**Current behavior**: Background animates when grid size changes, but tiles appear instantly on level load.

---

## Proposed Animation Design

### Animation Flow

```
User completes level
       ↓
[Start Delay: 200ms] ← Wait before animation starts
       ↓
Background scales (if grid size changed)
       ↓
Diagonal wave begins (top-left → bottom-right)
       ↓
Tiles/landmarks/exits/decorations animate in
       ↓
Animation complete → Enable input
```

### Diagonal Wave Algorithm

#### Diagonal Index Calculation
For a grid position `(x, y)`, the diagonal index is `x + y`:
```
Grid 4×4 with diagonal indices:

  0  1  2  3  (x)
0 [0][1][2][3]
1 [1][2][3][4]
2 [2][3][4][5]
3 [3][4][5][6]
(y)

Diagonal groups:
- Diagonal 0: (0,0)
- Diagonal 1: (1,0), (0,1)
- Diagonal 2: (2,0), (1,1), (0,2)
- Diagonal 3: (3,0), (2,1), (1,2), (0,3)
- ...
```

#### Stagger Timing
- Each diagonal group starts after the previous
- Gap between diagonals: `staggerDelay` (e.g., 50ms)
- Gap between elements in same diagonal: `elementStagger` (e.g., 20ms)

**Total animation time** = `(maxDiagonal × staggerDelay) + elementDuration`

Example for 4×4 grid:
- Max diagonal: 6
- Stagger: 50ms
- Element duration: 300ms
- Total: `(6 × 50) + 300 = 600ms`

### Animation Properties

#### Initial State (Before Animation)
All elements start:
- **Scale**: 0 (invisible point)
- **Alpha**: 0 (transparent)
- **Position**: Correct final position

#### Animation Target
- **Scale**: 1 (full size)
- **Alpha**: 1 (fully visible)
- **Easing**: `back.out(1.2)` for slight overshoot/bounce

#### Why Scale + Alpha?
- Scale creates "pop in" effect
- Alpha prevents sudden appearance
- Combined effect is smooth and playful
- Matches tile rotation animation style

---

## Implementation Architecture

### New Configuration Interface

**File**: `src/game/tuning/types.ts`

```typescript
export interface LevelTransitionConfig {
  /** Delay before transition starts (ms) */
  startDelay: number;
  /** Duration of each element's animation (ms) */
  elementDuration: number;
  /** Delay between diagonal waves (ms) */
  diagonalStagger: number;
  /** Delay between elements in same diagonal (ms) */
  elementStagger: number;
  /** Easing function for element pop-in */
  elementEasing: string;
  /** Easing function for background resize */
  backgroundEasing: string;
  /** Whether to animate background resize */
  animateBackground: boolean;
}
```

**Default Values**:
```typescript
levelTransition: {
  startDelay: 200,
  elementDuration: 300,
  diagonalStagger: 50,
  elementStagger: 20,
  elementEasing: 'back.out(1.2)',
  backgroundEasing: 'power2.out',
  animateBackground: true,
}
```

### New Methods in CityLinesGame

#### 1. playLevelTransition()
```typescript
/**
 * Play level transition animation
 * Called at the end of loadLevel()
 * @returns Promise that resolves when animation completes
 */
private playLevelTransition(): Promise<void> {
  const config = this.levelTransitionConfig; // From tuning

  return new Promise((resolve) => {
    // 1. Set all elements to initial state (scale=0, alpha=0)
    this.setElementsToInitialState();

    // 2. Animate background (if grid size changed)
    if (config.animateBackground) {
      this.animateBackground(config);
    }

    // 3. Create staggered animations for all elements
    const timeline = this.createDiagonalWaveTimeline(config);

    // 4. Start animation after delay
    gsap.delayedCall(config.startDelay / 1000, () => {
      timeline.play();
      timeline.eventCallback('onComplete', resolve);
    });
  });
}
```

#### 2. setElementsToInitialState()
```typescript
private setElementsToInitialState(): void {
  // Tiles
  this.roadTiles.forEach(tile => {
    tile.scale.set(0);
    tile.alpha = 0;
  });

  // Landmarks
  this.landmarks.forEach(landmark => {
    landmark.scale.set(0);
    landmark.alpha = 0;
  });

  // Exits
  this.exits.forEach(exit => {
    exit.scale.set(0);
    exit.alpha = 0;
  });

  // Decorations
  this.decorationSystem.setInitialState();
}
```

#### 3. createDiagonalWaveTimeline()
```typescript
private createDiagonalWaveTimeline(config: LevelTransitionConfig): gsap.core.Timeline {
  const timeline = gsap.timeline({ paused: true });

  // Group elements by diagonal index
  const diagonalGroups = this.groupElementsByDiagonal();

  // Sort diagonals (0 to max)
  const sortedDiagonals = Array.from(diagonalGroups.keys()).sort((a, b) => a - b);

  // Add animations for each diagonal
  sortedDiagonals.forEach((diagonalIndex, groupIndex) => {
    const elements = diagonalGroups.get(diagonalIndex)!;
    const groupStartTime = groupIndex * (config.diagonalStagger / 1000);

    elements.forEach((element, elementIndex) => {
      const elementDelay = groupStartTime + (elementIndex * config.elementStagger / 1000);

      timeline.to(element, {
        scale: 1,
        alpha: 1,
        duration: config.elementDuration / 1000,
        ease: config.elementEasing,
      }, elementDelay);
    });
  });

  return timeline;
}
```

#### 4. groupElementsByDiagonal()
```typescript
private groupElementsByDiagonal(): Map<number, Container[]> {
  const groups = new Map<number, Container[]>();

  // Add tiles
  this.roadTiles.forEach(tile => {
    const diagonal = tile.gridPosition.x + tile.gridPosition.y;
    if (!groups.has(diagonal)) groups.set(diagonal, []);
    groups.get(diagonal)!.push(tile);
  });

  // Add landmarks
  this.landmarks.forEach(landmark => {
    const diagonal = landmark.gridPosition.x + landmark.gridPosition.y;
    if (!groups.has(diagonal)) groups.set(diagonal, []);
    groups.get(diagonal)!.push(landmark);
  });

  // Add exits
  this.exits.forEach(exit => {
    const diagonal = exit.gridPosition.x + exit.gridPosition.y;
    if (!groups.has(diagonal)) groups.set(diagonal, []);
    groups.get(diagonal)!.push(exit);
  });

  // Add decorations (via DecorationSystem)
  const decorations = this.decorationSystem.getDecorationsByDiagonal();
  decorations.forEach((decos, diagonal) => {
    if (!groups.has(diagonal)) groups.set(diagonal, []);
    groups.get(diagonal)!.push(...decos);
  });

  return groups;
}
```

### Changes to DecorationSystem

**File**: `src/game/citylines/systems/DecorationSystem.ts`

```typescript
/** Store grid position for each decoration for diagonal grouping */
private decorationPositions: Map<Sprite, GridPosition> = new Map();

placeDecorations(...) {
  // ...existing code...

  for (let i = 0; i < count; i++) {
    const sprite = this.gpuLoader.createSprite(...);
    // ...positioning code...

    // Store position for animation
    this.decorationPositions.set(sprite, pos);

    this.decorations.push(sprite);
  }
}

/** Get decorations grouped by diagonal index */
getDecorationsByDiagonal(): Map<number, Sprite[]> {
  const groups = new Map<number, Sprite[]>();

  this.decorations.forEach(sprite => {
    const pos = this.decorationPositions.get(sprite);
    if (pos) {
      const diagonal = pos.x + pos.y;
      if (!groups.has(diagonal)) groups.set(diagonal, []);
      groups.get(diagonal)!.push(sprite);
    }
  });

  return groups;
}

/** Set decorations to initial animation state */
setInitialState(): void {
  this.decorations.forEach(sprite => {
    sprite.scale.set(0);
    sprite.alpha = 0;
  });
}
```

### Integration Points

#### GameScreen.tsx
```typescript
// After game.loadLevel()
await game.playLevelTransition();

// Now enable input
game.enable();
```

#### Input Blocking During Transition
```typescript
// In CityLinesGame
private isTransitioning: boolean = false;

playLevelTransition(): Promise<void> {
  this.isTransitioning = true;

  return new Promise((resolve) => {
    // ...animation code...

    timeline.eventCallback('onComplete', () => {
      this.isTransitioning = false;
      resolve();
    });
  });
}

// In handleTileRotate()
if (this.isTransitioning || this.completionController.isInputBlocked) {
  return;
}
```

---

## Performance Considerations

### Mobile Optimization

1. **Transform-only animations**: Scale and alpha are GPU-accelerated
2. **Batch updates**: GSAP batches DOM updates automatically
3. **Timeline efficiency**: Single timeline manages all animations
4. **No layout recalculations**: Elements are already positioned

### Animation Complexity

**4×4 Grid**:
- Elements: ~16 tiles + 2 landmarks + 1 exit + ~8 decorations = 27
- Max diagonals: 6
- Total animation time: ~500ms

**6×6 Grid**:
- Elements: ~36 tiles + 4 landmarks + 1 exit + ~15 decorations = 56
- Max diagonals: 10
- Total animation time: ~800ms

**Memory**: No additional sprites created, just animating existing objects.

---

## Visual Polish Enhancements

### Optional Additions (Future)

1. **Particle burst**: Small sparkle at top-left corner when wave starts
2. **Sound effects**: Whoosh sound that pans from left to right
3. **Trail effect**: Brief glow that follows the wave
4. **Background pulse**: Subtle scale pulse on grid background (1.0 → 1.02 → 1.0)

### Accessibility

- Animation can be disabled via `levelTransition.elementDuration = 0`
- Reduced motion users: Skip animation entirely
- Keyboard users: No impact (animation doesn't block navigation)

---

## Tuning Workflow

### Tweakpane Integration

Add to tuning panel:
```
Game
  └─ Level Transition
      ├─ Start Delay [0-1000ms]
      ├─ Element Duration [100-1000ms]
      ├─ Diagonal Stagger [0-200ms]
      ├─ Element Stagger [0-100ms]
      ├─ Element Easing [dropdown]
      ├─ Background Easing [dropdown]
      └─ Animate Background [toggle]
```

### Testing Parameters

**Fast (snappy)**:
```typescript
{
  startDelay: 100,
  elementDuration: 200,
  diagonalStagger: 30,
  elementStagger: 10,
}
```

**Slow (dramatic)**:
```typescript
{
  startDelay: 500,
  elementDuration: 600,
  diagonalStagger: 100,
  elementStagger: 40,
}
```

**Recommended (balanced)**:
```typescript
{
  startDelay: 200,
  elementDuration: 300,
  diagonalStagger: 50,
  elementStagger: 20,
}
```

---

## Implementation Phases

### Phase 1: Core Animation System
1. Add `LevelTransitionConfig` to tuning types
2. Implement `groupElementsByDiagonal()`
3. Implement `createDiagonalWaveTimeline()`
4. Add initial state setup
5. Test with roadTiles only

### Phase 2: All Elements
6. Add landmarks to diagonal grouping
7. Add exits to diagonal grouping
8. Update `DecorationSystem` with position tracking
9. Add decorations to diagonal grouping
10. Test full wave animation

### Phase 3: Polish & Integration
11. Add input blocking during transition
12. Integrate with `loadLevel()` workflow
13. Add start delay
14. Test grid size changes (background animation)
15. Add to Tweakpane for live tuning

### Phase 4: Edge Cases & Performance
16. Test rapid level changes
17. Test during completion sequence
18. Profile performance on mobile
19. Add escape hatch (skip animation on second tap)
20. Documentation and cleanup

---

## Interaction with Existing Systems

### Level Completion Controller
- Transition plays AFTER completion animation ends
- Next level loads, then transition plays
- No overlap between celebration and transition

### Live Tuning (updateLayout)
- Tuning changes use different animation
- updateLayout animates position changes
- Transition animates scale/alpha on load
- Both systems coexist without conflict

### Manual Regeneration
- "Regenerate Level" button triggers full reload
- Transition plays after regeneration
- Provides visual feedback that level changed

---

## Expected User Experience

### Scenario: Player Completes Level
1. Roads light up (completion animation)
2. Clue appears (3 second display)
3. Player taps to continue
4. **[200ms pause]**
5. Background subtly adjusts (if grid size changed)
6. Top-left corner: Tiles pop in (scale 0 → 1)
7. Diagonal wave flows to bottom-right
8. Each element bounces slightly (back.out easing)
9. **[~600ms total]**
10. Animation completes, input enabled
11. Player can start rotating tiles

### Feel
- **Satisfying**: Elements appear with energy
- **Clear**: Obvious when level is ready
- **Fast**: Under 1 second total
- **Polished**: Matches game's playful aesthetic

---

## Risk Assessment

### Low Risk
- Uses existing GSAP infrastructure
- No new dependencies
- Purely visual (doesn't affect gameplay)
- Can be disabled via tuning

### Medium Risk
- Adds complexity to loadLevel flow
- Requires careful timing coordination
- Need to test on slow devices

### Mitigation
- Start with simple scale/alpha only
- Profile early and often
- Add killswitch (`elementDuration: 0` skips animation)
- Test on target devices (mobile)

---

## Alternative Approaches Considered

### 1. Spiral Pattern
**Pros**: More interesting visually
**Cons**: Harder to implement, less predictable
**Verdict**: Save for future enhancement

### 2. Random Stagger
**Pros**: Faster, simpler code
**Cons**: Less cohesive, no directionality
**Verdict**: Diagonal wave is better UX

### 3. Fade Only (No Scale)
**Pros**: Simpler, more subtle
**Cons**: Less impactful, boring
**Verdict**: Scale + alpha is worth it

### 4. Slide from Off-Screen
**Pros**: Very dynamic
**Cons**: Expensive (position changes), confusing layout
**Verdict**: Scale from center is cleaner

---

## Success Metrics

### Qualitative
- Animation feels smooth at 60fps
- Timing feels natural (not too fast or slow)
- Adds to game's charm without being distracting

### Quantitative
- Frame time: < 16.67ms (maintains 60fps)
- Total duration: 500-800ms (feels snappy)
- Memory impact: < 5MB increase
- Load time: < 100ms overhead

---

## Recommendations

### MVP Implementation
1. **Start with recommended timings** (200/300/50/20)
2. **Scale + alpha animation** (proven effective)
3. **Input blocking** (prevent premature interaction)
4. **Tweakpane integration** (easy iteration)

### Future Enhancements
1. Sound effects with spatial audio
2. Particle effects at wave front
3. Different easing per element type
4. Theme-specific animations

### Testing Priority
1. Mobile performance (iPhone 12, Android mid-range)
2. Different grid sizes (4×4, 5×5, 6×6)
3. Rapid level changes (skip animation if already playing)
4. Accessibility (reduced motion preference)

---

## Conclusion

The diagonal wave transition animation is a high-value, low-risk enhancement that adds significant visual polish to the game. The implementation leverages existing infrastructure (GSAP, tuning system), follows established patterns (diagonal grouping is simple math), and provides clear user feedback when levels load.

**Recommendation**: Proceed with implementation in 4 phases, starting with core animation system and iterating based on visual feedback.

**Timeline Estimate**:
- Phase 1-2: 4-6 hours (core system)
- Phase 3: 2-3 hours (integration & polish)
- Phase 4: 2-3 hours (testing & edge cases)
- **Total**: 8-12 hours

**Next Steps**:
1. Add `LevelTransitionConfig` to tuning types
2. Implement `groupElementsByDiagonal()` helper
3. Create minimal test case (tiles only)
4. Iterate on timing with Tweakpane
5. Expand to all elements
