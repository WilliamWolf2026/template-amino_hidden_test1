# Claude Code Project Context

## Quick Context

```
app.tsx ──► scaffold/ (providers, hooks, UI)
        └─► game/ (screens, audio, tuning, citylines/)

Scaffold provides: useAssets, useScreen, useTuning, useAudio, BaseAudioManager
Game extends: screens/, audio/manager.ts, tuning/types.ts, citylines/
```

**Full context map:** [docs/scaffold/context-map.md](docs/scaffold/context-map.md)

## Coding Standards & Docs

Before making changes, consult the relevant files in:
- `ai/rules/` — coding standards, review guidelines, JS/TS patterns, UI rules
- `docs/` — game design, architecture, guides, animation patterns, asset pipeline

## Factory (Common Workflows)

See **[docs/factory/](docs/factory/index.md)** for reusable commands.

| Command | Purpose |
|---------|---------|
| `/research` | Investigate without code changes |
| `/compare` | Compare solutions with trade-offs |
| `/report` | Generate documentation |
| `/audit` | Systematic codebase review |
| `/debug` | Find bug root cause |
| `/review` | Code quality review |
| `/naming` | Asset naming convention |
| `/commit` | Git commit |

## File Permissions

| Folder | Read | Edit |
|--------|:----:|:----:|
| `src/game/` | Yes | Yes |
| `src/scaffold/` | Yes | **No** |
| `docs/` | Yes | Yes |
| `public/levels/` | Yes | Yes |
| `ai/` | Yes | **No** |

**Switch modes:** See [.claude/README.md](.claude/README.md)
```bash
cp .claude/settings.admin.json .claude/settings.local.json      # Admin
cp .claude/settings.restricted.json .claude/settings.local.json # Safe
cp CLAUDE.lite.md CLAUDE.md                                      # Lite (no rules/docs)
```

## Tech Stack

- **Framework**: Solid.js + Vite
- **Rendering**: Pixi.js v8
- **Animation**: GSAP
- **Audio**: Howler.js
- **Styling**: Tailwind CSS

## Project Structure

```
src/
  scaffold/     # Reusable framework (DO NOT EDIT)
  game/         # Game-specific (EDITABLE)
    citylines/  # Core game logic
    screens/    # Solid.js screens
    audio/      # GameAudioManager
docs/
  factory/      # Reusable commands
  scaffold/     # Framework docs
  game/         # Game docs
  guides/       # How-to guides
public/
  levels/       # Level JSON configs
ai/
  rules/        # Coding standards (DO NOT EDIT)
```

## Common Tasks

```bash
bun run dev        # Development server
bun run typecheck  # Type check
bun run build      # Production build
```
