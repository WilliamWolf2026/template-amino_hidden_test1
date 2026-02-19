import type { GridPosition, Direction, WallSide } from '../types/grid';
import type { BlockColor, BlockShape, BlockPlacement } from '../types/block';
import type { DockPlacement } from '../types/dock';
import type { LevelConfig, DifficultySettings } from '../types/level';
import { GRID_SIZE, posKey } from '../types/grid';
import { BLOCK_COLORS } from '../types/block';
import { SHAPES, getAbsoluteCells, getOccupiedRows, getOccupiedCols } from '../data/shapes';
import { GridSimulation } from './GridSimulation';
import { solve } from './Solver';
import { XoroShiro128Plus } from './LevelGenerator/XoroShiro128Plus';

const ALL_WALLS: WallSide[] = ['left', 'right', 'top', 'bottom'];
const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

/** Direction a block must slide to reach a given wall */
const WALL_TO_EXIT_DIR: Record<WallSide, Direction> = {
  left: 'left',
  right: 'right',
  top: 'up',
  bottom: 'down',
};

export interface GeneratorConfig {
  difficulty: DifficultySettings;
  gridSize?: number;
  seed: number;
  levelId: string;
  maxRetries?: number;
  solverMaxDepth?: number;
}

/**
 * Generate a solvable sliding block puzzle using backward generation.
 *
 * Algorithm:
 * 1. Choose colors and shapes for blocks
 * 2. Place docks on walls
 * 3. Place blocks at exit-ready positions (goal state)
 * 4. Add obstacle blocks at random positions
 * 5. Scramble by sliding blocks randomly (without docks, so they can't exit)
 * 6. Verify solvability with BFS solver
 * 7. Retry with new seed on failure
 */
export function generatePuzzle(config: GeneratorConfig): LevelConfig | null {
  const { difficulty, seed, levelId, maxRetries = 20, solverMaxDepth = 40 } = config;
  const gridSize = config.gridSize ?? GRID_SIZE;

  let rng = XoroShiro128Plus.fromSeed(seed);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = tryGenerate(rng, difficulty, gridSize, levelId, solverMaxDepth);
    if (result) return result;

    // Advance RNG for next attempt
    rng.unsafeJump();
  }

  console.warn(`[Generator] Failed to generate puzzle after ${maxRetries} retries (seed: ${seed})`);
  return null;
}

/**
 * Single generation attempt. Returns null if placement fails or puzzle is unsolvable.
 */
function tryGenerate(
  rng: XoroShiro128Plus,
  difficulty: DifficultySettings,
  gridSize: number,
  levelId: string,
  solverMaxDepth: number,
): LevelConfig | null {
  const { colorCount, obstacleCount, scrambleMoves, allowedShapes } = difficulty;

  // 1. Choose colors
  const shuffledColors = shuffle([...BLOCK_COLORS], rng);
  const blockColors = shuffledColors.slice(0, colorCount);
  const obstacleColors = shuffledColors.slice(colorCount, colorCount + obstacleCount);

  // 2. Choose shapes for colored blocks
  const blockShapes: BlockShape[] = [];
  for (let i = 0; i < colorCount; i++) {
    const shapeIdx = rng.unsafeUniformIntDistributionInternal(allowedShapes.length);
    blockShapes.push(allowedShapes[shapeIdx]);
  }

  // Choose shapes for obstacle blocks (prefer simpler shapes)
  const obstacleShapes: BlockShape[] = [];
  const simpleShapes = allowedShapes.filter((s) =>
    ['DOT', 'I2_H', 'I2_V', 'I3_H', 'I3_V'].includes(s),
  );
  const obstaclePool = simpleShapes.length > 0 ? simpleShapes : allowedShapes;
  for (let i = 0; i < obstacleCount; i++) {
    const shapeIdx = rng.unsafeUniformIntDistributionInternal(obstaclePool.length);
    obstacleShapes.push(obstaclePool[shapeIdx]);
  }

  // 3. Assign walls to colored blocks (distribute across walls)
  const walls = assignWalls(colorCount, rng);

  // 4. Place docks and blocks at exit-ready positions
  const blocks: BlockPlacement[] = [];
  const docks: DockPlacement[] = [];
  const occupancy = new Map<string, string>();

  // Track used dock indices per wall to avoid overlap
  const wallUsedIndices = new Map<WallSide, Set<number>>();
  for (const w of ALL_WALLS) wallUsedIndices.set(w, new Set());

  for (let i = 0; i < colorCount; i++) {
    const color = blockColors[i];
    const shape = blockShapes[i];
    const wall = walls[i];
    const shapeDef = SHAPES[shape];
    const isHorizontalExit = wall === 'left' || wall === 'right';

    // Perpendicular size: rows for horizontal exit, cols for vertical
    const perpSize = isHorizontalExit ? shapeDef.height : shapeDef.width;
    const maxPerpStart = gridSize - perpSize;

    // Find valid perpendicular position (no overlap with existing docks on same wall)
    const usedSet = wallUsedIndices.get(wall)!;
    const perpStart = findPerpPosition(shape, maxPerpStart, isHorizontalExit, usedSet, rng);
    if (perpStart === -1) return null;

    // Mark dock indices as used
    const perpIndices = computePerpIndices(shape, perpStart, isHorizontalExit);
    perpIndices.forEach((idx) => usedSet.add(idx));

    // Compute exit-ready anchor position
    const anchor = computeExitAnchor(wall, perpStart, shapeDef, gridSize, isHorizontalExit);

    // Check occupancy overlap
    const cells = getAbsoluteCells(shape, anchor);
    if (cells.some((c) => occupancy.has(posKey(c)))) return null;

    // Place block
    const blockId = `block_${color}`;
    blocks.push({ id: blockId, color, shape, position: anchor });
    cells.forEach((c) => occupancy.set(posKey(c), blockId));

    // Create dock with matching wallIndices
    const dockWallIndices = isHorizontalExit
      ? getOccupiedRows(shape, anchor)
      : getOccupiedCols(shape, anchor);

    docks.push({
      id: `dock_${color}`,
      color,
      wall,
      wallIndices: dockWallIndices,
    });
  }

  // 5. Place obstacle blocks at random positions
  for (let i = 0; i < obstacleCount; i++) {
    const color = obstacleColors[i];
    const shape = obstacleShapes[i];
    const shapeDef = SHAPES[shape];

    let placed = false;
    for (let tries = 0; tries < 50; tries++) {
      const col = rng.unsafeUniformIntDistributionInternal(gridSize - shapeDef.width + 1);
      const row = rng.unsafeUniformIntDistributionInternal(gridSize - shapeDef.height + 1);
      const anchor: GridPosition = { col, row };
      const cells = getAbsoluteCells(shape, anchor);

      if (!cells.some((c) => occupancy.has(posKey(c)))) {
        const blockId = `obstacle_${i}`;
        blocks.push({ id: blockId, color, shape, position: anchor });
        cells.forEach((c) => occupancy.set(posKey(c), blockId));
        placed = true;
        break;
      }
    }

    if (!placed) return null;
  }

  // 6. Scramble: create simulation without docks, randomly slide blocks
  const scrambleConfig: LevelConfig = {
    id: 'scramble',
    blocks: blocks.map((b) => ({ ...b, position: { ...b.position } })),
    docks: [], // No docks → blocks can't exit during scrambling
    gridSize,
  };

  const scrambleSim = new GridSimulation(scrambleConfig);
  const allBlockIds = blocks.map((b) => b.id);

  let effectiveMoves = 0;
  const maxAttempts = scrambleMoves * 4;
  for (let m = 0; m < maxAttempts && effectiveMoves < scrambleMoves; m++) {
    const blockIdx = rng.unsafeUniformIntDistributionInternal(allBlockIds.length);
    const dirIdx = rng.unsafeUniformIntDistributionInternal(4);
    const result = scrambleSim.slideBlock(allBlockIds[blockIdx], DIRECTIONS[dirIdx]);
    if (result.moved) effectiveMoves++;
  }

  // Extract scrambled positions
  const scrambledBlocks: BlockPlacement[] = blocks.map((b) => {
    const state = scrambleSim.getBlock(b.id)!;
    return {
      id: b.id,
      color: b.color,
      shape: b.shape,
      position: { ...state.position },
    };
  });

  // 7. Build final config and verify with BFS solver
  const finalConfig: LevelConfig = {
    id: levelId,
    blocks: scrambledBlocks,
    docks,
    gridSize,
  };

  const solution = solve(finalConfig, solverMaxDepth);
  if (!solution.solvable) return null;

  // Reject trivially easy puzzles
  if (solution.optimalMoveCount < 2) return null;

  finalConfig.optimalMoves = solution.optimalMoveCount;
  return finalConfig;
}

