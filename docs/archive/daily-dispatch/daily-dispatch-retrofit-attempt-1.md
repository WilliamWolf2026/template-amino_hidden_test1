# Daily Dispatch Retrofit — Attempt 1

> Migration scan: City Lines (rotation puzzle) → Daily Dispatch (sliding block puzzle)

## Context
The game was forked from City Lines (rotation-based tile puzzle) but the GDD describes a **sliding block puzzle** (ice-puzzle style). The start screen is already reskinned. This plan replaces the core game mechanics, visuals, level generation, and screen flow to match the Daily Dispatch GDD.

## Architecture
All work in `src/game/dailydispatch/`. The scaffold is read-only. The existing `citylines/` directory is untouched (kept as reference). The controller factory pattern (`setup*Game()`) and screen integration layer remain identical — only the internals change.

---

## Phase 1: Types & Core Simulation (no Pixi dependency)

### New files
| File | Purpose |
|------|---------|
| `types/block.ts` | `BlockColor`, `BlockShape`, `ShapeDefinition`, `BlockPlacement`, `BlockState` |
| `types/dock.ts` | `DockPlacement`, `WallSide`, dock helpers |
| `data/shapes.ts` | Polyomino shape library (DOT, I2, I3, I4, L, J, T, O, RECT_2x3, RECT_3x2) with cell offsets |
| `core/GridSimulation.ts` | Pure-logic engine: 6x6 occupancy grid, `slideBlock()`, exit detection (perpendicular width check), `isLevelComplete()` |

### Modified files
| File | Change |
|------|--------|
| `types/grid.ts` | Replace with `GridPosition`, `Direction`, `DIR_VECTORS`, `WallSide`, `posKey()` |
| `types/level.ts` | Replace with `LevelConfig` (blocks + docks + clue), `DifficultySettings`, `CHAPTER_LEVEL_PROGRESSION` |
| `types/index.ts` | Update barrel exports |

### Key mechanic: `GridSimulation.slideBlock(blockId, direction)`
1. Remove block from occupancy (avoid self-collision)
2. Step one cell at a time in direction until blocked by wall/other block
3. At each wall hit: check if any matching-color dock aligns and block's perpendicular width fits
4. If exits dock → mark `exited = true`, don't re-place on grid
5. Otherwise → place at final position
6. Return `SlideResult { moved, newPosition, distance, exitedDock }`

---

## Phase 2: Visual Layer (Pixi classes)

### New files
| File | Purpose |
|------|---------|
| `core/Block.ts` | Pixi Container. Renders polyomino using `ui-palette_{color}.png` sprites (one per cell). Methods: `slideTo()`, `playExitAnimation()`, `playEraserAnimation()`, `setHighlighted()` |
| `core/Dock.ts` | Pixi Container. Renders truck dock using `prop-truck_{side/up/down}_{open/close}_{color}.png`. Methods: `close()`, `open()` |
| `core/DailyDispatchGame.ts` | Main Pixi Container (replaces CityLinesGame). Scene: gridContainer (prop-grid_backing.png) → docksContainer → blocksContainer → vfxContainer |
| `core/SwipeDetector.ts` | Pointer input → swipe direction detection. Hit-tests grid to find tapped block, resolves swipe angle to cardinal Direction |

### Scene graph (DailyDispatchGame)
```
DailyDispatchGame
  ├─ gridContainer (NineSliceSprite: prop-grid_backing.png)
  ├─ docksContainer (Dock × N around grid edges)
  ├─ blocksContainer (Block × N on grid cells)
  └─ vfxContainer (confetti/particles)
```

### Sprite mapping
| Role | Atlas frame |
|------|------------|
| Grid backing | `prop-grid_backing.png` (509×509, 9-slice) |
| Block cell | `ui-palette_{color}.png` (128×128, one per cell) |
| Dock (left/right wall) | `prop-truck_side_{open/close}_{color}.png` |
| Dock (top wall) | `prop-truck_up_{open/close}_{color}.png` |
| Dock (bottom wall) | `prop-truck_down_{open/close}_{color}.png` |
| Background | `bg-gameboard.png` (512×683) |
| Restart button | `ui-button_restart.png` |
| Eraser button | `ui-button_delete.png` |
| Dialogue box | `ui-dialogue.png` (9-slice) |

### Files to delete (dead citylines code)
- `core/RoadTile.ts`, `core/Exit.ts`, `core/Landmark.ts`, `core/ConnectionDetector.ts`
- `core/LevelGenerator/` (entire directory)
- `utils/evaluateConnections.ts`, `systems/DecorationSystem.ts`
- `data/landmarks.ts`, `data/counties.ts`

