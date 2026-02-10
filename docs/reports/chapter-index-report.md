# Chapter Index & CDN Loading Report

## Current State

### index.json
The current `public/chapters/index.json` uses a `GamesIndex` schema pointing to a single game via a full backend URL:

```json
{
  "games": [
    {
      "uid": "8dae4255-aa4e-402c-8b43-9857baa8af41",
      "url": "http://localhost:4443/download/storage/v1/b/advance-game-manager-bucket/o/city-lines%2Fgames%2F8dae4255-...%2Findex.json?alt=media",
      "publishDate": "2026-02-10T17:59:23.839Z"
    }
  ]
}
```

Each game entry's `url` points to a full `GameData` JSON (containing `chapters[]`). The `chapterLoader.ts` service has `fetchGamesIndex()` and `fetchGameData()` functions to resolve this chain.

### default.json
`public/chapters/default.json` currently holds **all 8 chapters baked into one file** (tutorial + chapters 1–7). This file is loaded as the fallback game data in two places:

1. **Build-time import** — `src/game/data/default.json` is imported via `src/game/index.ts` as `defaultGameData` and used as the initial signal value in `ManifestProvider`.
2. **CDN fetch** — `ManifestProvider` attempts to fetch `{serverStorageUrl}/chapters/default.json` at runtime (currently disabled because `serverStorageUrl` is `null`).

### Individual chapter files
We generated 8 standalone chapter files in `public/chapters/`:
- `patrol-tutorial.json`
- `patrol-1.json` through `patrol-7.json`

These are not currently referenced by anything.

---

## How Data Flows Today

```
ManifestProvider (scaffold)
  ├─ Source 1: postMessage injection (embed mode)
  ├─ Source 2: CDN fetch → {serverStorageUrl}/chapters/default.json  (DISABLED, serverStorageUrl=null)
  └─ Source 3: static import → src/game/data/default.json (ACTIVE FALLBACK)
        ↓
  gameData signal (GameData shape: { uid, name, chapters[] })
        ↓
  GameScreen → useGameData() → gameData().chapters[0] → chapterRefToLevelManifest()
```

The game currently loads **only the first chapter** (`chapters[0]`) from whatever `GameData` is resolved. There is no chapter selection or sequential chapter progression yet.

---

## What index.json Should Become

The `index.json` should serve as a **chapter catalog** — a list of all available chapters with URLs pointing to individual chapter files on the CDN. Each entry follows the existing `GameIndexEntry` schema but points to a single chapter's `GameData` JSON.

### Proposed index.json

```json
{
  "games": [
    {
      "uid": "patrol-tutorial",
      "url": "/chapters/patrol-tutorial.json",
      "publishDate": "2026-02-10T00:00:00.000Z"
    },
    {
      "uid": "patrol-chapter-1",
      "url": "/chapters/patrol-1.json",
      "publishDate": "2026-02-10T00:00:00.000Z"
    },
    {
      "uid": "patrol-chapter-2",
      "url": "/chapters/patrol-2.json",
      "publishDate": "2026-02-10T00:00:00.000Z"
    },
    {
      "uid": "patrol-chapter-3",
      "url": "/chapters/patrol-3.json",
      "publishDate": "2026-02-10T00:00:00.000Z"
    },
    {
      "uid": "patrol-chapter-4",
      "url": "/chapters/patrol-4.json",
      "publishDate": "2026-02-10T00:00:00.000Z"
    },
    {
      "uid": "patrol-chapter-5",
      "url": "/chapters/patrol-5.json",
      "publishDate": "2026-02-10T00:00:00.000Z"
    },
    {
      "uid": "patrol-chapter-6",
      "url": "/chapters/patrol-6.json",
      "publishDate": "2026-02-10T00:00:00.000Z"
    },
    {
      "uid": "patrol-chapter-7",
      "url": "/chapters/patrol-7.json",
      "publishDate": "2026-02-10T00:00:00.000Z"
    }
  ]
}
```

