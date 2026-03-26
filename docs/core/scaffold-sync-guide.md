# Amino Sync Guide

How to pull amino template updates into a game repo.

## One-Time Setup

Add the amino repo as a git remote:

```bash
git remote add amino git@github.com:wolfgames/template-amino.git
```

## Routine Updates (Selective Checkout)

For regular amino improvements — bugfixes, new modules, system tweaks — use the sync script:

```bash
bun run amino:sync
```

This fetches the latest amino template and overwrites `src/core/`, `src/modules/`, and root config files. Game-owned files (`src/game/`, `src/app.tsx`, `index.html`) are never touched.

**What it does:**

1. Fetches `amino/main`
2. Overwrites amino-owned paths: `src/core/`, `src/modules/`, `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`, `biome.json`, `.gitattributes`
3. Updates `amino.syncedAt` and `amino.syncedFrom` in `package.json`
4. Creates a commit with the sync

**Requirements:**

- Working tree must be clean (no uncommitted changes)
- The `amino` remote must be accessible

## Major Version Updates (Full Merge)

When amino releases a breaking change (new provider in `app.tsx`, changed game contract, updated deps), use a full merge:

```bash
git fetch amino
git merge amino/main
```

Expected conflicts and how to resolve:

| File | Resolution |
|------|-----------|
| `src/app.tsx` | Manual — review amino's new providers, merge into game's wiring |
| `package.json` | Manual — accept amino's new deps, keep game's deps and amino metadata |
| `index.html` | Accept amino side unless game changed the `<head>` |
| `src/game/**` | Always keep game side (auto-resolved by `.gitattributes`) |
| `src/core/`, `src/modules/` | Auto-merges cleanly (game side has no changes) |

## Checking Your Amino Version

```bash
node -e "console.log(require('./package.json').amino)"
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
git fetch amino
git log $(node -e "console.log(require('./package.json').amino.syncedFrom)")..amino/main --oneline
```

## Post-Sync Verification

After syncing, run the verification script to confirm nothing broke:

```bash
bun run amino:verify
```

This runs typecheck, lint, and build sequentially. If any step fails, it stops and reports the error. Fix the issue, then re-run.

## Rollback a Failed Sync

If a sync introduced problems, revert it:

```bash
bun run amino:rollback
```

This reverts the sync commit (which is always the latest commit after a sync). It will refuse to act if the latest commit is not an amino sync commit.

After rolling back, investigate the issue and coordinate with the amino team before re-syncing.

## Drift Detection

Check if your game has locally modified any amino-owned paths:

```bash
bun run amino:drift
```

This compares `src/core/`, `src/modules/`, and root configs against `amino/main`. If drift is found, it lists the modified files. Clean drift before syncing to avoid unexpected behavior.

## Releasing a New Amino Version

Run from the amino repo (not a game repo):

```bash
bun run amino:release patch   # 1.0.0 → 1.0.1
bun run amino:release minor   # 1.0.0 → 1.1.0
bun run amino:release major   # 1.0.0 → 2.0.0
```

This updates `amino.version` in `package.json`, generates a `CHANGELOG.md` entry, creates a git tag (`amino-vX.Y.Z`), and prints push instructions. When the tag is pushed, a GitHub Release is created automatically. Major bumps also print a warning for downstream games.

## Troubleshooting

**"Working tree has uncommitted changes"** — Commit or stash your changes before syncing.

**Merge conflicts in `src/game/`** — The `.gitattributes` file auto-resolves these in favor of the game side. If you see conflicts here, verify `.gitattributes` is present.

**Sync script can't find amino remote** — The script adds it automatically on first run. If it fails, add it manually (see One-Time Setup above).
