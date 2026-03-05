/**
 * Daily Dispatch — Spec-Driven Level Generator
 *
 * Generates sliding block puzzles using intentional placement:
 * - Anchor blocks placed in grid corners with exits from their footprint
 * - Mandatory anchor scramble (vertical + horizontal per anchor)
 * - Dependent blocks placed touching anchors, each with its own exit
 * - Per-dependent scramble away from their exit
 * - Post-scramble alignment break ensures no piece can exit in one move
 *
 * Drop-in replacement for the backward-generation generator.
 * Same export signature: generatePuzzle(config) → LevelConfig | null
 */

import type { GridPosition, Direction, WallSide } from '../types/grid';
import type { BlockColor, BlockShape } from '../types/block';
import type { BlockPlacement } from '../types/block';
import type { DockPlacement } from '../types/dock';
import type { LevelConfig, DifficultySettings } from '../types/level';
import { GRID_SIZE } from '../types/grid';
import { BLOCK_COLORS } from '../types/block';

// ============================================================================
// Public interface (matches old generator)
// ============================================================================

export interface GeneratorConfig {
  difficulty: DifficultySettings;
  gridSize?: number;
  seed: number;
  levelId: string;
  maxRetries?: number;
  solverMaxDepth?: number; // ignored — kept for API compat
}

export function generatePuzzle(config: GeneratorConfig): LevelConfig | null {
  const { difficulty, seed, levelId, maxRetries = 20 } = config;
  const gridSize = config.gridSize ?? GRID_SIZE;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = tryGenerate(seed + attempt * 7919, difficulty, gridSize, levelId);
    if (result) return result;
  }

  return null;
}

// ============================================================================
// Internal types
// ============================================================================

type Difficulty = 'extra_easy' | 'easy' | 'medium' | 'hard' | 'extra_hard';
type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface PieceState {
  id: string;
  shapeId: string;
  shape: boolean[][];
  color: BlockColor;
  originX: number; // col
  originY: number; // row
}

interface ExitState {
  id: string;
  color: BlockColor;
  side: WallSide;
  startIndex: number;
  size: number;
}

// ============================================================================
// Shape definitions (boolean[][] internally, mapped to BlockShape for output)
// ============================================================================

const SHAPE_DEFS: Record<string, boolean[][]> = {
  DOT:  [[true]],
  I2_H: [[true, true]],
  I2_V: [[true], [true]],
  I3_H: [[true, true, true]],
  I3_V: [[true], [true], [true]],
  L3_A: [[true, true], [true, false]],
  L3_B: [[true, false], [true, true]],
  L3_C: [[false, true], [true, true]],
  L3_D: [[true, true], [false, true]],
  O4:   [[true, true], [true, true]],
};

/** Map internal shape IDs → game BlockShape names */
const SHAPE_ID_TO_BLOCK_SHAPE: Record<string, BlockShape> = {
  DOT:  'DOT',
  I2_H: 'I2_H',
  I2_V: 'I2_V',
  I3_H: 'I3_H',
  I3_V: 'I3_V',
  L3_A: 'L',
  L3_B: 'J',
  L3_C: 'L',
  L3_D: 'J',
  O4:   'O',
};

function shapeWidth(s: boolean[][]): number { return s[0]?.length ?? 0; }
function shapeHeight(s: boolean[][]): number { return s.length; }

function shapeCells(s: boolean[][], ox: number, oy: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let r = 0; r < s.length; r++)
    for (let c = 0; c < s[r].length; c++)
      if (s[r][c]) out.push({ x: ox + c, y: oy + r });
  return out;
}

function shapeInBounds(s: boolean[][], ox: number, oy: number, gridSize: number): boolean {
  return ox >= 0 && oy >= 0 && ox + shapeWidth(s) <= gridSize && oy + shapeHeight(s) <= gridSize;
}

// ============================================================================
// Shape categories by size
// ============================================================================