### CDN URL Resolution

On CDN, the `chapters/` folder sits alongside `assets/` under the game data path:

| Environment | Base URL | Chapters Path |
|-------------|----------|---------------|
| **Local** | *(empty)* | `/chapters/patrol-1.json` |
| **Dev** | `https://media.dev.wolf.games` | `.../games/citylines/data/chapters/patrol-1.json` |
| **QA** | `https://media.qa.wolf.games` | `.../games/citylines/data/chapters/patrol-1.json` |
| **Staging** | `https://media.staging.wolf.games` | `.../games/citylines/data/chapters/patrol-1.json` |
| **Production** | `https://media.wolf.games` | `.../games/citylines/data/chapters/patrol-1.json` |

The `getChaptersUrl()` helper in `src/game/config/environment.ts` already builds this correctly:
- Local: `/chapters`
- Remote: `{CDN_BASE}/games/citylines/data/chapters`

So in `index.json`, the URLs can be **relative paths** (`/chapters/patrol-1.json`) for local dev, and the loader would prepend the CDN base for remote environments.

Alternatively, the URLs could be **just filenames** (e.g. `patrol-1.json`) and the loader resolves them against `getChaptersUrl()`, similar to how `resolveLevelUrl()` works for level names.

---

## What Needs to Change (Code)

### 1. Update index.json with chapter URLs
Replace the current backend URL with relative paths to individual chapter files.

### 2. Add a chapter index loader
The existing `fetchGamesIndex()` in `chapterLoader.ts` can already fetch and parse the index. A new function is needed to:
- Fetch `{chaptersUrl}/index.json`
- Resolve each entry's `url` against `getChaptersUrl()` (for CDN support)
- Return the list of available chapters with resolved URLs

### 3. Update ManifestProvider or GameScreen
Currently `ManifestProvider` fetches a single `default.json` and loads all chapters at once. Two options:

**Option A: Keep default.json as the all-in-one fallback**
- `index.json` catalogs individual files for on-demand loading
- `default.json` remains the baked-in fallback (no fetch needed)
- GameScreen uses `index.json` to know what chapters exist, loads them individually when needed

**Option B: Remove default.json, load from index**
- `index.json` is the only entry point
- On startup, fetch `index.json` → fetch the first chapter → play
- Load subsequent chapters on demand as the player progresses

### 4. Revert default.json to single-chapter or remove it
The baked-in `src/game/data/default.json` (build-time import) should either:
- Contain only the tutorial (chapter 0) as the offline/fallback
- Or remain as-is for backward compatibility until the index loader is wired up

---

## CDN Folder Structure

```
games/citylines/data/
├── assets/
│   ├── atlas-tiles-citylines.json
│   ├── atlas-tiles-citylines.png
│   ├── sfx-citylines.json
│   ├── music-citylines-1.json
│   ├── music-citylines-1.mp3
│   └── ...
└── chapters/
    ├── index.json              ← chapter catalog
    ├── patrol-tutorial.json    ← tutorial (chapter 0)
    ├── patrol-1.json           ← chapter 1
    ├── patrol-2.json           ← chapter 2
    ├── patrol-3.json
    ├── patrol-4.json
    ├── patrol-5.json
    ├── patrol-6.json
    └── patrol-7.json           ← chapter 7
```

---

## Summary

| Item | Status | Action |
|------|--------|--------|
| Individual chapter JSONs | Done | 8 files in `public/chapters/` |
| `default.json` (all-in-one) | Done | Contains all 8 chapters |
| `index.json` (catalog) | Needs update | Point to individual chapter files |
| `chapterLoader.ts` (index resolver) | Needs work | Resolve chapter URLs via `getChaptersUrl()` |
| `ManifestProvider` / `GameScreen` | Needs work | Wire up index-based loading |
| `src/game/data/default.json` (build-time) | Needs decision | Keep as offline fallback or trim to tutorial only |
