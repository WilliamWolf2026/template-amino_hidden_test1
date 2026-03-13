# Asset Management System

Engine-agnostic asset loading with support for multiple renderers (PixiJS, Phaser, Three.js).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       GAME CODE                              │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │  DomLoader  │     │  GpuLoader  │     │ AudioLoader │
   │  (raw)      │     │  (engine)   │     │  (howler)   │
   └─────────────┘     └─────────────┘     └─────────────┘
          │                   │                   │
          └───────────────────┴───────────────────┘
                              │
                     ┌────────────────┐
                     │   Coordinator  │
                     └────────────────┘
                              │
                     ┌────────────────┐
                     │    Manifest    │
                     └────────────────┘
```

## Manifest Structure

```typescript
import type { Manifest } from '~/systems/assets';

export const manifest: Manifest = {
  cdnBase: '/assets',  // or 'https://cdn.example.com'
  bundles: [
    { name: 'bundle-name', assets: ['path/to/asset.json'] }
  ]
};
```

## Asset Targets

Target is **inferred from bundle prefix**:

| Prefix | Target | Loader | Use Case |
|--------|--------|--------|----------|
| `boot-` | `dom` | DomLoader | Pre-engine loading screen |
| `theme-` | `dom` | DomLoader | Branding/logo (pre-GPU, loading screen only) |
| `audio-` | `agnostic` | AudioLoader | Sound effects, music |
| `data-` | `agnostic` | DomLoader | JSON config files |
| `core-` | `gpu` | GpuLoader | In-game UI |
| `scene-` | `gpu` | GpuLoader | Gameplay assets (spritesheets, backgrounds, tiles) |
| `fx-` | `gpu` | GpuLoader | Particles, effects |
| `defer-` | `gpu` | GpuLoader | Low-priority extras |

> **Game atlases must use `scene-*` or `core-*`.** Only GPU-prefixed bundles are registered with Pixi. Placing a game spritesheet in `theme-*` will make it invisible to `createSprite`/`getTexture`.

Override with explicit target:
```typescript
{ name: 'scene-menu', assets: [...], target: 'dom' }
```

## Asset Types

Inferred from file extension:

| Extension | Type | Description |
|-----------|------|-------------|
| `.json` (non-audio) | `spritesheet` | TexturePacker JSON + associated image |
| `.png`, `.jpg`, `.webp`, `.gif`, `.svg` | `image` | Raw single image |
| `.json` (in audio/) | `audio` | Howler sprite definition |
| `.woff`, `.woff2`, `.ttf` | `font` | Web fonts |

## Example Manifest

```typescript
export const manifest: Manifest = {
  cdnBase: '/assets',
  bundles: [
    // ─── PRE-ENGINE (dom target) ─────────────────────────
    { name: 'boot-splash', assets: [
      'ui/logo.png',           // raw image
      'ui/spinner.json'        // spritesheet
    ]},

    // ─── ENGINE REQUIRED (gpu target) ────────────────────
    { name: 'core-ui', assets: [
      'ui/buttons.json',
      'ui/icons.json'
    ]},

    { name: 'scene-gameplay', assets: [
      'scenes/gameplay/entities.json',
      'scenes/gameplay/tilemap.png',
      'scenes/gameplay/config.json'
    ]},

    // ─── AGNOSTIC ────────────────────────────────────────
    { name: 'theme-branding', assets: ['branding/logo.json'] },

    { name: 'audio-sfx', assets: ['audio/sfx-ui.json'] },
    { name: 'audio-music', assets: ['audio/music.json'] },

    { name: 'data-levels', assets: ['data/levels.json'] },

    // ─── BACKGROUND LOADING ──────────────────────────────
    { name: 'defer-achievements', assets: ['ui/achievements.json'] },
  ],
};
```

## File Formats

### Spritesheet (TexturePacker JSON)

```json
{
  "frames": {
    "btn_play": {
      "frame": { "x": 0, "y": 0, "w": 120, "h": 40 }
    },
    "btn_settings": {
      "frame": { "x": 120, "y": 0, "w": 120, "h": 40 }
    }
  },
  "meta": {
    "image": "buttons.png",
    "size": { "w": 256, "h": 128 },
    "scale": 1
  },
  "animations": {
    "btn_hover": ["btn_play", "btn_play_hover"]
  }
}
```

### Audio Sprite (Howler format)

```json
{
  "src": ["sfx-ui.webm", "sfx-ui.mp3"],
  "sprite": {
    "click": [0, 150],
    "hover": [200, 100],
    "success": [400, 800]
  }
}
```

Format: `[offset_ms, duration_ms]`

## Usage

### Loading Assets

```typescript
import { useAssets } from '~/core/systems/assets';

function MyComponent() {
  const { loadBoot, loadCore, loadAudio, initGpu } = useAssets();

  onMount(async () => {
    // Pre-engine
    await loadBoot();

    // Initialize engine
    await initGpu();

    // Engine assets
    await loadCore();
    await loadAudio();
  });
}
```

### Accessing Assets

```typescript
const { coordinator } = useAssets();

