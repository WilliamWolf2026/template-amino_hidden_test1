# Claude Code Project Context

## AI-Driven Development (AIDD)

This project uses AI-assisted development patterns. See the `ai/` folder:

- **[ai/commands/](ai/commands/index.md)** - Available commands (commit, plan, review, task, etc.)
- **[ai/rules/](ai/rules/index.md)** - Coding standards and patterns

Key commands:
- `/plan` - Create implementation plans
- `/task` - Execute tasks with tracking
- `/review` - Code review
- `/commit` - Commit with conventional format

## Documentation

Project documentation lives in `docs/`:

- **[docs/README.md](docs/README.md)** - Documentation index
- **[docs/game/gdd.md](docs/game/gdd.md)** - Game Design Document
- **[docs/scaffold/](docs/scaffold/)** - Framework architecture and systems

### Quick Reference

| Topic | Location |
|-------|----------|
| Game Design Doc | `docs/game/gdd.md` |
| Architecture | `docs/scaffold/architecture.md` |
| Asset pipeline | `docs/guides/asset-pipeline.md` |
| Audio setup | `docs/guides/audio-setup.md` |
| SFX audit guide | `src/game/docs/sound-effects-guide.md` |
| Audio spec | `docs/audio/audio-spec.json` |

## Tech Stack

- **Framework**: Solid.js + Vite
- **Rendering**: Pixi.js v8
- **Animation**: GSAP
- **Audio**: Howler.js
- **Styling**: Tailwind CSS

## Project Structure

```
src/
  scaffold/     # Reusable game framework (engine-agnostic)
  game/         # Game-specific implementation
    <game>/     # Core game logic (e.g., citylines/, wordgame/)
    screens/    # Solid.js screens (Loading, Start, Game, Results)
    audio/      # GameAudioManager
docs/           # Project documentation
ai/             # AIDD commands and rules
```

The `<game>/` folder name varies per project (e.g., `citylines/`, `wordgame/`).

## Common Tasks

**Run development server:**
```bash
bun run dev
```

**Type check:**
```bash
bun run typecheck
```

**Build:**
```bash
bun run build
```
