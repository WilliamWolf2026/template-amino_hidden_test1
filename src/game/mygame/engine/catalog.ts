/**
 * Recipe Hunt — Food Ingredient Catalog (~80 items)
 *
 * Every ingredient the game can reference. Look-alike groups drive
 * distractor selection at higher difficulty tiers.
 */

import type { Ingredient } from './types';

export const INGREDIENT_CATALOG: Ingredient[] = [
  // ── Vegetables ──────────────────────────────────────────────────────
  { id: 'tomato', displayName: 'Tomato', emoji: '🍅', category: 'vegetable' },
  { id: 'onion', displayName: 'Onion', emoji: '🧅', category: 'vegetable' },
  { id: 'garlic', displayName: 'Garlic', emoji: '🧄', category: 'vegetable' },
  { id: 'carrot', displayName: 'Carrot', emoji: '🥕', category: 'vegetable' },
  { id: 'broccoli', displayName: 'Broccoli', emoji: '🥦', category: 'vegetable' },
  { id: 'corn', displayName: 'Corn', emoji: '🌽', category: 'vegetable' },
  { id: 'potato', displayName: 'Potato', emoji: '🥔', category: 'vegetable' },
  { id: 'pepper', displayName: 'Bell Pepper', emoji: '🫑', category: 'vegetable' },
  { id: 'hot_pepper', displayName: 'Hot Pepper', emoji: '🌶️', category: 'vegetable' },
  { id: 'cucumber', displayName: 'Cucumber', emoji: '🥒', category: 'vegetable' },
  { id: 'lettuce', displayName: 'Lettuce', emoji: '🥬', category: 'vegetable' },
  { id: 'mushroom', displayName: 'Mushroom', emoji: '🍄', category: 'vegetable' },
  { id: 'eggplant', displayName: 'Eggplant', emoji: '🍆', category: 'vegetable' },
  { id: 'sweet_potato', displayName: 'Sweet Potato', emoji: '🍠', category: 'vegetable' },
  { id: 'leafy_green', displayName: 'Leafy Green', emoji: '🥗', category: 'vegetable' },
  { id: 'beans', displayName: 'Beans', emoji: '🫘', category: 'vegetable' },
  { id: 'peas', displayName: 'Peas', emoji: '🟢', category: 'vegetable' },

  // ── Fruits ──────────────────────────────────────────────────────────
  { id: 'apple', displayName: 'Apple', emoji: '🍎', category: 'fruit' },
  { id: 'green_apple', displayName: 'Green Apple', emoji: '🍏', category: 'fruit' },
  { id: 'banana', displayName: 'Banana', emoji: '🍌', category: 'fruit' },
  { id: 'orange', displayName: 'Orange', emoji: '🍊', category: 'fruit' },
  { id: 'lemon', displayName: 'Lemon', emoji: '🍋', category: 'fruit' },
  { id: 'lime', displayName: 'Lime', emoji: '🍈', category: 'fruit' },
  { id: 'grape', displayName: 'Grapes', emoji: '🍇', category: 'fruit' },
  { id: 'strawberry', displayName: 'Strawberry', emoji: '🍓', category: 'fruit' },
  { id: 'blueberry', displayName: 'Blueberry', emoji: '🫐', category: 'fruit' },
  { id: 'cherry', displayName: 'Cherry', emoji: '🍒', category: 'fruit' },
  { id: 'peach', displayName: 'Peach', emoji: '🍑', category: 'fruit' },
  { id: 'pear', displayName: 'Pear', emoji: '🍐', category: 'fruit' },
  { id: 'watermelon', displayName: 'Watermelon', emoji: '🍉', category: 'fruit' },
  { id: 'pineapple', displayName: 'Pineapple', emoji: '🍍', category: 'fruit' },
  { id: 'coconut', displayName: 'Coconut', emoji: '🥥', category: 'fruit' },
  { id: 'mango', displayName: 'Mango', emoji: '🥭', category: 'fruit' },
  { id: 'kiwi', displayName: 'Kiwi', emoji: '🥝', category: 'fruit' },
  { id: 'avocado', displayName: 'Avocado', emoji: '🥑', category: 'fruit' },
  { id: 'melon', displayName: 'Melon', emoji: '🍈', category: 'fruit' },

  // ── Protein ─────────────────────────────────────────────────────────
  { id: 'meat', displayName: 'Meat', emoji: '🥩', category: 'protein' },
  { id: 'chicken', displayName: 'Chicken', emoji: '🍗', category: 'protein' },
  { id: 'bacon', displayName: 'Bacon', emoji: '🥓', category: 'protein' },
  { id: 'egg', displayName: 'Egg', emoji: '🥚', category: 'protein' },
  { id: 'shrimp', displayName: 'Shrimp', emoji: '🦐', category: 'protein' },
  { id: 'fish', displayName: 'Fish', emoji: '🐟', category: 'protein' },
  { id: 'crab', displayName: 'Crab', emoji: '🦀', category: 'protein' },
  { id: 'squid', displayName: 'Squid', emoji: '🦑', category: 'protein' },
  { id: 'lobster', displayName: 'Lobster', emoji: '🦞', category: 'protein' },
  { id: 'turkey', displayName: 'Turkey', emoji: '🦃', category: 'protein' },

  // ── Dairy ───────────────────────────────────────────────────────────
  { id: 'cheese', displayName: 'Cheese', emoji: '🧀', category: 'dairy' },
  { id: 'butter', displayName: 'Butter', emoji: '🧈', category: 'dairy' },
  { id: 'milk', displayName: 'Milk', emoji: '🥛', category: 'dairy' },
  { id: 'ice_cream', displayName: 'Ice Cream', emoji: '🍦', category: 'dairy' },

  // ── Bread / Grain ───────────────────────────────────────────────────
  { id: 'bread', displayName: 'Bread', emoji: '🍞', category: 'grain' },
  { id: 'rice', displayName: 'Rice', emoji: '🍚', category: 'grain' },
  { id: 'pasta', displayName: 'Pasta', emoji: '🍝', category: 'grain' },
  { id: 'baguette', displayName: 'Baguette', emoji: '🥖', category: 'grain' },
  { id: 'croissant', displayName: 'Croissant', emoji: '🥐', category: 'grain' },
  { id: 'pancake', displayName: 'Pancake', emoji: '🥞', category: 'grain' },
  { id: 'waffle', displayName: 'Waffle', emoji: '🧇', category: 'grain' },
  { id: 'pretzel', displayName: 'Pretzel', emoji: '🥨', category: 'grain' },
  { id: 'flatbread', displayName: 'Flatbread', emoji: '🫓', category: 'grain' },
  { id: 'tortilla', displayName: 'Tortilla', emoji: '🌮', category: 'grain' },

  // ── Spice / Herb ────────────────────────────────────────────────────
  { id: 'salt', displayName: 'Salt', emoji: '🧂', category: 'spice' },
  { id: 'herb', displayName: 'Herbs', emoji: '🌿', category: 'spice' },
  { id: 'chili', displayName: 'Chili Flakes', emoji: '🌶️', category: 'spice' },
  { id: 'ginger', displayName: 'Ginger', emoji: '🫚', category: 'spice' },

  // ── Sauces / Condiments ─────────────────────────────────────────────
  { id: 'honey', displayName: 'Honey', emoji: '🍯', category: 'condiment' },
  { id: 'oil', displayName: 'Olive Oil', emoji: '🫒', category: 'condiment' },
  { id: 'soy_sauce', displayName: 'Soy Sauce', emoji: '🥫', category: 'condiment' },
  { id: 'vinegar', displayName: 'Vinegar', emoji: '🍶', category: 'condiment' },
  { id: 'ketchup', displayName: 'Ketchup', emoji: '🥫', category: 'condiment' },

  // ── Sweets / Snacks ─────────────────────────────────────────────────
  { id: 'chocolate', displayName: 'Chocolate', emoji: '🍫', category: 'sweet' },
  { id: 'cookie', displayName: 'Cookie', emoji: '🍪', category: 'sweet' },
  { id: 'cake', displayName: 'Cake', emoji: '🍰', category: 'sweet' },
  { id: 'donut', displayName: 'Donut', emoji: '🍩', category: 'sweet' },
  { id: 'candy', displayName: 'Candy', emoji: '🍬', category: 'sweet' },
  { id: 'pie', displayName: 'Pie', emoji: '🥧', category: 'sweet' },
  { id: 'cupcake', displayName: 'Cupcake', emoji: '🧁', category: 'sweet' },

  // ── Nuts / Seeds ────────────────────────────────────────────────────
  { id: 'peanut', displayName: 'Peanut', emoji: '🥜', category: 'nut' },
  { id: 'chestnut', displayName: 'Chestnut', emoji: '🌰', category: 'nut' },

  // ── Beverages (decorative distractors) ──────────────────────────────
  { id: 'tea', displayName: 'Tea', emoji: '🍵', category: 'beverage' },
  { id: 'coffee', displayName: 'Coffee', emoji: '☕', category: 'beverage' },
  { id: 'juice', displayName: 'Juice', emoji: '🧃', category: 'beverage' },
];

