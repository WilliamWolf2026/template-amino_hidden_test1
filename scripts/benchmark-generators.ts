#!/usr/bin/env bun
/**
 * Benchmark: Existing SlidingPuzzleGenerator vs Pasted Spec-Driven Generator
 * Usage: bun scripts/benchmark-generators.ts [count]
 * Default count: 1_000_000
 */

const TOTAL = parseInt(process.argv[2] || '1000000', 10);
const REPORT_EVERY = Math.max(1, Math.floor(TOTAL / 20));

// ============================================================================
// SHARED TYPES
// ============================================================================

type Direction = 'up' | 'down' | 'left' | 'right';
type ExitSide = 'top' | 'bottom' | 'left' | 'right';

// ============================================================================
// SEEDED RNG — XoroShiro128Plus (used by existing generator)
// ============================================================================

class XoroShiro128Plus {
  private s0h: number; private s0l: number;
  private s1h: number; private s1l: number;

  private constructor(s0h: number, s0l: number, s1h: number, s1l: number) {
    this.s0h = s0h; this.s0l = s0l; this.s1h = s1h; this.s1l = s1l;
  }

  static fromSeed(seed: number): XoroShiro128Plus {
    let s = seed | 0;
    const s0h = (s = (s * 1103515245 + 12345) | 0) >>> 0;
    const s0l = (s = (s * 1103515245 + 12345) | 0) >>> 0;
    const s1h = (s = (s * 1103515245 + 12345) | 0) >>> 0;
    const s1l = (s = (s * 1103515245 + 12345) | 0) >>> 0;
    return new XoroShiro128Plus(s0h || 1, s0l || 1, s1h || 1, s1l || 1);
  }

  unsafeNext(): number {
    const a0h = this.s0h >>> 0, a0l = this.s0l >>> 0;
    const a1h = this.s1h >>> 0, a1l = this.s1l >>> 0;
    const rh = (a0h + a1h + ((a0l + a1l) >>> 31 ? 1 : 0)) >>> 0;

    let b1h = a0h ^ a1h, b1l = a0l ^ a1l;
    const r0h = ((a0h << 24) | (a0l >>> 8)) ^ b1h ^ ((b1h << 16) | (b1l >>> 16));
    const r0l = ((a0l << 24) | (a0h >>> 8)) ^ b1l ^ (b1l << 16);
    this.s0h = r0h >>> 0; this.s0l = r0l >>> 0;
    this.s1h = ((b1h << 5) | (b1l >>> 27)) >>> 0;
    this.s1l = ((b1l << 5) | (b1h >>> 27)) >>> 0;
    return rh;
  }

  unsafeJump(): void {
    for (let i = 0; i < 4; i++) this.unsafeNext();
  }

  unsafeUniformIntDistributionInternal(max: number): number {
    const r = this.unsafeNext();
    return r % max;
  }
}

// ============================================================================
// SEEDED RNG — LCG (used by pasted generator)
// ============================================================================

class SeededRandom {
  private seed: number;
  constructor(seed?: number) { this.seed = seed ?? Date.now(); }
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(array: readonly T[]): T { return array[this.nextInt(0, array.length - 1)]; }
  shuffle<T>(array: readonly T[]): T[] {
    const clone = [...array];
    for (let i = clone.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
  }
}

// ============================================================================
// EXISTING GENERATOR — SlidingPuzzleGenerator (simplified self-contained)
// ============================================================================
// Backward generation: place at exit, scramble, BFS verify

namespace ExistingGen {
  type BlockShape = 'DOT' | 'I2_H' | 'I2_V' | 'I3_H' | 'I3_V' | 'I4_H' | 'I4_V'
    | 'L' | 'J' | 'T' | 'O' | 'S' | 'Z';
  type WallSide = 'left' | 'right' | 'top' | 'bottom';
  type BlockColor = string;

  interface ShapeDef { cells: { col: number; row: number }[]; width: number; height: number; }
  interface BlockPlacement { id: string; color: string; shape: BlockShape; position: { col: number; row: number }; }
  interface DockPlacement { id: string; color: string; wall: WallSide; wallIndices: number[]; }
  interface LevelConfig { id: string; blocks: BlockPlacement[]; docks: DockPlacement[]; gridSize: number; optimalMoves?: number; }
  interface DifficultySettings { colorCount: number; obstacleCount: number; scrambleMoves: number; allowedShapes: BlockShape[]; }

