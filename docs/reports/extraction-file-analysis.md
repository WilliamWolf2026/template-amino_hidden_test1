# Scaffold Extraction — File-by-File Analysis

Comprehensive analysis of 17 files in `src/game/` that contain reusable code for extraction to `src/core/`.

---

## High Priority — Move As-Is (5 files)

### 1. SpriteButton

**File:** `src/game/citylines/core/SpriteButton.ts` (241 lines)

Interactive Pixi button component with 9-slice support, text labels, hover/press animations via GSAP.

| Property | Value |
|----------|-------|
| Dependencies | `pixi.js`, `gsap`, `PixiLoader` (all scaffold) |
| Game imports | None |
| Game coupling | Zero — fully generic |
| Extraction effort | None — move as-is |
| Target | `src/core/components/pixi/SpriteButton.ts` |

**API:**
```typescript
class SpriteButton extends Container {
  constructor(gpuLoader: PixiLoader, config: SpriteButtonConfig)
  setEnabled(enabled: boolean): void
  setLabel(text: string): void
  playExitAnimation(): Promise<void>
}
```

**Why extract:** Every game needs interactive buttons. This has no City Lines knowledge — it takes an atlas name, sprite name, and click handler.

---

### 2. LevelCompletionController

**File:** `src/game/citylines/controllers/LevelCompletionController.ts` (229 lines)

State machine: `playing → completing → complete`. Event-driven with configurable timers.

| Property | Value |
|----------|-------|
| Dependencies | None (pure TypeScript) |
| Game imports | None |
| Game coupling | Zero — fully generic |
| Extraction effort | None — move as-is |
| Target | `src/core/systems/game/LevelCompletionController.ts` |

**API:**
```typescript
interface LevelCompletionController {
  state: 'playing' | 'completing' | 'complete'
  isInputBlocked: boolean
  canContinue: boolean
  startCompletion(levelId, moves, durationMs, clue): void
  continue(): void
  reset(): void
  destroy(): void
}
```

**Note:** Contains a `playLevelCompleteSound()` using Web Audio API as fallback. Could be extracted as separate utility or made optional.

---

### 3. Grid Types

**File:** `src/game/citylines/types/grid.ts` (47 lines)

Cardinal edge types, grid position, adjacency helpers.

| Property | Value |
|----------|-------|
| Dependencies | None (pure TypeScript) |
| Game imports | None |
| Game coupling | Zero |
| Extraction effort | None — move as-is |
| Target | `src/core/types/grid.ts` |

**Exports:**
- `Edge` type (`'north' | 'east' | 'south' | 'west'`)
- `EDGES` array, `OPPOSITE_EDGE` map
- `GridPosition` interface (`{ x, y }`)
- `GridSize` type (`4 | 5 | 6`)
- `getAdjacentPosition()`, `isInBounds()`, `posKey()`

**Why extract:** Any grid-based game (puzzle, strategy, board) needs these primitives.

---

### 4. Viewport Constants

**File:** `src/game/constants/viewport.ts` (80 lines)

Mobile viewport constraints, aspect ratio, safe padding, tile sizing calculations.

| Property | Value |
|----------|-------|
| Dependencies | None (pure TypeScript) |
| Game imports | None |
| Game coupling | Zero |
| Extraction effort | None — move as-is |
| Target | `src/core/config/viewport.ts` |

**Exports:**
- `VIEWPORT_MIN_WIDTH` (355), `VIEWPORT_MIN_HEIGHT` (473)
- `ASPECT_RATIO` (3/4), `SAFE_PADDING` (10), `MIN_TOUCH_TARGET` (44)
- `calculateMaxGridSize()`, `calculateTileSize()`

**Why extract:** These are Advance platform constants, not City Lines specific.

---

### 5. PriorityQueue

**File:** `src/game/citylines/core/LevelGenerator/PriorityQueue.ts` (44 lines)

Generic priority queue data structure. Sort-on-push (simple, sufficient for small graphs).

| Property | Value |
|----------|-------|
| Dependencies | None (pure TypeScript) |
| Game imports | None |
| Game coupling | Zero |
| Extraction effort | None — move as-is |
| Target | `src/core/utils/PriorityQueue.ts` |

