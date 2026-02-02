import { LevelGenerator, type Level as GeneratorLevel, type Point } from '../core/LevelGenerator/LevelGenerator';
import type { LevelConfig, RoadTilePlacement, RoadTileType, LandmarkPlacement, LandmarkType } from '../types';
import type { Edge } from '../types/grid';
import type { GeneratorConfig } from '~/game/tuning';

/**
 * Service for generating procedural levels using LevelGenerator
 * and converting them to the game's LevelConfig format.
 */
export class LevelGenerationService {
  /**
   * Generate a new random level
   * @param levelNumber - Level number (1-based)
   * @param config - Generator configuration
   * @param seed - Optional seed for reproducible generation
   */
  static generateLevel(levelNumber: number, config: GeneratorConfig, seed?: number): LevelConfig {
    const effectiveSeed = seed ?? (Date.now() ^ (Math.random() * 0x100000000));

    const generator = new LevelGenerator({
      seed: effectiveSeed,
      width: config.width,
      height: config.height,
      exitPoints: config.exitPoints,
      pointsSpacing: config.pointsSpacing,
      distanceFormula: 'euclideanDistance',
      sidePushRadius: config.sidePushRadius,
      sidePushFactor: config.sidePushFactor,
    });

    // Generate base level
    const level = generator.generate();

    // Add complexity (wriggling) - repeat based on config.wrigglePasses
    const wriggleConfig = {
      wriggleFactor: config.wriggleFactor,
      wriggleDistanceMagnifier: config.wriggleDistanceMagnifier,
      wriggleExtent: config.wriggleExtent,
      wriggleExtentChaosFactor: config.wriggleExtentChaosFactor,
    };
    const wrigglePasses = Array(config.wrigglePasses).fill(wriggleConfig);
    const complexLevel = generator.addComplexityMultiple(level, wrigglePasses);

    // Convert to game format (scrambling will be done during conversion)
    const gameLevel = this.convertGeneratorLevel(complexLevel, levelNumber, effectiveSeed);

    // Log ASCII visualization
    this.logLevelVisualization(complexLevel, gameLevel);

    return gameLevel;
  }

  /**
   * Convert LevelGenerator output to game's LevelConfig format
   */
  private static convertGeneratorLevel(
    generatorLevel: GeneratorLevel,
    levelNumber: number,
    seed: number
  ): LevelConfig {
    const { entryPoint, exitPoints, paths } = generatorLevel;
    const gridSize = generatorLevel.grid.length as 4 | 5 | 6;

    // Extract all road tile points from paths (excluding entry/exits)
    const roadPoints = new Set<string>();
    const connectionMap = new Map<string, Point[]>();

    paths.forEach((path) => {
      if (!path) return;

      path.forEach((point, index) => {
        const key = `${point.x},${point.y}`;

        // Track connections for this point
        if (!connectionMap.has(key)) {
          connectionMap.set(key, []);
        }

        // Add neighbors (previous and next points in path)
        if (index > 0) {
          connectionMap.get(key)!.push(path[index - 1]);
        }
        if (index < path.length - 1) {
          connectionMap.get(key)!.push(path[index + 1]);
        }

        // Skip entry point (it's an exit marker in our game)
        const isEntry = point.x === entryPoint.x && point.y === entryPoint.y;
        const isExit = exitPoints.some(exit => exit.x === point.x && exit.y === point.y);

        if (!isEntry && !isExit) {
          roadPoints.add(key);
        }
      });
    });

    // Use generator's exitPoints as landmarks (per GDD design)
    const landmarks = this.createLandmarksFromExitPoints(exitPoints, connectionMap, seed);
    const landmarkPositions = new Set(landmarks.map((lm) => `${lm.position.x},${lm.position.y}`));

    // Convert road points to tiles (excluding landmark positions)
    const roadTiles: RoadTilePlacement[] = [];

    roadPoints.forEach((pointKey) => {
      // Skip if this position has a landmark
      if (landmarkPositions.has(pointKey)) return;

      const [x, y] = pointKey.split(',').map(Number);
      const point = { x, y };
      const connections = connectionMap.get(pointKey) || [];

      // Get unique connections
      const uniqueConnections = this.getUniqueConnections(point, connections);

      // Infer tile type and rotation from connections
      const [tileType, solutionRotation] = this.inferTileTypeAndRotation(point, uniqueConnections);

      // Scramble rotation (100% - all tiles start with random rotation)
      const initialRotation = Math.floor(this.seededRandom(seed + x * 1000 + y * 10) * 4);

      roadTiles.push({
        type: tileType,
        x,
        y,
        solutionRotation,
        initialRotation,
      });
    });

    // Convert entry point to exit (with all connected edges)
    const entryKey = `${entryPoint.x},${entryPoint.y}`;
    const entryConnections = connectionMap.get(entryKey) || [];
    const entryConnectableEdges = this.getConnectedEdges(entryPoint, entryConnections);

    // Fallback to first connection direction if we can't determine edges
    const entryFacingEdge = entryConnectableEdges.length > 0
      ? entryConnectableEdges[0]
      : this.determineEntryFacing(entryPoint, connectionMap);

    return {
      levelNumber,
      gridSize,
      county: 'atlantic', // TODO: Randomize based on level
      clue: `Level ${levelNumber} clue`, // TODO: Generate story clues
      landmarks,
      exits: [
        {
          position: entryPoint,
          facingEdge: entryFacingEdge,
          connectableEdges: entryConnectableEdges.length > 0 ? entryConnectableEdges : undefined,
        },
      ],
      roadTiles,
    };
  }

