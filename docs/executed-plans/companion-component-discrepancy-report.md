# Companion Component Discrepancy Report

**Date**: 2026-01-27
**Issue**: Level completion companion does not match intro dialogue companion
**Expected**: Both should use the same component with identical appearance
**Location**: `/src/game/screens/GameScreen.tsx`

---

## Executive Summary

The intro dialogue companion and level completion companion are **currently implemented as two separate, divergent setups** instead of being the same reusable component. This violates DRY principles and creates visual inconsistency.

**Key Finding**: They should look **exactly the same** and be **the same component instance** (or at minimum, use identical configuration).

---

## Visual & Configuration Differences

### 1. Character Display Mode

| Property | Intro Dialogue | Level Completion | Impact |
|----------|---------------|------------------|--------|
| **Character Mode** | `'full'` (line 232) | `'head'` (line 383) | **CRITICAL** - Completely different character size |
| **Character Scale** | 0.8 (177.6px × 194.4px) | 0.4 (88.8px × 97.2px) | **50% size difference** |

**Code Comparison**:
```typescript
// Intro dialogue (line 232)
const testCompanion = new CompanionCharacter('news_hound', gpuLoader, 'full');
const charWidth = 222 * 0.8;   // 177.6px
const charHeight = 243 * 0.8;  // 194.4px

// Level completion (line 383-388)
const completionCompanion = new CompanionCharacter('news_hound', gpuLoader, 'head');
const headWidth = 222 * 0.4;   // 88.8px
const headHeight = 243 * 0.4;  // 97.2px
```

---

### 2. Dialogue Box Size

| Property | Intro Dialogue | Level Completion | Impact |
|----------|---------------|------------------|--------|
| **Height Scale** | 2.5 (line 222) | 1.8 (line 375) | **28% smaller dialogue box** |
| **Visual Result** | Larger, more prominent | Smaller, more compact | Inconsistent UI |

**Code Comparison**:
```typescript
// Intro dialogue (line 222)
const testDialogueBox = new DialogueBox(gpuLoader, app.screen.width, app.screen.height, 2.5);

// Level completion (line 375)
completionDialogueBox = new DialogueBox(gpuLoader, app.screen.width, app.screen.height, 1.8);
```

---

### 3. Character Positioning

| Aspect | Intro Dialogue | Level Completion | Impact |
|--------|---------------|------------------|--------|
| **Vertical Position** | 3/4 above dialogue, 1/4 overlapping (line 242) | Vertically centered with box (line 393) | Different character placement |
| **Horizontal Padding** | No additional padding (line 241) | +20px padding (line 392) | Character further from edge |

**Code Comparison**:
```typescript
// Intro dialogue (lines 240-242)
const dialogueBoxLeftEdge = -(testDialogueBox.getWidth() / 2);
testCompanion.x = dialogueBoxLeftEdge + (charWidth / 2); // Left edge aligned
testCompanion.y = -testDialogueBox.getHeight() - (charHeight * 0.25); // 3/4 above

// Level completion (lines 391-393)
const completionDialogueLeftEdge = -(completionDialogueBox.getWidth() / 2);
completionCompanion.x = completionDialogueLeftEdge + (headWidth / 2) + 20; // 20px padding
completionCompanion.y = -completionDialogueBox.getHeight() / 2; // Centered
```

---

### 4. Visual Enhancements

| Feature | Intro Dialogue | Level Completion |
|---------|---------------|------------------|
| **Circular Border** | ❌ None | ✅ White circular frame (lines 399-403) |
| **Border Specs** | N/A | 50px radius, 4px white stroke, 0.8 alpha |

**Code**:
```typescript
// Level completion only (lines 399-403)
const circularBorder = new Graphics();
const circleRadius = Math.max(headWidth, headHeight) / 2 + 5;
circularBorder.circle(completionCompanion.x, completionCompanion.y, circleRadius);
circularBorder.stroke({ color: 0xffffff, width: 4, alpha: 0.8 });
completionCompanionGroup.addChild(circularBorder);
```

---

### 5. Screen Positioning

| Aspect | Intro Dialogue | Level Completion | Impact |
|--------|---------------|------------------|--------|
| **Vertical Position** | Center (line 255) | Upper third (line 412) | Different screen location |
| **Y Calculation** | `app.screen.height / 2` | `app.screen.height / 3` | Appears higher on screen |

