/**
 * Recipe Hunt Engine — Barrel Export
 */

export type {
  Ingredient,
  RecipeIngredient,
  Recipe,
  Position,
  PlacedItem,
  LevelConfig,
  GameState,
  Action,
} from './types';

export { createRng, shuffle } from './rng';

export { INGREDIENT_CATALOG, CATALOG_MAP, LOOK_ALIKES, getLookAlikes } from './catalog';

export {
  RECIPE_DATABASE,
  TIER_RECIPES,
  getTierForLevel,
  getTierParams,
  getBreatheParams,
  getTierName,
} from './recipes';

export { placeItems } from './layout';

export { calculateScore, calculateStars, estimateMaxScore } from './scoring';
export type { ScoreBreakdown } from './scoring';

export { step, tickTimer } from './step';

export { generateLevelConfig } from './levelGen';

export { CURATED_LEVELS, isCuratedLevel, getCuratedLevel } from './curatedLevels';

export { createMesoStateMachine } from './stateMachine';
export type { MesoState, MesoEvent, MesoStateMachine } from './stateMachine';
