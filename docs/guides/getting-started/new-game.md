# Creating a New Game

This scaffold is designed to host different games. Here's how to create a new game or replace the existing one.

## Game Structure

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

## Step-by-Step Guide

### Step 1: Clear Game-Specific Code and Storage

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

### Step 2: Create Game Tuning

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

### Step 3: Update Asset Manifest

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

### Step 4: Create Your Screens

Update screens in `src/game/screens/`:
- `LoadingScreen.tsx` — Asset loading UI
- `StartScreen.tsx` — Main menu
- `GameScreen.tsx` — Core gameplay
- `ResultsScreen.tsx` — End game summary

### Step 5: Update Screen Config

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

### Step 6: Wire Tuning (Optional)

Register live-updating paths in `src/scaffold/dev/tuningRegistry.ts`:

```typescript
const GAME_WIRED_PATHS = [
  'board.width',
  'board.height',
  'gameplay.speed',
];
```

## What Stays vs What Changes

| Keep (Scaffold) | Replace (Game) |
|-----------------|----------------|
| `src/scaffold/` | `src/game/[gamename]/` |
| Asset loaders | Asset manifest |
| Screen system | Screen components |
| Tuning panel | Tuning types/defaults |
| Error handling | Game state |
| Audio system | Game logic |

## Tuning Storage

The tuning system stores scaffold and game settings **separately**:

| localStorage Key | Contents | Persists |
|------------------|----------|----------|
| `tuning_scaffold` | Engine, audio, debug, performance | Across all games |
| `tuning_game` | Your game's grid, difficulty, visuals | Per game (clear when switching) |

**Loading priority**: localStorage → `/public/config/tuning/*.json` → TypeScript defaults

## Audio Setup (Phased Approach)

Audio setup follows a two-phase approach since you won't have sound events until gameplay features exist.

### Phase 1: Early Skeleton (Project Setup)

Create the audio structure before you have sounds:

**1. Create `src/game/audio/sounds.ts`:**
```typescript
import type { SoundDefinition } from '~/scaffold/systems/audio';
export type { SoundDefinition };

// Define sounds as you add them to the game
// Example structure (add real sounds later):
// export const SOUND_ACTION: SoundDefinition = {
//   channel: 'sfx-mygame',
//   sprite: 'action_sound',
//   volume: 0.7,
// };
```

**2. Create `src/game/audio/manager.ts`:**
```typescript
import type { AudioLoader } from '~/scaffold/systems/assets/loaders/audio';
import { BaseAudioManager } from '~/scaffold/systems/audio';

export class GameAudioManager extends BaseAudioManager {
  constructor(audioLoader: AudioLoader) {
    super(audioLoader);
  }

  // Add game-specific sound methods as features develop
  // playAction(): void {
  //   this.playSound(SOUND_ACTION);
  // }
}
```

**3. Create `src/game/audio/index.ts`:**
```typescript
export { GameAudioManager } from './manager';
export * from './sounds';
```

### Phase 2: Adding Sounds (As Features Develop)

As you implement game features, add sounds incrementally:

1. **Add sound definition** to `sounds.ts`
2. **Add play method** to `GameAudioManager`
3. **Call from gameplay code** where the event occurs

**Example - Adding a "score" sound:**
```typescript
// sounds.ts
export const SOUND_SCORE: SoundDefinition = {
  channel: 'sfx-mygame',
  sprite: 'score_ding',
  volume: 0.6,
};

// manager.ts
playScore(): void {
  this.playSound(SOUND_SCORE);
}

// In gameplay code
audioManager.playScore();
```

### BaseAudioManager Features

The scaffold provides these methods via `BaseAudioManager`:

| Method | Purpose |
|--------|---------|
| `playSound(sound)` | Play a single sound effect |
| `playRandomSound(sounds)` | Play random from array (variations) |
| `startMusic(track, fadeIn?)` | Start music with optional fade |
| `stopMusic(fadeOut?)` | Stop music with optional fade |
| `isMusicPlaying()` | Check music state |

### Sound Variations

For sounds that play frequently, use arrays to prevent audio fatigue:

```typescript
export const SOUND_CLICK: readonly SoundDefinition[] = [
  { channel: 'sfx-mygame', sprite: 'click_1', volume: 0.5 },
  { channel: 'sfx-mygame', sprite: 'click_2', volume: 0.5 },
  { channel: 'sfx-mygame', sprite: 'click_3', volume: 0.5 },
] as const;

// In manager
playClick(): void {
  this.playRandomSound(SOUND_CLICK);
}
```

## Tips

- **Tuning Panel**: Press backtick (`) to access live tuning
- **Scaffold vs Game**: Cyan = scaffold settings, Orange = your game settings
- **Hot Reload**: Most changes hot-reload, tuning changes apply instantly when wired
- **Assets**: Place in `public/` folder, reference in manifest
- **Team Defaults**: Create `public/config/tuning/game.json` for shared overrides

See [Tuning Panel](../scaffold/components/tuning-panel.md) for detailed setup guide including storage system.
