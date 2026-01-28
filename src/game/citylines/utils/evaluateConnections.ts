/**
 * Pure, efficient connection evaluation for City Lines game.
 * 
 * Uses index-based representation and minimal allocations for performance.
 * Implements BFS from highway exits to determine which tiles and landmarks
 * are connected to the road network.
 * 
 * Performance characteristics:
 * - O(n) where n = grid cells (6x6 = 36 max)
 * - Minimal heap allocations (reusable queue, typed arrays)
 * - Index-based position representation (y * size + x)
 * - No object creation in hot path
 */

import type { Edge, GridPosition, GridSize, RoadTileType } from '../types';
import { EDGES } from '../types';

/** Tile data for connection evaluation */
export interface TileData {
  /** Tile type (straight, corner, t_junction) */
  type: RoadTileType;
  /** Current rotation state (0, 1, 2, 3) - aligned with generator */
  rotation: number;
  /** Grid position */
  position: GridPosition;
}

/** Landmark data for connection evaluation */
export interface LandmarkData {
  /** Landmark ID (index in landmarks array) */
  id: number;
  /** Grid position */
  position: GridPosition;
  /** Which edges can connect to roads */
  connectableEdges: readonly Edge[];
}

/** Highway exit data for connection evaluation */
export interface ExitData {
  /** Grid position */
  position: GridPosition;
  /** Which edge the exit faces (into the grid) */
  facingEdge: Edge;
  /** Which edges can connect to this exit (defaults to just facingEdge if not provided) */
  connectableEdges?: Edge[];
}

/** Result of connection evaluation */
export interface ConnectionResult {
  /** Set of tile indices that are connected to highway */
  connectedTiles: Set<number>;
  /** Set of landmark IDs that are connected to highway */
  connectedLandmarkIds: Set<number>;
  /** Whether the level is solved (all landmarks connected) */
  solved: boolean;
}

/** Tile with its distance from the exit (for paint animation) */
export interface TileWithDistance {
  /** Tile index (y * gridSize + x) */
  index: number;
  /** Grid position */
  position: GridPosition;
  /** Distance from exit (0 = exit tile, 1 = adjacent to exit, etc.) */
  distance: number;
}

/** Result of BFS traversal with distance info */
export interface TraversalResult {
  /** Tiles in BFS traversal order with distances */
  tilesInOrder: TileWithDistance[];
  /** Connected landmark IDs */
  connectedLandmarkIds: Set<number>;
  /** Whether level is solved */
  solved: boolean;
}

/**
 * Base connection edges for each tile type at rotation 0.
 * Matches the configuration in RoadTile.ts.
 */
const BASE_CONNECTIONS: Record<RoadTileType, readonly Edge[]> = {
  straight: ['north', 'south'],           // Vertical straight
  corner: ['north', 'east'],              // Top-right corner
  t_junction: ['north', 'east', 'south'], // T facing right
} as const;

/** Edge to direction offset mapping (dy, dx) where dy=vertical, dx=horizontal */
const EDGE_OFFSETS: Record<Edge, readonly [number, number]> = {
  north: [-1, 0],  // y decreases (move up)
  south: [1, 0],   // y increases (move down)
  east: [0, 1],    // x increases (move right)
  west: [0, -1],   // x decreases (move left)
} as const;

/** Opposite edges for adjacency checking */
const OPPOSITE_EDGE: Record<Edge, Edge> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
} as const;

/**
 * Rotate an edge by N 90-degree steps clockwise.
 * 
 * @param edge - Edge to rotate
 * @param steps - Number of 90-degree rotations (0-3)
 * @returns Rotated edge
 */
function rotateEdge(edge: Edge, steps: number): Edge {
  const index = EDGES.indexOf(edge);
  return EDGES[(index + steps) % 4];
}

/**
 * Get connected edges for a tile based on type and rotation state.
 *
 * @param type - Tile type
 * @param rotation - Rotation state (0, 1, 2, 3) - aligned with generator
 * @returns Array of connected edges
 */
function getTileEdges(type: RoadTileType, rotation: number): readonly Edge[] {
  const baseEdges = BASE_CONNECTIONS[type];

  if (rotation === 0) {
    return baseEdges;
  }

  return baseEdges.map(edge => rotateEdge(edge, rotation));
}

/**
 * Convert grid position to flat index.
 *
 * @param x - X coordinate (column)
 * @param y - Y coordinate (row)
 * @param gridSize - Grid size
 * @returns Flat index (y * gridSize + x)
 */
