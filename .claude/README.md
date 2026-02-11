# Claude Settings

## Permission Modes

| Mode | File | Description |
|------|------|-------------|
| **Restricted** | `settings.restricted.json` | Protects `scaffold/` and `ai/` |
| **Admin** | `settings.admin.json` | Full access to everything |

## Context Modes

| Mode | File | Description |
|------|------|-------------|
| **Full** | `CLAUDE.md` (default) | Coding standards + doc triggers from `ai/rules/` and `docs/` |
| **Lite** | `CLAUDE.lite.md` | Minimal context, no rule/doc references |

## Quick Switch

```bash
# Admin mode (allow everything)
cp .claude/settings.admin.json .claude/settings.local.json

# Restricted mode (safe)
cp .claude/settings.restricted.json .claude/settings.local.json

# Lite context (strip coding standards + doc triggers)
cp CLAUDE.lite.md CLAUDE.md

# Full context (restore coding standards + doc triggers)
git checkout CLAUDE.md
```

**Restart Claude Code after switching.**

## Current Settings

`settings.local.json` is the active file.

### Restricted Mode Allows:
- Edit: `src/game/**`, `docs/**`, `public/levels/**`
- Read: everything
- Bash: git, bun, npm, tsc

### Restricted Mode Blocks:
- Edit: `src/scaffold/**`, `ai/**`

### Admin Mode:
- Everything allowed