---

## Medium Priority — Minor Refactoring Needed (7 files)

### 6. Dijkstra

**File:** `src/game/citylines/core/LevelGenerator/Dijkstra.ts` (120 lines)

Dijkstra's shortest-path algorithm with loop failsafe.

| Property | Value |
|----------|-------|
| Dependencies | `PriorityQueue` (also extractable) |
| Game imports | `PriorityQueue` via game path |
| Game coupling | Zero — import path only |
| Extraction effort | Update import path |
| Target | `src/core/utils/Dijkstra.ts` |

---

### 7. XoroShiro128Plus (PRNG)

**File:** `src/game/citylines/core/LevelGenerator/XoroShiro128Plus.ts` (80 lines)

Deterministic seeded PRNG. Critical for reproducible procedural generation.

| Property | Value |
|----------|-------|
| Dependencies | None |
| Game imports | None |
| Game coupling | Zero |
| Extraction effort | None — move as-is |
| Target | `src/core/utils/XoroShiro128Plus.ts` |

---

### 8. LevelGenerator

**File:** `src/game/citylines/core/LevelGenerator/LevelGenerator.ts` (798 lines)

Seeded procedural grid level generator with pathfinding, complexity (wriggle), and rotation.

| Property | Value |
|----------|-------|
| Dependencies | `Dijkstra`, `XoroShiro128Plus` (both extractable) |
| Game imports | Only the above two via game paths |
| Game coupling | Low — generates generic grid levels, not City Lines specific |
| Extraction effort | Update import paths. Consider: the types (`Point`, `Level`, `LevelGeneratorConfig`, `ComplexityConfig`, `RotationConfig`) are fully generic. |
| Target | `src/core/systems/generation/LevelGenerator.ts` |

**What it does:** Given a seed, grid size, and exit count, generates entry/exit points, pathfinds roads between them, optionally adds wriggle complexity and tile rotations. Outputs a generic `Level` object.

**Why extract:** This is reusable for any grid-based puzzle game. The City Lines-specific conversion (`LevelGenerationService.ts`) stays in game.

---

### 9. ProgressBar (Pixi)

**File:** `src/game/citylines/core/ProgressBar.ts` (225 lines)

Pixi-based progress bar with milestones, animated fill, label text.

| Property | Value |
|----------|-------|
| Dependencies | `pixi.js`, `PixiLoader` (scaffold) |
| Game imports | `GAME_FONT_FAMILY` from `~/game/config/fonts` |
| Game coupling | **Font family** and optional `tileTheme` param |
| Extraction effort | Accept `fontFamily` as constructor param instead of importing |
| Target | `src/core/components/pixi/ProgressBar.ts` |

**Changes needed:**
```diff
- import { GAME_FONT_FAMILY } from '~/game/config/fonts';
+ // Accept fontFamily via config
  export interface ProgressBarConfig {
    width: number;
    height: number;
+   fontFamily?: string;
    themeColor?: number;
-   tileTheme?: 'regular' | 'fall' | 'winter';
    showLabel?: boolean;
  }
```

---

### 10. CompletionOverlay

**File:** `src/game/screens/components/CompletionOverlay.tsx` (241 lines)

Solid.js level completion celebration overlay with GSAP animations, keyboard accessibility.

| Property | Value |
|----------|-------|
| Dependencies | `solid-js`, `gsap`, `Button` from scaffold UI |
| Game imports | None |
| Game coupling | Zero — fully driven by props |
| Extraction effort | Low — verify scaffold UI Button compatibility |
| Target | `src/core/ui/CompletionOverlay.tsx` |

**Props are already generic:**
```typescript
interface CompletionOverlayProps {
  open: boolean
  clueText: string           // Could rename to `message`
  celebrationImageUrl?: string
  canContinue: boolean
  onContinue: () => void
}
```

---

### 11. DialogueBox

**File:** `src/game/citylines/ui/companion/DialogueBox.ts` (141 lines)

Pixi 9-slice dialogue box with auto-sizing text.

