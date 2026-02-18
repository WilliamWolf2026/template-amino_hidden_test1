# Workflow Audit: AI-Assisted Development Practices

**Date:** 2026-02-17
**Audited against:** Addy Osmani's "My LLM coding workflow going into 2026" + Anthropic's "Effective context engineering for AI agents"

---

## Summary Scorecard

| Practice | Grade | Status |
|----------|:-----:|--------|
| Spec/Plan before code | **B-** | Tools exist, not habitual |
| Small iterative chunks | **B** | Good workflow, could persist better |
| Context & guidance | **A** | Strongest area |
| Model selection | **C** | Single-model, intentional |
| AI across lifecycle | **A-** | 19 factory commands, solid CI/CD |
| Human in the loop | **B** | Guardrails in place, no automated review |
| Version control | **C+** | Conventions documented, not enforced |
| Rules & customization | **A** | Comprehensive |
| Testing & automation | **F** | Strategy documented, zero implementation |
| Context engineering | **B+** | Strong foundations, minor gaps |

---

## Detailed Findings

### 1. Spec/Plan Before Code — B-

**What's in place:**
- `/plan` and `/task` factory commands for structured planning
- `requirements.mdc` and `productmanager.mdc` AI rules
- Game design docs (GDD, chapter generation, CDN plan)
- `/research` and `/compare` for pre-implementation investigation

**Gaps:**
- No `spec.md` or `plan.md` artifacts found in the repo — the tooling exists but there's no evidence of persistent spec documents being produced and referenced during implementation
- No template or convention for "write the spec, then code"
- Linear tickets exist (ENG-XXXX branches) but it's unclear if they contain detailed specs or just titles

**Recommendation:** Create a `docs/specs/` directory. Before starting any feature, produce a lightweight spec (even 10 lines) that persists in the repo. The `/plan` factory could output to this directory automatically.

---

### 2. Small Iterative Chunks — B

**What's in place:**
- `/task` factory breaks work into atomic tasks
- ENG-XXXX branch naming implies ticket-based scoping
- Factory workflow supports research -> plan -> task -> execute pipeline

