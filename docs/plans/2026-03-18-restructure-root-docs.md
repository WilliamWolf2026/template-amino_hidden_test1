# Restructure Root Documentation (CLAUDE.md, AGENTS.md, README.md)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean up the root documentation so each file has one clear purpose: CLAUDE.md is a 2-line pointer, AGENTS.md is agent instructions (without bloated GameKit API dumps), and README.md is the human-readable project overview.

**Architecture:** Three files, three audiences. CLAUDE.md → agent entry (points to AGENTS.md). AGENTS.md → agent operating manual (discovery, permissions, rules, skill awareness). README.md → human onboarding (how to run, structure, tech stack, quick links). GameKit API reference moves to `docs/core/gamekit-api.md`.

**Tech Stack:** Markdown only — no code changes.

---

## Current State

| File | Lines | Problem |
|------|-------|---------|
| `CLAUDE.md` | 136 | Contains architecture, structure, permissions, commands, tech stack — too much. Should just point to AGENTS.md |
| `CLAUDE.lite.md` | 96 | Stale duplicate of CLAUDE.md with old paths (`src/scaffold/`, `citylines/`). Dead file |
| `AGENTS.md` | 273 | 55 lines of agent guidelines + 218 lines of GameKit API dump (lines 56-273). GameKit reference bloats agent context |
| `README.md` | 83 | Good but missing the useful content from CLAUDE.md (permissions, factory commands, where to put code) |

## Target State

| File | Purpose | Audience |
|------|---------|----------|
| `CLAUDE.md` | 2-line pointer: "Read AGENTS.md" | Claude Code auto-loader |
| `AGENTS.md` | Agent operating manual: discovery, permissions, coding standards, skill awareness, progressive discovery | AI agents |
| `README.md` | Human onboarding: quick start, architecture, structure, tech stack, permissions, factory commands, links | Engineers |
| `docs/core/gamekit-api.md` | GameKit API reference (extracted from AGENTS.md) | Agents on-demand |

---

### Task 1: Extract GameKit API to docs/core/gamekit-api.md

**Files:**
- Create: `docs/core/gamekit-api.md`
- Modify: `AGENTS.md`

**Step 1: Create GameKit API reference file**

Extract AGENTS.md lines 55-273 (the `<!-- BEGIN: Wolfgames Game KIT -->` to `<!-- END: Wolfgames Game KIT -->` block) into `docs/core/gamekit-api.md`. Keep the content as-is.

**Step 2: Replace GameKit block in AGENTS.md with a pointer**

Replace the entire GameKit block in AGENTS.md with:

```markdown
## GameKit API

This project uses the `@wolfgames/game-kit` library for analytics, auth, assets, and error tracking.

Full API reference: [`docs/core/gamekit-api.md`](docs/core/gamekit-api.md)
```

**Step 3: Commit**

```bash
git add docs/core/gamekit-api.md AGENTS.md
git commit -m "refactor: extract GameKit API reference from AGENTS.md to docs/core/gamekit-api.md"
```

---

### Task 2: Rewrite AGENTS.md as the agent operating manual

**Files:**
- Modify: `AGENTS.md`

**Step 1: Rewrite AGENTS.md**

Final AGENTS.md structure (after Task 1 already removed GameKit dump):