| Property | Value |
|----------|-------|
| Dependencies | `pixi.js`, `PixiLoader` (scaffold) |
| Game imports | `GAME_FONT_FAMILY`, `getAtlasName()`, `CompanionConfig` positioning |
| Game coupling | **Font**, **atlas helper**, **positioning constants** |
| Extraction effort | Medium — parameterize font, atlas, and positioning |
| Target | `src/core/components/pixi/DialogueBox.ts` |

**Changes needed:**
- Accept `fontFamily`, `atlasName`, `spriteName` as constructor params
- Accept positioning config as params instead of importing constants
- Remove `getAtlasName()` and `CompanionConfig` imports

---

### 12. Companion Animations

**File:** `src/game/citylines/animations/companionAnimations.ts` (189 lines)

GSAP timeline factories: `animateSlideInFromRight`, `animateCompletionPopIn`, `animateCompanionExit`, `animateStaticAppear`.

| Property | Value |
|----------|-------|
| Dependencies | `gsap` |
| Game imports | Type imports only (`CompanionCharacter`, `DialogueBox`) |
| Game coupling | Low — operates on any Container-like objects via duck typing |
| Extraction effort | Replace concrete types with `Container` or a minimal interface |
| Target | `src/core/animations/dialogueAnimations.ts` |

**Changes needed:**
```diff
- import type { CompanionCharacter } from '../ui/CompanionCharacter';
- import type { DialogueBox } from '../ui/DialogueBox';
+ import type { Container } from 'pixi.js';

  export function animateSlideInFromRight(
-   character: CompanionCharacter,
-   dialogueBox: DialogueBox,
+   character: Container,
+   dialogueBox: Container,
    backgroundElement?: HTMLElement
  ): gsap.core.Timeline
```

---

## Low Priority — Needs Significant Refactoring (5 files)

### 13. GameState

**File:** `src/game/state.ts` (59 lines)

Singleton game state with Solid.js signals: score, health, currentLevel, totalLevels.

| Property | Value |
|----------|-------|
| Dependencies | `solid-js` |
| Game imports | None |
| Game coupling | Low — but the specific signals (score, health, level) are opinionated |
| Extraction effort | Medium — make generic with `createGameState<T>()` |
| Target | `src/core/systems/state/gameState.ts` |

**Consideration:** The current shape (score + health + level) is common but not universal. Could extract as a template/factory rather than a concrete type.

---

### 14. Character

**File:** `src/game/citylines/core/Character.ts` (77 lines)

Simple sprite container with named character type mapping.

| Property | Value |
|----------|-------|
| Dependencies | `pixi.js`, `PixiLoader` |
| Game imports | `getAtlasName()` |
| Game coupling | Hardcoded `CharacterType` enum (`paper_kid`, `news_hound`) and sprite mapping |
| Extraction effort | Medium — parameterize character type registry and atlas |
| Target | `src/core/components/pixi/CharacterSprite.ts` |

**Changes needed:**
```diff
- export type CharacterType = 'paper_kid' | 'news_hound';
- const CHARACTER_SPRITES: Record<CharacterType, string> = { ... };
+ export interface CharacterSpriteConfig<T extends string> {
+   type: T;
+   spriteMap: Record<T, string>;
+   atlasName: string;
+   baseSize: { width: number; height: number };
+ }
```

---

### 15. CompanionCharacter

**File:** `src/game/citylines/ui/companion/CompanionCharacter.ts` (116 lines)

Sprite container with full/head display modes and positioned dialogue support.

| Property | Value |
|----------|-------|
| Dependencies | `pixi.js`, `PixiLoader` |
| Game imports | `getAtlasName()`, `CompanionConfig` (character types, scales, positioning) |
| Game coupling | High — deeply coupled to City Lines character config |
| Extraction effort | High — need generic config interface for character types, scales, positioning |
| Target | Consider keeping in game, or extract a base class |

---

### 16. CluePopup

**File:** `src/game/citylines/ui/CluePopup.ts` (259 lines)

Pixi popup with circular character avatar + speech bubble. Auto-dismiss with GSAP animations.

