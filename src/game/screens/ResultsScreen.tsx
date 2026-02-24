import { Show } from 'solid-js';
import { useScreen } from '~/scaffold/systems/screens';
import { Button } from '~/scaffold/ui/Button';
import { gameState } from '~/game/state';

export function ResultsScreen() {
  const { goto } = useScreen();

  const handleContinue = () => {
    gameState.reset();
    goto('game');
  };

  const handleMainMenu = () => {
    goto('start');
  };

  const headline = gameState.storyHeadline();
  const imageUrl = gameState.storyImageUrl();
  const articleUrl = gameState.storyArticleUrl();

  return (
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-amber-950 to-black px-6">
      {/* Chapter Complete header */}
      <h1 class="text-3xl font-bold text-amber-300 mb-6">
        Chapter Complete!
      </h1>

      {/* Story reveal card */}
      <div class="bg-amber-900/60 rounded-xl p-5 mb-6 max-w-sm w-full border border-amber-700/40">
        <Show when={imageUrl}>
          <img
            src={imageUrl}
            alt="Story"
            class="w-full h-40 object-cover rounded-lg mb-4"
          />
        </Show>

        <Show when={headline} fallback={
          <p class="text-amber-200 text-lg font-semibold text-center">Great work!</p>
        }>
          <h2 class="text-xl font-bold text-white mb-2">{headline}</h2>
        </Show>

        <Show when={articleUrl}>
          <a
            href={articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-block mt-3 text-amber-300 underline text-sm hover:text-amber-200"
          >
            Read Full Article
          </a>
        </Show>
      </div>

      {/* Score breakdown */}
      <div class="text-center mb-8">
        <p class="text-amber-400/70 text-sm">Levels Completed</p>
        <p class="text-4xl font-bold text-white">
          {gameState.totalLevels()}
        </p>
      </div>

      {/* Actions */}
      <div class="flex gap-4">
        <Button onClick={handleContinue}>
          Continue
        </Button>
        <Button variant="secondary" onClick={handleMainMenu}>
          Main Menu
        </Button>
      </div>
    </div>
  );
}
