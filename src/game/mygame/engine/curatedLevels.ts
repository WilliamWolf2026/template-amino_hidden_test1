/**
 * Recipe Hunt — Curated Levels
 *
 * Three hand-crafted levels with specific recipes, distractors, and layouts
 * tuned for a great player experience. These replace procedural generation
 * for levels 1-3.
 *
 * Level 1: "Morning Omelette" — Easy intro, 3 ingredients, obvious distractors
 * Level 2: "Garden Pasta" — Medium, 5 ingredients, mild look-alikes
 * Level 3: "Tropical Poke Bowl" — Challenging, 7 ingredients, strong look-alikes
 */

import type { LevelConfig, Ingredient } from './types';
import { CATALOG_MAP } from './catalog';

function get(id: string): Ingredient {
  const ing = CATALOG_MAP[id];
  if (!ing) throw new Error(`Unknown ingredient: ${id}`);
  return ing;
}

// ---------------------------------------------------------------------------
// Level 1 — Morning Omelette (Beginner / Sous Chef)
//
// Theme: Simple breakfast. Player learns the basics: read recipe, tap items.
// 3 ingredients among 18 distractors. No look-alikes. 50s timer (generous).
// Distractors are visually distinct from required items (no confusion).
// ---------------------------------------------------------------------------

const LEVEL_1: LevelConfig = {
  level: 1,
  recipe: {
    id: 'curated_morning_omelette',
    name: 'Morning Omelette',
    ingredients: [
      { item: get('egg'), quantity: 1 },
      { item: get('cheese'), quantity: 1 },
      { item: get('mushroom'), quantity: 1 },
    ],
    dishEmoji: '🍳',
  },
  distractors: [
    // Fruits — clearly not breakfast cooking ingredients
    get('watermelon'), get('pineapple'), get('grape'), get('banana'),
    get('strawberry'), get('cherry'),
    // Sweets — obviously wrong
    get('donut'), get('candy'), get('cake'),
    // Beverages
    get('tea'), get('coffee'), get('juice'),
    // Random non-confusing items
    get('corn'), get('broccoli'), get('rice'), get('pretzel'),
    get('honey'), get('chocolate'),
  ],
  timeLimit: 50,
  gridWidth: 380,
  gridHeight: 650,
  seed: 101,
  isBreathe: false,
};

// ---------------------------------------------------------------------------
// Level 2 — Garden Pasta (Intermediate / Line Cook)
//
// Theme: Fresh Italian garden pasta. 5 ingredients, 28 distractors.
// Introduces mild look-alikes: hot_pepper looks like bell pepper,
// lettuce looks like herb. Timer at 42s — still comfortable.
// Player must scan more carefully and distinguish similar items.
// ---------------------------------------------------------------------------

const LEVEL_2: LevelConfig = {
  level: 2,
  recipe: {
    id: 'curated_garden_pasta',
    name: 'Garden Pasta',
    ingredients: [
      { item: get('pasta'), quantity: 1 },
      { item: get('tomato'), quantity: 1 },
      { item: get('pepper'), quantity: 1 },
      { item: get('garlic'), quantity: 1 },
      { item: get('herb'), quantity: 1 },
    ],
    dishEmoji: '🍝',
  },
  distractors: [
    // Look-alikes (mild confusion)
    get('hot_pepper'),     // looks like bell pepper!
    get('lettuce'),        // looks like herbs!
    get('cherry'),         // red like tomato
    get('onion'),          // allium like garlic
    // Other produce that fills the "market" feel
    get('carrot'), get('broccoli'), get('cucumber'), get('eggplant'),
    get('corn'), get('potato'), get('mushroom'), get('sweet_potato'),
    // Fruits mixed in
    get('apple'), get('orange'), get('lemon'), get('banana'),
    get('grape'), get('strawberry'), get('pear'), get('peach'),
    // Proteins and dairy (clearly not vegetables)
    get('egg'), get('cheese'), get('chicken'), get('fish'),
    // Grains and extras
    get('bread'), get('rice'), get('salt'), get('oil'),
  ],
  timeLimit: 42,
  gridWidth: 420,
  gridHeight: 780,
  seed: 202,
  isBreathe: false,
};

// ---------------------------------------------------------------------------
// Level 3 — Tropical Poke Bowl (Advanced / Head Chef preview)
//
// Theme: Complex fusion dish. 7 ingredients, 40 distractors.
// Strong look-alikes throughout: lemon vs lime, shrimp vs crab vs lobster,
// avocado vs green_apple vs kiwi. Timer at 35s — pressure builds.
// Player must be precise and fast. This level is a taste of Tier 3.
// ---------------------------------------------------------------------------

const LEVEL_3: LevelConfig = {
  level: 3,
  recipe: {
    id: 'curated_tropical_poke',
    name: 'Tropical Poke Bowl',
    ingredients: [
      { item: get('fish'), quantity: 1 },
      { item: get('rice'), quantity: 1 },
      { item: get('avocado'), quantity: 1 },
      { item: get('cucumber'), quantity: 1 },
      { item: get('lemon'), quantity: 1 },
      { item: get('soy_sauce'), quantity: 1 },
      { item: get('ginger'), quantity: 1 },
    ],
    dishEmoji: '🥢',
  },
  distractors: [
    // Strong look-alikes — these are the traps!
    get('lime'),           // looks like lemon!
    get('green_apple'),    // green like avocado!
    get('kiwi'),           // green like avocado!
    get('pear'),           // similar shape to avocado
    get('shrimp'),         // seafood like fish!
    get('crab'),           // seafood like fish!
    get('lobster'),        // seafood like fish!
    get('squid'),          // seafood like fish!
    get('pepper'),         // green like cucumber!
    get('lettuce'),        // green like cucumber!
    get('vinegar'),        // sauce like soy sauce!
    get('ketchup'),        // sauce like soy sauce!
    get('onion'),          // root like ginger!
    get('garlic'),         // root like ginger!
    // More produce to fill the market stall
    get('tomato'), get('carrot'), get('broccoli'), get('corn'),
    get('potato'), get('eggplant'), get('mushroom'), get('hot_pepper'),
    get('banana'), get('orange'), get('apple'), get('strawberry'),
    get('grape'), get('cherry'), get('peach'), get('mango'),
    get('watermelon'), get('pineapple'), get('coconut'), get('blueberry'),
    // Proteins and other
    get('chicken'), get('egg'), get('meat'), get('bacon'),
    get('cheese'), get('butter'),
  ],
  timeLimit: 35,
  gridWidth: 460,
  gridHeight: 900,
  seed: 303,
  isBreathe: false,
};

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** The three curated levels, indexed by level number (1-3). */
export const CURATED_LEVELS: Record<number, LevelConfig> = {
  1: LEVEL_1,
  2: LEVEL_2,
  3: LEVEL_3,
};

/**
 * Check if a level number has a curated (hand-crafted) configuration.
 */
export function isCuratedLevel(level: number): boolean {
  return level in CURATED_LEVELS;
}

/**
 * Get the curated level config, or null if the level is procedural.
 */
export function getCuratedLevel(level: number): LevelConfig | null {
  return CURATED_LEVELS[level] ?? null;
}
