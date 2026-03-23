# Game-Builder Submodule: Symlink Fragility

**Date:** 2026-03-20
**Related ticket:** [ENG-1634](https://linear.app/wolfgames/issue/ENG-1634/amino-game-kit-create-new-game)
**Status:** In progress — needs review before committing

## Context

We added `wolfgames/game-builder` as a git submodule at `tools/game-builder/` (matching template-lightning's pattern). The 16 shared skills and 4 design sub-skills were replaced with symlinks from `aidd-custom/skills/<name>` → `../../tools/game-builder/game-builder/skills/<name>`.

## The Concern

`.claude/skills` → `../aidd-custom/skills` → `<skill-symlink>` → `../../tools/game-builder/...`

This nested symlink chain works on macOS because the OS resolves relative symlinks from the symlink's physical location. However:

- **Windows** — symlinks require elevated permissions or developer mode; git may check them out as plain text files containing the target path
- **Git clone behavior** — `core.symlinks=false` (common on Windows) breaks this entirely
- **CI/CD** — some runners or Docker images may not preserve symlinks
- **Claude Code / AIDD** — skill discovery may or may not follow symlinks depending on implementation; currently works but untested across updates

## Current State

The changes are staged but **not committed**. The submodule is added and symlinks resolve locally.

### What's symlinked (shared, from game-builder)

attract-mode, code-standards, ftue, game-design-system, game-lifecycle, juice, level-generation, macro-loop, meso-loop, micro-loop, music-generation, polish, scaffold-profiles, sound-design, sound-design-elevenlabs, visual-design, design/01-04

### What's real (amino-specific)

build-game, new-game-legacy, new-module, posthog, design/SKILL.md, design/index.md

## Alternatives to Consider

### A. Post-clone copy script (no symlinks)

Keep the submodule as source of truth, but use a `postinstall` or setup script to copy skills into `aidd-custom/skills/`:

```bash
# package.json script or Makefile
cp -r tools/game-builder/game-builder/skills/* aidd-custom/skills/
```

Add the copied skills to `.gitignore`. Downside: stale copies if you forget to re-run after submodule update.

### B. Symlink at a higher level

Instead of 20 individual symlinks, symlink the entire `aidd-custom/` directory (like lightning does):

```
aidd-custom/ → tools/game-builder/
```

Move amino-specific skills into the game-builder repo, or into a separate `amino-skills/` directory with its own `.claude/skills` entry. Downside: game-builder repo becomes amino-aware, or we need a second skills directory.

### C. Keep vendored, sync with script

Don't use symlinks at all. Keep skills vendored in `aidd-custom/skills/`. Add a sync script that pulls latest from game-builder and overwrites. Similar to how the alignment plan (2026-03-18) was already doing manual syncs.

## Decision Needed

Which approach best balances:
1. Single source of truth (game-builder repo)
2. Cross-platform reliability
3. Simplicity for devs cloning the repo
