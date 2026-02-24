# Music Loading Report

How to load `music_1.mp3` and `music_2.mp3` into City Lines.

---

## Current State

### What Exists

| File | Size | Status |
|------|------|--------|
| `public/assets/music_1.mp3` | 6.3 MB | Unused |
| `public/assets/music_2.mp3` | 4.3 MB | Unused |
| `public/assets/sfx-citylines.mp3` | 82 KB | Active (SFX sprite) |
| `public/assets/sfx-citylines.webm` | 330 KB | Active (SFX sprite) |

### What's Broken

The current music setup has two problems:

1. **Sprite name mismatch** — `sounds.ts` references `bg_track_1/2/3` but the audio sprite JSON contains `music_track_1/2/3`. Music playback silently fails.

2. **Stub clips in sprite** — The music entries in `sfx-citylines.json` are 0.5–1 second placeholder clips, not real tracks. The actual full-length files (`music_1.mp3`, `music_2.mp3`) sit unused in `public/assets/`.

---

## Options

### Option A: Separate Music Bundle (Recommended)

Create a dedicated audio bundle for music, loaded independently from SFX.

**How it works:**
- Create `public/assets/music-citylines.json` with Howler sprite definitions pointing at the full MP3s
- Add a new `audio-music-citylines` bundle to `manifest.ts`
- Update `sounds.ts` to reference the new channel
- Remove stale music stubs from `sfx-citylines.json`

**Pros:**
- Music loads independently — SFX load fast, music streams in parallel
- CDN-ready out of the box (manifest already supports `cdnBase` + `localBase` fallback)
- Each music file stays as a standalone MP3 (no re-encoding into a sprite)
- Easy to add/swap tracks without rebuilding the SFX sprite

**Cons:**
- Two HTTP requests for music files instead of one sprite
- Slightly more config to maintain

**CDN behavior:**
- Local dev: loads from `/assets/music-citylines.json`
- Production: loads from `https://media.wolf.games/games/citylines/data/assets/music-citylines.json`
- Automatic fallback if CDN fails

### Option B: Bake Music into SFX Sprite

Re-encode `music_1.mp3` and `music_2.mp3` into the existing `sfx-citylines` sprite file.

**How it works:**
- Concatenate music tracks into the SFX audio sprite
- Update `sfx-citylines.json` with correct offsets and durations
- Fix sprite name references in `sounds.ts`

**Pros:**
- Single audio file download (fewer HTTP requests)

**Cons:**
- SFX sprite balloons from ~400 KB to ~11 MB — blocks all sound until fully loaded
- Harder to update music without rebuilding the entire sprite
- Sprite files this large are an anti-pattern for web audio
- No benefit since music doesn't need sub-second latency like SFX

### Option C: Direct Howl Instances (Bypass Manifest)

Create `Howl` instances directly for each music file, skipping the sprite/manifest system.

**Pros:**
- Simplest code change

**Cons:**
- Bypasses the CDN/fallback system entirely
- No environment-aware URL resolution
- Breaks the established audio architecture pattern

---

## Recommendation: Option A

Separate music bundle. Here's the implementation:

### 1. Create `public/assets/music-citylines.json`

```json
{
  "src": ["music_1.mp3"],
  "sprite": {
    "music_1": [0, -1]
  }
}
```

And a second file `public/assets/music-citylines-2.json`:

```json
{
  "src": ["music_2.mp3"],
  "sprite": {
    "music_2": [0, -1]
  }
}
```

> Note: `[0, -1]` means "play from start to end" in Howler — no need to know exact duration. Alternatively, both tracks can share one JSON if they're concatenated, but separate JSONs keep things modular.

**Simpler alternative — one JSON, two sources:**

```json
{
  "src": ["music_1.mp3"],
  "sprite": {
    "music_1": [0, -1, true]
  }
}
```

The `true` third value enables looping in Howler.

### 2. Add bundle to `manifest.ts`

```ts
// AUDIO
{ name: 'audio-sfx-citylines', assets: ['sfx-citylines.json'] },
{ name: 'audio-music-1', assets: ['music-citylines.json'] },
{ name: 'audio-music-2', assets: ['music-citylines-2.json'] },
```

### 3. Update `sounds.ts`

```ts
export const MUSIC_TRACKS: readonly SoundDefinition[] = [
  { channel: 'music-citylines', sprite: 'music_1' },
  { channel: 'music-citylines-2', sprite: 'music_2' },
] as const;
```

### 4. Clean up `sfx-citylines.json`

Remove the stale `music_track_1/2/3` entries.

### 5. Load music bundle in GameScreen

Music bundles load via the same manifest pipeline — CDN with local fallback, just like SFX. The scaffold `AudioLoader` handles registration automatically for any bundle prefixed with `audio-`.

---

## CDN Notes

The existing infrastructure already handles CDN loading:

| Environment | Base URL |
|-------------|----------|
| Local | `/assets/` |
| Development | `https://media.dev.wolf.games/games/citylines/data/assets/` |
| Production | `https://media.wolf.games/games/citylines/data/assets/` |

Music files placed in `public/assets/` will be served from the CDN in production. No additional CDN configuration is needed — the manifest system resolves URLs automatically.

For **large music files**, consider:
- Uploading MP3s directly to the CDN bucket rather than bundling them in the build
- Using the `Cache-Control: public, max-age=31536000` header for long-term caching
- Providing WebM versions alongside MP3 for smaller file sizes (~30-40% smaller)

---

## File Size Considerations

| Approach | Total Download | Blocking? |
|----------|---------------|-----------|
| Option A (separate) | SFX: 400 KB + Music: 6.3 MB + 4.3 MB | SFX loads fast, music streams in background |
| Option B (baked) | Single file: ~11 MB | All audio blocked until complete |

Option A is clearly better for perceived load time — players hear SFX immediately while music loads asynchronously.
