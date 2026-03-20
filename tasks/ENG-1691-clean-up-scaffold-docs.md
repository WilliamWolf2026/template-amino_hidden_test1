# Clean up Scaffold Documentation — Stale References Epic

**Status**: ✅ COMPLETED (2026-03-19)
**Linear**: ENG-1691
**Goal**: Update 7 documentation files to reflect the Amino Template three-tier layout, removing all stale Scaffold/CityLines references

## Overview

The project was renamed from "Scaffold" to "Amino Template" and restructured into `src/core/`, `src/modules/`, `src/game/`. Seven docs still reference the old structure — `scaffold/`, `src/game/shared/`, CityLines-specific code — causing onboarding confusion and inaccurate developer guidance.

---

## Update tuning.md references

Replace CityLines-specific type names with current generic equivalents.

**Requirements**:

- Given `CityLinesTuning` and `CITYLINES_DEFAULTS` in code examples, should replace with `GameTuning` and `GAME_DEFAULTS`
- Given `useTuning<ScaffoldTuning, CityLinesTuning>()` hook example, should update to match current type signatures

---

## Update testing-strategy.md examples

Replace CityLines game logic examples with generic game patterns.

**Requirements**:

- Given test path `src/game/citylines/__tests__/`, should replace with `src/game/mygame/__tests__/`
- Given CityLines-specific function names like `calculateScore`/`calculateBonus` and audio refs like `sfx-citylines`, should replace with generic game examples

---

## Update context-map.md diagram

Replace stale folder names and component locations in the context map.

**Requirements**:

- Given `game/shared/` items (SpriteButton, ProgressBar, etc.) in the MODULES section, should reference `src/modules/primitives/` and `src/modules/prefabs/`
- Given `citylines/` folder reference in game tier, should use `mygame/` or generic placeholder

---

## Update shared-components.md paths

Replace `scaffold/` and `game/shared/` references with current tier structure.

**Requirements**:

- Given `scaffold/` as architecture tier reference, should reference `src/core/`
- Given import paths from `~/game/shared/components/`, should import from `~/modules/primitives/`

---

## Update new-game.md guide

Replace stale shared component paths and structure diagram.

**Requirements**:

- Given `src/game/shared/` in structure diagram and component references, should show `src/modules/` tier with primitives/prefabs/logic subfolders
- Given `game/shared/controllers/` for LevelCompletionController, should reference `src/modules/logic/level-completion/`

---

## Update newgame.md factory paths

Replace `scaffold/systems/telemetry/` paths and CityLines references.

**Requirements**:

- Given `scaffold/systems/telemetry/AnalyticsContext.tsx` and `FeatureFlagContext.tsx`, should reference `game/setup/` locations
- Given `src/game/citylines/` and `src/game/shared/` references, should use `src/game/mygame/` and `src/modules/`

---

## Rewrite architecture.md game section

Make the CityLines-specific Section 7 generic for the Amino Template.

**Requirements**:

- Given Section 7 "Game (CityLines Implementation)" with CityLinesGame class diagram, should rewrite as generic game layer description with template-appropriate examples
- Given `src/game/shared/` references throughout, should replace with `src/modules/` tier references
- Given "Scaffold" as project name, should replace with "Amino Template"

---

## Verify all referenced paths exist

Confirm every file path mentioned in updated docs points to a real file/directory.

**Requirements**:

- Given all updated documentation, should verify every `src/` path reference resolves to an existing file or directory
- Given any path that doesn't exist, should fix or remove the reference
