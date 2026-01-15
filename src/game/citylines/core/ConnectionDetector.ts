import type { Edge, GridPosition, GridSize } from '../types';
import { OPPOSITE_EDGE, getAdjacentPosition, isInBounds, posKey } from '../types';
import type { Landmark } from './Landmark';
import type { Exit } from './Exit';

/** Represents a tile's road connections for pathfinding */
export interface TileConnections {
  position: GridPosition;
  connectedEdges: Edge[];
}

/** Result of connection detection */
export interface ConnectionResult {
  connectedLandmarkIds: Set<number>;
  landmarkEdgeConnections: Map<number, Edge[]>;
}

/** Detects road connections from exits to landmarks using BFS */
export class ConnectionDetector {
  private gridSize: GridSize;
  private tileMap: Map<string, TileConnections> = new Map();

  constructor(gridSize: GridSize) {
    this.gridSize = gridSize;
  }

  /** Update a single tile's connections */
  updateTile(tile: TileConnections): void {
    this.tileMap.set(posKey(tile.position), tile);
  }

  /** Set all tiles at once */
  setAllTiles(tiles: TileConnections[]): void {
    this.tileMap.clear();
    for (const tile of tiles) {
      this.tileMap.set(posKey(tile.position), tile);
    }
  }

  /** Clear all tiles */
  clear(): void {
    this.tileMap.clear();
  }

  /**
   * Check if two adjacent tiles are connected via roads.
   * Tiles connect if both have road edges facing each other.
   */
  private areTilesConnected(
    tileA: TileConnections,
    tileB: TileConnections,
    edgeFromA: Edge
  ): boolean {
    const edgeFromB = OPPOSITE_EDGE[edgeFromA];
    return (
      tileA.connectedEdges.includes(edgeFromA) &&
      tileB.connectedEdges.includes(edgeFromB)
    );
  }

  /**
   * Run BFS from exits to find all connected landmarks.
   * Returns which landmarks are connected and via which edges.
   */
  detectConnections(
    exits: Exit[],
    landmarks: Landmark[]
  ): ConnectionResult {
    const connectedLandmarkIds = new Set<number>();
    const landmarkEdgeConnections = new Map<number, Edge[]>();

    // Initialize edge connections for all landmarks
    landmarks.forEach((_, index) => {
      landmarkEdgeConnections.set(index, []);
    });

    // Create position -> landmark index map
    const landmarkByPos = new Map<string, number>();
    landmarks.forEach((landmark, index) => {
      landmarkByPos.set(posKey(landmark.gridPosition), index);
    });

    // BFS from each exit
    const visited = new Set<string>();
    const queue: GridPosition[] = [];

    // Start from exit positions
    for (const exit of exits) {
      const exitKey = posKey(exit.gridPosition);
      if (!visited.has(exitKey)) {
        visited.add(exitKey);
        queue.push(exit.gridPosition);

        // Also add exit's tile to the tile map as a connection source
        // Exits connect on their facing edge
        this.tileMap.set(exitKey, {
          position: exit.gridPosition,
          connectedEdges: [exit.facingEdge],
        });
      }
    }

    while (queue.length > 0) {
      const currentPos = queue.shift()!;
      const currentKey = posKey(currentPos);
      const currentTile = this.tileMap.get(currentKey);

      if (!currentTile) continue;

      // Check each connected edge of current tile
      for (const edge of currentTile.connectedEdges) {
        const adjPos = getAdjacentPosition(currentPos, edge);

        if (!isInBounds(adjPos, this.gridSize)) continue;

        const adjKey = posKey(adjPos);
        const adjTile = this.tileMap.get(adjKey);

        // Check if adjacent is a landmark
        const landmarkIndex = landmarkByPos.get(adjKey);
        if (landmarkIndex !== undefined) {
          const landmark = landmarks[landmarkIndex];
          const connectingEdge = OPPOSITE_EDGE[edge];

          // Check if road connects to landmark's connectable edge
          if (landmark.connectableEdges.includes(connectingEdge)) {
            connectedLandmarkIds.add(landmarkIndex);
            const edges = landmarkEdgeConnections.get(landmarkIndex) || [];
            if (!edges.includes(connectingEdge)) {
              edges.push(connectingEdge);
              landmarkEdgeConnections.set(landmarkIndex, edges);
            }
          }
          continue; // Don't traverse through landmarks
        }

        if (!adjTile) continue;

        // Check if tiles are connected
        if (this.areTilesConnected(currentTile, adjTile, edge)) {
          if (!visited.has(adjKey)) {
            visited.add(adjKey);
            queue.push(adjPos);
          }
        }
      }
    }

    return { connectedLandmarkIds, landmarkEdgeConnections };
  }

  /**
   * Update landmarks' connection state based on detection.
   */
  updateLandmarks(exits: Exit[], landmarks: Landmark[]): void {
    const { connectedLandmarkIds, landmarkEdgeConnections } =
      this.detectConnections(exits, landmarks);

    landmarks.forEach((landmark, index) => {
      const isConnected = connectedLandmarkIds.has(index);
      const connectedEdges = landmarkEdgeConnections.get(index) || [];
      landmark.setConnected(connectedEdges, isConnected);
    });
  }

  /**
   * Get all tile keys that are connected to exits via BFS.
   * Used to determine which road tiles should show as "lit up".
   */
  getConnectedTileKeys(exits: Exit[]): Set<string> {
    const connected = new Set<string>();
    const visited = new Set<string>();
    const queue: GridPosition[] = [];

    // Start from exit positions
    for (const exit of exits) {
      const exitKey = posKey(exit.gridPosition);
      if (!visited.has(exitKey)) {
        visited.add(exitKey);
        queue.push(exit.gridPosition);

        // Ensure exit tile is in map
        this.tileMap.set(exitKey, {
          position: exit.gridPosition,
          connectedEdges: [exit.facingEdge],
        });
      }
    }

    while (queue.length > 0) {
      const currentPos = queue.shift()!;
      const currentKey = posKey(currentPos);
      const currentTile = this.tileMap.get(currentKey);

      if (!currentTile) continue;

      // Mark this tile as connected
      connected.add(currentKey);

      // Check each connected edge
      for (const edge of currentTile.connectedEdges) {
        const adjPos = getAdjacentPosition(currentPos, edge);

        if (!isInBounds(adjPos, this.gridSize)) continue;

        const adjKey = posKey(adjPos);
        const adjTile = this.tileMap.get(adjKey);

        if (!adjTile) continue;

        // Check if tiles are connected
        if (this.areTilesConnected(currentTile, adjTile, edge)) {
          if (!visited.has(adjKey)) {
            visited.add(adjKey);
            queue.push(adjPos);
          }
        }
      }
    }

    return connected;
  }
}
