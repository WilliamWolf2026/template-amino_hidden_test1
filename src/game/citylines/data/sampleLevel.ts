import type { LevelConfig } from '../types';

/**
 * Sample level for development and testing.
 * This is the ONLY level used - no chapter system, no multi-level flow.
 */



export const sampleLevel: LevelConfig = {
  levelNumber: 1,
  gridSize: 4,
  county: 'atlantic',
  clue: 'Unlikely championship victory',
  landmarks: [
    { type: 'diner', position: { row: 1, col: 1 } },
    { type: 'gas_station', position: { row: 2, col: 2 } },
  ],
  exits: [
    { position: { row: 0, col: 3 }, facingEdge: 'south' },
  ],
  roadTiles: [
    { type: 'straight', row: 1, col: 3, solutionRotation: 0, initialRotation: 90 },
    { type: 't_junction', row: 2, col: 3, solutionRotation: 180, initialRotation: 0 },
    { type: 'corner', row: 3, col: 3, solutionRotation: 270, initialRotation: 90 },
    { type: 'straight', row: 3, col: 2, solutionRotation: 90, initialRotation: 0 },
    { type: 'corner', row: 3, col: 1, solutionRotation: 0, initialRotation: 180 },
    { type: 'straight', row: 2, col: 1, solutionRotation: 0, initialRotation: 90 },
  ],
};