---
name: scaffold-profiles
description: Lightning and game_client scaffold documentation. Use when setting up a new game project, choosing a scaffold, or looking up framework APIs. Triggers on: scaffold, lightning, game_client, SolidJS, Preact, project setup, setupGame, GameDeps, screen routing, createPixiAdapter, createProgressService, getStored, setStored.
user-invocable: false
---

# Scaffold Profiles

Two scaffold profiles are available. The **lightning** profile is the primary/recommended scaffold.

## Lightning Profile (Recommended)

**Stack**: SolidJS 1.x + Pixi.js 8.x + GSAP 3.x + Howler 2.x + jsfxr + Vite + TypeScript strict + Tailwind CSS v4

### Architecture
- **Core** (`src/core/`): Framework plumbing -- screens, audio, errors, settings, viewport, storage. DO NOT EDIT.
- **Modules** (`src/modules/`): Reusable building blocks -- primitives, logic, prefabs.
- **Game** (`src/game/`): Game-specific code. THIS IS WHAT YOU EDIT.

### Scaffold Layout
```
src/index.tsx                     // SolidJS entry
src/app.tsx                       // root component: provider stack + HUD
src/core/                         // framework plumbing (DO NOT EDIT)
  systems/audio.tsx               // AudioProvider, useAudio()
  systems/screens.tsx             // ScreenProvider, useScreen(), goto()
  systems/renderer.tsx            // RendererProvider, RendererAdapter type
  systems/errors.tsx              // ErrorBoundary, ScreenBoundary
  systems/viewport.tsx            // ViewportWrapper, ViewportToggle
  systems/settings.tsx            // SettingsMenu
  systems/storage.ts              // getStored/setStored
  systems/versioned-storage.ts    // createVersionedStore
  systems/gpu-loader.ts           // PixiLoader interface
src/modules/
  renderers/pixi.ts               // createPixiAdapter()
  primitives/sprite-button/       // pressable sprite with animations
  primitives/dialogue-box/        // 9-slice speech bubble
  primitives/character-sprite/    // atlas-based character
  primitives/progress-bar/        // segmented progress
  logic/level-completion/         // playing -> completing -> complete state machine
  logic/progress/                 // versioned save/load (createProgressService)
  logic/catalog/                  // ordered content navigation
  logic/loader/                   // fetch + transform pipeline
  prefabs/avatar-popup/           // character avatar popup
src/game/                         // game-specific code
  config.ts                       // GameConfig: id, name, renderer, screen map
  types.ts                        // GameConfig interface
  screens/StartScreen.tsx         // start screen shell
  screens/GameScreen.tsx          // game screen shell
  mygame/gameController.ts        // game logic + renderer interaction
  mygame/startView.ts             // start screen DOM setup
```

### What the Scaffold Already Provides (DO NOT RECREATE)
| System | How to Use |
|--------|-----------|
| Screen routing + transitions | `goto('game')`, `goto('start')` via ScreenProvider |
| Audio state (volume, mute) | `useAudio()` from core, persisted to localStorage |
| Renderer setup + cleanup | `deps.renderer.init(el)` / `.destroy()` via GameDeps |
| Error boundaries | ScreenBoundary wraps each screen automatically |
| Settings panel | Already in app.tsx provider stack |
| localStorage persistence | `getStored(key, default)` / `setStored(key, val)` |
| Versioned storage with migration | `createVersionedStore({ key, version, defaults })` |
| Game controller pattern | `setupGame(deps)` -> `{ init, destroy }` |
| Start screen shell | StartScreen.tsx + startView.ts -- fill in branding |
| Game screen shell | GameScreen.tsx -- mounts gameController automatically |
| GSAP animation | `import gsap from 'gsap'` -- ready for tweens/juice |
| Howler.js audio | `import { Howl } from 'howler'` |
| jsfxr synthesis | `import { sfxr } from 'jsfxr'` |
| Tailwind CSS v4 | Utility classes on SolidJS screen components |
| Pixi.js 8 adapter | `createPixiAdapter()` |
| Sprite button | `import { SpriteButton } from modules/primitives/sprite-button` |
| Progress service | `createProgressService<T>()` from modules/logic/progress |
| Level completion FSM | `createLevelCompletionController()` from modules/logic/level-completion |

### State Management
No global store library. Game state lives in closure variables inside gameController's `init()` function.

```typescript
export function setupGame(deps: GameDeps) {
  const { renderer } = deps;
  const init = async (el: HTMLDivElement) => {
    await renderer.init(el);
    const app = renderer.instance as Application;

    // Game state in closure:
    let gameState: GameState = createInitialState();

    // Input, render, game loop all in this closure
  };
  const destroy = () => { renderer.destroy(); };
  return { init, destroy };
}
```

### Stack Override Rule
If spec artifacts reference "zustand", "preact", or "game_client" -- IGNORE those. They were generated before the scaffold switch. This scaffold uses:
- **UI**: SolidJS (NOT Preact, NOT React)
- **State**: Closure-based (NOT zustand)
- **Persistence**: getStored/setStored (NOT zustand persist)
- **Routing**: ScreenProvider + goto() (NOT zustand store)

### Build Commands
```bash
npx tsc --noEmit    # typecheck
npx vite build      # production build
npx vite dev        # dev server
bun install         # install deps
```

### Stage File Targets

#### Micro
```yaml
create:
  - src/game/mygame/gameState.ts     # pure step function
  - src/game/mygame/types.ts         # GameState, PlayerAction, LudemicEvent
modify:
  - src/game/mygame/gameController.ts # replace demo with real game
  - src/game/mygame/startView.ts      # update branding
  - src/game/config.ts                # set game identity
```