  const SHAPES: Record<BlockShape, ShapeDef> = {
    DOT: { cells: [{ col: 0, row: 0 }], width: 1, height: 1 },
    I2_H: { cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }], width: 2, height: 1 },
    I2_V: { cells: [{ col: 0, row: 0 }, { col: 0, row: 1 }], width: 1, height: 2 },
    I3_H: { cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }], width: 3, height: 1 },
    I3_V: { cells: [{ col: 0, row: 0 }, { col: 0, row: 1 }, { col: 0, row: 2 }], width: 1, height: 3 },
    I4_H: { cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }], width: 4, height: 1 },
    I4_V: { cells: [{ col: 0, row: 0 }, { col: 0, row: 1 }, { col: 0, row: 2 }, { col: 0, row: 3 }], width: 1, height: 4 },
    L: { cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 0, row: 1 }], width: 2, height: 2 },
    J: { cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 1, row: 1 }], width: 2, height: 2 },
    T: { cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 1, row: 1 }], width: 3, height: 2 },
    O: { cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 0, row: 1 }, { col: 1, row: 1 }], width: 2, height: 2 },
    S: { cells: [{ col: 1, row: 0 }, { col: 2, row: 0 }, { col: 0, row: 1 }, { col: 1, row: 1 }], width: 3, height: 2 },
    Z: { cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 1, row: 1 }, { col: 2, row: 1 }], width: 3, height: 2 },
  };

  const BLOCK_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  const ALL_WALLS: WallSide[] = ['left', 'right', 'top', 'bottom'];
  const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];
  const DIR_VECTORS: Record<Direction, { col: number; row: number }> = {
    up: { col: 0, row: -1 }, down: { col: 0, row: 1 },
    left: { col: -1, row: 0 }, right: { col: 1, row: 0 },
  };

  function posKey(p: { col: number; row: number }): string { return `${p.col},${p.row}`; }
  function getAbsCells(shape: BlockShape, anchor: { col: number; row: number }) {
    return SHAPES[shape].cells.map(c => ({ col: anchor.col + c.col, row: anchor.row + c.row }));
  }
  function getOccRows(shape: BlockShape, anchor: { col: number; row: number }): number[] {
    const rows = new Set<number>();
    for (const c of SHAPES[shape].cells) rows.add(anchor.row + c.row);
    return [...rows].sort((a, b) => a - b);
  }
  function getOccCols(shape: BlockShape, anchor: { col: number; row: number }): number[] {
    const cols = new Set<number>();
    for (const c of SHAPES[shape].cells) cols.add(anchor.col + c.col);
    return [...cols].sort((a, b) => a - b);
  }

  function shuffle<T>(arr: T[], rng: XoroShiro128Plus): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = rng.unsafeUniformIntDistributionInternal(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function assignWalls(count: number, rng: XoroShiro128Plus): WallSide[] {
    const shuffled = shuffle([...ALL_WALLS], rng);
    return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);
  }

  // Minimal GridSimulation for scrambling + solving
  class MiniSim {
    private blocks: Map<string, { id: string; shape: BlockShape; position: { col: number; row: number } }>;
    private docks: DockPlacement[];
    private gridSize: number;
    private occupancy: Map<string, string>;

    constructor(config: LevelConfig) {
      this.gridSize = config.gridSize;
      this.docks = config.docks;
      this.blocks = new Map();
      this.occupancy = new Map();
      for (const b of config.blocks) {
        this.blocks.set(b.id, { id: b.id, shape: b.shape, position: { ...b.position } });
        for (const c of getAbsCells(b.shape, b.position)) this.occupancy.set(posKey(c), b.id);
      }
    }

    slideBlock(blockId: string, dir: Direction): { moved: boolean; distance: number; exitedDock?: DockPlacement; newPosition?: { col: number; row: number } } {
      const block = this.blocks.get(blockId);
      if (!block) return { moved: false, distance: 0 };

      const vec = DIR_VECTORS[dir];
      const shapeDef = SHAPES[block.shape];

      // Remove block from occupancy
      for (const c of getAbsCells(block.shape, block.position)) this.occupancy.delete(posKey(c));

      let pos = { ...block.position };
      let dist = 0;

      while (true) {
        const next = { col: pos.col + vec.col, row: pos.row + vec.row };
        const nextCells = getAbsCells(block.shape, next);

        // Check bounds
        if (nextCells.some(c => c.col < 0 || c.col >= this.gridSize || c.row < 0 || c.row >= this.gridSize)) {
          // Check if exiting through a dock
          const exitDock = this.findExitDock(block.shape, pos, dir);
          if (exitDock) {
            block.position = pos;
            for (const c of getAbsCells(block.shape, pos)) this.occupancy.set(posKey(c), blockId);
            this.blocks.delete(blockId);
            for (const c of getAbsCells(block.shape, pos)) this.occupancy.delete(posKey(c));
            return { moved: dist > 0, distance: dist, exitedDock: exitDock, newPosition: pos };
          }
          break;
        }

        // Check collision
        if (nextCells.some(c => this.occupancy.has(posKey(c)))) break;

        pos = next;
        dist++;
      }

      block.position = pos;
      for (const c of getAbsCells(block.shape, pos)) this.occupancy.set(posKey(c), blockId);
      return { moved: dist > 0, distance: dist, newPosition: pos };
    }

    private findExitDock(shape: BlockShape, pos: { col: number; row: number }, dir: Direction): DockPlacement | undefined {
      const shapeDef = SHAPES[shape];
      for (const dock of this.docks) {
        const wallDir = dock.wall === 'left' ? 'left' : dock.wall === 'right' ? 'right' : dock.wall === 'top' ? 'up' : 'down';
        if (wallDir !== dir) continue;

        const blockIndices = (dock.wall === 'left' || dock.wall === 'right')
          ? getOccRows(shape, pos)
          : getOccCols(shape, pos);

        const atWall = dock.wall === 'left' ? pos.col === 0
          : dock.wall === 'right' ? pos.col + shapeDef.width === this.gridSize
          : dock.wall === 'top' ? pos.row === 0
          : pos.row + shapeDef.height === this.gridSize;

        if (atWall && blockIndices.length === dock.wallIndices.length &&
          blockIndices.every((v, i) => v === dock.wallIndices[i])) {
          return dock;
        }
      }
      return undefined;
    }

    getBlock(id: string) { return this.blocks.get(id); }
    getActiveBlocks() { return [...this.blocks.values()]; }
    isComplete(): boolean {
      for (const dock of this.docks) {
        const hasMatch = [...this.blocks.values()].some(b =>
          this.blocks.has(b.id) && (b.id.includes(dock.color) || dock.id.includes(b.id.replace('block_', '')))
        );
        // Simplified: level complete when all colored blocks are gone
      }
      // Simple check: no non-obstacle blocks remain
      return ![...this.blocks.values()].some(b => b.id.startsWith('block_'));
    }

    encode(): string {
      const parts: string[] = [];
      for (const [id, b] of [...this.blocks.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        parts.push(`${id}:${b.position.col},${b.position.row}`);
      }
      return parts.join('|');
    }
  }

  // BFS Solver (simplified)
  function solve(config: LevelConfig, maxDepth: number = 40): { solvable: boolean; optimalMoveCount: number } {
    const blockIds = config.blocks.filter(b => b.id.startsWith('block_')).map(b => b.id);
    if (blockIds.length === 0) return { solvable: true, optimalMoveCount: 0 };

    const sim = new MiniSim(config);
    if (sim.isComplete()) return { solvable: true, optimalMoveCount: 0 };

    const visited = new Set<string>();
    visited.add(sim.encode());

    interface QueueItem { config: LevelConfig; depth: number; }
    const queue: QueueItem[] = [{ config: JSON.parse(JSON.stringify(config)), depth: 0 }];
    let maxNodes = 50000;

    while (queue.length > 0 && maxNodes-- > 0) {
      const item = queue.shift()!;
      if (item.depth >= maxDepth) continue;

      const currentSim = new MiniSim(item.config);
      const activeBlocks = currentSim.getActiveBlocks();

      for (const block of activeBlocks) {
        for (const dir of DIRECTIONS) {
          const trySim = new MiniSim(JSON.parse(JSON.stringify(item.config)));
          const result = trySim.slideBlock(block.id, dir);
          if (!result.moved) continue;

          if (trySim.isComplete()) {
            return { solvable: true, optimalMoveCount: item.depth + 1 };
          }

          const state = trySim.encode();
          if (!visited.has(state)) {
            visited.add(state);
            // Rebuild config from sim state
            const newConfig: LevelConfig = {
              ...item.config,
              blocks: item.config.blocks.map(b => {
                const live = trySim.getBlock(b.id);
                if (!live) return { ...b, position: { col: -1, row: -1 } }; // exited
                return { ...b, position: { ...live.position } };
              }).filter(b => b.position.col >= 0),
            };
            queue.push({ config: newConfig, depth: item.depth + 1 });
          }
        }
      }
    }

    return { solvable: false, optimalMoveCount: -1 };
  }

  function computePerpIndices(shape: BlockShape, perpStart: number, isH: boolean): number[] {
    return isH ? getOccRows(shape, { col: 0, row: perpStart }) : getOccCols(shape, { col: perpStart, row: 0 });
  }

  function findPerpPosition(shape: BlockShape, maxStart: number, isH: boolean, usedSet: Set<number>, rng: XoroShiro128Plus): number {
    const tried = new Set<number>();
    for (let t = 0; t <= maxStart; t++) {
      const c = rng.unsafeUniformIntDistributionInternal(maxStart + 1);
      if (tried.has(c)) continue;
      tried.add(c);
      if (!computePerpIndices(shape, c, isH).some(i => usedSet.has(i))) return c;
    }
    for (let p = 0; p <= maxStart; p++) {
      if (tried.has(p)) continue;
      if (!computePerpIndices(shape, p, isH).some(i => usedSet.has(i))) return p;
    }
    return -1;
  }

  function computeExitAnchor(wall: WallSide, perpStart: number, shapeDef: ShapeDef, gridSize: number, isH: boolean): { col: number; row: number } {
    switch (wall) {
      case 'left': return { col: 0, row: perpStart };
      case 'right': return { col: gridSize - shapeDef.width, row: perpStart };
      case 'top': return { col: perpStart, row: 0 };
      case 'bottom': return { col: perpStart, row: gridSize - shapeDef.height };
    }
  }

  export const DIFFICULTY_PRESETS: Record<string, DifficultySettings> = {
    easy: { colorCount: 2, obstacleCount: 0, scrambleMoves: 4, allowedShapes: ['DOT', 'I2_H', 'I2_V', 'I3_H', 'I3_V'] },
    medium: { colorCount: 3, obstacleCount: 1, scrambleMoves: 6, allowedShapes: ['DOT', 'I2_H', 'I2_V', 'I3_H', 'I3_V', 'L', 'J', 'T', 'O'] },
    hard: { colorCount: 4, obstacleCount: 2, scrambleMoves: 8, allowedShapes: ['DOT', 'I2_H', 'I2_V', 'I3_H', 'I3_V', 'I4_H', 'I4_V', 'L', 'J', 'T', 'O', 'S', 'Z'] },
  };

  function tryGenerate(rng: XoroShiro128Plus, difficulty: DifficultySettings, gridSize: number, solverMaxDepth: number): LevelConfig | null {
    const { colorCount, obstacleCount, scrambleMoves, allowedShapes } = difficulty;
    const shuffledColors = shuffle([...BLOCK_COLORS], rng);
    const blockColors = shuffledColors.slice(0, colorCount);
    const obstacleColors = shuffledColors.slice(colorCount, colorCount + obstacleCount);

    const blockShapes: BlockShape[] = [];
    for (let i = 0; i < colorCount; i++) {
      blockShapes.push(allowedShapes[rng.unsafeUniformIntDistributionInternal(allowedShapes.length)]);
    }

    const obstacleShapes: BlockShape[] = [];
    const simpleShapes = allowedShapes.filter(s => ['DOT', 'I2_H', 'I2_V', 'I3_H', 'I3_V'].includes(s));
    const obstaclePool = simpleShapes.length > 0 ? simpleShapes : allowedShapes;
    for (let i = 0; i < obstacleCount; i++) {
      obstacleShapes.push(obstaclePool[rng.unsafeUniformIntDistributionInternal(obstaclePool.length)]);
    }

    const walls = assignWalls(colorCount, rng);
    const blocks: BlockPlacement[] = [];
    const docks: DockPlacement[] = [];
    const occupancy = new Map<string, string>();
    const wallUsed = new Map<WallSide, Set<number>>();
    for (const w of ALL_WALLS) wallUsed.set(w, new Set());

    for (let i = 0; i < colorCount; i++) {
      const color = blockColors[i], shape = blockShapes[i], wall = walls[i];
      const shapeDef = SHAPES[shape];
      const isH = wall === 'left' || wall === 'right';
      const perpSize = isH ? shapeDef.height : shapeDef.width;
      const maxPerpStart = gridSize - perpSize;

      const usedSet = wallUsed.get(wall)!;
      const perpStart = findPerpPosition(shape, maxPerpStart, isH, usedSet, rng);
      if (perpStart === -1) return null;

      computePerpIndices(shape, perpStart, isH).forEach(i => usedSet.add(i));
      const anchor = computeExitAnchor(wall, perpStart, shapeDef, gridSize, isH);
      const cells = getAbsCells(shape, anchor);
      if (cells.some(c => occupancy.has(posKey(c)))) return null;

      const blockId = `block_${color}`;
      blocks.push({ id: blockId, color, shape, position: anchor });
      cells.forEach(c => occupancy.set(posKey(c), blockId));

      const dockIndices = isH ? getOccRows(shape, anchor) : getOccCols(shape, anchor);
      docks.push({ id: `dock_${color}`, color, wall, wallIndices: dockIndices });
    }

    for (let i = 0; i < obstacleCount; i++) {
      const color = obstacleColors[i], shape = obstacleShapes[i], shapeDef = SHAPES[shape];
      let placed = false;
      for (let tries = 0; tries < 50; tries++) {
        const col = rng.unsafeUniformIntDistributionInternal(gridSize - shapeDef.width + 1);
        const row = rng.unsafeUniformIntDistributionInternal(gridSize - shapeDef.height + 1);
        const cells = getAbsCells(shape, { col, row });
        if (!cells.some(c => occupancy.has(posKey(c)))) {
          const blockId = `obstacle_${i}`;
          blocks.push({ id: blockId, color, shape, position: { col, row } });
          cells.forEach(c => occupancy.set(posKey(c), blockId));
          placed = true;
          break;
        }
      }
      if (!placed) return null;
    }

    // Scramble
    const scrambleConfig: LevelConfig = {
      id: 'scramble', blocks: blocks.map(b => ({ ...b, position: { ...b.position } })), docks: [], gridSize,
    };
    const scrambleSim = new MiniSim(scrambleConfig);
    const allIds = blocks.map(b => b.id);
    let effective = 0;
    for (let m = 0; m < scrambleMoves * 4 && effective < scrambleMoves; m++) {
      const result = scrambleSim.slideBlock(
        allIds[rng.unsafeUniformIntDistributionInternal(allIds.length)],
        DIRECTIONS[rng.unsafeUniformIntDistributionInternal(4)],
      );
      if (result.moved) effective++;
    }

    const scrambledBlocks: BlockPlacement[] = blocks.map(b => {
      const state = scrambleSim.getBlock(b.id)!;
      return { ...b, position: { ...state.position } };
    });

    const finalConfig: LevelConfig = { id: 'bench', blocks: scrambledBlocks, docks, gridSize };
    const solution = solve(finalConfig, solverMaxDepth);
    if (!solution.solvable || solution.optimalMoveCount < 2) return null;

    finalConfig.optimalMoves = solution.optimalMoveCount;
    return finalConfig;
  }

  export function generate(seed: number, difficulty: string): { success: boolean; optimalMoves: number } {
    const diff = DIFFICULTY_PRESETS[difficulty] || DIFFICULTY_PRESETS.easy;
    let rng = XoroShiro128Plus.fromSeed(seed);
    for (let attempt = 0; attempt < 20; attempt++) {
      const result = tryGenerate(rng, diff, 6, 40);
      if (result) return { success: true, optimalMoves: result.optimalMoves ?? 0 };
      rng.unsafeJump();
    }
    return { success: false, optimalMoves: 0 };
  }
}