function positionToIndex(x: number, y: number, gridSize: GridSize): number {
  return y * gridSize + x;
}

/**
 * Convert flat index to grid position.
 *
 * @param index - Flat index
 * @param gridSize - Grid size
 * @returns Grid position
 */
function indexToPosition(index: number, gridSize: GridSize): GridPosition {
  return {
    x: index % gridSize,
    y: Math.floor(index / gridSize),
  };
}

/**
 * Check if position is within grid bounds.
 *
 * @param x - X coordinate (column)
 * @param y - Y coordinate (row)
 * @param gridSize - Grid size
 * @returns True if in bounds
 */
function isInBounds(x: number, y: number, gridSize: GridSize): boolean {
  return y >= 0 && y < gridSize && x >= 0 && x < gridSize;
}

/**
 * Dev-only invariant checking.
 * Validates input data consistency.
 */
function assertInvariants(
  gridSize: GridSize,
  tiles: readonly TileData[],
  landmarks: readonly LandmarkData[],
  exits: readonly ExitData[]
): void {
  if (!import.meta.env.DEV) return;
  
  // Check grid size is valid
  if (gridSize !== 4 && gridSize !== 5 && gridSize !== 6) {
    console.error(`[evaluateConnections] Invalid grid size: ${gridSize} (expected 4, 5, or 6)`);
  }
  
  // Check tile rotations are valid states
  for (const tile of tiles) {
    if (!Number.isInteger(tile.rotation) || tile.rotation < 0 || tile.rotation > 3) {
      console.error(
        `[evaluateConnections] Invalid rotation state: ${tile.rotation} at ` +
        `(${tile.position.x}, ${tile.position.y}) - must be 0, 1, 2, or 3`
      );
    }
  }
  
  // Check tile positions are in bounds
  for (const tile of tiles) {
    const { x, y } = tile.position;
    if (!isInBounds(x, y, gridSize)) {
      console.error(
        `[evaluateConnections] Tile position out of bounds: (${x}, ${y}) ` +
        `for grid size ${gridSize}`
      );
    }
  }
  
  // Check landmark positions are in bounds
  for (const landmark of landmarks) {
    const { x, y } = landmark.position;
    if (!isInBounds(x, y, gridSize)) {
      console.error(
        `[evaluateConnections] Landmark position out of bounds: (${x}, ${y}) ` +
        `for grid size ${gridSize}`
      );
    }
  }
  
  // Check landmark IDs are unique
  const landmarkIds = new Set<number>();
  for (const landmark of landmarks) {
    if (landmarkIds.has(landmark.id)) {
      console.error(
        `[evaluateConnections] Duplicate landmark ID: ${landmark.id} at ` +
        `(${landmark.position.x}, ${landmark.position.y})`
      );
    }
    landmarkIds.add(landmark.id);
  }
  
  // Check exit positions are in bounds
  for (const exit of exits) {
    const { x, y } = exit.position;
    if (!isInBounds(x, y, gridSize)) {
      console.error(
        `[evaluateConnections] Exit position out of bounds: (${x}, ${y}) ` +
        `for grid size ${gridSize}`
      );
    }
  }
  
  // Warn if no exits (impossible to solve)
  if (exits.length === 0) {
    console.warn('[evaluateConnections] No exits provided - level cannot be solved');
  }
  
  // Warn if no landmarks (trivially solved)
  if (landmarks.length === 0) {
    console.warn('[evaluateConnections] No landmarks provided - level trivially solved');
  }
}

/**
 * Evaluate which tiles and landmarks are connected to the highway network.
 * 
 * Uses BFS from highway exits to find all reachable tiles and landmarks.
 * Efficient implementation with minimal heap allocations.
 * 
 * @param gridSize - Grid size (4, 5, or 6)
 * @param tiles - Array of tile data
 * @param landmarks - Array of landmark data
 * @param exits - Array of highway exit data
 * @returns Connection evaluation result
 * 
 * @example
 * ```ts
 * const result = evaluateConnections(4, tiles, landmarks, exits);
 * console.log('Solved:', result.solved);
 * console.log('Connected tiles:', result.connectedTiles.size);
 * console.log('Connected landmarks:', result.connectedLandmarkIds.size);
 * ```
 */
