# Architecture Design Doc vs. Linear Tickets — Alignment Report

The Scaffold Architecture Design document (Notion) formalizes decisions that were open questions in many of our 29 Production Scaffold Foundation tickets (ENG-1668–ENG-1696). This report identifies what's now decided, what tickets need updating, what's new, and the impact of the scaffold-to-template rename.

Previous report: [nucleo-ticket-alignment.md](nucleo-ticket-alignment.md) (Nucleo Build Plan alignment)

---

## New Decisions from Architecture Design Doc

| Decision | Section | Impact on tickets |
|----------|---------|-------------------|
| **Packaging: core + modules ship as `@wolfgames/game-kit` and `@wolfgames/components`** | 2.1 | Resolves Tickets 7, 17. Changes Ticket 4 (registry feeds into package). New: package build/publish pipeline. |
| **Cross-tier contracts formalized** (7 required game exports for app.tsx) | 3 | Ticket 5 (Game Schema) now has its exact target. Ticket 12 (Guardrails) can validate against these contracts. |
| **Wiring layer = app.tsx only** | 4 | Ticket 12 (Guardrails): add rule — only app.tsx imports from all three tiers. |
| **Provider init order documented** | 4.1 | Ticket 12: provider stack is now a hard constraint, not just convention. |
| **Version control: semver + CLI tools** (scaffold:release, drift, sync, verify, rollback) | 7 | Tickets 7 + 17 are **designed**. Remaining work is implementation of the CLI tools. |
| **Pull-based notifications** (GitHub workflow opens issue when repo falls behind) | 7 | Ticket 7/17: no push mechanism needed. Template for `.github/workflows/scaffold-update-check.yml`. |
| **Known debt: ScreenId hardcodes 4 screens** | 5 | Ticket 5 (Game Schema): schema must produce exactly `loading | start | game | results`. Flag for future loosening. |
| **Rename: scaffold → template** | Throughout | Naming change across all tickets, docs, CLI commands, package names. |
| **Anti-patterns codified per tier** | 6 | Ticket 12 (Guardrails): ready-made forbidden pattern list for the reviewer agent. |
| **Extension rules with decision tree** | 5 | Ticket 6 (Standardized templates), Ticket 27 (/newmodule): decision tree is defined. |

---

## Ticket-by-Ticket Impact

### CLOSED / DESIGNED (decision made, shift to implementation)

**Tickets 7 + 17 — Source management + Version control (ENG-1674 + ENG-1684)**

These were open-ended "evaluate and decide" tickets. The Architecture Design doc answers every question they posed:

| Original question | Answer from doc |
|-------------------|-----------------|
| Distribution model? | Versioned packages (`@wolfgames/game-kit`, `@wolfgames/components`) + template repos with minimal code |
| Scaffold + modules version together or separately? | Together under semver in `package.json` |
| Games pin versions or track latest? | `syncedFrom` SHA tracks which scaffold commit a game is synced to |
| Hard boundary or soft convention? | Packages = hard boundary. Template repos consume packages, not raw source. |
| How do updates propagate? | `scaffold:sync` merges latest. `scaffold:drift` detects local edits first. `scaffold:verify` validates. `scaffold:rollback` reverts. |
| Notification strategy? | Pull-based: `.github/workflows/scaffold-update-check.yml` opens an issue when behind |

**Recommendation:** Merge into one ticket focused on **implementing** the version control system: semver bumping, CLI tools (release/drift/sync/verify/rollback), GitHub workflow template, package.json metadata schema. Remove the evaluation/decision scope — those decisions are made.

---

### UPDATE (scope, contracts, or naming changed)

**Ticket 3 — Finalize layered architecture (ENG-1670)**
- **Status shift:** Largely done by this doc. The three tiers, dependency rules, qualification criteria, and extension rules are all defined.
- **Remaining work:** Machine-readable format of dependency rules, build-time enforcement (ESLint import rules), update stale docs.
- **Add:** Document the ScreenId debt (hardcoded 4 screens) as a known limitation.
- **Rename:** References to "scaffold" in scope items should say "template."

