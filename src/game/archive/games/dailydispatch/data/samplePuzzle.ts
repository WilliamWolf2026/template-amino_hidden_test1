import type { LevelConfig } from '../types/level';

/**
 * Hardcoded test puzzle for development.
 * 6×6 grid with 3 blocks and 3 docks.
 *
 * Layout:
 *   - Blue I3_H at (1,1) → slides right to exit through right-wall dock at rows 1
 *   - Orange I2_V at (4,3) → slides down to exit through bottom-wall dock at col 4
 *   - Pink DOT at (2,4)    → slides left to exit through left-wall dock at row 4
 */
export const SAMPLE_PUZZLE: LevelConfig = {
  id: 'test-001',
  gridSize: 6,
  clue: 'The warehouse was hiding a secret all along!',
  optimalMoves: 3,
  blocks: [
    {
      id: 'b1',
      color: 'blue',
      shape: 'I3_H',
      position: { col: 1, row: 1 },
    },
    {
      id: 'b2',
      color: 'orange',
      shape: 'I2_V',
      position: { col: 4, row: 3 },
    },
    {
      id: 'b3',
      color: 'pink',
      shape: 'DOT',
      position: { col: 2, row: 4 },
    },
  ],
  docks: [
    {
      id: 'd1',
      color: 'blue',
      wall: 'right',
      wallIndices: [1],
    },
    {
      id: 'd2',
      color: 'orange',
      wall: 'bottom',
      wallIndices: [4],
    },
    {
      id: 'd3',
      color: 'pink',
      wall: 'left',
      wallIndices: [4],
    },
  ],
};

/**
 * A slightly harder test puzzle with obstacles.
 */
export const SAMPLE_PUZZLE_MEDIUM: LevelConfig = {
  id: 'test-002',
  gridSize: 6,
  clue: 'The packages were delivered just in time!',
  optimalMoves: 6,
  blocks: [
    // Target blocks (have matching docks)
    {
      id: 'b1',
      color: 'blue',
      shape: 'I2_H',
      position: { col: 0, row: 0 },
    },
    {
      id: 'b2',
      color: 'orange',
      shape: 'I3_V',
      position: { col: 3, row: 1 },
    },
    {
      id: 'b3',
      color: 'cyan',
      shape: 'O',
      position: { col: 1, row: 3 },
    },
    // Obstacle block (no matching dock)
    {
      id: 'obs1',
      color: 'purple',
      shape: 'I2_H',
      position: { col: 4, row: 0 },
    },
  ],
  docks: [
    {
      id: 'd1',
      color: 'blue',
      wall: 'right',
      wallIndices: [0],
    },
    {
      id: 'd2',
      color: 'orange',
      wall: 'bottom',
      wallIndices: [3],
    },
    {
      id: 'd3',
      color: 'cyan',
      wall: 'left',
      wallIndices: [3, 4],
    },
  ],
};
