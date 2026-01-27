import { Dijkstra, type Graph } from './Dijkstra';
import { XoroShiro128Plus } from '~/game/citylines/core/LevelGenerator/XoroShiro128Plus';

export type Point = {
  x: number;
  y: number;
};

const manhattanDistance = (p1: Point, p2: Point) =>
  Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
const euclideanDistance = (p1: Point, p2: Point) =>
  Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2));
const normalizeWithControl = (value: number, factor: number) =>
  value * Math.max(0, Math.min(1, factor));
const modifiedManhattanDistance = (
  p1: Point,
  p2: Point,
  diagonalMultiplier: number = 1
): number => {
  const dx = Math.abs(p1.x - p2.x);
  const dy = Math.abs(p1.y - p2.y);

  // Get the minimum and maximum differences
  const minDiff = Math.min(dx, dy);
  const maxDiff = Math.max(dx, dy);

  return minDiff * Math.SQRT2 * diagonalMultiplier + (maxDiff - minDiff);
};

// This helper function finds the starting index of a sub-array.
// Limitation: This is a basic implementation. It doesn't handle complex
// cases of overlapping segments, but it's sufficient for this generator's
// needs where slices are distinct.
const findSubArray = <T>(array: Array<T>, subArray: Array<T>) => {
  for (let i = 0; i <= array.length - subArray.length; i++) {
    let found = true;

    for (let j = 0; j < subArray.length; j++) {
      if (array[i + j] !== subArray[j]) {
        found = false;
        break;
      }
    }

    if (found) {
      return i;
    }
  }

  return -1;
};

// Helper functions to convert between Point objects and string representations.
// This is crucial because the Dijkstra implementation uses string keys for graph nodes.
// Using a consistent string format ("x,y") allows geometric points to be used
// as unique identifiers in the graph data structure.
const pointToString = (p: Point) => `${p.x},${p.y}`;
const stringToPoint = (s: string) => {
  const [x, y] = s.split(',').map(Number);
  return { x, y };
};

// Represents a single cell in the grid. In this generator, cells have a very
// simple state, primarily distinguishing between empty space and key points like
// the entry and exits. The actual road paths are stored separately.
type Cell = {
  type: 'empty' | 'entry' | 'exit';
};

// Represents the entire 2D grid of cells.
type Grid = Cell[][];

export type Level = {
  grid: Grid;
  entryPoint: Point;
  exitPoints: Point[];
  paths: (Point[] | null)[];
  rotationsMap?: number[][]; // New property for rotations
};

// Configuration object that defines the parameters for level generation.
export type LevelGeneratorConfig = {
  seed: number; // The seed for the PRNG for reproducibility.
  width: number; // Grid width.
  height: number; // Grid height.
  exitPoints: number; // The number of exits to generate.
  distanceFormula: 'manhattanDistance' | 'euclideanDistance';
  pointsSpacing: number;
  sidePushRadius: number;
  sidePushFactor: number;
};

export type ComplexityConfig = {
  wriggleFactor: number;
  wriggleDistanceMagnifier: number;
  wriggleExtent: number;
  wriggleExtentChaosFactor: number;
};

export type RotationConfig = {
  rotationFactor: number; // The percentage of road cells to rotate.
};

export class LevelGenerator {
  private readonly rng: XoroShiro128Plus;
  private readonly floatRngRange = 1000000;

  constructor(private readonly config: LevelGeneratorConfig) {
    this.validateConfig(config);

    this.rng = XoroShiro128Plus.fromSeed(config.seed);
    // Jump the PRNG state once. This is a good practice to ensure that different
    // instances of the generator created with the same seed but for different
    // purposes will produce different sequences of numbers.
    this.rng.unsafeJump();
  }

  private validateConfig(config: LevelGeneratorConfig) {
    const gridAvgDim = (config.width + config.height) / 2;
    const gridMaxDim = Math.max(config.width, config.height);

    if (config.pointsSpacing >= gridAvgDim) {
      throw new Error(`Invalid points spacing ${config.pointsSpacing}. Please make it lower than average of the grid dimensions (${gridAvgDim})`);
    }
    if (config.sidePushRadius > gridMaxDim / 2) {
      throw new Error(`Invalid side push radius ${config.sidePushRadius}. Please make it no more than half of biggest of the grid dimensions (${gridMaxDim / 2})`);
    }
  }

  private nextRandomInt(max: number): number {
    return this.rng.unsafeUniformIntDistributionInternal(max);
  }