/** Index by id for fast lookup. */
export const CATALOG_MAP: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENT_CATALOG.map((ing) => [ing.id, ing]),
);

/**
 * Look-alike groups — items that can be visually confused with each other.
 * Used by the level generator to pick confusing distractors at higher tiers.
 */
export const LOOK_ALIKES: Record<string, string[]> = {
  tomato: ['cherry', 'apple', 'strawberry', 'hot_pepper'],
  cherry: ['tomato', 'apple', 'strawberry'],
  apple: ['peach', 'tomato', 'cherry'],
  green_apple: ['pear', 'kiwi', 'lime', 'avocado'],
  lemon: ['lime', 'pear', 'banana'],
  lime: ['lemon', 'green_apple', 'kiwi'],
  onion: ['garlic', 'potato'],
  garlic: ['onion', 'mushroom'],
  pepper: ['hot_pepper', 'cucumber', 'avocado'],
  hot_pepper: ['pepper', 'chili', 'tomato'],
  cucumber: ['pepper', 'lettuce'],
  lettuce: ['leafy_green', 'broccoli', 'herb'],
  carrot: ['sweet_potato', 'corn'],
  potato: ['sweet_potato', 'coconut', 'onion'],
  sweet_potato: ['potato', 'carrot'],
  mushroom: ['garlic', 'chestnut'],
  peach: ['apple', 'mango', 'orange'],
  orange: ['peach', 'mango', 'lemon'],
  mango: ['peach', 'orange'],
  pear: ['green_apple', 'lemon', 'avocado'],
  banana: ['corn', 'lemon'],
  shrimp: ['crab', 'lobster'],
  crab: ['shrimp', 'lobster'],
  lobster: ['shrimp', 'crab'],
  fish: ['squid'],
  bread: ['baguette', 'flatbread', 'croissant'],
  baguette: ['bread', 'pretzel'],
  egg: ['coconut', 'potato'],
  cheese: ['butter'],
  butter: ['cheese'],
  cookie: ['donut', 'pancake'],
  cake: ['cupcake', 'pie'],
  chocolate: ['cookie', 'candy'],
  meat: ['bacon'],
  bacon: ['meat'],
  chicken: ['turkey'],
  turkey: ['chicken'],
};

/** Get a look-alike list for an ingredient (empty array if none). */
export function getLookAlikes(ingredientId: string): string[] {
  return LOOK_ALIKES[ingredientId] ?? [];
}
