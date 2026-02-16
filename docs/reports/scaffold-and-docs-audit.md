# Scaffold Extraction & Docs Organization Audit

What's left to extract from City Lines into scaffold, and which docs are in the wrong place.

---

## Part 1: Code — What Should Move to Scaffold

### Already Extracted

The scaffold already provides: asset system, audio base, screen management, tuning system, error reporting, state persistence, providers, and hooks.

### Still in Game Code — Reusable (should extract)

| Priority | File | What It Is | Effort |
|----------|------|-----------|--------|
| High | `citylines/core/SpriteButton.ts` | Generic Pixi button with 9-slice, text, hover/click. Zero game coupling. | None — move as-is |
| High | `citylines/core/ProgressBar.ts` | Progress bar with milestones, labels, theme colors. Minimal game coupling (optional tileTheme). | Strip theme param |
| High | `citylines/controllers/LevelCompletionController.ts` | State machine: playing → completing → complete. 100% generic. | None — move as-is |
| High | `citylines/types/grid.ts` | Edge, GridPosition, GridSize, adjacency helpers. Powers any grid game. | None — move as-is |
| High | `constants/viewport.ts` | Viewport constraints (min size, aspect ratio, safe padding, touch targets). | None — move as-is |
| Medium | `citylines/LevelGenerator/LevelGenerator.ts` | Seeded procedural grid generator. Generic but complex. | Needs generic interface |
| Medium | `citylines/LevelGenerator/Dijkstra.ts` | Pure Dijkstra pathfinding. No game coupling. | None — move as-is |
| Medium | `citylines/LevelGenerator/PriorityQueue.ts` | Generic priority queue. | None — move as-is |
| Medium | `citylines/LevelGenerator/XoroShiro128Plus.ts` | Deterministic PRNG for seeded generation. | None — move as-is |
| Medium | `citylines/ui/companion/DialogueBox.ts` | Generic Pixi dialogue box with 9-slice + text. | Inject font param |
| Medium | `citylines/animations/companionAnimations.ts` | GSAP slide-in, pop-in timelines. Generic animation patterns. | Parameterize targets |
| Medium | `screens/components/CompletionOverlay.tsx` | Celebration overlay with clue text. Solid.js component. | Generalize props |
| Low | `state.ts` | GameState (score, health, level). Generic shape. | Add generics |
| Low | `citylines/core/Character.ts` | Sprite container for character types. Generic pattern. | Decouple from atlas |
| Low | `citylines/ui/CluePopup.ts` | Popup with avatar + speech bubble. | Decouple sprites |
| Low | `citylines/ui/companion/CompanionCharacter.ts` | Companion sprite with full/head modes. | Decouple from atlas |
| Low | `screens/LoadingScreen.tsx` | Loading screen with progress. Generic pattern. | Needs DI refactor |

### Correctly Game-Specific (stays in game/)

These are City Lines only and should NOT move:

| Area | Files | Why |
|------|-------|-----|
| Core gameplay | `CityLinesGame.ts`, `RoadTile.ts`, `ConnectionDetector.ts`, `Exit.ts`, `Landmark.ts` | City Lines grid/road logic |
| Data | `landmarks.ts`, `counties.ts`, `sampleLevel.ts` | NJ counties, landmark registry |
| Services | `chapterLoader.ts`, `chapterCatalog.ts`, `progress.ts`, `LevelGenerationService.ts`, `ChapterGenerationService.ts` | City Lines schema + chapter flow |
| Types | `landmark.ts`, `level.ts`, `section.ts`, `gameData.ts` | City Lines backend schema |
| Config | `environment.ts`, `fonts.ts`, `config.ts` | City Lines CDN paths, branding |
| Audio | `manager.ts`, `sounds.ts` | City Lines SFX catalog |
| Tuning | `types.ts` | City Lines grid/tile/difficulty params |
| Systems | `DecorationSystem.ts` | County-themed decorations |
| Utils | `atlasHelper.ts`, `evaluateConnections.ts`, `startScreenHelper.ts` | City Lines specific |
| Screens | `StartScreen.tsx`, `GameScreen.tsx`, `ResultsScreen.tsx` | City Lines screen implementations |

