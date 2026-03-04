# Architecture Deep Dive

A comprehensive guide to the 3-tier architecture: **core** (reusable platform), **modules** (shared building blocks), and **game** (specific implementation).

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Diagram](#architecture-diagram)
4. [Directory Structure](#directory-structure)
5. [Core (Reusable Platform)](#core-reusable-platform)
6. [Modules (Shared Building Blocks)](#modules-shared-building-blocks)
7. [Game (CityLines Implementation)](#game-citylines-implementation)
8. [Integration Across Tiers](#integration-across-tiers)
9. [Systems Architecture](#systems-architecture)
10. [Key Files Reference](#key-files-reference)

---

## Overview

The project follows a **3-tier architecture** with strict dependency rules:

```
src/
├── core/        # Reusable platform - can power ANY game
├── modules/     # Shared building blocks - visual primitives, prefabs, logic
└── game/        # CityLines-specific implementation
```

### Design Philosophy

| Core | Modules | Game |
|------|---------|------|
| Generic platform | Reusable components | Game-specific |
| Provides systems and hooks | Visual and logic building blocks | Consumes systems, modules, hooks |
| Agnostic to game logic | Agnostic to game logic | Implements game logic |
| Defines interfaces | Extends interfaces with defaults | Implements interfaces |
| Zero deps on modules or game | Can import core only | Can import core + modules |

### Dependency Rules

```
core/    --> no deps on modules or game
modules/ --> can import core only
game/    --> can import core + modules
```

These rules are enforced by convention. Code in `core/` must never reference `modules/` or `game/`. Code in `modules/` must never reference `game/`.

---

## Complete Architecture Diagram

                      Solid.js  Pixi.js v8  GSAP  Howler  Tweakpane  Sentry
                         │         │          │      │        │         │
                         └─────────┴──────────┴──────┴────────┴─────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │     app.tsx      │
                                    └────────┬────────┘
                                             │
        ┌────────────────────────────────────┼────────────────────────────────────┐
        ▼                                    ▼                                    ▼
┌─────────────────────────┐  ┌─────────────────────────────┐  ┌────────────────────────────┐
│  CORE  (src/core/)      │  │  MODULES  (src/modules/)    │  │  GAME  (src/game/)         │
│  Framework shell         │  │  Reusable building blocks   │  │  Game-specific code        │
│  DO NOT EDIT             │  │                             │  │                            │
│                         │  │  Primitives:                │  │  Config:                   │
│  Providers:             │  │    sprite-button            │  │    identity, manifest,     │
│    GlobalBoundary       │  │    dialogue-box             │  │    config, state, tuning   │
│    TuningProvider       │  │    character-sprite         │  │                            │
│    PauseProvider        │  │    progress-bar             │  │  Setup:                    │
│    ManifestProvider     │  │                             │  │    AnalyticsProvider       │
│    AssetProvider        │  │  Logic:                     │  │    FeatureFlagProvider     │
│    ScreenProvider       │  │    level-completion         │  │                            │
│    AudioProvider        │  │    progress (factory)       │  │  Screens:                  │
│                         │  │    catalog (factory)        │  │    Loading → Start →       │
│  Systems:               │  │    loader (factory)         │  │    Game → Results          │
│    Assets (loaders)     │  │                             │  │                            │
│    Screens (manager)    │  │  Prefabs:                   │  │  Audio:                    │
│    Tuning (state)       │  │    avatar-popup             │  │    GameAudioManager        │
│    Audio (base manager) │  │                             │  │                            │
│    Errors (boundaries)  │  │  Each module has:           │  │  Game Logic:               │
│    Pause (state)        │  │    index.ts (public API)    │  │    citylines/              │
│    VFX (particles)      │  │    defaults.ts              │  │    dailydispatch/          │
│                         │  │    tuning.ts                │  │                            │
│  UI:                    │  │    renderers/pixi.ts        │  │  Services:                 │
│    Button, Spinner,     │  │                             │  │    progress, catalog,      │
│    MobileViewport,      │  │                             │  │    loader (configured      │
│    ViewportToggle,      │  │                             │  │    from module factories)  │
│    PauseOverlay, Logo   │  │                             │  │                            │
│                         │  │                             │  │                            │
│  Dev:                   │  │                             │  │                            │
│    TuningPanel          │  │                             │  │                            │
│    (Tweakpane)          │  │                             │  │                            │
└─────────────────────────┘  └─────────────────────────────┘  └────────────────────────────┘
         ▲                              ▲         │                    │         │
         │                              │         │                    │         │
         │           can import ────────┘         │                    │         │
         │                                         │   can import ─────┘         │
         │              can import ────────────────┘                             │
         │                                              can import ──────────────┘
         │
         └── ZERO dependencies on modules/ or game/
```

---

## Provider Hierarchy

The application uses Solid.js context providers for dependency injection. The provider stack in `app.tsx` wraps from outside in:

```mermaid
graph TB
    subgraph PROVIDERS["Solid.js Provider Stack"]
        direction TB

        GB["GlobalBoundary -- core"]
        TP["TuningProvider -- core -- useTuning()"]
        ANP["AnalyticsProvider -- game/setup"]
        FFP["FeatureFlagProvider -- game/setup"]
        VW["ViewportModeWrapper -- core"]
        PP["PauseProvider -- core -- usePause()"]
        MP["ManifestProvider -- core -- useManifest()"]
        AP["AssetProvider -- core -- useAssets()"]
        SP["ScreenProvider -- core -- useScreen()"]
        SR["ScreenRenderer"]
        GS["Game Screen -- all hooks available"]

        GB --> TP
        TP --> ANP
        ANP --> FFP
        FFP --> VW
        VW --> PP
        PP --> MP
        MP --> AP
        AP --> SP
        SP --> SR
        SR --> GS
    end

    style GB fill:#134e4a,color:#fff,stroke:#0f766e
    style TP fill:#0d9488,color:#fff,stroke:#0f766e
    style ANP fill:#ea580c,color:#fff,stroke:#c2410c
    style FFP fill:#ea580c,color:#fff,stroke:#c2410c
    style VW fill:#0d9488,color:#fff,stroke:#0f766e
    style PP fill:#0d9488,color:#fff,stroke:#0f766e
    style MP fill:#0d9488,color:#fff,stroke:#0f766e
    style AP fill:#0d9488,color:#fff,stroke:#0f766e
    style SP fill:#0d9488,color:#fff,stroke:#0f766e
    style SR fill:#0d9488,color:#fff,stroke:#0f766e
    style GS fill:#ea580c,color:#fff,stroke:#c2410c
```

Note that `AnalyticsProvider` and `FeatureFlagProvider` live in `game/setup/` (orange), not in core. They are game-specific providers injected into the core provider stack. `ManifestProvider` now accepts props (`manifest`, `defaultGameData`, `serverStorageUrl`) instead of importing directly from game code, keeping the dependency arrow pointing downward.

### Hook Availability

| Hook | Description | Tier | Available In |
|------|-------------|------|--------------|
| `useTuning<S,G>()` | Typed config access | Core | All components below TuningProvider |
| `useManifest()` | Game data and manifest | Core | Below ManifestProvider |
| `useAssets()` | Asset coordinator | Core | Below AssetProvider |
| `useScreen()` | Navigation | Core | Below ScreenProvider |
| `usePause()` | Pause state | Core | Below PauseProvider |
| `useAudio()` | Volume controls | Core | Below AudioProvider |
| `useAnalytics()` | Event tracking | Game | Below AnalyticsProvider |
| `useFeatureFlags()` | Feature flags | Game | Below FeatureFlagProvider |

---

## Directory Structure

### Core Structure
```
src/core/
├── config.ts                # Engine selection (pixi/phaser/three)
├── index.ts                 # Public API exports
├── analytics/               # Shared analytics schemas and events
├── config/                  # Environment, viewport constraints
├── dev/                     # Development tools (Tweakpane, TuningPanel)
│   ├── TuningPanel.tsx      # Color-coded panel (cyan/green/orange sections)
│   ├── tuningRegistry.ts    # Registry for module/game tuning bindings
│   └── bindings.ts          # Core tuning bindings
├── lib/                     # External integrations (Sentry, PostHog)
├── systems/                 # Core engine systems
│   ├── assets/              # Asset loading and management
│   ├── audio/               # Audio state and playback
│   ├── errors/              # Error handling and boundaries
│   ├── manifest/            # ManifestProvider (props-based)
│   ├── pause/               # Pause state management
│   ├── screens/             # Screen navigation system
│   ├── tuning/              # Configuration management
│   └── vfx/                 # Particle and visual effects
├── ui/                      # Reusable UI components
│   ├── Button.tsx
│   ├── Logo.tsx
│   ├── MobileViewport.tsx
│   ├── PauseOverlay.tsx
│   ├── ProgressBar.tsx
│   ├── Spinner.tsx
│   └── ViewportToggle.tsx   # (moved from game/shared)
└── utils/                   # Utilities (storage, SettingsMenu)
```

### Modules Structure
```
src/modules/
├── primitives/                     # Low-level visual components
│   ├── sprite-button/
│   │   ├── renderers/pixi.ts       # Pixi.js renderer
│   │   ├── renderers/phaser.ts     # Phaser renderer
│   │   ├── renderers/three.ts      # Three.js renderer
│   │   ├── defaults.ts             # Default config values
│   │   ├── tuning.ts               # Tuning bindings
│   │   └── index.ts                # Public exports
│   ├── progress-bar/
│   │   ├── renderers/pixi.ts
│   │   ├── defaults.ts
│   │   ├── tuning.ts
│   │   └── index.ts
│   ├── dialogue-box/
│   │   ├── renderers/pixi.ts
│   │   ├── defaults.ts
│   │   ├── tuning.ts
│   │   └── index.ts
│   └── character-sprite/
│       ├── renderers/pixi.ts
│       ├── defaults.ts
│       ├── tuning.ts
│       └── index.ts
├── prefabs/                        # Higher-level composed components
│   └── avatar-popup/
│       ├── renderers/pixi.ts
│       ├── defaults.ts
│       ├── tuning.ts
│       └── index.ts
└── logic/                          # Headless logic modules (factory pattern)
    ├── progress/index.ts           # createProgressService()
    ├── catalog/index.ts            # createCatalogService()
    ├── loader/index.ts             # createContentLoader()
    └── level-completion/
        ├── LevelCompletionController.ts
        ├── defaults.ts
        ├── tuning.ts
        └── index.ts
```

### Game Structure
```
src/game/
├── config/                  # Game identity, fonts, environment
├── state.ts                 # Game state (score, health, level)
├── setup/                   # Game-specific providers
│   ├── AnalyticsContext.tsx  # AnalyticsProvider (game-specific)
│   └── FeatureFlagContext.tsx # FeatureFlagProvider (game-specific)
├── tuning/                  # Game-specific tuning config
├── audio/                   # GameAudioManager
├── screens/                 # Game screens (use core hooks)
├── services/                # Game services (progress, etc.)
├── analytics/               # Game-specific analytics events
└── citylines/               # Core game logic
    ├── core/                # Game engine classes
    ├── types/               # Type definitions
    ├── systems/             # Game-specific systems
    ├── services/            # Business logic services
    ├── controllers/         # Game controllers
    ├── ui/                  # Game UI (Companion, etc.)
    ├── data/                # Static game data
    └── animations/          # Game animations
```

---

## Core (Reusable Platform)

### What Core Provides

Core is the **complete game development platform** that handles all infrastructure so games can focus on gameplay. It has zero dependencies on `modules/` or `game/`.

### Asset System

```mermaid
graph TB
    subgraph ASSET_SYS["Asset System"]
        direction TB

        REQ["loadBundle('tiles')"]

        subgraph COORD["AssetCoordinator"]
            ROUTE{"Route by target type"}
        end

        subgraph LOADERS["Specialized Loaders"]
            DOM["DOM Loader -- Images, Fonts"]
            GPU["GPU Loader -- Pixi.js Textures"]
            AUD["Audio Loader -- Howler Sprites"]
        end

        subgraph OUTPUT["Loaded Assets"]
            TEX["Textures"]
            SPR["Spritesheets"]
            SND["Sound Sprites"]
            IMG["DOM Images"]
        end

        REQ --> ROUTE
        ROUTE -->|"target: 'dom'"| DOM
        ROUTE -->|"target: 'gpu'"| GPU
        ROUTE -->|"target: 'audio'"| AUD

        DOM --> IMG
        GPU --> TEX
        GPU --> SPR
        AUD --> SND
    end

    style REQ fill:#2563eb,color:#fff,stroke:#1d4ed8
    style ROUTE fill:#0d9488,color:#fff,stroke:#0f766e
    style DOM fill:#22c55e,color:#fff,stroke:#16a34a
    style GPU fill:#e91e63,color:#fff,stroke:#c2185b
    style AUD fill:#f59e0b,color:#000,stroke:#d97706
    style TEX fill:#fce7f3,color:#000,stroke:#fbcfe8
    style SPR fill:#fce7f3,color:#000,stroke:#fbcfe8
    style SND fill:#fef3c7,color:#000,stroke:#fde68a
    style IMG fill:#dcfce7,color:#000,stroke:#bbf7d0
```

**Key Files**:
- `core/systems/assets/coordinator.ts` - Routes assets by type (dom/gpu/audio)
- `core/systems/assets/loaders/dom.ts` - Handles DOM-based assets
- `core/systems/assets/loaders/gpu/pixi.ts` - Handles Pixi.js rendering
- `core/systems/assets/loaders/audio.ts` - Handles Howler.js audio sprites

**Hook**: `useAssets()` - Access loaded assets from any component

### Screen System

```mermaid
stateDiagram-v2
    [*] --> loading: Initial

    loading --> start: Assets loaded
    loading --> game: Skip intro

    start --> game: Play

    game --> results: Level complete
    game --> start: Quit

    results --> game: Next level
    results --> start: Menu

    note right of loading
        LoadingScreen
        Shows progress bar
    end note

    note right of game
        GameScreen
        CityLinesGame instance
        Pixi.js rendering
    end note
```

**Features**:
- State machine for screen flow
- Configurable transitions (fade, slide, none)
- History tracking for back navigation
- Data passing between screens

**Usage**:
```typescript
const screen = useScreen();
screen.goto('game', { level: 1 });  // Navigate with data
screen.back();                       // Return to previous
```

### Manifest System

The `ManifestProvider` accepts props rather than importing from game code, keeping the dependency arrow clean:

```typescript
<ManifestProvider
  manifest={manifest}
  defaultGameData={defaultGameData}
  serverStorageUrl={gameConfig.serverStorageUrl}
>
```

**Data source resolution** (priority order):
1. **PostMessage injection** (highest) - For embed mode, parent context pushes data
2. **CDN fetch** - Server storage URL fetches remote game data
3. **Local defaults** (lowest) - Props passed from game config

**Hook**: `useManifest()` - Access manifest and game data from any component

### Tuning System

```mermaid
graph TB
    subgraph TUNING_SYS["Tuning System - Load Priority"]
        direction TB

        URL["URL Overrides -- ?theme=winter -- Priority 4 (Highest)"]
        RUNTIME["Runtime Changes -- setGamePath() -- Priority 3"]
        LOCAL["localStorage -- User preferences -- Priority 2"]
        JSON["JSON Config -- /config/tuning/*.json -- Priority 1"]
        DEFAULTS["Defaults -- SCAFFOLD_DEFAULTS + GAME_DEFAULTS -- Priority 0 (Lowest)"]

        FINAL["Final Config"]

        DEFAULTS --> JSON
        JSON --> LOCAL
        LOCAL --> RUNTIME
        RUNTIME --> URL
        URL --> FINAL
    end

    style URL fill:#ef4444,color:#fff,stroke:#dc2626
    style RUNTIME fill:#f97316,color:#fff,stroke:#ea580c
    style LOCAL fill:#eab308,color:#000,stroke:#ca8a04
    style JSON fill:#22c55e,color:#fff,stroke:#16a34a
    style DEFAULTS fill:#6b7280,color:#fff,stroke:#4b5563
    style FINAL fill:#8b5cf6,color:#fff,stroke:#7c3aed
```

**Hook**: `useTuning<ScaffoldTuning, GameTuning>()` - Typed access to both configs

#### Tuning Panel Color Sections

The dev tuning panel uses color-coded sections to show which tier owns each value:

| Color | Section | Tier |
|-------|---------|------|
| **Cyan** | Core settings | `core/` |
| **Green** | Module settings | `modules/` |
| **Orange** | Game settings | `game/` |

### Error System

```mermaid
graph TB
    subgraph ERROR_SYS["Error Boundary Hierarchy"]
        direction TB

        ERR["Error Occurs"]

        ASSET["AssetBoundary -- Recovery: Retry or skip"]
        SCREEN["ScreenBoundary -- Recovery: Retry or menu"]
        GLOBAL["GlobalBoundary -- Recovery: Reload app"]

        subgraph REPORT["Reporting"]
            SENTRY_R["Sentry"]
            POSTHOG_R["PostHog"]
        end

        ERR --> ASSET
        ASSET -->|Unhandled| SCREEN
        SCREEN -->|Unhandled| GLOBAL

        ASSET --> SENTRY_R
        SCREEN --> SENTRY_R
        GLOBAL --> SENTRY_R
    end

    style ERR fill:#ef4444,color:#fff,stroke:#dc2626
    style ASSET fill:#22c55e,color:#fff,stroke:#16a34a
    style SCREEN fill:#eab308,color:#000,stroke:#ca8a04
    style GLOBAL fill:#ef4444,color:#fff,stroke:#dc2626
    style SENTRY_R fill:#362d59,color:#fff,stroke:#2a2245
    style POSTHOG_R fill:#f54e00,color:#fff,stroke:#c33e00
```

### Other Core Systems

| System | Purpose | Hook |
|--------|---------|------|
| **Pause** | Spacebar toggle, pause state | `usePause()` |
| **Audio** | Master/Music/SFX volumes, base manager | `useAudio()` |
| **VFX** | Particle runtime and visual effects | - |
| **Dev Tools** | TuningPanel (color-coded), TuningRegistry | Toggle with `` ` `` |

---

## Modules (Shared Building Blocks)

### What Modules Provide

Modules are **reusable building blocks** that sit between core and game. They can import from `core/` but never from `game/`. Modules fall into three categories:

### Visual Modules: Primitives

Low-level visual components with a consistent internal structure:

```
module-name/
├── renderers/pixi.ts    # Pixi.js renderer (primary)
├── renderers/phaser.ts  # Phaser renderer (optional)
├── renderers/three.ts   # Three.js renderer (optional)
├── defaults.ts          # Default configuration values
├── tuning.ts            # Tuning panel bindings (green section)
└── index.ts             # Public exports
```

| Primitive | Description | Renderers |
|-----------|-------------|-----------|
| `sprite-button` | Interactive sprite-based button | Pixi, Phaser, Three |
| `progress-bar` | Animated progress indicator | Pixi |
| `dialogue-box` | Text display with typewriter effect | Pixi |
| `character-sprite` | Animated character with states | Pixi |

### Visual Modules: Prefabs

Higher-level composed components built from primitives:

| Prefab | Description | Renderers |
|--------|-------------|-----------|
| `avatar-popup` | Character avatar with popup animation | Pixi |

### Logic Modules

Headless modules that provide behavior without rendering. Logic modules use the **factory pattern** -- they export a `create*()` function that games call with their own configuration:

| Module | Factory | Purpose |
|--------|---------|---------|
| `progress` | `createProgressService<T>()` | Versioned localStorage persistence |
| `catalog` | `createCatalogService<T>()` | Ordered content navigation |
| `loader` | `createContentLoader<S,T>()` | Typed fetch + transform pipeline |
| `level-completion` | `createLevelCompletionController()` | Level completion orchestration |

**Example - Progress factory**:
```typescript
import { createProgressService } from '~/modules/logic/progress';

const progress = createProgressService<MyProgress>({
  key: 'mygame_progress',
  version: 1,
  defaults: { version: 1, score: 0, level: 1 },
});

progress.load();
progress.save({ ...data });
progress.clear();
```

**Example - Catalog factory**:
```typescript
import { createCatalogService } from '~/modules/logic/catalog';

const catalog = createCatalogService<ChapterEntry>({
  fetchIndex: () => fetch('/api/chapters').then(r => r.json()),
  fallbackEntries: [{ id: 'fallback', url: 'default.json' }],
});

await catalog.init();
catalog.current();
catalog.next();
```

---

## Game (CityLines Implementation)

### What the Game Provides

The game implements **all game-specific logic** using core systems and module building blocks.

### Game Configuration Files

```mermaid
graph TB
    subgraph GAME_CONFIG["Game Configuration"]
        direction TB

        subgraph FILES["Config Files"]
            CONFIG["config/index.ts -- Screen mapping, identity"]
            MANIFEST["manifest -- Asset bundle definitions"]
            STATE["state.ts -- Score, health, level"]
            TUNING_G["tuning/types.ts -- Game-specific config"]
        end

        subgraph SETUP["Setup Providers"]
            ANALYTICS["AnalyticsProvider -- game/setup"]
            FLAGS["FeatureFlagProvider -- game/setup"]
        end

        subgraph CONSUMED["Consumed By Core"]
            SCREENS_S["ScreenProvider"]
            ASSETS_S["ManifestProvider"]
            TUNING_S["TuningProvider"]
        end

        CONFIG --> SCREENS_S
        MANIFEST --> ASSETS_S
        TUNING_G --> TUNING_S
    end

    style CONFIG fill:#ea580c,color:#fff,stroke:#c2410c
    style MANIFEST fill:#ea580c,color:#fff,stroke:#c2410c
    style STATE fill:#ea580c,color:#fff,stroke:#c2410c
    style TUNING_G fill:#ea580c,color:#fff,stroke:#c2410c
    style ANALYTICS fill:#ea580c,color:#fff,stroke:#c2410c
    style FLAGS fill:#ea580c,color:#fff,stroke:#c2410c
    style SCREENS_S fill:#0d9488,color:#fff,stroke:#0f766e
    style ASSETS_S fill:#0d9488,color:#fff,stroke:#0f766e
    style TUNING_S fill:#0d9488,color:#fff,stroke:#0f766e
```

### Game Setup Providers

`AnalyticsProvider` and `FeatureFlagProvider` live in `game/setup/`, not in core. They are game-specific providers that plug into the core provider stack via `app.tsx`:

```typescript
// app.tsx provider stack (simplified)
<GlobalBoundary>
  <TuningProvider>
    <AnalyticsProvider>        {/* game/setup/ */}
      <FeatureFlagProvider>    {/* game/setup/ */}
        <ViewportModeWrapper>
          <PauseProvider>
            <ManifestProvider manifest={manifest} defaultGameData={defaultGameData} serverStorageUrl={...}>
              <AssetProvider>
                <ScreenProvider>
                  <ScreenRenderer />
                </ScreenProvider>
              </AssetProvider>
            </ManifestProvider>
          </PauseProvider>
        </ViewportModeWrapper>
      </FeatureFlagProvider>
    </AnalyticsProvider>
  </TuningProvider>
</GlobalBoundary>
```

### Core Game Classes

```mermaid
classDiagram
    class CityLinesGame {
        +Pixi.Container
        -grid: Grid
        -landmarks: Landmark[]
        -exits: Exit[]
        -tiles: RoadTile[]
        +loadLevel(config)
        +rotateTile(tile)
        +checkConnections()
        +on(event, handler)
    }

    class RoadTile {
        -texture: Texture
        -connections: Direction[]
        +rotate()
        +getConnections()
    }

    class Landmark {
        -position: Point
        -isConnected: boolean
        +checkConnection()
        +pulse()
    }

    class Exit {
        -position: Point
        -direction: Direction
    }

    class ConnectionDetector {
        +detectPath(from, to)
        +validateAll()
    }

    class LevelGenerator {
        +generate(config)
        -createPaths()
        -addWriggle()
    }

    CityLinesGame --> RoadTile
    CityLinesGame --> Landmark
    CityLinesGame --> Exit
    CityLinesGame --> ConnectionDetector
    CityLinesGame ..> LevelGenerator
```

### Game Screen Flow

```typescript
// GameScreen.tsx - How game uses core + modules
const GameScreen = () => {
  // 1. Access core systems via Solid.js hooks
  const assets = useAssets();
  const tuning = useTuning<ScaffoldTuning, CityLinesTuning>();
  const screen = useScreen();

  // 2. Create Pixi application using core's GPU loader
  const app = assets.getPixiApp();

  // 3. Instantiate game with tuning config
  const game = new CityLinesGame({
    tuning: tuning.game,
    assets: assets,
  });

  // 4. Handle game events
  game.on('levelComplete', (data) => {
    screen.goto('results', data);
  });
};
```

---

## Integration Across Tiers

### Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant APP as app.tsx
    participant TP as TuningProvider
    participant ANP as AnalyticsProvider
    participant MP as ManifestProvider
    participant AP as AssetProvider
    participant SP as ScreenProvider
    participant LS as LoadingScreen
    participant GS as GameScreen
    participant CLG as CityLinesGame

    Note over U,CLG: Startup Phase
    U->>APP: Open app
    APP->>TP: Mount core providers
    TP->>TP: Load configs
    TP->>ANP: Config ready
    ANP->>MP: Analytics initialized
    MP->>MP: Resolve manifest (CDN or local)
    MP->>AP: Manifest ready
    AP->>AP: Create coordinator
    AP->>SP: Assets ready
    SP->>LS: Render loading

    Note over LS,CLG: Loading Phase
    LS->>AP: loadBundle('tiles')
    AP-->>LS: Loaded
    LS->>SP: goto('game')

    Note over GS,CLG: Gameplay Phase
    SP->>GS: Render game
    GS->>TP: useTuning()
    GS->>AP: useAssets()
    GS->>CLG: new CityLinesGame()

    U->>CLG: Click tile
    CLG->>CLG: rotate and check
    CLG-->>GS: levelComplete
    GS->>SP: goto('results')
```

### Integration Points

| Aspect | Core Provides | Modules Provide | Game Provides |
|--------|---------------|-----------------|---------------|
| **Assets** | Coordinator, loaders | - | Manifest definition |
| **Screens** | Manager, transitions | - | Screen components |
| **Config** | Loader, fallback chain | Tuning bindings (green) | Tuning schema + defaults (orange) |
| **Audio** | State management, base manager | - | Sound definitions, playback |
| **Errors** | Boundaries, reporting | - | Wrapped components |
| **UI** | Button, Spinner, Viewport | SpriteButton, ProgressBar, DialogueBox, CharacterSprite, AvatarPopup | Game-specific UI |
| **Logic** | Storage utils | Progress, Catalog, Loader, LevelCompletion | Game services using factories |
| **Dev Tools** | TuningPanel (cyan section) | Tuning bindings (green section) | Tuning bindings (orange section) |
| **Analytics** | Analytics library, schemas | - | AnalyticsProvider, game events |
| **Feature Flags** | - | - | FeatureFlagProvider |

---

## Systems Architecture

### What is a "System"?

A system is a **self-contained module** that:
1. Manages its own state (using **Solid.js signals**)
2. Exposes a context provider
3. Provides hooks for component access
4. Has no dependencies on game logic

### System Structure Pattern

```mermaid
graph TB
    subgraph SYSTEM["System Structure Pattern"]
        direction TB

        TYPES["types.ts -- TypeScript interfaces"]
        STATE["state.ts -- createSignal() state"]
        CONTEXT["context.tsx -- Provider + useHook()"]
        INDEX["index.ts -- Public exports"]

        TYPES --> STATE
        STATE --> CONTEXT
        CONTEXT --> INDEX
    end

    style TYPES fill:#3b82f6,color:#fff,stroke:#2563eb
    style STATE fill:#8b5cf6,color:#fff,stroke:#7c3aed
    style CONTEXT fill:#ec4899,color:#fff,stroke:#db2777
    style INDEX fill:#10b981,color:#fff,stroke:#059669
```

### Module Structure Pattern (Visual)

```mermaid
graph TB
    subgraph MODULE["Visual Module Structure Pattern"]
        direction TB

        RENDERERS["renderers/pixi.ts -- Engine-specific rendering"]
        DEFAULTS["defaults.ts -- Default config values"]
        TUNING["tuning.ts -- Dev panel bindings (green)"]
        M_INDEX["index.ts -- Public exports"]

        DEFAULTS --> RENDERERS
        DEFAULTS --> TUNING
        RENDERERS --> M_INDEX
        TUNING --> M_INDEX
    end

    style RENDERERS fill:#22c55e,color:#fff,stroke:#16a34a
    style DEFAULTS fill:#4ade80,color:#000,stroke:#22c55e
    style TUNING fill:#4ade80,color:#000,stroke:#22c55e
    style M_INDEX fill:#10b981,color:#fff,stroke:#059669
```

### Module Structure Pattern (Logic)

```mermaid
graph TB
    subgraph LOGIC_MODULE["Logic Module Structure Pattern"]
        direction TB

        FACTORY["index.ts -- createXxxService() factory"]
        L_DEFAULTS["defaults.ts -- Default config values"]
        L_TUNING["tuning.ts -- Dev panel bindings (green)"]
        CONTROLLER["Controller.ts -- Business logic (optional)"]

        L_DEFAULTS --> FACTORY
        L_DEFAULTS --> L_TUNING
        CONTROLLER --> FACTORY
    end

    style FACTORY fill:#86efac,color:#000,stroke:#4ade80
    style L_DEFAULTS fill:#bbf7d0,color:#000,stroke:#86efac
    style L_TUNING fill:#bbf7d0,color:#000,stroke:#86efac
    style CONTROLLER fill:#86efac,color:#000,stroke:#4ade80
```

### Core Systems Summary

| System | State | Hook | Purpose |
|--------|-------|------|---------|
| Assets | coordinator | `useAssets()` | Load/manage assets |
| Screens | manager | `useScreen()` | Navigation |
| Tuning | config | `useTuning()` | Configuration |
| Manifest | manifest, gameData | `useManifest()` | Game data resolution |
| Pause | paused signal | `usePause()` | Pause state |
| Audio | volumes | `useAudio()` | Audio settings |
| Errors | - | boundaries | Error handling |
| VFX | - | - | Particle effects |

---

## Key Files Reference

### Core Entry Points

| File | Purpose |
|------|---------|
| `core/config.ts` | Engine selection (pixi/phaser/three) |
| `core/index.ts` | Public API -- what modules and games can import |
| `core/systems/*/context.tsx` | Provider + hooks for each system |
| `core/systems/manifest/context.tsx` | ManifestProvider (props-based, no game imports) |
| `core/ui/ViewportToggle.tsx` | Viewport mode toggle (dev only) |
| `core/dev/TuningPanel.tsx` | Color-coded tuning panel |
| `core/dev/tuningRegistry.ts` | Registry for module/game tuning bindings |

### Module Entry Points

| File | Purpose |
|------|---------|
| `modules/primitives/sprite-button/index.ts` | SpriteButton (multi-renderer) |
| `modules/primitives/progress-bar/index.ts` | ProgressBar (Pixi) |
| `modules/primitives/dialogue-box/index.ts` | DialogueBox (Pixi) |
| `modules/primitives/character-sprite/index.ts` | CharacterSprite (Pixi) |
| `modules/prefabs/avatar-popup/index.ts` | AvatarPopup (Pixi) |
| `modules/logic/progress/index.ts` | `createProgressService()` factory |
| `modules/logic/catalog/index.ts` | `createCatalogService()` factory |
| `modules/logic/loader/index.ts` | `createContentLoader()` factory |
| `modules/logic/level-completion/index.ts` | `createLevelCompletionController()` factory |

### Game Entry Points

| File | Purpose |
|------|---------|
| `game/config/index.ts` | Screen component mapping, identity, environment |
| `game/state.ts` | Global game state (Solid.js root) |
| `game/tuning/` | Game config schema + defaults |
| `game/setup/AnalyticsContext.tsx` | Game-specific AnalyticsProvider |
| `game/setup/FeatureFlagContext.tsx` | Game-specific FeatureFlagProvider |

### Integration Point

| File | Purpose |
|------|---------|
| `app.tsx` | Root -- wires core + game setup + core providers together |

---

## Benefits of This Architecture

### For Development
- **Clear boundaries** -- Know where to put new code (core vs modules vs game)
- **Strict dependency rules** -- core has no deps, modules depend on core only, game depends on both
- **Reusability** -- Core works for any game; modules are shared across games
- **Testability** -- Each tier is isolated and independently testable
- **Type safety** -- Generics ensure correct typing across tier boundaries

### For Teams
- **Parallel work** -- Core, modules, and game can evolve independently
- **Onboarding** -- 3-tier structure with clear rules is easy to learn
- **Code reviews** -- Changes are localized to the appropriate tier
- **Shared components** -- Modules prevent duplication across game projects

### For the Future
- **New games** -- Implement game layer against core + pick modules you need
- **New modules** -- Add shared components without touching core or game
- **Upgrades** -- Core improvements benefit all games automatically
- **Engine swap** -- Change from Pixi to Three.js via config + renderer files
- **Module portability** -- Each module has `renderers/` for multi-engine support

---

## Quick Reference: Adding New Features

### Adding a New Core System

1. Create `core/systems/mySystem/`
2. Define types in `types.ts`
3. Create state with `createSignal()` in `state.ts`
4. Create provider + hook in `context.tsx`
5. Export from `core/index.ts`
6. Add provider to `app.tsx` stack

### Adding a New Visual Module

1. Create `modules/primitives/my-component/` (or `modules/prefabs/`)
2. Add `defaults.ts` with default config values
3. Add `renderers/pixi.ts` with the Pixi.js renderer
4. Add `tuning.ts` with dev panel bindings (green section)
5. Export from `index.ts`
6. Register tuning bindings via `core/dev/tuningRegistry.ts`

### Adding a New Logic Module

1. Create `modules/logic/my-service/`
2. Export a `createMyService<T>()` factory function from `index.ts`
3. Add `defaults.ts` if configurable
4. Add `tuning.ts` if tunable at runtime
5. Games call the factory with their own types and config

### Adding Game-Specific Logic

1. Add to `game/citylines/` (core logic) or `game/screens/` (UI)
2. Use core hooks for assets, screens, tuning, manifest
3. Use module factories for progress, catalog, loader, level completion
4. Use module primitives/prefabs for visual components
5. Extend game tuning if new config is needed
6. Add to manifest if new assets are needed

### Adding Tunable Values

1. **Core tuning**: Add to `core/systems/tuning/types.ts` with default (cyan section)
2. **Module tuning**: Add to `modules/*/tuning.ts` with default (green section)
3. **Game tuning**: Add to `game/tuning/types.ts` with default (orange section)
4. Access via `useTuning<ScaffoldTuning, GameTuning>()`
5. Optionally register dev bindings for the TuningPanel UI