**Code Comparison**:
```typescript
// Intro dialogue (line 255)
companionGroup.y = app.screen.height / 2 - groupVerticalCenter;

// Level completion (line 412)
completionCompanionGroup.y = app.screen.height / 3 - completionGroupVerticalCenter;
```

---

### 6. Vertical Center Calculation

| Aspect | Intro Dialogue | Level Completion | Impact |
|--------|---------------|------------------|--------|
| **Bottom Reference** | `0` (dialogue box bottom at origin) (line 250) | `completionDialogueBox.getHeight() / 2` (line 407) | Different calculation method |

**Code Comparison**:
```typescript
// Intro dialogue (lines 249-251)
const groupTop = testCompanion.y - (charHeight / 2);
const groupBottom = 0; // Dialogue box bottom at y=0
const groupVerticalCenter = (groupTop + groupBottom) / 2;

// Level completion (lines 406-408)
const completionGroupTop = completionCompanion.y - (headHeight / 2);
const completionGroupBottom = completionDialogueBox.getHeight() / 2;
const completionGroupVerticalCenter = (completionGroupTop + completionGroupBottom) / 2;
```

---

## Animation Differences

### Slide-in Animation

Both use the same tuning config, **but positioned differently on screen**:

```typescript
// Both use (lines 319-323, 200-204)
gsap.to(companionGroup/completionCompanionGroup, {
  x: app.screen.width / 2,
  duration: companionConfig.slideInDuration / 1000,
  ease: companionConfig.slideInEasing,
  // ...
});
```

**Issue**: Same animation, different target positions → inconsistent user experience

---

## Architectural Issues

### Problem 1: Code Duplication

**Lines of Duplicate Code**: ~100 lines (setup + animation + resize handlers)

**Duplicated Logic**:
- Container creation
- Dialogue box instantiation
- Character instantiation
- Positioning calculations
- Dark overlay creation
- Animation setup
- Resize handlers

### Problem 2: No Shared Abstraction

**Current State**: Two independent implementations
**Expected State**: Single reusable component or factory function

### Problem 3: Inconsistent Naming

```typescript
// Intro dialogue
companionGroup
darkOverlay
testDialogueBox
testCompanion

// Level completion
completionCompanionGroup
completionOverlay
completionDialogueBox
completionCompanion
```

**Issue**: Different variable names for the same conceptual component

---

## Root Cause Analysis

### Why Are They Different?

1. **Historical Context**: Level completion was implemented based on GDD spec that called for "head only, circular frame" display
2. **Misinterpretation**: Spec was interpreted as requiring a completely different visual treatment
3. **User Expectation**: User actually wants **identical appearance** in both contexts

### Original GDD Specification

From `/Users/dork/.claude/plans/stateful-juggling-manatee.md`:

> **4. Level Completion** (during gameplay)
> - Character HEAD only, displayed in CIRCULAR frame
> - Small popup boxes (not full dialogue)
> - Reveals the clue

**Actual User Requirement**: Both should look exactly the same (same full character, same dialogue box)

---

## Recommended Solutions

### Option 1: Reuse Same Component Instance (Recommended)

**Approach**: Create a single `companionGroup` that is reused for both intro and completion

**Pros**:
- Guaranteed visual consistency
- Eliminates code duplication
- Simplest implementation

**Cons**:
- Cannot show both simultaneously (not required per spec)

**Implementation**:
```typescript
// Create once
companionGroup = createCompanionGroup(gpuLoader, app, 'full', 2.5);

// Reuse for intro
showCompanion(companionGroup, "Intro text", 'center');

// Reuse for completion
game.onGameEvent('completionStart', (clue) => {
  showCompanion(companionGroup, clue, 'center');
});
```

### Option 2: Factory Function (Alternative)

**Approach**: Create a factory function that generates identical companions

**Pros**:
- Can have multiple instances if needed
- Encapsulates companion creation logic

**Cons**:
- Still duplicates instances in memory
- More complex state management

