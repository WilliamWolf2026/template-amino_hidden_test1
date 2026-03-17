# Factory

Reusable workflows for common development tasks.

---

## Quick Reference

| Command | What it does | Modifies Code? |
|---------|--------------|:--------------:|
| `/research` | Investigate a topic | No |
| `/compare` | Compare solutions with table | No |
| `/report` | Generate documentation | No |
| `/audit` | Systematic codebase review | No |
| `/review` | Code quality review | No |
| `/naming` | Asset naming convention | No |
| `/debug` | Find bug root cause | Asks first |
| `/plan` | Suggest next steps | No |
| `/task` | Execute with tracking | Yes |
| `/commit` | Git commit | Yes |
| `/update-docs` | Sync doc indexes with actual files | Yes |
| `/deploy` | Deploy to QA/staging/production | Asks first |
| `/newgame` | Setup checklist for forking to a new game | No |
| `/newmodule` | Scaffold a new module in modules/ | Yes |

---

## Research (No Code Changes)

| Command | Use When |
|---------|----------|
| `/research` | "What is X?" "How does Y work?" |
| `/compare` | "Should we use A or B?" |
| `/report` | "Write up findings on X" |
| `/audit` | "Find all usages of X" "Check for dead code" |
| `/review` | "Review this PR/code" |
| `/naming` | "What's the naming convention?" "Is this filename correct?" |

---

## Action (May Change Code)

| Command | Use When |
|---------|----------|
| `/debug` | "Why isn't this working?" |
| `/plan` | "What should we do next?" |
| `/task` | "Implement this feature" |
| `/commit` | "Commit these changes" |
| `/deploy` | "Deploy this to staging" "Release to production" |
| `/update-docs` | "Sync all index files" |
| `/newgame` | "I'm starting a new game from this repo" |
| `/newmodule` | "New module" "Create module" "Add module" "Scaffold module" |

---

## Files

```
docs/factory/
├── index.md        # This file
├── research.md
├── compare.md
├── report.md
├── audit.md
├── review.md
├── naming.md
├── debug.md
├── plan.md
├── task.md
├── commit.md
├── update-docs.md
├── discover.md
├── execute.md
├── run-test.md
├── user-test.md
├── help.md
├── log.md
├── deploy.md
├── newgame.md
├── newmodule.md
└── templates/
    └── modules/
        ├── primitive.index.ts
        ├── primitive.defaults.ts
        ├── primitive.tuning.ts
        ├── primitive.renderer.pixi.ts
        ├── logic.index.ts
        ├── logic.defaults.ts
        ├── logic.tuning.ts
        ├── prefab.index.ts
        ├── prefab.defaults.ts
        ├── prefab.tuning.ts
        └── prefab.renderer.pixi.ts
```

---

## Creating New Commands

Add a `.md` file with this structure:

```markdown
## [emoji] Command Name

One-line description.

Constraints {
  - What NOT to do
}

Process {
  1. First step
  2. Second step
}

Output {
  Expected format
}
```
