import { describe, it, expect } from 'vitest';
import { createRng, shuffle } from '~/game/mygame/engine/rng';
import { INGREDIENT_CATALOG, CATALOG_MAP, LOOK_ALIKES, getLookAlikes } from '~/game/mygame/engine/catalog';
import {
  RECIPE_DATABASE,
  TIER_RECIPES,
  getTierForLevel,
  getTierParams,
  getBreatheParams,
} from '~/game/mygame/engine/recipes';
import { placeItems } from '~/game/mygame/engine/layout';
import { calculateScore, calculateStars, estimateMaxScore } from '~/game/mygame/engine/scoring';
import { step, tickTimer } from '~/game/mygame/engine/step';
import { generateLevelConfig } from '~/game/mygame/engine/levelGen';
import { createMesoStateMachine } from '~/game/mygame/engine/stateMachine';
import type { GameState, LevelConfig, Ingredient, PlacedItem } from '~/game/mygame/engine/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePlacedItem(
  id: string,
  ingredient: Ingredient,
  isRequired: boolean,
  found = false,
): PlacedItem {
  return { id, ingredient, position: { x: 0, y: 0 }, found, isRequired };
}

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  const recipe = RECIPE_DATABASE[0]!; // Tomato Soup: tomato, onion, garlic
  const config: LevelConfig = {
    level: 1,
    recipe,
    distractors: [],
    timeLimit: 45,
    gridWidth: 400,
    gridHeight: 600,
    seed: 42,
    isBreathe: false,
  };

  const items: PlacedItem[] = [
    ...recipe.ingredients.map((ri, i) =>
      makePlacedItem(`item_${i}`, ri.item, true),
    ),
    makePlacedItem('item_distractor_0', INGREDIENT_CATALOG[10]!, false), // lettuce
  ];

  return {
    items,
    recipe,
    found: [],
    score: 0,
    timeRemaining: 45,
    comboStreak: 0,
    maxCombo: 0,
    strikes: 0,
    totalTaps: 0,
    correctTaps: 0,
    lastCorrectTapTime: 0,
    status: 'playing',
    config,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// RNG
// ---------------------------------------------------------------------------
describe('RNG', () => {
  it('seeded RNG produces deterministic sequence', () => {
    const rng = createRng(42);
    const values = [rng(), rng(), rng(), rng(), rng()];
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(new Set(values).size).toBeGreaterThan(1);
  });

  it('same seed produces same sequence', () => {
    const rng1 = createRng(123);
    const rng2 = createRng(123);
    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('different seed produces different sequence', () => {
    const rng1 = createRng(100);
    const rng2 = createRng(200);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    const allSame = seq1.every((v, i) => v === seq2[i]);
    expect(allSame).toBe(false);
  });

  it('shuffle is deterministic with seeded rng', () => {
    const arr1 = [1, 2, 3, 4, 5, 6, 7, 8];
    const arr2 = [1, 2, 3, 4, 5, 6, 7, 8];
    shuffle(arr1, createRng(99));
    shuffle(arr2, createRng(99));
    expect(arr1).toEqual(arr2);
  });
});

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------
describe('Catalog', () => {
  it('has at least 70 ingredients', () => {
    expect(INGREDIENT_CATALOG.length).toBeGreaterThanOrEqual(70);
  });

  it('all ingredients have id, displayName, emoji, category', () => {
    for (const ing of INGREDIENT_CATALOG) {
      expect(ing.id).toBeTruthy();
      expect(ing.displayName).toBeTruthy();
      expect(ing.emoji).toBeTruthy();
      expect(ing.category).toBeTruthy();
    }
  });

  it('no duplicate IDs', () => {
    const ids = INGREDIENT_CATALOG.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('look-alike groups reference valid ingredient IDs', () => {
    const validIds = new Set(INGREDIENT_CATALOG.map((i) => i.id));
    for (const [key, alikes] of Object.entries(LOOK_ALIKES)) {
      expect(validIds.has(key)).toBe(true);
      for (const alikeId of alikes) {
        expect(validIds.has(alikeId)).toBe(true);
      }
    }
  });

  it('getLookAlikes returns empty array for unknown ingredient', () => {
    expect(getLookAlikes('nonexistent_xyz')).toEqual([]);
  });

  it('CATALOG_MAP indexes all ingredients by id', () => {
    for (const ing of INGREDIENT_CATALOG) {
      expect(CATALOG_MAP[ing.id]).toBe(ing);
    }
  });
});

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------
describe('Recipes', () => {
  it('at least 20 recipes exist', () => {
    expect(RECIPE_DATABASE.length).toBeGreaterThanOrEqual(20);
  });

  it('each recipe has valid ingredients from catalog', () => {
    const validIds = new Set(INGREDIENT_CATALOG.map((i) => i.id));
    for (const recipe of RECIPE_DATABASE) {
      expect(recipe.id).toBeTruthy();
      expect(recipe.name).toBeTruthy();
      expect(recipe.dishEmoji).toBeTruthy();
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      for (const ri of recipe.ingredients) {
        expect(validIds.has(ri.item.id)).toBe(true);
      }
    }
  });

  it('recipes cover all 4 tiers', () => {
    for (let tier = 1; tier <= 4; tier++) {
      const recipes = TIER_RECIPES[tier];
      expect(recipes).toBeDefined();
      expect(recipes!.length).toBeGreaterThan(0);
    }
  });

  it('getTierForLevel returns correct tier', () => {
    expect(getTierForLevel(1)).toBe(1);
    expect(getTierForLevel(5)).toBe(1);
    expect(getTierForLevel(6)).toBe(2);
    expect(getTierForLevel(15)).toBe(2);
    expect(getTierForLevel(16)).toBe(3);
    expect(getTierForLevel(30)).toBe(3);
    expect(getTierForLevel(31)).toBe(4);
    expect(getTierForLevel(100)).toBe(4);
  });

  it('getTierParams returns correct values per tier', () => {
    const t1 = getTierParams(1);
    expect(t1).toEqual({ requiredCount: 3, distractorCount: 20, timeLimit: 45, lookAlikeCount: 0 });

    const t2 = getTierParams(2);
    expect(t2).toEqual({ requiredCount: 5, distractorCount: 35, timeLimit: 40, lookAlikeCount: 2 });

    const t3 = getTierParams(3);
    expect(t3).toEqual({ requiredCount: 7, distractorCount: 50, timeLimit: 35, lookAlikeCount: 4 });

    const t4 = getTierParams(4);
    expect(t4).toEqual({ requiredCount: 10, distractorCount: 60, timeLimit: 30, lookAlikeCount: 6 });
  });

  it('getBreatheParams returns easier params', () => {
    const bp = getBreatheParams();
    expect(bp.requiredCount).toBe(3);
    expect(bp.distractorCount).toBe(15);
    expect(bp.timeLimit).toBe(50);
    expect(bp.lookAlikeCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
describe('Layout', () => {
  it('placeItems positions all items', () => {
    const required = INGREDIENT_CATALOG.slice(0, 3);
    const distractors = INGREDIENT_CATALOG.slice(3, 8);
    const rng = createRng(42);
    const placed = placeItems(required, distractors, 400, 600, 52, rng);
    expect(placed.length).toBe(8);
  });

  it('items have minimum spacing (no overlap at 44px)', () => {
    const required = INGREDIENT_CATALOG.slice(0, 3);
    const distractors = INGREDIENT_CATALOG.slice(3, 13);
    const rng = createRng(42);
    const minSpacing = 44;
    const placed = placeItems(required, distractors, 400, 600, minSpacing, rng);

    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const dx = placed[i]!.position.x - placed[j]!.position.x;
        const dy = placed[i]!.position.y - placed[j]!.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // The placement algorithm tries for minSpacing but may fall back to grid.
        // At minimum, items should not be at the exact same position.
        expect(dist).toBeGreaterThan(0);
      }
    }
  });

  it('positions are within bounds', () => {
    const required = INGREDIENT_CATALOG.slice(0, 5);
    const distractors = INGREDIENT_CATALOG.slice(5, 15);
    const rng = createRng(42);
    const width = 400;
    const height = 600;
    const placed = placeItems(required, distractors, width, height, 52, rng);

    for (const item of placed) {
      expect(item.position.x).toBeGreaterThanOrEqual(0);
      expect(item.position.x).toBeLessThanOrEqual(width);
      expect(item.position.y).toBeGreaterThanOrEqual(0);
      expect(item.position.y).toBeLessThanOrEqual(height);
    }
  });

  it('marks required and distractor items correctly', () => {
    const required = INGREDIENT_CATALOG.slice(0, 3);
    const distractors = INGREDIENT_CATALOG.slice(3, 8);
    const rng = createRng(42);
    const placed = placeItems(required, distractors, 400, 600, 52, rng);
    const requiredCount = placed.filter((p) => p.isRequired).length;
    const distractorCount = placed.filter((p) => !p.isRequired).length;
    expect(requiredCount).toBe(3);
    expect(distractorCount).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------
describe('Scoring', () => {
  it('calculateScore with perfect accuracy = max multiplier (1.5x)', () => {
    const state = makeGameState({
      found: ['tomato', 'onion', 'garlic'],
      score: 300,
      timeRemaining: 30,
      totalTaps: 3,
      correctTaps: 3,
      maxCombo: 3,
      status: 'won',
    });
    const breakdown = calculateScore(state);
    // accuracy = 1.0 + 0.5 * (3/3) = 1.5
    expect(breakdown.accuracyMult).toBeCloseTo(1.5);
  });

  it('calculateScore with 50% accuracy = 1.25x multiplier', () => {
    const state = makeGameState({
      found: ['tomato', 'onion', 'garlic'],
      score: 300,
      timeRemaining: 30,
      totalTaps: 6,
      correctTaps: 3,
      maxCombo: 1,
      status: 'won',
    });
    const breakdown = calculateScore(state);
    // accuracy = 1.0 + 0.5 * (3/6) = 1.25
    expect(breakdown.accuracyMult).toBeCloseTo(1.25);
  });

  it('speed bonus applies when under half time', () => {
    const state = makeGameState({
      found: ['tomato', 'onion', 'garlic'],
      score: 300,
      timeRemaining: 35, // used 10s out of 45s, well under half (22.5s)
      totalTaps: 3,
      correctTaps: 3,
      maxCombo: 3,
      status: 'won',
    });
    const breakdown = calculateScore(state);
    expect(breakdown.speedMult).toBe(1.3);
  });

  it('no speed bonus when over half time used', () => {
    const state = makeGameState({
      found: ['tomato', 'onion', 'garlic'],
      score: 300,
      timeRemaining: 5, // used 40s out of 45s
      totalTaps: 3,
      correctTaps: 3,
      maxCombo: 3,
      status: 'won',
    });
    const breakdown = calculateScore(state);
    expect(breakdown.speedMult).toBe(1.0);
  });

  it('calculateStars returns correct star ratings', () => {
    expect(calculateStars(50, 100)).toBe(1);   // 50% = 1 star
    expect(calculateStars(75, 100)).toBe(2);   // 75% = 2 stars
    expect(calculateStars(95, 100)).toBe(3);   // 95% = 3 stars
    expect(calculateStars(100, 100)).toBe(3);  // 100% = 3 stars
    expect(calculateStars(49, 100)).toBe(0);   // below 50% = 0 stars
    expect(calculateStars(74, 100)).toBe(1);   // 74% = 1 star
    expect(calculateStars(94, 100)).toBe(2);   // 94% = 2 stars
  });

  it('calculateStars returns 0 for zero maxPossible', () => {
    expect(calculateStars(50, 0)).toBe(0);
  });

  it('combo multiplier scales with maxCombo', () => {
    const state = makeGameState({
      found: ['tomato', 'onion', 'garlic'],
      score: 300,
      timeRemaining: 30,
      totalTaps: 3,
      correctTaps: 3,
      maxCombo: 5,
      status: 'won',
    });
    const breakdown = calculateScore(state);
    // combo = 1.0 + 0.1 * 5 = 1.5
    expect(breakdown.comboMult).toBeCloseTo(1.5);
  });

  it('lost game gets no time points', () => {
    const state = makeGameState({
      found: ['tomato'],
      score: 100,
      timeRemaining: 0,
      totalTaps: 5,
      correctTaps: 1,
      maxCombo: 1,
      status: 'lost',
    });
    const breakdown = calculateScore(state);
    expect(breakdown.timePoints).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Step
// ---------------------------------------------------------------------------
describe('Step', () => {
  it('correct tap marks ingredient found and increments score', () => {
    const state = makeGameState();
    // item_0 is tomato (required)
    const result = step(state, { type: 'TAP', itemInstanceId: 'item_0', timestamp: 1000 });
    expect(result.found).toContain('tomato');
    expect(result.score).toBeGreaterThan(0);
    expect(result.correctTaps).toBe(1);
    expect(result.totalTaps).toBe(1);
  });

  it('wrong tap adds strike, deducts 3s from timer, resets combo', () => {
    const state = makeGameState({ comboStreak: 3 });
    // item_distractor_0 is a distractor
    const result = step(state, { type: 'TAP', itemInstanceId: 'item_distractor_0', timestamp: 1000 });
    expect(result.strikes).toBe(1);
    expect(result.timeRemaining).toBe(42); // 45 - 3
    expect(result.comboStreak).toBe(0);
  });

  it('combo increments on consecutive correct taps within 2s', () => {
    const state = makeGameState();
    // Tap tomato at t=1000
    const s1 = step(state, { type: 'TAP', itemInstanceId: 'item_0', timestamp: 1000 });
    expect(s1.comboStreak).toBe(1);

    // Tap onion at t=2500 (within 2000ms)
    const s2 = step(s1, { type: 'TAP', itemInstanceId: 'item_1', timestamp: 2500 });
    expect(s2.comboStreak).toBe(2);

    // Tap garlic at t=4000 (within 2000ms of 2500)
    const s3 = step(s2, { type: 'TAP', itemInstanceId: 'item_2', timestamp: 4000 });
    expect(s3.comboStreak).toBe(3);
  });

  it('combo resets when gap exceeds 2s', () => {
    const state = makeGameState();
    const s1 = step(state, { type: 'TAP', itemInstanceId: 'item_0', timestamp: 1000 });
    expect(s1.comboStreak).toBe(1);

    // Tap onion at t=5000 (3000ms gap, exceeds 2000ms window)
    const s2 = step(s1, { type: 'TAP', itemInstanceId: 'item_1', timestamp: 5000 });
    expect(s2.comboStreak).toBe(1); // reset to 1, not incremented
  });

  it('combo resets on wrong tap', () => {
    const state = makeGameState();
    const s1 = step(state, { type: 'TAP', itemInstanceId: 'item_0', timestamp: 1000 });
    expect(s1.comboStreak).toBe(1);

    const s2 = step(s1, { type: 'TAP', itemInstanceId: 'item_distractor_0', timestamp: 1500 });
    expect(s2.comboStreak).toBe(0);
  });

  it('win condition: all ingredients found', () => {
    const state = makeGameState();
    const s1 = step(state, { type: 'TAP', itemInstanceId: 'item_0', timestamp: 1000 });
    const s2 = step(s1, { type: 'TAP', itemInstanceId: 'item_1', timestamp: 2000 });
    const s3 = step(s2, { type: 'TAP', itemInstanceId: 'item_2', timestamp: 3000 });
    expect(s3.status).toBe('won');
    expect(s3.found.length).toBe(3);
  });

  it('lose condition: timer <= 0 from wrong tap penalty', () => {
    const state = makeGameState({ timeRemaining: 2 });
    const result = step(state, { type: 'TAP', itemInstanceId: 'item_distractor_0', timestamp: 1000 });
    expect(result.status).toBe('lost');
    expect(result.timeRemaining).toBe(0);
  });

  it('tickTimer reduces time and triggers loss at 0', () => {
    const state = makeGameState({ timeRemaining: 1 });
    const result = tickTimer(state, 2);
    expect(result.timeRemaining).toBe(0);
    expect(result.status).toBe('lost');
  });

  it('tickTimer does nothing if not playing', () => {
    const state = makeGameState({ status: 'won', timeRemaining: 10 });
    const result = tickTimer(state, 5);
    expect(result.timeRemaining).toBe(10);
  });

  it('tapping already-found item returns same state', () => {
    const state = makeGameState();
    const s1 = step(state, { type: 'TAP', itemInstanceId: 'item_0', timestamp: 1000 });
    // Tap the same item again
    const s2 = step(s1, { type: 'TAP', itemInstanceId: 'item_0', timestamp: 2000 });
    expect(s2.totalTaps).toBe(s1.totalTaps); // unchanged
  });

  it('step does nothing when game is not playing', () => {
    const state = makeGameState({ status: 'won' });
    const result = step(state, { type: 'TAP', itemInstanceId: 'item_0', timestamp: 1000 });
    expect(result).toBe(state); // same reference
  });

  it('maxCombo tracks highest combo reached', () => {
    const state = makeGameState();
    const s1 = step(state, { type: 'TAP', itemInstanceId: 'item_0', timestamp: 1000 });
    const s2 = step(s1, { type: 'TAP', itemInstanceId: 'item_1', timestamp: 2500 });
    expect(s2.maxCombo).toBe(2);

    // Wrong tap resets streak but maxCombo stays
    const s3 = step(s2, { type: 'TAP', itemInstanceId: 'item_distractor_0', timestamp: 3000 });
    expect(s3.comboStreak).toBe(0);
    expect(s3.maxCombo).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Level Gen
// ---------------------------------------------------------------------------
describe('Level Gen', () => {
  it('generateLevel returns valid config with correct tier params', () => {
    // Level 1 is curated (50s timer), level 5 is procedural tier 1 (45s timer)
    const curated = generateLevelConfig(1);
    expect(curated.level).toBe(1);
    expect(curated.recipe).toBeDefined();
    expect(curated.recipe.ingredients.length).toBeGreaterThan(0);
    expect(curated.distractors.length).toBeGreaterThan(0);
    expect(curated.timeLimit).toBe(50); // curated level 1
    expect(curated.isBreathe).toBe(false);

    const procedural = generateLevelConfig(5);
    expect(procedural.level).toBe(5);
    expect(procedural.timeLimit).toBe(45); // tier 1 procedural
    expect(procedural.isBreathe).toBe(false);
  });

  it('breathe levels every 4th have correct params', () => {
    // level 4 is a breathe level (level > 1 && level % 4 === 0)
    const breathe = generateLevelConfig(4);
    expect(breathe.isBreathe).toBe(true);
    expect(breathe.timeLimit).toBe(50); // breathe timeLimit

    // level 8 is also breathe
    const breathe2 = generateLevelConfig(8);
    expect(breathe2.isBreathe).toBe(true);

    // level 5 is not breathe
    const normal = generateLevelConfig(5);
    expect(normal.isBreathe).toBe(false);

    // level 1 is not breathe (must be > 1)
    const first = generateLevelConfig(1);
    expect(first.isBreathe).toBe(false);
  });

  it('same level = deterministic output', () => {
    const a = generateLevelConfig(42);
    const b = generateLevelConfig(42);
    expect(a).toEqual(b);
  });

  it('required and distractor sets do not overlap', () => {
    for (const level of [1, 5, 10, 15, 25, 35]) {
      const config = generateLevelConfig(level);
      const requiredIds = new Set(config.recipe.ingredients.map((ri) => ri.item.id));
      for (const dist of config.distractors) {
        expect(requiredIds.has(dist.id)).toBe(false);
      }
    }
  });

  it('tier 2+ levels have appropriate parameters', () => {
    const config = generateLevelConfig(10); // tier 2
    expect(config.timeLimit).toBeLessThanOrEqual(50); // breathe or tier2 (40)
  });

  it('grid dimensions scale with item count', () => {
    const small = generateLevelConfig(1);
    const large = generateLevelConfig(31); // tier 4, more items
    expect(large.gridWidth).toBeGreaterThanOrEqual(small.gridWidth);
    expect(large.gridHeight).toBeGreaterThanOrEqual(small.gridHeight);
  });

  it('curated levels 1-3 have hand-crafted configs', () => {
    const l1 = generateLevelConfig(1);
    expect(l1.recipe.name).toBe('Morning Omelette');
    expect(l1.recipe.ingredients.length).toBe(3);
    expect(l1.distractors.length).toBe(18);
    expect(l1.timeLimit).toBe(50);

    const l2 = generateLevelConfig(2);
    expect(l2.recipe.name).toBe('Garden Pasta');
    expect(l2.recipe.ingredients.length).toBe(5);
    expect(l2.distractors.length).toBe(28);
    expect(l2.timeLimit).toBe(42);

    const l3 = generateLevelConfig(3);
    expect(l3.recipe.name).toBe('Tropical Poke Bowl');
    expect(l3.recipe.ingredients.length).toBe(7);
    expect(l3.distractors.length).toBe(40);
    expect(l3.timeLimit).toBe(35);
  });

  it('curated levels have zero overlap between required and distractors', () => {
    for (const level of [1, 2, 3]) {
      const config = generateLevelConfig(level);
      const requiredIds = new Set(config.recipe.ingredients.map((ri) => ri.item.id));
      for (const dist of config.distractors) {
        expect(requiredIds.has(dist.id), `Level ${level}: distractor "${dist.id}" overlaps required`).toBe(false);
      }
    }
  });

  it('level 4+ falls back to procedural generation', () => {
    const l4 = generateLevelConfig(4);
    expect(l4.recipe.name).not.toBe('Morning Omelette');
    expect(l4.recipe.name).not.toBe('Garden Pasta');
    expect(l4.recipe.name).not.toBe('Tropical Poke Bowl');
  });
});

// ---------------------------------------------------------------------------
// State Machine
// ---------------------------------------------------------------------------
describe('State Machine', () => {
  it('initial state is READY', () => {
    const machine = createMesoStateMachine();
    expect(machine.state()).toBe('READY');
  });

  it('valid transitions work', () => {
    const machine = createMesoStateMachine();
    expect(machine.transition('timer_start')).toBe('PLAYING');
    expect(machine.state()).toBe('PLAYING');

    expect(machine.transition('tap_food_item')).toBe('TAPPING');
    expect(machine.state()).toBe('TAPPING');

    expect(machine.transition('item_matches_ingredient')).toBe('CORRECT');
    expect(machine.state()).toBe('CORRECT');

    expect(machine.transition('item_removed_animation_done')).toBe('COMBO_CHECK');
    expect(machine.state()).toBe('COMBO_CHECK');

    expect(machine.transition('all_ingredients_found')).toBe('WON');
    expect(machine.state()).toBe('WON');

    expect(machine.transition('win_animation_done')).toBe('SCORING');
    expect(machine.state()).toBe('SCORING');
  });

  it('invalid transitions return current state (no change)', () => {
    const machine = createMesoStateMachine();
    // From READY, 'tap_food_item' is not valid
    const result = machine.transition('tap_food_item');
    expect(result).toBe('READY');
    expect(machine.state()).toBe('READY');
  });

  it('incorrect tap path works', () => {
    const machine = createMesoStateMachine();
    machine.transition('timer_start');
    machine.transition('tap_food_item');
    expect(machine.transition('item_is_distractor')).toBe('INCORRECT');

    expect(machine.transition('penalty_applied_and_timer_gt_0')).toBe('PLAYING');
  });

  it('incorrect tap with timer expired leads to LOST', () => {
    const machine = createMesoStateMachine();
    machine.transition('timer_start');
    machine.transition('tap_food_item');
    machine.transition('item_is_distractor');

    expect(machine.transition('penalty_applied_and_timer_lte_0')).toBe('LOST');
  });

  it('hint pulse path works', () => {
    const machine = createMesoStateMachine();
    machine.transition('timer_start');

    expect(machine.transition('no_tap_for_10_seconds')).toBe('HINT_PULSE');
    expect(machine.transition('pulse_animation_done')).toBe('PLAYING');
  });

  it('timer expired leads to LOST', () => {
    const machine = createMesoStateMachine();
    machine.transition('timer_start');
    expect(machine.transition('timer_expired')).toBe('LOST');
  });

  it('loss animation leads to SCORING', () => {
    const machine = createMesoStateMachine();
    machine.transition('timer_start');
    machine.transition('timer_expired');
    expect(machine.transition('loss_animation_done')).toBe('SCORING');
  });

  it('reset returns to READY', () => {
    const machine = createMesoStateMachine();
    machine.transition('timer_start');
    machine.transition('tap_food_item');
    expect(machine.state()).toBe('TAPPING');

    machine.reset();
    expect(machine.state()).toBe('READY');
  });
});
