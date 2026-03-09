import { createSignal, createRoot } from 'solid-js';

// Game state that persists across screens
// Created in a root to avoid disposal issues
// Note: Pause state is in scaffold/systems/pause (template feature)

export interface GameState {
  score: () => number;
  setScore: (score: number) => void;
  addScore: (amount: number) => void;

  health: () => number;
  setHealth: (health: number) => void;
  damage: (amount: number) => void;
  heal: (amount: number) => void;

  // Chapter progress (for HUD display)
  currentLevel: () => number;
  setCurrentLevel: (level: number) => void;
  totalLevels: () => number;
  setTotalLevels: (total: number) => void;
  incrementLevel: () => void;

  // Story data (set by controller for results screen)
  storyHeadline: () => string;
  setStoryHeadline: (headline: string) => void;
  storyImageUrl: () => string;
  setStoryImageUrl: (url: string) => void;
  storyArticleUrl: () => string;
  setStoryArticleUrl: (url: string) => void;

  reset: () => void;
}

function createGameState(): GameState {
  const [score, setScore] = createSignal(0);
  const [health, setHealth] = createSignal(100);
  const [currentLevel, setCurrentLevel] = createSignal(1); // Start at 1 (1-based levels)
  const [totalLevels, setTotalLevels] = createSignal(12);
  const [storyHeadline, setStoryHeadline] = createSignal('');
  const [storyImageUrl, setStoryImageUrl] = createSignal('');
  const [storyArticleUrl, setStoryArticleUrl] = createSignal('');

  return {
    score,
    setScore,
    addScore: (amount: number) => setScore((s) => s + amount),

    health,
    setHealth,
    damage: (amount: number) => setHealth((h) => Math.max(0, h - amount)),
    heal: (amount: number) => setHealth((h) => Math.min(100, h + amount)),

    currentLevel,
    setCurrentLevel,
    totalLevels,
    setTotalLevels,
    incrementLevel: () => setCurrentLevel((l) => l + 1),

    storyHeadline,
    setStoryHeadline,
    storyImageUrl,
    setStoryImageUrl,
    storyArticleUrl,
    setStoryArticleUrl,

    reset: () => {
      setScore(0);
      setHealth(100);
      setCurrentLevel(1);
      setTotalLevels(12);
      setStoryHeadline('');
      setStoryImageUrl('');
      setStoryArticleUrl('');
    },
  };
}

// Singleton game state
export const gameState = createRoot(createGameState);
