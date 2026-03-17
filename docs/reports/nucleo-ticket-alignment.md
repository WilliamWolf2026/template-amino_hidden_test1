# Nucleo Build Plan vs. Linear Tickets — Alignment Report

The Nucleo Build Plan introduces concrete architecture and technology decisions that supersede, refine, or confirm assumptions in the 29 Production Scaffold Foundation tickets (ENG-1668 through ENG-1696). This report maps every Nucleo decision to affected tickets and recommends changes.

---

## Key Decisions from Nucleo Plan

| Decision | Impact |
|----------|--------|
| **Deploy target: GCS static hosting** | Replaces wolf.games CDN/environment assumptions in Tickets 10, 19 |
| **CI: GitHub Actions** | Replaces unimplemented CI in Tickets 15, 25 |
| **Run isolation: one repo per game** | Resolves Ticket 7 (source management) and Ticket 17 (version control) — template-based distribution |
| **Repo template includes game-kit** | Changes Ticket 18 (telemetry) — game-kit is the analytics layer, not raw PostHog |
| **UI: React app** | Confirms Ticket 9 is external to scaffold repo, adds specifics |
| **Nucleo API + Build Worker + Run Store** | Ticket 10 (orchestrator) splits into 3 components |
| **PostHog auto-provisioned per game** | Confirms Ticket 18, adds API provisioning detail |
| **Game tracking database** | New requirement — no existing ticket covers this |
| **Auth required (SSO/allowlist)** | New requirement — no existing ticket |
| **Credentials in secrets manager** | New requirement — no existing ticket |

---

## Ticket-by-Ticket Analysis

### KEEP AS-IS (no changes needed)

These tickets are unaffected by Nucleo decisions — they're about scaffold internals.

| Ticket | Title | Linear | Why unchanged |
|--------|-------|--------|---------------|
| 3 | Finalize layered architecture | ENG-1670 | Scaffold-internal, feeds into repo template |
| 4 | Create Component Registry | ENG-1671 | Maps to Nucleo's "minimal, approved component set" |
| 6 | Standardized templates | ENG-1673 | Feeds into repo template |
| 14 | Golden prompts regression set | ENG-1681 | Still needed for validation |
| 20 | Tuning system overhaul | ENG-1687 | Scaffold-internal |
| 21 | Vibe coding asset pipeline | ENG-1688 | Scaffold-internal, critical for generation |
| 22 | Semantic router | ENG-1689 | Scaffold-internal |
| 23 | VFX / particles | ENG-1690 | Scaffold-internal |
| 24 | Doc hygiene | ENG-1691 | Scaffold-internal |
| 26 | Utility algorithm modules | ENG-1693 | Scaffold-internal |
| 27 | /newmodule factory command | ENG-1694 | Scaffold-internal |
| 29 | Tuning auto-discovery gap | ENG-1696 | Scaffold-internal |

### UPDATE (scope or details changed)

**Ticket 1 — Q1 Prompt-to-Play Spec v0 (ENG-1668)**
Change: Nucleo defines concrete output requirements. Update the spec to reference:
- Output = commit/PR in GitHub + build logs + deploy URL (GCS) + run summary
- Prompt input via React UI
- Run lifecycle managed by Nucleo API + Build Worker
- Add "run summary" as a required artifact

**Ticket 2 — Quality Bar + Smoke Test Checklist v0 (ENG-1669)**
Change: Add Nucleo-specific checks:
- GCS deploy accessible (URL returns 200)
- GitHub commit/PR exists and is valid
- Build logs accessible from UI (not just Cloud Run console)
- Game loads in iframe preview without CSP errors

**Ticket 5 — Define Game Schema v0 (ENG-1672)**
Change: Schema must map to the repo template's "known game entry interface." Add:
- Schema output must be consumable by the Build Worker's generator
- Must account for game-kit integration (not raw PostHog)
- Repo template structure is the target, not just scaffold patterns

**Ticket 7 — Source management (ENG-1674)**
Change: **Decision made.** One repo per game, created from a template repo. Update scope:
- Remove evaluation of git subtree/submodule/npm package — decision is template repo
- Focus on: defining the template repo contents, template-to-repo creation workflow, how scaffold updates propagate to the template (not to individual games)
- Depends on Ticket 17 is now circular — merge or sequence clearly

