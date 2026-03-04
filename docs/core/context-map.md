# Codebase Context Map

A relationship map for understanding the 3-tier core/modules/game architecture. Optimized for AI context engineering.

---

## System Relationships

```
                    ┌─────────────────────────────────────────┐
                    │            ENTRY POINT                   │
                    │      index.html  ->  app.tsx             │
                    └─────────────────┬───────────────────────┘
                                      │
                                      │ imports
                                      ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                       CORE (~/core/)                            │
    │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
    │  │ Assets  │ │ Screens │ │ Tuning  │ │ Audio   │ │ Errors  │   │
    │  │         │ │         │ │         │ │         │ │         │   │
    │  │useAssets│ │useScreen│ │useTuning│ │useAudio │ │Boundary │   │
    │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └─────────┘   │
    │       │           │           │           │                     │
    │  ┌────┴────┐ ┌────┴────┐     │      ┌────┴─────┐               │
    │  │Loaders: │ │Manager  │     │      │BaseAudio │               │
    │  │ -Pixi   │ │Renderer │     │      │Manager   │               │
    │  │ -Audio  │ │         │     │      │          │               │
    │  │ -DOM    │ │         │     │      │SoundDef  │               │
    │  └─────────┘ └─────────┘     │      └──────────┘               │
    │                              │                                  │
    │  UI: Button, Spinner, ProgressBar, Logo, MobileViewport,       │
    │      ViewportToggle, PauseOverlay                               │
    │  Analytics: events.ts, index.ts                                 │
    └──────────────────────────────┼──────────────────────────────────┘
                                   │
                                   │ consumed by
                                   ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                    MODULES (~/modules/)                         │
    │                                                                  │
    │  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐       │
    │  │ primitives/      │  │ prefabs/     │  │ logic/       │       │
    │  │                  │  │              │  │              │       │
    │  │ sprite-button/   │  │ avatar-popup/│  │ catalog/     │       │
    │  │ progress-bar/    │  │              │  │ level-       │       │
    │  │ dialogue-box/    │  │              │  │  completion/ │       │
    │  │ character-sprite/│  │              │  │ loader/      │       │
    │  │                  │  │              │  │ progress/    │       │
    │  │ Each has:        │  │ Each has:    │  │              │       │
    │  │  renderers/pixi  │  │  renderers/  │  │              │       │
    │  │  tuning.ts       │  │  pixi        │  │              │       │
    │  │  defaults.ts     │  │  tuning.ts   │  │              │       │
    │  │  index.ts        │  │  defaults.ts │  │              │       │
    │  └──────────────────┘  └──────────────┘  └──────────────┘       │
    └──────────────────────────────┼──────────────────────────────────┘
                                   │
                                   │ consumed by
                                   ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                      GAME (~/game/)                             │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
    │  │ config.ts   │  │ manifest.ts │  │ tuning/     │              │
    │  │ (screens)   │  │ (assets)    │  │ (defaults)  │              │
    │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
    │         │                │                │                      │
    │         ▼                │                │                      │
    │  ┌─────────────────────────────────────────────────────────┐    │
    │  │                    screens/                              │    │
    │  │   Loading --> Start --> Game --> Results                 │    │
    │  │      │          │        │                               │    │
    │  │      │          │        └── citylines/CityLinesGame     │    │
    │  │      │          │                                        │    │
    │  │      └──────────┴── audio/GameAudioManager               │    │
    │  └─────────────────────────────────────────────────────────┘    │
    │                                                                  │
    │  ┌─────────────┐  ┌─────────────┐                               │
    │  │ setup/      │  │ services/   │                               │
    │  │ Analytics   │  │ progress.ts │                               │
    │  │ FeatureFlag │  │             │                               │
    │  └─────────────┘  └─────────────┘                               │
    │                                                                  │
    │  ┌─────────────┐                                                │
    │  │ citylines/  │<-- Game-specific logic (Pixi.js containers)   │
    │  │  core/      │    RoadTile, Landmark, Exit, ConnectionDetector│
    │  │  types/     │    (uses modules/ for shared components)       │
    │  │  services/  │                                                │
    │  └─────────────┘                                                │
    └─────────────────────────────────────────────────────────────────┘
```

---

## File Dependency Edges

### Entry -> Core

| From | To | Relationship |
|------|------|--------------|
| `app.tsx` | `core/index.ts` | Imports providers, hooks, UI |
| `app.tsx` | `game/config.ts` | Imports screen mappings |
| `app.tsx` | `game/tuning/` | Imports game defaults |
| `app.tsx` | `game/setup/` | Imports AnalyticsProvider, FeatureFlagProvider |
| `app.tsx` | `core/ui/ViewportToggle` | Dev-only viewport toggle |

### Core Internal

| System | Depends On | Provides |
|--------|------------|----------|
| Assets | Pixi.js, Howler.js | `useAssets()`, loaders |
| Screens | - | `useScreen()`, goto/back |
| Tuning | - | `useTuning()`, config state |
| Audio | Tuning (for musicEnabled) | `useAudio()`, BaseAudioManager |
| Errors | Sentry | ErrorBoundary |
| UI | - | Button, Spinner, MobileViewport, ViewportToggle |
| Config | - | Viewport constraints (min width, touch targets) |
| Analytics | - | Event types, tracking interface |

