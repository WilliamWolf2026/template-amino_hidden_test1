# SimpleGame1 — Flip-Book Game Plan

**Intent:** New game named **simplegame1**: a minimal flip-book that shows one atlas background per level (≥12 levels) with a “Flip” button to advance. Uses `public/assets`, manifest loader, and the Daily Dispatch atlas/tiles JSON.

**Index:** This doc is reachable via [docs/INDEX.md](../INDEX.md) under “Tickets & plans”.

---

## 1. Goals

- **Game name:** simplegame1
- **Mechanic:** Flip-book — one full-screen background image per level; tap/click “Flip” to go to the next level.
- **Levels:** At least 12. Each level shows one background from the atlas; backgrounds cycle if there are fewer than 12 unique images.
- **Assets:** Use existing `public/assets` (atlas, tiles, Daily Dispatch JSON) and the **manifest loader** (bundles: atlas, tiles, daily dispatch). No new asset pipeline; assets stay under `public/assets`.
- **Reference:** Atlas frame list from `public/assets/atlas-tiles-daily-dispatch.json`; use its background frame names for level→sprite mapping.

---

## 2. Asset Reference (from atlas-tiles-daily-dispatch.json)

Background frames in the Daily Dispatch atlas (use these for level backgrounds):

| Frame name | Use |
|------------|-----|
| `bg-closing_truck.png` | Level 1, 5, 9 |
| `bg-closing_truck_b.png` | Level 2, 6, 10 |
| `bg-gameboard.png` | Level 3, 7, 11 |
| `bg-warehouse_interior.png` | Level 4, 8, 12 |

Level index: 1–12 (1-based). Mapping: `backgroundFrameIndex = (levelNumber - 1) % 4`.

Manifest bundle to load: **`atlas-tiles-daily-dispatch`** (already in `src/game/config.ts`). Optionally keep **theme-branding** for logo; no tiles or daily-dispatch JSON required for the flip-book mechanic unless we add chapter/level metadata later.

---

## 3. High-Level Architecture

- **Config:** Fork game identity to simplegame1 in `src/game/config.ts` (GAME_ID, GAME_SLUG, GAME_NAME, GAME_CDN_PATH, etc.). Keep manifest pointing at same `public/assets` (localBase/cdnBase); include bundle `atlas-tiles-daily-dispatch` (and theme-branding if desired).
- **Game folder:** Add `src/game/simplegame1/` (do not replace `mygame/` yet if we want to keep current game; for a clean “new game” we can make simplegame1 the active game and keep mygame as reference, or create simplegame1 alongside and switch GameScreen import).
- **Loading:** Ensure the atlas bundle is loaded before gameplay. Options: (a) Load `atlas-tiles-daily-dispatch` in LoadingScreen when navigating to game (e.g. in “loadCore” phase or a dedicated “loadAtlas” step when going to game), or (b) Load it inside the simplegame1 game controller on init. Prefer (a) so progress bar reflects it when skipping to game.
- **Screens:** Reuse LoadingScreen, StartScreen, GameScreen, ResultsScreen. StartScreen can be minimal (e.g. “Play” → game). GameScreen hosts the simplegame1 controller. ResultsScreen can show after level 12 (“You finished!”).
- **State:** Use `gameState` in `src/game/state.ts`: `currentLevel` (1–12), `totalLevels` (12). “Flip” increments level; when level > 12, go to results.

---

## 4. Implementation Plan (ordered)

### 4.1 Config and identity

- **File:** `src/game/config.ts`
- Set `GAME_ID`, `GAME_SLUG`, `GAME_NAME`, `GAME_CDN_PATH`, `GAME_STORAGE_PREFIX` for simplegame1.
- Keep manifest: `theme-branding`, `atlas-tiles-daily-dispatch`. Remove or keep other bundles as needed for minimal load; at minimum keep these two so we use “assets folder in public” and “atlas, tiles, daily dispatch” in the manifest loader.
- Ensure `localBase`/`cdnBase` resolve to `public/assets` (e.g. `/assets` for local).

### 4.2 LoadingScreen — load atlas when going to game

- **File:** `src/game/screens/LoadingScreen.tsx`
- When navigating to game (skip-start or after “Play”), after `loadTheme` and `initGpu`, load bundle `atlas-tiles-daily-dispatch` (e.g. in “loadCore” phase or an explicit step) so the flip-book has the atlas ready. If “loadCore” is used for core-* bundles only, add a single `loadBundle('atlas-tiles-daily-dispatch', …)` in the same flow.

