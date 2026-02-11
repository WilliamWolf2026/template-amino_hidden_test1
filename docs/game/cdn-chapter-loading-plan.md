# CDN Chapter Loading + Chapter Progression

## Status: Not Yet Implemented

## Problem

1. **No CDN loading** — The game loads chapter data from a static build-time import (`src/game/data/default.json`). The CDN is never hit. `gameConfig.serverStorageUrl` is `null` in `src/game/config.ts`, disabling the ManifestProvider's fetch. The `getChaptersUrl()` helper exists and correctly resolves to `{CDN_BASE}/games/citylines/data/chapters` on remote environments, but nothing calls it.

2. **No chapter progression** — When a chapter ends (level 7), the game wraps back to level 1 of the same chapter via modulo (`nextIndex = (nextLevelNumber - 1) % chapter.chapterLength`). There is no logic to load the next chapter.

## Current Data Flow

```
ManifestProvider (scaffold, READ-ONLY)
  ├─ Source 1: postMessage injection (embed mode)
  ├─ Source 2: CDN fetch (DISABLED — serverStorageUrl is null)
  └─ Source 3: static import → src/game/data/default.json (ACTIVE)
        ↓
  gameData signal → GameScreen → chapters[0] → chapterRefToLevelManifest()
        ↓
  Single chapter, loops forever
```

## CDN URL Structure

| Environment | Chapters URL |
|-------------|-------------|
| Local | `/chapters` |
| Dev | `https://media.dev.wolf.games/games/citylines/data/chapters` |
| QA | `https://media.qa.wolf.games/games/citylines/data/chapters` |
| Staging | `https://media.staging.wolf.games/games/citylines/data/chapters` |
| Production | `https://media.wolf.games/games/citylines/data/chapters` |

Files on CDN:
```
chapters/
├── index.json              ← catalog of all chapters
├── patrol-tutorial.json    ← chapter 0 (tutorial)
├── patrol-1.json           ← chapter 1
├── patrol-2.json through patrol-7.json
```

The `index.json` catalog uses relative filenames (e.g. `"url": "patrol-1.json"`) resolved against `getChaptersUrl()`.

## Implementation Plan

### Files to Change

| File | Action | Description |
|------|--------|-------------|
| `src/game/services/chapterCatalog.ts` | **NEW** | Chapter catalog service |
| `src/game/services/progress.ts` | **MODIFY** | Add `catalogIndex` to `CurrentChapter` |
| `src/game/services/chapterLoader.ts` | **MODIFY** | Add `resolveChapterUrl()` helper |
| `src/game/screens/GameScreen.tsx` | **MODIFY** | Wire up catalog + chapter transitions |

### 1. Chapter Catalog Service (`chapterCatalog.ts`)

New module with module-level state that manages the fetched `index.json`:

| Function | Purpose |
|----------|---------|
| `initCatalog()` | Fetch `{getChaptersUrl()}/index.json`, store the `GamesIndex`. On failure, build synthetic catalog from `defaultGameData`. |
| `getCatalog()` | Return current catalog state (`{ index, currentIndex, isRemote }`) |
| `setCatalogIndex(n)` | Set current chapter index (for resume) |
| `hasNextChapter()` | Check if there's a chapter after current index |
| `fetchCurrentChapter()` | Fetch the current chapter's `GameData` from its resolved URL |
| `fetchNextChapter()` | Increment index and fetch the next chapter's `GameData` |
| `resolveChapterUrl(entry)` | Resolve relative URLs against `getChaptersUrl()` |
| `findIndexByUid(uid)` | Look up a chapter's catalog position by uid |

Reuses existing `fetchGamesIndex()` and `fetchGameData()` from `chapterLoader.ts`.

### 2. Progress Service Update

Add optional `catalogIndex?: number` to the `CurrentChapter` interface. Backward-compatible — old saves without it default to lookup by `chapterId`.

### 3. GameScreen Changes

#### Initialization (`onMount`)

Replace the current chapter loading block with:
1. `await initCatalog()` — fetch `index.json`
2. Check saved progress via `getCurrentChapter()`
3. If resuming: `setCatalogIndex(savedProgress.catalogIndex ?? 0)`, fetch that chapter
4. If fresh start: fetch chapter at index 0
5. On fetch failure: fall back to existing `gameData()` from ManifestProvider
6. Convert to SectionConfig, generate chapter, update signals
7. Call `startChapter()` with `catalogIndex`

#### Chapter-End Handler

Replace the `isShowingCompletionClue` tap handler:
1. `completeChapter()` — mark current chapter done in progress service
2. If `hasNextChapter()`: call `startNextChapter()`
3. If no more chapters: show congratulations or navigate to results

#### `startNextChapter()` Function

1. `fetchNextChapter()` — advances catalog index, fetches next chapter JSON
2. Convert to SectionConfig via `chapterRefToLevelManifest()`
3. Generate new chapter via `ChapterGenerationService.generateChapter()`
4. Update all signals (`activeChapterRef`, `sectionConfig`, `generatedChapter`, `currentLevel`)
5. Reset HUD (`gameState.setCurrentLevel(1)`, `gameState.setTotalLevels(newLength)`)
6. Call `startChapter()` with new chapter info + `catalogIndex`
7. Update progress bar
8. Show introduction modal: `setModalPhase('introduction')` + `showCompanion(introText)`

The existing modal flow (introduction → loading-puzzle → chapter-start → playing) handles the rest.

### 4. Fallback Behavior

| Scenario | Fallback |
|----------|----------|
| `index.json` fetch fails | Synthetic catalog from built-in `defaultGameData` (one chapter) |
| Individual chapter fetch fails | Fall back to `defaultGameData` |
| Resume with stale `catalogIndex` | Validate by matching `chapterId`, fall back to index 0 |

## Key Architectural Notes

- **Scaffold is read-only** — we cannot edit `ManifestProvider`. Instead, we fetch chapters ourselves and use `injectData()` (exposed via `useGameData()`) to push fetched data into the reactive system.
- **`serverStorageUrl` stays `null`** — we bypass ManifestProvider's CDN fetch entirely and manage loading through the new catalog service.
- The existing `getChaptersUrl()` in `src/game/config/environment.ts` already builds the correct CDN path per environment.
- The existing `fetchGamesIndex()` and `fetchGameData()` in `chapterLoader.ts` handle the HTTP fetching.

## Verification Plan

1. `bun run typecheck` — no type errors
2. `bun run dev` — local testing:
   - Fresh start: fetches `/chapters/index.json`, then `/chapters/patrol-tutorial.json`
   - Complete tutorial (7 levels) → chapter-end overlay → tap → fetches `patrol-1.json` → new intro
   - Kill and reopen → resumes correct chapter and level
   - Rename `index.json` → falls back to built-in `default.json`
