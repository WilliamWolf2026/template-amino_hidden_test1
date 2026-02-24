#!/usr/bin/env bun
/**
 * Stress test the new spec-driven level generator.
 * Usage: bun scripts/test-new-generator.ts [count]
 */

import { generatePuzzle, type GeneratorConfig } from '../src/game/dailydispatch/core/SlidingPuzzleGenerator';
import { DIFFICULTY_PRESETS } from '../src/game/dailydispatch/types/level';

const TOTAL = parseInt(process.argv[2] || '1000000', 10);
const REPORT_EVERY = Math.max(1, Math.floor(TOTAL / 20));

const difficulties = ['easy', 'medium', 'hard'] as const;

console.log(`\n  Stress testing new generator — ${TOTAL.toLocaleString()} runs per difficulty\n`);

for (const diff of difficulties) {
  const settings = DIFFICULTY_PRESETS[diff];
  let successes = 0;
  let failures = 0;
  let totalBlocks = 0;
  let totalDocks = 0;
  const blockCounts = new Map<number, number>();
  const failSeeds: number[] = [];

  const start = performance.now();

  for (let i = 0; i < TOTAL; i++) {
    const seed = i + 1;
    const result = generatePuzzle({ difficulty: settings, seed, levelId: `test_${i}` });

    if (result) {
      successes++;
      totalBlocks += result.blocks.length;
      totalDocks += result.docks.length;
      const bc = result.blocks.length;
      blockCounts.set(bc, (blockCounts.get(bc) || 0) + 1);
    } else {
      failures++;
      if (failSeeds.length < 20) failSeeds.push(seed);
    }

    if ((i + 1) % REPORT_EVERY === 0) {
      const pct = (((i + 1) / TOTAL) * 100).toFixed(0);
      const elapsed = ((performance.now() - start) / 1000).toFixed(1);
      process.stdout.write(`\r  [${diff}] ${pct}% (${elapsed}s)`);
    }
  }

  const elapsed = performance.now() - start;
  process.stdout.write('\r' + ' '.repeat(50) + '\r');

  const rate = ((successes / TOTAL) * 100).toFixed(4);
  const avgMs = (elapsed / TOTAL).toFixed(4);

  console.log(`  ── ${diff.toUpperCase()} ──`);
  console.log(`  Success:    ${rate}% (${successes.toLocaleString()} / ${TOTAL.toLocaleString()})`);
  console.log(`  Failures:   ${failures.toLocaleString()}`);
  console.log(`  Total time: ${(elapsed / 1000).toFixed(2)}s`);
  console.log(`  Avg/level:  ${avgMs}ms`);

  if (successes > 0) {
    console.log(`  Avg blocks: ${(totalBlocks / successes).toFixed(1)}`);
    console.log(`  Avg docks:  ${(totalDocks / successes).toFixed(1)}`);
    const sorted = [...blockCounts.entries()].sort((a, b) => a[0] - b[0]);
    console.log(`  Block dist: ${sorted.map(([b, c]) => `${b}pcs:${c}`).join('  ')}`);
  }

  if (failSeeds.length > 0) {
    console.log(`  Fail seeds: [${failSeeds.join(', ')}${failures > 20 ? ', ...' : ''}]`);
  }

  console.log();
}

console.log(`  Done.\n`);
