# Amino Architecture: Design Authority

> **Role**: This is the design authority for the Amino 3-tier architecture. It defines **why** the tiers exist, what **contracts** they expose, and **how to extend** the system correctly.
>
> **Companion docs** (operational references):
> - [architecture.md](architecture.md) — How the systems work (operational reference)
> - [scaffold-overview-and-migration.md](scaffold-overview-and-migration.md) — How to fork for a new game (migration guide)
> - [context-map.md](context-map.md) — Dependency edges and AI context map

---

## Table of Contents

1. [Design Intent and Rationale](#1-design-intent-and-rationale)
2. [Tier Definitions and Abstract Responsibilities](#2-tier-definitions-and-abstract-responsibilities)
3. [Cross-Tier Contracts](#3-cross-tier-contracts)
4. [Provider Initialization Order](#4-provider-initialization-order-as-architectural-invariant)
5. [Extension Rules](#5-extension-rules)
6. [Anti-Patterns Catalogue](#6-anti-patterns-catalogue)
7. [Validation Examples](#7-validation-examples)

---

## 1. Design Intent and Rationale

### Why three tiers?

The architecture exists to solve a single problem: **how do you build many games without rebuilding infrastructure each time?**

The answer is a layered system where each layer has a different rate of change:

| Layer | Rate of change | Purpose |
|-------|---------------|---------|
| **Core** | Almost never | Runtime infrastructure every game needs |
| **Modules** | Occasionally | Reusable building blocks shared across games |
| **Game** | Constantly | Domain-specific logic, content, and configuration |

This is the **stability vs. flexibility** trade-off. Core is maximally stable — it never knows what game is running. Game is maximally flexible — it's replaced entirely when forking. Modules sit in between, evolving as shared patterns emerge across games.

### Why convention-enforced dependency rules?

The dependency rule (`Core ← Modules ← Game`) is enforced by convention, not by tooling. This is a deliberate trade-off:

- **Benefit**: Zero build tooling overhead, no custom linter plugins, no monorepo boundaries to maintain.
- **Cost**: Requires discipline and code review to catch violations.
- **Mitigation**: The `CLAUDE.md` file permissions system and this document provide the guardrails.

The rule is simple: **dependencies only flow downward**. Core never imports from Modules or Game. Modules never import from Game. Game imports from both.

```
core/    → no deps on modules/ or game/
modules/ → can import from core/ only
game/    → can import from core/ + modules/
app.tsx  → can import from all three (wiring layer)
```

### Why Solid.js context providers for DI?

The provider stack in `app.tsx` is the dependency injection mechanism. Each core system exposes a context provider and a hook. This pattern was chosen because:

1. **Framework-native** — Solid.js contexts are the idiomatic way to share state. No extra DI library needed.
2. **Tree-scoped** — Each provider defines exactly where its hook is available. Components outside the provider tree get clear errors.
3. **Reactive** — Solid.js signals propagate changes with fine-grained reactivity. No re-render storms.
4. **Testable** — Providers can be replaced with test doubles by wrapping components in mock providers.

### The `app.tsx` wiring layer

`app.tsx` is the only file that imports from all three tiers. It assembles the provider tree by passing game-supplied values (manifest, tuning defaults, screen config) into core-supplied providers. This keeps the dependency arrow pointing downward — core providers accept props, they don't import from game.

---

## 2. Tier Definitions and Abstract Responsibilities

### Core (`src/core/`)

| Attribute | Value |
|-----------|-------|
| **Abstract responsibility** | Owns runtime infrastructure that every game requires. Provides systems, hooks, UI primitives, and dev tools. Has zero knowledge of any specific game's content, rules, or assets. |
| **Stability level** | **Stable**. Changes to core affect all games. Modifications require admin-level permissions and careful review. |
| **Qualification criteria** | Code belongs in core if and only if: (1) every game needs it, (2) it has zero game-specific knowledge, and (3) it exposes its functionality through a provider + hook pattern. |

**Core owns**: Asset loading, screen navigation, tuning/config, audio state, pause state, error boundaries, manifest resolution, dev tools (TuningPanel), and DOM-level UI components (Button, Spinner, Logo, ProgressBar, PauseOverlay, MobileViewport, ViewportToggle, SettingsMenu).

### Modules (`src/modules/`)

| Attribute | Value |
|-----------|-------|
| **Abstract responsibility** | Reusable, game-agnostic building blocks. Visual components and pure logic that multiple games would use. Accepts all game-specific values through constructor parameters or factory configuration. |
| **Stability level** | **Semi-stable**. Modules evolve as patterns emerge across games. Adding new modules is routine; changing existing module interfaces requires checking all consumers. |
| **Qualification criteria** | Code belongs in modules if: (1) it's reusable across games, (2) it has zero imports from `game/`, and (3) it accepts all game-specific values via configuration. |

Modules are organized into three categories:

| Category | Purpose | Pattern | Location |
|----------|---------|---------|----------|
| **Primitives** | Single-purpose visual components | Class extending `PIXI.Container`, constructed with config object | `modules/primitives/<name>/` |
| **Logic** | Pure behavior, no rendering | `create*()` factory function returning a typed interface | `modules/logic/<name>/` |
| **Prefabs** | Composed from multiple primitives | Class extending `PIXI.Container`, internally uses primitives | `modules/prefabs/<name>/` |

### Game (`src/game/`)

| Attribute | Value |
|-----------|-------|
| **Abstract responsibility** | All domain-specific logic, content, configuration, and assets for a single game. The entire folder is replaced when forking to a new game. |
| **Stability level** | **Volatile**. Changes constantly during development. Replaced entirely when creating a new game. |
| **Qualification criteria** | Code belongs in game if: (1) it's specific to this game's rules, content, or presentation, or (2) it provides a required contract file that core/app.tsx consumes. |

**Game provides**: Screen components, asset manifest, tuning schema + defaults, audio manager, analytics/feature-flag providers, game state, game modes, and all domain-specific logic.

---

## 3. Cross-Tier Contracts

### 3A: Game → Core (what game must provide)

These are the files and exports that `app.tsx` imports from `game/` to configure core providers. A game is valid if and only if it provides all of these.

| Contract | File | Required Export | Consumed By | Type Constraint |
|----------|------|-----------------|-------------|-----------------|
| Screen registry | `game/config.ts` | `gameConfig.screens` | `ScreenRenderer` | `Record<ScreenId, Component>` |
| Initial screen | `game/config.ts` | `gameConfig.initialScreen` | `ScreenProvider` | `ScreenId` |
| Asset manifest | `game/config.ts` | `manifest` | `ManifestProvider` | `Manifest` (from `~/core/systems/assets`) |
| Default game data | `game/index.ts` | `defaultGameData` | `ManifestProvider` | `unknown` (game-specific shape) |
| Server storage URL | `game/config.ts` | `gameConfig.serverStorageUrl` | `ManifestProvider` | `string \| null` |
| Game tuning defaults | `game/tuning/` | `GAME_DEFAULTS` | `TuningProvider` | Extends `GameTuningBase` (`{ version: string }`) |
| Analytics provider | `game/setup/AnalyticsContext.tsx` | `AnalyticsProvider` | `app.tsx` provider stack | `ParentComponent` |
| Feature flag provider | `game/setup/FeatureFlagContext.tsx` | `FeatureFlagProvider` | `app.tsx` provider stack | `ParentComponent` |
| Viewport mode (optional) | `game/config.ts` | `gameConfig.defaultViewportMode` | `ViewportModeWrapper` | `ViewportMode \| undefined` |

### 3B: Core → Game (what core guarantees)

These are the hooks and behaviors that game code can rely on being available within the provider tree.

**Hook availability guarantees:**

| Hook | Guaranteed Available | Returns | Contract |
|------|---------------------|---------|----------|
| `useTuning<S, G>()` | Below `TuningProvider` | `TuningState<S, G>` | Reactive stores for scaffold and game config. `scaffold` store always has `ScaffoldTuning` shape. `game` store shape is determined by the game's `GAME_DEFAULTS`. Includes `setScaffoldPath`, `setGamePath`, `load`, `save`, `reset`. |
| `useManifest()` | Below `ManifestProvider` | `ManifestContextValue` | Reactive accessors for `manifest()`, `gameData()`, `mode()`. Resolves data from postMessage > CDN > local defaults. |
| `useAssets()` | Below `AssetProvider` | `AssetContextValue` | Asset coordinator with `loadBoot`, `loadCore`, `loadTheme`, `loadAudio`, `loadScene`, `loadBundle`, `initGpu`, `unlockAudio`. Reactive `ready()`, `gpuReady()`, `loading()` signals. |
| `useScreen()` | Below `ScreenProvider` | `ScreenContext` | `current()`, `previous()`, `transition()`, `data()` accessors. `goto(screenId, data?)` and `back()` navigation. |
| `usePause()` | Below `PauseProvider` | `PauseState` | `paused()` accessor, `setPaused(bool)`, `togglePause()`. Falls back to singleton if used outside provider. |
| `useAudio()` | Below `AudioProvider` (or singleton fallback) | `AudioState` | `volume()`, `musicEnabled()`, `ambientEnabled()`, `voEnabled()`. Toggle and set functions. Persists to localStorage. |

**Behavioral guarantees:**

| Guarantee | Description |
|-----------|-------------|
| **Error isolation** | `GlobalBoundary` catches all uncaught errors. Individual screen errors don't crash the entire app. Errors are reported to Sentry. |
| **Pause state** | `usePause()` reflects global pause state. Spacebar toggles pause. Page visibility changes trigger pause. Components can react to `paused()` signal. |
| **Audio persistence** | Audio volume/mute settings persist across sessions via localStorage. Keys: `app_master_volume`, `app_music_enabled`, `app_ambient_enabled`, `app_vo_enabled`. |
| **Tuning persistence** | Scaffold and game tuning values persist via localStorage with fallback chain: URL overrides > runtime changes > localStorage > JSON config > defaults. |
| **Screen transitions** | `goto()` handles fade/slide/none transitions. `back()` returns to previous screen. Screen data is passed via `data()` accessor. |
| **Manifest resolution** | Data sources resolve in priority order: postMessage injection (embed mode) > CDN fetch > local defaults. |

### 3C: Modules → Game (what modules guarantee)

| Module Category | Contract |
|----------------|----------|
| **Visual primitives** | Always a class extending `PIXI.Container`. Constructable with a config object. Has sensible defaults in `defaults.ts`. Config accepts all game-specific values (atlas names, fonts, colors) as parameters — never hardcodes them. |
| **Logic modules** | Always a `create*()` factory function. Returns a typed interface. Accepts game-specific types as generics (e.g., `createProgressService<T extends BaseProgress>`). No side effects at import time. |
| **Prefabs** | Same contract as visual primitives, but may internally compose multiple primitives. Config object includes all needed sub-component configuration. |

**Current module catalog:**

| Module | Category | Factory/Class | Interface |
|--------|----------|---------------|-----------|
| `sprite-button` | Primitive | `new SpriteButton(config)` | `SpriteButtonConfig` — atlas, sprite, label, click handler, 9-slice |
| `progress-bar` | Primitive | `new ProgressBar(config)` | `ProgressBarConfig` — width, height, font, theme color |
| `dialogue-box` | Primitive | `new DialogueBox(config)` | `DialogueBoxConfig` — atlas, sprite, font, positioning |
| `character-sprite` | Primitive | `new CharacterSprite(config)` | `CharacterSpriteConfig<T>` — type map, atlas, base size |
| `avatar-popup` | Prefab | `new AvatarPopup(config)` | `AvatarPopupConfig` — character sprite, dialogue sprite, font |
| `progress` | Logic | `createProgressService<T>(config)` | `ProgressService<T>` — `load()`, `save(data)`, `clear()` |
| `catalog` | Logic | `createCatalogService<T>(config)` | `CatalogService<T>` — `init()`, `current()`, `next()` |
| `loader` | Logic | `createContentLoader<S,T>(config)` | `ContentLoader<T>` — typed fetch + transform pipeline |
| `level-completion` | Logic | `createLevelCompletionController(config)` | `LevelCompletionController` — state machine: playing → completing → complete |

---

## 4. Provider Initialization Order as Architectural Invariant

The provider stack in `app.tsx` is not an arbitrary nesting — it's a **dependency-ordered initialization sequence**. Each provider may depend on providers above it. Changing the order can break the application.

```
Position  Provider               Tier    Rationale
────────  ────────────────────   ─────   ──────────────────────────────────────────
1         GlobalBoundary         Core    Must wrap everything to catch errors from
                                         any provider initialization failure.

2         TuningProvider         Core    All systems below may read tuning values.
                                         Must initialize before anything that
                                         reads config. Accepts gameDefaults prop.

3         AnalyticsProvider      Game    Needs tuning (for environment/config).
                                         Must be above screens so all screen
                                         components can call useAnalytics().

4         FeatureFlagProvider    Game    May depend on analytics context.
                                         Must be above screens for flag checks
                                         during rendering.

5         ViewportModeWrapper    Core    Reads viewport tuning. Must wrap the
                                         game content area but doesn't provide
                                         a hook — just constrains layout.

6         PauseProvider          Core    Independent of asset/screen state.
                                         Placed above ManifestProvider so pause
                                         is available during data loading.

7         ManifestProvider       Core    Resolves game data (CDN/local/inject).
                                         Must complete before AssetProvider can
                                         use the manifest for bundle loading.

8         AssetProvider          Core    Depends on ManifestProvider for manifest.
                                         Must complete before ScreenProvider
                                         renders screens that load assets.

9         ScreenProvider         Core    Depends on all above providers being
                                         available. Screens use every hook.

10        ScreenRenderer         Core    Renders the current screen component.
                                         Leaf of the provider tree.
```

### Rule for adding new providers

1. Identify which existing providers the new provider depends on (must be above it).
2. Identify which existing providers depend on the new provider (must be below it).
3. Insert at the narrowest valid position.
4. If the provider is game-specific, it lives in `game/setup/` and is imported in `app.tsx`.
5. If the provider is core infrastructure, it lives in `core/systems/` and requires admin permissions.
6. Update this document's provider order table.

---

## 5. Extension Rules

### 5A: Adding a Core system

**Qualification criteria** — a new core system must satisfy ALL of:
1. Every game will need this functionality.
2. It has zero knowledge of any game's content, rules, or assets.
3. It exposes a provider + hook pattern.
4. It manages its own state via Solid.js signals.

**File structure:**

```
core/systems/<system-name>/
├── types.ts       # TypeScript interfaces (no runtime code)
├── state.ts       # createSignal() / createStore() state
├── context.tsx     # Provider component + useXxx() hook
└── index.ts        # Public exports
```

**Checklist:**
- [ ] Create the four files following the pattern above
- [ ] Export from `core/index.ts`
- [ ] Add provider to `app.tsx` at the correct position (see Section 4)
- [ ] Update provider order table in this document

**Anti-patterns for core systems:**
- Importing from `modules/` or `game/`
- Storing game-specific state (e.g., "current level" in core)
- Hardcoding game-specific constants (screen names, atlas names)
- Creating a system that only one game would ever need

### 5B: Adding a Module

**Decision tree:**

```
Is it a visual component (renders to Pixi canvas)?
├── YES → Is it composed of other modules?
│   ├── YES → prefab     (modules/prefabs/<name>/)
│   └── NO  → primitive  (modules/primitives/<name>/)
└── NO → Is it pure logic with no rendering?
    ├── YES → logic      (modules/logic/<name>/)
    └── NO  → Reconsider. It may belong in game/ or core/.
```

**File structure (visual module):**

```
modules/<category>/<name>/
├── renderers/
│   └── pixi.ts      # PIXI.Container subclass
├── defaults.ts       # Default config values
├── tuning.ts         # Tweakpane bindings (green section in dev panel)
└── index.ts          # Public exports
```

**File structure (logic module):**

```
modules/logic/<name>/
├── index.ts          # create*() factory function + types
├── defaults.ts       # Default config values (if configurable)
└── tuning.ts         # Tweakpane bindings (if tunable at runtime)
```

**Inter-category dependency rules:**
- Primitives must NOT import from other primitives (they're independent building blocks).
- Prefabs CAN import from primitives (that's their purpose — composition).
- Logic modules must NOT import from primitives or prefabs (they're headless).
- All modules CAN import from core.

**Anti-patterns for modules:**
- Hardcoding atlas names, font families, or sprite frame names
- Importing from `game/`
- Using global state instead of accepting config through parameters
- Creating a module that only one game would ever use

### 5C: Adding a game mode

A game mode is a self-contained gameplay implementation within the `game/` tier.

**Folder structure:**

```
game/<mode-name>/
├── core/              # Main game classes (PIXI.Container subclasses)
├── controllers/       # Game controllers (input, state machines)
├── systems/           # Game-specific systems (physics, scoring)
├── ui/                # Game-specific UI (Pixi-based HUD elements)
├── types/             # Type definitions
├── data/              # Static game data
├── services/          # Business logic services
└── animations/        # GSAP animation sequences
```

**Controller pattern:**

The game mode's entry point is typically a controller function called from `GameScreen.tsx`:

```typescript
// game/<mode>/screens/gameController.ts
export function createGameController(deps: {
  coordinator: ScaffoldCoordinatorFromGc;
  tuning: Store<GameTuning>;
  screenSize: { width: number; height: number };
}): GameController {
  // Create Pixi containers, wire input, return control interface
}
```

**Screen registration:**

Screens are registered in `game/config.ts`:

```typescript
export const gameConfig: GameConfig = {
  screens: {
    loading: LoadingScreen,
    start: lazy(() => import('./screens/StartScreen')),
    game: lazy(() => import('./screens/GameScreen')),
    results: ResultsScreen,
  },
  initialScreen: 'loading',
};
```

### 5D: Component taxonomy

Three different concepts are all called "components" in this codebase. This table disambiguates them:

| Term | Definition | Location | Base Type | Example |
|------|-----------|----------|-----------|---------|
| **Solid.js component** | Function returning JSX. Renders to the DOM. Used for screens, overlays, and HTML-based UI. | `game/screens/`, `core/ui/` | `Component<Props>` | `LoadingScreen`, `Button`, `SettingsMenu` |
| **Pixi container** | Class extending `Container`. Renders to the GPU via Pixi.js. Used for game objects and in-game visual elements. | `modules/*/renderers/`, `game/<mode>/` | `PIXI.Container` | `SpriteButton`, `ProgressBar`, `CityLinesGame` |
| **Logic factory** | Pure function returning a typed interface. No rendering. Used for stateful services and controllers. | `modules/logic/`, `game/<mode>/` | Plain TS interface | `createProgressService()`, `createCatalogService()` |

**When to use which:**

| Need | Use | Why |
|------|-----|-----|
| Full-screen UI with HTML/CSS | Solid.js component | DOM layout, Tailwind styling, accessibility |
| In-game visual element | Pixi container | GPU rendering, sprite-based, part of scene graph |
| Reusable behavior without visuals | Logic factory | Pure logic, testable, no rendering dependency |
| Game HUD overlaying Pixi canvas | Solid.js component with absolute positioning | DOM on top of canvas, reactive to game state |

### Known architectural boundary violation: `ScreenId`

`ScreenId` is defined in `src/core/systems/screens/types.ts` as:

```typescript
export type ScreenId = 'loading' | 'start' | 'game' | 'results';
```

This is a Core type that hardcodes game-specific screen names — a violation of Core's "zero game knowledge" principle. The current convention is:

- All games must provide exactly these four screens.
- If a game needs additional screens, the `ScreenId` type must be extended (requiring a core change).
- This is acknowledged as technical debt. A future resolution would make `ScreenId` generic or use a string registry.

---

## 6. Anti-Patterns Catalogue

Quick-reference for code review. Each anti-pattern includes the tier, the violation, and what to do instead.

### Core anti-patterns

| Anti-Pattern | Example | Correct Approach |
|-------------|---------|-----------------|
| Importing from modules or game | `import { SpriteButton } from '~/modules/...'` in core | Core must never import from modules or game. If core needs the functionality, it must be core-level. |
| Storing game-specific state | `const [currentLevel, setLevel] = createSignal(1)` in core | Game state belongs in `game/state.ts`. Core provides generic state infrastructure. |
| Hardcoding game constants | `if (screen === 'citylines-game')` in core | Use the generic `ScreenId` type. No game-specific strings in core. |
| Game-specific defaults | `defaultFont: 'Baloo'` in a core system | Core defaults must be generic (`'sans-serif'`). Games override via tuning or props. |

### Module anti-patterns

| Anti-Pattern | Example | Correct Approach |
|-------------|---------|-----------------|
| Importing from game | `import { GAME_FONT } from '~/game/config'` | Accept font as a config parameter: `config.fontFamily`. |
| Hardcoding atlas/font names | `const atlas = 'atlas-citylines'` | Accept via config: `config.atlasName`. |
| Global side effects on import | `const state = createRoot(...)` at module level | Use factory pattern: `createXxx(config)` returns instance. |
| Primitive importing another primitive | `import { SpriteButton } from '../sprite-button'` in progress-bar | Primitives are independent. If composition is needed, create a prefab. |

### Game anti-patterns

| Anti-Pattern | Example | Correct Approach |
|-------------|---------|-----------------|
| Duplicating module logic | Re-implementing progress persistence instead of using `createProgressService()` | Use the module factory. If it doesn't fit, extend it or propose a module change. |
| Skipping `BaseAudioManager` | Creating a standalone audio class from scratch | Extend `BaseAudioManager`. It handles music state, volume reactivity, and the settings menu integration. |
| Importing core internals | `import { someInternalHelper } from '~/core/systems/assets/loaders/gpu/pixi'` | Import from the public API: `import { useAssets } from '~/core'`. Internal file paths are not stable. |
| Modifying core files | Editing `src/core/systems/screens/types.ts` to add a new screen | Follow the existing convention (four screens) or propose a core change through proper channels. |

---

## 7. Validation Examples

These worked examples trace through the documented contracts to verify they hold against the actual implementation.

### Example 1: Tuning System

**Claim**: The tuning system correctly implements the Core → Game and Game → Core contracts.

**Game → Core contract trace:**

1. Game defines tuning schema in `game/tuning/types.ts`:
   ```typescript
   export interface DailyDispatchTuning extends GameTuningBase {
     version: string;
     // ... game-specific fields
   }
   export const GAME_DEFAULTS: DailyDispatchTuning = { version: '1.0.0', ... };
   ```
   ✓ Extends `GameTuningBase` as required by the contract.

2. `app.tsx` passes defaults to core:
   ```typescript
   <TuningProvider gameDefaults={GAME_DEFAULTS} urlOverrides={urlOverrides}>
   ```
   ✓ Core receives game tuning via props (dependency arrow points downward).

3. `TuningProvider` creates reactive stores from defaults:
   - `scaffold: Store<ScaffoldTuning>` — initialized from `SCAFFOLD_DEFAULTS`
   - `game: Store<G>` — initialized from the `gameDefaults` prop
   ✓ Both stores are typed correctly.

**Core → Game contract trace:**

1. Game screen accesses tuning via hook:
   ```typescript
   const tuning = useTuning<ScaffoldTuning, DailyDispatchTuning>();
   ```

2. Hook guarantees (verified against `TuningState<S, G>` interface):
   - `tuning.scaffold` — `Store<ScaffoldTuning>` with engine, debug, animation, audio, performance, screens, tuningPanel, viewport config. ✓
   - `tuning.game` — `Store<DailyDispatchTuning>` with game-specific fields. ✓
   - `tuning.isLoaded()` — reactive boolean. ✓
   - `tuning.setGamePath(path, value)` — mutator for game tuning. ✓
   - `tuning.setScaffoldPath(path, value)` — mutator for scaffold tuning. ✓
   - `tuning.load()`, `tuning.save()`, `tuning.reset()` — lifecycle actions. ✓

3. Persistence chain: URL overrides > runtime changes > localStorage > JSON > defaults. ✓ (Documented in Section 3B and implemented in tuning loader.)

**Verdict**: Tuning system contracts hold. A new game can define its own tuning schema by extending `GameTuningBase`, pass defaults to `TuningProvider`, and access typed config via `useTuning()`.

### Example 2: Audio System

**Claim**: The audio system correctly implements bidirectional contracts (Core provides `BaseAudioManager` + `useAudio()`; Game extends with `GameAudioManager`).

**Core → Game direction:**

1. Core provides `BaseAudioManager` (`core/systems/audio/base-manager.ts`):
   - Protected `playSound(sound: SoundDefinition)` — plays a sound via the audio loader.
   - Protected `playRandomSound(sounds: SoundDefinition[])` — picks a random sound variant.
   - Public `startMusic(track, fadeIn?)` — starts music, respects `audioState.musicEnabled()`.
   - Public `stopMusic(fadeOut?)` — stops music with fade.
   ✓ Base class provides the framework; game extends with specific sounds.

2. Core provides `useAudio()` (`core/systems/audio/context.tsx`):
   - Returns `AudioState` with `volume()`, `musicEnabled()`, `toggleMusic()`, etc.
   - Settings persist to localStorage under `app_master_volume`, `app_music_enabled`, etc.
   - `SettingsMenu` (core UI) reads/writes these values.
   ✓ Audio settings are managed by core, visible to game.

3. Core provides `SoundDefinition` type (`core/systems/audio/types.ts`):
   ```typescript
   interface SoundDefinition {
     channel: string;
     sprite: string;
     volume?: number;
   }
   ```
   ✓ Game uses this type to define its sound catalog.

**Game → Core direction:**

1. Game defines sounds in `game/audio/sounds.ts`:
   ```typescript
   const SOUND_BUTTON_CLICK: SoundDefinition = {
     channel: 'sfx-daily-dispatch',
     sprite: 'button_click',
     volume: 0.7,
   };
   ```
   ✓ Uses `SoundDefinition` type from core.

2. Game extends base manager in `game/audio/manager.ts`:
   ```typescript
   class GameAudioManager extends BaseAudioManager {
     playButtonClick() { this.playSound(SOUND_BUTTON_CLICK); }
     startGameMusic() { this.startMusic(MUSIC_TRACKS[0]); }
   }
   ```
   ✓ Extends `BaseAudioManager`, uses protected methods.

3. Game wires manager in `GameScreen.tsx`:
   ```typescript
   const manager = new GameAudioManager(coordinator.audio);
   ```
   ✓ AudioLoader from coordinator is passed to the manager.

**Integration verification:**

- `BaseAudioManager.startMusic()` checks `audioState.musicEnabled()` before playing. ✓
- `SettingsMenu` toggles `audioState.musicEnabled()` which affects `BaseAudioManager`. ✓
- Audio bundles are loaded via `AssetProvider.loadAudio()` which registers Howler sprites. ✓
- `useAssets().unlockAudio()` is called on first user interaction to comply with browser autoplay policies. ✓

**Verdict**: Audio system contracts hold. A new game can define its own `SoundDefinition` constants, extend `BaseAudioManager` with game-specific methods, and the core settings menu will correctly control playback.
