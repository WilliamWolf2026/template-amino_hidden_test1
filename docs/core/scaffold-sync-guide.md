# Scaffold Sync Guide

How to pull scaffold updates into a game repo.

## One-Time Setup

Add the scaffold repo as a git remote:

```bash
git remote add scaffold git@github.com:wolfgames/scaffold-production.git
```

## Routine Updates (Selective Checkout)

For regular scaffold improvements — bugfixes, new modules, system tweaks — use the sync script:

```bash
bun run scaffold:sync
```

This fetches the latest scaffold and overwrites `src/core/`, `src/modules/`, and root config files. Game-owned files (`src/game/`, `src/app.tsx`, `index.html`) are never touched.

**What it does:**

1. Fetches `scaffold/main`
2. Overwrites scaffold-owned paths: `src/core/`, `src/modules/`, `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, `biome.json`, `.gitattributes`
3. Updates `scaffold.syncedAt` and `scaffold.syncedFrom` in `package.json`
4. Creates a commit with the sync

**Requirements:**

- Working tree must be clean (no uncommitted changes)
- The `scaffold` remote must be accessible

## Major Version Updates (Full Merge)

When scaffold releases a breaking change (new provider in `app.tsx`, changed game contract, updated deps), use a full merge:

```bash
git fetch scaffold
git merge scaffold/main
```

Expected conflicts and how to resolve:

| File | Resolution |
|------|-----------|
| `src/app.tsx` | Manual — review scaffold's new providers, merge into game's wiring |
| `package.json` | Manual — accept scaffold's new deps, keep game's deps and scaffold metadata |
| `index.html` | Accept scaffold side unless game changed the `<head>` |
| `src/game/**` | Always keep game side (auto-resolved by `.gitattributes`) |
| `src/core/`, `src/modules/` | Auto-merges cleanly (game side has no changes) |

## Checking Your Scaffold Version

```bash
node -e "console.log(require('./package.json').scaffold)"
```

Output:

```json
{
  "version": "1.0.0",
  "syncedAt": "2026-03-12",
  "syncedFrom": "e7b7270abc..."
}
```

To see how far behind you are:

```bash
git fetch scaffold
git log $(node -e "console.log(require('./package.json').scaffold.syncedFrom)")..scaffold/main --oneline
```

## Releasing a New Scaffold Version

Run from the scaffold repo (not a game repo):

```bash
bun run scaffold:release patch   # 1.0.0 → 1.0.1
bun run scaffold:release minor   # 1.0.0 → 1.1.0
bun run scaffold:release major   # 1.0.0 → 2.0.0
```

This updates `scaffold.version` in `package.json`, creates a git tag (`scaffold-vX.Y.Z`), and prints push instructions. Major bumps also print a warning for downstream games.

## Troubleshooting

**"Working tree has uncommitted changes"** — Commit or stash your changes before syncing.

**Merge conflicts in `src/game/`** — The `.gitattributes` file auto-resolves these in favor of the game side. If you see conflicts here, verify `.gitattributes` is present.

**Sync script can't find scaffold remote** — The script adds it automatically on first run. If it fails, add it manually (see One-Time Setup above).
