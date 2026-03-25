# aidd-custom

This directory contains project configuration and custom skills for AI-assisted game development.

Shared game-builder skills are sourced from the `tools/game-builder` git submodule and symlinked into `skills/`. Amino-specific skills (build-game, new-game-legacy, new-module) live here as real directories.

## Files

- [`config.yml`](./config.yml) — Project configuration
- [`index.md`](./index.md) — This file

### 📁 posthog/

See [`posthog/index.md`](./posthog/index.md) for contents.

### 📁 skills/

All Claude Code skills live here. See [`skills/index.md`](./skills/index.md) for the full list.

> `.claude/skills` is a symlink to this directory.
