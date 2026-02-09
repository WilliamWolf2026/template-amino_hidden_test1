# Codebase Context Map

A relationship map for understanding the scaffold/game architecture. Optimized for AI context engineering.

---

## System Relationships

```
                    ┌─────────────────────────────────────────┐
                    │              ENTRY POINTS               │
                    └─────────────────────────────────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           ▼                          ▼                          ▼
    ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
    │ app.tsx     │           │entry-server │           │entry-client │
    │ (root)      │           │ (HTML head) │           │ (fonts)     │
    └──────┬──────┘           └─────────────┘           └─────────────┘
           │
           │ imports
           ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                    SCAFFOLD (~/scaffold/)                       │
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
    │  UI: Button, Spinner, ProgressBar, Logo, MobileViewport        │
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
    │  │   Loading ──► Start ──► Game ──► Results                │    │
    │  │      │          │        │                               │    │
    │  │      │          │        └── citylines/CityLinesGame     │    │
    │  │      │          │                                        │    │
    │  │      └──────────┴── audio/GameAudioManager               │    │
    │  └─────────────────────────────────────────────────────────┘    │
    │                                                                  │
    │  ┌─────────────┐                                                │
    │  │ citylines/  │◄── Core game logic (Pixi.js containers)       │
    │  │  core/      │    RoadTile, Landmark, Exit, ConnectionDetector│
    │  │  types/     │                                                │
    │  │  services/  │                                                │
    │  └─────────────┘                                                │
    └─────────────────────────────────────────────────────────────────┘
```

---

## File Dependency Edges

### Entry → Scaffold

| From | To | Relationship |
|------|------|--------------|
| `app.tsx` | `scaffold/index.ts` | Imports providers, hooks, UI |
| `app.tsx` | `game/config.ts` | Imports screen mappings |
| `app.tsx` | `game/tuning/` | Imports game defaults |
| `entry-server.tsx` | - | Font preload, viewport script |
| `entry-client.tsx` | - | fonts.ready wait |

### Scaffold Internal

| System | Depends On | Provides |
|--------|------------|----------|
| Assets | Pixi.js, Howler.js | `useAssets()`, loaders |
| Screens | - | `useScreen()`, goto/back |
| Tuning | - | `useTuning()`, config state |
| Audio | Tuning (for musicEnabled) | `useAudio()`, BaseAudioManager |
| Errors | Sentry | ErrorBoundary |
| UI | - | Button, Spinner, MobileViewport |

### Game → Scaffold

| From | Imports From Scaffold | Purpose |
|------|----------------------|---------|
| `screens/*.tsx` | `useAssets`, `useScreen` | Navigation, asset access |
| `audio/manager.ts` | `BaseAudioManager` | Extend for game sounds |
| `audio/sounds.ts` | `SoundDefinition` | Type for sound constants |
| `tuning/types.ts` | `GameTuningBase` | Extend for game config |
| `config.ts` | Screen types | Register screens |

---

## Key Patterns

### Hook Usage Pattern
```
Screen Component
    └── useAssets() ──► coordinator.audio, getTexture()
    └── useScreen() ──► goto('next'), back()
    └── useTuning() ──► tuning.game.*, tuning.scaffold.*
    └── useAudio()  ──► musicEnabled(), volume()
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
loading ──► start ──► game ──► results
   │          │         │         │
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
| Core game logic | `src/game/citylines/core/` |
| UI components | `src/scaffold/ui/` |
| Debug tools | `src/scaffold/dev/` |

---

## Node Types

| Node Type | Color | Examples |
|-----------|-------|----------|
| Scaffold System | Teal | Assets, Screens, Tuning |
| Scaffold UI | Cyan | Button, Spinner, MobileViewport |
| Game Config | Orange | config.ts, manifest.ts, tuning/ |
| Game Screen | Amber | LoadingScreen, GameScreen |
| Game Logic | Yellow | CityLinesGame, RoadTile |

---

## Quick Context for AI

**When editing game code:**
- Import hooks from `~/scaffold` (useAssets, useScreen, etc.)
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
