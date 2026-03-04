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
    { type: 'diner', position: { x: 1, y: 1 } },
    { type: 'gas_station', position: { x: 2, y: 2 } },
  ],
  exits: [
    { position: { x: 3, y: 0 }, facingEdge: 'south' },
  ],
  roadTiles: [
    // Rotation states: 0 = 0°, 1 = 90°, 2 = 180°, 3 = 270°
    { type: 'straight', x: 3, y: 1, solutionRotation: 0, initialRotation: 1 },
    { type: 't_junction', x: 3, y: 2, solutionRotation: 2, initialRotation: 0 },
    { type: 'corner', x: 3, y: 3, solutionRotation: 3, initialRotation: 1 },
    { type: 'straight', x: 2, y: 3, solutionRotation: 1, initialRotation: 0 },
    { type: 'corner', x: 1, y: 3, solutionRotation: 0, initialRotation: 2 },
    { type: 'straight', x: 1, y: 2, solutionRotation: 0, initialRotation: 1 },
  ],
};