**Ticket 8 — Asset loading Q1 baseline (ENG-1675)**
Change: Deploy target is GCS, not wolf.games CDN. Update:
- Replace CDN URL patterns (media.{env}.wolf.games) with GCS bucket URLs
- Placeholder assets must work with GCS static hosting
- Loading progress still relevant but environment config changes

**Ticket 9 — Prompt-to-Play UI v0 (ENG-1676)**
Change: Nucleo plan is much more specific. Update:
- Tech: React (confirmed external to scaffold repo)
- Features: prompt input, run history (status + links), deployed URL link, iframe preview with loading + error states
- Must handle CSP/iframe policies for embedding GCS-hosted games
- Auth: SSO or allowlist required

**Ticket 10 — Orchestrator skeleton (ENG-1677)**
Change: **Splits into 3 components.** Major restructure:
- **Nucleo API**: `POST /runs`, `GET /runs/:id`, `GET /runs` — thin control plane with auth
- **Build Worker**: Cloud Run job — pull template, run generator, commit + push, trigger CI, update status
- **Run Store**: minimal DB — run id, prompt, timestamps, status, links (commit, PR, build logs, deploy URL), optional spec text
- Remove scaffold build pipeline references — the worker handles this
- Consider splitting into 2-3 sub-tickets

**Ticket 11 — Minimal agent set integration (ENG-1678)**
Change: The "Generator" lives inside the Build Worker. Update:
- Agent runs inside Cloud Run job context, not local CLI
- Must work with repo template (not live scaffold repo)
- Generator fills in the "game entry interface" defined by the template
- Add constraint: must complete within Cloud Run timeout

**Ticket 12 — Guardrails / constraints pack v0 (ENG-1679)**
Change: Enforcement happens in two places now:
- Pre-commit: generator agent checks (same as before)
- Post-build: CI pipeline checks (GitHub Actions)
- Add: GCS deploy validation (game loads, telemetry fires)

**Ticket 13 — Prompt format v0 (ENG-1680)**
Change: Prompt comes from React UI, not CLI. Update:
- Input is free-text from the Nucleo UI prompt field
- Output spec must be compatible with Build Worker's generator
- Add: spec text stored in Run Store for history/debugging

**Ticket 15 — Automated smoke test runner v0 (ENG-1682)**
Change: Runs as part of GitHub Actions CI, not standalone. Update:
- Integrate into GitHub Actions workflow (not custom script)
- Test against GCS-deployed URL (not local dev server)
- Publish results back to Run Store via Nucleo API
- Add: iframe embed test (CSP, loading states)

**Ticket 16 — Generate 5 games milestone (ENG-1683)**
Change: Now means 5 games through the full Nucleo pipeline. Update:
- Each game = its own repo created from template
- Each game = GCS-deployed URL
- Each game = run record in Run Store with all artifacts
- Validation via iframe preview in Nucleo UI

**Ticket 17 — Version control (ENG-1684)**
Change: **Decision made.** Template repo model. Major scope reduction:
- Remove evaluation of distribution models — decision is template repo + one repo per game
- Focus on: template repo creation + maintenance, game-kit inclusion, how template stays in sync with scaffold-production
- Scaffold updates propagate to the *template*, not to individual game repos
- Individual games are snapshots — no update mechanism needed for Q1

**Ticket 18 — Telemetry auto deploy (ENG-1685)**
Change: Nucleo plan confirms and extends. Update:
- PostHog project created via API during Build Worker run (confirmed)
- Project key/settings written into repo's runtime config
- Game must emit "baseline required events" (define these)
- Smoke test validates telemetry fires
- game-kit is the integration layer (not raw initPostHog)
- Sentry: still TBD in Nucleo plan — keep or deprioritize?

**Ticket 19 — Environments auto setup (ENG-1686)**
Change: **Significantly simplified.** GCS replaces multi-environment wolf.games setup:
- Remove: DNS configuration, 5-environment CDN URLs, GAME_PATHS templating
- Replace with: GCS bucket provisioning, GitHub Actions workflow generation, GCS deploy credentials
- Naming convention for repos + deployed URLs (from Nucleo plan)
- Cache headers + invalidation strategy (or versioned paths)

