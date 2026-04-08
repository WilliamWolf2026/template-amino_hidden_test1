/**
 * Recipe Hunt — Level Generation
 *
 * Forward-construction strategy with set-intersection-check solver.
 * Pure — seeded RNG, deterministic output.
 */

import type { Ingredient, LevelConfig } from './types';
import { INGREDIENT_CATALOG, getLookAlikes } from './catalog';
import { TIER_RECIPES, getTierForLevel, getTierParams, getBreatheParams } from './recipes';
import { createRng, shuffle } from './rng';
import { getCuratedLevel } from './curatedLevels';

/**
 * Generate a level configuration for a given level number.
 * Levels 1-3 use hand-crafted curated configs for a great first experience.
 * All other levels use procedural generation, deterministic from seed.
 */
export function generateLevelConfig(level: number): LevelConfig {
  // Use curated level if available (levels 1-3)
  const curated = getCuratedLevel(level);
  if (curated) return curated;

  const seed = level * 7919 + 42; // deterministic seed from level
  const rng = createRng(seed);

  const isBreathe = level > 1 && level % 4 === 0;
  const tier = getTierForLevel(level);
  const params = isBreathe ? getBreatheParams() : getTierParams(tier);

  // Pick a recipe from the appropriate tier
  const tierRecipes = isBreathe ? TIER_RECIPES[1]! : (TIER_RECIPES[tier] ?? TIER_RECIPES[1]!);
  const recipeIndex = Math.floor(rng() * tierRecipes.length);
  const recipe = tierRecipes[recipeIndex]!;

  // Build the required set of ingredient ids
  const requiredIds = new Set(recipe.ingredients.map((ri) => ri.item.id));

  // Select distractors
  const distractors = selectDistractors(
    requiredIds,
    params.distractorCount,
    params.lookAlikeCount,
    rng,
  );

  // Determine play area size based on total item count
  const totalItems = recipe.ingredients.length + distractors.length;
  const gridWidth = Math.max(320, Math.min(600, 40 + totalItems * 8));
  const gridHeight = Math.max(480, Math.min(1200, 100 + totalItems * 14));

  return {
    level,
    recipe,
    distractors,
    timeLimit: params.timeLimit,
    gridWidth,
    gridHeight,
    seed,
    isBreathe,
  };
}

/**
 * Select distractor ingredients ensuring zero intersection with required set.
 */
function selectDistractors(
  requiredIds: Set<string>,
  count: number,
  lookAlikeSlots: number,
  rng: () => number,
): Ingredient[] {
  const available = INGREDIENT_CATALOG.filter((ing) => !requiredIds.has(ing.id));
  const result: Ingredient[] = [];
  const usedIds = new Set<string>();

  // First, try to fill look-alike slots from confusable items
  if (lookAlikeSlots > 0) {
    const lookAlikeCandidates: Ingredient[] = [];
    for (const reqId of requiredIds) {
      const alikes = getLookAlikes(reqId);
      for (const alikeId of alikes) {
        if (!requiredIds.has(alikeId) && !usedIds.has(alikeId)) {
          const ing = available.find((i) => i.id === alikeId);
          if (ing) lookAlikeCandidates.push(ing);
        }
      }
    }
    shuffle(lookAlikeCandidates, rng);
    for (let i = 0; i < Math.min(lookAlikeSlots, lookAlikeCandidates.length); i++) {
      const ing = lookAlikeCandidates[i]!;
      result.push(ing);
      usedIds.add(ing.id);
    }
  }

  // Fill remaining slots with random distractors (may repeat ingredient types for density)
  const remainingPool = available.filter((ing) => !usedIds.has(ing.id));
  shuffle(remainingPool, rng);

  let poolIdx = 0;
  while (result.length < count) {
    if (remainingPool.length === 0) break;
    result.push(remainingPool[poolIdx % remainingPool.length]!);
    poolIdx++;
  }

  // Shuffle final order
  shuffle(result, rng);

  return result;
}