```markdown
# AI Agent Guidelines

## Progressive Discovery

Read `ai/index.md` to discover available commands, rules, and skills. Only drill into subfolders when the task needs that domain.

Each folder in `ai/` contains an `index.md`. Project-specific skills live in `aidd-custom/` — read `aidd-custom/index.md` and `aidd-custom/config.yml` before starting work.

## Amino Architecture

    src/
      core/     ← framework shell — DO NOT EDIT
      modules/  ← reusable building blocks
      game/     ← game code — EDITABLE

Dependency rules:
- core/ → no deps on modules/ or game/
- modules/ → can import from core/
- game/ → can import from core/ + modules/
- app.tsx → can import from all three

Tier indexes for intent → path routing:
- `src/core/INDEX.md` — what the framework provides
- `src/modules/INDEX.md` — what modules exist + placement rules
- `src/game/INDEX.md` — game contents + where to put new files

Doc index: `docs/INDEX.md` — flat routing table for all docs & factory commands.

## Where to Put New Code

| What you're building | Where it goes |
|---------------------|---------------|
| Single-purpose reusable component | `src/modules/primitives/<name>/` |
| Pure logic, no rendering | `src/modules/logic/<name>/` |
| Assembled from multiple primitives | `src/modules/prefabs/<name>/` |
| Game screen | `src/game/screens/` |
| Game mechanic / controller | `src/game/<game-name>/` |
| Game state signals | `src/game/state.ts` |
| Game tuning values | `src/game/tuning/` |
| Module configuration for a game | `src/game/setup/` |
| Framework system / provider | `src/core/systems/` (admin only) |

## Coding Standards

Before making changes, consult:
- `ai/rules/` — coding standards, review guidelines, JS/TS patterns, UI rules
- `docs/INDEX.md` — find any doc by intent

## File Permissions (Dev Mode)

| Folder | Read | Edit |
|--------|:----:|:----:|
| `src/game/` | Yes | Yes |
| `src/modules/` | Yes | Yes |
| `src/core/` | Yes | **No** |
| `docs/` | Yes | Yes |
| `public/` | Yes | Yes |
| `ai/` | Yes | **No** |

Switch modes: See `.claude/README.md`

## Factory Commands

See `docs/factory/index.md` for full list. Key commands:

| Command | Purpose |
|---------|---------|
| `/research` | Investigate without code changes |
| `/audit` | Systematic codebase review |
| `/debug` | Find bug root cause |
| `/review` | Code quality review |
| `/commit` | Git commit |
| `/deploy` | Deploy to QA/staging/production |
| `/newgame` | Setup checklist for forking to a new game |
| `/newmodule` | Create a new module in modules/ |

## Vision Document

Before creating or running any task, read `vision.md`. If a task conflicts with the vision, stop and ask the user to clarify.

## GameKit API

This project uses `@wolfgames/game-kit` for analytics, auth, assets, and error tracking.

Full API reference: `docs/core/gamekit-api.md`
```

**Step 2: Commit**

```bash
git add AGENTS.md
git commit -m "refactor: rewrite AGENTS.md as concise agent operating manual"
```

---

### Task 3: Slim CLAUDE.md to a pointer

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Replace CLAUDE.md contents**

```markdown
Immediately read `AGENTS.md` for full agent guidelines, progressive discovery rules, and workflow context.
```

That's it. One line. Claude Code auto-loads this, then reads AGENTS.md for everything.

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "refactor: slim CLAUDE.md to single-line AGENTS.md pointer"
```

---

### Task 4: Enrich README.md with human-facing content

**Files:**
- Modify: `README.md`

**Step 1: Update README.md**

Keep the existing good content (Quick Start, Architecture, Features, Tech Stack, Quick Links) and add the useful sections from the old CLAUDE.md that humans need: factory commands, permissions, where to put code, common tasks.

Target structure:
1. Title + one-liner
2. Quick Start (existing)
3. Architecture diagram (existing)
4. Dependency Rules (existing)
5. Where to Put New Code (from old CLAUDE.md)
6. Features (existing)
7. Factory Commands (from old CLAUDE.md — useful for humans too)
8. File Permissions + Mode Switching (from old CLAUDE.md)
9. Tech Stack (existing)
10. Common Tasks / bun commands (from old CLAUDE.md)
11. Documentation quick links (existing)

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: enrich README with structure guide, commands, and permissions"
```

---

### Task 5: Delete CLAUDE.lite.md

**Files:**
- Delete: `CLAUDE.lite.md`

**Step 1: Delete the file**

```bash
git rm CLAUDE.lite.md
```

**Step 2: Commit**

```bash
git commit -m "chore: remove stale CLAUDE.lite.md"
```

---

### Task 6: Verify

**Step 1: Check no broken references**

```bash
grep -r "CLAUDE.lite" . --include="*.md" | grep -v node_modules
grep -r "CLAUDE.md" . --include="*.md" | grep -v node_modules | head -20
```

Expect: zero hits for CLAUDE.lite, CLAUDE.md references should only appear in AGENTS.md or self-referential.

**Step 2: Check AGENTS.md is under 80 lines**

```bash
wc -l AGENTS.md
```

Expect: ~70 lines (down from 273).

**Step 3: Check GameKit API file exists**

```bash
test -f docs/core/gamekit-api.md && echo "OK" || echo "MISSING"
```
