# Manifest System

**File:** `src/core/systems/manifest/context.tsx`

The ManifestProvider resolves game data (chapters, levels, stories) and asset manifests through a priority-based fallback chain.

## Props Interface

The ManifestProvider accepts all configuration as props from `app.tsx`, rather than importing from `game/` directly. This keeps the core system decoupled from game-specific code.

```typescript
export interface ManifestProviderProps {
  /** Default asset manifest */
  manifest: Manifest;
  /** Default game data (chapters, levels, stories) */
  defaultGameData: unknown;
  /** Server storage URL for CDN fetch (null to skip) */
  serverStorageUrl: string | null;
}
```

### Usage in app.tsx

The game layer provides all three props when mounting the provider:

```tsx
// src/app.tsx
import { ManifestProvider } from '~/core/systems/manifest/context';
import { manifest, defaultGameData, gameConfig } from '~/game';

export default function App() {
  return (
    <ManifestProvider
      manifest={manifest}
      defaultGameData={defaultGameData}
      serverStorageUrl={gameConfig.serverStorageUrl}
    >
      <AssetProvider config={{ engine: scaffoldConfig.engine }}>
        <ScreenProvider options={{ initialScreen: gameConfig.initialScreen }}>
          <ScreenRenderer screens={gameConfig.screens} />
        </ScreenProvider>
      </AssetProvider>
    </ManifestProvider>
  );
}
```

This pattern means:
- **`manifest`** -- The default asset manifest exported from `src/game/manifest.ts` (bundle definitions and cdnBase)
- **`defaultGameData`** -- Bundled game data from `src/game/data/default.json` (chapters, levels, stories)
- **`serverStorageUrl`** -- From `gameConfig.serverStorageUrl` in `src/game/config.ts` (or `null` to skip CDN fetch)

The ManifestProvider uses these props as signal initial values, so the game can render immediately without waiting for external data sources.

## Data Resolution Chain

```
1. postMessage injection  (embed mode -- parent window sends data)
       │ fails or not embed
       ▼
2. CDN fetch              (serverStorageUrl/chapters/default.json)
       │ fails or no URL configured
       ▼
3. Local defaults         (props.manifest + props.defaultGameData)
```

### Source 1: postMessage Injection (highest priority)
- Listens for `window.message` events with `{ type: 'set_manifest', value: ... }`
- Used when the game is embedded in a parent app (Game Manager)
- Activated when URL has `?mode=embed`
- Overrides both manifest and game data signals immediately

### Source 2: CDN Fetch
- Fetches `${props.serverStorageUrl}/chapters/default.json`
- Only runs when NOT in embed mode and `serverStorageUrl` is not null
- Updates manifest if response contains `bundles` + `cdnBase`
- Updates game data only if not already injected via postMessage

### Source 3: Local Defaults (always available)
- `props.manifest` -- asset bundle definitions passed from `src/game/manifest.ts`
- `props.defaultGameData` -- bundled chapter/level data passed from `src/game/data/default.json`
- Set as signal initial values -- the game can render immediately without waiting for sources 1 or 2

## Context Value

The ManifestProvider exposes the following via `useManifest()`:

```typescript
interface ManifestContextValue {
  /** Asset manifest for bundle loading (consumed by AssetProvider) */
  manifest: Accessor<Manifest>;
  /** Game data from backend (chapters, levels, stories, etc.) */
  gameData: Accessor<unknown>;
  /** Current mode: standalone or injected */
  mode: Accessor<ManifestMode>;
  /** Inject data from parent context (overrides other sources) */
  injectData: (data: unknown) => void;
  /** Accessor for current game data */
  getGameData: () => unknown;
}
```

## Usage

```tsx
// In any component
const { manifest, gameData, mode } = useManifest();
```

## Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| `standalone` | Default | Tries CDN, falls back to local |
| `injected` | `?mode=embed` or postMessage received | Waits for parent to send data |
