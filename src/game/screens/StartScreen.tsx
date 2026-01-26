import { createSignal, onMount, onCleanup } from 'solid-js';
import { Application, Sprite } from 'pixi.js';
import { useScreen } from '~/scaffold/systems/screens';
import { useAssets } from '~/scaffold/systems/assets';
import { useTuning, type ScaffoldTuning } from '~/scaffold';
import { Logo } from '~/scaffold/ui/Logo';
import { gameState } from '~/game/state';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { Character } from '~/game/citylines/core/Character';
import { SpriteButton } from '~/game/citylines/core/SpriteButton';
import { getTileBundleName, type CityLinesTuning } from '~/game/tuning';
import { setAtlasName } from '~/game/citylines/utils/atlasHelper';

export function StartScreen() {
  const { goto } = useScreen();
  const { coordinator, initGpu, unlockAudio, loadCore, loadAudio } = useAssets();
  const tuning = useTuning<ScaffoldTuning, CityLinesTuning>();
  const [loading, setLoading] = createSignal(false);
  let containerRef: HTMLDivElement | undefined;
  let app: Application | null = null;
  let background: Sprite | null = null;
  let titleSprite: Sprite | null = null;
  let character: Character | null = null;
  let startButton: SpriteButton | null = null;

  const handleStart = async () => {
    if (loading()) return;
    setLoading(true);

    // Disable button during loading
    startButton?.setEnabled(false);

    try {
      unlockAudio();
      await initGpu();
      await loadCore();

      // Load audio with graceful degradation
      try {
        await loadAudio();
      } catch (error) {
        console.warn('Audio loading failed (assets may not exist yet):', error);
        // Continue without audio - game is still playable
      }

      gameState.reset();

      await new Promise((r) => setTimeout(r, 200));
      await goto('game');
    } catch (error) {
      console.error('Failed to start game:', error);
      setLoading(false);
      startButton?.setEnabled(true);
    }
  };

  const handleResize = () => {
    if (!app || !background) return;

    const screenWidth = app.screen.width;
    const screenHeight = app.screen.height;

    // Background - fit height, maintain aspect ratio, center horizontally
    const scale = screenHeight / background.texture.height;
    background.scale.set(scale);
    background.x = screenWidth / 2;
    background.y = screenHeight / 2;

    // Title sprite - centered, upper area
    if (titleSprite) {
      titleSprite.x = screenWidth / 2;
      titleSprite.y = screenHeight / 2 - 180;
    }

    // Character - centered, slightly lower
    if (character) {
      character.x = screenWidth / 2;
      character.y = screenHeight / 2 + 80;
    }

    // Button - below character
    if (startButton) {
      startButton.x = screenWidth / 2;
      startButton.y = screenHeight / 2 + 250;
    }
  };

  onMount(async () => {
    if (!containerRef) return;

    await initGpu();

    app = new Application();
    await app.init({
      background: '#B2DD53',
      resizeTo: containerRef,
    });
    containerRef.appendChild(app.canvas);

    // Load tile bundle based on theme setting
    const tileTheme = tuning.game().theme.tileTheme;
    setAtlasName(tileTheme); // Set global atlas name for all game entities
    const tileBundleName = getTileBundleName(tileTheme);
    await coordinator.loadBundle(tileBundleName);
    const gpuLoader = coordinator.getGpuLoader() as PixiLoader;

    if (gpuLoader?.hasSheet(tileBundleName)) {
      // Background with aspect-ratio cover scaling
      background = gpuLoader.createSprite(tileBundleName, 'background.png');
      background.anchor.set(0.5);
      app.stage.addChild(background);

      // Title sprite
      titleSprite = gpuLoader.createSprite(tileBundleName, 'title.png');
      titleSprite.anchor.set(0.5);
      app.stage.addChild(titleSprite);

      // Character (News Hound)
      character = new Character('news_hound', gpuLoader, 0.9);
      app.stage.addChild(character);

      // Start button with 9-slice
      startButton = new SpriteButton(gpuLoader, {
        atlasName: tileBundleName,
        spriteName: 'button.png',
        label: 'START',
        width: 200,
        height: 80,
        use9Slice: true,
        nineSliceBorders: {
          leftWidth: 32,
          topHeight: 32,
          rightWidth: 32,
          bottomHeight: 32,
        },
        labelStyle: {
          fontFamily: 'Comic Sans MS, cursive, sans-serif',
          fontSize: 28,
          fontWeight: 'bold',
          fill: '#ffffff',
          stroke: { color: '#000000', width: 4 },
        },
        onClick: handleStart,
      });
      app.stage.addChild(startButton);

      // Initial layout
      handleResize();

      // Listen for resize
      window.addEventListener('resize', handleResize);
    }
  });

  onCleanup(() => {
    window.removeEventListener('resize', handleResize);
    if (app) {
      app.destroy(true, { children: true });
      app = null;
    }
  });

  return (
    <div class="fixed inset-0 bg-[#B2DD53]">
      {/* Pixi canvas container */}
      <div ref={containerRef} class="absolute inset-0" />

      {/* Logo at bottom center */}
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2">
        <Logo class="opacity-50" />
      </div>
    </div>
  );
}
