import type { Direction } from '../types/grid';
import type { LevelConfig } from '../types/level';
import { GridSimulation } from './GridSimulation';

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

/** A single move in a solution path */
export interface SolverMove {
  blockId: string;
  direction: Direction;
}

/** Result from the BFS solver */
export interface SolverResult {
  solvable: boolean;
  moves: SolverMove[];
  optimalMoveCount: number;
}

/**
 * Encode a solver node state as a unique string for visited tracking.
 * Includes both active block positions and exited block IDs.
 */
function encodeNodeState(
  blockPositions: Map<string, { col: number; row: number }>,
  exitedBlockIds: Set<string>,
): string {
  const parts: string[] = [];
  for (const [id, pos] of [...blockPositions.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    parts.push(`${id}:${pos.col},${pos.row}`);
  }
  for (const id of [...exitedBlockIds].sort()) {
    parts.push(`${id}:X`);
  }
  return parts.join('|');
}

/**
 * Build a LevelConfig representing the current solver state.
 * Only includes active (non-exited) blocks and open (non-closed) docks.
 */
function buildStateConfig(
  baseConfig: LevelConfig,
  blockPositions: Map<string, { col: number; row: number }>,
  closedDockIds: Set<string>,
): LevelConfig {
  return {
    id: baseConfig.id,
    gridSize: baseConfig.gridSize,
    blocks: baseConfig.blocks
      .filter((b) => blockPositions.has(b.id))
      .map((b) => ({ ...b, position: { ...blockPositions.get(b.id)! } })),
    docks: baseConfig.docks.filter((d) => !closedDockIds.has(d.id)),
  };
}

/**
 * Check if the puzzle is complete: all blocks that have a matching dock must be exited.
 */
function isComplete(baseConfig: LevelConfig, exitedBlockIds: Set<string>): boolean {
  const dockColors = new Set(baseConfig.docks.map((d) => d.color));
  return baseConfig.blocks
    .filter((b) => dockColors.has(b.color))
    .every((b) => exitedBlockIds.has(b.id));
}

/** BFS node representing a puzzle state */
interface BfsNode {
  blockPositions: Map<string, { col: number; row: number }>;
  closedDockIds: Set<string>;
  exitedBlockIds: Set<string>;
  path: SolverMove[];
}

/**
 * BFS solver for sliding block puzzles.
 * Explores all (block, direction) pairs level-by-level to find optimal solution.
 *
 * @param config - The level configuration to solve
 * @param maxDepth - Maximum BFS depth (default: 40)
 * @param maxNodes - Maximum nodes to explore before giving up (default: 50000)
 */
export function solve(
  config: LevelConfig,
  maxDepth: number = 40,
  maxNodes: number = 50000,
): SolverResult {
  // Check if already solved
  const initial = new GridSimulation(config);
  if (initial.isLevelComplete()) {
    return { solvable: true, moves: [], optimalMoveCount: 0 };
  }

  // Extract initial state
  const initialPositions = new Map<string, { col: number; row: number }>();
  const initialExited = new Set<string>();
  for (const [id, block] of initial.blocks) {
    if (!block.exited) {
      initialPositions.set(id, { ...block.position });
    } else {
      initialExited.add(id);
    }
  }

  const initialKey = encodeNodeState(initialPositions, initialExited);
  const visited = new Set<string>();
  visited.add(initialKey);

  let queue: BfsNode[] = [
    {
      blockPositions: initialPositions,
      closedDockIds: new Set(),
      exitedBlockIds: initialExited,
      path: [],
    },
  ];

  let nodesExplored = 0;

  while (queue.length > 0 && queue[0].path.length < maxDepth) {
    const nextQueue: BfsNode[] = [];

    for (const node of queue) {
      // Try every (block, direction) pair
      for (const blockId of node.blockPositions.keys()) {
        for (const dir of DIRECTIONS) {
          if (nodesExplored >= maxNodes) {
            return { solvable: false, moves: [], optimalMoveCount: -1 };
          }
          nodesExplored++;

          // Reconstruct simulation for this state
          const stateConfig = buildStateConfig(config, node.blockPositions, node.closedDockIds);
          const sim = new GridSimulation(stateConfig);
          const result = sim.slideBlock(blockId, dir);
          if (!result.moved) continue;

          // Extract new state
          const newPositions = new Map<string, { col: number; row: number }>();
          const newExited = new Set(node.exitedBlockIds);
          const newClosedDocks = new Set(node.closedDockIds);

          for (const [id, block] of sim.blocks) {
            if (block.exited) {
              newExited.add(id);
            } else {
              newPositions.set(id, { ...block.position });
            }
          }

          if (result.exitedDock) {
            newClosedDocks.add(result.exitedDock.id);
          }

          // Check if this state was already visited
          const stateKey = encodeNodeState(newPositions, newExited);
          if (visited.has(stateKey)) continue;
          visited.add(stateKey);

          const newPath = [...node.path, { blockId, direction: dir }];

          // Check if solved
          if (isComplete(config, newExited)) {
            return { solvable: true, moves: newPath, optimalMoveCount: newPath.length };
          }

          nextQueue.push({
            blockPositions: newPositions,
            closedDockIds: newClosedDocks,
            exitedBlockIds: newExited,
            path: newPath,
          });
        }
      }
    }

    queue = nextQueue;
  }

  return { solvable: false, moves: [], optimalMoveCount: -1 };
}