### Extraction Priority

**If building the next game, extract these first:**

1. `SpriteButton.ts` — every game needs buttons
2. `ProgressBar.ts` — every game needs progress display
3. `grid.ts` types — any grid-based game needs these
4. `viewport.ts` — every mobile game needs viewport constraints
5. `LevelCompletionController.ts` — every game needs completion flow

These 5 files are zero-effort moves that immediately benefit the next game.

---

## Part 2: Docs — What's in the Wrong Place

### docs/reports/ — Mixed bag, needs sorting

| File | Category | Should Be |
|------|----------|-----------|
| `chapter-index-report.md` | Game | `docs/game/reports/` |
| `music-loading-report.md` | Game | `docs/game/reports/` |
| `chunk-size-audit.md` | Game | `docs/game/reports/` |
| `40kb-target-analysis.md` | Game | `docs/game/reports/` |
| `scaffold-extraction-candidates.md` | Scaffold | `docs/scaffold/reports/` |
| `aidd-vs-factory-comparison.md` | Process | `docs/reports/` (keep) |

### docs/guides/ — Mostly correct, a few borderline

| File | Category | Notes |
|------|----------|-------|
| `progress-persistence.md` | Scaffold | Uses scaffold's `createVersionedStore`. Correct in guides/. |
| `claude-code-setup-prompt.md` | Process | AI tooling setup. Correct in guides/. |
| `deployment/unified-manifest-design.md` | Game-leaning | References City Lines level manifest format. Could move to game docs. |

### docs/game/ — Correct placement

All 5 files are properly City Lines specific. No changes needed.

### docs/scaffold/ — Correct placement

All 12 files are properly framework documentation. No changes needed.

### docs/factory/ — Correct placement

All 17 factory commands. No changes needed.

### docs/archive/ — Mostly correct

| File | Notes |
|------|-------|
| `citylines/citylines-learnings.md` | Game-specific, correctly archived |
| `next-game-documentation-plan.md` | Process, correctly archived |
| 11 executed-plans | Game-specific, correctly archived |
| `MOBILE_RESTRICTOR_PLAN.md` | Scaffold, correctly archived |
| `UTILS_AUDIO_REORGANIZATION_PLAN.md` | Scaffold, correctly archived |
| `pr-28-code-review-report.md` | Process, correctly archived |

### src/game/docs/ — Correct placement

All 8 files are City Lines implementation reports. Plus 3 JSON files (backend response samples). Correct.

---

## Recommended Moves

### Docs moves (6 files)

```
docs/reports/chapter-index-report.md     → docs/game/reports/chapter-index-report.md
docs/reports/music-loading-report.md     → docs/game/reports/music-loading-report.md
docs/reports/chunk-size-audit.md         → docs/game/reports/chunk-size-audit.md
docs/reports/40kb-target-analysis.md     → docs/game/reports/40kb-target-analysis.md
docs/reports/scaffold-extraction-candidates.md → docs/scaffold/reports/scaffold-extraction-candidates.md
docs/reports/scaffold-and-docs-audit.md  → docs/scaffold/reports/scaffold-and-docs-audit.md
```

After moves, `docs/reports/` would only contain process reports:
- `aidd-vs-factory-comparison.md`

### Code extractions — COMPLETED (2026-02-11)

Moved to `src/scaffold/`:
```
src/game/constants/viewport.ts → src/scaffold/config/viewport.ts
```

Moved to `src/game/shared/` (reusable game-level layer):
```
SpriteButton.ts         → shared/components/SpriteButton.ts (as-is)
ProgressBar.ts          → shared/components/ProgressBar.ts (parameterized fontFamily)
DialogueBox.ts          → shared/components/DialogueBox.ts (parameterized font, atlas, positioning)
CharacterSprite.ts      → shared/components/CharacterSprite.ts (generic type config from Character.ts)
AvatarPopup.ts          → shared/components/AvatarPopup.ts (from CluePopup.ts, parameterized all game deps)
LevelCompletionController.ts → shared/controllers/LevelCompletionController.ts (as-is)
```

Citylines files now contain thin wrappers that inject game-specific config into shared components.

---

*Generated: 2026-02-11, Updated: 2026-02-11*
