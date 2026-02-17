# Claude Code Project Context

## Quick Context

```
app.tsx ──► scaffold/ (providers, hooks, UI, viewport config)
        └─► game/ (screens, audio, tuning, shared/, citylines/)

Scaffold provides: useAssets, useScreen, useTuning, useAudio, BaseAudioManager, viewport config
Game shared/: SpriteButton, ProgressBar, DialogueBox, CharacterSprite, AvatarPopup, LevelCompletionController
Game extends: screens/, audio/manager.ts, tuning/types.ts, citylines/
```

**Full context map:** [docs/scaffold/context-map.md](docs/scaffold/context-map.md)
**Doc index:** [docs/doc-index.md](docs/doc-index.md) — flat routing table for all docs & factory commands

## Coding Standards & Docs

Before making changes, consult the relevant files in:
- `ai/rules/` — coding standards, review guidelines, JS/TS patterns, UI rules
- `docs/doc-index.md` — find any doc by intent (read this first)
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
| `/newgame` | Setup checklist for forking to a new game |

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
    config/     # Viewport constraints
  game/         # Game-specific (EDITABLE)
    shared/     # Reusable components & controllers (game-level)
    citylines/  # Core game logic (wraps shared/ with game config)
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
