# Scaffold Framework: Overview & Migration Guide

> **Purpose**: This document provides a comprehensive overview of the scaffold framework and serves as the authoritative guide for migrating to a new game implementation.

---

## Table of Contents

1. [What is the Scaffold?](#what-is-the-scaffold)
2. [Scaffold Architecture](#scaffold-architecture)
3. [Complete System Inventory](#complete-system-inventory)
4. [The Game Layer](#the-game-layer)
5. [Migration Guide: Swapping Games](#migration-guide-swapping-games)
6. [File Reference](#file-reference)

---

## What is the Scaffold?

The scaffold is a **reusable game development framework** that separates engine concerns from game-specific logic. Think of it as a "game shell" that handles all the plumbing - asset loading, screen management, audio, configuration, error handling - so that each game implementation can focus purely on gameplay.

### Key Principle

```
┌─────────────────────────────────────────────────────────────┐
│                     src/scaffold/                            │
│              (NEVER changes between games)                   │
│                                                              │
│   Asset System │ Screen System │ Tuning │ Audio │ Errors    │
│            Pixi/Three/Phaser Loaders │ Dev Tools            │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │   app.tsx     │
                    │  (wires them) │
                    └───────┬───────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                      src/game/                               │
│             (REPLACED for each new game)                     │
│                                                              │
│   manifest.ts │ config.ts │ state.ts │ tuning/types.ts      │
│   screens/ │ [gamename]/ │ audio/                            │
└─────────────────────────────────────────────────────────────┘
```

**The scaffold NEVER imports from the game.** All dependencies flow one direction: game → scaffold.

---

## Scaffold Architecture

### Directory Structure

```
src/scaffold/
├── config.ts                 # Engine configuration (pixi/three/babylon)
├── index.ts                  # Public API exports
│
├── systems/                  # Core framework systems
│   ├── assets/               # Asset loading & management
│   │   ├── types.ts          # Manifest, Bundle, Asset types
│   │   ├── coordinator.ts    # Routes assets to appropriate loaders
│   │   ├── dom.ts            # DOM-based asset loading (fonts, images)
│   │   ├── audio.ts          # Howler.js audio sprite loading
│   │   ├── gpu/
│   │   │   └── pixi.ts       # Pixi.js texture & spritesheet loading
│   │   └── context.tsx       # AssetProvider + useAssets() hook
│   │
│   ├── screens/              # Screen navigation system
│   │   ├── types.ts          # ScreenId, TransitionState types
│   │   ├── manager.ts        # Screen state machine
│   │   └── context.tsx       # ScreenProvider + useScreen() hook
│   │
│   ├── tuning/               # Configuration management
│   │   ├── types.ts          # ScaffoldTuning, GameTuningBase interfaces
│   │   ├── state.ts          # Reactive config state with signals
│   │   ├── loader.ts         # Config loading (localStorage → JSON → defaults)
│   │   └── context.tsx       # TuningProvider + useTuning() hook
│   │
│   ├── audio/                # Audio state management
│   │   ├── state.ts          # Volume levels, mute toggles
│   │   └── context.tsx       # AudioProvider + useAudio() hook
│   │
│   ├── pause/                # Pause system
│   │   ├── state.ts          # Pause signal
│   │   ├── keyboard.ts       # Pause hotkey listener
│   │   └── context.tsx       # PauseProvider + usePause() hook
│   │
│   ├── errors/               # Error handling
│   │   ├── types.ts          # Error severity levels
│   │   ├── reporter.ts       # Sentry integration
│   │   └── boundary.tsx      # Solid.js error boundaries
│   │
│   └── manifest/             # Manifest lifecycle
│       └── context.tsx       # ManifestProvider (CDN, embed mode)
│
├── ui/                       # Reusable UI components
│   ├── Button.tsx            # Configurable button with states
│   ├── ProgressBar.tsx       # Animated progress indicator
│   ├── Spinner.tsx           # Loading spinner
│   ├── Logo.tsx              # Branding display
│   └── PauseOverlay.tsx      # Pause menu UI
│
├── dev/                      # Development tools
│   ├── TuningPanel.tsx       # Tweakpane-based config UI
│   ├── TuningConfig.tsx      # Panel configuration
│   ├── bindings.ts           # Tuning path → UI control mappings
│   ├── tuningRegistry.ts     # Wired value tracking
│   └── EasingPicker.ts       # GSAP easing selector
│
├── utils/                    # Utilities
│   └── SettingsMenu/         # Reusable settings interface
│
├── config/                   # Framework configuration
│   └── environment.ts        # CDN, environment detection
│
└── lib/                      # External integrations
    └── sentry.ts             # Error reporting setup
```

### System Summary

| System | Purpose | Hook | Key Files |
|--------|---------|------|-----------|
| **Assets** | Load sprites, audio, fonts from manifest | `useAssets()` | coordinator.ts, gpu/pixi.ts, audio.ts |
| **Screens** | Navigate between screens with transitions | `useScreen()` | manager.ts, context.tsx |
| **Tuning** | Runtime configuration with hot-reload | `useTuning<S,G>()` | state.ts, loader.ts |
| **Audio** | Master/music/SFX volume with persistence | `useAudio()` | state.ts, context.tsx |
| **Pause** | Global pause state with keyboard support | `usePause()` | state.ts, keyboard.ts |
| **Errors** | Layered error boundaries + Sentry | - | boundary.tsx, reporter.ts |

---

## Complete System Inventory

### 1. Asset System

**Purpose**: Load and manage all game assets (textures, audio, fonts) across different rendering engines.

**How it works**:
1. Game provides a `manifest.ts` defining asset bundles
2. `AssetCoordinator` routes bundles to the appropriate loader based on `target` field
3. Loaders handle the actual loading (Pixi for GPU textures, Howler for audio, DOM for images/fonts)

**Targets**:
- `gpu` → Pixi.js textures, spritesheets
- `audio` → Howler.js audio sprites
- `dom` → Images, fonts for UI
- `agnostic` → Assets used in both contexts

**Usage**:
```typescript
const assets = useAssets();
await assets.loadBundle('tiles_citylines_v1');
const texture = assets.getTexture('tile_straight');
```

### 2. Screen System

**Purpose**: State machine for screen navigation with animated transitions.

**Screens**: `loading` | `start` | `game` | `results`

**Transitions**: `fade` | `slide` | `none`

**Usage**:
```typescript
const screen = useScreen();
screen.goto('game', { level: 1 });  // Navigate with data
screen.back();                       // Return to previous
```

### 3. Tuning System

**Purpose**: Runtime configuration with live hot-reload and persistent storage.

**Load priority** (highest wins):
1. URL parameters (`?theme=winter`)
2. Runtime changes (`setGamePath()`)
3. localStorage (`tuning_scaffold`, `tuning_game`)
4. JSON files (`/config/tuning/*.json`)
5. TypeScript defaults

**Storage separation**:
- `tuning_scaffold` - Persists across all games (engine, debug, performance)
- `tuning_game` - Per-game settings (clear when switching games)

**Usage**:
```typescript
const tuning = useTuning<ScaffoldTuning, MyGameTuning>();
const tileSize = tuning.game.grid.tileSize;
tuning.setGamePath('grid.tileSize', 64);
```

### 4. Audio System

**Purpose**: Global volume controls with localStorage persistence.

**Channels**: Master, Music, SFX, Ambient, VO

**Usage**:
```typescript
const audio = useAudio();
audio.setMasterVolume(0.8);
audio.toggleMute();
```

### 5. Pause System

**Purpose**: Global pause state with keyboard shortcuts.

**Hotkeys**: ESC, P, Space

**Usage**:
```typescript
const pause = usePause();
if (pause.isPaused()) {
  // Skip game updates
}
```

### 6. Error System

**Purpose**: Layered error boundaries with crash reporting.

**Boundary hierarchy**:
1. **AssetBoundary** - Asset load failures → retry or skip
2. **ScreenBoundary** - Screen render errors → retry or menu
3. **GlobalBoundary** - Uncaught errors → reload app

---

## The Game Layer

The game layer is **entirely replaced** when creating a new game. Here's what the current CityLines implementation contains:

### Current Game Structure (CityLines)

```
src/game/
├── config.ts                 # Screen component mapping
├── manifest.ts               # Asset bundle definitions
├── state.ts                  # Global game state (score, level, etc.)
├── index.ts                  # Public exports
│
├── config/                   # Game environment config
│   ├── environment.ts        # CDN URLs, API endpoints
│   └── fonts.ts              # Font configurations
│
├── tuning/                   # Game-specific configuration
│   ├── types.ts              # CityLinesTuning interface + defaults
│   └── index.ts              # Exports
│
├── screens/                  # Solid.js screen components
│   ├── LoadingScreen.tsx     # Asset loading with progress
│   ├── StartScreen.tsx       # Main menu, level select
│   ├── GameScreen.tsx        # Gameplay (renders CityLinesGame)
│   ├── ResultsScreen.tsx     # Level complete, story progression
│   ├── components/           # Shared screen components
│   └── hooks/                # Screen-specific hooks
│
├── audio/                    # Game audio management
│   └── GameAudioManager.ts   # Sound effect triggers
│
├── constants/                # Game constants
│   └── viewport.ts           # Viewport sizing
│
└── citylines/                # Core game logic (GAME-SPECIFIC)
    ├── core/                 # Main game entities
    │   ├── CityLinesGame.ts  # Main Pixi.Container (1000+ lines)
    │   ├── RoadTile.ts       # Rotatable puzzle tile
    │   ├── Landmark.ts       # Destination points
    │   ├── Exit.ts           # Start/end points
    │   ├── ConnectionDetector.ts  # BFS pathfinding
    │   ├── ProgressBar.ts    # HUD progress
    │   └── LevelGenerator/   # Procedural generation
    │       ├── LevelGenerator.ts
    │       ├── Dijkstra.ts
    │       └── XoroShiro128Plus.ts
    │
    ├── types/                # Type definitions
    │   ├── level.ts          # LevelConfig, ChapterConfig
    │   ├── grid.ts           # GridPosition, Edge
    │   ├── landmark.ts       # LandmarkType
    │   └── section.ts        # Grid sections
    │
    ├── data/                 # Static data
    │   ├── landmarks.ts      # Landmark definitions
    │   ├── counties.ts       # NJ county configs
    │   └── sampleLevel.ts    # Test level
    │
    ├── services/             # Business logic
    │   ├── LevelGenerationService.ts
    │   └── ChapterGenerationService.ts
    │
    ├── systems/              # Game systems
    │   └── DecorationSystem.ts
    │
    ├── controllers/          # Game controllers
    │   └── LevelCompletionController.ts
    │
    ├── ui/                   # Game UI (Pixi-based)
    │   ├── CluePopup.ts
    │   └── companion/        # Story character
    │       ├── CompanionCharacter.ts
    │       ├── DialogueBox.ts
    │       └── CompanionConfig.ts
    │
    ├── animations/           # GSAP animations
    │   └── companionAnimations.ts
    │
    └── utils/                # Game utilities
        ├── evaluateConnections.ts
        ├── atlasHelper.ts
        └── startScreenHelper.ts
```

### What Each File Does

| File | Purpose | Scaffold Integration |
|------|---------|---------------------|
| `config.ts` | Maps screen IDs to components | Consumed by ScreenProvider |
| `manifest.ts` | Defines asset bundles | Consumed by AssetProvider |
| `state.ts` | Global game state signals | Independent (Solid.js root) |
| `tuning/types.ts` | Game config schema + defaults | Extends GameTuningBase |
| `screens/*.tsx` | UI screens | Use scaffold hooks |
| `citylines/` | Game engine code | Uses assets from scaffold |

---

## Migration Guide: Swapping Games

When creating a new game, you **replace the entire `src/game/` folder** while keeping `src/scaffold/` untouched.

### What to Keep vs Replace

| Keep (Never Touch) | Replace (Swap Out) |
|--------------------|-------------------|
| `src/scaffold/` | `src/game/[gamename]/` |
| `src/app.tsx` (mostly) | `src/game/manifest.ts` |
| `public/` structure | `src/game/config.ts` |
| `vite.config.ts` | `src/game/state.ts` |
| Build configuration | `src/game/tuning/` |
| | `src/game/screens/` |
| | `src/game/audio/` |
| | Game assets in `public/` |

### Step-by-Step Migration

#### Step 1: Backup or Remove Current Game

```bash
# Option A: Remove entirely
rm -rf src/game/citylines

# Option B: Keep as reference
mv src/game/citylines src/game/_citylines_reference
```

#### Step 2: Clear Game Tuning Storage

The scaffold tuning persists, but game tuning should be cleared:

```javascript
// Run in browser console
localStorage.removeItem('tuning_game');
```

#### Step 3: Create New Game Structure

Create the minimum required files:

```
src/game/
├── config.ts          # Required: screen mappings
├── manifest.ts        # Required: asset bundles
├── state.ts           # Required: game state
├── tuning/
│   ├── types.ts       # Required: game config schema
│   └── index.ts       # Required: exports
├── screens/
│   ├── LoadingScreen.tsx   # Required
│   ├── StartScreen.tsx     # Required
│   ├── GameScreen.tsx      # Required
│   └── ResultsScreen.tsx   # Required
└── [newgame]/         # Your game logic
```

#### Step 4: Define Game Tuning

Create `src/game/tuning/types.ts`:

```typescript
import type { GameTuningBase } from '~/scaffold/systems/tuning/types';

export interface MyGameTuning extends GameTuningBase {
  version: string;
  // Your game-specific config
  board: {
    width: number;
    height: number;
  };
  gameplay: {
    speed: number;
    lives: number;
  };
}

export const MY_GAME_DEFAULTS: MyGameTuning = {
  version: '1.0.0',
  board: { width: 8, height: 8 },
  gameplay: { speed: 1.0, lives: 3 },
};
```

#### Step 5: Define Asset Manifest

Create `src/game/manifest.ts`:

```typescript
import type { ManifestBundle } from '~/scaffold/systems/assets/types';

export const manifest: ManifestBundle[] = [
  {
    name: 'theme-branding',
    target: 'agnostic',
    assets: [
      { alias: 'logo', src: '/assets/branding/logo.png' }
    ]
  },
  {
    name: 'atlas-mygame',
    target: 'gpu',
    assets: [
      { alias: 'sprites', src: '/assets/atlases/sprites.json' }
    ]
  },
  {
    name: 'audio-sfx-mygame',
    target: 'audio',
    assets: [
      {
        alias: 'sfx',
        src: '/assets/audio/sfx.mp3',
        data: { sprite: { click: [0, 200], success: [200, 500] } }
      }
    ]
  }
];
```

#### Step 6: Define Screen Config

Create `src/game/config.ts`:

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
  initialScreen: 'loading' as const,
};
```

#### Step 7: Create Screens

Each screen uses scaffold hooks. Example `GameScreen.tsx`:

```typescript
import { Component, onMount, onCleanup } from 'solid-js';
import { useAssets } from '~/scaffold/systems/assets';
import { useScreen } from '~/scaffold/systems/screens';
import { useTuning } from '~/scaffold/systems/tuning';
import type { ScaffoldTuning } from '~/scaffold/systems/tuning/types';
import type { MyGameTuning } from '../tuning/types';
import { MyGame } from '../mygame/core/MyGame';

export const GameScreen: Component = () => {
  const assets = useAssets();
  const screen = useScreen();
  const tuning = useTuning<ScaffoldTuning, MyGameTuning>();

  let containerRef: HTMLDivElement;
  let game: MyGame;

  onMount(async () => {
    // Load game assets if not already loaded
    await assets.loadBundle('atlas-mygame');

    // Create game instance
    game = new MyGame({
      tuning: tuning.game,
      assets,
    });

    // Mount to DOM
    containerRef.appendChild(game.view);

    // Handle game events
    game.on('levelComplete', (data) => {
      screen.goto('results', data);
    });
  });

  onCleanup(() => {
    game?.destroy();
  });

  return <div ref={containerRef!} class="game-container" />;
};
```

#### Step 8: Implement Game Logic

Create your game in `src/game/[newgame]/`:

```typescript
// src/game/mygame/core/MyGame.ts
import { Container, Application } from 'pixi.js';
import { EventEmitter } from 'eventemitter3';

export class MyGame extends EventEmitter {
  private app: Application;
  private container: Container;

  constructor(config: { tuning: MyGameTuning; assets: AssetCoordinator }) {
    super();
    // Initialize Pixi application
    // Set up game entities
    // Wire up input handlers
  }

  get view() {
    return this.app.canvas;
  }

  destroy() {
    this.app.destroy(true);
  }
}
```

### Migration Checklist

- [ ] Remove/archive old game folder
- [ ] Clear `localStorage.tuning_game`
- [ ] Create `game/tuning/types.ts` with new schema
- [ ] Create `game/manifest.ts` with asset bundles
- [ ] Create `game/config.ts` with screen mappings
- [ ] Create `game/state.ts` for game state
- [ ] Create all four screens
- [ ] Create game core logic folder
- [ ] Add assets to `public/`
- [ ] Update dev bindings for tuning panel (optional)
- [ ] Test all screens and transitions

---

## File Reference

### Scaffold Exports (`~/scaffold`)

```typescript
// Systems - import from index
import { useAssets } from '~/scaffold/systems/assets';
import { useScreen } from '~/scaffold/systems/screens';
import { useTuning } from '~/scaffold/systems/tuning';
import { useAudio } from '~/scaffold/systems/audio';
import { usePause } from '~/scaffold/systems/pause';

// Types
import type { ScaffoldTuning, GameTuningBase } from '~/scaffold/systems/tuning/types';
import type { ManifestBundle, LoadedAsset } from '~/scaffold/systems/assets/types';
import type { ScreenId } from '~/scaffold/systems/screens/types';

// UI Components
import { Button } from '~/scaffold/ui/Button';
import { ProgressBar } from '~/scaffold/ui/ProgressBar';
import { Spinner } from '~/scaffold/ui/Spinner';
```

### Game Contract (What Scaffold Expects)

| File | Required Export | Used By |
|------|-----------------|---------|
| `game/config.ts` | `gameConfig.screens` | ScreenProvider |
| `game/manifest.ts` | `manifest: ManifestBundle[]` | AssetProvider |
| `game/tuning/types.ts` | `interface extends GameTuningBase` | TuningProvider |
| `game/tuning/types.ts` | `DEFAULTS` constant | TuningProvider |

---

## Summary

The scaffold framework enables rapid game development by providing:

1. **Complete asset pipeline** - Multi-engine support (Pixi, Three, Phaser)
2. **Screen management** - State machine with transitions
3. **Configuration system** - Hot-reload tuning with persistence
4. **Audio management** - Howler.js integration with volume controls
5. **Error handling** - Layered boundaries with Sentry
6. **Dev tools** - Tweakpane-based tuning panel

To create a new game:
1. Keep `src/scaffold/` untouched
2. Replace everything in `src/game/`
3. Implement the required contract (config, manifest, tuning, screens)
4. Build your game logic in `src/game/[gamename]/`

The scaffold handles the infrastructure; your game handles the fun.

---

*See also:*
- [New Game Guide](../guides/new-game.md) - Quick start for new games
- [Architecture Overview](architecture.md) - Detailed diagrams
- [Deep Dive](deep-dive.md) - Comprehensive technical documentation
