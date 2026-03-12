# Scaffold Version Control Modules Epic

**Status**: ✅ COMPLETED (2026-03-12)
**Linear**: ENG-1684
**Goal**: Implement scaffold distribution model, versioning, and boundary enforcement per ADR

## Overview

Games forked from scaffold have no way to pull updates, track versions, or enforce the core/game boundary at lint time. This epic implements the decisions from the ENG-1674 ADR: a hybrid git sync workflow for distributing scaffold updates, a single semver tracked in package.json, and Biome lint rules to catch wrong-direction imports.

---

## Add Scaffold Version Metadata

Add the `scaffold.version` field to `package.json` to establish the version tracking foundation.

**Requirements**:

- Given a scaffold repo, should have a `scaffold` object in `package.json` with `version: "1.0.0"`
- Given a game repo after syncing, should also track `syncedAt` and `syncedFrom` fields in its own `scaffold` object

---

## Create .gitattributes for Merge Strategies

Create `.gitattributes` so that full merges automatically resolve `src/game/` conflicts in favor of the game side.

**Requirements**:

- Given a full scaffold merge into a game repo, should auto-resolve `src/game/**` conflicts using `merge=ours`
- Given scaffold-owned paths (`src/core/`, `src/modules/`), should use default merge behavior (no override needed since games don't edit these)

---

## Add Biome Import Boundary Rules

Configure Biome lint rules to enforce the tier dependency direction at lint time.

**Requirements**:

- Given code in `src/core/`, should fail lint if it imports from `~/modules/` or `~/game/`
- Given code in `src/modules/`, should fail lint if it imports from `~/game/`
- Given code in `src/game/`, should pass lint when importing from `~/core/` or `~/modules/`

---

## Test Biome Import Boundary Rules

Verify boundary lint rules catch wrong-direction imports and allow valid ones.

**Requirements**:

- Given a test fixture with `src/core/` importing from `~/game/`, should fail `biome check`
- Given a test fixture with `src/modules/` importing from `~/game/`, should fail `biome check`
- Given a test fixture with `src/game/` importing from `~/core/`, should pass `biome check`

---

## Create Scaffold Sync Script

Build a shell script implementing the selective checkout workflow for routine scaffold updates.

**Requirements**:

- Given a game repo without the `scaffold` remote, should add it automatically
- Given the `scaffold:sync` npm script is run, should fetch scaffold and selectively checkout `src/core/`, `src/modules/`, and root configs
- Given a successful sync, should update the `scaffold.syncedAt` and `scaffold.syncedFrom` fields in `package.json`
- Given the sync script, should skip `src/game/`, `src/app.tsx`, and `index.html` (game-owned files)

---

## Test Scaffold Sync Script

Integration tests verifying the sync script works correctly in a temporary git repo.

**Requirements**:

- Given a game repo without a `scaffold` remote, should add the remote and complete the sync
- Given a successful sync, should have updated `scaffold.syncedAt` and `scaffold.syncedFrom` in `package.json`
- Given a sync, should not modify any files under `src/game/`

---

## Create Scaffold Release Script

Build tooling for tagging and releasing new scaffold versions.

**Requirements**:

- Given a `scaffold:release` command with a semver bump type (major/minor/patch), should update `scaffold.version` in `package.json` and create a git tag
- Given a major version bump, should output a reminder that downstream games need a full merge (not selective checkout)

---

## Test Scaffold Release Script

Verify the release script bumps versions correctly and creates git tags.

**Requirements**:

- Given a `patch` bump from `1.0.0`, should update `scaffold.version` to `1.0.1` and create tag `scaffold-v1.0.1`
- Given a `major` bump, should output a warning about downstream games needing a full merge

---

## Document Sync Workflow

Write the sync guide so game developers know how to pull scaffold updates.

**Requirements**:

- Given a developer reading `docs/core/scaffold-sync-guide.md`, should understand both the routine (selective checkout) and major version (full merge) sync workflows
- Given a game that has never synced, should include one-time setup instructions (adding the scaffold remote)
