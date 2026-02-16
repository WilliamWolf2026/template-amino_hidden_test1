# Scaffold Extraction Candidates Report

> **Status (2026-02-11):** Partially completed. Key components moved to `src/game/shared/` instead of scaffold. See [extraction-file-analysis.md](extraction-file-analysis.md) for the updated status of all 17 files. Viewport moved to `src/scaffold/config/viewport.ts`.

Analysis of components in `src/game/` that could be moved to `src/scaffold/` for reuse across games.

## Summary

| Priority | Count | Description |
|----------|-------|-------------|
| High | 5 | Ready to move immediately |
| Medium | 5 | Need minor refactoring first |
| Low | 5 | Keep as patterns/references |

---

## High Priority (Move Immediately)

### 1. LevelCompletionController
- **Location:** `src/game/citylines/controllers/LevelCompletionController.ts`
- **What:** Minimal state machine for level completion sequence with event-based architecture
- **Why reusable:** 100% generic - no game-specific code, clean interface
- **Changes needed:** None
- **Target:** `src/scaffold/systems/game/LevelCompletionController.ts`

```typescript
// Already generic interface:
interface LevelCompletionController {
  state: 'playing' | 'completing' | 'complete';
  isInputBlocked: boolean;
  startCompletion(levelNumber, moves, duration, clue): void;
  continue(): void;
  reset(): void;
}
```

### 2. SpriteButton
- **Location:** `src/game/citylines/core/SpriteButton.ts`
- **What:** Interactive Pixi button with hover/press animations, optional text, 9-slice support
- **Why reusable:** Generic button pattern for any Pixi game
- **Changes needed:** Remove hardcoded atlas references, make atlas name a parameter
- **Target:** `src/scaffold/ui/SpriteButton.ts`

### 3. SeededRandom
- **Location:** Inside `src/game/citylines/systems/DecorationSystem.ts`
- **What:** Seeded pseudo-random number generator for reproducible results
- **Why reusable:** Pure utility, useful for any game needing deterministic randomness
- **Changes needed:** Extract to separate file
- **Target:** `src/scaffold/utils/random.ts`

```typescript
// Extract this class:
class SeededRandom {
  constructor(seed: number);
  next(): number;        // 0-1
  nextInt(max: number): number;
  nextFloat(min: number, max: number): number;
}
```

### 4. Dialogue Animation Timelines
- **Location:** `src/game/citylines/animations/companionAnimations.ts`
- **What:** GSAP timeline factories for slide-in, pop-in, exit animations
- **Why reusable:** Generic animation patterns for modals/dialogs
- **Changes needed:** Rename to generic names, remove "Companion" references
- **Target:** `src/scaffold/ui/animations/dialogueAnimations.ts`

### 5. useDialogueState Hook
- **Location:** `src/game/screens/hooks/useCompanionDialogue.ts`
- **What:** Solid.js hook for dialogue open/close, message queue, display modes
- **Why reusable:** Generic dialogue state management
- **Changes needed:** Rename from `useCompanionDialogue` to `useDialogueState`
- **Target:** `src/scaffold/systems/dialogue/useDialogueState.ts`

---

## Medium Priority (Refactor Then Move)

### 6. ProgressBar (Pixi)
- **Location:** `src/game/citylines/core/ProgressBar.ts`
- **What:** Animated progress bar with milestone dots, smooth fill animation
- **Why reusable:** Generic progress visualization
- **Changes needed:** Remove `tileTheme` parameter (game-specific), make colors fully parameterized
- **Target:** `src/scaffold/ui/PixiProgressBar.ts`

### 7. Progress Service Pattern
- **Location:** `src/game/services/progress.ts`
- **What:** Complete progress persistence with versioned store
- **Why reusable:** Excellent pattern, already uses scaffold storage
- **Changes needed:**
  - Rename `CurrentChapter` → generic `GameProgress`
  - Parameterize storage key
  - Document as pattern in scaffold
- **Target:** Pattern documentation + factory function

### 8. Atlas Helper Pattern
- **Location:** `src/game/citylines/utils/atlasHelper.ts`
- **What:** Module-level state for current atlas name with theme switching
- **Why reusable:** Generic pattern for multi-theme games
- **Changes needed:** Generalize theme type from `'regular'|'fall'|'winter'`
- **Target:** `src/scaffold/utils/atlasHelper.ts`

