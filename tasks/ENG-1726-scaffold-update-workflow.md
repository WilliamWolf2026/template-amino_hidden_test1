# Scaffold Update Workflow & Automation Epic

**Status**: ✅ COMPLETED (2026-03-13)
**Linear**: ENG-1726
**Goal**: Safe, automated, and validated workflow for propagating scaffold updates to games

## Overview

ENG-1684 delivered the distribution mechanism (sync script, release script, merge strategies, import boundaries), but game teams have no safety net: no CI gates, no rollback, no post-sync verification, no automatic notification of new releases, and no way to detect local drift in scaffold-owned paths. This epic closes those gaps so that scaffold updates flow safely and automatically to downstream games.

---

## Add Scaffold CI Workflow

GitHub Actions workflow that runs on PRs to the scaffold repo, gating merges on passing tests.

**Requirements**:

- Given a PR to `main`, should run typecheck, Biome lint, and the full test suite before merge is allowed
- Given the workflow file at `.github/workflows/scaffold-ci.yml`, should use Bun for all steps to match the local dev toolchain

---

## Create Post-Sync Verification Script

A script game repos run after `scaffold:sync` to verify the sync didn't break anything.

**Requirements**:

- Given a game repo after syncing, should run typecheck, lint, and build sequentially and report pass/fail for each
- Given the `scaffold:verify` npm script, should exit non-zero on first failure with a clear error message
- Given the sync script, should print a reminder to run `scaffold:verify` after a successful sync

---

## Add Rollback Command

A convenience command to revert a failed scaffold sync.

**Requirements**:

- Given a game repo where `scaffold:sync` was just run, should revert the sync commit (which is always the latest commit) and restore the previous state
- Given the rollback script, should refuse to act if the latest commit is not a scaffold sync commit (verified by commit message pattern)

---

## Create Scaffold Release Workflow and Game Update Template

GitHub Actions workflow that creates a GitHub Release on tag push, plus a template workflow game repos can adopt to check for updates.

**Requirements**:

- Given a `scaffold-v*` tag push, should create a GitHub Release with auto-generated release notes from git history
- Given a major version release, should include a breaking-change warning in the release notes
- Given a game repo with the template workflow, should check for new scaffold releases weekly and open an issue if an update is available

---

## Add Drift Detection Script

A script to detect if a game repo has locally modified scaffold-owned paths.

**Requirements**:

- Given a game repo with the scaffold remote, should compare each scaffold-owned path against `scaffold/main` and report any local modifications
- Given no drift, should print a clean summary and exit zero; given drift, should list the modified files and exit non-zero

---

## Enhance Release Script with Changelog

Extend the existing release script to auto-generate a changelog entry from git history.

**Requirements**:

- Given a scaffold release, should generate a changelog section from commits between the previous tag and HEAD
- Given the changelog output, should be appended to `CHANGELOG.md` (created if absent) with the version number and date as heading

---

## Update Migration and Sync Documentation

Update existing docs to cover the new tooling (verification, rollback, drift detection, CI) and fix stale paths.

**Requirements**:

- Given the sync guide (`docs/core/scaffold-sync-guide.md`), should add sections for post-sync verification, rollback, and drift detection
- Given the migration doc (`docs/core/scaffold-overview-and-migration.md`), should include the full set of `scaffold:*` commands and the recommended adoption workflow

---

## Validate End-to-End on a Real Game

Run the complete workflow against an existing game repo to prove it works.

**Requirements**:

- Given the scaffold repo with a new tagged release, should successfully sync to a game repo, pass verification, and show correct version metadata
- Given the e2e validation, should be captured as a reproducible script or documented test procedure in `docs/core/scaffold-e2e-validation.md`
