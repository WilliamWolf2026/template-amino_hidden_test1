# Game Index

Game-specific code. Can import from `scaffold/` and `modules/`. Nothing outside `game/` should import from here.

## Infrastructure (customize when forking)

| Intent | Path |
|--------|------|
| Game identity (name, slug, IDs) | config/identity.ts |
| Font configuration | config/fonts.ts |
| Screen wiring, initial screen, server URLs | config.ts |
| Asset manifest / bundles | manifest.ts |
| Global game state signals | state.ts |
| Default game data (chapters, levels) | data/default.json |
| Game-specific tuning types | tuning/types.ts |
| Game tuning defaults & URL overrides | tuning/index.ts |
| Analytics context & trackers | setup/AnalyticsContext.tsx |
| Feature flag context | setup/FeatureFlagContext.tsx |
| Analytics helper (getUserData) | setup/helper.ts |

## Screens (Solid.js)

| Intent | Path |
|--------|------|
| Loading screen | screens/LoadingScreen.tsx |
| Start / menu screen | screens/StartScreen.tsx |
| Main game screen | screens/GameScreen.tsx |
| Results / completion screen | screens/ResultsScreen.tsx |
| Completion overlay component | screens/components/CompletionOverlay.tsx |
| Companion dialogue hook | screens/hooks/useCompanionDialogue.ts |

## Services

| Intent | Path |
|--------|------|
| Chapter catalog (ordered content) | services/chapterCatalog.ts |
| Chapter loader (fetch + transform) | services/chapterLoader.ts |
| Player progress (save/load/clear) | services/progress.ts |

## Audio

| Intent | Path |
|--------|------|
| GameAudioManager (extends BaseAudioManager) | audio/manager.ts |
| Sound effect catalog | audio/sounds.ts |

## Hooks & Types

| Intent | Path |
|--------|------|
| useGameData hook | hooks/useGameData.ts |
| Dialogue type system | types/dialogue.ts |
| Game data interfaces | types/gameData.ts |
| Debug URL params | utils/debugParams.ts |
| Analytics trackers | analytics/trackers.ts |

## Game Logic (replace when forking)

| Intent | Path |
|--------|------|
| CityLines — road connection puzzle | citylines/ |
| DailyDispatch — sliding block puzzle | dailydispatch/ |

## Where to put new files

- Game mechanic / controller → `game/<your-game-name>/`
- New screen → `game/screens/`
- New state signals → `game/state.ts`
- Module configuration → `game/setup/`
- Game-specific tuning → `game/tuning/`
- Reusable across games? → Don't put it here, use `modules/`.

## Forking Checklist

1. `config/identity.ts` — change name, slug, IDs
2. `config.ts` — point to your screens
3. `manifest.ts` — list your asset bundles
4. `state.ts` — define your state shape
5. `tuning/` — set your tuning defaults
6. `setup/` — configure analytics, feature flags
7. `screens/` — build your screens
8. Delete `citylines/` & `dailydispatch/`, create your game folder
