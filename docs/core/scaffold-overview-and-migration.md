# 3-Tier Framework: Overview & Migration Guide

> **Design authority**: For tier definitions, contracts, and extension rules, see [amino-architecture.md](amino-architecture.md). This document is the migration guide for forking to a new game.
>
> **Purpose**: This document provides a comprehensive overview of the 3-tier architecture (core / modules / game) and serves as the authoritative guide for forking to a new game implementation.

---

## Table of Contents

1. [What is the 3-Tier Architecture?](#what-is-the-3-tier-architecture)
2. [Architecture Overview](#architecture-overview)
3. [Tier 1: Core](#tier-1-core)
4. [Tier 2: Modules](#tier-2-modules)
5. [Tier 3: Game](#tier-3-game)
6. [Migration Guide: Forking to a New Game](#migration-guide-forking-to-a-new-game)
7. [File Reference](#file-reference)

---

## What is the 3-Tier Architecture?

The framework separates concerns into three layers with strict one-way dependencies:

```
┌─────────────────────────────────────────────────────────────┐
│                       src/core/                              │
│              (NEVER changes between games)                   │
│                                                              │
│   Asset System | Screen System | Tuning | Audio | Errors    │
│            Pixi Loaders | Dev Tools | Analytics events      │
│   UI: Button, Spinner, ProgressBar, Logo, MobileViewport,  │
│       ViewportToggle, PauseOverlay                           │
└─────────────────────────────────────────────────────────────┘
                            |
                    ┌───────┴───────┐
                    │   app.tsx     │
                    │  (wires them) │
                    └───────┬───────┘
                            |
┌─────────────────────────────────────────────────────────────┐
│                     src/modules/                             │
│           (Shared across games, rarely changes)              │
│                                                              │
│   primitives/: SpriteButton, ProgressBar, DialogueBox,      │
│                CharacterSprite                                │
│   prefabs/:    AvatarPopup                                   │
│   logic/:      LevelCompletionController, catalog,           │
│                loader, progress                              │
└─────────────────────────────────────────────────────────────┘
                            |
                    ┌───────┴───────┐
                    │   app.tsx     │
                    │  (wires them) │
                    └───────┬───────┘
                            |
┌─────────────────────────────────────────────────────────────┐
│                      src/game/                               │
│             (REPLACED for each new game)                     │
│                                                              │
│   manifest.ts | config.ts | state.ts | tuning/types.ts      │
│   screens/ | [gamename]/ | audio/ | setup/                   │
└─────────────────────────────────────────────────────────────┘
```

**Dependency rule**: Core NEVER imports from modules or game. Modules NEVER import from game. All dependencies flow downward: game -> modules -> core.

---

## Architecture Overview

### Provider Stack (app.tsx)

The providers nest in a specific order (outer -> inner):

```
GlobalBoundary              <- Error boundary (catches everything)
  TuningProvider            <- Live config system (dev tuning panel)
    AnalyticsProvider       <- Game analytics tracking
      FeatureFlagProvider   <- Feature flag evaluation
        ViewportModeWrapper <- Mobile viewport frame (small/large/none)
          PauseProvider     <- Pause/resume state
            ManifestProvider <- Level manifest loading (takes manifest, defaultGameData, serverStorageUrl)
              AssetProvider  <- Asset loading (Pixi, Howler, DOM)
                ScreenProvider <- Screen routing (goto/back)
                  ScreenRenderer <- Renders current screen
```

### System Summary

| System | Tier | Purpose | Hook | Key Files |
|--------|------|---------|------|-----------|
| **Assets** | Core | Load sprites, audio, fonts from manifest | `useAssets()` | coordinator.ts, gpu/pixi.ts, audio.ts |
| **Screens** | Core | Navigate between screens with transitions | `useScreen()` | manager.ts, context.tsx |
| **Tuning** | Core | Runtime configuration with hot-reload | `useTuning<S,G>()` | state.ts, loader.ts |
| **Audio** | Core | Master/music/SFX volume with persistence | `useAudio()` | state.ts, context.tsx |
| **Pause** | Core | Global pause state with keyboard support | `usePause()` | state.ts, keyboard.ts |
| **Errors** | Core | Layered error boundaries + Sentry | -- | boundary.tsx, reporter.ts |
| **Analytics** | Core + Game | Event definitions (core) + provider (game) | `useAnalytics()` | core/analytics/, game/setup/ |

---

## Tier 1: Core

The core layer provides all framework infrastructure. It never changes between games.

### Directory Structure

```
src/core/
├── config.ts                 # Engine configuration (pixi)
├── index.ts                  # Public API exports
│
├── analytics/                # Analytics event types and interface
│   ├── events.ts             # Event type definitions
│   └── index.ts              # Exports
│
├── config/                   # Framework configuration
│   ├── environment.ts        # CDN, environment detection
│   ├── viewport.ts           # Viewport constraints, URL overrides
│   └── index.ts              # Exports
│
├── systems/                  # Core framework systems
│   ├── assets/               # Asset loading & management
│   │   ├── types.ts          # Manifest, Bundle, Asset types
│   │   ├── coordinator.ts    # Routes assets to appropriate loaders
│   │   ├── loaders/
│   │   │   ├── dom.ts        # DOM-based asset loading (fonts, images)
│   │   │   ├── audio.ts      # Howler.js audio sprite loading
│   │   │   └── gpu/pixi.ts   # Pixi.js texture & spritesheet loading
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
│   │   ├── loader.ts         # Config loading (localStorage -> JSON -> defaults)
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
│   ├── manifest/             # Manifest lifecycle
│   │   └── context.tsx       # ManifestProvider (CDN, embed mode)
│   │
│   └── vfx/                  # Visual effects system
│
├── ui/                       # Reusable UI components
│   ├── Button.tsx            # Configurable button with states
│   ├── ProgressBar.tsx       # Animated progress indicator
│   ├── Spinner.tsx           # Loading spinner
│   ├── Logo.tsx              # Branding display
│   ├── MobileViewport.tsx    # Mobile frame wrapper
│   ├── ViewportToggle.tsx    # Dev viewport mode toggle (S/L/full)
│   └── PauseOverlay.tsx      # Pause menu UI
│
├── dev/                      # Development tools
│   ├── TuningPanel.tsx       # Tweakpane-based config UI
│   ├── Tweakpane.tsx         # Tweakpane wrapper
│   ├── bindings.ts           # Tuning path -> UI control mappings
│   ├── tuningRegistry.ts     # Wired value tracking
│   ├── EasingPicker.ts       # GSAP easing selector
│   └── env.ts                # IS_DEV_ENV flag
│
├── utils/                    # Utilities
│
└── lib/                      # External integrations
    ├── sentry.ts             # Error reporting setup
    ├── posthog.ts            # PostHog analytics
    ├── analytics.ts          # Analytics abstraction
    └── gameKit.ts            # GameKit integration
```

---

## Tier 2: Modules

The modules layer contains reusable components and logic shared across games. Each module is self-contained with its own tuning, defaults, and renderers.

### Directory Structure

```
src/modules/
├── primitives/               # Low-level reusable Pixi components
│   ├── sprite-button/        # Clickable button with NineSliceSprite
│   │   ├── index.ts
│   │   ├── tuning.ts
│   │   ├── defaults.ts
│   │   └── renderers/pixi.ts
│   │
│   ├── progress-bar/         # HUD progress indicator
│   │   ├── index.ts
│   │   ├── tuning.ts
│   │   ├── defaults.ts
│   │   └── renderers/pixi.ts
│   │
│   ├── dialogue-box/         # Text dialogue with NineSliceSprite
│   │   ├── index.ts
│   │   ├── tuning.ts
│   │   ├── defaults.ts
│   │   └── renderers/pixi.ts
│   │
│   └── character-sprite/     # Animated character display
│       ├── index.ts
│       ├── tuning.ts
│       ├── defaults.ts
│       └── renderers/pixi.ts
│
├── prefabs/                  # Higher-level composed components
│   └── avatar-popup/         # Avatar circle + dialogue (uses primitives)
│       ├── index.ts
│       ├── tuning.ts
│       ├── defaults.ts
│       └── renderers/pixi.ts
│
└── logic/                    # Shared game logic (non-visual)
    ├── catalog/              # Chapter/level catalog management
    │   └── index.ts
    ├── level-completion/     # Level completion flow controller
    │   ├── LevelCompletionController.ts
    │   ├── tuning.ts
    │   ├── defaults.ts
    │   └── index.ts
    ├── loader/               # Data loading utilities
    │   └── index.ts
    └── progress/             # Progress tracking
        └── index.ts
```

### Module Conventions

Each module follows a consistent structure:

| File | Purpose |
|------|---------|
| `index.ts` | Public exports |
| `tuning.ts` | TypeScript interface for tunable parameters |
| `defaults.ts` | Default values for tuning parameters |
| `renderers/pixi.ts` | Pixi.js Container implementation |

---

## Tier 3: Game

The game layer is **entirely replaced** when creating a new game. It contains all game-specific screens, logic, assets, and configuration.

### Current Game Structure (CityLines)

```
src/game/
├── config.ts                 # Screen component mapping
├── manifest.ts               # Asset bundle definitions
├── state.ts                  # Global game state (score, level, etc.)
├── index.ts                  # Public exports
│
├── tuning/                   # Game-specific configuration
│   ├── types.ts              # CityLinesTuning interface + defaults
│   └── index.ts              # Exports
│
├── setup/                    # Game-level providers
│   ├── AnalyticsContext.tsx   # Analytics provider + useAnalytics()
│   └── FeatureFlagContext.tsx # Feature flag provider
│
├── screens/                  # Solid.js screen components
│   ├── LoadingScreen.tsx     # Asset loading with progress
│   ├── StartScreen.tsx       # Main menu, level select
│   ├── GameScreen.tsx        # Gameplay (renders CityLinesGame)
│   └── ResultsScreen.tsx     # Level complete, story progression
│
├── audio/                    # Game audio management
│   └── GameAudioManager.ts   # Sound effect triggers
│
├── services/                 # Game services
│   └── progress.ts           # Progress persistence
│
├── citylines/                # Core game logic (GAME-SPECIFIC)
│   ├── core/                 # Main game entities
│   │   ├── CityLinesGame.ts  # Main Pixi.Container
│   │   ├── RoadTile.ts       # Rotatable puzzle tile
│   │   ├── Landmark.ts       # Destination points
│   │   ├── Exit.ts           # Start/end points
│   │   ├── ConnectionDetector.ts  # BFS pathfinding
│   │   └── LevelGenerator/   # Procedural generation
│   │
│   ├── types/                # Type definitions
│   ├── data/                 # Static data
│   ├── services/             # Business logic
│   ├── systems/              # Game systems
│   ├── ui/                   # Game UI (Pixi-based)
│   └── animations/           # GSAP animations
│
└── dailydispatch/            # Additional game mode
```

### What Each File Does

| File | Purpose | Integration |
|------|---------|-------------|
| `config.ts` | Maps screen IDs to components | Consumed by ScreenProvider |
| `manifest.ts` | Defines asset bundles | Consumed by AssetProvider |
| `state.ts` | Global game state signals | Independent (Solid.js root) |
| `tuning/types.ts` | Game config schema + defaults | Extends GameTuningBase |
| `setup/*.tsx` | Analytics + feature flag providers | Wrap in app.tsx provider stack |
| `screens/*.tsx` | UI screens | Use core hooks + module components |
| `citylines/` | Game engine code | Uses assets from core, components from modules |

---

## Migration Guide: Forking to a New Game

When creating a new game, you **replace the entire `src/game/` folder** while keeping `src/core/` and `src/modules/` untouched.

### What to Keep vs Replace

| Keep (Never Touch) | Optionally Extend | Replace (Swap Out) |
|--------------------|-------------------|-------------------|
| `src/core/` | `src/modules/` | `src/game/config.ts` |
| `index.html` (mostly) | | `src/game/asset-manifest.ts` |
| `vite.config.ts` | | `src/game/state.ts` |
| Build configuration | | `src/game/tuning/` |
| | | `src/game/screens/` |
| | | `src/game/audio/` |
| | | `src/game/setup/` |
| | | `src/game/[gamename]/` |
| | | Game assets in `public/` |

### Step-by-Step Migration

#### Step 1: Fork the Repository

```bash
# Clone the scaffold-production repo as your new game
git clone <scaffold-production-url> my-new-game
cd my-new-game
```

#### Step 2: Remove Current Game Code

```bash
# Remove the existing game implementation
rm -rf src/game/citylines
rm -rf src/game/dailydispatch
rm -rf src/game/screens
rm -rf src/game/audio
rm -rf src/game/setup
rm -rf src/game/services
rm -rf src/game/data
rm -rf src/game/hooks
rm -rf src/game/analytics
rm -rf src/game/types
rm -rf src/game/utils
```

#### Step 3: Clear Game Tuning Storage

The core tuning persists, but game tuning should be cleared:

```javascript
// Run in browser console
localStorage.removeItem('tuning_game');
```

#### Step 4: Create New Game Structure

Create the minimum required files:

```
src/game/
├── config.ts          # Required: screen mappings
├── manifest.ts        # Required: asset bundles
├── state.ts           # Required: game state
├── index.ts           # Required: public exports
├── tuning/
│   ├── types.ts       # Required: game config schema
│   └── index.ts       # Required: exports
├── setup/
│   ├── AnalyticsContext.tsx   # Required: analytics provider
│   └── FeatureFlagContext.tsx # Required: feature flag provider
├── screens/
│   ├── LoadingScreen.tsx   # Required
│   ├── StartScreen.tsx     # Required
│   ├── GameScreen.tsx      # Required
│   └── ResultsScreen.tsx   # Required
└── [newgame]/         # Your game logic
```

#### Step 5: Define Game Tuning

Create `src/game/tuning/types.ts`:

```typescript
import type { GameTuningBase } from '~/core/systems/tuning/types';

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

#### Step 6: Define Asset Manifest

Create `src/game/asset-manifest.ts`:

```typescript
import type { ManifestBundle } from '~/core/systems/assets/types';

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

#### Step 7: Define Screen Config

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

#### Step 8: Create Setup Providers

Create `src/game/setup/AnalyticsContext.tsx`:

```typescript
import { createContext, useContext, type JSX } from 'solid-js';

const AnalyticsContext = createContext<AnalyticsAPI>();

export function AnalyticsProvider(props: { children: JSX.Element }) {
  // Initialize your analytics here
  const api = { /* ... */ };
  return (
    <AnalyticsContext.Provider value={api}>
      {props.children}
    </AnalyticsContext.Provider>
  );
}

export const useAnalytics = () => useContext(AnalyticsContext)!;
```

Create `src/game/setup/FeatureFlagContext.tsx`:

```typescript
import { createContext, useContext, type JSX } from 'solid-js';

const FeatureFlagContext = createContext<FeatureFlagAPI>();

export function FeatureFlagProvider(props: { children: JSX.Element }) {
  // Initialize your feature flags here
  const api = { /* ... */ };
  return (
    <FeatureFlagContext.Provider value={api}>
      {props.children}
    </FeatureFlagContext.Provider>
  );
}

export const useFeatureFlags = () => useContext(FeatureFlagContext)!;
```

#### Step 9: Create Screens

Each screen uses core hooks and module components. Example `GameScreen.tsx`:

```typescript
import { Component, onMount, onCleanup } from 'solid-js';
import { useAssets } from '~/core/systems/assets';
import { useScreen } from '~/core/systems/screens';
import { useTuning } from '~/core/systems/tuning';
import type { ScaffoldTuning } from '~/core/systems/tuning/types';
import type { MyGameTuning } from '../tuning/types';
import { MyGame } from '../mygame/core/MyGame';

export const GameScreen: Component = () => {
  const assets = useAssets();
  const screen = useScreen();
  const tuning = useTuning<ScaffoldTuning, MyGameTuning>();

  let containerRef: HTMLDivElement;
  let game: MyGame;

  onMount(async () => {
    await assets.loadBundle('atlas-mygame');

    game = new MyGame({
      tuning: tuning.game,
      assets,
    });

    containerRef.appendChild(game.view);

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

#### Step 10: Update app.tsx

Update the imports in `app.tsx` to point to your new game:

```typescript
import { gameConfig, manifest, defaultGameData } from '~/game';
import { GAME_DEFAULTS } from '~/game/tuning';
import { AnalyticsProvider } from '~/game/setup/AnalyticsContext';
import { FeatureFlagProvider } from '~/game/setup/FeatureFlagContext';
```

#### Step 11: Implement Game Logic

Create your game in `src/game/[newgame]/`, using module components as needed:

```typescript
// Use module primitives
import { SpriteButton } from '~/modules/primitives/sprite-button';
import { ProgressBar } from '~/modules/primitives/progress-bar';
import { DialogueBox } from '~/modules/primitives/dialogue-box';

// Use module prefabs
import { AvatarPopup } from '~/modules/prefabs/avatar-popup';

// Use module logic
import { LevelCompletionController } from '~/modules/logic/level-completion';
```

### Forking Checklist

- [ ] Fork/clone the scaffold-production repository
- [ ] Remove old game folders (`citylines/`, `dailydispatch/`, etc.)
- [ ] Clear `localStorage.tuning_game`
- [ ] Create `game/tuning/types.ts` with new schema
- [ ] Create `game/asset-manifest.ts` with asset bundles
- [ ] Create `game/config.ts` with screen mappings
- [ ] Create `game/state.ts` for game state
- [ ] Create `game/index.ts` with public exports
- [ ] Create `game/setup/AnalyticsContext.tsx`
- [ ] Create `game/setup/FeatureFlagContext.tsx`
- [ ] Create all four screens (Loading, Start, Game, Results)
- [ ] Create game core logic folder (`game/[gamename]/`)
- [ ] Add assets to `public/`
- [ ] Update `app.tsx` imports if needed
- [ ] Update `index.html` font preload path
- [ ] Update dev bindings for tuning panel (optional)
- [ ] Test all screens and transitions
- [ ] Verify analytics and feature flags are wired

---

## File Reference

### Core Exports (`~/core`)

```typescript
// Systems - import from index
import { useAssets } from '~/core/systems/assets';
import { useScreen } from '~/core/systems/screens';
import { useTuning } from '~/core/systems/tuning';
import { useAudio } from '~/core/systems/audio';
import { usePause } from '~/core/systems/pause';

// Types
import type { ScaffoldTuning, GameTuningBase } from '~/core/systems/tuning/types';
import type { ManifestBundle, LoadedAsset } from '~/core/systems/assets/types';
import type { ScreenId } from '~/core/systems/screens/types';

// UI Components
import { Button } from '~/core/ui/Button';
import { ProgressBar } from '~/core/ui/ProgressBar';
import { Spinner } from '~/core/ui/Spinner';
import { ViewportToggle } from '~/core/ui/ViewportToggle';
```

### Module Exports (`~/modules`)

```typescript
// Primitives
import { SpriteButton } from '~/modules/primitives/sprite-button';
import { ProgressBar } from '~/modules/primitives/progress-bar';
import { DialogueBox } from '~/modules/primitives/dialogue-box';
import { CharacterSprite } from '~/modules/primitives/character-sprite';

// Prefabs
import { AvatarPopup } from '~/modules/prefabs/avatar-popup';

// Logic
import { LevelCompletionController } from '~/modules/logic/level-completion';
```

### Game Contract (What Core Expects)

| File | Required Export | Used By |
|------|-----------------|---------|
| `game/config.ts` | `gameConfig.screens` | ScreenProvider |
| `game/asset-manifest.ts` | `manifest: ManifestBundle[]` | ManifestProvider |
| `game/tuning/types.ts` | `interface extends GameTuningBase` | TuningProvider |
| `game/tuning/types.ts` | `DEFAULTS` constant | TuningProvider |
| `game/setup/AnalyticsContext.tsx` | `AnalyticsProvider` | app.tsx provider stack |
| `game/setup/FeatureFlagContext.tsx` | `FeatureFlagProvider` | app.tsx provider stack |

---

## Summary

The 3-tier framework enables rapid game development by providing:

1. **Core** -- Complete asset pipeline, screen management, configuration, audio, error handling, dev tools
2. **Modules** -- Reusable Pixi.js primitives (SpriteButton, ProgressBar, etc.), prefabs (AvatarPopup), and shared logic (LevelCompletionController)
3. **Game** -- Game-specific screens, logic, assets, analytics, and feature flags

To create a new game:
1. Keep `src/core/` untouched
2. Use `src/modules/` components as needed (optionally extend with new modules)
3. Replace everything in `src/game/`
4. Implement the required contract (config, manifest, tuning, screens, setup providers)
5. Build your game logic in `src/game/[gamename]/`

The core handles infrastructure, modules provide reusable building blocks, and your game handles the fun.

---

## Scaffold Commands Reference

All commands are run from the game repo root with `bun run`.

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `scaffold:sync` | Pull latest scaffold (selective checkout) | Routine updates (non-breaking) |
| `scaffold:verify` | Run typecheck + lint + build | After every sync |
| `scaffold:rollback` | Revert the last sync commit | When a sync broke something |
| `scaffold:drift` | Detect local changes to scaffold paths | Before syncing, or periodically |
| `scaffold:release` | Bump version + tag (scaffold repo only) | When publishing a new scaffold version |

For major (breaking) scaffold updates, use a full merge instead of `scaffold:sync`:

```bash
git fetch scaffold && git merge scaffold/main
```

## Adopting Scaffold Updates (Existing Games)

If your game was forked before the scaffold tooling existed, follow these steps to adopt it:

1. **Add the scaffold remote**:
   ```bash
   git remote add scaffold git@github.com:wolfgames/scaffold-production.git
   ```

2. **Run your first sync** — this establishes the version tracking metadata:
   ```bash
   bun run scaffold:sync
   ```

3. **Verify** the sync didn't break anything:
   ```bash
   bun run scaffold:verify
   ```

4. **Check for drift** — if your game modified `src/core/` or `src/modules/` locally, those changes will be overwritten on sync. Review drift first:
   ```bash
   bun run scaffold:drift
   ```

5. **(Optional) Add the update-check workflow** — copy `docs/core/scaffold-update-check.yml` to `.github/workflows/scaffold-update-check.yml` in your game repo to get automatic issue creation when new scaffold versions are released.

---

*See also:*
- [Scaffold Sync Guide](scaffold-sync-guide.md) -- Detailed sync, verify, rollback, and release workflow
- [Architecture Map](architecture-map.md) -- Full system architecture diagram
- [Context Map](context-map.md) -- Dependency relationships
- [Entry Points](entry-points.md) -- How the app boots
- [Entry Point Map](entry-point-map.md) -- Visual provider traversal
- [Scene Graph](scene-graph.md) -- Pixi.js display object hierarchy
