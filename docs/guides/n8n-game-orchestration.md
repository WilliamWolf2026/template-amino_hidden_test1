# n8n Game Orchestration

How to wire an n8n workflow that takes a game prompt, generates a game using this scaffold, and deploys it to Vercel.

---

## Architecture Overview

```
User Prompt ("Make a word puzzle game")
        │
        ▼
┌──────────────────┐
│  n8n Workflow     │
├──────────────────┤
│                   │
│  1. Fork Repo     │──► GitHub API: create repo from template
│  2. Configure     │──► Claude API: generate config + game logic
│  3. Build         │──► GitHub Actions or Vercel: build
│  4. Deploy        │──► Vercel API: deploy static site
│  5. Notify        │──► Webhook / Slack / Email
│                   │
└──────────────────┘
```

---

## Prerequisites

| Service | What you need |
|---------|--------------|
| **GitHub** | Personal access token with `repo` scope |
| **Claude API** | API key (claude-sonnet-4-6 recommended for code gen) |
| **Vercel** | API token + team ID |
| **n8n** | Self-hosted or cloud instance |

---

## Workflow Steps

### Step 1: Fork / Clone the Scaffold

Use the GitHub API to create a new repo from this template.

**n8n Node**: HTTP Request

```
POST https://api.github.com/repos/{owner}/scaffold-production/generate
Authorization: Bearer {GITHUB_TOKEN}
Content-Type: application/json

{
  "owner": "{target_org}",
  "name": "{game-slug}",
  "description": "Generated game: {game_name}",
  "private": true
}
```

**Output**: `repo_url`, `clone_url`

---

### Step 2: Generate Game Identity

Use Claude API to produce the game config values from the user's prompt.

**n8n Node**: HTTP Request (Claude API)

```
POST https://api.anthropic.com/v1/messages
x-api-key: {CLAUDE_API_KEY}
anthropic-version: 2023-06-01
Content-Type: application/json

{
  "model": "claude-sonnet-4-6-20250514",
  "max_tokens": 4096,
  "system": "You generate game configuration for a SolidJS + PixiJS game scaffold. Output valid JSON only, no markdown.",
  "messages": [{
    "role": "user",
    "content": "Generate game config for: {user_prompt}\n\nReturn JSON with these fields:\n- game_id: analytics tag (snake_case)\n- game_slug: URL-safe (lowercase, no spaces)\n- game_name: human-readable display name\n- game_font: font family string\n- background_color: hex color for start screen\n- description: one-line game description\n- screens: array of screen names needed\n- tuning_params: object of game-specific tuning parameters with defaults"
  }]
}
```

**Output**: Game identity JSON

---

### Step 3: Generate Game Logic

Use Claude API with the scaffold context to generate the actual game code.

**n8n Node**: HTTP Request (Claude API)

**System prompt** (give Claude the scaffold contract):

```
You are generating game code for a SolidJS + PixiJS scaffold.

## Scaffold Contract

The game must export from src/game/:
- config.ts: GAME_ID, GAME_SLUG, GAME_NAME, manifest, gameConfig
- state.ts: game runtime signals
- index.ts: barrel export of config + state
- tuning/types.ts: GameTuning interface + GAME_DEFAULTS
- mygame/screens/gameController.ts: setupGame(deps) → { init, destroy, ariaText }
- mygame/screens/startView.ts: setupStartScreen(deps) → { init, destroy, backgroundColor }

## gameController.ts Contract

export function setupGame(deps: {
  coordinator: AssetCoordinator;
  tuning: { scaffold: ScaffoldTuning; game: GameTuning };
  audio: unknown;
  gameData: unknown;
  analytics: unknown;
}): {
  init: (container: HTMLDivElement) => void;
  destroy: () => void;
  ariaText: () => string;
}

## startView.ts Contract

export function setupStartScreen(deps: {
  goto: (screen: string) => void;
  coordinator: AssetCoordinator;
  initGpu: () => Promise<void>;
  unlockAudio: () => void;
  loadCore: (onProgress?: (p: number) => void) => Promise<void>;
  loadAudio: (onProgress?: (p: number) => void) => Promise<void>;
  tuning: { scaffold: ScaffoldTuning; game: GameTuning };
  analytics: { trackGameStart: () => void };
}): {
  init: (container: HTMLDivElement) => void;
  destroy: () => void;
  backgroundColor: string;
}

## Rules
- Use Pixi.js v8 for rendering (import from 'pixi.js')
- Use GSAP for animations (import gsap from 'gsap')
- DOM elements for UI overlays are fine
- The container is an HTMLDivElement — mount your Pixi app to it
- Clean up everything in destroy()
- Keep it simple — working game > feature-complete game
```

**User message**: Generate the game logic files for: `{user_prompt}`

Return as JSON with file paths as keys and file contents as values.

**Output**: Object mapping file paths to file contents

---

### Step 4: Write Files to Repo

Push the generated files to the GitHub repo.

**n8n Node**: HTTP Request (GitHub API) — for each file:

```
PUT https://api.github.com/repos/{owner}/{repo}/contents/{path}
Authorization: Bearer {GITHUB_TOKEN}

{
  "message": "feat: generate {game_name} game logic",
  "content": "{base64_encoded_content}",
  "branch": "main"
}
```

**Files to write** (minimum):

| Path | Source |
|------|--------|
| `src/game/config.ts` | Generated (Step 2 identity + scaffold template) |
| `src/game/state.ts` | Generated or template |
| `src/game/index.ts` | Template (barrel export) |
| `src/game/tuning/types.ts` | Generated (Step 2 tuning_params) |
| `src/game/tuning/index.ts` | Template |
| `src/game/mygame/screens/gameController.ts` | Generated (Step 3) |
| `src/game/mygame/screens/startView.ts` | Generated (Step 3) |
| `src/game/mygame/index.ts` | Template (barrel) |
| `wolf-game-kit.json` | Generated identity |

