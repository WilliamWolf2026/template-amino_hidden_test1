# Claude Settings

## Permission Modes

| Mode | File | Description |
|------|------|-------------|
| **Restricted** | `settings.restricted.json` | Protects `scaffold/` and `ai/` |
| **Admin** | `settings.admin.json` | Full access to everything |

## Quick Switch

```bash
# Admin mode (allow everything)
cp .claude/settings.admin.json .claude/settings.local.json

# Restricted mode (safe)
cp .claude/settings.restricted.json .claude/settings.local.json
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
