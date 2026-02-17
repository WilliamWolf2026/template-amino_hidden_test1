# Manifest System

**File:** `src/scaffold/systems/manifest/context.tsx`

The ManifestProvider resolves game data (chapters, levels, stories) and asset manifests through a priority-based fallback chain.

## Data Resolution Chain

```
1. postMessage injection  (embed mode — parent window sends data)
       │ fails or not embed
       ▼
2. CDN fetch              (serverStorageUrl/chapters/default.json)
       │ fails or no URL configured
       ▼
3. Local defaults         (bundled manifest + gameData from src/game/)
```

### Source 1: postMessage Injection (highest priority)
- Listens for `window.message` events with `{ type: 'set_manifest', value: ... }`
- Used when the game is embedded in a parent app (Game Manager)
- Activated when URL has `?mode=embed`
- Overrides both manifest and game data signals immediately

### Source 2: CDN Fetch
- Fetches `${gameConfig.serverStorageUrl}/chapters/default.json`
- Only runs when NOT in embed mode and `serverStorageUrl` is configured
- Updates manifest if response contains `bundles` + `cdnBase`
- Updates game data only if not already injected via postMessage

### Source 3: Local Defaults (always available)
- `manifestDefault` from `src/game/manifest.ts` — asset bundle definitions
- `defaultGameData` from `src/game/data/default.json` — bundled chapter/level data
- Set as signal initial values — the game can render immediately without waiting for sources 1 or 2

## Usage

```tsx
// In app.tsx provider stack
<ManifestProvider>
  <AssetProvider>
    ...
  </AssetProvider>
</ManifestProvider>

// In any component
const { manifest, gameData, mode } = useManifest();
```

## Modes

| Mode | Trigger | Behavior |
|------|---------|----------|
| `standalone` | Default | Tries CDN, falls back to local |
| `injected` | `?mode=embed` or postMessage received | Waits for parent to send data |
