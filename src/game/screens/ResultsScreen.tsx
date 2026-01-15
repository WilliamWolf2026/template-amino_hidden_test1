import { useScreen } from '~/scaffold/systems/screens';
import { Button } from '~/scaffold/ui/Button';
import { gameState } from '~/game/state';

export function ResultsScreen() {
  const { goto } = useScreen();

  const handlePlayAgain = () => {
    gameState.reset();
    goto('game');
  };

  const handleMainMenu = () => {
    goto('start');
  };

  return (
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black">
      <h1 class="text-4xl font-bold text-white mb-8">
        Game Over
      </h1>

      <div class="text-center mb-12">
        <p class="text-gray-400 text-lg">Final Score</p>
        <p class="text-6xl font-bold text-white">
          {gameState.score().toLocaleString()}
        </p>
      </div>

      <div class="flex gap-4">
        <Button onClick={handlePlayAgain}>
          Play Again
        </Button>
        <Button variant="secondary" onClick={handleMainMenu}>
          Main Menu
        </Button>
      </div>
    </div>
  );
}
