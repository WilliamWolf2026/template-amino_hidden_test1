# Next Game Documentation Plan

> **Purpose**: Audit of current documentation, gaps analysis, and action plan to prepare for the next game project.

---

## Executive Summary

The scaffold framework is **well-documented** for architecture and systems. However, there are gaps in API references, troubleshooting guides, and game-specific workflow documentation. This plan identifies what to keep, what to create, and how to organize documentation for reuse.

---

## Table of Contents

1. [Current Documentation Audit](#current-documentation-audit)
2. [What to Keep (Scaffold Documentation)](#what-to-keep-scaffold-documentation)
3. [What to Archive (Game-Specific)](#what-to-archive-game-specific)
4. [Documentation Gaps](#documentation-gaps)
5. [Proposed New Documents](#proposed-new-documents)
6. [Recommended Folder Structure](#recommended-folder-structure)
7. [Action Plan](#action-plan)

---

## Current Documentation Audit

### Well-Documented Areas

| Area | Files | Status |
|------|-------|--------|
| Scaffold Architecture | 3 files (28KB+ each) | Excellent |
| System Documentation | 6 system docs | Complete |
| Game Design Document | gdd.md (10KB) | Complete |
| Asset Pipeline | asset-pipeline.md | Good |
| Audio Setup | audio-setup.md | Good |
| New Game Guide | new-game.md | Good |
| AI Development | ai/ folder (11 commands, 10+ rules) | Comprehensive |

### Partially Documented Areas

| Area | Current State | Gap |
|------|---------------|-----|
| Tuning System | Has overview | Missing API reference |
| Screen System | Has architecture | Missing transition examples |
| Level Generation | In code | Missing algorithm docs |
| Companion System | Scattered reports | Needs consolidation |

### Undocumented Areas

| Area | Priority | Impact |
|------|----------|--------|
| Hook API Reference | High | Blocks onboarding |
| Troubleshooting Guide | High | Blocks debugging |
| Mobile Optimization | Medium | Blocks mobile games |
| Performance Guide | Medium | Blocks complex games |
| Type/Schema Reference | Medium | Blocks type safety |
| Content Pipeline | Low | CityLines-specific |

---

## What to Keep (Scaffold Documentation)

These documents are **game-agnostic** and should be maintained for all future games:

### Core Framework Docs (Keep as-is)

```
docs/
├── README.md                              # Entry point - UPDATE for each game
├── scaffold/
│   ├── architecture.md                    # KEEP - Core architecture
│   ├── deep-dive.md                       # KEEP - Technical details
│   ├── scaffold-overview-and-migration.md # KEEP - Migration guide
│   ├── systems/
│   │   ├── assets.md                      # KEEP - Asset system
│   │   ├── audio.md                       # KEEP - Audio system
│   │   ├── errors.md                      # KEEP - Error handling
│   │   ├── screens.md                     # KEEP - Screen system
│   │   ├── state.md                       # KEEP - State management
│   │   └── tuning.md                      # KEEP - Tuning system
│   └── components/
│       ├── tuning-panel.md                # KEEP - Dev tools
│       └── easing-picker.md               # KEEP - Animation tools
```

### Guides to Keep

```
docs/guides/
├── new-game.md                # KEEP - How to create new games
├── configuration.md           # KEEP - Environment config
├── asset-pipeline.md          # KEEP - Sprite/font pipeline
├── audio-setup.md             # KEEP - Howler.js setup
├── environment-config.md      # KEEP - Multi-environment
├── uid-asset-storage.md       # KEEP - Cloud storage patterns
├── troubleshooting.md         # KEEP - Common issues
└── ai-development.md          # KEEP - AI workflow
```

### Patterns to Keep

```
docs/patterns/
└── promise-wrapped-animations.md  # KEEP - GSAP patterns
```

### AI Folder (Keep Entirely)

```
ai/
├── commands/                  # KEEP ALL - /commit, /plan, /review, etc.
└── rules/                     # KEEP ALL - Coding standards
```

---

## What to Archive (Game-Specific)

These documents are **CityLines-specific** and should be archived before starting a new game:

### Move to Archive

```
docs/game/
├── gdd.md                     # ARCHIVE → docs/archive/citylines/gdd.md
├── chapter-generation.md      # ARCHIVE
└── level-progression-report.md # ARCHIVE

docs/guides/
└── unified-manifest-design.md # ARCHIVE (CityLines level format)

src/game/docs/                 # ARCHIVE ENTIRE FOLDER
├── tuning-system.md
├── sound-effects-guide.md
├── viewport-constraints.md
└── [all other reports]
```

### Archive Structure

```
docs/archive/
├── executed-plans/            # Already exists - keep growing
└── citylines/                 # NEW - Archive for CityLines docs
    ├── gdd.md
    ├── chapter-generation.md
    ├── level-progression-report.md
    ├── unified-manifest-design.md
    └── src-game-docs/         # Copy of src/game/docs/
```

---

## Documentation Gaps

### High Priority (Needed for Next Game)

| Document | Why Needed | Effort |
|----------|------------|--------|
| **Hook API Reference** | Every game uses hooks, no reference exists | Medium |
| **Troubleshooting by Symptom** | Debugging is painful without this | Medium |
| **Game State Patterns** | How to structure Solid.js signals for games | Small |
| **Screen Transition Examples** | Copy-paste examples for common flows | Small |
| **Level Config Schema** | JSON schema for level files | Small |

### Medium Priority (Improves Quality)

| Document | Why Needed | Effort |
|----------|------------|--------|
| **Performance Optimization** | Games need 60fps, no guide exists | Large |
| **Mobile Game Guide** | Touch, viewport, battery considerations | Large |
| **Rendering Pipeline** | Pixi.js container hierarchy, z-order | Medium |
| **Animation Cookbook** | Common GSAP patterns with Solid.js | Medium |
| **Testing Strategy** | No testing docs exist | Medium |

### Low Priority (Nice to Have)

| Document | Why Needed | Effort |
|----------|------------|--------|
| **Code Style Guide** | Team consistency | Small |
| **Debugging Tools Guide** | Chrome DevTools for games | Medium |
| **Analytics Integration** | PostHog, event tracking | Small |

---

## Proposed New Documents

### 1. Hook API Reference (HIGH PRIORITY)

**Location**: `docs/scaffold/api/hooks.md`

**Content**:
```markdown
# Hook API Reference

## useAssets()
Returns: AssetCoordinator

### Methods
| Method | Params | Returns | Description |
|--------|--------|---------|-------------|
| loadBundle | name: string | Promise<void> | Load asset bundle |
| getTexture | alias: string | Texture | Get Pixi texture |
| getAudioSprite | alias: string | Howl | Get audio sprite |
| isLoaded | name: string | boolean | Check bundle status |

### Examples
[code examples for each method]

## useScreen()
[same pattern]

## useTuning<S, G>()
[same pattern]

## useAudio()
[same pattern]

## usePause()
[same pattern]
```

### 2. Troubleshooting by Symptom (HIGH PRIORITY)

**Location**: `docs/guides/troubleshooting-symptoms.md`

**Content**:
```markdown
# Troubleshooting by Symptom

## Asset Loading Issues

### "Asset not found in cache"
**Cause**: Bundle name mismatch or asset not in manifest
**Solution**: [steps]

### "Texture undefined"
**Cause**: [explanation]
**Solution**: [steps]

## Audio Issues

### "Audio channel not found"
**Cause**: [explanation]
**Solution**: [steps]

## Performance Issues

### Low FPS / Stuttering
**Cause**: [common causes]
**Solution**: [profiling steps]

### Memory keeps growing
**Cause**: [common causes]
**Solution**: [cleanup patterns]

## Screen Transition Issues
[etc.]
```

### 3. Game State Patterns (HIGH PRIORITY)

**Location**: `docs/patterns/game-state.md`

**Content**:
```markdown
# Game State Patterns

## Signal-Based State

### Basic Pattern
[code example]

### Derived State
[code example]

### Persisted State
[code example]

## Game-Specific State Structure

### Recommended Shape
```typescript
interface GameState {
  // Session state (resets each game)
  session: {
    score: number;
    level: number;
    startTime: number;
  };

  // Persistent state (survives restarts)
  progress: {
    highScore: number;
    levelsCompleted: number[];
    achievements: string[];
  };

  // UI state (ephemeral)
  ui: {
    isPaused: boolean;
    currentDialog: string | null;
  };
}
```

## Integration with Scaffold
[how to wire with tuning, screens, etc.]
```

### 4. Level Config Schema (HIGH PRIORITY)

**Location**: `docs/scaffold/schemas/level-config.md`

**Content**:
```markdown
# Level Configuration Schema

## JSON Schema
```json
{
  "$schema": "...",
  "type": "object",
  "required": ["levelId", "version", "assets"],
  "properties": {
    "levelId": { "type": "string" },
    "version": { "type": "string" },
    "assets": {
      "type": "object",
      "properties": {
        "base": { "type": "string", "description": "CDN base URL" },
        // ... all asset fields
      }
    }
  }
}
```

## Field Reference
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| levelId | string | Yes | Unique identifier |
| version | string | Yes | Semantic version |
| assets.base | string | Yes | CDN base path |
[etc.]

## Examples
[minimal example, full example]
```

### 5. Screen Transition Examples

**Location**: `docs/patterns/screen-transitions.md`

**Content**:
```markdown
# Screen Transition Examples

## Common Flows

### Loading → Start → Game → Results
[diagram + code]

### With Back Navigation
[diagram + code]

### Passing Data Between Screens
[code example]

## Custom Transitions
[how to implement custom transition effects]
```

---

## Recommended Folder Structure

### For Next Game Project

```
docs/
├── README.md                    # Game-specific entry point
│
├── scaffold/                    # REUSABLE - Copy from template
│   ├── architecture.md
│   ├── deep-dive.md
│   ├── scaffold-overview-and-migration.md
│   ├── api/                     # NEW - API references
│   │   ├── hooks.md
│   │   └── types.md
│   ├── systems/
│   │   └── [6 system docs]
│   ├── components/
│   │   └── [component docs]
│   └── schemas/                 # NEW - JSON schemas
│       └── level-config.md
│
├── game/                        # GAME-SPECIFIC - Create new
│   ├── gdd.md                   # Game design document
│   ├── mechanics.md             # Core mechanics deep dive
│   └── content-pipeline.md      # Content generation (if applicable)
│
├── guides/                      # MIX - Some reusable, some new
│   ├── new-game.md              # Reusable
│   ├── configuration.md         # Reusable
│   ├── asset-pipeline.md        # Reusable
│   ├── audio-setup.md           # Reusable
│   ├── environment-config.md    # Reusable
│   ├── troubleshooting.md       # Reusable
│   ├── troubleshooting-symptoms.md  # NEW
│   ├── performance.md           # NEW
│   └── mobile-optimization.md   # NEW (if mobile game)
│
├── patterns/                    # REUSABLE - Copy from template
│   ├── promise-wrapped-animations.md
│   ├── game-state.md            # NEW
│   └── screen-transitions.md    # NEW
│
└── archive/                     # Historical reference
    ├── executed-plans/
    └── [previous-game]/

ai/                              # REUSABLE - Copy entire folder
├── commands/
└── rules/
```

---

## Action Plan

### Phase 1: Before Starting Next Game (Do Now)

- [ ] **Archive CityLines docs** → Move game-specific docs to `docs/archive/citylines/`
- [ ] **Create Hook API Reference** → `docs/scaffold/api/hooks.md`
- [ ] **Create Level Config Schema** → `docs/scaffold/schemas/level-config.md`
- [ ] **Create Troubleshooting Symptoms** → `docs/guides/troubleshooting-symptoms.md`
- [ ] **Update docs/README.md** → Make it a template for new games

### Phase 2: Template Creation

- [ ] **Create scaffold template repo** or branch with:
  - Clean `docs/` structure (no game-specific content)
  - Empty `docs/game/` with template GDD
  - All scaffold docs
  - All ai/ commands and rules
  - Clean `src/game/` structure (no citylines/)

### Phase 3: During Next Game Development

- [ ] **Create new GDD** → `docs/game/gdd.md`
- [ ] **Document game-specific patterns** as they emerge
- [ ] **Add troubleshooting entries** as bugs are fixed
- [ ] **Archive executed plans** → `docs/archive/executed-plans/`

### Phase 4: Post-Game Retrospective

- [ ] **Review what docs were missing**
- [ ] **Update scaffold docs** with learnings
- [ ] **Archive game-specific docs**
- [ ] **Update template** for next game

---

## Quick Reference: Document Categories

| Category | Location | Lifecycle |
|----------|----------|-----------|
| **Scaffold Core** | `docs/scaffold/` | Permanent, evolves slowly |
| **API Reference** | `docs/scaffold/api/` | Permanent, update with code |
| **Schemas** | `docs/scaffold/schemas/` | Permanent, version with format |
| **Guides** | `docs/guides/` | Permanent, grow over time |
| **Patterns** | `docs/patterns/` | Permanent, add as discovered |
| **Game Design** | `docs/game/` | Per-game, archive after |
| **Archive** | `docs/archive/` | Permanent, read-only |
| **AI Workflow** | `ai/` | Permanent, evolves slowly |

---

## Summary

**Keep for every game:**
- Scaffold architecture docs (3 files)
- System documentation (6 files)
- Component docs (2 files)
- Guides (8 files)
- Patterns (1+ files)
- AI commands and rules (entire ai/ folder)

**Create before next game:**
- Hook API reference
- Level config schema
- Troubleshooting by symptom
- Game state patterns doc

**Archive when switching games:**
- Game Design Document
- Game-specific reports
- Content pipeline docs
- Executed implementation plans

**New structure benefits:**
- Clear separation of reusable vs game-specific
- API references reduce onboarding time
- Troubleshooting guide speeds up debugging
- Patterns doc prevents reinventing solutions
