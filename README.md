# Game Production Scaffold

SolidJS game scaffold with engine-agnostic asset management, supporting PixiJS, Phaser, and Three.js.

## Quick Start

```bash
bun install
bun run dev
```

## Features

- **Asset Management** — Layered loading system with DOM, GPU, and audio loaders
- **Engine Agnostic** — Swap between Pixi, Phaser, or Three.js
- **Signal-Based Navigation** — No router, instant screen transitions
- **Error Boundaries** — Layered error handling with Sentry + PostHog

## Documentation

### Architecture & Setup
- [Architecture](docs/architecture.md) — System overview and design patterns
- [Configuration](docs/configuration.md) — Environment and build config
- [Screens](docs/screens.md) — Screen navigation system

### Systems
- [Assets](docs/assets.md) — Asset loading and management
- [State Management](docs/state-management.md) — Signal-based state
- [Error Handling](docs/error-handling.md) — Error boundaries and logging

### Development Tools
- [Tuning System](docs/services/tuning.md) — Real-time parameter adjustment
- [AI-Driven Development](docs/aidd.md) — AI coding guidelines

### Components
- [Tuning Panel](docs/components/tuning-panel.md) — Dev tuning UI component
- [Easing Picker](docs/components/easing-picker.md) — GSAP easing dropdown with curve previews

### Game
- [Game Design Document](docs/game/gdd.md) — City Lines game design

---

## Making a New Game

This scaffold is designed to host different games. Here's how to create a new game or replace the existing one.

### Game Structure

```
src/game/
├── config.ts          # Screen mappings and initial screen
├── index.ts           # Main exports
├── manifest.ts        # Asset manifest
├── state.ts           # Game state signals
├── tuning/
│   ├── types.ts       # Game tuning types & defaults
│   └── index.ts       # Tuning exports
├── screens/
│   ├── LoadingScreen.tsx
│   ├── StartScreen.tsx
│   ├── GameScreen.tsx
│   └── ResultsScreen.tsx
└── [gamename]/        # Game-specific logic (e.g., citylines/)
    ├── core/          # Game entities and systems
    ├── types/         # Type definitions
    └── data/          # Static data
```

### Creating a New Game

#### Step 1: Clear Game-Specific Code and Storage

Remove or rename the existing game folder:
```bash
rm -rf src/game/citylines   # Or rename to keep as reference
```

Clear the old game's tuning from browser storage:
```javascript
// Run in browser console, or add to your setup
localStorage.removeItem('tuning_game');
```

> **Note**: Scaffold tuning (`tuning_scaffold`) persists across games — your engine, audio, and debug preferences stay intact.

#### Step 2: Create Game Tuning

Update `src/game/tuning/types.ts`:

```typescript
import type { GameTuningBase } from '~/scaffold/systems/tuning/types';

export interface MyGameTuning extends GameTuningBase {
  // Define your game's tunable parameters
  board: {
    width: number;
    height: number;
  };
  gameplay: {
    speed: number;
  };
}

export const MY_GAME_DEFAULTS: MyGameTuning = {
  version: '1.0.0',
  board: { width: 10, height: 10 },
  gameplay: { speed: 1.0 },
};
```

#### Step 3: Update Asset Manifest

Edit `src/game/manifest.ts` with your assets:

```typescript
export const manifest: AssetManifest = {
  atlases: [
    { name: 'my_sprites', path: '/atlases/my_sprites.json' },
  ],
  audio: [
    { name: 'bgm', path: '/audio/music.mp3', type: 'music' },
  ],
};
```

#### Step 4: Create Your Screens

Update screens in `src/game/screens/`:
- `LoadingScreen.tsx` — Asset loading UI
- `StartScreen.tsx` — Main menu
- `GameScreen.tsx` — Core gameplay
- `ResultsScreen.tsx` — End game summary

#### Step 5: Update Screen Config

Edit `src/game/config.ts`:

```typescript
import { LoadingScreen } from './screens/LoadingScreen';
import { StartScreen } from './screens/StartScreen';
import { GameScreen } from './screens/GameScreen';
import { ResultsScreen } from './screens/ResultsScreen';

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

#### Step 6: Wire Tuning (Optional)

Register live-updating paths in `src/scaffold/dev/tuningRegistry.ts`:

```typescript
const GAME_WIRED_PATHS = [
  'board.width',
  'board.height',
  'gameplay.speed',
];
```

### What Stays vs What Changes

| Keep (Scaffold) | Replace (Game) |
|-----------------|----------------|
| `src/scaffold/` | `src/game/[gamename]/` |
| Asset loaders | Asset manifest |
| Screen system | Screen components |
| Tuning panel | Tuning types/defaults |
| Error handling | Game state |
| Audio system | Game logic |

### Tuning Storage

The tuning system stores scaffold and game settings **separately**:

| localStorage Key | Contents | Persists |
|------------------|----------|----------|
| `tuning_scaffold` | Engine, audio, debug, performance | Across all games |
| `tuning_game` | Your game's grid, difficulty, visuals | Per game (clear when switching) |

**Loading priority**: localStorage → `/public/config/tuning/*.json` → TypeScript defaults

### Tips

- **Tuning Panel**: Press backtick (`) to access live tuning
- **Scaffold vs Game**: Cyan = scaffold settings, Orange = your game settings
- **Hot Reload**: Most changes hot-reload, tuning changes apply instantly when wired
- **Assets**: Place in `public/` folder, reference in manifest
- **Team Defaults**: Create `public/config/tuning/game.json` for shared overrides

See [Tuning Panel](docs/components/tuning-panel.md) for detailed setup guide including storage system.
