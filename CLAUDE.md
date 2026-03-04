# Claude Code Project Context

## Quick Context — Amino Architecture

```
src/
  core/   ← framework shell (providers, hooks, systems, dev tools) — DO NOT EDIT
  modules/    ← reusable building blocks (primitives, logic, prefabs)
  game/       ← game code (config, screens, proprietary game logic)
```

**Dependency rules:**
```
core/  →  no deps on modules/ or game/
modules/   →  can import from core/
game/      →  can import from core/ + modules/
app.tsx    →  can import from all three
```

**Tier indexes:** Read the INDEX.md in each tier for intent → path routing:
- `src/core/INDEX.md` — what the framework provides
- `src/modules/INDEX.md` — what modules exist + placement rules
- `src/game/INDEX.md` — game contents + where to put new files

**Doc index:** [docs/INDEX.md](docs/INDEX.md) — flat routing table for all docs & factory commands

## Where to Put New Code

| What you're building | Where it goes |
|---------------------|---------------|
| Single-purpose reusable component | `src/modules/primitives/<name>/` |
| Pure logic, no rendering | `src/modules/logic/<name>/` |
| Assembled from multiple primitives | `src/modules/prefabs/<name>/` |
| Game screen | `src/game/screens/` |
| Game mechanic / controller | `src/game/<game-name>/` |
| Game state signals | `src/game/state.ts` |
| Game tuning values | `src/game/tuning/` |
| Module configuration for a game | `src/game/setup/` |
| Framework system / provider | `src/core/systems/` (admin only) |

## Coding Standards & Docs

Before making changes, consult the relevant files in:
- `ai/rules/` — coding standards, review guidelines, JS/TS patterns, UI rules
- `docs/INDEX.md` — find any doc by intent (read this first)
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
| `/deploy` | Deploy to QA/staging/production |
| `/newgame` | Setup checklist for forking to a new game |
| `/newmodule` | Create a new module in modules/ |

## File Permissions

| Folder | Read | Edit |
|--------|:----:|:----:|
| `src/game/` | Yes | Yes |
| `src/modules/` | Yes | Yes |
| `src/core/` | Yes | **No** |
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
  core/       # Framework shell — DO NOT EDIT
    systems/      # Assets, audio, screens, tuning, pause, errors, vfx, manifest
    config/       # Environment, viewport
    ui/           # Button, Spinner, Logo, MobileViewport, ViewportToggle
    dev/          # TuningPanel, Tweakpane
    utils/        # Storage, SettingsMenu
    lib/          # PostHog, Sentry, GameKit
    analytics/    # Event schemas
  modules/        # Reusable building blocks
    primitives/   # SpriteButton, DialogueBox, CharacterSprite, ProgressBar
    logic/        # LevelCompletionController
    prefabs/      # AvatarPopup
  game/           # Game-specific — EDITABLE
    config/       # Identity, fonts, environment
    setup/        # AnalyticsContext, FeatureFlagContext
    screens/      # Solid.js screens (Loading, Start, Game, Results)
    services/     # Progress, catalog, loader
    audio/        # GameAudioManager, sounds
    tuning/       # Game tuning types & defaults
    citylines/    # CityLines game mode
    dailydispatch/ # DailyDispatch game mode
docs/
  factory/        # Reusable commands
  core/       # Framework docs
  game/           # Game docs
  guides/         # How-to guides
public/
  levels/         # Level JSON configs
ai/
  rules/          # Coding standards — DO NOT EDIT
```

## Common Tasks

```bash
bun run dev        # Development server
bun run typecheck  # Type check
bun run build      # Production build
```