**Ticket 4 — Create Component Registry (ENG-1671)**
- **New context:** Registry feeds directly into `@wolfgames/components` package (Section 2.1). Not just a doc — it's the package manifest.
- **Update scope:** Registry format must be compatible with package distribution. Each module's metadata becomes its package export surface.
- **Add:** Map registry entries to the cross-tier contract (Section 3) — which modules satisfy which parts of the game contract.

**Ticket 5 — Define Game Schema v0 (ENG-1672)**
- **Major input:** Section 3 defines the exact contract a game must satisfy. Schema v0 maps directly to these 7 required exports:
  1. `gameConfig.screens` — screen ID → Solid component
  2. `gameConfig.initialScreen` — first screen
  3. `manifest` — asset bundle definitions
  4. `defaultGameData` — initial game state
  5. `GAME_DEFAULTS` — tuning schema extending GameTuningBase
  6. `AnalyticsProvider` — PostHog wrapper
  7. `FeatureFlagProvider`
- **Constraint:** ScreenId is hardcoded to `loading | start | game | results`. Schema must produce exactly these four.
- **Update acceptance:** "Given a spec, the generator produces valid exports for all 7 contract fields."

**Ticket 6 — Standardized templates (ENG-1673)**
- **New input:** Section 5 provides the decision tree for module placement (visual → primitive/prefab, pure logic → logic). The component taxonomy (Section 5) distinguishes Solid.js component vs. Pixi container vs. logic factory.
- **Update scope:** Templates should encode the decision tree. The `/newmodule` flow (Ticket 27) uses this tree.

**Ticket 8 — Asset loading Q1 baseline (ENG-1675)**
- **Minor update:** The doc confirms `useAssets()` as the core hook (Section 3). Manifest is one of the 7 required game exports. GCS hosting (from Nucleo plan) still applies.

**Ticket 9 — Prompt-to-Play UI v0 (ENG-1676)**
- **No change from Nucleo report.** Architecture Design doc doesn't cover UI.

**Ticket 10 — Orchestrator skeleton (ENG-1677)**
- **No change from Nucleo report.** Still splits into API + Worker + Store per Nucleo plan.

**Ticket 11 — Minimal agent set integration (ENG-1678)**
- **New context:** The generator must produce code satisfying all 7 cross-tier contracts (Section 3). The anti-patterns (Section 6) become the reviewer agent's checklist. The extension rules (Section 5) guide where the generator places code.
- **Update scope:** Agent must validate output against cross-tier contracts. Reviewer checks anti-patterns per tier.

**Ticket 12 — Guardrails / constraints pack v0 (ENG-1679)**
- **Significantly enriched.** The Architecture Design doc provides ready-made guardrail content:
  - **Required contracts:** 7 game exports (Section 3)
  - **Forbidden patterns per tier:** (Section 6) — e.g., core importing from game, modules hardcoding atlas names, game duplicating module logic
  - **Wiring rule:** Only app.tsx imports from all three tiers (Section 4)
  - **Provider order:** Documented initialization sequence (Section 4.1)
  - **Extension rules:** Decision tree for where code goes (Section 5)
- **Update scope:** Most constraint definition work is done. Shift to encoding these as machine-checkable rules (ESLint, reviewer agent prompts, CI checks).

**Ticket 13 — Prompt format v0 (ENG-1680)**
- **New context:** Prompt output must map to the 7 contract fields. The prompt compiler's job is: free text → structured spec → 7 valid exports.

**Ticket 18 — Telemetry auto deploy (ENG-1685)**
- **New context:** AnalyticsProvider is one of the 7 required game exports (Section 3). Each game provides its own PostHog wrapper in `game/setup/AnalyticsContext.tsx`. Auto-deploy must generate this file.
- **Update:** Generator must produce a valid AnalyticsProvider, not just inject keys.

