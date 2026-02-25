# Daily Dispatch: New Level Generator — Full Report

## Phase 1: Generation Stress Test

Ran the new spec-driven generator **3 million times** to test if it crashes or fails to produce a level.

| Difficulty | Runs | Failures | Success Rate | Time | Avg/Level |
|---|---|---|---|---|---|
| Easy | 1,000,000 | 0 | **100.0000%** | 15.4s | 0.015ms |
| Medium | 1,000,000 | 0 | **100.0000%** | 22.4s | 0.022ms |
| Hard | 1,000,000 | 0 | **100.0000%** | 40.5s | 0.041ms |

**3,000,000 total generations. 0 failures. ~78 seconds.**

The generator never crashes and always produces a valid `LevelConfig`.

---

## Phase 2: Solvability Verification

Generation succeeding doesn't mean the puzzles are solvable. We ran 10,000 generated puzzles per difficulty through the BFS solver to check.

### Easy — 99.72% Solvable

| Metric | Value |
|---|---|
| Generated | 10,000 |
| Solvable | 9,972 (99.72%) |
| Solver timeouts | 28 (0.28%) |
| Trivial (0-1 moves) | 0 |
| Avg optimal moves | 6.7 |

**Move distribution (easy):**
```
 4 moves:     84  ##
 5 moves:    966  ###################
 6 moves:  3,625  ##################################################
 7 moves:  3,339  ##############################################
 8 moves:  1,525  #####################
 9 moves:    340  #####
10 moves:     48  #
11 moves:     22
12 moves:      8
13 moves:     12
14 moves:      3
```

The 28 "unsolvable" were all solver timeouts — the BFS hit its 100k node limit. These puzzles may be solvable in 15+ moves where the search space explodes.

**Timeout seeds:** 231, 629, 859, 866, 1153, 2009, 2711, 3113, 3597, 3621, 3817, 4211, 4371, 5692, 5912, 6041, 6558, 6848, 7288, 7852, +8 more

### Medium — ~29% Solvable (in progress)

| Metric | Value (at 30%) |
|---|---|
| Tested so far | ~3,000 / 10,000 |
| Solvable | ~876 (~29%) |
| Solver timeouts | ~2,124 (~71%) |

Medium puzzles have 4 pieces, creating a much larger state space. The BFS solver's 100k node limit gets hit far more often. This doesn't necessarily mean the puzzles are unsolvable — but it means **either**:
1. Many medium puzzles are genuinely deadlocked, or
2. They require too many moves for the solver to verify within its node budget

### Hard — Pending

Still waiting on medium to finish.

---

## Speed Comparison vs Old Generator

| | Old Generator | New Generator | Speedup |
|---|---|---|---|
| Easy | 5.37ms | 0.015ms | **358x** |
| Medium | ~200ms | 0.022ms | **~9,000x** |
| Hard | ~500ms+ | 0.041ms | **~12,000x** |

Old generator bottleneck: BFS solver ran after every generation attempt.

---

## How the Generators Differ

**Old approach** — backward generation:
1. Place blocks at solved positions (goal state)
2. Randomly scramble by sliding
3. BFS solver verifies solvability
4. Reject and retry if unsolvable or trivial (up to 20 retries)

**New approach** — spec-driven placement:
1. Place **anchor blocks** in grid corners with matched exits
2. Scramble anchors with vertical + horizontal moves
3. Break any anchor-exit alignment (nothing solvable in 1 move)
4. Place **dependent blocks** adjacent to anchors — intentionally blocking exit paths
5. Scramble dependents away from their exits (more passes on harder difficulties)
6. Break any dependent-exit alignment

---

## Piece Counts by Difficulty

| Difficulty | Anchors | Dependents | Total Pieces |
|---|---|---|---|
| Easy | 2 | 1 | 3 |
| Medium | 3 | 1 | 3–4 |
| Hard | 2 | 3 | 4–5 |

---

## Assessment

**Easy difficulty: Production-ready.** 99.72% solvable with a nice move distribution centered around 6-7 moves. The 0.28% timeout rate would drop to 0% if we add a solver verification + retry step.

**Medium/Hard difficulty: Needs solver verification.** The high timeout rate suggests many puzzles are either too complex or genuinely unsolvable. Since the new generator is so fast (~0.02ms), we can add solver verification and retry on failure — generate → verify → retry. Even with 3-4 retries per level, the combined time would still be far faster than the old generator.

## Recommended Next Step

Add solver verification back into the new generator as an optional post-generation check:
1. Generate puzzle with spec-driven approach (~0.02ms)
2. Run BFS solver to verify solvability (~5-200ms)
3. If unsolvable, regenerate with next seed
4. This gives us the best of both worlds: intentional puzzle design + guaranteed solvability
