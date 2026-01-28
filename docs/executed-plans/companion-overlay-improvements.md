# Companion Dialogue Overlay Improvements - Technical Report

**Date:** 2026-01-27
**Branch:** `ENG-1356-companion`
**Status:** ✅ Complete

---

## Executive Summary

This report documents the implementation of dark overlay improvements and configurable timing settings for the companion character dialogue system. The improvements enhance the user experience by adding proper visual layering, preventing accidental dismissals during animations, and providing developers with tuning controls.

---

## 1. Overview of Changes

### What Was Implemented

1. **Dark Semi-Transparent Overlay**
   - Positioned UNDER the companion dialogue group (character + dialogue box)
   - Positioned ABOVE the game tiles (blocks interaction with game)
   - Fades in with configurable opacity during slide-in animation
   - Fades out when companion is dismissed

2. **Click Prevention During Animations**
   - Overlay starts with `eventMode: 'none'` (disabled)
   - Enabled only AFTER slide-in animation completes
   - Uses animation state flag (`isCompanionAnimating`) to prevent rapid clicks
   - Prevents dismissal while companion is still off-screen

3. **Configurable Animation Timing**
   - All animation durations, delays, and easing functions moved to tuning config
   - Developers can tweak timing via `src/game/tuning/types.ts`
   - Consistent timing across slide-in, slide-out, and overlay fade animations

---

## 2. Technical Implementation

### A. Z-Index Layering (Bottom to Top)

```
1. Game Background (with blur filter)
2. Game Tiles + Progress Bar
3. Dark Overlay (semi-transparent black) ← NEW
4. Companion Dialogue Group
   ├── Character Sprite
   └── Dialogue Box (with Pixi Text)
```

**Key Point:** The overlay is added to `app.stage` BEFORE the companion group, ensuring proper layering.

### B. Animation State Machine

```
Initial State:
├── companionGroup: x = screenWidth + 400 (off-screen right)
├── darkOverlay: alpha = 0, eventMode = 'none'
└── isCompanionAnimating = true

Slide-In (triggered after slideInDelay):
├── darkOverlay fades to overlayAlpha over overlayFadeInDuration
├── companionGroup slides from right to center over slideInDuration
└── On complete: isCompanionAnimating = false, eventMode = 'static'

Idle State (clickable):
├── darkOverlay: alpha = overlayAlpha, eventMode = 'static'
├── companionGroup: visible at center
└── isCompanionAnimating = false

Slide-Out (triggered by click):
├── Set isCompanionAnimating = true, eventMode = 'none'
├── companionGroup slides left and fades over slideOutDuration
├── darkOverlay fades to 0 over overlayFadeOutDuration
└── On complete: companionGroup.visible = false, isCompanionAnimating = false
```

---

## 3. Configuration Options

### New Tuning Type: `CompanionAnimationConfig`

Located in: `src/game/tuning/types.ts`

```typescript
export interface CompanionAnimationConfig {
  // Slide-in animation timing
  slideInDelay: number;          // ms to wait before starting slide-in
  slideInDuration: number;       // ms for companion to slide from right to center
  slideInEasing: string;         // GSAP easing function (e.g., 'power2.out')

  // Slide-out animation timing
  slideOutDuration: number;      // ms for companion to slide left and fade
  slideOutEasing: string;        // GSAP easing function (e.g., 'power2.in')

  // Overlay fade timing
  overlayFadeInDuration: number; // ms for overlay to fade in
  overlayFadeOutDuration: number;// ms for overlay to fade out
  overlayAlpha: number;          // Target alpha for overlay (0.0 - 1.0)
}
```

### Default Values

```typescript
companion: {
  slideInDelay: 500,              // Wait 500ms before starting
  slideInDuration: 500,           // Slide in over 0.5 seconds
  slideInEasing: 'power2.out',    // Smooth deceleration
  slideOutDuration: 400,          // Slide out over 0.4 seconds
  slideOutEasing: 'power2.in',    // Smooth acceleration
  overlayFadeInDuration: 400,     // Fade in over 0.4 seconds
  overlayFadeOutDuration: 300,    // Fade out over 0.3 seconds
  overlayAlpha: 0.85,             // 85% opacity (fairly dark)
}
```

### How to Adjust Timing

**Example:** Make slide-in faster and overlay darker

1. Open `src/game/tuning/types.ts`
2. Locate `CITYLINES_DEFAULTS.companion`
3. Modify values:

```typescript
companion: {
  slideInDelay: 300,           // Start sooner (was 500)
  slideInDuration: 350,        // Slide faster (was 500)
  slideInEasing: 'back.out(1.7)', // Add bounce effect
  overlayAlpha: 0.95,          // Darker overlay (was 0.85)
  // ... other values unchanged
}
```

---

## 4. File Changes

### Modified Files