**Ticket 24 — Doc hygiene (ENG-1691)**
- **Expanded scope:** The rename from "scaffold" to "template" creates a sweeping find-and-replace across all docs, CLI references, and ticket descriptions. This ticket absorbs the rename work.
- **Add to scope:** Rename scaffold → template in all docs, CLAUDE.md, factory commands, CLI tool names.
- **Note:** The Architecture Design doc itself uses "scaffold" in CLI names (`scaffold:release`, etc.). Decide: keep `scaffold:*` CLI prefix or rename to `template:*`.

**Ticket 25 — Testing infrastructure (ENG-1692)**
- **Minor update:** `scaffold:verify` (Section 7) runs typecheck → lint → build as part of the sync workflow. Testing infra should integrate with this.

**Ticket 28 — Ad unit / embed integration (ENG-1695)**
- **New context:** `usePause()` (Section 3) is the core hook for pause state, relevant for iframe visibility. `useManifest()` resolves data via postMessage > CDN > local — postMessage is already in the resolution chain.

---

### NEW TICKETS NEEDED

**NEW: Package build + publish pipeline (@wolfgames/game-kit, @wolfgames/components)**

Section 2.1 defines packaging but doesn't exist yet. This is a prerequisite for the template repo model.

- Extract `src/core/` into `@wolfgames/game-kit` package
- Extract `src/modules/` into `@wolfgames/components` package
- Define package API surface (re-exports from index.ts)
- Set up build pipeline (TypeScript → dist, types)
- Publish to private npm registry or GitHub Packages
- Version in lockstep with scaffold semver
- Owner: Jesse | Priority: Urgent | Labels: Scaffold, Infra

**NEW: Version control CLI tools (scaffold:release, drift, sync, verify, rollback)**

Section 7 defines 5 CLI tools. None exist yet.

- `scaffold:release <major|minor|patch>` — bump version, changelog, git tag
- `scaffold:drift` — detect local edits to scaffold-owned paths
- `scaffold:sync` — merge latest scaffold changes
- `scaffold:verify` — typecheck → lint → build validation
- `scaffold:rollback` — revert sync commit
- GitHub workflow template for automated update checks
- Owner: Jesse | Priority: High | Labels: Scaffold, Infra

**NEW: Scaffold → template rename**

The user indicated "scaffold" is becoming "template." This is a cross-cutting rename.

- Rename references in all docs, CLAUDE.md, factory commands
- Decide on CLI prefix: `scaffold:*` vs `template:*`
- Update Linear ticket titles/descriptions
- Update package names if affected
- Owner: Jesse | Priority: Medium | Labels: Improvement

*Note: This could be absorbed into Ticket 24 (Doc hygiene) by expanding its scope.*

---

### UNCHANGED (no impact from Architecture Design doc)

| Ticket | Title | Linear | Why unchanged |
|--------|-------|--------|---------------|
| 1 | Q1 Prompt-to-Play Spec v0 | ENG-1668 | Alignment ticket, not affected by architecture internals |
| 2 | Quality Bar + Smoke Test Checklist v0 | ENG-1669 | Validation criteria, not affected |
| 9 | Prompt-to-Play UI v0 | ENG-1676 | External to scaffold |
| 10 | Orchestrator skeleton | ENG-1677 | Nucleo platform, not scaffold architecture |
| 14 | Golden prompts regression set | ENG-1681 | Validation, not architecture |
| 15 | Automated smoke test runner v0 | ENG-1682 | CI/deploy, unchanged |
| 16 | Generate 5 games milestone | ENG-1683 | Milestone, unchanged |
| 19 | Environments auto setup | ENG-1686 | GCS/Nucleo, not scaffold |
| 20 | Tuning system overhaul | ENG-1687 | Already detailed, no new info |
| 21 | Vibe coding asset pipeline | ENG-1688 | Already detailed |
| 22 | Semantic router | ENG-1689 | Already detailed |
| 23 | VFX / particles | ENG-1690 | Already detailed |
| 26 | Utility algorithm modules | ENG-1693 | Already detailed |
| 27 | /newmodule factory command | ENG-1694 | Gains decision tree from Section 5 but scope unchanged |
| 29 | Tuning auto-discovery gap | ENG-1696 | Already detailed |

