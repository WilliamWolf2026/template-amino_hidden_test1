# Chapter Generation Report

How City Lines generates and runs chapters: section config, difficulty, seeds, level generation, and UI.

---

## 1. What is a “chapter”?

- A **chapter** is a block of **10 levels** (levels 1–10, 11–20, 21–30, …).
- Difficulty **resets each chapter**: level 1 and level 11 use the same “chapter slot” (easy); level 10 and level 20 use the same slot (hard).
- One **section** supplies the story and theme for the whole run; its config is loaded once and reused for every level (including across chapters). Chapters are not separate configs—they are the same section repeated every 10 levels.

---

## 2. Section config (chapter content and seeds)

**Source:** `src/game/citylines/types/section.ts`

- **Loaded once** when the game screen mounts via `loadSectionConfig()`.
- **URL:** `?section=<url>` or fallback `GET /assets/sections/default.json`.
- **Shape:**

| Field        | Purpose |
|-------------|---------|
| `story`     | Headline, summary, imageUrl, articleUrl, and **`clues`** (array of 10 strings, one per level in the chapter). |
| `county`    | Theming (e.g. `bergen`, `atlantic`). Must be one of `VALID_COUNTIES`. |
| `levelSeeds`| Optional **10 seeds** (numbers). If present, level `n` uses `levelSeeds[(n - 1) % 10]` for reproducible generation. |
| `sectionId` | Optional identifier (e.g. for analytics). |

- **Helpers:** `getClueForLevel(config, levelNumber)` returns `config.story.clues[(levelNumber - 1) % 10]`.
- **Example:** `public/assets/sections/default.json` defines one section (e.g. Wonder food-hall story), with `levelSeeds` and 10 clues.

---

## 3. Difficulty and progression (per chapter slot)

**Source:** `src/game/citylines/types/level.ts`

- **Chapter progression** is fixed: 10 difficulty presets, one per level in a chapter.
- **Mapping:** `getDifficultyForLevel(levelNumber)`:
  - `chapterLevelIndex = (levelNumber - 1) % 10` → index 0–9.
  - Returns `CHAPTER_LEVEL_PROGRESSION[chapterLevelIndex]`.

**`CHAPTER_LEVEL_PROGRESSION` (GDD-aligned):**

| Slot | Grid | Landmarks   | Detour % | Min path |
|------|------|-------------|----------|----------|
| 1    | 4×4  | 2           | 10%      | 3        |
| 2    | 4×4  | 2–3         | 15%      | 3        |
| 3    | 5×5  | 3           | 20%      | 4        |
| 4    | 5×5  | 3–4         | 25%      | 4        |
| 5    | 5×5  | 4           | 30%      | 4        |
| 6    | 5×5  | 4–5         | 35%      | 4        |
| 7    | 6×6  | 5           | 40%      | 5        |
| 8    | 6×6  | 5–6         | 50%      | 5        |
| 9    | 6×6  | 6           | 55%      | 5        |
| 10   | 6×6  | 6–7         | 60%      | 5        |

- **Generator config:** `difficultyToGeneratorConfig(difficulty, baseTuning)` turns that into `GeneratorConfig` (width, height, exitPoints, pointsSpacing, wriggle params, etc.). Landmark count is chosen at random in `[min, max]` for that slot; spacing is density-adjusted.

---

## 4. How a single level is generated

**Source:** `GameScreen.tsx` (helper), `LevelGenerationService.ts`, `LevelGenerator` (core).

**Flow:**

1. **Entry point:** `generateLevelWithProgression(levelNumber, sectionConfig)` (GameScreen).
2. **Difficulty:** `getDifficultyForLevel(levelNumber)` → `DifficultySettings` for that chapter slot.
3. **Generator config:** `difficultyToGeneratorConfig(difficulty, baseTuning)` → `GeneratorConfig`.
4. **Seed:**  
   `levelIndex = (levelNumber - 1) % 10`  
   `seed = sectionConfig?.levelSeeds?.[levelIndex]`  
   If no seed, `LevelGenerationService` uses a random seed.
5. **Generation:** `LevelGenerationService.generateLevel(levelNumber, generatorConfig, seed)`:
   - Builds `LevelGenerator` with the seed and grid/exit/wriggle params.
   - Generates base level, then applies wriggle passes (`addComplexityMultiple`).
   - Converts to `LevelConfig`: landmarks from exit points, road tiles from paths, rotations scrambled with the same seed.
6. **Section overlay:** GameScreen sets `level.county = sectionConfig.county`. Clue text is **not** stored on the level for display; it’s read from the section when showing the completion popup.

So **chapters are generated** by repeatedly calling this pipeline with `levelNumber = 1, 2, … , 10, 11, 12, …`; the section config (and optional `levelSeeds`) is the only per-section input.

---

## 5. When levels are created and loaded

- **First level (level 1):** After `loadSectionConfig()` resolves, GameScreen runs `generateLevelWithProgression(1, config)`, applies county, then `setCurrentLevel(firstLevel)` and passes that `LevelConfig` to `CityLinesGame.loadLevel(...)`.
- **Next level (2, 3, …):** On “continue” after the completion clue (or after chapter-end overlay dismiss), `loadNextLevelWithTransition()` runs:
  - `generateLevelWithProgression(currentLevel().levelNumber + 1, sectionConfig)`,
  - applies county from section,
  - `setCurrentLevel(newLevel)`,
  - `game.loadLevel(newLevel)`,
  - then plays the level transition and updates the progress bar.
- **Global state:** `gameState.currentLevel()` is incremented on `levelComplete` (so it tracks the 1-based level index). `gameState.totalLevels()` is fixed at 10 (one chapter length). The progress bar shows `current / total` (e.g. `3 / 10`, then `11 / 10` for chapter 2 level 1).

---

## 6. Chapter boundaries and UI

- **Chapter end:** `levelNumber % 10 === 0` (e.g. 10, 20, 30). For those levels, completion shows the **full companion overlay** with `story.headline` and `story.summary` instead of the single-clue popup.
- **Levels 1–9:** Completion shows the **CluePopup** with the clue for that level from `getClueForLevel(config, levelNumber)`.
- **Seeds across chapters:** For level 11, `levelIndex = 0`, so the same seed as level 1 is used (`levelSeeds[0]`). So with a fixed section and `levelSeeds`, level 1 and level 11 are the same layout; only the level number and any non-seeded randomness (e.g. landmark count range) can differ.

---

## 7. Summary

| Concern            | How it works |
|--------------------|--------------|
| **Chapter length** | Fixed 10 levels; same section config for all levels. |
| **Section**        | One JSON (URL or default), provides story, county, optional levelSeeds. |
| **Difficulty**     | `getDifficultyForLevel(levelNumber)` → chapter slot 0–9 → `CHAPTER_LEVEL_PROGRESSION`. |
| **Seeds**          | Optional `levelSeeds[0..9]`; index `(levelNumber - 1) % 10`; repeat every chapter. |
| **Level content**  | `LevelGenerationService.generateLevel(levelNumber, generatorConfig, seed)` → `LevelConfig`. |
| **Clues / story**  | From section: `getClueForLevel(config, levelNumber)`; chapter end uses `story.headline` and `story.summary`. |
| **Progress**       | `gameState.currentLevel()` (incremented on complete), `totalLevels() === 10`; bar shows current / 10. |

Chapters are not generated as separate objects; they emerge from the same section config and the repeating 10-slot difficulty and seed indices.