#### Meso
```yaml
create:
  - src/game/mygame/levels.ts        # 3-5 level definitions
modify:
  - src/game/mygame/gameState.ts     # extend with level fields
  - src/game/mygame/types.ts         # add LevelDef, LevelStatus
  - src/game/mygame/gameController.ts # level lifecycle
```

#### Level Gen
```yaml
create:
  - src/game/mygame/levelGenerator.ts
  - src/game/mygame/levelValidator.ts
modify:
  - src/game/mygame/levels.ts        # attach proofs
  - src/game/mygame/types.ts         # SolvabilityProof, GenerationStrategy
```

#### Macro
```yaml
create:
  - src/game/mygame/progression.ts   # uses createProgressService
  - src/game/mygame/replay.ts
  - src/game/mygame/bots/randomBot.ts
  - src/game/mygame/bots/greedyBot.ts
  - src/game/mygame/bots/types.ts
modify:
  - src/game/mygame/gameState.ts
  - src/game/mygame/types.ts
  - src/game/mygame/gameController.ts
```

#### UI (Visual Design)
```yaml
create:
  - src/game/mygame/theme.ts         # color tokens + typography
  - src/game/mygame/sprites.ts       # visual ludeme factories
modify:
  - src/game/mygame/gameController.ts # use sprites + theme
  - src/game/mygame/startView.ts     # apply theme
  - src/game/screens/StartScreen.tsx  # tailwind theme classes
  - src/game/screens/GameScreen.tsx   # tailwind theme classes
```

#### Sound
```yaml
create:
  - src/game/mygame/sounds.ts        # jsfxr definitions + playSound()
modify:
  - src/game/mygame/gameController.ts # wire sound triggers
```

#### Juice
```yaml
create:
  - src/game/mygame/juice.ts         # particles + shake via GSAP
modify:
  - src/game/mygame/gameController.ts # trigger juice on events
```

#### Lifecycle
```yaml
create:
  - src/game/screens/GameOverScreen.tsx
modify:
  - src/game/config.ts               # register game_over screen
  - src/game/mygame/gameController.ts # goto('game_over') on end
  - src/game/mygame/startView.ts     # polish branding
```

#### FTUE
```yaml
create:
  - src/game/mygame/tutorial.ts
modify:
  - src/game/mygame/gameController.ts # wire tutorial
```

#### Attract
```yaml
create:
  - src/game/mygame/attractMode.ts
modify:
  - src/game/mygame/startView.ts     # mount attract behind title
  - src/game/screens/StartScreen.tsx  # pass renderer for attract
```

### Common Fix Patterns
| Problem | Solution |
|---------|----------|
| SolidJS JSX errors | Ensure file is .tsx with vite-plugin-solid configured |
| Type-only import used as value | Change to regular import |
| Unicode escape in code | Use literal character instead |
| Module not found | Check import path depth (game -> core is `../../core`) |
| SolidJS destructured props | Access as `props.foo` |
| Renderer access | Use `deps.renderer`, don't import pixi at module scope |
| BaseProgress constraint | Add `version: number` to progress data type |
| setupGame contract | Return `{ init, destroy }` only |
| "possibly undefined" | Initialize gameState with `createInitialState()` |
| Dynamic import warning | Use static `import gsap from 'gsap'` |

---

## Game Client Profile (Legacy)

**Stack**: Preact 10.x + Pixi.js 8.x + Zustand 5.x + Vite + TypeScript strict

This is the older, simpler scaffold. Use it only if specifically requested.

### Key Differences from Lightning
| Aspect | Lightning | Game Client |
|--------|-----------|-------------|
| UI framework | SolidJS | Preact |
| State management | Closure-based | Zustand stores |
| Screen routing | ScreenProvider + goto() | Zustand store + conditional render |
| Audio | AudioProvider + Howler + jsfxr | Custom SoundManager |
| Persistence | getStored/setStored | Zustand persist middleware |
| Animation | GSAP (included) | Manual or custom tweens |
| CSS | Tailwind CSS v4 | Plain CSS files |
| Scaffold depth | Deep (core/modules/game) | Flat (src/game/) |

### Layout
```
src/main.tsx            // Preact entry
src/app.tsx             // Game shell
src/game/PixiStage.tsx  // Pixi canvas
src/game/store.ts       // Zustand store
```

### When to Use
- Simple prototypes that don't need the full lightning infrastructure
- Projects that specifically require Preact or Zustand
- When maximum simplicity is preferred over batteries-included

## Execute

```sudolang
fn whenSettingUpScaffold() {
  Constraints {
    Use the lightning scaffold unless explicitly told otherwise
    Never recreate systems the scaffold already provides (screen routing, audio, persistence, renderer)
    Game code lives in src/game/ — never modify src/core/
    State lives in closure variables inside gameController's init(), not in a global store
    Use SolidJS for screen components, not React or Preact
    Use getStored/setStored for persistence, not zustand persist
    If spec artifacts reference zustand/preact/game_client, ignore — use lightning patterns
  }
}
```

### Exit Criteria (Given/Should)

- Given src/core/ files are checked in git diff, should show zero modifications
- Given the game's state management is inspected, should use closure variables in gameController (not zustand)
- Given screen navigation is implemented, should use ScreenProvider + goto() from core
- Given persistence is implemented, should use getStored/setStored (not zustand persist or raw localStorage)
- Given the UI framework in .tsx files is inspected, should be SolidJS (not React, not Preact)
- Given the scaffold's existing systems are listed, should have zero reimplementations in src/game/
- Given config.ts is inspected, should contain the game's identity (name, id, screen map) from the GDD
