/**
 * Recipe Hunt — Recipe Database (25 recipes across 4 tiers)
 *
 * Tier 1 (Sous Chef):  3 ingredients — levels 1-5
 * Tier 2 (Line Cook):  5 ingredients — levels 6-15
 * Tier 3 (Head Chef):  6-8 ingredients — levels 16-30
 * Tier 4 (Master Chef): 8-10 ingredients — levels 31+
 */

import type { Recipe } from './types';
import { CATALOG_MAP } from './catalog';

/** Shorthand: look up ingredient by id and wrap with quantity. */
function ing(id: string, quantity: number = 1) {
  const item = CATALOG_MAP[id];
  if (!item) throw new Error(`Unknown ingredient: ${id}`);
  return { item, quantity };
}

// ---------------------------------------------------------------------------
// Tier 1 — Sous Chef (3 ingredients)
// ---------------------------------------------------------------------------

const TIER_1: Recipe[] = [
  {
    id: 'tomato_soup',
    name: 'Tomato Soup',
    ingredients: [ing('tomato'), ing('onion'), ing('garlic')],
    dishEmoji: '🍲',
  },
  {
    id: 'fruit_salad',
    name: 'Fruit Salad',
    ingredients: [ing('apple'), ing('banana'), ing('strawberry')],
    dishEmoji: '🥗',
  },
  {
    id: 'scrambled_eggs',
    name: 'Scrambled Eggs',
    ingredients: [ing('egg'), ing('butter'), ing('salt')],
    dishEmoji: '🍳',
  },
  {
    id: 'toast_honey',
    name: 'Honey Toast',
    ingredients: [ing('bread'), ing('honey'), ing('butter')],
    dishEmoji: '🍞',
  },
  {
    id: 'simple_salad',
    name: 'Simple Salad',
    ingredients: [ing('lettuce'), ing('tomato'), ing('cucumber')],
    dishEmoji: '🥗',
  },
  {
    id: 'cheese_plate',
    name: 'Cheese Plate',
    ingredients: [ing('cheese'), ing('grape'), ing('bread')],
    dishEmoji: '🧀',
  },
];

// ---------------------------------------------------------------------------
// Tier 2 — Line Cook (5 ingredients)
// ---------------------------------------------------------------------------

const TIER_2: Recipe[] = [
  {
    id: 'veggie_stir_fry',
    name: 'Veggie Stir Fry',
    ingredients: [ing('pepper'), ing('broccoli'), ing('carrot'), ing('mushroom'), ing('soy_sauce')],
    dishEmoji: '🥘',
  },
  {
    id: 'pasta_pomodoro',
    name: 'Pasta Pomodoro',
    ingredients: [ing('pasta'), ing('tomato'), ing('garlic'), ing('oil'), ing('herb')],
    dishEmoji: '🍝',
  },
  {
    id: 'chicken_rice',
    name: 'Chicken & Rice',
    ingredients: [ing('chicken'), ing('rice'), ing('onion'), ing('garlic'), ing('salt')],
    dishEmoji: '🍗',
  },
  {
    id: 'fish_tacos',
    name: 'Fish Tacos',
    ingredients: [ing('fish'), ing('tortilla'), ing('lettuce'), ing('lemon'), ing('hot_pepper')],
    dishEmoji: '🌮',
  },
  {
    id: 'banana_pancakes',
    name: 'Banana Pancakes',
    ingredients: [ing('banana'), ing('egg'), ing('pancake'), ing('honey'), ing('butter')],
    dishEmoji: '🥞',
  },
  {
    id: 'greek_salad',
    name: 'Greek Salad',
    ingredients: [ing('cucumber'), ing('tomato'), ing('onion'), ing('oil'), ing('cheese')],
    dishEmoji: '🥗',
  },
  {
    id: 'mushroom_soup',
    name: 'Mushroom Soup',
    ingredients: [ing('mushroom'), ing('onion'), ing('garlic'), ing('butter'), ing('herb')],
    dishEmoji: '🍲',
  },
];

// ---------------------------------------------------------------------------
// Tier 3 — Head Chef (6-8 ingredients)
// ---------------------------------------------------------------------------

const TIER_3: Recipe[] = [
  {
    id: 'shrimp_pasta',
    name: 'Shrimp Pasta',
    ingredients: [ing('shrimp'), ing('pasta'), ing('garlic'), ing('lemon'), ing('butter'), ing('herb')],
    dishEmoji: '🍝',
  },
  {
    id: 'beef_stew',
    name: 'Beef Stew',
    ingredients: [ing('meat'), ing('potato'), ing('carrot'), ing('onion'), ing('garlic'), ing('herb'), ing('salt')],
    dishEmoji: '🍲',
  },
  {
    id: 'veggie_curry',
    name: 'Veggie Curry',
    ingredients: [ing('potato'), ing('onion'), ing('garlic'), ing('ginger'), ing('hot_pepper'), ing('rice'), ing('oil')],
    dishEmoji: '🍛',
  },
  {
    id: 'breakfast_platter',
    name: 'Breakfast Platter',
    ingredients: [ing('egg'), ing('bacon'), ing('bread'), ing('tomato'), ing('mushroom'), ing('butter')],
    dishEmoji: '🍳',
  },
  {
    id: 'poke_bowl',
    name: 'Poke Bowl',
    ingredients: [ing('fish'), ing('rice'), ing('avocado'), ing('cucumber'), ing('soy_sauce'), ing('ginger'), ing('lemon')],
    dishEmoji: '🥢',
  },
  {
    id: 'ratatouille',
    name: 'Ratatouille',
    ingredients: [ing('eggplant'), ing('pepper'), ing('tomato'), ing('onion'), ing('garlic'), ing('oil'), ing('herb'), ing('salt')],
    dishEmoji: '🥘',
  },
];

