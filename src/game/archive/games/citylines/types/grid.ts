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

/** Grid coordinate (aligned with LevelGenerator format: x = column, y = row) */
export interface GridPosition {
  x: number;  // Column (0-based, left to right)
  y: number;  // Row (0-based, top to bottom)
}

/** Grid size options per GDD */
export type GridSize = 4 | 5 | 6;

/** Get adjacent position for an edge */
export function getAdjacentPosition(pos: GridPosition, edge: Edge): GridPosition {
  switch (edge) {
    case 'north':
      return { x: pos.x, y: pos.y - 1 };
    case 'south':
      return { x: pos.x, y: pos.y + 1 };
    case 'east':
      return { x: pos.x + 1, y: pos.y };
    case 'west':
      return { x: pos.x - 1, y: pos.y };
  }
}

/** Check if position is within grid bounds */
export function isInBounds(pos: GridPosition, gridSize: GridSize): boolean {
  return pos.y >= 0 && pos.y < gridSize && pos.x >= 0 && pos.x < gridSize;
}

/** Generate position key for Map lookups (matches LevelGenerator format) */
export function posKey(pos: GridPosition): string {
  return `${pos.x},${pos.y}`;
}
