/** Cardinal directions representing tile edges */
export type Edge = 'north' | 'east' | 'south' | 'west';

/** All edges as array for iteration */
export const EDGES: Edge[] = ['north', 'east', 'south', 'west'];

/** Map of opposite edges for adjacency checking */
export const OPPOSITE_EDGE: Record<Edge, Edge> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
};

/** Grid coordinate */
export interface GridPosition {
  row: number;
  col: number;
}

/** Grid size options per GDD */
export type GridSize = 4 | 5 | 6;

/** Get adjacent position for an edge */
export function getAdjacentPosition(pos: GridPosition, edge: Edge): GridPosition {
  switch (edge) {
    case 'north':
      return { row: pos.row - 1, col: pos.col };
    case 'south':
      return { row: pos.row + 1, col: pos.col };
    case 'east':
      return { row: pos.row, col: pos.col + 1 };
    case 'west':
      return { row: pos.row, col: pos.col - 1 };
  }
}

/** Check if position is within grid bounds */
export function isInBounds(pos: GridPosition, gridSize: GridSize): boolean {
  return pos.row >= 0 && pos.row < gridSize && pos.col >= 0 && pos.col < gridSize;
}

/** Generate position key for Map lookups */
export function posKey(pos: GridPosition): string {
  return `${pos.row},${pos.col}`;
}