**Gaps:**
- No evidence of the task breakdown being persisted between sessions (tasks live in Claude's TodoWrite, not in the repo)
- No checklist or tracking mechanism beyond Linear

**Recommendation:** Minor gap. The factory workflow is solid. Consider persisting task breakdowns in Linear sub-issues or a `TODO.md` that survives session boundaries.

---

### 3. Context & Guidance — A

**What's in place:**
- `CLAUDE.md` with quick context diagram, permissions table, project structure, tech stack, common commands
- `docs/doc-index.md` — flat routing table ("one read, zero hops")
- `docs/scaffold/context-map.md` — architectural dependency map
- 13 AI rules files in `ai/rules/` (TDD, review, UI, stack, security, etc.)
- Two context modes (Full via CLAUDE.md, Lite via CLAUDE.lite.md)
- Persistent memory in MEMORY.md
- 100+ documentation files covering architecture, guides, platform, assets, deployment

**This is the project's strongest area.** The doc-index routing table is exactly what Anthropic's article calls "lightweight identifiers" for just-in-time context retrieval. The rules files act as the "style guide for your AI pair programmer" Osmani recommends.

**Minor improvement:** MEMORY.md could link to specific doc files more explicitly to help cross-session continuity.

---

### 4. Model Selection — C

**What's in place:**
- Claude Code as primary tool
- Two permission modes support different workflows

**Gaps:**
- No GEMINI.md, .cursorrules, or other multi-model config
- Empty `.cursor/` directory — Cursor not actively configured
- No evidence of cross-model review (Osmani's "model musical chairs")

**Recommendation:** This is a conscious choice, not necessarily a gap. If you find Claude hitting blind spots on specific tasks, having a lightweight Cursor or Gemini config ready would let you switch quickly. Low priority.

---

### 5. AI Coding Across the Lifecycle — A-

**What's in place:**
- 19 factory commands covering the full SDLC: research, plan, task, execute, debug, review, commit, test, docs, audit
- `/newgame` for repo forking workflow
- `/discover` for user journey mapping
- `/user-test` for manual QA workflow
- CI/CD via GitHub Actions (multi-environment: dev/qa/staging/prod)
- Dev tools: QR code plugin for mobile testing, Tweakpane for runtime tuning, Sentry for errors, PostHog for analytics

**Gaps:**
- No automated code review bots (CodeRabbit, etc.)
- CI pipeline only handles deployment, not quality gates (no test/lint jobs)

**Recommendation:** The factory coverage is impressive. The CI gap is addressed under Testing below.

---

### 6. Human in the Loop — B

**What's in place:**
- Restricted mode prevents editing scaffold and AI rules (guardrails)
- `/review` factory command for code review
- Manual QA checklist in testing strategy doc
- Permission prompts for risky operations

**Gaps:**
- No automated review layer (no PR review bots, no required approvals configured)
- No evidence of cross-model review in practice

**Recommendation:** Consider adding a GitHub required review policy on `main`. If PRs are opened via Claude, a second pass (manual or via `/review`) should be a documented step in the workflow.

---

### 7. Version Control Practices — C+

**What's in place:**
- `/commit` factory with conventional commit format (type/scope/description)
- Branch naming convention (ENG-XXXX)
- CI/CD deployment on push to main and tags
- `.gitignore` covers build artifacts, env files, IDE config

**Gaps:**
- **No git hooks** — conventional commit format is documented but not enforced. Nothing prevents a `git commit -m "stuff"`.
- Recent commit history shows informal messages: `"small changes"`, `"save here before refactor try"` — these don't follow the documented convention
- No commit message linting (commitlint, husky)
- No pre-commit checks (lint, typecheck)

**Recommendation:** This is a significant gap between documented practice and actual practice. Install `husky` + `commitlint` to enforce conventional commits. Add a pre-commit hook that runs `tsc --noEmit` at minimum. Osmani specifically calls out "never commit code you can't explain" — informal messages like "small changes" are a red flag.

---

### 8. Rules & AI Customization — A

**What's in place:**
- 13 rules files covering TDD, code review, UI, tech stack, security, task creation, logging, user testing
- CLAUDE.md with structured project context and permissions
- Two permission modes (admin/restricted)
- Two context modes (full/lite)
- Memory system for cross-session learning
- Factory commands as reusable "skills"

**This matches exactly what both articles recommend** — Osmani's "rules files" and Anthropic's "system prompts at the right altitude."

---

### 9. Testing & Automation — F

**What's in place:**
- `docs/guides/testing/testing-strategy.md` — comprehensive doc with Vitest examples, Playwright E2E, CI workflow YAML, manual QA checklist
- `ai/rules/tdd.mdc` — TDD rules for AI-assisted development
- `/run-test` factory command

**What's missing (all of it):**
- **Zero test files** in the entire project
- **No test runner installed** — no `vitest`, `playwright`, or any test dependency in package.json
- **No test scripts** in package.json (`bun run test` doesn't exist)
- **No linter** — no ESLint, Prettier, or Biome config
- **No CI quality gates** — the only GitHub Actions workflow handles deployment, not tests
- **No pre-commit hooks** — nothing runs before commit

**This is the project's biggest gap by far.** Both articles emphasize testing as the critical force multiplier for AI-assisted development. Anthropic's article says agents "fly through a project with a good test suite as safety net." Osmani says "invest in tests — it amplifies the AI's usefulness." Right now the project has thorough documentation of a testing strategy that hasn't been implemented.

**Recommendation (priority order):**
1. Install Vitest: `bun add -d vitest`
2. Add `"test": "vitest run"` and `"test:watch": "vitest"` to package.json
3. Write first tests for pure game logic (scoring, level validation, state calculations — the testing-strategy doc already identifies these)
4. Add a `test.yml` GitHub Actions workflow (the testing-strategy doc has the exact YAML ready to copy)
5. Install a linter (Biome is fast and zero-config: `bun add -d @biomejs/biome`)
6. Add Playwright for E2E once unit tests are stable

---

### 10. Context Engineering (Anthropic article) — B+

**What's in place:**
- **Right altitude prompts:** CLAUDE.md strikes the Goldilocks balance — specific permissions and structure without brittle if-else logic
- **Tool design:** Factory commands are self-contained with minimal overlap (each has a clear single purpose)
- **Just-in-time retrieval:** doc-index.md acts as a lightweight index for progressive disclosure — the agent reads the index, then fetches specific docs as needed
- **Structured note-taking:** MEMORY.md persists architectural decisions and debugging insights across sessions
- **Context modes:** Full/Lite switching manages context budget explicitly

**Gaps:**
- **No few-shot examples in CLAUDE.md** — the rules files have some, but the main system prompt doesn't demonstrate expected output patterns
- **No compaction strategy documented** — long sessions may degrade without explicit guidance on what to preserve
- **MEMORY.md is manually maintained** — no automated mechanism to capture learnings
- **Tool results aren't optimized for token efficiency** — factory commands don't specify output format constraints

**Recommendation:** Add 1-2 canonical examples to CLAUDE.md showing an ideal interaction pattern (e.g., "here's what a good `/task` breakdown looks like"). Consider adding a `## Context Budget` section to CLAUDE.md that hints at what to prioritize when context gets large.

---

## Top 3 Actions by Impact

1. **Implement testing** — Install Vitest, write tests for game logic, add CI quality gates. This is the single highest-leverage improvement. Every other practice (AI review, commit confidence, iterative chunks) gets better when tests exist.

2. **Enforce commit conventions** — Add husky + commitlint. The gap between documented conventions and actual commit messages (`"small changes"`) undermines the version control practice.

3. **Add a linter** — Biome or ESLint + Prettier. This gives both humans and AI immediate feedback on code quality without manual review.