---

### Step 5: Deploy to Vercel

**Option A: Vercel Git Integration** (recommended)

Connect the repo to Vercel — it auto-deploys on push.

```
POST https://api.vercel.com/v9/projects
Authorization: Bearer {VERCEL_TOKEN}

{
  "name": "{game-slug}",
  "framework": "vite",
  "gitRepository": {
    "type": "github",
    "repo": "{owner}/{game-slug}"
  },
  "buildCommand": "bun run build",
  "outputDirectory": "dist",
  "installCommand": "bun install",
  "environmentVariables": [
    { "key": "VITE_APP_ENV", "value": "Production", "target": ["production"] },
    { "key": "VITE_APP_ENV", "value": "Development", "target": ["preview"] }
  ]
}
```

**Option B: Direct Deploy** (no git integration)

Build locally and upload the dist folder.

```bash
# In the n8n Execute Command node:
cd /tmp/{game-slug}
git clone {clone_url} .
bun install
VITE_APP_ENV=Production bun run build

# Upload to Vercel
vercel deploy --prod --token={VERCEL_TOKEN}
```

**Output**: `deployment_url`

---

### Step 6: Validate

**n8n Node**: HTTP Request

```
GET {deployment_url}
```

Check for 200 status. Optionally use a headless browser node to screenshot the deployed game.

---

### Step 7: Notify

Send the deployment URL back to the user via webhook, Slack, or email.

---

## Complete n8n Workflow JSON Structure

```
Trigger (Webhook / Chat)
  │
  ├─► Set Variables (parse prompt, generate slug)
  │
  ├─► GitHub: Create Repo from Template
  │
  ├─► Claude: Generate Game Identity (config values)
  │
  ├─► Claude: Generate Game Logic (gameController, startView)
  │
  ├─► GitHub: Write Files (loop over generated files)
  │
  ├─► Vercel: Create Project + Deploy
  │
  ├─► HTTP: Validate Deployment (GET → 200?)
  │
  └─► Notify: Send URL to user
```

---

## Files That Must Change Per Game

These are the **only** files the n8n workflow needs to generate or modify. Everything else comes from the scaffold template.

| File | What changes |
|------|-------------|
| `src/game/config.ts` | GAME_ID, GAME_SLUG, GAME_NAME, GAME_FONT_FAMILY |
| `src/game/state.ts` | Game-specific state signals (score, level, etc.) |
| `src/game/tuning/types.ts` | GameTuning interface, GAME_DEFAULTS |
| `src/game/mygame/screens/gameController.ts` | Game logic + Pixi rendering |
| `src/game/mygame/screens/startView.ts` | Start screen UI + play button |
| `wolf-game-kit.json` | projectId, gameSlug, gameName |

**Everything else** (core/, modules/, screens/, setup/, audio/) works out of the box from the template.

---

## Template Files (copy as-is from scaffold)

These files in the scaffold are already game-agnostic skeletons. The n8n workflow should NOT modify them:

- `src/game/screens/LoadingScreen.tsx` — generic loading flow
- `src/game/screens/StartScreen.tsx` — calls setupStartScreen()
- `src/game/screens/GameScreen.tsx` — calls setupGame()
- `src/game/screens/ResultsScreen.tsx` — generic results
- `src/game/setup/AnalyticsContext.tsx` — analytics skeleton
- `src/game/setup/FeatureFlagContext.tsx` — feature flag skeleton
- `src/game/audio/` — audio manager skeleton
- `src/app.tsx` — provider stack (never touch)

---

## Prompt Engineering Tips

For the Claude API call that generates game logic, include these in the system prompt:

1. **Keep scope small** — a working simple game beats a broken complex one
2. **Use DOM for UI** — the container is an HTMLDivElement, DOM elements are fine for buttons/text
3. **Use Pixi for rendering** — game entities, sprites, animations go through Pixi
4. **Clean up in destroy()** — kill GSAP tweens, remove DOM elements, destroy Pixi app
5. **The start screen pattern** — init() receives a container div, build UI, wire play button to `deps.goto('game')`
6. **The game controller pattern** — init() receives a container div, create Pixi.Application, mount to container, run game loop

---

## Environment Variables for n8n

| Variable | Where to set |
|----------|-------------|
| `GITHUB_TOKEN` | n8n credentials |
| `CLAUDE_API_KEY` | n8n credentials |
| `VERCEL_TOKEN` | n8n credentials |
| `VERCEL_TEAM_ID` | n8n workflow variable (optional) |
| `TEMPLATE_OWNER` | n8n workflow variable (e.g. `wolfgames`) |
| `TEMPLATE_REPO` | n8n workflow variable (e.g. `scaffold-production`) |

---

## Limitations & Considerations

- **No asset generation** — the workflow generates code only, not sprites/audio. Games will use DOM/canvas rendering or placeholder assets.
- **Single-shot generation** — Claude generates the game in one pass. For iteration, you'd add a feedback loop (deploy → screenshot → Claude reviews → regenerate).
- **Build errors** — if Claude's generated code doesn't compile, the Vercel build fails. Add a validation step that runs `bun run build` before deploying.
- **Pixi complexity** — simple games (clickers, puzzles, card games) work well. Physics-heavy or sprite-atlas-dependent games need more setup.
- **Rate limits** — Claude API has rate limits. For batch generation, add delays between requests.