### 9. CompletionOverlay
- **Location:** `src/game/screens/components/CompletionOverlay.tsx`
- **What:** Level completion modal with celebration, GSAP entrance animation
- **Why reusable:** Generic completion/celebration UI
- **Changes needed:** Make title text configurable (not hardcoded "Level Complete!")
- **Target:** `src/scaffold/ui/CompletionOverlay.tsx`

### 10. DialogueBox
- **Location:** `src/game/citylines/ui/companion/DialogueBox.ts`
- **What:** 9-slice sprite dialogue box with responsive sizing
- **Why reusable:** Generic dialogue container
- **Changes needed:** Extract positioning logic to config parameter
- **Target:** `src/scaffold/ui/DialogueBox.ts`

---

## Low Priority (Keep as Patterns/References)

### 11. DecorationSystem
- **Location:** `src/game/citylines/systems/DecorationSystem.ts`
- **What:** Procedural sprite placement with weighted selection
- **Why keep:** Too coupled to grid-based coordinate system
- **Action:** Extract `SeededRandom` only, keep rest in game

### 12. CluePopup
- **Location:** `src/game/citylines/ui/CluePopup.ts`
- **What:** Popup with character head in circle, speech bubble
- **Why keep:** Too specific to companion character pattern
- **Action:** Keep in game, use as reference

### 13. CompanionCharacter
- **Location:** `src/game/citylines/ui/companion/CompanionCharacter.ts`
- **What:** Character sprite with full/head display modes
- **Why keep:** Character-specific, though pattern is useful
- **Action:** Document pattern, keep implementation in game

### 14. GameState
- **Location:** `src/game/state.ts`
- **What:** Signal-based state for score, health, level
- **Why keep:** Game-specific fields, but pattern is valuable
- **Action:** Document pattern in scaffold docs, don't move code

### 15. GameAudioManager
- **Location:** `src/game/audio/manager.ts`
- **What:** Extends BaseAudioManager with game-specific sounds
- **Why keep:** Intentionally game-specific (extends scaffold's BaseAudioManager)
- **Action:** Keep as example of extending scaffold audio

---

## Extraction Roadmap

### Phase 1: Pure Utilities (No refactoring needed)
```
1. SeededRandom → scaffold/utils/random.ts
2. LevelCompletionController → scaffold/systems/game/
```

### Phase 2: UI Components (Minor refactoring)
```
3. SpriteButton → scaffold/ui/SpriteButton.ts
4. DialogueAnimations → scaffold/ui/animations/
5. useDialogueState → scaffold/systems/dialogue/
```

### Phase 3: Pixi Components (Remove game-specific config)
```
6. ProgressBar (Pixi) → scaffold/ui/PixiProgressBar.ts
7. DialogueBox → scaffold/ui/DialogueBox.ts
8. CompletionOverlay → scaffold/ui/CompletionOverlay.tsx
```

### Phase 4: Patterns & Documentation
```
9. Progress Service → Document pattern, create factory
10. Atlas Helper → Document pattern, generalize
11. Game State pattern → Documentation only
```

---

## New Scaffold Structure (After Extraction)

```
src/scaffold/
├── systems/
│   ├── game/
│   │   └── LevelCompletionController.ts  ← NEW
│   └── dialogue/
│       └── useDialogueState.ts           ← NEW
├── ui/
│   ├── SpriteButton.ts                   ← NEW (Pixi)
│   ├── PixiProgressBar.ts                ← NEW (Pixi)
│   ├── DialogueBox.ts                    ← NEW (Pixi)
│   ├── CompletionOverlay.tsx             ← NEW (Solid)
│   └── animations/
│       └── dialogueAnimations.ts         ← NEW
└── utils/
    ├── storage.ts                        (existing)
    ├── random.ts                         ← NEW (SeededRandom)
    └── atlasHelper.ts                    ← NEW
```

---

## Notes

- **Already well-abstracted:** BaseAudioManager, VersionedStore, ScreenManager
- **Don't over-extract:** Some things should stay game-specific
- **Pattern vs Code:** Sometimes documenting the pattern is better than moving code
- **Breaking changes:** Moving code may require updating imports across games

---

## Estimated Effort

| Phase | Components | Effort |
|-------|------------|--------|
| Phase 1 | 2 | 2 hours |
| Phase 2 | 3 | 4 hours |
| Phase 3 | 3 | 6 hours |
| Phase 4 | 3 | 4 hours |
| **Total** | **11** | **~16 hours** |