---

## Phase 3: Controller & Screen Integration

### Modified files
| File | Change |
|------|--------|
| `screens/gameController.ts` | Rewrite as `setupDailyDispatchGame()`. Same factory pattern, same return type. New internals: creates DailyDispatchGame, handles swipe events, manages eraser state, renders HUD (move counter + level label + eraser count) |
| `src/game/screens/GameScreen.tsx` | Swap import: `setupDailyDispatchGame` from `~/game/dailydispatch/screens/gameController` |
| `src/game/tuning/types.ts` | Add `SlideAnimationConfig` (durationPerCell, slideEasing, exitDuration) and `EraserConfig` (usesPerChapter) to `GameTuning` |
| `src/game/audio/sounds.ts` | Add SOUND_BLOCK_SLIDE, SOUND_BLOCK_EXIT, SOUND_TRUCK_CLOSE |
| `src/game/services/progress.ts` | Add `saveBlockState()` / `getBlockState()` / `clearBlockState()` for resume support |
| `ui/companion/CompanionConfig.ts` | Add Marty character with frames: idle, talking, surprised, thumbsup, popup |

### Controller modal phases (same pattern as existing)
1. **introduction** — Marty slides in with intro dialogue
2. **loading-puzzle** — Generate level, create blocks/docks, fade in
3. **chapter-start** — Tutorial hand if level 1
4. **playing** — Swipe input active, move counter updating
5. **completion** — Block exited last dock → confetti → clue popup → NEXT button

### HUD layout
- Top-left: Level label ("LEVEL: 3")
- Top-right: Move counter ("Moves: 12")
- Bottom-center: Eraser button with badge count
- Top-right corner: Restart button

---

## Phase 4: Level Generation

### New files
| File | Purpose |
|------|---------|
| `core/SlidingPuzzleGenerator.ts` | Backward generation: place blocks at exits → reverse-scramble → verify with BFS solver |
| `core/Solver.ts` | BFS solver: state = sorted block positions hash, explores all (block, direction) pairs, finds optimal moves |

### Algorithm: backward generation
1. Choose N colors from palette (based on difficulty)
2. Place docks on walls (randomized positions)
3. For each dock, place a same-colored block adjacent in exit-ready position
4. Add optional obstacle blocks (different colors or no-exit blocks)
5. Reverse-simulate: pull blocks away from exits with random moves
6. Verify solvability with BFS (max depth ~40 moves)
7. Retry with new seed if unsolvable

### Modified files
| File | Change |
|------|--------|
| `services/LevelGenerationService.ts` | Rewrite to use SlidingPuzzleGenerator |
| `services/ChapterGenerationService.ts` | Wire to new difficulty progression |

### Reused: `core/LevelGenerator/XoroShiro128Plus.ts` (seeded PRNG — keep as-is)

---

## Phase 5: Screens & Polish

### New files
| File | Purpose |
|------|---------|
| `ui/LevelCompleteOverlay.ts` | Confetti + coin animation + NEXT button (Pixi overlay) |
| `ui/TruckCloseOverlay.ts` | Chapter-end "swipe to close truck" using prop-truck_door_open/closed.png |

### Modified files
| File | Change |
|------|--------|
| `src/game/screens/ResultsScreen.tsx` | Score breakdown + story reveal + "Read Article" link + Marty |

### Eraser booster flow
1. Tap eraser button → enter eraser mode (blocks get overlay tint)
2. Tap any block → `game.eraseBlock(blockId)` → shrink+fade animation → remove
3. Decrement counter, exit eraser mode
4. 2 uses per chapter (configurable via tuning)

---

## Verification
1. **Phase 1**: Unit-test `GridSimulation` — load a level, slide blocks, verify exit detection
2. **Phase 2**: Hardcode a simple 2-block level, render with `bun run dev`, verify sprites appear
3. **Phase 3**: Play through a full level — swipe blocks, watch them slide, verify exit + win condition
4. **Phase 4**: Generate 10 levels, verify all are solvable via BFS
5. **Phase 5**: Complete a chapter end-to-end: 10 levels → truck close → results screen

## Risk mitigation
- **Level gen solvability**: BFS solver verifies every generated level. Cap block count per difficulty tier.
- **Performance**: BFS state space manageable (~12 blocks × 4 directions, heavy pruning). Set depth limit at 40.
- **Animation sequencing**: `isAnimating` flag gates input (same pattern as existing `isTransitioning`)