// ── Helpers ──

/** Fisher-Yates shuffle using seeded RNG */
function shuffle<T>(arr: T[], rng: XoroShiro128Plus): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.unsafeUniformIntDistributionInternal(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Distribute blocks across walls (round-robin with shuffle) */
function assignWalls(count: number, rng: XoroShiro128Plus): WallSide[] {
  const shuffled = shuffle([...ALL_WALLS], rng);
  const walls: WallSide[] = [];
  for (let i = 0; i < count; i++) {
    walls.push(shuffled[i % shuffled.length]);
  }
  return walls;
}

/**
 * Find a valid perpendicular position along a wall that doesn't overlap existing docks.
 * Tries random positions first, then falls back to exhaustive search.
 */
function findPerpPosition(
  shape: BlockShape,
  maxPerpStart: number,
  isHorizontalExit: boolean,
  usedSet: Set<number>,
  rng: XoroShiro128Plus,
): number {
  const tried = new Set<number>();

  // Try random positions first
  for (let t = 0; t <= maxPerpStart; t++) {
    const candidate = rng.unsafeUniformIntDistributionInternal(maxPerpStart + 1);
    if (tried.has(candidate)) continue;
    tried.add(candidate);

    const perpIndices = computePerpIndices(shape, candidate, isHorizontalExit);
    if (!perpIndices.some((idx) => usedSet.has(idx))) {
      return candidate;
    }
  }

  // Exhaustive fallback
  for (let p = 0; p <= maxPerpStart; p++) {
    if (tried.has(p)) continue;
    const perpIndices = computePerpIndices(shape, p, isHorizontalExit);
    if (!perpIndices.some((idx) => usedSet.has(idx))) {
      return p;
    }
  }

  return -1;
}

/** Compute perpendicular indices for a shape at a given start position */
function computePerpIndices(
  shape: BlockShape,
  perpStart: number,
  isHorizontalExit: boolean,
): number[] {
  if (isHorizontalExit) {
    return getOccupiedRows(shape, { col: 0, row: perpStart });
  }
  return getOccupiedCols(shape, { col: perpStart, row: 0 });
}

/** Compute the exit-ready anchor position for a block on a given wall */
function computeExitAnchor(
  wall: WallSide,
  perpStart: number,
  shapeDef: { width: number; height: number },
  gridSize: number,
  isHorizontalExit: boolean,
): GridPosition {
  switch (wall) {
    case 'left':
      return { col: 0, row: perpStart };
    case 'right':
      return { col: gridSize - shapeDef.width, row: perpStart };
    case 'top':
      return { col: perpStart, row: 0 };
    case 'bottom':
      return { col: perpStart, row: gridSize - shapeDef.height };
  }
}
