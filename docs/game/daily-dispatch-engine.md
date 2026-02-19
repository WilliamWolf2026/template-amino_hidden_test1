# Daily Dispatch — Full Game Engine Retrofit (Phase 1-5)

> Completed: Replaced City Lines rotation puzzle with sliding block (ice-puzzle) engine

## Architecture

All work in `src/game/dailydispatch/`. The scaffold is read-only. Legacy `citylines/` directory preserved as reference. Controller factory pattern (`setup*Game()`) and screen integration layer unchanged — only internals replaced.

---

## Phase 1: Types & Core Simulation (no Pixi dependency)

### New files
| File | Purpose |
|------|---------|
| `types/block.ts` | `BlockColor`, `BlockShape`, `ShapeDefinition`, `BlockPlacement`, `BlockState` |
| `types/dock.ts` | `DockPlacement`, `DockState` |
| `data/shapes.ts` | Polyomino shape library — 15 shapes (DOT, I2_H/V, I3_H/V, I4_H/V, L, J, T, O, S, Z, RECT_2x3, RECT_3x2) with cell offsets |
| `core/GridSimulation.ts` | Pure-logic engine: 6×6 occupancy grid, `slideBlock()`, exit detection (perpendicular width check), `isLevelComplete()` |

### Modified files
| File | Change |
|------|--------|
| `types/grid.ts` | Replaced with `GridPosition {col, row}`, `Direction`, `WallSide`, `DIR_VECTORS`, `DIR_TO_WALL`, `OPPOSITE_DIR`, `posKey()`, `isInBounds()` |
| `types/level.ts` | Replaced with `LevelConfig` (blocks + docks + clue + optimalMoves), `DifficultySettings`, `CHAPTER_LEVEL_PROGRESSION` |
| `types/index.ts` | Updated barrel exports (removed landmark, added block, dock) |
| `data/index.ts` | Added shapes export |

### Key mechanic: `GridSimulation.slideBlock(blockId, direction)`
1. Remove block from occupancy (avoid self-collision)
2. Step one cell at a time in direction until blocked by wall/other block
3. At each wall hit: check if any matching-color dock aligns and block's perpendicular width fits
4. If exits dock → mark `exited = true`, close dock, don't re-place on grid
5. Otherwise → place at final position
6. Return `SlideResult { moved, newPosition, distance, exitedDock }`

---

## Phase 2: Visual Layer (Pixi classes)

### New files
| File | Purpose |
|------|---------|
| `core/Block.ts` | Pixi Container. Renders polyomino using `ui-palette_{color}.png` sprites (one per cell). Methods: `slideTo()`, `playExitAnimation()`, `playEraserAnimation()`, `setHighlighted()` |
| `core/Dock.ts` | Pixi Container. Renders truck dock using `prop-truck_{side/up/down}_{open/close}_{color}.png`. Methods: `close()`, `open()` |
| `core/DailyDispatchGame.ts` | Main Pixi Container. Scene: gridContainer → docksContainer → blocksContainer → vfxContainer. Manages simulation, handles swipe events, animations |
| `core/SwipeDetector.ts` | Pointer input → swipe direction detection. Hit-tests occupancy to find tapped block, resolves swipe angle to cardinal Direction |

### Scene graph
```
DailyDispatchGame
  ├─ gridContainer (NineSliceSprite: prop-grid_backing.png)
  ├─ docksContainer (Dock × N around grid edges)
  ├─ blocksContainer (Block × N on grid cells)
  └─ vfxContainer (confetti/particles)
```

---

## Phase 3: Controller & Screen Integration

### Modified files
| File | Change |
|------|--------|
| `screens/gameController.ts` | Complete rewrite as `setupDailyDispatchGame()`. Swipe events, move counter HUD, companion/dialogue system, chapter catalog loading |
| `screens/index.ts` | Updated barrel exports (renamed from CityLines) |
| `src/game/screens/GameScreen.tsx` | Swapped import to `setupDailyDispatchGame` |
| `src/game/tuning/types.ts` | Added `SlideAnimationConfig`, `EraserConfig` interfaces + defaults |
| `src/game/services/progress.ts` | Added `saveBlockState()` / `getBlockState()` / `clearBlockState()` |
| `ui/companion/CompanionConfig.ts` | Updated for Marty character (`character-marty_idle.png`) |
| `ui/companion/DialogueBox.ts` | Fixed sprite name to `ui-dialogue.png` |
| `ui/CluePopup.ts` | Updated sprite references for Marty |