// ============================================================================
// PASTED GENERATOR — Spec-Driven with anchors + dependents (self-contained)
// ============================================================================

namespace PastedGen {
  type PieceState = {
    id: string; shapeId: string; shape: boolean[][]; color: string;
    originX: number; originY: number;
  };
  type ExitState = { id: string; color: string; side: ExitSide; startIndex: number; size: number; };
  type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  type Difficulty = 'extra_easy' | 'easy' | 'medium' | 'hard' | 'extra_hard';

  // Shape definitions as boolean[][]
  const SHAPE_DEFS: Record<string, boolean[][]> = {
    DOT: [[true]],
    I2_H: [[true, true]],
    I2_V: [[true], [true]],
    I3_H: [[true, true, true]],
    I3_V: [[true], [true], [true]],
    L3_A: [[true, true], [true, false]],
    L3_B: [[true, false], [true, true]],
    L3_C: [[false, true], [true, true]],
    L3_D: [[true, true], [false, true]],
    O4: [[true, true], [true, true]],
  };

  function getShape(id: string): boolean[][] | undefined { return SHAPE_DEFS[id]; }
  function getShapeWidth(shape: boolean[][]): number { return shape[0]?.length ?? 0; }
  function getShapeHeight(shape: boolean[][]): number { return shape.length; }
  function getShapeCells(shape: boolean[][], ox: number, oy: number): { x: number; y: number }[] {
    const cells: { x: number; y: number }[] = [];
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c]) cells.push({ x: ox + c, y: oy + r });
    return cells;
  }
  function shapeWithinBounds(shape: boolean[][], ox: number, oy: number, gridSize: number): boolean {
    return ox >= 0 && oy >= 0 && ox + getShapeWidth(shape) <= gridSize && oy + getShapeHeight(shape) <= gridSize;
  }

  // GridState
  class GridState {
    gridSize: number;
    pieces: PieceState[];
    exits: ExitState[];
    constructor(gridSize: number, pieces: PieceState[], exits: ExitState[]) {
      this.gridSize = gridSize; this.pieces = pieces; this.exits = exits;
    }
    isWithinBounds(x: number, y: number): boolean {
      return x >= 0 && y >= 0 && x < this.gridSize && y < this.gridSize;
    }
    getPieceAt(x: number, y: number): PieceState | null {
      for (const p of this.pieces) {
        const cells = getShapeCells(p.shape, p.originX, p.originY);
        if (cells.some(c => c.x === x && c.y === y)) return p;
      }
      return null;
    }
  }

  const TETROMINOS = ['O4'];
  const TRIOMINOS = ['I3_H', 'I3_V', 'L3_A', 'L3_B', 'L3_C', 'L3_D'];
  const DOMINOES = ['I2_H', 'I2_V'];
  const DEPENDENT_SHAPES = ['DOT', 'I2_H', 'I2_V'] as const;

  function selectAnchorShapes(difficulty: Difficulty, count: number, random: SeededRandom): string[] {
    const shapes: string[] = [];
    switch (difficulty) {
      case 'extra_easy':
        shapes.push(random.pick(TETROMINOS));
        for (let i = 1; i < count; i++) shapes.push(random.pick([...DOMINOES, ...TRIOMINOS]));
        break;
      case 'easy':
        shapes.push(random.pick(TRIOMINOS));
        for (let i = 1; i < count; i++) shapes.push(random.pick([...DOMINOES, ...TRIOMINOS, ...TETROMINOS]));
        break;
      case 'medium': {
        let tc = 0, trc = 0;
        for (let i = 0; i < count; i++) {
          const avail = [...DOMINOES];
          if (tc < 1) avail.push(...TETROMINOS);
          if (trc < 2) avail.push(...TRIOMINOS);
          const s = random.pick(avail);
          shapes.push(s);
          if (TETROMINOS.includes(s)) tc++;
          if (TRIOMINOS.includes(s)) trc++;
        }
        break;
      }
      case 'hard': case 'extra_hard': {
        let trc = 0;
        for (let i = 0; i < count; i++) {
          const avail = [...DOMINOES];
          if (trc < 1) avail.push(...TRIOMINOS);
          const s = random.pick(avail);
          shapes.push(s);
          if (TRIOMINOS.includes(s)) trc++;
        }
        break;
      }
    }
    return random.shuffle(shapes);
  }

  function determineCounts(difficulty: Difficulty, random: SeededRandom): { anchors: number; dependents: number } {
    switch (difficulty) {
      case 'extra_easy': return { anchors: random.pick([2, 3]), dependents: 0 };
      case 'easy': return { anchors: 2, dependents: 1 };
      case 'medium': return { anchors: 3, dependents: 1 };
      case 'hard': return { anchors: 2, dependents: 3 };
      case 'extra_hard': return { anchors: 2, dependents: random.pick([3, 4]) };
    }
  }

  function assignCorners(random: SeededRandom, count: number): Corner[] {
    const all: Corner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
    if (count === 2) {
      return [random.pick(['top-left', 'bottom-left']), random.pick(['top-right', 'bottom-right'])];
    }
    return random.shuffle(all).slice(0, count);
  }

  function getCornerOrigin(shape: boolean[][], corner: Corner, gridSize: number): { originX: number; originY: number } {
    const w = getShapeWidth(shape), h = getShapeHeight(shape);
    switch (corner) {
      case 'top-left': return { originX: 0, originY: 0 };
      case 'top-right': return { originX: gridSize - w, originY: 0 };
      case 'bottom-left': return { originX: 0, originY: gridSize - h };
      case 'bottom-right': return { originX: gridSize - w, originY: gridSize - h };
    }
  }

  function canPlace(shape: boolean[][], ox: number, oy: number, state: GridState): boolean {
    if (!shapeWithinBounds(shape, ox, oy, state.gridSize)) return false;
    for (const c of getShapeCells(shape, ox, oy)) {
      if (state.getPieceAt(c.x, c.y)) return false;
    }
    return true;
  }

  function getDirectionVector(dir: Direction): { dx: number; dy: number } {
    switch (dir) {
      case 'up': return { dx: 0, dy: -1 }; case 'down': return { dx: 0, dy: 1 };
      case 'left': return { dx: -1, dy: 0 }; case 'right': return { dx: 1, dy: 0 };
    }
  }

  function slidePiece(piece: PieceState, dir: Direction, state: GridState): boolean {
    const { dx, dy } = getDirectionVector(dir);
    const sx = piece.originX, sy = piece.originY;
    while (true) {
      const nx = piece.originX + dx, ny = piece.originY + dy;
      const cells = getShapeCells(piece.shape, nx, ny);
      let blocked = false;
      for (const c of cells) {
        if (!state.isWithinBounds(c.x, c.y)) { blocked = true; break; }
        const occ = state.getPieceAt(c.x, c.y);
        if (occ && occ.id !== piece.id) { blocked = true; break; }
      }
      if (blocked) break;
      piece.originX = nx; piece.originY = ny;
    }
    return piece.originX !== sx || piece.originY !== sy;
  }

  function slidePieceRandomDist(piece: PieceState, dir: Direction, state: GridState, random: SeededRandom): boolean {
    const { dx, dy } = getDirectionVector(dir);
    const sx = piece.originX, sy = piece.originY;
    const valid: { x: number; y: number }[] = [];
    let tx = piece.originX, ty = piece.originY;
    while (true) {
      const nx = tx + dx, ny = ty + dy;
      const cells = getShapeCells(piece.shape, nx, ny);
      let blocked = false;
      for (const c of cells) {
        if (!state.isWithinBounds(c.x, c.y)) { blocked = true; break; }
        const occ = state.getPieceAt(c.x, c.y);
        if (occ && occ.id !== piece.id) { blocked = true; break; }
      }
      if (blocked) break;
      tx = nx; ty = ny;
      valid.push({ x: tx, y: ty });
    }
    if (valid.length === 0) return false;
    const chosen = random.pick(valid);
    piece.originX = chosen.x; piece.originY = chosen.y;
    return piece.originX !== sx || piece.originY !== sy;
  }

  function getOpposite(dir: Direction): Direction {
    switch (dir) { case 'up': return 'down'; case 'down': return 'up'; case 'left': return 'right'; case 'right': return 'left'; }
  }

  function chooseVertDir(piece: PieceState, gridSize: number, random: SeededRandom): Direction {
    const h = getShapeHeight(piece.shape);
    const dTop = piece.originY, dBot = gridSize - (piece.originY + h);
    if (dTop === dBot) return random.next() > 0.5 ? 'up' : 'down';
    return dTop > dBot ? 'up' : 'down';
  }

  function chooseHorizDir(piece: PieceState, gridSize: number, random: SeededRandom): Direction {
    const w = getShapeWidth(piece.shape);
    const dLeft = piece.originX, dRight = gridSize - (piece.originX + w);
    if (dLeft === dRight) return random.next() > 0.5 ? 'left' : 'right';
    return dLeft > dRight ? 'left' : 'right';
  }

  function pickCornerExitSide(shape: boolean[][], corner: Corner): ExitSide {
    const w = getShapeWidth(shape), h = getShapeHeight(shape);
    const pref = w < h ? ['top', 'bottom', 'left', 'right'] : h < w ? ['left', 'right', 'top', 'bottom'] : ['top', 'bottom', 'left', 'right'];
    const sides: ExitSide[] = corner === 'top-left' ? ['top', 'left'] : corner === 'top-right' ? ['top', 'right']
      : corner === 'bottom-left' ? ['bottom', 'left'] : ['bottom', 'right'];
    for (const s of pref) if (sides.includes(s as ExitSide)) return s as ExitSide;
    return sides[0];
  }

  function exitsOverlap(a: ExitState, b: { side: ExitSide; startIndex: number; size: number }): boolean {
    if (a.side !== b.side) return false;
    return !(a.startIndex + a.size - 1 < b.startIndex || b.startIndex + b.size - 1 < a.startIndex);
  }

  function isAligned(piece: PieceState, exit: ExitState): boolean {
    const w = getShapeWidth(piece.shape), h = getShapeHeight(piece.shape);
    if (exit.side === 'left' || exit.side === 'right') {
      return piece.originY === exit.startIndex && piece.originY + h - 1 === exit.startIndex + exit.size - 1;
    }
    return piece.originX === exit.startIndex && piece.originX + w - 1 === exit.startIndex + exit.size - 1;
  }

  function findAdjOrigins(shape: boolean[][], anchor: PieceState, state: GridState): { originX: number; originY: number }[] {
    const w = getShapeWidth(shape), h = getShapeHeight(shape);
    const results: { originX: number; originY: number }[] = [];
    for (let y = 0; y <= state.gridSize - h; y++) {
      for (let x = 0; x <= state.gridSize - w; x++) {
        if (!canPlace(shape, x, y, state)) continue;
        const cells = getShapeCells(shape, x, y);
        const aCells = getShapeCells(anchor.shape, anchor.originX, anchor.originY);
        if (cells.some(c => aCells.some(a => Math.abs(a.x - c.x) + Math.abs(a.y - c.y) === 1))) {
          results.push({ originX: x, originY: y });
        }
      }
    }
    return results;
  }

  function chooseExitForDep(piece: PieceState, state: GridState, random: SeededRandom): ExitState {
    const w = getShapeWidth(piece.shape), h = getShapeHeight(piece.shape);
    const allSides: ExitSide[] = random.shuffle(['top', 'bottom', 'left', 'right']);

    for (const side of allSides) {
      const { dx, dy } = getDirectionVector(side === 'top' ? 'up' : side === 'bottom' ? 'down' : side as Direction);
      const exitSize = side === 'top' || side === 'bottom' ? w : h;
      // Simulate slide
      let tx = piece.originX, ty = piece.originY;
      while (true) {
        const nx = tx + dx, ny = ty + dy;
        const cells = getShapeCells(piece.shape, nx, ny);
        let blocked = false;
        for (const c of cells) {
          if (!state.isWithinBounds(c.x, c.y)) { blocked = true; break; }
          const occ = state.getPieceAt(c.x, c.y);
          if (occ && occ.id !== piece.id) { blocked = true; break; }
        }
        if (blocked) break;
        tx = nx; ty = ny;
      }
      const hitsWall = (side === 'top' && ty === 0) || (side === 'bottom' && ty === state.gridSize - h)
        || (side === 'left' && tx === 0) || (side === 'right' && tx === state.gridSize - w);
      if (!hitsWall) continue;
      const si = side === 'top' || side === 'bottom' ? tx : ty;
      const cand = { side, startIndex: si, size: exitSize };
      if (!state.exits.some(e => exitsOverlap(e, cand))) {
        return { id: `exit_${piece.id}`, color: piece.color, ...cand };
      }
    }
    // Fallback
    return { id: `exit_${piece.id}`, color: piece.color, side: 'top', startIndex: 1, size: w };
  }

  function dirAwayFromExit(exitSide: ExitSide, axis: 'vertical' | 'horizontal'): Direction {
    if (axis === 'vertical') {
      if (exitSide === 'top') return 'down';
      if (exitSide === 'bottom') return 'up';
      return Math.random() > 0.5 ? 'up' : 'down';
    }
    if (exitSide === 'left') return 'right';
    if (exitSide === 'right') return 'left';
    return Math.random() > 0.5 ? 'left' : 'right';
  }

  export function generate(seed: number, difficulty: string): { success: boolean; pieceCount: number; exitCount: number } {
    const diffMap: Record<string, Difficulty> = {
      easy: 'easy', medium: 'medium', hard: 'hard',
      extra_easy: 'extra_easy', extra_hard: 'extra_hard',
    };
    const diff = diffMap[difficulty] || 'easy';
    const random = new SeededRandom(seed);
    const colors = ['sports', 'lifestyle', 'business', 'tech', 'health', 'politics'];
    const state = new GridState(6, [], []);
    const { anchors: anchorCount, dependents: depCount } = determineCounts(diff, random);
    const shuffledColors = random.shuffle([...colors]);
    let ci = 0;

    // Place anchors
    const corners = assignCorners(random, anchorCount);
    const anchorShapes = selectAnchorShapes(diff, anchorCount, random);
    const anchorPieces: PieceState[] = [];

    for (let i = 0; i < anchorCount; i++) {
      const shape = getShape(anchorShapes[i]) || [[true]];
      const color = shuffledColors[ci++ % shuffledColors.length];
      const origin = getCornerOrigin(shape, corners[i], 6);
      if (!canPlace(shape, origin.originX, origin.originY, state)) continue;
      const piece: PieceState = { id: `anchor_${i}`, shapeId: anchorShapes[i], shape, color, ...origin };
      state.pieces.push(piece);
      anchorPieces.push(piece);
      const side = pickCornerExitSide(shape, corners[i]);
      const exitDir = side === 'top' ? 'up' : side === 'bottom' ? 'down' : side as Direction;
      const perpW = exitDir === 'up' || exitDir === 'down' ? getShapeWidth(shape) : getShapeHeight(shape);
      const si = side === 'top' || side === 'bottom' ? origin.originX : origin.originY;
      state.exits.push({ id: `exit_anchor_${i}`, color, side, startIndex: si, size: perpW });
    }

    // Scramble anchors
    if (anchorPieces.length >= 1) {
      const moves: { piece: PieceState; axis: 'vertical' | 'horizontal' }[] = [];
      for (const p of anchorPieces) {
        moves.push({ piece: p, axis: 'vertical' });
        moves.push({ piece: p, axis: 'horizontal' });
      }
      for (const m of random.shuffle(moves)) {
        const dir = m.axis === 'vertical' ? chooseVertDir(m.piece, 6, random) : chooseHorizDir(m.piece, 6, random);
        if (!slidePieceRandomDist(m.piece, dir, state, random)) {
          slidePieceRandomDist(m.piece, getOpposite(dir), state, random);
        }
      }
    }

    // Break alignment
    for (const p of anchorPieces) {
      const ex = state.exits.find(e => e.color === p.color);
      if (ex && isAligned(p, ex)) {
        let pDir: Direction = (ex.side === 'left' || ex.side === 'right')
          ? (random.next() > 0.5 ? 'up' : 'down')
          : (random.next() > 0.5 ? 'left' : 'right');
        if (!slidePiece(p, pDir, state)) slidePiece(p, getOpposite(pDir), state);
      }
    }

    // Place dependents
    const depPieces: PieceState[] = [];
    for (let i = 0; i < depCount; i++) {
      const anchor = anchorPieces[anchorPieces.length === 2 ? i % 2 : i % anchorPieces.length];
      const color = shuffledColors[ci++ % shuffledColors.length];
      let shapeId = random.pick(DEPENDENT_SHAPES);
      let shape = getShape(shapeId) || [[true]];
      let origins = findAdjOrigins(shape, anchor, state);
      let att = 0;
      while (origins.length === 0 && att < 10) {
        shapeId = random.pick(DEPENDENT_SHAPES);
        shape = getShape(shapeId) || [[true]];
        origins = findAdjOrigins(shape, anchor, state);
        att++;
      }
      if (origins.length === 0) continue;
      const origin = random.pick(origins);
      const piece: PieceState = { id: `dep_${i}`, shapeId, shape, color, ...origin };
      state.pieces.push(piece);
      depPieces.push(piece);
      state.exits.push(chooseExitForDep(piece, state, random));
    }

    // Scramble dependents
    if (depPieces.length > 0) {
      const passes = diff === 'extra_hard' ? 3 : diff === 'hard' ? 2 : diff === 'medium' ? 2 : 1;
      for (let pass = 0; pass < passes; pass++) {
        const depMoves: { piece: PieceState; axis: 'vertical' | 'horizontal' }[] = [];
        for (const p of depPieces) {
          depMoves.push({ piece: p, axis: 'vertical' });
          depMoves.push({ piece: p, axis: 'horizontal' });
        }
        for (const m of random.shuffle(depMoves)) {
          const ex = state.exits.find(e => e.color === m.piece.color);
          const dir = dirAwayFromExit(ex?.side || 'top', m.axis);
          slidePiece(m.piece, dir, state);
        }
      }
      for (const p of depPieces) {
        const ex = state.exits.find(e => e.color === p.color);
        if (ex && isAligned(p, ex)) {
          let pDir: Direction = (ex.side === 'left' || ex.side === 'right')
            ? (random.next() > 0.5 ? 'up' : 'down')
            : (random.next() > 0.5 ? 'left' : 'right');
          if (!slidePiece(p, pDir, state)) slidePiece(p, getOpposite(pDir), state);
        }
      }
    }

    return { success: state.pieces.length > 0, pieceCount: state.pieces.length, exitCount: state.exits.length };
  }
}

