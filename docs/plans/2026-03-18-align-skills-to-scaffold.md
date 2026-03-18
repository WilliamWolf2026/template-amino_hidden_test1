# Align aidd-custom Skills to Scaffold-Production Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all misalignments in vendored game-builder skill files so they correctly reference scaffold-production's actual types, paths, patterns, and APIs.

**Architecture:** Three passes — (1) rewrite scaffold-profiles as the foundation skill since all other build skills inherit its patterns, (2) global find-replace across all remaining skills for mechanical fixes, (3) per-skill semantic fixes for skills that need deeper changes.

**Tech Stack:** Markdown only — no runtime code changes.

---

## Reference: Scaffold-Production Actual State

Before editing any skill, these are the authoritative sources:

| What | Actual value |
|------|-------------|
| Game contract | `src/game/mygame-contract.ts` — `GameControllerDeps`, `GameController`, `StartScreenDeps`, `StartScreenController` |
| Game controller deps | `coordinator` (AssetCoordinatorFacade), `tuning`, `audio`, `gameData`, `analytics` |
| GameController interface | `{ init, destroy, ariaText, gameMode? }` |
| Game mode | `'dom'` (CSS only) or `'pixi'` (GPU) |
| Screen IDs | `'loading'` \| `'start'` \| `'game'` \| `'results'` — NO `'game_over'` |
| Game controller path | `src/game/mygame/screens/gameController.ts` |
| Start view path | `src/game/mygame/screens/startView.ts` |
| State management | SolidJS signals in `src/game/state.ts` (cross-screen) + closures in gameController (session) |
| Audio | `src/game/audio/manager.ts` extends `BaseAudioManager`, sounds in `src/game/audio/sounds.ts` |
| Tuning | `src/game/tuning/types.ts` + `src/game/tuning/index.ts` |
| Asset manifest | `src/game/asset-manifest.ts` — bundle prefix rules: `scene-*`/`core-*` (Pixi), `audio-*` (Howler), `theme-*` (DOM) |
| Build commands | `bun run dev`, `bun run build`, `bun run typecheck`, `bun run test` |
| Results screen | `src/game/screens/ResultsScreen.tsx` — already exists, don't create GameOverScreen |
| Modules available | `primitives/` (SpriteButton, DialogueBox, CharacterSprite, ProgressBar), `logic/` (LevelCompletion, Progress, Catalog, Loader), `prefabs/` (AvatarPopup) |

---

### Task 1: Rewrite scaffold-profiles/SKILL.md

This is the highest-priority fix. Every other build skill inherits assumptions from this file.

**Files:**
- Modify: `aidd-custom/scaffold-profiles/SKILL.md`

**Step 1: Replace the entire file content**

Keep the frontmatter. Replace the body with content that accurately describes the scaffold. Key changes:

1. **Replace `GameDeps`** with `GameControllerDeps` everywhere
2. **Remove `deps.renderer`** — scaffold has no renderer on deps. Games create their own `Application` in `init()`. Deps provide `coordinator` (AssetCoordinatorFacade)
3. **Remove `createPixiAdapter()`** — doesn't exist in scaffold
4. **Replace the setupGame contract** — must return `{ init, destroy, ariaText, gameMode? }`, not just `{ init, destroy }`
5. **Add `setupStartScreen`** — scaffold requires both exports from `mygame/index.ts`
6. **Fix scaffold layout** to show actual paths:
   - `src/game/mygame/screens/gameController.ts` (not `mygame/gameController.ts`)
   - `src/game/mygame/screens/startView.ts` (not `mygame/startView.ts`)
