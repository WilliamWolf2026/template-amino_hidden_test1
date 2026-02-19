/** Cardinal movement direction */
export type Direction = 'up' | 'down' | 'left' | 'right';

/** Which side of the grid a dock/exit is on */
export type WallSide = 'top' | 'bottom' | 'left' | 'right';

/** Grid position (0-indexed, col = column, row = row, origin top-left) */
export interface GridPosition {
  col: number;
  row: number;
}

/** Direction vectors for movement */
export const DIR_VECTORS: Record<Direction, GridPosition> = {
  up: { col: 0, row: -1 },
  down: { col: 0, row: 1 },
  left: { col: -1, row: 0 },
  right: { col: 1, row: 0 },
};

/** Map direction to the wall it heads toward */
export const DIR_TO_WALL: Record<Direction, WallSide> = {
  up: 'top',
  down: 'bottom',
  left: 'left',
  right: 'right',
};

/** Opposite direction lookup */
export const OPPOSITE_DIR: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

/** Grid size (always 6×6 for Daily Dispatch) */
export const GRID_SIZE = 6;

/** Unique string key for a grid position */
export function posKey(pos: GridPosition): string {
  return `${pos.col},${pos.row}`;
}

/** Check if a position is within the grid bounds */
export function isInBounds(pos: GridPosition, size: number = GRID_SIZE): boolean {
  return pos.col >= 0 && pos.col < size && pos.row >= 0 && pos.row < size;
}