// ============================================================================
// BENCHMARK RUNNER
// ============================================================================

interface Stats {
  total: number;
  successes: number;
  failures: number;
  totalTimeMs: number;
  moveDistribution: Map<number, number>;
}

function runBenchmark() {
  console.log(`\n========================================`);
  console.log(`  LEVEL GENERATOR BENCHMARK — ${TOTAL.toLocaleString()} runs each`);
  console.log(`========================================\n`);

  const difficulties = ['easy', 'medium', 'hard'];

  for (const diff of difficulties) {
    console.log(`\n--- Difficulty: ${diff.toUpperCase()} ---\n`);

    // Existing generator
    const existingStats: Stats = { total: TOTAL, successes: 0, failures: 0, totalTimeMs: 0, moveDistribution: new Map() };
    let existingStart = performance.now();

    for (let i = 0; i < TOTAL; i++) {
      const result = ExistingGen.generate(i + 1, diff);
      if (result.success) {
        existingStats.successes++;
        const moves = result.optimalMoves;
        existingStats.moveDistribution.set(moves, (existingStats.moveDistribution.get(moves) || 0) + 1);
      } else {
        existingStats.failures++;
      }
      if ((i + 1) % REPORT_EVERY === 0) {
        const elapsed = ((performance.now() - existingStart) / 1000).toFixed(1);
        const pct = (((i + 1) / TOTAL) * 100).toFixed(0);
        process.stdout.write(`\r  [Existing/${diff}] ${pct}% (${elapsed}s)`);
      }
    }
    existingStats.totalTimeMs = performance.now() - existingStart;
    process.stdout.write('\r' + ' '.repeat(60) + '\r');

    // Pasted generator
    const pastedStats: Stats = { total: TOTAL, successes: 0, failures: 0, totalTimeMs: 0, moveDistribution: new Map() };
    let pastedStart = performance.now();

    for (let i = 0; i < TOTAL; i++) {
      const result = PastedGen.generate(i + 1, diff);
      if (result.success) {
        pastedStats.successes++;
        // Track piece count distribution instead of moves (no solver)
        const pc = result.pieceCount;
        pastedStats.moveDistribution.set(pc, (pastedStats.moveDistribution.get(pc) || 0) + 1);
      } else {
        pastedStats.failures++;
      }
      if ((i + 1) % REPORT_EVERY === 0) {
        const elapsed = ((performance.now() - pastedStart) / 1000).toFixed(1);
        const pct = (((i + 1) / TOTAL) * 100).toFixed(0);
        process.stdout.write(`\r  [Pasted/${diff}] ${pct}% (${elapsed}s)`);
      }
    }
    pastedStats.totalTimeMs = performance.now() - pastedStart;
    process.stdout.write('\r' + ' '.repeat(60) + '\r');

    // Print results
    const existingRate = ((existingStats.successes / TOTAL) * 100).toFixed(2);
    const pastedRate = ((pastedStats.successes / TOTAL) * 100).toFixed(2);
    const existingAvg = (existingStats.totalTimeMs / TOTAL).toFixed(4);
    const pastedAvg = (pastedStats.totalTimeMs / TOTAL).toFixed(4);

    console.log(`  EXISTING (backward gen + BFS solver):`);
    console.log(`    Success rate:  ${existingRate}% (${existingStats.successes.toLocaleString()} / ${TOTAL.toLocaleString()})`);
    console.log(`    Total time:    ${(existingStats.totalTimeMs / 1000).toFixed(2)}s`);
    console.log(`    Avg per level: ${existingAvg}ms`);
    if (existingStats.moveDistribution.size > 0) {
      const sorted = [...existingStats.moveDistribution.entries()].sort((a, b) => a[0] - b[0]);
      const moveSummary = sorted.map(([m, c]) => `${m}mv:${c}`).join(' ');
      console.log(`    Optimal moves: ${moveSummary}`);
      const totalMoves = sorted.reduce((s, [m, c]) => s + m * c, 0);
      console.log(`    Avg optimal:   ${(totalMoves / existingStats.successes).toFixed(1)} moves`);
    }

    console.log();
    console.log(`  PASTED (spec-driven anchors + dependents):`);
    console.log(`    Success rate:  ${pastedRate}% (${pastedStats.successes.toLocaleString()} / ${TOTAL.toLocaleString()})`);
    console.log(`    Total time:    ${(pastedStats.totalTimeMs / 1000).toFixed(2)}s`);
    console.log(`    Avg per level: ${pastedAvg}ms`);
    if (pastedStats.moveDistribution.size > 0) {
      const sorted = [...pastedStats.moveDistribution.entries()].sort((a, b) => a[0] - b[0]);
      const pieceSummary = sorted.map(([p, c]) => `${p}pcs:${c}`).join(' ');
      console.log(`    Piece counts:  ${pieceSummary}`);
    }

    console.log();
    const speedRatio = (existingStats.totalTimeMs / pastedStats.totalTimeMs).toFixed(1);
    console.log(`    Speed: Pasted is ${speedRatio}x ${existingStats.totalTimeMs > pastedStats.totalTimeMs ? 'faster' : 'slower'} than Existing`);
  }

  console.log(`\n========================================`);
  console.log(`  BENCHMARK COMPLETE`);
  console.log(`========================================\n`);
}

runBenchmark();