  private nextRandomFloat(): number {
    return (
      this.rng.unsafeUniformIntDistributionInternal(this.floatRngRange) /
      this.floatRngRange
    );
  }

  generate() {
    const distance = this.config.distanceFormula === 'manhattanDistance'
      ? manhattanDistance
      : euclideanDistance;
    const grid: Grid = Array.from(
      { length: this.config.height },
      () => Array.from(
        { length: this.config.width },
        () => ({ type: 'empty' })
      ),
    );
    let generationError: string | null = null;

    // Create a list of all possible points on the grid. This list is used to
    // select random, unique locations for the entry and exit points.
    const allPoints: Point[] = [];

    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        allPoints.push({ x, y });
      }
    }

    let entryPointCandidates = allPoints;
    const center = { x: (this.config.width - 1) / 2, y: (this.config.height - 1) / 2 };

    // Push aside logic (for entry point)
    if (this.config.sidePushRadius && this.config.sidePushFactor && this.nextRandomFloat() < this.config.sidePushFactor) {
      const pushedCandidates = allPoints.filter(
        (p) => distance(p, center) >= this.config.sidePushRadius,
      );

      if (pushedCandidates.length > 0) {
        entryPointCandidates = pushedCandidates;
      }
    }

    const entryPointIndex = this.nextRandomInt(entryPointCandidates.length);
    const entryPoint = entryPointCandidates[entryPointIndex];
    const originalEntryPointIndex = allPoints.findIndex(
        (p) => p.x === entryPoint.x && p.y === entryPoint.y,
    );

    allPoints.splice(originalEntryPointIndex, 1);
    grid[entryPoint.y][entryPoint.x].type = 'entry';

    const exitPoints: Point[] = [];

    for (let i = 0; i < this.config.exitPoints; i++) {
      if (allPoints.length === 0) {
        break;
      }

      // To ensure a good layout, exits must satisfy two conditions:
      // - Not be too close to the entry point
      // - Not be too close to any other already placed exit
      let candidatePoints = allPoints.filter((p) => {
        if (distance(p, entryPoint) < this.config.pointsSpacing) {
          return false;
        }

        return exitPoints.every((ep) => distance(p, ep) >= this.config.pointsSpacing);
      });

      // Push aside logic (for exit points)
      if (this.config.sidePushRadius && this.config.sidePushFactor && this.nextRandomFloat() < this.config.sidePushFactor) {
        const pushedCandidates = candidatePoints.filter(
            (p) => distance(p, center) >= this.config.sidePushRadius,
        );

        if (pushedCandidates.length > 0) {
          candidatePoints = pushedCandidates;
        }
      }

      // Note: If no suitable candidates are found, we must stop placing exits.
      //  This can happen on small grids or with high numbers of exits / push factor.
      if (candidatePoints.length === 0) {
        break;
      }

      const candidateIndex = this.nextRandomInt(candidatePoints.length);
      const exitPoint = candidatePoints[candidateIndex];
      const originalIndex = allPoints.findIndex(
        (p) => p.x === exitPoint.x && p.y === exitPoint.y,
      );

      allPoints.splice(originalIndex, 1);

      grid[exitPoint.y][exitPoint.x].type = 'exit';
      exitPoints.push(exitPoint);
    }

    const paths: (Point[] | null)[] = [];
    const isRoad = new Set<string>([pointToString(entryPoint)]);

    for (const exitPoint of exitPoints) {
      // The graph for Dijkstra's is rebuilt for each path. This is important
      // because the "road" network changes after each path is added.
      const graph = this.buildGraph(isRoad, exitPoints, exitPoint);

      // --- THE SUPER START NODE TRICK ---
      // To find a path from the *entire existing road network* to the exit,
      // a virtual "super start node" is added to the graph. This node has a
      // zero-cost edge to every single point that is already a road.
      // By finding a path from this super node to the exit, Dijkstra's will
      // automatically find the cheapest connection point on the existing network.
      const SUPER_START_NODE = 'super_start';

      graph[SUPER_START_NODE] = {};
      isRoad.forEach((roadNode) => {
        graph[SUPER_START_NODE][roadNode] = 0;
      });

      const dijkstra = new Dijkstra();
      const pathNodes = dijkstra.findPath(graph, SUPER_START_NODE, pointToString(exitPoint));

      if (pathNodes.length > 0) {
        // The first node in the path will be the super start node, so we discard it.
        const path = (pathNodes[0] === SUPER_START_NODE ? pathNodes.slice(1) : pathNodes).map(stringToPoint);

        paths.push(path);
        // Add the new path's points to the `isRoad` set so that the next
        // path generation cycle can connect to it. Note that the final point
        // (the exit itself) is not added, as exits are not "roads".
        path.slice(0, -1).forEach((p) => isRoad.add(pointToString(p)));
      } else {
        // If no path could be found (e.g., the exit was unreachable), store null.
        // This is an edge case that could happen if the grid is partitioned.
        paths.push(null);
        generationError = `Path to [${pointToString(exitPoint)}] exit point wasn't found. Please adjust generation parameters to something less strict`
      }
    }

    return { grid, entryPoint, exitPoints, paths, generationError };
  }

  // --- GRAPH CONSTRUCTION FOR PATHFINDING ---
  // This method builds the weighted graph used by Dijkstra's algorithm. The weights
  // (costs) on the edges are carefully tuned to encourage desirable road layouts
  // and heavily penalize undesirable ones (like crossroads).
  private buildGraph(
    isRoad: Set<string>,
    exitPoints: Point[],
    currentTargetExit: Point,
  ): Graph {
    const graph: Graph = {};
    const { width, height } = this.config;

    // --- EFFECTIVE ROADS ---
    // This is the fix for the crossroad issue. The pathfinder was blind
    // to the locations of exits, seeing them as empty space.
    // This `effectiveRoads` set includes both the actual roads AND all
    // exits (except the one we're currently trying to path to). By using this
    // for all topological checks, the algorithm gets a complete picture of all
    // obstacles and connection points, allowing it to correctly detect and
    // prevent crossroads involving exits.
    const effectiveRoads = new Set<string>([...isRoad]);

    exitPoints.forEach((p) => {
      if (!(p.x === currentTargetExit.x && p.y === currentTargetExit.y)) {
        effectiveRoads.add(pointToString(p));
      }
    });

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const node = pointToString({ x, y });

        graph[node] = {};

        const neighbors = [
          { x: x + 1, y: y },
          { x: x - 1, y: y },
          { x: x, y: y + 1 },
          { x: x, y: y - 1 },
        ];

        for (const n of neighbors) {
          // Check if the neighbor is within the grid bounds.
          if (n.x < 0 || n.x >= width || n.y < 0 || n.y >= height) {
            continue;
          }

          const neighborNode = pointToString(n);

          // Limitation: This is a simple but potentially inefficient way to prevent
          // paths from running through other exits. It works, but a more optimized
          // approach might pre-calculate this into a set.
          if (
            exitPoints.some(
              (ep) =>
                ep.x === n.x &&
                ep.y === n.y &&
                !(n.x === currentTargetExit.x && n.y === currentTargetExit.y),
            )
          ) {
            continue; // Don't create an edge to another exit.
          }

          // --- COST CALCULATION LOGIC ---
          // This is the most critical part of the function. It determines the "cost"
          // of building a road from the current `node` to its `neighbor`.

          // First, count how many existing roads are adjacent to both the source
          // and destination cells, using the `effectiveRoads` set.
          const sourceRoadNeighbors = this.countRoadNeighbors(
            effectiveRoads,
            x,
            y,
          );
          const destRoadNeighbors = this.countRoadNeighbors(
            effectiveRoads,
            n.x,
            n.y,
          );

          const potentialSourceNeighbors = sourceRoadNeighbors + 1;
          const potentialDestNeighbors = destRoadNeighbors + 1;

          // The base cost for moving into any empty cell.
          let cost = 1;

          // THE CROSSROAD PENALTY:
          // If building this segment would result in either cell having 4 or more
          // connections, assign a prohibitively high cost. This is the core
          // mechanic that prevents crossroads. Using `>=` instead of `===` makes
          // it robust against edge cases where it might try to add a 5th connection.
          if (potentialSourceNeighbors >= 4 || potentialDestNeighbors >= 4) {
            cost = 1_000_000;
          } else if (effectiveRoads.has(neighborNode)) {
            // PENALTY FOR T-JUNCTIONS:
            // If the destination is already a road, we are creating a branch (a T-junction).
            // A small penalty is added to encourage paths to run through empty space
            // in parallel to existing roads, rather than immediately snapping to them,
            // which can lead to unnatural layouts.
            if (destRoadNeighbors !== 1) {
              cost = 5;
            }
          }

          graph[node][neighborNode] = cost;
        }
      }
    }

    return graph;
  }

  // Helper function to count how many of a point's four neighbors are in the provided road set.
  // The `roadSet` parameter is used so this can work with the `effectiveRoads` set, which
  // includes both roads and exits.
  private countRoadNeighbors(roadSet: Set<string>, x: number, y: number) {
    const neighbors = [
      `${x + 1},${y}`,
      `${x - 1},${y}`,
      `${x},${y + 1}`,
      `${x},${y - 1}`,
    ];

    return neighbors.reduce((acc, n) => acc + (roadSet.has(n) ? 1 : 0), 0);
  }

  // --- COMPLEXITY ADDITION LOGIC ---
  // This function takes a valid, generated level and modifies its paths to make
  // them more complex and visually interesting, a process referred to as "wriggling"
  public addComplexity(level: Level, config: ComplexityConfig): Level {
    const MAX_WRIGGLE_EXTENT_RECOMMENDED = 0.9;

    if (config.wriggleExtent > MAX_WRIGGLE_EXTENT_RECOMMENDED) {
      console.warn(
        `Complexity configuration might be incorrect. 'wriggleExtent' is set to extremely high number (${config.wriggleExtent}). ` +
        'Take into consideration that wriggleExtent is exponential, so values close to 1 will collapse ' +
        `into indifferentiable priorities (too low everywhere) and therefore not wriggle at all, keep it at ${MAX_WRIGGLE_EXTENT_RECOMMENDED} max`
      );
    }

    // Deep copy the level to avoid modifying the original.
    const complexLevel: Level = JSON.parse(JSON.stringify(level));
    const gridWidth = complexLevel.grid[0].length;
    const gridHeight = complexLevel.grid.length;
    const gridAvgDim = (gridWidth + gridHeight) / 2;

    // First, gather all points from all paths into a single set for efficient lookup
    let allRoadPoints = new Set<string>();

    complexLevel.paths.forEach((path) => {
      if (path) {
        path.forEach((p) => allRoadPoints.add(pointToString(p)));
      }
    });

    // Find Junctions: Identify all points that are intersections (more than
    // two road neighbors) or endpoints (entry/exits). These points will serve
    // as the boundaries for path segments.
    const junctions = this.findJunctions(complexLevel);

    // Extract Slices: A "slice" is a simple path segment that runs between
    // two junction points without any intersections in between. The level's
    // paths are broken down into these fundamental slices.
    const slices = this.extractSlices(complexLevel, junctions);

    // To avoid wriggling the same path segment multiple times if it's part of
    // overlapping paths, we create a map of unique slices.
    const uniqueSlices = new Map<string, Point[]>();

    slices.forEach(({ slice }) => {
      // A canonical key is created from the start and end points of the slice.
      const key = [
        pointToString(slice[0]),
        pointToString(slice[slice.length - 1]),
      ]
        .sort()
        .join('-');

      if (!uniqueSlices.has(key)) {
        uniqueSlices.set(key, slice);
      }
    });

    // Wriggle each unique slice.
    for (const slice of uniqueSlices.values()) {
      // --- BREAKPOINT GENERATION ---
      // This is the core of the improved complexity algorithm. Instead of a simple
      // probabilistic loop, it iteratively decides whether to add breakpoints
      // based on a decaying probability.
      const breakpointIndices: number[] = [];
      const sliceLength = slice.length;
      let lastBreakpointIndex = 0;

      for (let i = 0; i < sliceLength; i++) {
        const breakpointProbability = Math.min(
          1.0,
          config.wriggleFactor * ((i - lastBreakpointIndex) / (gridAvgDim / config.wriggleDistanceMagnifier)),
        );

        if (breakpointProbability < 0.03) {
          continue;
        }

        // Note: with extremely high wriggleDistanceMagnifier each point can be rolled into being a breakpoint
        //  since we cannot create wriggle from the point to itself, we are skipping roll if previous point was a breakpoint.
        //  This "guarantees" that every wriggle is at least 1 in length
        if (lastBreakpointIndex === i - 1) {
          continue;
        }

        if (this.nextRandomFloat() < breakpointProbability) {
          lastBreakpointIndex = i;
          breakpointIndices.push(i);
        }
      }

      let subSlices: Point[][] = [];
      let shouldWriggle = false;

      if (breakpointIndices.length > 0) {
        shouldWriggle = true;
        let lastIndex = 0;
        for (const bpIndex of breakpointIndices) {
          subSlices.push(slice.slice(lastIndex, bpIndex + 1));
          lastIndex = bpIndex;
        }
        subSlices.push(slice.slice(lastIndex));
      }

      if (!shouldWriggle) {
        continue;
      }

      const tempRoadPoints = new Set(allRoadPoints);
      const wriggledParts: Point[][] = [];

      for (const subSlice of subSlices) {
        // A special graph is built for wriggling. It uses a cost function
        // designed to encourage deviation from the original path.
        const graph = this.buildWriggleGraph(
          subSlice,
          tempRoadPoints,
          config,
          gridWidth,
          gridHeight,
        );
        const startNode = pointToString(subSlice[0]);
        const endNode = pointToString(subSlice[subSlice.length - 1]);
        const dijkstra = new Dijkstra();
        const newSubSliceNodes = dijkstra.findPath(graph, startNode, endNode);

        if (newSubSliceNodes && newSubSliceNodes.length > 1) {
          const newSubSlice = newSubSliceNodes.map(stringToPoint);
          wriggledParts.push(newSubSlice);

          // Update the road map for the next sub-slice pathfinding, so that
          // newly created wriggles don't intersect with each other.
          const oldSubSlicePoints = new Set(subSlice.map(pointToString));
          const newSubSlicePoints = new Set(newSubSlice.map(pointToString));
          oldSubSlicePoints.forEach((p) => tempRoadPoints.delete(p));
          newSubSlicePoints.forEach((p) => tempRoadPoints.add(p));
        }
      }

      // Replace the original slice with the new wriggled path.
      // Stitch the wriggled sub-slices back together into one continuous path.
      const newSlice = wriggledParts.reduce(
        (acc, part) =>
          acc.concat(
            acc.length > 0 &&
              pointToString(acc[acc.length - 1]) === pointToString(part[0])
              ? part.slice(1)
              : part,
          ),
        [],
      );

      // Only apply the change if the new path is actually longer
      if (newSlice.length > slice.length) {
        allRoadPoints = tempRoadPoints;
        // Find the old slice within every path in the level and replace it
        // with the newly generated wriggled slice.
        for (let i = 0; i < complexLevel.paths.length; i++) {
          const originalPath = complexLevel.paths[i];

          if (originalPath) {
            complexLevel.paths[i] = this.findAndReplaceSlice(
              originalPath,
              slice,
              newSlice,
            );
          }
        }
      }
    }

    return complexLevel;
  }

  public addComplexityMultiple(level: Level, configs: ComplexityConfig[]): Level {
    let currentLevel = JSON.parse(JSON.stringify(level));

    for (const config of configs) {
      currentLevel = this.addComplexity(currentLevel, config);
    }

    return currentLevel;
  }

  public addRotations(level: Level, config: RotationConfig): Level {
    const allPathPoints = new Set<string>();
    const rotatedLevel: Level = JSON.parse(JSON.stringify(level));

    rotatedLevel.rotationsMap = [];

    level.paths.forEach((path) => {
      if (path) {
        path.forEach((p) => allPathPoints.add(pointToString(p)));
      }
    });

    for (let y = 0; y < rotatedLevel.grid.length; y++) {
      rotatedLevel.rotationsMap[y] = [];
      for (let x = 0; x < rotatedLevel.grid[y].length; x++) {
        const pointStr = pointToString({ x, y });
        const cell = rotatedLevel.grid[y][x];
        let rotation = -1;

        // We only rotate cells that are part of a path but are not the entry or an exit point.
        if (allPathPoints.has(pointStr) && cell.type === 'empty') {
          if (this.nextRandomFloat() < config.rotationFactor) {
            // Assign a random rotation: 1 (90), 2 (180), or 3 (270 degrees)
            rotation = this.nextRandomInt(3) + 1;
          } else {
            rotation = 0;
          }
        }
        rotatedLevel.rotationsMap[y][x] = rotation;
      }
    }

    return rotatedLevel;
  }

  // Identifies all junction points in the level. Junctions are defined as:
  // - The entry point.
  // - All exit points.
  // - Any road point with more than two road neighbors.
  private findJunctions(level: Level): Set<string> {
    const metPoints = new Set<string>();
    const junctions = new Set<string>();

    junctions.add(pointToString(level.entryPoint));
    level.exitPoints.forEach((p) => junctions.add(pointToString(p)));

    for (const path of level.paths) {
      if (!path) {
        continue;
      }

      for (const p of path) {
        const pStr = pointToString(p);
        const exists = metPoints.has(pStr);

        if (exists) {
          junctions.add(pStr);
        }
        metPoints.add(pStr);
      }

    }

    return junctions;
  }

  // Breaks down the main paths into "slices," which are simple segments
  // connecting two junction points. This isolates parts of the path that can
  // be wriggled without affecting the overall graph topology.
  private extractSlices(
    level: Level,
    junctions: Set<string>,
  ): { slice: Point[]; }[] {
    const slices: { slice: Point[] }[] = [];

    for (const path of level.paths) {
      if (!path) {
        continue;
      }

      let currentSlice: Point[] = [];

      for (const point of path) {
        const pStr = pointToString(point);

        currentSlice.push(point);

        // A slice ends when it hits a junction or the end of the path.
        if (junctions.has(pStr) || point === path[path.length - 1]) {
          if (currentSlice.length > 1) {
            slices.push({ slice: currentSlice });
          }

          // Start a new slice from the current junction point.
          currentSlice = [point];
        }
      }
    }

    return slices;
  }

  // Builds a special graph for the "wriggle" pathfinding. The cost function here
  // is designed to create more interesting, meandering paths.
  private buildWriggleGraph(
    sliceToWriggle: Point[],
    allRoadPoints: Set<string>,
    config: ComplexityConfig,
    width: number,
    height: number,
  ) {
    const graph: Record<string, Record<string, number>> = {};
    const slicePoints = new Set(sliceToWriggle.map(pointToString));
    // Other roads are treated as obstacles that the new path cannot cross.
    const otherRoadPoints = new Set(
      [...allRoadPoints].filter((p) => !slicePoints.has(p)),
    );

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const nodeStr = pointToString({ x, y });

        // Can't path through other roads.
        if (otherRoadPoints.has(nodeStr)) {
          continue;
        }

        graph[nodeStr] = {};

        const neighbors = [
          { x: x + 1, y: y },
          { x: x - 1, y: y },
          { x: x, y: y + 1 },
          { x: x, y: y - 1 },
        ];

        for (const n of neighbors) {
          if (n.x < 0 || n.x >= width || n.y < 0 || n.y >= height) {
            continue;
          }

          const neighborStr = pointToString(n);

          if (otherRoadPoints.has(neighborStr)) {
            continue;
          }

          // --- WRIGGLE COST FUNCTION ---
          // This is the core of the wriggle effect.
          const minDist = Math.min(
            ...sliceToWriggle.map((p) => modifiedManhattanDistance({ x, y }, p, 2)),
          );

          const we = Math.max(0, Math.min(1, config.wriggleExtent));
          const cost = 0.01 + Math.exp(-normalizeWithControl(minDist, 1 - we) * (width + height));

          // Note: chaos is a small randomized cost deviation for paths
          //  calculated by the formula to avoid smooth distribution
          const chaosFactor = Math.max(0, Math.min(1, config.wriggleExtentChaosFactor));
          const chaosChance = 0.2 + normalizeWithControl(0.4, chaosFactor);

          graph[nodeStr][neighborStr] = cost + (this.nextRandomFloat() < chaosChance ? (this.nextRandomFloat() < 0.5 ? 0.01 : -0.01) : 0);
        }
      }
    }

    return graph;
  }

  // A utility to find a sub-array (the old slice) within a larger array (the path)
  // and replace it with a new sub-array (the new wriggled slice).
  private findAndReplaceSlice(
    path: Point[],
    oldSlice: Point[],
    newSlice: Point[],
  ): Point[] {
    const pathStr = path.map(pointToString);
    const oldSliceStr = oldSlice.map(pointToString);

    let index = findSubArray(pathStr, oldSliceStr);
    let finalNewSlice = newSlice;

    // The slice might exist in the path in a reversed order. If it's not found
    // initially, the function checks for the reversed version.
    if (index === -1) {
      const reversedOldSliceStr = oldSliceStr.toReversed();

      index = findSubArray(pathStr, reversedOldSliceStr);

      if (index !== -1) {
        // If the reversed version is found, the new slice must also be reversed
        // to maintain the correct path direction.
        finalNewSlice = newSlice.toReversed();
      }
    }

    // If the slice was found (either forwards or backwards), replace it.
    if (index !== -1) {
      const newPath = [...path];

      newPath.splice(index, oldSlice.length, ...finalNewSlice);

      return newPath;
    }

    // If for some reason the slice isn't found, return the original path,
    // making function more resilient
    return path;
  }
}
