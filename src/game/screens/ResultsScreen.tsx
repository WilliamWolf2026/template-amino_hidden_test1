import { createMemo, onMount } from 'solid-js';
import { useScreen } from '~/core/systems/screens';
import { Button } from '~/core/ui/Button';
import { gameState } from '~/game/state';

// Ensure star animation keyframes exist
let resultsStylesInjected = false;
function injectResultsStyles() {
  if (resultsStylesInjected) return;
  resultsStylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes resultsStarPop {
      0% { opacity: 0; transform: scale(0.3) rotate(-30deg); }
      60% { opacity: 1; transform: scale(1.3) rotate(5deg); }
      100% { opacity: 1; transform: scale(1) rotate(0deg); }
    }
  `;
  document.head.appendChild(style);
}

export function ResultsScreen() {
  onMount(() => injectResultsStyles());
  const { goto } = useScreen();

  const stars = createMemo(() => gameState.stars());
  const score = createMemo(() => gameState.score());
  const level = createMemo(() => gameState.level());
  const ingredientsFound = createMemo(() => gameState.ingredientsFound());
  const totalIngredients = createMemo(() => gameState.totalIngredients());
  const maxCombo = createMemo(() => gameState.maxCombo());
  const totalTaps = createMemo(() => gameState.totalTaps());
  const correctTaps = createMemo(() => gameState.correctTaps());
  const recipeName = createMemo(() => gameState.recipeName());
  const dishEmoji = createMemo(() => gameState.dishEmoji());
  const won = createMemo(() => stars() > 0);

  const accuracy = createMemo(() => {
    const t = totalTaps();
    return t > 0 ? Math.round((correctTaps() / t) * 100) : 0;
  });

  const starElements = createMemo(() => {
    const s = stars();
    const result: { filled: boolean; delay: string }[] = [];
    for (let i = 0; i < 3; i++) {
      result.push({ filled: i < s, delay: `${i * 200}ms` });
    }
    return result;
  });

  const handlePlayAgain = () => {
    if (won()) {
      gameState.incrementLevel();
    }
    goto('game');
  };

  const handleMainMenu = () => {
    goto('start');
  };

  return (
    <div
      class="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{
        background: 'linear-gradient(180deg, #FFF8F0 0%, #F5E6D0 100%)',
      }}
    >
      {/* Subtle wood-grain overlay */}
      <div
        class="absolute inset-0 pointer-events-none"
        style={{
          opacity: '0.03',
          background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, #8D6E63 40px, #8D6E63 41px)',
        }}
      />

      {/* Dish emoji (if won) */}
      {won() && dishEmoji() && (
        <div style={{ 'font-size': '3.5rem', 'margin-bottom': '4px', 'z-index': '1' }}>
          {dishEmoji()}
        </div>
      )}

      {/* Title */}
      <h1
        class="text-3xl font-extrabold mb-1"
        style={{
          color: '#6B3A1F',
          'font-family': 'Georgia, "Times New Roman", serif',
          'text-shadow': '0 1px 0 rgba(255,245,225,0.8)',
          'z-index': '1',
        }}
      >
        {won() ? 'Recipe Complete!' : "Time's Up!"}
      </h1>

      {/* Recipe name (if won) */}
      {won() && recipeName() && (
        <div
          style={{
            'font-size': '1.1rem',
            color: '#8B6F47',
            'font-family': 'Georgia, serif',
            'font-style': 'italic',
            'margin-bottom': '8px',
            'z-index': '1',
          }}
        >
          {recipeName()}
        </div>
      )}

      {/* Star rating with pop-in animation */}
      <div class="flex gap-3 mb-4" style={{ 'font-size': '2.5rem', 'z-index': '1' }}>
        {starElements().map((star) => (
          <span
            style={{
              color: star.filled ? '#FFD23F' : 'rgba(139,111,71,0.2)',
              'text-shadow': star.filled ? '0 0 12px rgba(255,210,63,0.6)' : 'none',
              animation: star.filled ? `resultsStarPop 0.4s ease-out ${star.delay} both` : 'none',
              display: 'inline-block',
            }}
          >
            {star.filled ? '\u2B50' : '\u2606'}
          </span>
        ))}
      </div>

      {/* Score breakdown card */}
      <div
        class="rounded-2xl p-5 mb-6 w-full max-w-xs text-center"
        style={{
          background: '#FFFDF7',
          border: '1px solid rgba(139,111,71,0.2)',
          'box-shadow': '0 4px 20px rgba(107,58,31,0.12)',
          'z-index': '1',
        }}
      >
        <div
          class="text-4xl font-extrabold mb-2"
          style={{
            color: '#E85D3A',
            'text-shadow': '0 0 10px rgba(232,93,58,0.25)',
            'font-family': 'system-ui, sans-serif',
          }}
        >
          {score()}
        </div>
        <div class="text-sm mb-3" style={{ color: 'rgba(93,64,55,0.6)' }}>
          Level {level()}
        </div>
        <div class="border-t pt-3" style={{ 'border-color': 'rgba(139,111,71,0.15)' }}>
          <div class="flex justify-between text-sm mb-1" style={{ color: '#5D4037' }}>
            <span>Ingredients</span>
            <span class="font-bold">{ingredientsFound()}/{totalIngredients()}</span>
          </div>
          <div class="flex justify-between text-sm mb-1" style={{ color: '#5D4037' }}>
            <span>Accuracy</span>
            <span class="font-bold">{accuracy()}%</span>
          </div>
          <div class="flex justify-between text-sm mb-1" style={{ color: '#5D4037' }}>
            <span>Max Combo</span>
            <span class="font-bold">x{maxCombo()}</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div class="flex flex-col gap-3 w-full max-w-xs z-10">
        <button
          onClick={handlePlayAgain}
          style={{
            'font-size': '1.2rem',
            'font-weight': '700',
            padding: '16px 48px',
            border: 'none',
            'border-radius': '50px',
            background: 'linear-gradient(135deg, #FF8A65, #E85D3A)',
            color: '#fff',
            cursor: 'pointer',
            'font-family': 'system-ui, sans-serif',
            'box-shadow': '0 6px 20px rgba(232,93,58,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
            width: '100%',
          }}
        >
          {won() ? 'Next Level' : 'Retry'}
        </button>
        <button
          onClick={handleMainMenu}
          style={{
            'font-size': '1rem',
            'font-weight': '600',
            padding: '12px 36px',
            border: '2px solid rgba(141,110,99,0.3)',
            'border-radius': '50px',
            background: 'rgba(255,253,247,0.8)',
            color: '#8D6E63',
            cursor: 'pointer',
            'font-family': 'system-ui, sans-serif',
            'box-shadow': '0 2px 8px rgba(107,58,31,0.1)',
            width: '100%',
          }}
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}
