# AIDD Rules vs Factory Commands — Comparison Report

Two parallel systems define AI-assisted workflows in this project: **ai/rules/** (`.mdc` files, origin: Cursor IDE) and **docs/factory/** (`.md` files, origin: Claude Code). Both define slash commands, but they serve different roles and route through different mechanisms.

---

## Architecture

```
                    ┌─────────────────────┐
                    │    User Request      │
                    │   (e.g. /review)     │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                  ▼
   ┌─────────────────────┐           ┌─────────────────────┐
   │   Cursor IDE Path   │           │  Claude Code Path   │
   │                     │           │                     │
   │ agent-orchestrator  │           │     CLAUDE.md       │
   │        .mdc         │           │  (factory table)    │
   └──────────┬──────────┘           └──────────┬──────────┘
              │                                  │
              ▼                                  ▼
   ┌─────────────────────┐           ┌─────────────────────┐
   │   please.mdc        │           │  docs/factory/*.md  │
   │  (persona + router) │           │ (workflow templates) │
   └──────────┬──────────┘           └──────────┬──────────┘
              │                                  │
              ▼                                  │
   ┌─────────────────────┐                      │
   │  ai/rules/*.mdc     │◄─────────────────────┘
   │ (deep rule files)   │   (factory commands reference
   └─────────────────────┘    ai/rules via "read please.mdc")
```

---

## System Comparison

| Aspect | ai/rules/ (AIDD) | docs/factory/ |
|--------|-------------------|---------------|
| **Format** | `.mdc` (Cursor rule format with YAML frontmatter) | `.md` (plain markdown) |
| **Origin** | Cursor IDE rules system | Claude Code workflows |
| **Entry point** | `agent-orchestrator.mdc` → `please.mdc` | `CLAUDE.md` factory table |
| **Routing** | Cursor's `alwaysApply` + description matching | CLAUDE.md "consult" instruction + command table |
| **Role** | Persona, thinking framework, deep domain rules | Workflow templates (process, constraints, output format) |
| **Editable?** | Read-only in restricted mode | Editable |
| **Depth** | Deep — full rule definitions, type systems, state machines | Medium — structured pseudo-code with fn/Constraints/Output blocks |

---

## Command-by-Command Comparison

### Commands with rules in BOTH systems

| Command | ai/rules/ file | docs/factory/ file | Relationship |
|---------|---------------|-------------------|--------------|
| `/review` | `review.mdc` (51 lines) — criteria referencing 8+ rule files, OWASP checklist, RTC thinking | `review.md` (52 lines) — self-contained Criteria/fn/Output blocks | Both self-contained, complementary depth |
| `/commit` | Referenced in `please.mdc` | `commit.md` (42 lines) — Format/Types/fn blocks | Factory is self-contained |
| `/task` | `task-creator.mdc` (159 lines) — full epic lifecycle with state machine, agent orchestration | `task.md` (59 lines) — State/fn/EpicTemplate blocks | Factory is a structured subset |
| `/execute` | Part of `task-creator.mdc` | `execute.md` (40 lines) — fn execute/onBlocked/Output blocks | Factory is a structured subset |
| `/log` | `log.mdc` (68 lines) — emoji categorization, git change detection, strict filtering | `log.md` (36 lines) — Emojis/fn/Template blocks | Factory is a structured subset |
| `/plan` | Referenced in `please.mdc` | `plan.md` (33 lines) — fn plan/Output blocks | Factory is self-contained |
| `/discover` | `productmanager.mdc` (117 lines) — full product discovery framework with types, CRUD | `discover.md` (46 lines) — Types/fn/Output blocks | Factory is a structured subset |
| `/user-test` | `user-testing.mdc` (148 lines) — dual script generation, persona behavior model | `user-test.md` (69 lines) — Types/fn/Templates blocks | Factory is a structured subset |
| `/run-test` | Part of `user-testing.mdc` | `run-test.md` (40 lines) — fn runTest with sub-steps/Output | Factory is a structured subset |
| `/help` | Defined in `please.mdc` Commands block | `help.md` (34 lines) — fn help/Commands listing | Factory is self-contained |

### Commands ONLY in docs/factory/ (no ai/rules equivalent)

| Command | docs/factory/ file | What it does |
|---------|-------------------|--------------|
| `/research` | `research.md` (27 lines) | Investigate without code changes — self-contained process |
| `/compare` | `compare.md` (33 lines) | Compare solutions with table — self-contained process |
| `/report` | `report.md` (31 lines) | Generate documentation — self-contained process |
| `/audit` | `audit.md` (44 lines) | Systematic codebase review — self-contained process |
| `/debug` | `debug.md` (48 lines) | Find bug root cause — self-contained process |
| `/naming` | `naming.md` (42 lines) | Asset naming convention — self-contained reference |
| `/update-docs` | `update-docs.md` (82 lines) | Sync doc indexes — self-contained process |

### Rules ONLY in ai/rules/ (no factory command)

| Rule file | What it does |
|-----------|-------------|
| `javascript.mdc` | JS/TS coding patterns and best practices |
| `ui.mdc` | UI/UX design guidelines |
| `tdd.mdc` | Test-driven development process |
| `requirements.mdc` | Functional requirement specification |
| `productmanager.mdc` | Product discovery framework (used by `/discover`) |
| `stack.mdc` | Tech stack guidance (NextJS/React/Redux/Shadcn) |
| `security/*.mdc` | JWT, timing-safe compare, vulnerability rules |
| `frameworks/redux/*.mdc` | Autodux and Redux patterns |
| `javascript/error-causes.mdc` | Error handling patterns |
| `javascript/javascript-io-network-effects.mdc` | Saga pattern for side effects |

---

## Depth Comparison

The two systems operate at different abstraction levels:

```
┌──────────────────────────────────────────────────────────────────┐
│ Layer 1: PERSONA + THINKING (ai/rules only)                      │
│                                                                   │
│  please.mdc defines:                                              │
│  • Who the AI is ("Aiden" — senior engineer + PM + writer)       │
│  • How it thinks (RTC: restate → ideate → reflect → evaluate)   │
│  • Global constraints (one thing at a time, ask before acting)   │
│  • Depth control (-d 1..10)                                      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Layer 2: DOMAIN RULES (ai/rules only)                            │
│                                                                   │
│  Deep domain knowledge as executable rule files:                  │
│  • review.mdc — 9-step review referencing 8 specialized rules   │
│  • task-creator.mdc — full epic lifecycle with state machine     │
│  • productmanager.mdc — type system for user stories/journeys   │
│  • user-testing.mdc — dual script generation with persona AI    │
│  • javascript.mdc, ui.mdc, tdd.mdc — coding standards          │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Layer 3: WORKFLOW TEMPLATES (docs/factory)                        │
│                                                                   │
│  All commands now use structured pseudo-code:                     │
│  fn/Constraints/Types/Output blocks                               │
│                                                                   │
│  Overlapping (structured subset of ai/rules):                    │
│     /review   → Criteria/fn/Output               (52 lines)     │
│     /task     → State/fn/EpicTemplate             (59 lines)     │
│     /discover → Types/fn/Output                   (46 lines)     │
│                                                                   │
│  Factory-only (self-contained):                                   │
│     /debug    → fn debug with 7 steps + Output    (48 lines)    │
│     /audit    → AuditTypes/fn/Output              (44 lines)    │
│     /research → fn research with 5 steps          (27 lines)    │
│     /compare  → fn compare with table template    (33 lines)    │
└──────────────────────────────────────────────────────────────────┘
```

---

## How They Interact

Factory commands are now **self-contained structured prompts** that work independently in Claude Code. For commands that overlap with ai/rules, the factory version is a focused subset — it captures the essential process without the deep rule composition.

In Cursor, the ai/rules versions are richer because they compose with each other:

```
/review in Cursor:
  → review.mdc loads (9-step process)
    → references javascript.mdc, tdd.mdc, ui.mdc, stack.mdc, security/*.mdc
    → please.mdc provides persona + RTC thinking
  → deep, multi-rule review

/review in Claude Code:
  → CLAUDE.md routes to docs/factory/review.md
  → review.md provides Criteria{} + fn review() + Output{}
  → structured, self-contained review
```

Both produce quality reviews, but through different mechanisms. Cursor composes many small rules; Claude Code follows one structured template.

---

## Key Differences

| | ai/rules/ (AIDD) | docs/factory/ |
|---|---|---|
| **Design philosophy** | Deep rules that compose — each rule references others | Self-contained structured pseudo-code (fn/Constraints/Output) |
| **When consulted** | Activity-matched by AI (semantic) or always-on | Explicit slash command invocation |
| **Composability** | High — `review.mdc` pulls in 8+ rule files | Low — each command is self-contained |
| **Cursor vs Claude** | Native Cursor experience (frontmatter, globs, alwaysApply) | Native Claude Code experience (CLAUDE.md routing) |
| **Portability** | Cursor-specific `.mdc` format | Universal markdown |
| **Overlap** | 10 commands overlap with factory | 7 commands are factory-only |

---

## Evolution Path

The two systems evolved through three phases:

1. **ai/rules/** was built first for **Cursor IDE** — a rich rule composition system where rules reference each other, have frontmatter metadata, and use Cursor's `alwaysApply`/glob matching
2. **docs/factory/** was built for **Claude Code** — when the project added Claude Code support, it needed its own routing mechanism (CLAUDE.md table), so factory commands were created as thin wrappers that delegated to ai/rules
3. **Factory commands upgraded to structured pseudo-code** — the thin wrappers were replaced with self-contained `fn/Constraints/Types/Output` blocks, making each command effective without depending on ai/rules file reads

The current state:
- **ai/rules files** (51-159 lines) — deep composable knowledge for Cursor
- **Factory commands** (27-69 lines) — structured pseudo-code for Claude Code
- **Factory-only commands** (27-82 lines) — self-contained processes with no ai/rules equivalent

---

## Recommendations

### Keep both systems — they serve different tools
The dual system isn't redundant. ai/rules/ powers Cursor, docs/factory/ powers Claude Code, and both can coexist. Factory commands are now self-contained and no longer depend on ai/rules file reads.

### Consider migrating factory-only commands to ai/rules
The 7 factory-only commands (`/debug`, `/audit`, `/research`, `/compare`, `/report`, `/naming`, `/update-docs`) contain real process logic. If these were also in ai/rules/, Cursor sessions would benefit too.

### Document the relationship
The AIDD section in [docs/README.md](../README.md) explains the connection graph. The factory table in CLAUDE.md routes commands. This report fills in the detailed comparison.
