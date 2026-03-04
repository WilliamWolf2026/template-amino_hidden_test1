# Screen System

Signal-based screen management with transitions and lifecycle hooks.

## Overview

The core system uses a custom screen manager instead of a traditional router. Screens are registered in configuration and switched via signals.

## Screen Flow

```
LoadingScreen -> StartScreen -> GameScreen -> ResultsScreen
     │              │              │              │
   boot-*      [Start click]   gameplay     [Restart]
   theme-*      initGpu()      scene-*          │
                core-*                          │
                audio-*                         └──► StartScreen
```

## Configuration

Define screens in `src/game/config.ts`:

```typescript
import { LoadingScreen, StartScreen, GameScreen, ResultsScreen } from './screens';

export const gameConfig = {
  screens: {
    loading: LoadingScreen,
    start: StartScreen,
    game: GameScreen,
    results: ResultsScreen,
  },
  initialScreen: 'loading',
};
```

## Screen Manager

The `ScreenManager` provides:

- **Signal-based state** -- Reactive screen changes
- **Transition animations** -- Configurable duration and easing
- **Lifecycle hooks** -- `onEnter` and `onExit` callbacks
- **Error boundaries** -- Per-screen error handling

### Navigation

```typescript
import { useScreens } from '~/core/systems/screens';

function MyComponent() {
  const { goto, current } = useScreens();

  // Navigate to a screen
  const handleStart = () => goto('game');

  // Check current screen
  console.log(current()); // 'loading' | 'start' | 'game' | 'results'
}
```

### Transitions

```typescript
const { goto, transition } = useScreens();

// Check if transitioning
if (transition()) {
  // Show transition overlay
}

// Navigate with custom transition
goto('game', { duration: 500 });
```

## Screen Components

Each screen is a SolidJS component receiving standard props:

```typescript
import type { ScreenProps } from '~/core/systems/screens';

export function GameScreen(props: ScreenProps) {
  const { goto } = useScreens();

  onMount(() => {
    // Screen entered
  });

  onCleanup(() => {
    // Screen exiting
  });

  return (
    <div class="screen">
      {/* Screen content */}
    </div>
  );
}
```

## Loading Screen Pattern

The loading screen handles pre-engine asset loading:

```typescript
export function LoadingScreen() {
  const { loadBoot, loadTheme } = useAssets();
  const { goto } = useScreens();

  onMount(async () => {
    await loadBoot();     // boot-* bundles
    await loadTheme();    // theme-* bundles
    goto('start');
  });

  return <Spinner />;
}
```

## Start Screen Pattern

The start screen initializes the GPU engine on user interaction:

```typescript
export function StartScreen() {
  const { initGpu, loadCore, loadAudio, unlockAudio } = useAssets();
  const { goto } = useScreens();

  const handleStart = async () => {
    unlockAudio();        // Gesture unlock for mobile
    await initGpu();      // Initialize PixiJS
    await loadCore();     // core-* bundles
    await loadAudio();    // audio-* bundles
    goto('game');
  };

  return (
    <Button onClick={handleStart}>
      Start Game
    </Button>
  );
}
```

## Game Screen Pattern

The game screen manages the PixiJS application:

```typescript
export function GameScreen() {
  let containerRef: HTMLDivElement;
  const { goto } = useScreens();

  onMount(async () => {
    const app = new Application();
    await app.init({
      resizeTo: containerRef,
      background: '#1a1a2e',
    });
    containerRef.appendChild(app.canvas);

    const game = new CityLinesGame();
    app.stage.addChild(game);
    game.loadLevel(levelConfig);

    game.onGameEvent('levelComplete', () => {
      goto('results');
    });
  });

  return <div ref={containerRef!} class="game-container" />;
}
```

## See Also

- [Architecture](../architecture.md) -- Overall core structure
- [State Management](./state.md) -- Signals and reactive state
- [Asset Management](./assets.md) -- Loading assets per screen