// Raw image (DomLoader)
const bitmap = coordinator.dom.getImageBitmap('ui/logo.png');
const url = await coordinator.dom.getImageURL('ui/logo.png');

// Spritesheet frame (DomLoader)
const frameUrl = await coordinator.dom.getFrameURL('ui/buttons', 'btn_play');

// Engine sprite (GpuLoader - Pixi)
const sprite = coordinator.getGpuLoader().createSprite('ui/buttons', 'btn_play');

// Audio
coordinator.audio.play('audio/sfx-ui', 'click');
coordinator.audio.playMusic('audio/music', 'theme', { fadeIn: 1000 });
```

## Directory Structure

```
public/assets/
├── ui/
│   ├── logo.png
│   ├── buttons.json
│   └── buttons.png
├── scenes/
│   └── gameplay/
│       ├── entities.json
│       └── entities.png
├── audio/
│   ├── sfx-ui.json
│   ├── sfx-ui.webm
│   └── sfx-ui.mp3
├── branding/
│   ├── logo.json
│   └── logo.png
└── data/
    └── levels.json
```

## Loading Flow

```
App Start
    │
    ▼
LoadingScreen
    ├── loadBoot() ──► DomLoader (boot-*)
    ├── loadTheme() ──► DomLoader (theme-*)
    │
    ▼
StartScreen
    │
    │ [User clicks Start]
    │
    ├── unlockAudio() ──► Howler gesture unlock
    ├── initGpu() ──► Initialize PixiLoader
    ├── loadCore() ──► GpuLoader (core-*)
    ├── loadAudio() ──► AudioLoader (audio-*)
    │
    ▼
GameScreen
    ├── loadScene('gameplay') ──► GpuLoader (scene-gameplay)
    └── startBackgroundLoading() ──► defer-*, fx-*
```

## Progress Tracking

The coordinator exposes a reactive `LoadingState` that provides real-time per-bundle progress:

```typescript
interface LoadingState {
  loading: string[];          // bundles currently loading (foreground)
  loaded: string[];           // bundles that finished loading
  errors: Record<string, Error>;
  bundleProgress: Record<string, number>; // 0–1 per in-flight bundle
  backgroundLoading: string[];            // bundles loading in background
}
```

Each loader (Pixi, DOM, Howler) reports progress via an `onProgress` callback passed by the coordinator. The `LoadingScreen` derives its progress bar from this state:

```
progress = (loaded_count + sum_of_in_flight_progress) / total_target_bundles × 100
```

### Accessing Loading State

```typescript
import { useLoadingState } from '~/core/systems/assets';

function MyComponent() {
  const loadingState = useLoadingState(); // Accessor<LoadingState>

  // Reactive — triggers re-renders when bundles load
  const isLoading = () => loadingState().loading.length > 0;
  const bundlePct = () => loadingState().bundleProgress['scene-game'] ?? 0;
}
```

### Error Handling

Failed bundles appear in `loadingState().errors`. The `LoadingScreen` displays per-bundle errors and offers a retry button that re-invokes `loadBundle` for each failed bundle.

## Unloading & Memory Lifecycle

### Automatic Unloading on Screen Transitions

When the screen manager transitions from screen A to screen B, bundles owned by A but not by B are automatically unloaded. Ownership is determined by the `screenAssets` config in `src/game/config.ts`:

```typescript
screenAssets: {
  start: { required: ['theme-branding'] },
  game:  { required: ['scene-game', 'core-sprites'], optional: ['fx-particles'] },
}
```

```
Transition: game → results
  game owns:    [scene-game, core-sprites, fx-particles]
  results owns: []
  unloaded:     [scene-game, core-sprites, fx-particles]

Transition: game → start
  game owns:    [scene-game, core-sprites, fx-particles]
  start owns:   [theme-branding]
  unloaded:     [scene-game, core-sprites, fx-particles]  (no overlap)
```

Shared bundles (present in both screens) are preserved — only bundles exclusive to the outgoing screen are released.

### What Unloading Does

| Loader | Cleanup |
|--------|---------|
| GpuLoader (Pixi) | `Assets.unloadBundle(name)` — destroys textures and releases GPU memory |
| DomLoader | Clears cached image bitmaps, data URLs, and font entries |
| AudioLoader (Howler) | Calls `Howl.unload()` on each sound in the bundle |

### Manual Unloading

For screens not covered by `screenAssets` or for fine-grained control:

```typescript
const { unloadBundles } = useAssets();

// Unload specific bundles
unloadBundles(['scene-gameplay', 'fx-particles']);
```

### Background Loading

Bundles loaded via `backgroundLoadBundle()` or listed in `screenAssets.optional` load without blocking screen transitions. They appear in `loadingState().backgroundLoading` while in flight.