  /**
   * Create landmarks from generator's exit points (per GDD design)
   * The generator already placed these strategically on the grid
   */
  private static createLandmarksFromExitPoints(
    exitPoints: Point[],
    connectionMap: Map<string, Point[]>,
    seed: number
  ): LandmarkPlacement[] {
    const landmarks: LandmarkPlacement[] = [];
    const landmarkTypes: LandmarkType[] = ['diner', 'gas_station', 'house', 'market', 'school'];

    exitPoints.forEach((exitPoint, index) => {
      // Cycle through landmark types
      const typeIndex = index % landmarkTypes.length;
      const landmarkType = landmarkTypes[typeIndex];

      // Calculate connectable edges based on path connections
      const key = `${exitPoint.x},${exitPoint.y}`;
      const connections = connectionMap.get(key) || [];
      const connectableEdges = this.getConnectedEdges(exitPoint, connections);

      landmarks.push({
        type: landmarkType,
        position: exitPoint,
        connectableEdges: connectableEdges.length > 0 ? connectableEdges : ['north', 'east', 'south', 'west'],
      });
    });

    return landmarks;
  }

  /**
   * Get unique connections (remove duplicates)
   */
  private static getUniqueConnections(point: Point, connections: Point[]): Point[] {
    const seen = new Set<string>();
    return connections.filter((conn) => {
      const key = `${conn.x},${conn.y}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Infer tile type and rotation from connections
   * Returns [type, rotation]
   */
  private static inferTileTypeAndRotation(point: Point, connections: Point[]): [RoadTileType, number] {
    if (connections.length === 0) return ['straight', 0];

    // Get which edges have connections
    const edges = this.getConnectedEdges(point, connections);
    const edgeSet = new Set(edges);

    // Determine tile type based on connection count
    if (edges.length === 2) {
      // Check if it's a straight or corner
      const isStraight =
        (edgeSet.has('north') && edgeSet.has('south')) ||
        (edgeSet.has('east') && edgeSet.has('west'));

      if (isStraight) {
        // Straight tile
        const rotation = edgeSet.has('north') && edgeSet.has('south') ? 0 : 1;
        return ['straight', rotation];
      } else {
        // Corner tile - determine rotation by which edges connect
        const rotation = this.getCornerRotation(edgeSet);
        return ['corner', rotation];
      }
    } else if (edges.length === 3) {
      // T-junction tile
      const rotation = this.getTJunctionRotation(edgeSet);
      return ['t_junction', rotation];
    } else {
      // Fallback for unusual cases
      return ['straight', 0];
    }
  }

  /**
   * Get corner rotation based on connected edges
   * Base: north + east = 0 (top-right corner)
   */
  private static getCornerRotation(edges: Set<Edge>): number {
    if (edges.has('north') && edges.has('east')) return 0; // Top-right
    if (edges.has('south') && edges.has('east')) return 1; // Bottom-right
    if (edges.has('south') && edges.has('west')) return 2; // Bottom-left
    if (edges.has('north') && edges.has('west')) return 3; // Top-left
    return 0;
  }

  /**
   * Get T-junction rotation based on connected edges
   * Base: north + east + south = 0 (T facing right)
   */
  private static getTJunctionRotation(edges: Set<Edge>): number {
    if (edges.has('north') && edges.has('east') && edges.has('south')) return 0; // Facing right
    if (edges.has('south') && edges.has('west') && edges.has('east')) return 1; // Facing down
    if (edges.has('south') && edges.has('west') && edges.has('north')) return 2; // Facing left
    if (edges.has('north') && edges.has('east') && edges.has('west')) return 3; // Facing up
    return 0;
  }

  /**
   * Get which edges (north/south/east/west) have connections
   */
  private static getConnectedEdges(point: Point, connections: Point[]): Edge[] {
    const edges: Edge[] = [];

    connections.forEach((conn) => {
      const dx = conn.x - point.x;
      const dy = conn.y - point.y;

      if (dy < 0) edges.push('north');
      if (dy > 0) edges.push('south');
      if (dx > 0) edges.push('east');
      if (dx < 0) edges.push('west');
    });

    return edges;
  }

  /**
   * Determine which edge the entry point faces into the grid
   */
  private static determineEntryFacing(entryPoint: Point, connectionMap: Map<string, Point[]>): Edge {
    const key = `${entryPoint.x},${entryPoint.y}`;
    const connections = connectionMap.get(key) || [];

    if (connections.length === 0) return 'south'; // Default

    // Entry faces the direction of its first connection
    const firstConn = connections[0];
    const dx = firstConn.x - entryPoint.x;
    const dy = firstConn.y - entryPoint.y;

    if (dy > 0) return 'south';
    if (dy < 0) return 'north';
    if (dx > 0) return 'east';
    if (dx < 0) return 'west';

    return 'south'; // Fallback
  }

  /**
   * Simple seeded random number generator (0 to 1)
   */
  private static seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Log ASCII visualization of the generated level
   */
  private static logLevelVisualization(generatorLevel: GeneratorLevel, gameLevel: LevelConfig): void {
    const { entryPoint, exitPoints, paths } = generatorLevel;
    const gridSize = generatorLevel.grid.length;

    // Gather all path points
    const allPathPoints = new Set<string>();
    paths.forEach((path) => {
      if (path) path.forEach((p) => allPathPoints.add(`${p.x},${p.y}`));
    });

    // Gather all connections
    const chosenEdges = new Set<string>();
    paths.forEach((path) => {
      if (path) {
        for (let i = 0; i < path.length - 1; i++) {
          const p1 = path[i];
          const p2 = path[i + 1];
          const id = [`${p1.x},${p1.y}`, `${p2.x},${p2.y}`].sort().join('-');
          chosenEdges.add(id);
        }
      }
    });

    const getEdgeId = (p1: Point, p2: Point) => {
      return [`${p1.x},${p1.y}`, `${p2.x},${p2.y}`].sort().join('-');
    };

    console.log('='.repeat(80));
    console.log(`🎮 Generated Level ${gameLevel.levelNumber}`);
    console.log('='.repeat(80));

    const output: string[] = [];
    for (let y = 0; y < gridSize; y++) {
      let row = '';
      for (let x = 0; x < gridSize; x++) {
        let char = ' ';
        const currentPoint = { x, y };
        const currentId = `${x},${y}`;

        if (entryPoint.x === x && entryPoint.y === y) {
          char = 'E'; // Entry (exit marker)
        } else if (exitPoints.some((p) => p.x === x && p.y === y)) {
          char = 'X'; // Exit point
        } else if (gameLevel.landmarks.some((lm) => lm.position.x === x && lm.position.y === y)) {
          char = 'L'; // Landmark
        } else if (allPathPoints.has(currentId)) {
          // Render road segments
          const up = chosenEdges.has(getEdgeId(currentPoint, { x, y: y - 1 }));
          const down = chosenEdges.has(getEdgeId(currentPoint, { x, y: y + 1 }));
          const left = chosenEdges.has(getEdgeId(currentPoint, { x: x - 1, y }));
          const right = chosenEdges.has(getEdgeId(currentPoint, { x: x + 1, y }));

          if (up && down && !left && !right) char = '│';
          else if (!up && !down && left && right) char = '─';
          else if (down && right && !up && !left) char = '┌';
          else if (down && left && !up && !right) char = '┐';
          else if (up && right && !down && !left) char = '└';
          else if (up && left && !down && !right) char = '┘';
          else if (down && left && right && !up) char = '┬';
          else if (up && left && right && !down) char = '┴';
          else if (up && down && right && !left) char = '├';
          else if (up && down && left && !right) char = '┤';
          else if (up && down && left && right) char = '┼';
          else {
            if (up || down) char = '│';
            else if (left || right) char = '─';
            else char = '*';
          }
        }
        row += char;

        // Add horizontal connector
        if (x < gridSize - 1) {
          const nextPoint = { x: x + 1, y };
          if (chosenEdges.has(getEdgeId(currentPoint, nextPoint))) {
            row += '─';
          } else {
            row += ' ';
          }
        }
      }
      output.push(row);
    }

    output.forEach((line) => console.log(line));

    console.log('');
    console.log('Legend: E=Entry/Exit, L=Landmark, ─│┌┐└┘┬┴├┤┼=Roads');
    console.log(`Landmarks: ${gameLevel.landmarks.length} placed`);
    console.log(`Road Tiles: ${gameLevel.roadTiles.length} tiles`);
    console.log(`Scrambled: ~75% of tiles rotated randomly`);
    console.log('');
    console.log('Tile Details:');

    // Build connection map for debugging
    const debugConnectionMap = new Map<string, Point[]>();
    paths.forEach((path) => {
      if (!path) return;
      path.forEach((point, index) => {
        const key = `${point.x},${point.y}`;
        if (!debugConnectionMap.has(key)) {
          debugConnectionMap.set(key, []);
        }
        if (index > 0) {
          debugConnectionMap.get(key)!.push(path[index - 1]);
        }
        if (index < path.length - 1) {
          debugConnectionMap.get(key)!.push(path[index + 1]);
        }
      });
    });

    gameLevel.roadTiles.forEach((tile) => {
      const rotationDegrees = tile.solutionRotation * 90;
      const initialDegrees = tile.initialRotation * 90;
      const key = `${tile.x},${tile.y}`;
      const connections = debugConnectionMap.get(key) || [];
      const uniqueConnections = this.getUniqueConnections({ x: tile.x, y: tile.y }, connections);
      const edges = this.getConnectedEdges({ x: tile.x, y: tile.y }, uniqueConnections);

      // Get the ASCII character that was rendered for this position
      const up = chosenEdges.has(getEdgeId({ x: tile.x, y: tile.y }, { x: tile.x, y: tile.y - 1 }));
      const down = chosenEdges.has(getEdgeId({ x: tile.x, y: tile.y }, { x: tile.x, y: tile.y + 1 }));
      const left = chosenEdges.has(getEdgeId({ x: tile.x, y: tile.y }, { x: tile.x - 1, y: tile.y }));
      const right = chosenEdges.has(getEdgeId({ x: tile.x, y: tile.y }, { x: tile.x + 1, y: tile.y }));

      let asciiChar = '?';
      if (up && down && !left && !right) asciiChar = '│';
      else if (!up && !down && left && right) asciiChar = '─';
      else if (down && right && !up && !left) asciiChar = '┌';
      else if (down && left && !up && !right) asciiChar = '┐';
      else if (up && right && !down && !left) asciiChar = '└';
      else if (up && left && !down && !right) asciiChar = '┘';
      else if (down && left && right && !up) asciiChar = '┬';
      else if (up && left && right && !down) asciiChar = '┴';
      else if (up && down && right && !left) asciiChar = '├';
      else if (up && down && left && !right) asciiChar = '┤';
      else if (up && down && left && right) asciiChar = '┼';

      console.log(
        `  (${tile.x},${tile.y}): ${tile.type.padEnd(10)} ` +
        `solution=${rotationDegrees}° (state ${tile.solutionRotation}), ` +
        `initial=${initialDegrees}° (state ${tile.initialRotation}) ` +
        `ASCII='${asciiChar}'`
      );
      console.log(
        `    └─ connections=${uniqueConnections.length} ` +
        `[${uniqueConnections.map(c => `(${c.x},${c.y})`).join(', ')}], ` +
        `edges=[${edges.join(', ')}]`
      );
    });
    console.log('');
    console.log('Landmark Details:');
    gameLevel.landmarks.forEach((lm) => {
      console.log(
        `  (${lm.position.x},${lm.position.y}): ${lm.type.padEnd(12)} ` +
        `edges=[${lm.connectableEdges?.join(', ') || 'all'}]`
      );
    });
    console.log('='.repeat(80));
  }
}