const TETROMINOS = ['O4'];
const TRIOMINOS = ['I3_H', 'I3_V', 'L3_A', 'L3_B', 'L3_C', 'L3_D'];
const DOMINOES  = ['I2_H', 'I2_V'];
const DEPENDENT_SHAPES = ['DOT', 'I2_H', 'I2_V'];

// ============================================================================
// Seeded RNG (LCG)
// ============================================================================

class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.nextInt(0, arr.length - 1)];
  }

  shuffle<T>(arr: readonly T[]): T[] {
    const clone = [...arr];
    for (let i = clone.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
  }
}

// ============================================================================
// Minimal grid state for collision detection during generation
// ============================================================================

class GridState {
  readonly gridSize: number;
  pieces: PieceState[] = [];
  exits: ExitState[] = [];

  constructor(gridSize: number) { this.gridSize = gridSize; }

  isWithinBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.gridSize && y < this.gridSize;
  }

  getPieceAt(x: number, y: number): PieceState | null {
    for (const p of this.pieces) {
      for (const c of shapeCells(p.shape, p.originX, p.originY)) {
        if (c.x === x && c.y === y) return p;
      }
    }
    return null;
  }
}

// ============================================================================
// Difficulty mapping
// ============================================================================

function mapDifficulty(settings: DifficultySettings): Difficulty {
  const { colorCount, obstacleCount } = settings;
  if (colorCount <= 2 && obstacleCount === 0) return 'easy';
  if (colorCount <= 3 && obstacleCount <= 1) return 'medium';
  return 'hard';
}

function determineCounts(diff: Difficulty, random: SeededRandom): { anchors: number; dependents: number } {
  switch (diff) {
    case 'extra_easy': return { anchors: random.pick([2, 3]), dependents: 0 };
    case 'easy':       return { anchors: 2, dependents: 1 };
    case 'medium':     return { anchors: 3, dependents: 1 };
    case 'hard':       return { anchors: 2, dependents: 3 };
    case 'extra_hard': return { anchors: 2, dependents: random.pick([3, 4]) };
  }
}

// ============================================================================
// Anchor shape selection based on difficulty
// ============================================================================