7. **Fix state management section** — SolidJS signals in `state.ts` for cross-screen state, closures in gameController for session state. NOT "closure-based only"
8. **Add `mygame-contract.ts`** to scaffold layout as the authoritative contract
9. **Add `asset-manifest.ts`**, `audio/manager.ts`, `audio/sounds.ts`, `tuning/` to layout
10. **Replace all build commands**: `npx tsc --noEmit` → `bun run typecheck`, `npx vite build` → `bun run build`, `npx vite dev` → `bun run dev`
11. **Replace `game_over`** screen references with `results`
12. **Remove "Game Client Profile (Legacy)"** section entirely
13. **Fix all Stage File Targets** sections to use `mygame/screens/` paths
14. **Add "What the Scaffold Already Provides" table** updated with actual systems:
    - Screen routing: `goto('start')`, `goto('game')`, `goto('results')` via ScreenProvider
    - Audio: `BaseAudioManager` extended by game's `audio/manager.ts`
    - Assets: `coordinator.loadBundle()`, `coordinator.loadCore()`, etc.
    - Tuning: `useTuning()` from core, persisted to localStorage
    - Error boundaries: ScreenBoundary wraps each screen
    - Settings panel: Already in app.tsx
    - Storage: `getStored(key, default)` / `setStored(key, val)` from core
    - Game controller pattern: `setupGame(deps)` → GameController
    - Start screen pattern: `setupStartScreen(deps)` → StartScreenController
15. **Add available modules** section listing what's in `src/modules/` that games can import

**Step 2: Verify no stale references remain**

Run: `grep -E "GameDeps|deps\.renderer|createPixiAdapter|game_over|npx tsc|npx vite|mygame/gameController\.ts[^/]|mygame/startView\.ts[^/]" aidd-custom/scaffold-profiles/SKILL.md`
Expected: zero matches

**Step 3: Commit**

```bash
git add aidd-custom/scaffold-profiles/SKILL.md
git commit -m "refactor: rewrite scaffold-profiles skill to match scaffold-production actual types and paths"
```

---

### Task 2: Global find-replace across all other skill files

Mechanical replacements that apply to every skill file.

**Files:**
- Modify: all `aidd-custom/*/SKILL.md` except `scaffold-profiles/` (already done) and `build-game/` (already aligned)

**Step 1: Apply replacements**

For each file, apply these find-and-replace pairs:

| Find | Replace |
|------|---------|
| `GameDeps` | `GameControllerDeps` |
| `deps.renderer` | `deps.coordinator` |
| `mygame/gameController.ts` (without `screens/` prefix) | `mygame/screens/gameController.ts` |
| `mygame/startView.ts` (without `screens/` prefix) | `mygame/screens/startView.ts` |
| `goto('game_over')` | `goto('results')` |
| `game_over` (as screen id) | `results` |
| `GameOverScreen.tsx` | `ResultsScreen.tsx` (already exists) |
| `npm test` | `bun run test` |
| `npx tsc --noEmit` | `bun run typecheck` |
| `npx vite build` | `bun run build` |
| `npx vite dev` | `bun run dev` |
| `aidd-custom/game-builder/skills/` | `aidd-custom/` |
| `aidd-custom/game-builder/design/` | `aidd-custom/design/` |

**Step 2: Verify no stale references remain across all skills**

Run: `grep -rE "GameDeps[^C]|deps\.renderer|game_over|npx tsc|npx vite|npm test|game-builder/skills|game-builder/design|GameOverScreen" aidd-custom/ --include="*.md" | grep -v build-game`
Expected: zero matches (build-game already correct)

**Step 3: Commit**

```bash
git add aidd-custom/
git commit -m "refactor: global find-replace to align all skill files with scaffold-production"
```

---

### Task 3: Fix game-lifecycle/SKILL.md

This skill tells agents to create a `GameOverScreen.tsx` — but `ResultsScreen.tsx` already exists.

**Files:**
- Modify: `aidd-custom/game-lifecycle/SKILL.md`

**Step 1: Apply semantic fixes**

