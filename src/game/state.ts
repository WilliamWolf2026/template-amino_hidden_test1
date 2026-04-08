import { createSignal, createRoot } from 'solid-js';

/**
 * Game state that persists across screens.
 * Created in a root to avoid disposal issues.
 *
 * Add your game-specific signals here.
 * Pause state lives in core/systems/pause (scaffold feature).
 */

export interface GameState {
  score: () => number;
  setScore: (score: number) => void;

  level: () => number;
  setLevel: (level: number) => void;
  incrementLevel: () => void;

  timeRemaining: () => number;
  setTimeRemaining: (t: number) => void;

  ingredientsFound: () => number;
  setIngredientsFound: (n: number) => void;

  totalIngredients: () => number;
  setTotalIngredients: (n: number) => void;

  comboStreak: () => number;
  setComboStreak: (n: number) => void;

  maxCombo: () => number;
  setMaxCombo: (n: number) => void;

  strikes: () => number;
  setStrikes: (n: number) => void;

  stars: () => number;
  setStars: (n: number) => void;

  totalTaps: () => number;
  setTotalTaps: (n: number) => void;

  correctTaps: () => number;
  setCorrectTaps: (n: number) => void;

  recipeName: () => string;
  setRecipeName: (s: string) => void;

  dishEmoji: () => string;
  setDishEmoji: (s: string) => void;

  reset: () => void;
}

function createGameState(): GameState {
  const [score, setScore] = createSignal(0);
  const [level, setLevel] = createSignal(1);
  const [timeRemaining, setTimeRemaining] = createSignal(0);
  const [ingredientsFound, setIngredientsFound] = createSignal(0);
  const [totalIngredients, setTotalIngredients] = createSignal(0);
  const [comboStreak, setComboStreak] = createSignal(0);
  const [maxCombo, setMaxCombo] = createSignal(0);
  const [strikes, setStrikes] = createSignal(0);
  const [stars, setStars] = createSignal(0);
  const [totalTaps, setTotalTaps] = createSignal(0);
  const [correctTaps, setCorrectTaps] = createSignal(0);
  const [recipeName, setRecipeName] = createSignal('');
  const [dishEmoji, setDishEmoji] = createSignal('');

  return {
    score,
    setScore,

    level,
    setLevel,
    incrementLevel: () => setLevel((l) => l + 1),

    timeRemaining,
    setTimeRemaining,

    ingredientsFound,
    setIngredientsFound,

    totalIngredients,
    setTotalIngredients,

    comboStreak,
    setComboStreak,

    maxCombo,
    setMaxCombo,

    strikes,
    setStrikes,

    stars,
    setStars,

    totalTaps,
    setTotalTaps,

    correctTaps,
    setCorrectTaps,

    recipeName,
    setRecipeName,

    dishEmoji,
    setDishEmoji,

    reset: () => {
      setScore(0);
      setLevel(1);
      setTimeRemaining(0);
      setIngredientsFound(0);
      setTotalIngredients(0);
      setComboStreak(0);
      setMaxCombo(0);
      setStrikes(0);
      setStars(0);
      setTotalTaps(0);
      setCorrectTaps(0);
      setRecipeName('');
      setDishEmoji('');
    },
  };
}

export const gameState = createRoot(createGameState);
