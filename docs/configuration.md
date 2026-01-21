# Configuration

Configuration systems for the scaffold and game.

## Overview

Configuration is split between scaffold-level settings (engine, integrations) and game-level settings (screens, assets).

## Scaffold Configuration

Located at `src/scaffold/config.ts`:

```typescript
export const scaffoldConfig = {
  // Graphics engine
  engine: 'pixi',  // 'pixi' | 'phaser' | 'three'

  // Development mode
  debug: import.meta.env.DEV,

  // Error tracking
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
  },

  // Analytics
  posthog: {
    apiKey: import.meta.env.VITE_POSTHOG_KEY,
    apiHost: 'https://app.posthog.com',
  },
};
```

### Engine Selection

The scaffold supports multiple rendering engines:

| Engine | Use Case |
|--------|----------|
| `pixi` | 2D games, sprites, tilemaps |
| `phaser` | 2D games with built-in physics |
| `three` | 3D games and visualizations |

The engine choice affects which GPU loader is used:

```typescript
// src/scaffold/systems/assets/loaders/gpu/index.ts
export function createGpuLoader(engine: Engine) {
  switch (engine) {
    case 'pixi': return new PixiLoader();
    case 'phaser': return new PhaserLoader();
    case 'three': return new ThreeLoader();
  }
}
```

## Game Configuration

Located at `src/game/config.ts`:

```typescript
import { LoadingScreen, StartScreen, GameScreen, ResultsScreen } from './screens';

export const gameConfig = {
  // Screen components
  screens: {
    loading: LoadingScreen,
    start: StartScreen,
    game: GameScreen,
    results: ResultsScreen,
  },

  // Starting screen
  initialScreen: 'loading',
};
```

## Asset Manifest

Located at `src/game/manifest.ts`:

```typescript
import type { Manifest } from '~/scaffold/systems/assets';

export const manifest: Manifest = {
  cdnBase: '/assets',
  bundles: [
    // Pre-engine assets
    { name: 'boot-splash', assets: ['ui/logo.png'] },

    // Engine assets
    { name: 'core-ui', assets: ['ui/buttons.json'] },

    // Audio
    { name: 'audio-sfx', assets: ['audio/sfx.json'] },

    // Game-specific
    { name: 'tiles_citylines_v1', assets: ['tiles/citylines.json'] },
  ],
};
```

See [Asset Management](assets.md) for bundle prefix conventions.

## Environment Variables

Create a `.env` file for sensitive configuration:

```bash
# .env
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_POSTHOG_KEY=phc_xxx
```

Access in code:

```typescript
const dsn = import.meta.env.VITE_SENTRY_DSN;
```

## Level Configuration

For City Lines, levels are configured with:

```typescript
interface LevelConfig {
  gridSize: 4 | 5 | 6;
  landmarks: Array<{
    type: LandmarkType;
    position: GridPosition;
    connectableEdges?: Edge[];
  }>;
  exits: Array<{
    position: GridPosition;
    facingEdge: Edge;
  }>;
  roadTiles: Array<{
    type: RoadTileType;
    row: number;
    col: number;
    solutionRotation: number;
    initialRotation?: number;
  }>;
  county: string;
  clue?: string;
}
```

### Difficulty Presets

```typescript
const difficultyPresets = {
  easy: {
    gridSize: 4,
    landmarkCount: 2,
    detourbability: 0.1,
  },
  medium: {
    gridSize: 5,
    landmarkCount: 3,
    detourbability: 0.3,
  },
  hard: {
    gridSize: 6,
    landmarkCount: 4,
    detourbability: 0.6,
  },
};
```

## Runtime Configuration

Some settings can be adjusted at runtime:

```typescript
import { usePause } from '~/scaffold/systems/pause';

// Toggle debug mode
scaffoldConfig.debug = true;

// Pause controls
const { pause, resume } = usePause();
```

## Tweakpane (Dev Only)

In development, Tweakpane provides a UI for adjusting parameters:

```typescript
import { Tweakpane } from '~/scaffold/dev';

function DevTools() {
  return (
    <Show when={scaffoldConfig.debug}>
      <Tweakpane
        params={{
          gridSize: 5,
          debug: true,
        }}
        onChange={(params) => {
          // Update runtime config
        }}
      />
    </Show>
  );
}
```

## See Also

- [Architecture](architecture.md) — Overall structure
- [Asset Management](assets.md) — Manifest configuration
- [Screen System](screens.md) — Screen configuration
