/**
 * Recipe Hunt — Core Types
 *
 * Pure data types for the hidden-object ingredient-finding game.
 */

// ---------------------------------------------------------------------------
// Ingredients & Recipes
// ---------------------------------------------------------------------------

export interface Ingredient {
  id: string;
  displayName: string;
  emoji: string;
  category: string;
}

export interface RecipeIngredient {
  item: Ingredient;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  dishEmoji: string;
}

// ---------------------------------------------------------------------------
// Play Area
// ---------------------------------------------------------------------------

export interface Position {
  x: number;
  y: number;
}

export interface PlacedItem {
  id: string;
  ingredient: Ingredient;
  position: Position;
  found: boolean;
  isRequired: boolean;
}

// ---------------------------------------------------------------------------
// Level Configuration
// ---------------------------------------------------------------------------

export interface LevelConfig {
  level: number;
  recipe: Recipe;
  distractors: Ingredient[];
  timeLimit: number;
  gridWidth: number;
  gridHeight: number;
  seed: number;
  isBreathe: boolean;
}

// ---------------------------------------------------------------------------
// Game State (pure, serialisable)
// ---------------------------------------------------------------------------

export interface GameState {
  items: PlacedItem[];
  recipe: Recipe;
  found: string[];
  score: number;
  timeRemaining: number;
  comboStreak: number;
  maxCombo: number;
  strikes: number;
  totalTaps: number;
  correctTaps: number;
  lastCorrectTapTime: number;
  status: 'playing' | 'won' | 'lost';
  config: LevelConfig;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type Action = { type: 'TAP'; itemInstanceId: string; timestamp: number };