1. Replace any "create GameOverScreen.tsx" instruction with "modify existing `src/game/screens/ResultsScreen.tsx`"
2. Replace screen graph references: `GAME_OVER` → `RESULTS`
3. Add note: "The scaffold provides 4 screen slots: `loading`, `start`, `game`, `results`. Do NOT create additional screen components — customize the existing ResultsScreen."
4. Update screen definitions table to match scaffold: `RESULTS` not `GAME_OVER`
5. Add reference to `mygame-contract.ts` for StartScreenController and GameController interfaces
6. Note that `goto()` comes from `StartScreenDeps` (via the start screen), NOT from GameControllerDeps — the game controller doesn't have access to `goto` directly

**Step 2: Commit**

```bash
git add aidd-custom/game-lifecycle/SKILL.md
git commit -m "refactor: align game-lifecycle skill with scaffold screen IDs and existing ResultsScreen"
```

---

### Task 4: Fix sound-design/SKILL.md and sound-design-elevenlabs/SKILL.md

These skills don't reference the scaffold's audio system.

**Files:**
- Modify: `aidd-custom/sound-design/SKILL.md`
- Modify: `aidd-custom/sound-design-elevenlabs/SKILL.md`

**Step 1: Add scaffold audio integration section to both**

Add a section explaining:
1. The scaffold provides `BaseAudioManager` in `src/core/systems/audio/base-manager.ts` — games extend it
2. Game audio manager lives at `src/game/audio/manager.ts` — extend `BaseAudioManager`
3. Sound definitions in `src/game/audio/sounds.ts` use `SoundDefinition { channel, sprite, volume? }`
4. Channel names must match audio bundle names in `asset-manifest.ts` (e.g., `audio-sfx-mygame`)
5. Audio bundles use Howler.js audio sprites — each sound effect is a sprite within a bundle
6. `coordinator.audio.play(channel, sprite, { volume })` for direct playback
7. Game manager pattern: `playExplosion()` calls `this.playSound(SOUND_EXPLOSION)`

**Step 2: Update file targets**

Sound design should create/modify:
- `src/game/audio/sounds.ts` — sound definitions
- `src/game/audio/manager.ts` — game audio manager with play methods
- `src/game/asset-manifest.ts` — register `audio-sfx-*` bundles
- `src/game/mygame/screens/gameController.ts` — wire sound triggers

**Step 3: Commit**

```bash
git add aidd-custom/sound-design/SKILL.md aidd-custom/sound-design-elevenlabs/SKILL.md
git commit -m "refactor: align sound-design skills with scaffold audio manager pattern"
```

---

### Task 5: Fix code-standards/SKILL.md

**Files:**
- Modify: `aidd-custom/code-standards/SKILL.md`

**Step 1: Apply fixes**

1. Replace build commands: `npx tsc --noEmit` → `bun run typecheck`, `npx vite build` → `bun run build`
2. Update `setupGame` contract to return `GameController { init, destroy, ariaText, gameMode? }`
3. Add reference to `mygame-contract.ts` as the authoritative type source
4. Add note that game code lives in `src/game/mygame/` (not just anywhere under `src/`)
5. Add reference to available modules in `src/modules/` that should be reused, not recreated

**Step 2: Commit**

```bash
git add aidd-custom/code-standards/SKILL.md
git commit -m "refactor: align code-standards skill with scaffold build commands and contract"
```

---

### Task 6: Fix visual-design/SKILL.md

**Files:**
- Modify: `aidd-custom/visual-design/SKILL.md`

**Step 1: Apply fixes**

1. Verify Pixi.js v8 Color API examples — `Color.toHsl()` may not exist in v8. If not, replace with correct v8 approach or remove the specific code example and describe the intent
2. Update file targets to use `src/game/mygame/` paths
3. Add note about integrating theme colors with `GAME_FONT_FAMILY` from `config.ts`
4. Add reference to how `scene-*` bundle textures are loaded via `coordinator.getGpuLoader()?.createSprite()`
5. Note the Pixi texture cleanup pattern (kill GSAP → removeChild → destroy → unloadBundle)