export function evaluateConnections(
  gridSize: GridSize,
  tiles: readonly TileData[],
  landmarks: readonly LandmarkData[],
  exits: readonly ExitData[]
): ConnectionResult {
  // Dev-only invariant checking
  assertInvariants(gridSize, tiles, landmarks, exits);
  
  const maxCells = gridSize * gridSize;
  
  // Build index-based tile map for fast lookup
  // Array is faster than Map for small grids (max 36 cells)
  const tileEdgesByIndex = new Array<readonly Edge[] | null>(maxCells);
  for (const tile of tiles) {
    const index = positionToIndex(tile.position.x, tile.position.y, gridSize);
    tileEdgesByIndex[index] = getTileEdges(tile.type, tile.rotation);
  }
  
  // Build landmark lookup by index
  const landmarkByIndex = new Map<number, LandmarkData>();
  for (const landmark of landmarks) {
    const index = positionToIndex(landmark.position.x, landmark.position.y, gridSize);
    landmarkByIndex.set(index, landmark);
  }
  
  // Visited tracking (Uint8Array is memory-efficient for boolean flags)
  const visited = new Uint8Array(maxCells);
  
  // Results
  const connectedTiles = new Set<number>();
  const connectedLandmarkIds = new Set<number>();
  
  // BFS queue (preallocate, reuse)
  // Max size is grid size (worst case: all cells in queue)
  const queue = new Uint16Array(maxCells);
  let queueStart = 0;
  let queueEnd = 0;
  
  // Initialize queue with exit positions
  for (const exit of exits) {
    const exitIndex = positionToIndex(exit.position.x, exit.position.y, gridSize);

    if (visited[exitIndex]) continue;

    visited[exitIndex] = 1;
    queue[queueEnd++] = exitIndex;

    // Exits are considered part of the tile map
    // Use connectableEdges if provided, otherwise fall back to just facingEdge
    tileEdgesByIndex[exitIndex] = exit.connectableEdges ?? [exit.facingEdge];
  }
  
  // BFS traversal
  while (queueStart < queueEnd) {
    const currentIndex = queue[queueStart++];
    const currentEdges = tileEdgesByIndex[currentIndex];
    
    if (!currentEdges) continue;
    
    // Mark this tile as connected (unless it's an exit-only cell)
    if (tiles.some(t => positionToIndex(t.position.x, t.position.y, gridSize) === currentIndex)) {
      connectedTiles.add(currentIndex);
    }
    
    const currentPos = indexToPosition(currentIndex, gridSize);

    // Check each edge of current tile
    for (const edge of currentEdges) {
      const [dy, dx] = EDGE_OFFSETS[edge];
      const adjY = currentPos.y + dy;
      const adjX = currentPos.x + dx;

      if (!isInBounds(adjX, adjY, gridSize)) continue;

      const adjIndex = positionToIndex(adjX, adjY, gridSize);
      
      if (visited[adjIndex]) continue;
      
      // Check if adjacent cell is a landmark
      const landmark = landmarkByIndex.get(adjIndex);
      if (landmark) {
        // Check if landmark can connect from this edge
        const connectingEdge = OPPOSITE_EDGE[edge];
        if (landmark.connectableEdges.includes(connectingEdge)) {
          connectedLandmarkIds.add(landmark.id);
          visited[adjIndex] = 1;
        }
        // Don't traverse through landmarks
        continue;
      }
      
      // Check if adjacent cell has a tile
      const adjEdges = tileEdgesByIndex[adjIndex];
      if (!adjEdges) continue;
      
      // Check if tiles are connected (both have matching edges)
      const connectingEdge = OPPOSITE_EDGE[edge];
      if (adjEdges.includes(connectingEdge)) {
        visited[adjIndex] = 1;
        queue[queueEnd++] = adjIndex;
      }
    }
  }
  
  // Check if level is solved (all landmarks connected)
  const solved = landmarks.length > 0 && connectedLandmarkIds.size === landmarks.length;
  
  return {
    connectedTiles,
    connectedLandmarkIds,
    solved,
  };
}

/**
 * Helper: Check if a specific tile is connected.
 * 
 * @param result - Connection evaluation result
 * @param position - Tile position to check
 * @param gridSize - Grid size
 * @returns True if tile is connected
 */
export function isTileConnected(
  result: ConnectionResult,
  position: GridPosition,
  gridSize: GridSize
): boolean {
  const index = positionToIndex(position.x, position.y, gridSize);
  return result.connectedTiles.has(index);
}

/**
 * Helper: Check if a specific landmark is connected.
 *
 * @param result - Connection evaluation result
 * @param landmarkId - Landmark ID to check
 * @returns True if landmark is connected
 */
