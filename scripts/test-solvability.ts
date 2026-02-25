#!/usr/bin/env bun
/**
 * Generate puzzles with the new generator, then verify each one
 * is actually solvable using the BFS solver.
 *
 * Usage: bun scripts/test-solvability.ts [count]
 * Default: 10000 (solver is slow — ~5ms/level on easy, ~200ms on medium)
 */

import { generatePuzzle } from '../src/game/dailydispatch/core/SlidingPuzzleGenerator';
import { solve } from '../src/game/dailydispatch/core/Solver';
import { DIFFICULTY_PRESETS } from '../src/game/dailydispatch/types/level';

const TOTAL = parseInt(process.argv[2] || '10000', 10);
const REPORT_EVERY = Math.max(1, Math.floor(TOTAL / 20));

const difficulties = ['easy', 'medium', 'hard'] as const;

console.log(`\n  Solvability test — ${TOTAL.toLocaleString()} puzzles per difficulty`);
console.log(`  (generating with new gen, verifying with BFS solver)\n`);

for (const diff of difficulties) {
  const settings = DIFFICULTY_PRESETS[diff];
  let generated = 0;
  let genFailed = 0;
  let solvable = 0;
  let unsolvable = 0;
  let trivial = 0; // solvable in 0-1 moves
  let solverTimeout = 0;
  const moveDist = new Map<number, number>();
  const unsolvableSeeds: number[] = [];
  const trivialSeeds: number[] = [];

  const start = performance.now();

  for (let i = 0; i < TOTAL; i++) {
    const seed = i + 1;
    const level = generatePuzzle({ difficulty: settings, seed, levelId: `test_${i}` });

    if (!level) {
      genFailed++;
      continue;
    }
    generated++;

    // Run BFS solver on the generated level
    const result = solve(level, 40, 100000);

    if (result.solvable) {
      solvable++;
      const mc = result.optimalMoveCount;
      moveDist.set(mc, (moveDist.get(mc) || 0) + 1);

      if (mc <= 1) {
        trivial++;
        if (trivialSeeds.length < 10) trivialSeeds.push(seed);
      }
    } else {
      if (result.optimalMoveCount === -1) {
        // Could be unsolvable OR solver ran out of nodes
        solverTimeout++;
      }
      unsolvable++;
      if (unsolvableSeeds.length < 20) unsolvableSeeds.push(seed);
    }

    if ((i + 1) % REPORT_EVERY === 0) {
      const pct = (((i + 1) / TOTAL) * 100).toFixed(0);
      const elapsed = ((performance.now() - start) / 1000).toFixed(1);
      process.stdout.write(`\r  [${diff}] ${pct}% (${elapsed}s) — ${solvable} solvable, ${unsolvable} unsolvable`);
    }
  }

  const elapsed = performance.now() - start;
  process.stdout.write('\r' + ' '.repeat(80) + '\r');

  const solvableRate = generated > 0 ? ((solvable / generated) * 100).toFixed(2) : '0';

  console.log(`  ── ${diff.toUpperCase()} ──`);
  console.log(`  Generated:     ${generated.toLocaleString()} (${genFailed} gen failures)`);
  console.log(`  Solvable:      ${solvable.toLocaleString()} / ${generated.toLocaleString()} (${solvableRate}%)`);
  console.log(`  Unsolvable:    ${unsolvable.toLocaleString()}${solverTimeout > 0 ? ` (${solverTimeout} solver timeouts)` : ''}`);
  console.log(`  Trivial (0-1): ${trivial.toLocaleString()}`);
  console.log(`  Total time:    ${(elapsed / 1000).toFixed(1)}s`);
  console.log(`  Avg/level:     ${(elapsed / TOTAL).toFixed(2)}ms`);

  if (moveDist.size > 0) {
    const sorted = [...moveDist.entries()].sort((a, b) => a[0] - b[0]);
    console.log(`  Move distribution:`);
    for (const [moves, count] of sorted) {
      const bar = '#'.repeat(Math.min(50, Math.round((count / generated) * 200)));
      console.log(`    ${String(moves).padStart(3)} moves: ${String(count).padStart(6)} ${bar}`);
    }
    const totalMoves = sorted.reduce((s, [m, c]) => s + m * c, 0);
    console.log(`  Avg optimal:   ${(totalMoves / solvable).toFixed(1)} moves`);
  }

  if (unsolvableSeeds.length > 0) {
    console.log(`  Unsolvable seeds: [${unsolvableSeeds.join(', ')}${unsolvable > 20 ? ', ...' : ''}]`);
  }
  if (trivialSeeds.length > 0) {
    console.log(`  Trivial seeds: [${trivialSeeds.join(', ')}${trivial > 10 ? ', ...' : ''}]`);
  }

  console.log();
}

console.log(`  Done.\n`);