| Property | Value |
|----------|-------|
| Dependencies | `pixi.js`, `gsap`, `PixiLoader` |
| Game imports | `getAtlasName()`, `CHARACTER_SPRITES`, `CHARACTER_BASE_SIZE`, `GAME_FONT_FAMILY` |
| Game coupling | Medium — uses specific character sprite and font |
| Extraction effort | Medium-High — parameterize character sprite, font, sizes |
| Target | `src/core/components/pixi/AvatarPopup.ts` |

---

### 17. LoadingScreen

**File:** `src/game/screens/LoadingScreen.tsx` (65 lines)

Loading screen with progress bar, spinner, logo. Routes to start or game based on saved progress.

| Property | Value |
|----------|-------|
| Dependencies | `solid-js`, scaffold `useScreen`, `useAssets`, UI components |
| Game imports | `hasChapterInProgress()` from game services |
| Game coupling | Routing logic (`hasChapterInProgress` → skip start screen) |
| Extraction effort | Medium — inject routing decision as a callback/config |
| Target | `src/core/screens/LoadingScreen.tsx` |

**Changes needed:**
```diff
+ export interface LoadingScreenConfig {
+   /** Determine which screen to navigate to after loading */
+   getNextScreen: () => 'start' | 'game';
+   /** Background color */
+   backgroundColor?: string;
+ }

  export function LoadingScreen(
-   // hardcoded hasChapterInProgress check
+   config: LoadingScreenConfig
  )
```

---

## Summary

| Priority | Files | Lines | Effort | Value |
|----------|------:|------:|--------|-------|
| High (move as-is) | 5 | 641 | Zero — copy files | Immediate reuse |
| Medium (minor refactor) | 7 | 1,834 | Update imports, parameterize 1-2 things | High — core game infra |
| Low (significant refactor) | 5 | 576 | Generic interfaces, decouple configs | Moderate — patterns/templates |
| **Total** | **17** | **3,051** | | |

### Completed Extraction (2026-02-11)

The following files were extracted to `src/game/shared/` (reusable game-level layer) or `src/core/`:

```
Moved to scaffold:
  └── viewport.ts          → scaffold/config/viewport.ts

Moved to game/shared/components/:
  ├── SpriteButton.ts      → shared/components/SpriteButton.ts (as-is)
  ├── ProgressBar.ts       → shared/components/ProgressBar.ts (parameterized fontFamily, removed tileTheme)
  ├── DialogueBox.ts       → shared/components/DialogueBox.ts (parameterized font, atlas, positioning)
  ├── CharacterSprite.ts   → shared/components/CharacterSprite.ts (generic type config)
  └── AvatarPopup.ts       → shared/components/AvatarPopup.ts (parameterized all game deps)

Moved to game/shared/controllers/:
  └── LevelCompletionController.ts → shared/controllers/LevelCompletionController.ts (as-is)

Citylines wrappers (inject game-specific config):
  ├── citylines/core/SpriteButton.ts       → re-export from shared
  ├── citylines/core/ProgressBar.ts        → re-export from shared
  ├── citylines/core/Character.ts          → extends CharacterSprite with game config
  ├── citylines/ui/companion/DialogueBox.ts → extends shared DialogueBox with game config
  ├── citylines/ui/CluePopup.ts            → extends AvatarPopup with game config
  └── citylines/controllers/LevelCompletionController.ts → re-export from shared
```

### Remaining (Not Extracted)

```
Not extracted (City Lines specific or low priority):
  ├── grid.ts              — City Lines specific grid types
  ├── PriorityQueue.ts     — Used only by LevelGenerator
  ├── XoroShiro128Plus.ts  — Used only by LevelGenerator
  ├── Dijkstra.ts          — Used only by LevelGenerator
  ├── LevelGenerator.ts    — City Lines specific (user decision)
  ├── CompletionOverlay.tsx — Could be extracted later
  ├── companionAnimations.ts — Could be extracted later
  ├── state.ts             — Game state signals (opinionated shape)
  ├── CompanionCharacter.ts — Too coupled to City Lines config
  └── LoadingScreen.tsx    — Has game-specific routing logic
```

---

*Generated: 2026-02-11, Updated: 2026-02-11*
