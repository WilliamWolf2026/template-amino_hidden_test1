# State Management

SolidJS signals for reactive state across the scaffold.

## Overview

The scaffold uses SolidJS signals for all reactive state. Signals provide fine-grained reactivity without the overhead of a virtual DOM.

## Game State

Global game state is defined in `src/game/state.ts`:

```typescript
import { createSignal } from 'solid-js';
import { createRoot } from 'solid-js';

// Created in createRoot to persist across screen transitions
export const gameState = createRoot(() => {
  const [score, setScore] = createSignal(0);
  const [health, setHealth] = createSignal(100);

  return {
    score,
    health,
    addScore: (amount: number) => setScore(s => s + amount),
    damage: (amount: number) => setHealth(h => Math.max(0, h - amount)),
    heal: (amount: number) => setHealth(h => Math.min(100, h + amount)),
    reset: () => {
      setScore(0);
      setHealth(100);
    },
  };
});
```

### Usage

```typescript
import { gameState } from '~/game/state';

function ScoreDisplay() {
  return <div>Score: {gameState.score()}</div>;
}

function GameLogic() {
  // Update score
  gameState.addScore(100);

  // Reset on game start
  gameState.reset();
}
```

## Pause State

The pause system is managed via signals:

```typescript
import { usePause } from '~/scaffold/systems/pause';

function GameScreen() {
  const { paused, toggle, pause, resume } = usePause();

  // Check pause state
  if (paused()) {
    // Game is paused
  }

  // Toggle pause
  const handlePauseButton = () => toggle();

  // Programmatic control
  const handleMenuOpen = () => pause();
  const handleMenuClose = () => resume();
}
```

### Keyboard Integration

The scaffold auto-binds spacebar to pause toggle:

```typescript
// In app.tsx
import { initPauseKeyboard, cleanupPauseKeyboard } from '~/scaffold/systems/pause';

onMount(() => {
  initPauseKeyboard();
});

onCleanup(() => {
  cleanupPauseKeyboard();
});
```

## Screen State

Screen navigation uses signals internally:

```typescript
import { useScreens } from '~/scaffold/systems/screens';

function Navigation() {
  const { current, goto, transition } = useScreens();

  // Reactive current screen
  console.log(current()); // 'loading' | 'start' | 'game' | 'results'

  // Check transition state
  if (transition()) {
    // Transitioning between screens
  }
}
```

## Asset Loading State

Asset loading progress is exposed via signals:

```typescript
import { useAssets } from '~/scaffold/systems/assets';

function LoadingScreen() {
  const { progress, loading } = useAssets();

  return (
    <Show when={loading()}>
      <ProgressBar value={progress()} />
    </Show>
  );
}
```

## Creating Custom State

For game-specific state, follow the pattern:

```typescript
// src/game/my-state.ts
import { createSignal } from 'solid-js';
import { createRoot } from 'solid-js';

export const myState = createRoot(() => {
  const [value, setValue] = createSignal(initialValue);

  return {
    value,
    setValue,
    // Add computed values and actions
  };
});
```

**Why `createRoot`?**

Using `createRoot` ensures signals persist across component lifecycles. Without it, signals would be disposed when their owning component unmounts.

## Derived State

Create computed values from signals:

```typescript
import { createMemo } from 'solid-js';

const gameState = createRoot(() => {
  const [score, setScore] = createSignal(0);
  const [multiplier, setMultiplier] = createSignal(1);

  // Derived state
  const displayScore = createMemo(() => score() * multiplier());

  return {
    score,
    multiplier,
    displayScore,
    // ...
  };
});
```

## See Also

- [Architecture](../architecture.md) — Provider hierarchy
- [Screen System](./screens.md) — Screen navigation state
- [SolidJS Docs](https://docs.solidjs.com/concepts/signals) — Signal fundamentals