**Ticket 25 — Testing infrastructure (ENG-1692)**
Change: CI is now GitHub Actions (confirmed). Update:
- GitHub Actions workflow: install, build, test, deploy to GCS
- Wire secrets per deploy-infra-gcs documentation
- Vitest config still needed for unit tests in scaffold
- Playwright may run in CI against GCS-deployed URL

**Ticket 28 — Ad unit / embed integration (ENG-1695)**
Change: iframe preview in Nucleo UI is a related concern. Update:
- CSP / iframe policies must allow Nucleo UI to embed GCS-hosted games
- This ticket becomes partially a dependency of Ticket 9 (UI)
- Publisher embed use case is still separate / future

### NEW TICKETS NEEDED

The Nucleo plan introduces requirements not covered by any existing ticket:

**NEW: Nucleo API service**
- `POST /runs` to start a build, `GET /runs/:id` and `GET /runs` for status/history
- Auth (SSO or allowlist for Q1)
- Thin control plane — dispatches to Build Worker
- Labels: Infra, Feature | Priority: Urgent | Owner: Daniel

**NEW: Run Store / Game tracking database**
- Minimal schema: run id, prompt, timestamps, status (queued/running/succeeded/failed), links (commit, PR, build logs, deploy URL), optional spec text
- "Games" table: name/id, prompt, repo link, deploy URL, status, created time
- On successful run: upsert game record
- Labels: Infra | Priority: High | Owner: Daniel

**NEW: GCS deploy infrastructure**
- Define GCS bucket + public access / signed URL strategy
- Deploy step: upload build artifacts, output deployed URL
- Cache headers + invalidation (or versioned paths)
- Labels: Infra | Priority: High | Owner: Daniel

**NEW: Repo template creation**
- Create template repo from scaffold-production + game-kit
- Define "game entry interface" the generator fills in
- Include scaffold core, approved component set, game-kit, CI workflow
- Naming convention for generated repos
- Labels: Scaffold, Infra | Priority: Urgent | Owner: Jesse

**NEW: Credentials + secret management**
- Decide: GitHub Secrets vs GCP Secret Manager for Q1
- Least-privilege GCP service account for GCS deploy
- GitHub App/token for repo creation + push
- Key rotation plan
- Labels: Infra | Priority: High | Owner: Daniel

**NEW: Auth (SSO/allowlist)**
- Nucleo UI + API authentication
- SSO or simple allowlist for Q1
- Who can build vs. who can view
- Labels: Infra | Priority: Medium | Owner: Daniel

---

## Summary of Changes

| Category | Count | Tickets |
|----------|-------|---------|
| Keep as-is | 12 | 3, 4, 6, 14, 20, 21, 22, 23, 24, 26, 27, 29 |
| Update scope/details | 17 | 1, 2, 5, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 25, 28 |
| New tickets needed | 6 | Nucleo API, Run Store, GCS Deploy, Repo Template, Secrets, Auth |

**Total after changes: 35 tickets** (29 existing updated + 6 new)

### Biggest Shifts

1. **Ticket 10 (Orchestrator)** needs the most rework — it splits into Nucleo API + Build Worker + Run Store (3 components). Consider breaking into sub-tickets or replacing with the 3 new tickets.

2. **Tickets 7 + 17 (Source management + Version control)** have significant overlap now that the decision is "template repo + one repo per game." Consider merging into one ticket focused on template repo creation and maintenance.

3. **Ticket 19 (Environments)** scope shrinks dramatically — from 5-environment wolf.games provisioning to GCS bucket + GitHub Actions.

4. **The 6 new tickets** cover Nucleo platform infrastructure that didn't exist in the scaffold-focused original plan. These are the "platform" layer sitting above the scaffold.

### Recommended Priority Reordering

The Nucleo plan makes the critical path clearer:

```
Repo Template (NEW) + Ticket 5 (Game Schema)
    |
    v
Build Worker (in Ticket 10) + Generator (Ticket 11)
    |
    v
GCS Deploy (NEW) + CI (Ticket 15/25)
    |
    v
Nucleo API (NEW) + Run Store (NEW) + UI (Ticket 9)
    |
    v
Telemetry (Ticket 18) + Smoke Tests (Ticket 15)
    |
    v
Generate 5 Games (Ticket 16) -- milestone
```

Scaffold-internal tickets (3, 4, 6, 20-29) run in parallel on Jesse's stream.
