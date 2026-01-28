# Level Completion Companion Integration Guide

**Date:** 2026-01-27
**Related Ticket:** ENG-1356
**Status:** Planning Document

---

## Overview

This guide explains how to integrate the companion character dialogue system with the level completion flow. When a level is completed, the News Hound character should appear with the clue reveal, using the same dark overlay pattern implemented in GameScreen.

---

## Current Implementation Analysis

### What Exists Now

**Level Completion Flow** ([GameScreen.tsx:154-186](../src/game/screens/GameScreen.tsx#L154-L186)):
```typescript
game.onGameEvent('completionStart', (clue) => {
  setOverlayOpen(true);
  setClueText(clue);
  setCanContinue(false);

  const config = game.getCurrentLevelConfig();
  setCelebrationImageUrl(config?.celebrationImageUrl);
});

game.onGameEvent('clueTimerEnd', () => {
  setCanContinue(true);
});

game.onGameEvent('completionEnd', () => {
  setOverlayOpen(false);
});
```

**CompletionOverlay Component** ([CompletionOverlay.tsx](../src/game/screens/components/CompletionOverlay.tsx)):
- HTML-based overlay
- Shows clue text
- Shows celebration image
- Continue button (disabled during timer)
- Dark backdrop with blur

### What's Missing

❌ No companion character display
❌ No Pixi-based dark overlay integration
❌ No character animation (slide-in/out)
❌ No circular frame for "head-only" mode
❌ Character appears instantly (no animation)

---

## Design Goals

### User Experience

1. **Character Appears in "Head" Mode**
   - Only the character's head visible (scaled smaller)
   - Positioned in a circular frame overlay
   - Left side of screen (matches dialogue pattern)

2. **Dark Overlay Consistency**
   - Same 60% opacity as companion dialogue
   - Fades in smoothly with character
   - Blocks interaction with game tiles

3. **Animation Sequence**
   - Dark overlay fades in (400ms)
   - Character slides in from right (500ms, elastic easing)
   - Clue text appears after character arrives
   - User taps to dismiss (slide left, fade out)

4. **Responsive Design**
   - Character scales appropriately on mobile
   - Circular frame adjusts position
   - Text wraps properly

---

## Implementation Approach

### Option A: Pure Pixi Integration (Recommended)

**Pros:**
- ✅ Consistent with companion dialogue system
- ✅ No DOM/Canvas layering issues
- ✅ Better performance (all GPU-rendered)
- ✅ Easier z-index management

**Cons:**
- ⚠️ More refactoring required
- ⚠️ Need to convert CompletionOverlay text to Pixi

**Implementation Steps:**

1. Create Pixi-based completion overlay in GameScreen
2. Reuse companion character + dark overlay pattern
3. Add circular mask/border for head-only mode
4. Keep CompletionOverlay for HTML elements (button, backdrop)

### Option B: Hybrid Pixi + HTML (Current Pattern)

**Pros:**
- ✅ Minimal changes to existing CompletionOverlay
- ✅ Can reuse HTML text rendering
- ✅ Faster to implement

**Cons:**
- ⚠️ Layering complexity (Pixi canvas + HTML)
- ⚠️ Two separate overlay systems
- ⚠️ Potential visual inconsistencies

---

## Detailed Implementation: Option A (Pure Pixi)

### 1. Add Completion Companion References

**GameScreen.tsx** - Add to component state:

```typescript
// Companion dialogue references
let companionGroup: Container | null = null;
let darkOverlay: Graphics | null = null;
let isCompanionAnimating = false;

// Level completion companion (separate instance)
let completionCompanionGroup: Container | null = null;
let completionOverlay: Graphics | null = null;
let isCompletionAnimating = false;
```

**Why Separate Instances:**
- Companion dialogue (intro) uses "full" mode
- Level completion uses "head" mode
- Different positioning and sizing
- Independent animation states

### 2. Create Completion Companion Setup

**GameScreen.tsx** - Add after companion dialogue setup:

```typescript
// LEVEL COMPLETION: Create companion head with circular frame
completionCompanionGroup = new Container();
completionCompanionGroup.label = 'completion-companion-group';

// Create smaller dialogue box for clue text
const clueDialogueBox = new DialogueBox(gpuLoader, app.screen.width, app.screen.height, 1.5);
clueDialogueBox.setText(''); // Will be set dynamically
clueDialogueBox.alpha = 1;
clueDialogueBox.x = 0;
clueDialogueBox.y = 0;
completionCompanionGroup.addChild(clueDialogueBox);

// Create character in "head" mode (smaller scale)
const completionCompanion = new CompanionCharacter('news_hound', gpuLoader, 'head');
completionCompanion.alpha = 1;

// Calculate head dimensions (head mode is 0.4 scale)
const headWidth = 222 * 0.4;   // 88.8px
const headHeight = 243 * 0.4;  // 97.2px

// Position head on left side, aligned with dialogue box top
const dialogueBoxLeftEdge = -(clueDialogueBox.getWidth() / 2);
completionCompanion.x = dialogueBoxLeftEdge + (headWidth / 2) + 20; // 20px padding
completionCompanion.y = -clueDialogueBox.getHeight() / 2; // Vertically centered with box

// Add character BEFORE dialogue box (behind it)
completionCompanionGroup.addChildAt(completionCompanion, 0);

// Create circular border overlay (Graphics)
const circularBorder = new Graphics();
const circleRadius = Math.max(headWidth, headHeight) / 2 + 5; // 5px border
circularBorder.circle(completionCompanion.x, completionCompanion.y, circleRadius);
circularBorder.stroke({ color: 0xffffff, width: 4 });
completionCompanionGroup.addChild(circularBorder);

// Position group at center-top of screen
completionCompanionGroup.x = app.screen.width / 2;
completionCompanionGroup.y = app.screen.height / 3; // Higher than dialogue

// Create completion dark overlay
completionOverlay = new Graphics();
completionOverlay.rect(0, 0, app.screen.width, app.screen.height);
completionOverlay.fill({ color: 0x000000, alpha: 1.0 });
completionOverlay.alpha = 0; // Start transparent
completionOverlay.eventMode = 'none';
completionOverlay.cursor = 'pointer';

// Add to stage (initially hidden)
app.stage.addChild(completionOverlay);
completionCompanionGroup.x = app.screen.width + 400; // Off-screen right
completionCompanionGroup.visible = false;
app.stage.addChild(completionCompanionGroup);
```

### 3. Wire Completion Events

**GameScreen.tsx** - Update completion event handlers:

```typescript
game.onGameEvent('completionStart', (clue) => {
  console.log('[GameScreen] Level complete! Showing companion with clue:', clue);

  // Get companion animation config
  const companionConfig = gameTuning.companion;

  // Update clue text
  clueDialogueBox.setText(clue);

  // Show completion companion group
  completionCompanionGroup.visible = true;
  completionCompanionGroup.x = app.screen.width + 400; // Reset to off-screen
  completionCompanionGroup.alpha = 1;

  // Start animation
  isCompletionAnimating = true;

  // Fade in dark overlay
  gsap.to(completionOverlay, {
    alpha: companionConfig.overlayAlpha,
    duration: companionConfig.overlayFadeInDuration / 1000,
    ease: 'power2.out',
  });

  // Slide companion in from right
  setTimeout(() => {
    gsap.to(completionCompanionGroup, {
      x: app.screen.width / 2,
      duration: companionConfig.slideInDuration / 1000,
      ease: companionConfig.slideInEasing,
      delay: 0.2,
      onComplete: () => {
        isCompletionAnimating = false;
        if (completionOverlay) {
          completionOverlay.eventMode = 'static'; // Enable clicks
        }
      },
    });
  }, companionConfig.slideInDelay);

  // Old HTML overlay - keep for continue button functionality
  // setOverlayOpen(true);
  // setClueText(clue);
  // setCanContinue(false);
});

// Handle dismissal (tap to continue)
if (completionOverlay) {
  completionOverlay.on('pointertap', () => {
    if (isCompletionAnimating || !completionOverlay) return;

    isCompletionAnimating = true;
    completionOverlay.eventMode = 'none';

    const companionConfig = gameTuning.companion;

    // Slide out to left
    gsap.to(completionCompanionGroup, {
      x: -400,
      alpha: 0,
      duration: companionConfig.slideOutDuration / 1000,
      ease: companionConfig.slideOutEasing,
    });

    // Fade out overlay
    gsap.to(completionOverlay, {
      alpha: 0,
      duration: companionConfig.overlayFadeOutDuration / 1000,
      ease: 'power2.in',
      onComplete: () => {
        if (completionCompanionGroup) {
          completionCompanionGroup.visible = false;
        }
        isCompletionAnimating = false;

        // Trigger game to load next level
        const controller = game.getCompletionController();
        controller.continue();
      },
    });
  });
}
```

### 4. Add Circular Mask (Optional Enhancement)

For a true circular "head-only" reveal, add a Pixi mask:

```typescript
// Create circular mask for character sprite
const circleMask = new Graphics();
circleMask.circle(0, 0, circleRadius);
circleMask.fill({ color: 0xffffff });
completionCompanion.mask = circleMask;
completionCompanionGroup.addChild(circleMask);
circleMask.x = completionCompanion.x;
circleMask.y = completionCompanion.y;
```

**Result:** Character sprite only shows within circular area (like Instagram stories).

### 5. Responsive Resize Handler

**GameScreen.tsx** - Add to existing resize handler:

```typescript
resizeHandler = () => {
  // ... existing companion dialogue resize logic ...

  // Update completion overlay size
  if (completionOverlay) {
    const currentAlpha = completionOverlay.alpha;
    completionOverlay.clear();
    completionOverlay.rect(0, 0, app.screen.width, app.screen.height);
    completionOverlay.fill({ color: 0x000000, alpha: 1.0 });
    completionOverlay.alpha = currentAlpha;
  }

  // Reposition completion companion
  if (completionCompanionGroup && completionCompanionGroup.visible) {
    completionCompanionGroup.x = app.screen.width / 2;
    completionCompanionGroup.y = app.screen.height / 3;

    // Update dialogue box size
    clueDialogueBox.resize(app.screen.width, app.screen.height);
  }
};
```

---

## Visual Design Specifications

### Character Positioning

```
┌─────────────────────────────────┐
│                                 │
│         ┌───────────────┐       │
│    ●    │   Clue Text   │       │ ← Character head (left)
│  (•◡•)  │   Goes here   │       │   with circular border
│    │    │               │       │
│         └───────────────┘       │
│                                 │
│       [Tap to Continue]         │
└─────────────────────────────────┘
```

**Layout:**
- Character: 88.8px × 97.2px (head mode, 0.4 scale)
- Circular border: ~50px radius, 4px white stroke
- Dialogue box: 80% screen width, 1.5× height scale
- Vertical position: Top 1/3 of screen
- Horizontal: Center-aligned group

### Animation Timing

```
Time (ms)    Event
─────────────────────────────────────
0            Level complete event fires
0-400        Dark overlay fades in (0 → 0.6 alpha)
500          Character starts sliding in
500-1000     Character slides from right to center
1000         Enable tap to dismiss
[user taps]
+0           Start slide-out animation
+0-400       Character slides left and fades
+0-300       Overlay fades out
+400         Load next level
```

### Color Palette

- **Dark overlay:** `rgba(0, 0, 0, 0.6)` - 60% opacity
- **Circular border:** `#FFFFFF` - 4px stroke
- **Dialogue box:** Existing 9-slice sprite (cream/tan color)
- **Text:** `#2c2c2c` - Dark gray, 18px bold Arial

---

## Comparison: Current vs. Proposed

### Current Implementation

```typescript
// CompletionOverlay.tsx (HTML)
<div class="fixed inset-0 z-50 bg-black/70">
  <div class="celebration-image">
    <img src={celebrationImageUrl} />
  </div>
  <div class="clue-text">
    {clueText}
  </div>
  <button disabled={!canContinue}>
    Continue
  </button>
</div>
```

**Issues:**
- ❌ No character integration
- ❌ HTML overlay feels separate from game
- ❌ No animation
- ❌ Inconsistent with companion dialogue UX

### Proposed Implementation

```typescript
// GameScreen.tsx (Pixi)
completionCompanionGroup {
  ├── completionCompanion (head mode, circular border)
  ├── clueDialogueBox (Pixi Text)
  └── circularBorder (Graphics)
}

completionOverlay (Graphics, 60% opacity)

Animations: GSAP (slide in/out, fade in/out)
User interaction: Tap overlay to dismiss
```

**Benefits:**
- ✅ Consistent Pixi rendering
- ✅ Character appears with clue
- ✅ Smooth animations
- ✅ Matches companion dialogue UX
- ✅ Unified dark overlay system

---

## Testing Checklist

### Functionality
- [ ] Character appears in head mode (circular)
- [ ] Dark overlay fades in correctly
- [ ] Character slides in from right
- [ ] Clue text displays properly
- [ ] Tap dismisses companion
- [ ] Slide-out animation works
- [ ] Next level loads after dismissal

### Visual
- [ ] Circular border visible and aligned
- [ ] Character head centered in circle
- [ ] Text wraps correctly in dialogue box
- [ ] Overlay darkness matches companion dialogue (60%)
- [ ] No visual glitches during animation

### Edge Cases
- [ ] Rapid tapping during animation blocked
- [ ] Resize updates positions correctly
- [ ] Long clue text handled (scrolling/truncation)
- [ ] Missing character sprite handled gracefully
- [ ] Multiple level completions don't break state

### Performance
- [ ] 60 FPS on mobile during animations
- [ ] No memory leaks (character cleaned up properly)
- [ ] Overlay rendering doesn't lag game

---

## Migration Path

### Phase 1: Dual System (Hybrid)
Keep existing CompletionOverlay for continue button, add Pixi companion:

```typescript
// Show both overlays simultaneously
setOverlayOpen(true); // HTML continue button
showCompletionCompanion(clue); // Pixi character + clue
```

**Pros:** Low risk, gradual migration
**Cons:** Duplicate overlays, more complexity

### Phase 2: Full Pixi Migration
Remove CompletionOverlay entirely, handle continue button in Pixi:

```typescript
// Single Pixi-based system
const continueButton = new SpriteButton(gpuLoader, {
  label: 'Continue',
  onClick: handleContinue,
});
completionCompanionGroup.addChild(continueButton);
```

**Pros:** Unified system, better performance
**Cons:** More work, requires button implementation

**Recommendation:** Start with Phase 1, migrate to Phase 2 later.

---

## Code Location Summary

### Files to Modify

1. **[GameScreen.tsx](../src/game/screens/GameScreen.tsx)**
   - Add completion companion setup (lines ~330-400)
   - Update `completionStart` event handler (line ~155)
   - Add tap dismissal logic
   - Update resize handler (line ~292)

2. **[CompletionOverlay.tsx](../src/game/screens/components/CompletionOverlay.tsx)** *(Phase 2 only)*
   - Deprecate or simplify to minimal continue button

### Files to Reuse

1. **[CompanionCharacter.ts](../src/game/citylines/ui/companion/CompanionCharacter.ts)**
   - Use existing class with `mode: 'head'`

2. **[DialogueBox.ts](../src/game/citylines/ui/companion/DialogueBox.ts)**
   - Reuse for clue text display

3. **[CompanionConfig.ts](../src/game/citylines/ui/companion/CompanionConfig.ts)**
   - Use `CHARACTER_SCALES['head']` for sizing

4. **[types.ts](../src/game/tuning/types.ts)**
   - Reuse `CompanionAnimationConfig` values

---

## Alternative Approach: Simplified (Minimal Changes)

If full Pixi integration is too complex, here's a simpler option:

### Keep HTML Overlay, Add Pixi Character Only

**Implementation:**

1. Add companion character to Pixi stage (head mode)
2. Position behind existing CompletionOverlay HTML
3. Animate character in/out
4. Keep HTML text and button

**Code:**

```typescript
// GameScreen.tsx
const completionCompanion = new CompanionCharacter('news_hound', gpuLoader, 'head');
completionCompanion.x = 100; // Left side
completionCompanion.y = 200; // Top of screen
app.stage.addChild(completionCompanion);

game.onGameEvent('completionStart', () => {
  gsap.from(completionCompanion, {
    x: app.screen.width + 200,
    duration: 0.5,
    ease: 'power2.out',
  });

  setOverlayOpen(true); // Existing HTML overlay
});
```

**Pros:**
- ✅ Minimal changes
- ✅ Quick to implement
- ✅ Low risk

**Cons:**
- ⚠️ No unified overlay system
- ⚠️ Character might not align perfectly with HTML
- ⚠️ No circular frame integration

---

## Recommended Implementation Order

### Week 1: Foundation
1. ✅ Add completion companion group to GameScreen
2. ✅ Create character in "head" mode
3. ✅ Add circular border (Graphics)
4. ✅ Test positioning and sizing

### Week 2: Animation
5. ✅ Wire `completionStart` event
6. ✅ Implement slide-in from right
7. ✅ Add dark overlay fade
8. ✅ Test tap-to-dismiss

### Week 3: Polish
9. ✅ Add resize handler
10. ✅ Refine timing values
11. ✅ Add sound effects (optional)
12. ✅ Test on mobile devices

### Week 4: Migration (Optional)
13. ⬜ Deprecate HTML CompletionOverlay
14. ⬜ Add Pixi-based continue button
15. ⬜ Full migration testing

---

## Configuration Examples

### Tuning Values (Already Defined)

```typescript
// src/game/tuning/types.ts
companion: {
  slideInDelay: 500,              // Wait before character appears
  slideInDuration: 500,           // Slide-in speed
  slideInEasing: 'elastic.out(1, 0.5)',  // Bouncy entrance
  slideOutDuration: 400,          // Slide-out speed
  slideOutEasing: 'power2.in',    // Smooth exit
  overlayAlpha: 0.6,              // 60% opacity overlay
}
```

### Custom Overrides (If Needed)

If level completion needs different timing:

```typescript
// src/game/tuning/types.ts
export interface CompanionAnimationConfig {
  // ... existing fields ...

  // Level completion overrides
  completionSlideInDuration?: number;
  completionOverlayAlpha?: number;
}

// defaults
companion: {
  // ... existing values ...
  completionSlideInDuration: 600,  // Slightly slower for emphasis
  completionOverlayAlpha: 0.7,     // Darker for clue focus
}
```

---

## Future Enhancements

### Sound Effects
- Slide-in: Whoosh sound
- Clue reveal: Chime/ding
- Tap dismiss: Button click

### Multiple Characters
Support different characters per county:
```typescript
const characterType = getCharacterForCounty(sampleLevel.county);
const completionCompanion = new CompanionCharacter(characterType, gpuLoader, 'head');
```

### Animated Expressions
Add sprite sheet animation for character reactions:
- Happy (level complete)
- Thinking (showing clue)
- Excited (new discovery)

### Particles
Add particle effects behind character:
- Sparkles on entrance
- Confetti for level complete

---

## Conclusion

**Recommended Approach:** Pure Pixi integration (Option A) for consistency and performance.

**Estimated Effort:**
- Phase 1 (Core): 1-2 days
- Phase 2 (Polish): 1 day
- Phase 3 (Testing): 1 day
- **Total:** 3-4 days

**Key Benefits:**
- ✅ Unified visual language (Pixi rendering)
- ✅ Reuses existing companion components
- ✅ Consistent animation timing
- ✅ Better performance than HTML overlays

**Next Steps:**
1. Review this plan with team
2. Confirm visual design (mockups)
3. Create new ticket for implementation
4. Begin Phase 1 development

---

**Questions or Feedback?**
Contact: Development Team
Related Docs: [Companion Overlay Improvements](./companion-overlay-improvements.md)
