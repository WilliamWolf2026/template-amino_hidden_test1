import { LevelGenerator, type Level, type Point } from '~/game/citylines/core/LevelGenerator/LevelGenerator';

export * from './LevelGenerator';

// --- DEBUG RENDERING LOGIC ---
// This function is not part of the core generation logic but is essential for
// debugging and visualization. It takes a level object and converts it into a
// human-readable ASCII art representation.
function renderLevel(level: Level): string[] {
  // 1. Gather all unique points that are part of any path.
  const allPathPoints = new Set<string>();
  level.paths.forEach((path) => {
    if (path) path.forEach((p) => allPathPoints.add(`${p.x},${p.y}`));
  });

  // 2. Gather all unique connections (edges) between points.
  const chosenEdges = new Set<string>();
  level.paths.forEach((path) => {
    if (path) {
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        // Create a canonical ID for the edge (e.g., "x1,y1-x2,y2" sorted)
        // so that the connection from p1 to p2 is the same as from p2 to p1.
        const id = [`${p1.x},${p1.y}`, `${p2.x},${p2.y}`].sort().join('-');
        chosenEdges.add(id);
      }
    }
  });

  // Helper to create the canonical edge ID for checking existence.
  const getEdgeId = (p1: Point, p2: Point) => {
    return [`${p1.x},${p1.y}`, `${p2.x},${p2.y}`].sort().join('-');
  };

  const output: string[] = [];
  for (let y = 0; y < level.grid.length; y++) {
    let row = '';
    for (let x = 0; x < level.grid[y].length; x++) {
      let char = ' '; // Default to empty space.
      const currentPoint = { x, y };
      const currentId = `${x},${y}`;

      if (level.entryPoint.x === x && level.entryPoint.y === y) {
        char = 'S'; // Start point.
      } else if (level.exitPoints.some((p) => p.x === x && p.y === y)) {
        char = 'E'; // Exit point.
      } else if (allPathPoints.has(currentId)) {
        // 3. Render road segments based on their actual connections.
        // It checks for connections up, down, left, and right, and then uses
        // box-drawing characters to represent the road shape correctly.
        const up = chosenEdges.has(getEdgeId(currentPoint, { x, y: y - 1 }));
        const down = chosenEdges.has(getEdgeId(currentPoint, { x, y: y + 1 }));
        const left = chosenEdges.has(getEdgeId(currentPoint, { x: x - 1, y }));
        const right = chosenEdges.has(
          getEdgeId(currentPoint, { x: x + 1, y }),
        );

        // Select the appropriate box-drawing character.
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
          // Fallback for simple cases (e.g., end of a line).
          if (up || down) char = '│';
          else if (left || right) char = '─';
          else char = '*'; // Should not happen in a valid level.
        }
      }
      row += char;

      // Add a horizontal connector if there's a road to the right. This is
      // purely for visual representation in a double-width ASCII grid.
      if (x < level.grid[y].length - 1) {
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
  return output;
}

const generateLevel = () => {
  const startTimestamp = performance.now();

  // Generate a new random seed for each run to get different layouts.
  const seed = Date.now() ^ (Math.random() * 0x100000000);

  const conf: ConstructorParameters<typeof LevelGenerator>[0] = {
    seed,
    width: 4,
    height: 4,
    exitPoints: 1,
    pointsSpacing: 3,
    distanceFormula: 'euclideanDistance',
    // distanceFormula: 'manhattanDistance',
    sidePushRadius: 2,
    sidePushFactor: 1,
  };
  const lg = new LevelGenerator(conf);

  // Generate the base level.
  const level = lg.generate();

  // TODO: change "wriggle" to "sinuosity" everywhere
  const complexLevel = lg.addComplexityMultiple(
    level,
    [
      { wriggleFactor: 0.999, wriggleDistanceMagnifier: 4,   wriggleExtent: 0.7, wriggleExtentChaosFactor: 0.8 },
      { wriggleFactor: 0.999, wriggleDistanceMagnifier: 4,   wriggleExtent: 0.7, wriggleExtentChaosFactor: 0.8 },
    ],
  );

  const originalLines = renderLevel(level);
  const complexLines = renderLevel(complexLevel);

  console.log('='.repeat(80));
  console.log('Seed:', seed);
  console.log('Generated Level:');

  const PADDING = 20;
  console.log(
    'Original'.padEnd(PADDING) +
    '    ' +
    'Wriggle'.padEnd(PADDING),
  );
  console.log(
    '='.repeat(PADDING) +
    '    ' +
    '='.repeat(PADDING),
  );

  // Print the rendered levels line by line.
  const height = Math.max(
    originalLines.length,
    complexLines.length,
  );
  for (let i = 0; i < height; i++) {
    const p1 = originalLines[i] || ''.padEnd(PADDING);
    const p4 = complexLines[i] || ''.padEnd(PADDING);
    console.log(
      p1.padEnd(PADDING) +
      '    ' +
      p4.padEnd(PADDING),
    );
  }

  console.log('Took milliseconds:', (performance.now() - startTimestamp));
}

// generateLevel();