### 4.3 Game folder and controller

- **Folder:** `src/game/simplegame1/`
- **Files:**
  - `src/game/simplegame1/screens/gameController.ts` — flip-book controller:
    - Receives `coordinator` (with `getGpuLoader()`, `loadBundle()`), tuning, audio, gameData, analytics.
    - On init: ensure `atlas-tiles-daily-dispatch` is loaded (if not already), create Pixi Application, build scene with one background sprite and one “Flip” button.
    - Background sprite: from `atlas-tiles-daily-dispatch` and frame name from a constant list of 4 bg frames; index = `(currentLevel - 1) % 4` (currentLevel from gameState).
    - Flip button: use a Pixi sprite/button (e.g. from atlas `ui-button_start.png` or a simple rectangle); on click: increment level (via gameState), update background sprite texture to next frame, if level > 12 navigate to results (use screen context or callback from GameScreen).
  - Optional: `src/game/simplegame1/data/levelBackgrounds.ts` — export ordered list of 4 frame names for the atlas (so we can cycle for 12 levels).

### 4.4 Wire GameScreen to simplegame1

- **File:** `src/game/screens/GameScreen.tsx`
- Change import from `~/game/mygame/screens/gameController` to `~/game/simplegame1/screens/gameController` (or a small factory that returns the same interface). Ensure the controller interface matches: `init(container)`, `destroy()`, `ariaText()`.

### 4.5 Game state

- **File:** `src/game/state.ts`
- Ensure `totalLevels` is set to 12 for simplegame1 (or set it in the simplegame1 controller when starting). Use `currentLevel` (1-based) and `incrementLevel()` for “Flip”. When transitioning to results, set story headline/image/URL if desired (optional).

### 4.6 Start screen (minimal)

- **File:** `src/game/screens/StartScreen.tsx`
- Simple “Play” button that navigates to game. No need for chapter picker unless we add it later.

### 4.7 Results screen

- **File:** `src/game/screens/ResultsScreen.tsx`
- Can stay as-is or show a simple “You finished all 12 levels!” message. Use `gameState.currentLevel()` / `totalLevels()` if needed.

### 4.8 Tuning (optional)

- **File:** `src/game/tuning/types.ts`
- Add simplegame1-specific tuning if needed (e.g. total level count, or keep 12 hardcoded).

---

## 5. Level → background mapping (reference)

```ts
const BACKGROUND_FRAMES = [
  'bg-closing_truck.png',
  'bg-closing_truck_b.png',
  'bg-gameboard.png',
  'bg-warehouse_interior.png',
] as const;

function getBackgroundFrame(levelNumber: number): string {
  return BACKGROUND_FRAMES[(levelNumber - 1) % BACKGROUND_FRAMES.length];
}
```

Levels 1–12 will cycle through these four backgrounds three times.

---

## 6. Checklist (summary)

- [ ] Update `src/game/config.ts`: simplegame1 identity, manifest with atlas (and theme) from `public/assets`.
- [ ] LoadingScreen: load `atlas-tiles-daily-dispatch` before navigating to game.
- [ ] Create `src/game/simplegame1/screens/gameController.ts`: Pixi app, one bg sprite from atlas, Flip button, level 1–12, go to results after 12.
- [ ] Optional: `src/game/simplegame1/data/levelBackgrounds.ts` with frame list.
- [ ] GameScreen: use simplegame1 controller.
- [ ] state.ts: totalLevels = 12 (or set in controller).
- [ ] StartScreen: minimal “Play” → game.
- [ ] ResultsScreen: show completion for 12 levels.
- [ ] Manual test: load app → Start → Play → Flip 12 times → Results.

---

## 7. Index reference

- **Asset loading:** [core/systems/assets.md](../core/systems/assets.md), [INDEX.md](../INDEX.md) (Core Systems)
- **Game structure:** [src/game/INDEX.md](../../src/game/INDEX.md)
- **New game guide:** [guides/getting-started/new-game.md](../guides/getting-started/new-game.md)
- **Manifest:** [src/core/systems/manifest/context.tsx](../../src/core/systems/manifest/context.tsx), [src/core/systems/assets/coordinator.ts](../../src/core/systems/assets/coordinator.ts)
- **Atlas JSON:** [public/assets/atlas-tiles-daily-dispatch.json](../../public/assets/atlas-tiles-daily-dispatch.json)