#### `src/game/tuning/types.ts`
- **Added:** `CompanionAnimationConfig` interface (lines 90-99)
- **Modified:** `CityLinesTuning` interface to include `companion: CompanionAnimationConfig` (line 117)
- **Added:** Default config in `CITYLINES_DEFAULTS` (lines 189-197)

#### `src/game/tuning/index.ts`
- **Added:** `CompanionAnimationConfig` to type exports (line 11)

#### `src/game/screens/GameScreen.tsx`
- **Added:** Companion references to component state (lines 32-34):
  ```typescript
  let companionGroup: Container | null = null;
  let darkOverlay: Graphics | null = null;
  let isCompanionAnimating = false;
  ```

- **Modified:** Companion dialogue implementation (lines 176-345):
  - Moved `companionGroup` and `darkOverlay` to component-level references
  - Added `companionConfig` from tuning (line 216)
  - Dark overlay now created with proper layering (line 219)
  - Click handler checks `isCompanionAnimating` flag (line 226)
  - Animation durations/easing use tuning values (lines 232-238, 253-266)
  - Overlay enabled only after slide-in completes (lines 268-273)

- **Modified:** Resize handler with null checks (lines 278-303)

---

## 5. How It Works

### Initialization Sequence

1. **Create Companion Group** (lines 176-202)
   ```typescript
   companionGroup = new Container();
   // Add dialogue box (centered at y=0)
   // Add character (left-aligned, 3/4 above dialogue box)
   // Position group off-screen right
   ```

2. **Create Dark Overlay** (lines 219-247)
   ```typescript
   darkOverlay = new Graphics();
   darkOverlay.fill({ color: 0x000000, alpha: 0 });
   darkOverlay.eventMode = 'none'; // Start disabled
   app.stage.addChild(darkOverlay); // Add FIRST (behind companion)
   ```

3. **Add Companion Group** (lines 249-252)
   ```typescript
   app.stage.addChild(companionGroup); // Add SECOND (above overlay)
   ```

4. **Trigger Slide-In Animation** (lines 255-273)
   ```typescript
   isCompanionAnimating = true; // Block clicks
   setTimeout(() => {
     gsap.to(darkOverlay, { alpha: overlayAlpha, ... });
     gsap.to(companionGroup, { x: center, ..., onComplete: enableClicks });
   }, slideInDelay);
   ```

### User Interaction Flow

1. **Wait for Animation:** User sees companion sliding in from right (500ms delay + 500ms duration)
2. **Overlay Enables:** After 1 second, `darkOverlay.eventMode = 'static'` (clickable)
3. **User Clicks:** Overlay or companion group triggers dismiss handler
4. **Slide-Out Animation:** Companion slides left, both fade out (400ms)
5. **Reset State:** `companionGroup.visible = false`, ready for next display

---

## 6. Responsive Behavior

The resize handler updates both the overlay and companion positioning:

```typescript
resizeHandler = () => {
  // Update overlay to cover new screen size
  if (darkOverlay) {
    darkOverlay.clear();
    darkOverlay.rect(0, 0, app.screen.width, app.screen.height);
    darkOverlay.fill({ color: 0x000000, alpha: darkOverlay.alpha });
  }

  // Recalculate companion group center position
  if (companionGroup && companionGroup.visible) {
    companionGroup.x = app.screen.width / 2;
    companionGroup.y = app.screen.height / 2 - groupVerticalCenter;
  }
};
```

**Note:** The overlay alpha is preserved during resize, maintaining current fade state.

---

## 7. Performance Considerations

### Optimizations

1. **Single Overlay Instance:** Reused for multiple dialogue displays (future)
2. **Animation State Flag:** Prevents redundant GSAP tweens during rapid clicks
3. **Conditional Resize:** Only updates visible companions during resize events
4. **GPU Rendering:** All visual elements use Pixi.js for hardware acceleration

### Benchmark Targets

- **Slide-In Animation:** 60 FPS on mobile devices
- **Overlay Fade:** No visible lag during alpha transitions
- **Click Response:** < 50ms from tap to animation start

---

## 8. Testing Checklist

### Functionality
- [x] Dark overlay appears behind companion (blocks game clicks)
- [x] Overlay fades in smoothly with companion slide-in
- [x] Clicking during animation has no effect
- [x] Clicking after animation dismisses companion
- [x] Overlay fades out with companion slide-out
- [x] Resize updates overlay dimensions correctly

### Edge Cases
- [x] Rapid clicking during animation (should be blocked)
- [x] Clicking off-screen companion while animating (no effect)
- [x] Screen rotation mid-animation (handled gracefully)

### Tuning Validation
- [x] Changing `slideInDelay` affects start time
- [x] Changing `overlayAlpha` affects darkness level
- [x] Changing easing functions affects animation feel
- [x] All timing values work with milliseconds (converted to seconds for GSAP)

---

## 9. Known Limitations

