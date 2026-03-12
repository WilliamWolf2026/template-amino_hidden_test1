# Clean Up Game Folder

## Context

CityLines and DailyDispatch already archived to `src/game/archive/games/`. But root `src/game/` still has 15 folders and lots of old-game cruft. Goal: trim the fat and create a clean game template folder.

---

## Phase 1: Cut Dead Weight

| Path | Why | Action |
|------|-----|--------|
| `analytics/` | Header says "City Lines Game-Specific" | Move to `archive/games/` |
| `docs/` | 8 CityLines-era reports | Move to `archive/games/` |
| `utils/debugParams.ts` | Says "TODO: Remove this entire file" | Delete folder |
| `data/default.json` | Daily Dispatch fallback data | Move to `archive/games/` |
| `services/` | All 3 files reference old games (chapterLoader imports citylines/types) | Move to `archive/games/` |

**Result: 15 folders → 10** (config, setup, tuning, screens, audio, hooks, types, archive, _template + root files)

---

## Phase 2: Clean Broken References

After archival, these files import from deleted paths:

| File | Broken Import | Fix |
|------|--------------|-----|
| `screens/GameScreen.tsx` | `dailydispatch/screens/gameController` | Strip to skeleton with TODO |
| `screens/StartScreen.tsx` | `dailydispatch/screens/startView` | Strip to skeleton with TODO |
| `screens/LoadingScreen.tsx` | `services/progress` | Remove progress-resume logic, keep loading flow |
| `types/gameData.ts` | Not broken but CityLines schema (ChapterRef, CountyRef, etc.) | Replace with minimal skeleton |
| `hooks/useGameData.ts` | Depends on above types | Update to match new skeleton |
| `state.ts` | Check for CityLines-specific state | Clean if needed |
| `manifest.ts` | Check for old game asset bundles | Clean if needed |
| `config.ts` | Check for old screen/URL references | Clean if needed |
| `audio/sounds.ts` | Check for old game sound definitions | Clean if needed |

---

## Phase 3: Create Game Template

Create `src/game/_template/` — the folder structure a new game copies:

```
src/game/_template/
  README.md                # Instructions: copy, rename, wire into screens/
  index.ts                 # Barrel export
  core/index.ts            # Game engine classes (Pixi containers, entities)
  animations/index.ts      # GSAP animation configs
  controllers/index.ts     # Game controllers (orchestration)
  systems/index.ts         # Game systems (decoration, scoring)
  ui/index.ts              # Game-specific Pixi UI
  data/index.ts            # Static game data
  types/index.ts           # Game-specific types
  utils/index.ts           # Game-specific utilities
  screens/
    index.ts
    gameController.ts      # Skeleton matching GameScreen.tsx interface
    startView.ts           # Skeleton matching StartScreen.tsx interface
  services/index.ts        # Game-specific services
```

`gameController.ts` and `startView.ts` export the setup functions that `screens/GameScreen.tsx` and `screens/StartScreen.tsx` expect — so a new game just fills in the implementation.

---

## Phase 4: Update INDEX.md

Rewrite `src/game/INDEX.md`:
- Remove citylines, dailydispatch, old services, analytics, docs, data, utils references
- Add `_template/` section explaining the game subfolder pattern
- Clarify infrastructure (root) vs game implementation (nested)

---

## Verification

```bash
# No imports from archived/deleted paths
grep -r "citylines\|dailydispatch\|chapterLoader\|chapterCatalog\|debugParams" \
  src/game/ --include="*.ts" --include="*.tsx" | grep -v archive | grep -v _template

# Template exists with expected structure
ls src/game/_template/

# TypeCheck
bun run typecheck 2>&1 | head -40
```

---

## Files to Modify

| File | Action |
|------|--------|
| `src/game/analytics/` | Move to `archive/games/analytics/` |
| `src/game/docs/` | Move to `archive/games/docs/` |
| `src/game/utils/` | Delete |
| `src/game/data/` | Move to `archive/games/data/` |
| `src/game/services/` | Move to `archive/games/services/` |
| `src/game/screens/GameScreen.tsx` | Strip to skeleton |
| `src/game/screens/StartScreen.tsx` | Strip to skeleton |
| `src/game/screens/LoadingScreen.tsx` | Remove progress-resume references |
| `src/game/types/gameData.ts` | Replace with minimal skeleton |
| `src/game/hooks/useGameData.ts` | Update types import |
| `src/game/state.ts` | Clean if game-specific |
| `src/game/asset-manifest.ts` | Clean if game-specific |
| `src/game/config.ts` | Clean if game-specific |
| `src/game/audio/sounds.ts` | Clean if game-specific |
| `src/game/_template/` | Create new |
| `src/game/INDEX.md` | Rewrite |