**Step 2: Commit**

```bash
git add aidd-custom/visual-design/SKILL.md
git commit -m "refactor: align visual-design skill with Pixi v8 API and scaffold asset patterns"
```

---

### Task 7: Fix micro-loop/SKILL.md and meso-loop/SKILL.md

**Files:**
- Modify: `aidd-custom/micro-loop/SKILL.md`
- Modify: `aidd-custom/meso-loop/SKILL.md`

**Step 1: Add scaffold context to both**

Add a brief "Scaffold Integration" section to each:
1. Pure `step(state, action)` function lives in `src/game/mygame/` — this is correct
2. The gameController in `src/game/mygame/screens/gameController.ts` calls `step()` and renders result
3. Game state types should extend or complement `src/game/state.ts` signals
4. The GameController must satisfy `mygame-contract.ts` interface
5. File targets should use correct `mygame/screens/` paths

**Step 2: Commit**

```bash
git add aidd-custom/micro-loop/SKILL.md aidd-custom/meso-loop/SKILL.md
git commit -m "refactor: add scaffold integration context to micro-loop and meso-loop skills"
```

---

### Task 8: Fix attract-mode/SKILL.md

**Files:**
- Modify: `aidd-custom/attract-mode/SKILL.md`

**Step 1: Add scaffold integration**

1. Attract mode mounts in the start screen via `setupStartScreen()` — the start view has access to `initGpu()`, `loadCore()`, and the Pixi stage
2. The `StartScreenDeps` provides `coordinator` for asset loading
3. File target: create `src/game/mygame/attractMode.ts`, modify `src/game/mygame/screens/startView.ts`
4. Any input exits attract and returns to interactive title

**Step 2: Commit**

```bash
git add aidd-custom/attract-mode/SKILL.md
git commit -m "refactor: align attract-mode skill with scaffold StartScreenDeps pattern"
```

---

### Task 9: Fix design/SKILL.md sub-agent paths

**Files:**
- Modify: `aidd-custom/design/SKILL.md`

**Step 1: Verify paths are correct**

Check that the execution sequence table references:
- `aidd-custom/design/01-core-identity/SKILL.md` (not `design/01-core-identity/SKILL.md`)
- Same for 02, 03, 04

Also verify the sub-agent prompt template uses `aidd-custom/design/` prefix.

Output docs should go to `design/` (project root, not inside aidd-custom).

**Step 2: Commit if changes needed**

```bash
git add aidd-custom/design/SKILL.md
git commit -m "refactor: verify design orchestrator paths are correct"
```

---

### Task 10: Final verification

**Step 1: Grep for all known stale patterns**

```bash
grep -rn "GameDeps[^C]" aidd-custom/ --include="*.md" | grep -v "GameControllerDeps"
grep -rn "deps\.renderer" aidd-custom/ --include="*.md"
grep -rn "createPixiAdapter" aidd-custom/ --include="*.md"
grep -rn "game_over" aidd-custom/ --include="*.md"
grep -rn "GameOverScreen" aidd-custom/ --include="*.md"
grep -rn "npx tsc" aidd-custom/ --include="*.md"
grep -rn "npx vite" aidd-custom/ --include="*.md"
grep -rn "npm test" aidd-custom/ --include="*.md"
grep -rn "game-builder/skills" aidd-custom/ --include="*.md"
grep -rn "mygame/gameController\.ts" aidd-custom/ --include="*.md" | grep -v "screens/gameController"
grep -rn "mygame/startView\.ts" aidd-custom/ --include="*.md" | grep -v "screens/startView"
```

Expected: zero matches for all.

**Step 2: Spot-check key skills read correctly**

Read the first 20 lines of scaffold-profiles, game-lifecycle, sound-design, and code-standards to verify they look correct.

**Step 3: Commit any stragglers**

```bash
git add aidd-custom/
git commit -m "refactor: final cleanup of stale references in skill files"
```
