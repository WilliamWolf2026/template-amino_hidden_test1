# Claude Code Project Setup Prompt

Copy everything below the line and give it to Claude Code in a new repo.

---

Set up Claude Code project configuration so that AI assistants automatically consult coding standards and documentation before making changes. Here's the pattern:

## What to create

### 1. `CLAUDE.md` (project root)

This is the main file Claude Code reads every session. It needs these sections:

- **Quick Context** — 3-5 line ASCII diagram of the project architecture (what imports what)
- **Coding Standards & Docs** — Two bullet points telling the AI where to find rules and docs:
  ```
  Before making changes, consult the relevant files in:
  - `ai/rules/` — coding standards, review guidelines, language patterns
  - `docs/` — architecture, design docs, guides, patterns
  ```
- **File Permissions** — Table of which folders are editable vs read-only (protects framework/vendor code)
- **Tech Stack** — Bullet list of frameworks and tools
- **Project Structure** — Short tree showing folder purposes
- **Common Tasks** — Shell commands for dev, test, build

Keep it under 120 lines. Every line costs context window space.

### 2. `CLAUDE.lite.md` (project root)

Same as CLAUDE.md but without the "Coding Standards & Docs" section. This is the toggle-off version.

### 3. `ai/rules/` directory

Create `.mdc` or `.md` files for coding standards the AI should follow. Each file covers one activity. Common ones:

- `review.mdc` — Code review criteria and process
- `javascript.mdc` (or your language) — Language-specific patterns and conventions
- `ui.mdc` — UI/UX guidelines
- `tdd.mdc` — Testing approach
- `log.mdc` — Changelog/logging format
- `security/` — Security rules (auth, input validation, etc.)

Format each rule file with:
1. A description of when to use it
2. The actual rules/criteria
3. Constraints (e.g., "don't make changes, review only")

The AI will match filenames to activities automatically. You don't need an explicit mapping table.

### 4. `docs/` directory

Organize project documentation so the AI can find it. Minimum:
- `docs/README.md` — Index of all docs
- Design docs (game design, product specs, etc.)
- Architecture docs
- Development guides (debugging, animation, patterns)
- Asset/deployment guides

The AI uses these as ground truth when reviewing code or planning features.

### 5. `.claude/README.md`

Document the toggle mechanism:

```markdown
## Context Modes

| Mode | File | Description |
|------|------|-------------|
| **Full** | `CLAUDE.md` (default) | AI reads coding standards + docs |
| **Lite** | `CLAUDE.lite.md` | Minimal context, no rule/doc lookups |

## Quick Switch

```bash
# Lite (fewer tool calls, faster)
cp CLAUDE.lite.md CLAUDE.md

# Full (restore — uses git since CLAUDE.md is committed as Full)
git checkout CLAUDE.md
```
```

## How it works

1. Claude Code loads `CLAUDE.md` into its system prompt every session
2. The "consult relevant files" instruction triggers the AI to **read** the matching rule/doc file before starting work
3. The AI matches activities to files by name (e.g., "review" → `ai/rules/review.mdc`, "game logic" → `docs/game/design.md`)
4. No explicit mapping table needed — two bullet points is enough
5. Switching to `CLAUDE.lite.md` disables the lookups for speed

## Steps

1. Scan the current repo structure — understand the architecture, tech stack, what folders exist
2. Check if `ai/rules/` or `docs/` already exist with content. If so, preserve them
3. Create `CLAUDE.md` with all sections filled in for THIS project
4. Create `CLAUDE.lite.md` as the stripped version
5. If `ai/rules/` doesn't exist, create starter rule files based on the project's language and framework
6. If `docs/` doesn't have a README.md index, create one linking to existing docs
7. Create or update `.claude/README.md` with the toggle instructions
8. Show me the final `CLAUDE.md` when done

Keep everything concise. The AI reads these files every session — bloat wastes context window.
