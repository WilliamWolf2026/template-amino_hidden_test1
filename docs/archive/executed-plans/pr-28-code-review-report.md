# PR #28 Code Review Report

## Summary

Code review by @eronwolf identified several opportunities for improvement around code organization, DRY principles, and documentation.

---

## Review Comments

### 1. SpriteButton Promise Pattern (Positive)

**File:** `src/game/citylines/core/SpriteButton.ts`

**Comment:** "This is an interesting pattern! Might be worth documenting, it's a pretty clean way to wait for the complete handler to run w/o needing to pass an explicit callback"

**Code:**
```typescript
playExitAnimation(): Promise<void> {
  return new Promise((resolve) => {
    gsap.to(this, { alpha: 0, duration: 0.25, ease: 'power2.out' });
    gsap.to(this.scale, { x: 0.9, y: 0.9, duration: 0.25, ease: 'power2.out', onComplete: resolve });
  });
}
```

**Action:** Add JSDoc comment explaining the pattern for future reference.

---

### 2. Font Family Repetition

**File:** `src/game/screens/GameScreen.tsx`

**Comment:** "Might be worth considering some shared style definition for the font-family for easy swap-out as needed."

**Issue:** The font family `'Baloo, system-ui, sans-serif'` is hardcoded in multiple places:
- GameScreen.tsx (chapter label)
- StartScreen.tsx (multiple text styles)
- ProgressBar.ts
- CluePopup.ts
- DialogueBox.ts

**Recommendation:** Create a shared constant or theme config:
```typescript
// In a shared location (e.g., game/tuning/fonts.ts)
export const GAME_FONT_FAMILY = 'Baloo, system-ui, sans-serif';
```

---

### 3. Progress Bar Fade Animations (DRY)

**File:** `src/game/screens/GameScreen.tsx`

**Comment:** "If these animations are expected to remain the same, could make this a bit DRYer" and "Same here, and maybe worth a shared anim method"

**Issue:** The fade out/in animations for progress bar and chapter label are duplicated:

**Fade Out (appears twice):**
```typescript
gsap.to(bar, { alpha: 0.15, duration: 0.3, ease: 'power2.out' });
gsap.to(chapterLabel, { alpha: 0.15, duration: 0.3, ease: 'power2.out' });
```

**Fade In (appears twice):**
```typescript
gsap.to(bar, { alpha: 1, duration: 0.3, ease: 'power2.out' });
gsap.to(chapterLabel, { alpha: 1, duration: 0.3, ease: 'power2.out' });
```

**Recommendation:** Create helper functions:
```typescript
const fadeOutProgressUI = () => {
  if (bar) gsap.to(bar, { alpha: 0.15, duration: 0.3, ease: 'power2.out' });
  if (chapterLabel) gsap.to(chapterLabel, { alpha: 0.15, duration: 0.3, ease: 'power2.out' });
};

const fadeInProgressUI = () => {
  if (bar) gsap.to(bar, { alpha: 1, duration: 0.3, ease: 'power2.out' });
  if (chapterLabel) gsap.to(chapterLabel, { alpha: 1, duration: 0.3, ease: 'power2.out' });
};
```

---

### 4. Level Transition Block Repetition

**File:** `src/game/screens/GameScreen.tsx`

**Comment:** "This block is repeated a couple times, maybe worth a shared method"

**Issue:** The level transition + progress update logic appears in two places:
1. CluePopup dismiss callback (levels 1-9)
2. Companion overlay dismiss callback (chapter end)

**Duplicated code:**
```typescript
game.playLevelTransition()
  .then(() => {
    const current = gameState.currentLevel();
    const total = gameState.totalLevels();
    bar.setProgress(current, total);
    if (chapterLabel) {
      chapterLabel.text = `${current} / ${total}`;
    }
    if (ariaLiveRef) {
      ariaLiveRef.textContent = `Chapter progress: ${current} of ${total}`;
    }
  })
  .catch(err => {
    console.error('[GameScreen] Level transition animation error:', err);
  });
```

**Recommendation:** Extract to a shared function:
```typescript
const playLevelTransitionAndUpdateProgress = async () => {
  try {
    await game.playLevelTransition();
    const current = gameState.currentLevel();
    const total = gameState.totalLevels();
    bar.setProgress(current, total);
    if (chapterLabel) chapterLabel.text = `${current} / ${total}`;
    if (ariaLiveRef) ariaLiveRef.textContent = `Chapter progress: ${current} of ${total}`;
  } catch (err) {
    console.error('[GameScreen] Level transition animation error:', err);
  }
};
```

---

### 5. Progress Bar Positioning Repetition

**File:** `src/game/screens/GameScreen.tsx`

**Comment:** Points to line 191 being repeated in resize handler

**Issue:** Progress bar and label positioning logic appears in:
1. Initial setup (around line 191)
2. Resize handler (around line 595)

**Recommendation:** Move positioning logic to a shared function:
```typescript
const positionProgressUI = () => {
  const gridPixelSize = game.getGridPixelSize();
  const gridTop = app.screen.height / 2 - gridPixelSize / 2;
  const barY = gridTop - 50;
  const currentBar = progressBar();
  if (currentBar) {
    const barWidth = Math.min(320, app.screen.width - 48);
    currentBar.x = (app.screen.width - barWidth) / 2;
    currentBar.y = barY;
  }
  if (chapterLabel) {
    chapterLabel.x = app.screen.width / 2;
    chapterLabel.y = barY - 24;
  }
};
```

---

## Priority Summary

| Priority | Issue | Impact |
|----------|-------|--------|
| High | Font family constant | Easy win, improves maintainability |
| Medium | Level transition helper | Reduces duplication, prevents bugs |
| Medium | Progress fade helpers | Cleaner code, easier to modify animations |
| Low | Positioning helper | Good practice but less critical |
| Low | Document Promise pattern | Nice to have for team learning |

---

## Recommendations

1. **Create a fonts config** - Single source of truth for font family
2. **Extract animation helpers** - `fadeOutProgressUI()`, `fadeInProgressUI()`
3. **Extract level transition helper** - `playLevelTransitionAndUpdateProgress()`
4. **Extract positioning helper** - `positionProgressUI()`
5. **Add JSDoc** to `playExitAnimation()` explaining the Promise pattern