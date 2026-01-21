# Scaffold Architecture

Overview of the game production scaffold structure and design principles.

## Directory Structure

```
src/
├── app.tsx                    # Root app (providers setup)
├── entry-client.tsx           # Client entry point
├── entry-server.tsx           # Server entry point
│
├── scaffold/                  # Framework-level systems (reusable)
│   ├── config.ts              # Scaffold configuration
│   ├── index.ts               # Public exports
│   │
│   ├── systems/               # Core game systems
│   │   ├── assets/            # Engine-agnostic asset loading
│   │   ├── screens/           # Screen management
│   │   ├── pause/             # Pause state management
│   │   ├── audio/             # Audio system
│   │   └── errors/            # Error handling & reporting
│   │
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Spinner.tsx
│   │   └── PauseOverlay.tsx
│   │
│   ├── lib/                   # Third-party integrations
│   │   ├── sentry.ts
│   │   └── posthog.ts
│   │
│   └── dev/                   # Development tools
│       └── Tweakpane.tsx
│
└── game/                      # Game-specific code
    ├── config.ts              # Game screen configuration
    ├── manifest.ts            # Asset manifest
    ├── state.ts               # Global game state
    │
    ├── screens/               # Game flow screens
    │   ├── LoadingScreen.tsx
    │   ├── StartScreen.tsx
    │   ├── GameScreen.tsx
    │   └── ResultsScreen.tsx
    │
    └── citylines/             # Game-specific logic
        ├── core/              # Game engine classes
        ├── types/             # Type definitions
        └── data/              # Game content data
```

## Scaffold vs Game Code

The scaffold is designed to separate reusable framework code from game-specific implementation:

| Scaffold (`/scaffold`) | Game (`/game`) |
|------------------------|----------------|
| Asset loading system | Asset manifest |
| Screen state machine | Screen components |
| Error boundaries | Game state |
| UI primitives | Game logic |
| Third-party integrations | Content data |

## Provider Hierarchy

```
App Root
│
└─► GlobalBoundary (error handler)
    │
    ├─► SettingsMenu (top-right UI)
    │
    └─► PauseProvider
        │
        └─► AssetProvider (manifest + coordinator)
            │
            └─► ScreenProvider (state machine)
                │
                └─► ScreenRenderer
                    │
                    ├─► LoadingScreen
                    ├─► StartScreen
                    ├─► GameScreen
                    └─► ResultsScreen
```

## Key Design Decisions

### Engine-Agnostic Asset Loading

Three independent loaders (DOM, GPU, Audio) allow swapping rendering engines without changing game code:

```
Game Code
    │
    ├─► DomLoader    (pre-engine assets)
    ├─► GpuLoader    (PixiJS/Phaser/Three)
    └─► AudioLoader  (Howler.js)
```

### Signal-Based Navigation

No traditional router. Screens change via SolidJS signals for instant transitions:

```typescript
const { goto } = useScreens();
goto('game'); // Immediate screen change
```

### Layered Error Boundaries

1. **GlobalBoundary** — Fatal errors (full page reload)
2. **ScreenBoundary** — Screen-level errors (retry or back to menu)
3. **AssetBoundary** — Loading errors (retry or skip)

### Container Hierarchy (PixiJS)

Game visuals are layered in separate containers:

```
PixiJS Application
└─► CityLinesGame (Container)
    ├─► Grid Container (background cells)
    ├─► Road Tiles Container (interactive pieces)
    ├─► Exits Container (target indicators)
    └─► Landmarks Container (goals)
```

## Technology Stack

| Category | Technology |
|----------|------------|
| UI Framework | SolidJS 1.9.5 |
| Meta-Framework | Vinxi 0.5.7 |
| Graphics | PixiJS 8.15.0 |
| Audio | Howler.js 2.2.4 |
| Styling | TailwindCSS 4.0.7 |
| Error Tracking | Sentry 10.33.0 |
| Analytics | PostHog 1.319.0 |
| Dev Tools | Tweakpane 4.0.5 |

## See Also

- [Asset Management](assets.md) — Manifest structure and loaders
- [Screen System](screens.md) — Screen management and transitions
- [State Management](state-management.md) — Signals and reactive state
- [Error Handling](error-handling.md) — Boundaries and reporting
- [Configuration](configuration.md) — Config systems