function selectAnchorShapes(diff: Difficulty, count: number, random: SeededRandom): string[] {
  const shapes: string[] = [];

  switch (diff) {
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
    case 'hard':
    case 'extra_hard': {
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

// ============================================================================
// Corner & exit helpers
// ============================================================================

function assignCorners(random: SeededRandom, count: number): Corner[] {
  const all: Corner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  if (count === 2) {
    return [random.pick(['top-left', 'bottom-left']), random.pick(['top-right', 'bottom-right'])];
  }
  return random.shuffle(all).slice(0, count);
}

function getCornerOrigin(shape: boolean[][], corner: Corner, gridSize: number): { originX: number; originY: number } {
  const w = shapeWidth(shape), h = shapeHeight(shape);
  switch (corner) {
    case 'top-left':     return { originX: 0, originY: 0 };
    case 'top-right':    return { originX: gridSize - w, originY: 0 };
    case 'bottom-left':  return { originX: 0, originY: gridSize - h };
    case 'bottom-right': return { originX: gridSize - w, originY: gridSize - h };
  }
}

function pickCornerExitSide(shape: boolean[][], corner: Corner): WallSide {
  const w = shapeWidth(shape), h = shapeHeight(shape);
  const pref: WallSide[] = w < h
    ? ['top', 'bottom', 'left', 'right']
    : h < w
      ? ['left', 'right', 'top', 'bottom']
      : ['top', 'bottom', 'left', 'right'];

  const sides: WallSide[] = corner === 'top-left' ? ['top', 'left']
    : corner === 'top-right' ? ['top', 'right']
    : corner === 'bottom-left' ? ['bottom', 'left']
    : ['bottom', 'right'];

  for (const s of pref) if (sides.includes(s)) return s;
  return sides[0];
}

// ============================================================================
// Placement & collision
// ============================================================================

function canPlace(shape: boolean[][], ox: number, oy: number, state: GridState): boolean {
  if (!shapeInBounds(shape, ox, oy, state.gridSize)) return false;
  for (const c of shapeCells(shape, ox, oy)) {
    if (state.getPieceAt(c.x, c.y)) return false;
  }
  return true;
}

// ============================================================================
// Sliding
// ============================================================================

function dirVector(dir: Direction): { dx: number; dy: number } {
  switch (dir) {
    case 'up':    return { dx: 0, dy: -1 };
    case 'down':  return { dx: 0, dy: 1 };
    case 'left':  return { dx: -1, dy: 0 };
    case 'right': return { dx: 1, dy: 0 };
  }
}

function opposite(dir: Direction): Direction {
  switch (dir) {
    case 'up': return 'down'; case 'down': return 'up';
    case 'left': return 'right'; case 'right': return 'left';
  }
}

/** Slide a piece as far as possible in a direction. Returns true if it moved. */
function slidePiece(piece: PieceState, dir: Direction, state: GridState): boolean {
  const { dx, dy } = dirVector(dir);
  const sx = piece.originX, sy = piece.originY;
  while (true) {
    const nx = piece.originX + dx, ny = piece.originY + dy;
    const cells = shapeCells(piece.shape, nx, ny);
    let blocked = false;
    for (const c of cells) {
      if (!state.isWithinBounds(c.x, c.y)) { blocked = true; break; }
      const occ = state.getPieceAt(c.x, c.y);
      if (occ && occ.id !== piece.id) { blocked = true; break; }
    }
    if (blocked) break;
    piece.originX = nx;
    piece.originY = ny;
  }
  return piece.originX !== sx || piece.originY !== sy;
}

/** Slide a piece a random distance (1 to max) in a direction. */
function slideRandom(piece: PieceState, dir: Direction, state: GridState, random: SeededRandom): boolean {
  const { dx, dy } = dirVector(dir);
  const sx = piece.originX, sy = piece.originY;
  const valid: { x: number; y: number }[] = [];
  let tx = piece.originX, ty = piece.originY;

  while (true) {
    const nx = tx + dx, ny = ty + dy;
    const cells = shapeCells(piece.shape, nx, ny);
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
  piece.originX = chosen.x;
  piece.originY = chosen.y;
  return piece.originX !== sx || piece.originY !== sy;
}

/** Simulate where a piece ends up sliding (without mutating). */
function simulateSlide(piece: PieceState, dir: Direction, state: GridState): { originX: number; originY: number } {
  const clone: PieceState = { ...piece, shape: piece.shape.map(r => [...r]) };
  slidePiece(clone, dir, state);
  return { originX: clone.originX, originY: clone.originY };
}

// ============================================================================
// Direction choosers
// ============================================================================

function chooseVertDir(piece: PieceState, gridSize: number, random: SeededRandom): Direction {
  const h = shapeHeight(piece.shape);
  const dTop = piece.originY, dBot = gridSize - (piece.originY + h);
  if (dTop === dBot) return random.next() > 0.5 ? 'up' : 'down';
  return dTop > dBot ? 'up' : 'down';
}

function chooseHorizDir(piece: PieceState, gridSize: number, random: SeededRandom): Direction {
  const w = shapeWidth(piece.shape);
  const dLeft = piece.originX, dRight = gridSize - (piece.originX + w);
  if (dLeft === dRight) return random.next() > 0.5 ? 'left' : 'right';
  return dLeft > dRight ? 'left' : 'right';
}

function dirAwayFromExit(exitSide: WallSide, axis: 'vertical' | 'horizontal', random: SeededRandom): Direction {
  if (axis === 'vertical') {
    if (exitSide === 'top') return 'down';
    if (exitSide === 'bottom') return 'up';
    return random.next() > 0.5 ? 'up' : 'down';
  }
  if (exitSide === 'left') return 'right';
  if (exitSide === 'right') return 'left';
  return random.next() > 0.5 ? 'left' : 'right';
}

// ============================================================================
// Alignment check
// ============================================================================

function isAligned(piece: PieceState, exit: ExitState): boolean {
  const w = shapeWidth(piece.shape), h = shapeHeight(piece.shape);
  if (exit.side === 'left' || exit.side === 'right') {
    return piece.originY === exit.startIndex && h === exit.size;
  }
  return piece.originX === exit.startIndex && w === exit.size;
}

// ============================================================================
// Exit overlap check
// ============================================================================

function exitsOverlap(a: ExitState, b: { side: WallSide; startIndex: number; size: number }): boolean {
  if (a.side !== b.side) return false;
  return !(a.startIndex + a.size - 1 < b.startIndex || b.startIndex + b.size - 1 < a.startIndex);
}

// ============================================================================
// Dependent placement helpers
// ============================================================================

function findAdjacentOrigins(shape: boolean[][], anchor: PieceState, state: GridState): { originX: number; originY: number }[] {
  const w = shapeWidth(shape), h = shapeHeight(shape);
  const cornerResults: { originX: number; originY: number }[] = [];
  const nonCornerResults: { originX: number; originY: number }[] = [];

  for (let y = 0; y <= state.gridSize - h; y++) {
    for (let x = 0; x <= state.gridSize - w; x++) {
      if (!canPlace(shape, x, y, state)) continue;
      const cells = shapeCells(shape, x, y);
      const aCells = shapeCells(anchor.shape, anchor.originX, anchor.originY);
      const touches = cells.some(c => aCells.some(a => Math.abs(a.x - c.x) + Math.abs(a.y - c.y) === 1));
      if (!touches) continue;

      const maxX = state.gridSize - w, maxY = state.gridSize - h;
      const nearEdgeX = x <= 1 || x >= maxX - 1;
      const nearEdgeY = y <= 1 || y >= maxY - 1;
      if (nearEdgeX && nearEdgeY) {
        cornerResults.push({ originX: x, originY: y });
      } else {
        nonCornerResults.push({ originX: x, originY: y });
      }
    }
  }

  return nonCornerResults.length > 0 ? nonCornerResults : cornerResults;
}

function isCornerExit(startIndex: number, size: number, gridSize: number): boolean {
  return startIndex === 0 || startIndex === gridSize - size;
}

function chooseExitForDep(piece: PieceState, state: GridState, random: SeededRandom): ExitState {
  const w = shapeWidth(piece.shape), h = shapeHeight(piece.shape);
  const allSides: WallSide[] = random.shuffle(['top', 'bottom', 'left', 'right']);

  type ExitOption = { side: WallSide; startIndex: number; size: number; isCorner: boolean };
  const validExits: ExitOption[] = [];

  for (const side of allSides) {
    const dir: Direction = side === 'top' ? 'up' : side === 'bottom' ? 'down' : side as Direction;
    const exitSize = side === 'top' || side === 'bottom' ? w : h;
    const dest = simulateSlide(piece, dir, state);

    const hitsWall =
      (dir === 'up' && dest.originY === 0) ||
      (dir === 'down' && dest.originY === state.gridSize - h) ||
      (dir === 'left' && dest.originX === 0) ||
      (dir === 'right' && dest.originX === state.gridSize - w);

    if (!hitsWall) continue;

    const si = side === 'top' || side === 'bottom' ? dest.originX : dest.originY;
    const cand = { side, startIndex: si, size: exitSize };
    if (state.exits.some(e => exitsOverlap(e, cand))) continue;

    validExits.push({ ...cand, isCorner: isCornerExit(si, exitSize, state.gridSize) });
  }

  const nonCorner = validExits.filter(e => !e.isCorner);
  const corner = validExits.filter(e => e.isCorner);
  const chosen = nonCorner.length > 0 ? random.pick(nonCorner) : corner.length > 0 ? random.pick(corner) : null;

  if (chosen) {
    return { id: `exit_${piece.id}`, color: piece.color, side: chosen.side, startIndex: chosen.startIndex, size: chosen.size };
  }

  // Fallback: find any non-overlapping exit
  for (const side of allSides) {
    const exitSize = side === 'top' || side === 'bottom' ? w : h;
    const maxStart = state.gridSize - exitSize;
    const middleIndices = Array.from({ length: maxStart + 1 }, (_, i) => i).filter(i => !isCornerExit(i, exitSize, state.gridSize));
    const cornerIndices = [0, maxStart].filter(i => i >= 0 && i <= maxStart);
    for (const si of [...random.shuffle(middleIndices), ...random.shuffle(cornerIndices)]) {
      const cand = { side, startIndex: si, size: exitSize };
      if (!state.exits.some(e => exitsOverlap(e, cand))) {
        return { id: `exit_${piece.id}`, color: piece.color, side, startIndex: si, size: exitSize };
      }
    }
  }

  return { id: `exit_${piece.id}`, color: piece.color, side: 'top', startIndex: 1, size: w };
}

// ============================================================================
// Output conversion: internal state → LevelConfig
// ============================================================================

function toBlockPlacement(piece: PieceState): BlockPlacement {
  const blockShape = SHAPE_ID_TO_BLOCK_SHAPE[piece.shapeId] ?? 'DOT';
  return {
    id: piece.id,
    color: piece.color,
    shape: blockShape,
    position: { col: piece.originX, row: piece.originY },
  };
}

function toDockPlacement(exit: ExitState): DockPlacement {
  const indices: number[] = [];
  for (let i = 0; i < exit.size; i++) {
    indices.push(exit.startIndex + i);
  }
  return {
    id: exit.id,
    color: exit.color,
    wall: exit.side,
    wallIndices: indices,
  };
}

// ============================================================================
// Core generation
// ============================================================================

function tryGenerate(
  seed: number,
  settings: DifficultySettings,
  gridSize: number,
  levelId: string,
): LevelConfig | null {
  const random = new SeededRandom(seed);
  const diff = mapDifficulty(settings);
  const state = new GridState(gridSize);

  const { anchors: anchorCount, dependents: depCount } = determineCounts(diff, random);
  const shuffledColors = random.shuffle([...BLOCK_COLORS]);
  let ci = 0;

  // ── Place anchors in corners ──
  const corners = assignCorners(random, anchorCount);
  const anchorShapeIds = selectAnchorShapes(diff, anchorCount, random);
  const anchorPieces: PieceState[] = [];

  for (let i = 0; i < anchorCount; i++) {
    const shapeId = anchorShapeIds[i];
    const shape = SHAPE_DEFS[shapeId];
    if (!shape) continue;

    const color = shuffledColors[ci++ % shuffledColors.length];
    const origin = getCornerOrigin(shape, corners[i], gridSize);

    if (!canPlace(shape, origin.originX, origin.originY, state)) continue;

    const piece: PieceState = {
      id: `block_${color}`,
      shapeId,
      shape,
      color,
      originX: origin.originX,
      originY: origin.originY,
    };
    state.pieces.push(piece);
    anchorPieces.push(piece);

    // Create exit from corner footprint
    const side = pickCornerExitSide(shape, corners[i]);
    const exitDir: Direction = side === 'top' ? 'up' : side === 'bottom' ? 'down' : side as Direction;
    const perpW = exitDir === 'up' || exitDir === 'down' ? shapeWidth(shape) : shapeHeight(shape);
    const si = side === 'top' || side === 'bottom' ? origin.originX : origin.originY;

    state.exits.push({ id: `dock_${color}`, color, side, startIndex: si, size: perpW });
  }

  // Need at least 2 anchors for a valid puzzle
  if (anchorPieces.length < 2) return null;

  // ── Scramble anchors (vertical + horizontal each, shuffled) ──
  const anchorMoves: { piece: PieceState; axis: 'vertical' | 'horizontal' }[] = [];
  for (const p of anchorPieces) {
    anchorMoves.push({ piece: p, axis: 'vertical' });
    anchorMoves.push({ piece: p, axis: 'horizontal' });
  }
  for (const m of random.shuffle(anchorMoves)) {
    const dir = m.axis === 'vertical'
      ? chooseVertDir(m.piece, gridSize, random)
      : chooseHorizDir(m.piece, gridSize, random);
    if (!slideRandom(m.piece, dir, state, random)) {
      slideRandom(m.piece, opposite(dir), state, random);
    }
  }

  // ── Break any anchor–exit alignment ──
  for (const p of anchorPieces) {
    const ex = state.exits.find(e => e.color === p.color);
    if (!ex || !isAligned(p, ex)) continue;
    let perpDir: Direction = (ex.side === 'left' || ex.side === 'right')
      ? (random.next() > 0.5 ? 'up' : 'down')
      : (random.next() > 0.5 ? 'left' : 'right');
    if (!slidePiece(p, perpDir, state)) {
      slidePiece(p, opposite(perpDir), state);
    }
  }

  // ── Place dependents adjacent to anchors ──
  const depPieces: PieceState[] = [];
  for (let i = 0; i < depCount; i++) {
    const anchor = anchorPieces[anchorPieces.length === 2 ? i % 2 : i % anchorPieces.length];
    const color = shuffledColors[ci++ % shuffledColors.length];

    let shapeId = random.pick(DEPENDENT_SHAPES);
    let shape = SHAPE_DEFS[shapeId] ?? SHAPE_DEFS.DOT;
    let origins = findAdjacentOrigins(shape, anchor, state);
    let att = 0;

    while (origins.length === 0 && att < 10) {
      shapeId = random.pick(DEPENDENT_SHAPES);
      shape = SHAPE_DEFS[shapeId] ?? SHAPE_DEFS.DOT;
      origins = findAdjacentOrigins(shape, anchor, state);
      att++;
    }
    if (origins.length === 0) continue;

    const origin = random.pick(origins);
    const piece: PieceState = {
      id: `block_${color}`,
      shapeId,
      shape,
      color,
      originX: origin.originX,
      originY: origin.originY,
    };
    state.pieces.push(piece);
    depPieces.push(piece);

    state.exits.push(chooseExitForDep(piece, state, random));
  }

  // ── Scramble dependents (more passes for harder difficulties) ──
  if (depPieces.length > 0) {
    const passes = diff === 'extra_hard' ? 3 : diff === 'hard' || diff === 'medium' ? 2 : 1;
    for (let pass = 0; pass < passes; pass++) {
      const depMoves: { piece: PieceState; axis: 'vertical' | 'horizontal' }[] = [];
      for (const p of depPieces) {
        depMoves.push({ piece: p, axis: 'vertical' });
        depMoves.push({ piece: p, axis: 'horizontal' });
      }
      for (const m of random.shuffle(depMoves)) {
        const ex = state.exits.find(e => e.color === m.piece.color);
        const dir = dirAwayFromExit(ex?.side ?? 'top', m.axis, random);
        slidePiece(m.piece, dir, state);
      }
    }

    // Break dependent–exit alignment
    for (const p of depPieces) {
      const ex = state.exits.find(e => e.color === p.color);
      if (!ex || !isAligned(p, ex)) continue;
      let perpDir: Direction = (ex.side === 'left' || ex.side === 'right')
        ? (random.next() > 0.5 ? 'up' : 'down')
        : (random.next() > 0.5 ? 'left' : 'right');
      if (!slidePiece(p, perpDir, state)) {
        slidePiece(p, opposite(perpDir), state);
      }
    }
  }

  // ── Convert to LevelConfig ──
  return {
    id: levelId,
    blocks: state.pieces.map(toBlockPlacement),
    docks: state.exits.map(toDockPlacement),
    gridSize,
  };
}