export function isLandmarkConnected(
  result: ConnectionResult,
  landmarkId: number
): boolean {
  return result.connectedLandmarkIds.has(landmarkId);
}

/**
 * Get connected tiles in BFS traversal order with distance from exit.
 * Used for the "paint" animation that flows from exit outward.
 *
 * @param gridSize - Size of grid (e.g., 4, 5, 6)
 * @param tiles - Array of tile data
 * @param landmarks - Array of landmark data
 * @param exits - Array of exit data
 * @returns Traversal result with tiles in BFS order
 */
export function getConnectedTilesInOrder(
  gridSize: GridSize,
  tiles: readonly TileData[],
  landmarks: readonly LandmarkData[],
  exits: readonly ExitData[]
): TraversalResult {
  const maxCells = gridSize * gridSize;

  // Build index-based tile map
  const tileEdgesByIndex = new Array<readonly Edge[] | null>(maxCells);
  const tilePositionsByIndex = new Map<number, GridPosition>();

  for (const tile of tiles) {
    const index = positionToIndex(tile.position.x, tile.position.y, gridSize);
    tileEdgesByIndex[index] = getTileEdges(tile.type, tile.rotation);
    tilePositionsByIndex.set(index, tile.position);
  }

  // Build landmark lookup
  const landmarkByIndex = new Map<number, LandmarkData>();
  for (const landmark of landmarks) {
    const index = positionToIndex(landmark.position.x, landmark.position.y, gridSize);
    landmarkByIndex.set(index, landmark);
  }

  // Track visited and distances
  const visited = new Uint8Array(maxCells);
  const distances = new Int16Array(maxCells).fill(-1);

  // Results
  const tilesInOrder: TileWithDistance[] = [];
  const connectedLandmarkIds = new Set<number>();

  // BFS queue with distance tracking
  const queue: Array<{ index: number; distance: number }> = [];

  // Initialize from exits
  for (const exit of exits) {
    const exitIndex = positionToIndex(exit.position.x, exit.position.y, gridSize);

    if (visited[exitIndex]) continue;

    visited[exitIndex] = 1;
    distances[exitIndex] = 0;
    queue.push({ index: exitIndex, distance: 0 });

    // Add exit tile edges
    tileEdgesByIndex[exitIndex] = exit.connectableEdges ?? [exit.facingEdge];
    tilePositionsByIndex.set(exitIndex, exit.position);

    // Exit tiles are distance 0 (starting point)
    tilesInOrder.push({
      index: exitIndex,
      position: exit.position,
      distance: 0,
    });
  }

  // BFS traversal
  while (queue.length > 0) {
    const { index: currentIndex, distance: currentDistance } = queue.shift()!;
    const currentPos = indexToPosition(currentIndex, gridSize);
    const currentEdges = tileEdgesByIndex[currentIndex];

    if (!currentEdges) continue;

    // Check each edge
    for (const edge of currentEdges) {
      const [dy, dx] = EDGE_OFFSETS[edge];
      const adjY = currentPos.y + dy;
      const adjX = currentPos.x + dx;

      if (!isInBounds(adjX, adjY, gridSize)) continue;

      const adjIndex = positionToIndex(adjX, adjY, gridSize);

      if (visited[adjIndex]) continue;

      // Check for landmark
      const landmark = landmarkByIndex.get(adjIndex);
      if (landmark) {
        const connectingEdge = OPPOSITE_EDGE[edge];
        if (landmark.connectableEdges.includes(connectingEdge)) {
          connectedLandmarkIds.add(landmark.id);
          visited[adjIndex] = 1;
        }
        continue; // Don't traverse through landmarks
      }

      // Check for connected tile
      const adjEdges = tileEdgesByIndex[adjIndex];
      if (!adjEdges) continue;

      const connectingEdge = OPPOSITE_EDGE[edge];
      if (adjEdges.includes(connectingEdge)) {
        visited[adjIndex] = 1;
        const newDistance = currentDistance + 1;
        distances[adjIndex] = newDistance;
        queue.push({ index: adjIndex, distance: newDistance });

        // Add to ordered results
        const adjPos = tilePositionsByIndex.get(adjIndex);
        if (adjPos) {
          tilesInOrder.push({
            index: adjIndex,
            position: adjPos,
            distance: newDistance,
          });
        }
      }
    }
  }

  const solved = landmarks.length > 0 && connectedLandmarkIds.size === landmarks.length;

  return {
    tilesInOrder,
    connectedLandmarkIds,
    solved,
  };
}
