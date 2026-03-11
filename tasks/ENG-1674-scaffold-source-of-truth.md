# [Source Management]: Scaffold Source of Truth & Documentation Epic

**Status**: ✅ COMPLETED (2026-03-11)
**Linear**: ENG-1674
**Goal**: Write an architecture decision record documenting where scaffold lives, how games reference it, and how the core/game boundary is enforced

## Overview

Games forking scaffold-production have no mechanism for pulling scaffold updates, and boundary enforcement is convention-only via `.claude/settings*.json`. This ADR will make decisions on distribution model, versioning, and enforcement so downstream tickets (ENG-1684 implementation, ENG-1726 automation) can proceed without ambiguity.

---

## Research Current State

Audit the repo to confirm how scaffold is consumed today: barrel exports, settings enforcement, per-game fork points, and any existing versioning artifacts. Capture facts for the ADR's "Current State" section.

**Requirements**:

- Given the existing codebase, should document the exact list of per-game fork points from `docs/core/entry-points.md`
- Given `.claude/settings*.json` files, should document how the core/ boundary is currently enforced (soft, AI-agent only, no CI)
- Given `src/core/index.ts`, should document the public API surface area and barrel export pattern
- Given `SCAFFOLD_MANIFEST.yml`, should document any existing versioning or manifest metadata

---

## Evaluate Distribution Models

Compare the candidate distribution approaches (git subtree, git submodule, npm/bun package, template repo + migration scripts, monorepo) against the project's constraints: AIDD workflow, small team, Vite build, no existing CI.

**Requirements**:

- Given each candidate model, should document pros, cons, and effort to adopt
- Given the AIDD/Claude Code workflow (Daniel's comment about syncing with AIDD), should assess how each model interacts with AI-assisted development
- Given the current "fork and diverge" pattern, should assess how each model handles pulling upstream scaffold updates into a game repo

---

## Decide Versioning Granularity

Decide whether core/ and modules/ version together or separately, and whether games pin scaffold versions or track latest.

**Requirements**:

- Given the 3-tier architecture (core → modules → game), should recommend whether core and modules share a version or are independently versioned
- Given game repos that fork scaffold, should recommend whether games pin to a specific scaffold version or track latest

---

## Decide Boundary Enforcement

Decide whether the core/game boundary is enforced via packaging (hard) or conventions/linting (soft), considering the existing `.claude/settings*.json` approach.

**Requirements**:

- Given the current soft enforcement via `.claude/settings*.json`, should assess whether this is sufficient or needs hardening
- Given the distribution model chosen above, should recommend an enforcement mechanism that works with that model

---

## Write the Architecture Decision Record

Author the ADR as a doc in `docs/core/` capturing all decisions with rationale, linking to downstream tickets.

**Requirements**:

- Given all decisions from prior tasks, should produce a single ADR document at `docs/core/scaffold-source-of-truth-adr.md`
- Given the ADR format, should include sections: Context, Decision, Consequences, and links to ENG-1684 and ENG-1726
- Given the comment about AIDD sync, should note any open questions or dependencies on AIDD team alignment
