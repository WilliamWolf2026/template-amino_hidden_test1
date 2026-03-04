import type { GridPosition, Direction, WallSide } from '../types/grid';
import type { BlockPlacement, BlockState } from '../types/block';
import type { DockPlacement, DockState } from '../types/dock';
import type { LevelConfig } from '../types/level';
import { DIR_VECTORS, DIR_TO_WALL, GRID_SIZE, posKey, isInBounds } from '../types/grid';
import { getAbsoluteCells, getOccupiedRows, getOccupiedCols } from '../data/shapes';

/** Result of a slide attempt */
export interface SlideResult {
  /** Whether the block actually moved (distance > 0 or exited) */
  moved: boolean;
  /** New anchor position (undefined if exited) */
  newPosition?: GridPosition;
  /** Number of cells moved */
  distance: number;
  /** Dock the block exited through (null if didn't exit) */
  exitedDock: DockState | null;
}

/**
 * Pure-logic sliding block grid simulation.
 * No Pixi dependency — operates entirely on grid cell coordinates.
 *
 * Manages a 6×6 occupancy grid, block states, dock states,
 * and the core slide + exit detection mechanics.
 */
export class GridSimulation {
  readonly gridSize: number;
  readonly blocks: Map<string, BlockState>;
  readonly docks: Map<string, DockState>;

  /** Occupancy grid: posKey → blockId (null = empty) */
  private occupancy: Map<string, string>;

  constructor(config: LevelConfig) {
    this.gridSize = config.gridSize || GRID_SIZE;
    this.blocks = new Map();
    this.docks = new Map();
    this.occupancy = new Map();

    // Initialize blocks
    for (const bp of config.blocks) {
      const state: BlockState = { ...bp, exited: false };
      this.blocks.set(bp.id, state);
      this.placeOnGrid(state);
    }

    // Initialize docks
    for (const dp of config.docks) {
      const state: DockState = { ...dp, closed: false };
      this.docks.set(dp.id, state);
    }
  }

  /**
   * Slide a block in the given direction.
   * The block moves until it hits a wall or another block.
   * If it reaches a wall with a matching dock, it exits the grid.
   */
  slideBlock(blockId: string, direction: Direction): SlideResult {
    const block = this.blocks.get(blockId);
    if (!block || block.exited) {
      return { moved: false, distance: 0, exitedDock: null };
    }

    const vec = DIR_VECTORS[direction];

    // Remove block from occupancy to avoid self-collision
    this.removeFromGrid(block);

    let currentPos = { ...block.position };
    let distance = 0;

    while (true) {
      const nextPos: GridPosition = {
        col: currentPos.col + vec.col,
        row: currentPos.row + vec.row,
      };

      // Compute absolute cells at next position
      const nextCells = getAbsoluteCells(block.shape, nextPos);

      // Check bounds: if any cell goes out of bounds, we've hit a wall
      const allInBounds = nextCells.every((c) => isInBounds(c, this.gridSize));

      if (!allInBounds) {
        // Hit a wall — check for matching dock exit
        const exitDock = this.checkExit(block, currentPos, direction);
        if (exitDock) {
          block.exited = true;
          block.position = currentPos;
          exitDock.closed = true;
          // Don't re-place on grid — block has exited
          return { moved: true, newPosition: currentPos, distance, exitedDock: exitDock };
        }
        // No exit — stop at wall
        break;
      }

      // Check occupancy: if any cell overlaps another block, stop
      const collision = nextCells.some((c) => this.occupancy.has(posKey(c)));
      if (collision) {
        break;
      }

      // Move to next position
      currentPos = nextPos;
      distance++;
    }

    // Place block at final position
    block.position = currentPos;
    this.placeOnGrid(block);

    return {
      moved: distance > 0,
      newPosition: currentPos,
      distance,
      exitedDock: null,
    };
  }

  /** Remove a block from the grid (eraser booster) */
  eraseBlock(blockId: string): boolean {
    const block = this.blocks.get(blockId);
    if (!block || block.exited) return false;

    this.removeFromGrid(block);
    block.exited = true;
    return true;
  }

  /** Check if the level is complete (all blocks with matching docks have exited) */
  isLevelComplete(): boolean {
    const dockColors = new Set<string>();
    for (const dock of this.docks.values()) {
      dockColors.add(dock.color);
    }

    for (const block of this.blocks.values()) {
      // Blocks that have a matching-color dock must be exited
      if (dockColors.has(block.color) && !block.exited) {
        return false;
      }
    }
    return true;
  }

  /** Get a block by ID */
  getBlock(blockId: string): BlockState | undefined {
    return this.blocks.get(blockId);
  }

  /** Get all non-exited blocks */
  getActiveBlocks(): BlockState[] {
    return [...this.blocks.values()].filter((b) => !b.exited);
  }

  /** Get all block states */
  getAllBlocks(): BlockState[] {
    return [...this.blocks.values()];
  }

  /** Get all dock states */
  getAllDocks(): DockState[] {
    return [...this.docks.values()];
  }

  /** Check if a specific cell is occupied */
  isOccupied(pos: GridPosition): boolean {
    return this.occupancy.has(posKey(pos));
  }

  /** Get the block ID at a specific cell (or undefined) */
  getBlockAt(pos: GridPosition): string | undefined {
    return this.occupancy.get(posKey(pos));
  }

  // ── Private helpers ──

  /** Check if a block at the given position can exit through a dock */
  private checkExit(block: BlockState, position: GridPosition, direction: Direction): DockState | null {
    const wall = DIR_TO_WALL[direction];

    // Get the block's perpendicular extent (rows for horizontal movement, cols for vertical)
    const perpIndices = this.getPerpendicularIndices(block, position, direction);

    for (const dock of this.docks.values()) {
      if (dock.wall !== wall) continue;
      if (dock.color !== block.color) continue;
      if (dock.closed) continue;

      // Check alignment: all perpendicular indices must be within the dock's wallIndices
      const dockSet = new Set(dock.wallIndices);
      const fits = perpIndices.every((i) => dockSet.has(i));
      if (fits) {
        return dock;
      }
    }

    return null;
  }

  /**
   * Get the perpendicular cell indices for a block in a given slide direction.
   * For horizontal movement (left/right): returns the row indices.
   * For vertical movement (up/down): returns the column indices.
   */
  private getPerpendicularIndices(block: BlockState, position: GridPosition, direction: Direction): number[] {
    if (direction === 'left' || direction === 'right') {
      return getOccupiedRows(block.shape, position);
    }
    return getOccupiedCols(block.shape, position);
  }

  /** Place a block's cells onto the occupancy grid */
  private placeOnGrid(block: BlockState): void {
    const cells = getAbsoluteCells(block.shape, block.position);
    for (const cell of cells) {
      this.occupancy.set(posKey(cell), block.id);
    }
  }

  /** Remove a block's cells from the occupancy grid */
  private removeFromGrid(block: BlockState): void {
    const cells = getAbsoluteCells(block.shape, block.position);
    for (const cell of cells) {
      this.occupancy.delete(posKey(cell));
    }
  }
}