1. **Single Companion Instance:** Currently, only one companion can be active at a time
2. **No Animation Cancellation:** Once started, slide-in cannot be interrupted
3. **Fixed Overlay Color:** Black (0x000000) is hardcoded, could be made configurable
4. **Desktop-Only Testing:** Mobile touch events not yet verified on physical devices

---

## 10. Future Improvements

### Short-Term
- Add sound effects for slide-in/slide-out (SFX channels ready)
- Support multiple dialogue messages (tap to advance)
- Add circular frame mode for level completion (head-only display)

### Long-Term
- Companion state management (SolidJS signals for reactive updates)
- Multiple companion characters (Paper Kid, etc.)
- Customizable overlay colors per scene (success green, alert red)
- Animation presets (bounce, elastic, spring) via tuning dropdown

---

## 11. Developer Notes

### How to Test Locally

1. **Start dev server:**
   ```bash
   bun run dev
   ```

2. **Navigate to GameScreen:**
   - Game loads automatically after StartScreen
   - Companion appears 500ms after level loads

3. **Try clicking immediately:**
   - Should have no effect (animation blocking)

4. **Wait for slide-in to complete:**
   - Click overlay or companion to dismiss

5. **Test timing adjustments:**
   - Open `src/game/tuning/types.ts`
   - Change `slideInDuration: 2000` (2 seconds)
   - Save and hot-reload
   - Companion should slide in much slower

### Debugging Tips

**If overlay doesn't appear:**
```typescript
// Check z-index ordering
console.log(app.stage.children.map(c => c.label));
// Should output: ['background', 'game', 'progressBar', 'darkOverlay', 'companion-dialogue-group']
```

**If clicks aren't blocked:**
```typescript
// Check animation state flag
darkOverlay.on('pointertap', () => {
  console.log('isCompanionAnimating:', isCompanionAnimating);
  console.log('eventMode:', darkOverlay.eventMode);
});
```

**If timing feels wrong:**
```typescript
// Log actual animation durations
gsap.to(companionGroup, {
  x: targetX,
  duration: companionConfig.slideInDuration / 1000,
  onStart: () => console.time('slide-in'),
  onComplete: () => console.timeEnd('slide-in'),
});
```

---

## 12. Summary of Benefits

### User Experience
✅ **Clearer Focus:** Dark overlay draws attention to dialogue
✅ **No Accidental Dismissals:** Animation blocking prevents premature clicks
✅ **Smooth Transitions:** Coordinated fade timing feels polished
✅ **Visual Hierarchy:** Proper layering separates UI from gameplay

### Developer Experience
✅ **Easy Tuning:** All timing in one config file
✅ **Type-Safe:** TypeScript interfaces prevent config errors
✅ **Maintainable:** Animation logic centralized in GameScreen
✅ **Extensible:** Ready for multi-message dialogues and circular mode

---

## 13. Related Files

### Core Implementation
- [GameScreen.tsx](../src/game/screens/GameScreen.tsx) - Main companion dialogue logic
- [DialogueBox.ts](../src/game/citylines/ui/DialogueBox.ts) - Pixi dialogue box component
- [CompanionCharacter.ts](../src/game/citylines/ui/CompanionCharacter.ts) - Pixi character sprite

### Configuration
- [tuning/types.ts](../src/game/tuning/types.ts) - Animation config types and defaults
- [tuning/index.ts](../src/game/tuning/index.ts) - Config exports

### Documentation
- [Implementation Plan](/Users/dork/.claude/plans/stateful-juggling-manatee.md) - Original design doc

---

## Appendix A: Code Snippets

### Using Tuning Config in Other Screens

```typescript
import { useTuning, type ScaffoldTuning } from '~/scaffold';
import { type CityLinesTuning } from '~/game/tuning';

export function MyScreen() {
  const tuning = useTuning<ScaffoldTuning, CityLinesTuning>();

  const companionConfig = tuning.game().companion;

  // Use config values
  const slideInMs = companionConfig.slideInDuration;
  const overlayOpacity = companionConfig.overlayAlpha;
}
```

### Creating Dark Overlay (Reusable Pattern)

```typescript
function createDarkOverlay(app: Application, alpha: number = 0.85): Graphics {
  const overlay = new Graphics();
  overlay.rect(0, 0, app.screen.width, app.screen.height);
  overlay.fill({ color: 0x000000, alpha: 0 }); // Start transparent
  overlay.eventMode = 'none'; // Start disabled
  overlay.cursor = 'pointer';
  overlay.label = 'dark-overlay';
  return overlay;
}
```

### Animation State Manager (Future Pattern)

```typescript
class CompanionAnimationManager {
  private isAnimating = false;

  async slideIn(group: Container, overlay: Graphics): Promise<void> {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // Run animations...

    this.isAnimating = false;
  }

  canInteract(): boolean {
    return !this.isAnimating;
  }
}
```

---

**End of Report**

For questions or issues, please reference ticket **ENG-1356** or contact the development team.