### Modules -> Core

| From | Imports From Core | Purpose |
|------|-------------------|---------|
| `primitives/*/renderers/pixi.ts` | Pixi.js types | Rendering components |
| `logic/*/` | Core types | Shared game logic |

### Game -> Core

| From | Imports From Core | Purpose |
|------|-------------------|---------|
| `screens/*.tsx` | `useAssets`, `useScreen` | Navigation, asset access |
| `audio/manager.ts` | `BaseAudioManager` | Extend for game sounds |
| `audio/sounds.ts` | `SoundDefinition` | Type for sound constants |
| `tuning/types.ts` | `GameTuningBase` | Extend for game config |
| `config.ts` | Screen types | Register screens |

### Game -> Modules

| From | Imports From Modules | Purpose |
|------|---------------------|---------|
| `screens/*.tsx` | `modules/primitives/*` | SpriteButton, ProgressBar, etc. |
| `screens/*.tsx` | `modules/prefabs/*` | AvatarPopup |
| `citylines/` | `modules/logic/*` | LevelCompletionController, etc. |

---

## Key Patterns

### Hook Usage Pattern
```
Screen Component
    └── useAssets() --> coordinator.audio, getTexture()
    └── useScreen() --> goto('next'), back()
    └── useTuning() --> tuning.game.*, tuning.scaffold.*
    └── useAudio()  --> musicEnabled(), volume()
```

### Module Structure Pattern
```
modules/primitives/[component-name]/
    ├── index.ts         # Public exports
    ├── tuning.ts        # Tuning type definition
    ├── defaults.ts      # Default tuning values
    └── renderers/
        └── pixi.ts      # Pixi.js renderer
```

### Audio Pattern
```
sounds.ts (SoundDefinition constants)
    └── manager.ts (extends BaseAudioManager)
        └── playSound(), playRandomSound(), startMusic()
            └── GameScreen (creates manager, wires to events)
```

### Screen Flow Pattern
```
loading --> start --> game --> results
   |          |         |         |
   └──────────┴─────────┴─────────┘
           goto() / back()
```

---

## Where to Find Things

| Looking For | Location |
|-------------|----------|
| Add a new screen | `src/game/screens/` + `src/game/config.ts` |
| Add a new sound | `src/game/audio/sounds.ts` + `manager.ts` |
| Change game config | `src/game/tuning/types.ts` |
| Add game assets | `src/game/manifest.ts` + `public/assets/` |
| Reusable primitives (SpriteButton, ProgressBar, etc.) | `src/modules/primitives/` |
| Reusable prefabs (AvatarPopup, etc.) | `src/modules/prefabs/` |
| Shared game logic (LevelCompletion, progress, etc.) | `src/modules/logic/` |
| Core game logic | `src/game/citylines/core/` |
| Viewport constraints | `src/core/config/viewport.ts` |
| UI components (DOM-level) | `src/core/ui/` |
| Debug tools | `src/core/dev/` |
| Analytics setup | `src/game/setup/AnalyticsContext.tsx` |
| Feature flags | `src/game/setup/FeatureFlagContext.tsx` |
| ViewportToggle | `src/core/ui/ViewportToggle.tsx` |

---

## Node Types

| Node Type | Color | Examples |
|-----------|-------|----------|
| Core System | Teal | Assets, Screens, Tuning |
| Core UI | Cyan | Button, Spinner, MobileViewport, ViewportToggle |
| Module Primitive | Lime | SpriteButton, ProgressBar, DialogueBox, CharacterSprite |
| Module Prefab | Green | AvatarPopup |
| Module Logic | Yellow-Green | LevelCompletionController, catalog, progress |
| Game Config | Orange | config.ts, manifest.ts, tuning/ |
| Game Screen | Amber | LoadingScreen, GameScreen |
| Game Logic | Yellow | CityLinesGame, RoadTile |

---

## Quick Context for AI

**3-Tier dependency flow:**
```
CORE  <--  MODULES  <--  GAME
(never imports from modules or game)
         (never imports from game)
                        (imports from both)
```

**When editing game code:**
- Import hooks from `~/core` (useAssets, useScreen, etc.)
- Import reusable primitives from `~/modules/primitives/` (SpriteButton, ProgressBar, etc.)
- Import reusable prefabs from `~/modules/prefabs/` (AvatarPopup, etc.)
- Import shared logic from `~/modules/logic/` (LevelCompletionController, etc.)
- Create game-specific wrappers in `[gamename]/` that inject config into module components
- Extend `BaseAudioManager` for audio
- Define sounds as `SoundDefinition` constants
- Add assets to `manifest.ts`

**When debugging:**
- Check `docs/guides/troubleshooting.md`
- Screen not rendering? Check `config.ts` screen mapping
- Audio not playing? Check `unlockAudio()` called, bundle loaded
- Asset missing? Check `manifest.ts` bundle registration

**When adding features:**
- New screen: Add to `screens/`, register in `config.ts`
- New sound: Add to `sounds.ts`, add method to `manager.ts`
- New config: Add to `tuning/types.ts`, use via `useTuning()`
- New reusable component: Add to `modules/primitives/` or `modules/prefabs/`
- New shared logic: Add to `modules/logic/`