**Implementation**:
```typescript
function createCompanionDialogue(
  gpuLoader: PixiLoader,
  app: Application,
  mode: 'full' = 'full',
  heightScale: number = 2.5
): {
  group: Container;
  overlay: Graphics;
  dialogueBox: DialogueBox;
  character: CompanionCharacter;
} {
  // Shared logic for both companions
}

// Create intro companion
const introCompanion = createCompanionDialogue(gpuLoader, app);

// Create completion companion (identical)
const completionCompanion = createCompanionDialogue(gpuLoader, app);
```

### Option 3: Shared Configuration Object

**Approach**: Use identical configuration values, keep separate instances

**Pros**:
- Quick fix
- Maintains separate state

**Cons**:
- Still has code duplication
- Doesn't address architectural issues

---

## Implementation Plan

### Step 1: Decide on Approach
- **Recommendation**: Option 1 (reuse same instance)
- **Rationale**: Simplest, most maintainable, guarantees consistency

### Step 2: Remove Level Completion Setup
- Delete lines 370-461 (completion companion setup)
- Delete `completionCompanionGroup`, `completionOverlay`, `completionDialogueBox` variables

### Step 3: Update completionStart Event Handler
- Reuse `companionGroup` instead of `completionCompanionGroup`
- Update text via `testDialogueBox.setText(clue)`
- Use same animation logic

### Step 4: Update Dismiss Handler
- Both intro and completion use same tap-to-dismiss logic
- After completion dismissal, trigger level reload

### Step 5: Testing
- Verify intro dialogue appears correctly
- Complete a level, verify clue appears in same companion
- Verify animations are identical
- Test resize behavior

---

## Expected Outcome

### Before Fix
| Context | Character | Dialogue Box | Position | Border |
|---------|-----------|--------------|----------|--------|
| Intro | 177.6×194.4px | 2.5 scale | Center | None |
| Completion | 88.8×97.2px | 1.8 scale | Upper 1/3 | Circular |

### After Fix
| Context | Character | Dialogue Box | Position | Border |
|---------|-----------|--------------|----------|--------|
| Intro | 177.6×194.4px | 2.5 scale | Center | None |
| Completion | **177.6×194.4px** | **2.5 scale** | **Center** | **None** |

**Visual Result**: Intro dialogue and level completion clue will be **indistinguishable** in appearance.

---

## Code Metrics

### Current State
- **Total Lines**: ~200 (including comments)
- **Duplicated Logic**: ~50%
- **Separate Instances**: 2

### After Refactor
- **Total Lines**: ~120 (40% reduction)
- **Duplicated Logic**: 0%
- **Shared Instances**: 1

---

## Testing Checklist

After implementing the fix:

- [ ] Intro dialogue appears at screen center
- [ ] Level completion clue appears at same position
- [ ] Character size is identical in both contexts
- [ ] Dialogue box size is identical
- [ ] Slide-in animation is identical
- [ ] Tap-to-dismiss works for both
- [ ] Text updates correctly for clue reveal
- [ ] Resize behavior works for both contexts
- [ ] No visual flicker when switching contexts
- [ ] Dark overlay opacity is consistent

---

## References

**Files**:
- `/Users/dork/repos/advance/advance-game-citylines/src/game/screens/GameScreen.tsx` (lines 217-461)
- `/Users/dork/repos/advance/advance-game-citylines/src/game/citylines/ui/companion/CompanionCharacter.ts`
- `/Users/dork/repos/advance/advance-game-citylines/src/game/citylines/ui/companion/DialogueBox.ts`

**Related Docs**:
- `/Users/dork/repos/advance/advance-game-citylines/docs/companion-overlay-improvements.md`
- `/Users/dork/repos/advance/advance-game-citylines/docs/level-completion-companion-integration.md`

---

## Conclusion

The level completion companion is **divergent from the intro dialogue companion** across 6 major dimensions:

1. ❌ Character scale (50% smaller)
2. ❌ Dialogue box size (28% smaller)
3. ❌ Positioning logic (different calculation)
4. ❌ Visual enhancements (circular border)
5. ❌ Screen position (upper third vs center)
6. ❌ Code duplication (~100 lines)

**Recommended Action**: Refactor to reuse a single companion instance for both intro and completion contexts, ensuring identical appearance and behavior.

**Estimated Effort**: 1-2 hours (remove duplicate code, wire up shared instance, test both contexts)