### Controller modal phases
1. **introduction** — Marty slides in with intro dialogue
2. **loading-puzzle** — Generate level, create blocks/docks, fade in
3. **chapter-start** — Summary text before level 1
4. **playing** — Swipe input active, move counter updating
5. **completion** — Block exited last dock → clue popup or chapter-end companion

### HUD layout
- Top-center: Level label ("3 / 10") + progress bar
- Top-right: Move counter ("Moves: 12")

---

## Phase 4: Level Generation

### New files
| File | Purpose |
|------|---------|
| `core/Solver.ts` | BFS solver: state = block positions hash, explores all (block, direction) pairs, finds optimal moves. 50K node cap, depth 40 |
| `core/SlidingPuzzleGenerator.ts` | Backward generation: place blocks at exits → scramble with seeded PRNG → verify with BFS solver |
| `data/samplePuzzle.ts` | Two hardcoded test puzzles for development before generator is wired |

### Algorithm: backward generation
1. Choose N colors from palette (based on difficulty.colorCount)
2. Choose shapes from difficulty.allowedShapes
3. Assign walls to blocks (distributed across 4 walls)
4. Place docks on walls with non-overlapping wallIndices
5. Place blocks at exit-ready positions (flush with assigned wall)
6. Add obstacle blocks at random non-overlapping positions
7. Scramble: create dockless simulation, randomly slide blocks for scrambleMoves
8. Verify solvability with BFS solver (reject if unsolvable or < 2 optimal moves)
9. Retry with jumped RNG on failure (up to 20 attempts)

### Modified files
| File | Change |
|------|--------|
| `services/LevelGenerationService.ts` | Rewritten to use `SlidingPuzzleGenerator` |
| `services/ChapterGenerationService.ts` | Rewritten with difficulty progression via `DIFFICULTY_PRESETS` |

---

## Phase 5: Screens & Polish

### New files
| File | Purpose |
|------|---------|
| `ui/LevelCompleteOverlay.ts` | Confetti particles + move count + NEXT button (Pixi overlay) |
| `ui/TruckCloseOverlay.ts` | Chapter-end swipe-to-close truck door animation |

### Modified files
| File | Change |
|------|--------|
| `src/game/screens/ResultsScreen.tsx` | Story headline reveal + image + "Read Article" link + chapter stats |
| `src/game/state.ts` | Added `storyHeadline`, `storyImageUrl`, `storyArticleUrl` fields |

---

## File inventory

### New files (14)
```
src/game/dailydispatch/core/Block.ts
src/game/dailydispatch/core/DailyDispatchGame.ts
src/game/dailydispatch/core/Dock.ts
src/game/dailydispatch/core/GridSimulation.ts
src/game/dailydispatch/core/SlidingPuzzleGenerator.ts
src/game/dailydispatch/core/Solver.ts
src/game/dailydispatch/core/SwipeDetector.ts
src/game/dailydispatch/data/samplePuzzle.ts
src/game/dailydispatch/data/shapes.ts
src/game/dailydispatch/types/block.ts
src/game/dailydispatch/types/dock.ts
src/game/dailydispatch/ui/LevelCompleteOverlay.ts
src/game/dailydispatch/ui/TruckCloseOverlay.ts
docs/archive/daily-dispatch-retrofit-attempt-1.md
```

### Modified files (16)
```
src/game/dailydispatch/data/index.ts
src/game/dailydispatch/screens/gameController.ts
src/game/dailydispatch/screens/index.ts
src/game/dailydispatch/services/ChapterGenerationService.ts
src/game/dailydispatch/services/LevelGenerationService.ts
src/game/dailydispatch/types/grid.ts
src/game/dailydispatch/types/index.ts
src/game/dailydispatch/types/level.ts
src/game/dailydispatch/ui/CluePopup.ts
src/game/dailydispatch/ui/companion/CompanionConfig.ts
src/game/dailydispatch/ui/companion/DialogueBox.ts
src/game/screens/GameScreen.tsx
src/game/screens/ResultsScreen.tsx
src/game/services/progress.ts
src/game/state.ts
src/game/tuning/types.ts
```

## Legacy code (not deleted)
The following citylines files remain in `src/game/dailydispatch/` for reference but have type errors due to the new type system:
- `core/CityLinesGame.ts`, `core/RoadTile.ts`, `core/Exit.ts`, `core/Landmark.ts`, `core/ConnectionDetector.ts`
- `core/LevelGenerator/` (entire directory — XoroShiro128Plus.ts reused by new generator)
- `utils/evaluateConnections.ts`, `systems/DecorationSystem.ts`
- `data/landmarks.ts`, `data/counties.ts`, `data/sampleLevel.ts`
- `types/landmark.ts`