// ---------------------------------------------------------------------------
// Tier 4 — Master Chef (8-10 ingredients)
// ---------------------------------------------------------------------------

const TIER_4: Recipe[] = [
  {
    id: 'seafood_paella',
    name: 'Seafood Paella',
    ingredients: [ing('shrimp'), ing('fish'), ing('rice'), ing('onion'), ing('garlic'), ing('pepper'), ing('lemon'), ing('oil'), ing('salt'), ing('herb')],
    dishEmoji: '🥘',
  },
  {
    id: 'loaded_burger',
    name: 'Loaded Burger',
    ingredients: [ing('meat'), ing('bread'), ing('cheese'), ing('lettuce'), ing('tomato'), ing('onion'), ing('cucumber'), ing('ketchup'), ing('egg')],
    dishEmoji: '🍔',
  },
  {
    id: 'thanksgiving_feast',
    name: 'Thanksgiving Feast',
    ingredients: [ing('turkey'), ing('potato'), ing('corn'), ing('carrot'), ing('onion'), ing('butter'), ing('herb'), ing('salt'), ing('pie')],
    dishEmoji: '🦃',
  },
  {
    id: 'sushi_platter',
    name: 'Sushi Platter',
    ingredients: [ing('fish'), ing('shrimp'), ing('rice'), ing('avocado'), ing('cucumber'), ing('soy_sauce'), ing('ginger'), ing('lemon'), ing('salt')],
    dishEmoji: '🍣',
  },
  {
    id: 'chocolate_cake',
    name: 'Chocolate Cake',
    ingredients: [ing('chocolate'), ing('egg'), ing('butter'), ing('milk'), ing('honey'), ing('salt'), ing('cookie'), ing('peanut')],
    dishEmoji: '🎂',
  },
  {
    id: 'lobster_dinner',
    name: 'Lobster Dinner',
    ingredients: [ing('lobster'), ing('butter'), ing('lemon'), ing('garlic'), ing('potato'), ing('corn'), ing('herb'), ing('salt'), ing('oil')],
    dishEmoji: '🦞',
  },
];

// ---------------------------------------------------------------------------
// Combined database
// ---------------------------------------------------------------------------

export const RECIPE_DATABASE: Recipe[] = [...TIER_1, ...TIER_2, ...TIER_3, ...TIER_4];

/** Tier boundaries: which recipes belong to which difficulty tier. */
export const TIER_RECIPES: Record<number, Recipe[]> = {
  1: TIER_1,
  2: TIER_2,
  3: TIER_3,
  4: TIER_4,
};

/** Get the tier for a given level number. */
export function getTierForLevel(level: number): number {
  if (level <= 5) return 1;
  if (level <= 15) return 2;
  if (level <= 30) return 3;
  return 4;
}

/** Get difficulty parameters for a tier. */
export function getTierParams(tier: number): {
  requiredCount: number;
  distractorCount: number;
  timeLimit: number;
  lookAlikeCount: number;
} {
  switch (tier) {
    case 1:
      return { requiredCount: 3, distractorCount: 20, timeLimit: 45, lookAlikeCount: 0 };
    case 2:
      return { requiredCount: 5, distractorCount: 35, timeLimit: 40, lookAlikeCount: 2 };
    case 3:
      return { requiredCount: 7, distractorCount: 50, timeLimit: 35, lookAlikeCount: 4 };
    case 4:
    default:
      return { requiredCount: 10, distractorCount: 60, timeLimit: 30, lookAlikeCount: 6 };
  }
}

/** Get the chef tier name for a given level number. */
export function getTierName(level: number): string {
  const tier = getTierForLevel(level);
  switch (tier) {
    case 1: return 'Sous Chef';
    case 2: return 'Line Cook';
    case 3: return 'Head Chef';
    case 4: return 'Master Chef';
    default: return 'Chef';
  }
}

/** Get breathe-level parameters (every 4th level). */
export function getBreatheParams(): {
  requiredCount: number;
  distractorCount: number;
  timeLimit: number;
  lookAlikeCount: number;
} {
  return { requiredCount: 3, distractorCount: 15, timeLimit: 50, lookAlikeCount: 0 };
}