---

## Combined View: All Changes Across Both Reports

Merging the Nucleo Build Plan alignment with this Architecture Design alignment:

### Tickets to merge or restructure

| Action | Tickets | Rationale |
|--------|---------|-----------|
| **Merge** | 7 + 17 → single "Version control + packaging" ticket | Architecture doc answers all open questions. One implementation ticket remains. |
| **Split** | 10 → Nucleo API + Build Worker + Run Store (from Nucleo report) | Still valid |
| **Absorb** | 24 absorbs scaffold→template rename | Expand doc hygiene to include rename |

### New tickets (combined from both reports)

| New ticket | Source | Priority |
|------------|--------|----------|
| Package build + publish pipeline | Architecture Design 2.1 | Urgent |
| Version control CLI tools | Architecture Design 7 | High |
| Nucleo API service | Nucleo Build Plan | Urgent |
| Run Store / Game tracking DB | Nucleo Build Plan | High |
| GCS deploy infrastructure | Nucleo Build Plan | High |
| Repo template creation | Nucleo Build Plan | Urgent |
| Credentials + secret management | Nucleo Build Plan | High |
| Auth (SSO/allowlist) | Nucleo Build Plan | Medium |

### Summary counts

| Category | Count |
|----------|-------|
| Unchanged | 15 |
| Update scope/details | 12 (Tickets 3, 4, 5, 6, 8, 11, 12, 13, 18, 24, 25, 28) |
| Merge | 2 → 1 (Tickets 7 + 17) |
| New tickets needed | 8 (2 from Architecture + 6 from Nucleo) |
| **Total after changes** | **35** (28 existing + 1 merged pair - 1 + 8 new) |

---

## Cross-Tier Contract as Generator Checklist

The Architecture Design doc's Section 3 gives us the definitive "what must a generated game produce" list. This is the intersection of Tickets 5 (Schema), 11 (Generator), and 12 (Guardrails):

```
A generated game is VALID if app.tsx can consume these exports:

 1. gameConfig.screens        → game/config.ts
 2. gameConfig.initialScreen  → game/config.ts
 3. manifest                  → game/config.ts
 4. defaultGameData           → game/index.ts
 5. GAME_DEFAULTS             → game/tuning/
 6. AnalyticsProvider          → game/setup/AnalyticsContext.tsx
 7. FeatureFlagProvider        → game/setup/FeatureFlagContext.tsx
```

Plus the anti-pattern rules (Section 6) as negative constraints.

This contract should be referenced by Tickets 5, 11, 12, and 13 — it's the shared source of truth for "what does done look like."

---

## Rename Impact: scaffold → template

The user indicated this rename is coming. Affected areas:

| Area | Current | New | Tickets affected |
|------|---------|-----|-----------------|
| Repo name | scaffold-production | TBD (template-production?) | All |
| CLI tools | `scaffold:release`, `scaffold:drift`, etc. | `template:release`? | New CLI ticket |
| CLAUDE.md | "scaffold" throughout | "template" | 24 |
| Docs | "scaffold" in docs/, factory/ | "template" | 24 |
| Linear project | "Production Scaffold Foundation" | "Production Template Foundation"? | All |
| Package names | `@wolfgames/game-kit` | unchanged (game-kit is already generic) | None |
| Ticket descriptions | "scaffold" throughout | "template" | All 29 |

**Recommendation:** Do the rename as part of Ticket 24 (Doc hygiene) once the final naming is confirmed. Don't rename ticket descriptions retroactively — just update going forward.
