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

## Post-Sync Verification

After syncing, run the verification script to confirm nothing broke:

```bash
bun run scaffold:verify
```

This runs typecheck, lint, and build sequentially. If any step fails, it stops and reports the error. Fix the issue, then re-run.

## Rollback a Failed Sync

If a sync introduced problems, revert it:

```bash
bun run scaffold:rollback
```

This reverts the sync commit (which is always the latest commit after a sync). It will refuse to act if the latest commit is not a scaffold sync commit.

After rolling back, investigate the issue and coordinate with the scaffold team before re-syncing.

## Drift Detection

Check if your game has locally modified any scaffold-owned paths:

```bash
bun run scaffold:drift
```

This compares `src/core/`, `src/modules/`, and root configs against `scaffold/main`. If drift is found, it lists the modified files. Clean drift before syncing to avoid unexpected behavior.

## Staying Up to Date

The scaffold repo publishes [GitHub Releases](https://github.com/wolfgames/scaffold-production/releases) for each version. To get notified:

- **Watch the repo** — GitHub sends email notifications for new releases
- **Add the update-check workflow** — Copy `docs/core/scaffold-update-check.yml` into your game repo at `.github/workflows/scaffold-update-check.yml`. It runs weekly and opens an issue when a new scaffold version is available.

## Releasing a New Scaffold Version

Run from the scaffold repo (not a game repo):

```bash
bun run scaffold:release patch   # 1.0.0 → 1.0.1
bun run scaffold:release minor   # 1.0.0 → 1.1.0
bun run scaffold:release major   # 1.0.0 → 2.0.0
```

This updates `scaffold.version` in `package.json`, generates a `CHANGELOG.md` entry, creates a git tag (`scaffold-vX.Y.Z`), and prints push instructions. When the tag is pushed, a GitHub Release is created automatically. Major bumps also print a warning for downstream games.

## Troubleshooting

**"Working tree has uncommitted changes"** — Commit or stash your changes before syncing.

**Merge conflicts in `src/game/`** — The `.gitattributes` file auto-resolves these in favor of the game side. If you see conflicts here, verify `.gitattributes` is present.

**Sync script can't find scaffold remote** — The script adds it automatically on first run. If it fails, add it manually (see One-Time Setup above).
