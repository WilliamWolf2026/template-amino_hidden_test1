# Environment Configuration

> Multi-environment setup for local, QA, staging, and production deployments.

---

## Overview

The environment system provides automatic URL resolution and configuration based on deployment target. It's split into two layers:

| Layer | Location | Purpose |
|-------|----------|---------|
| **Scaffold** | `src/scaffold/config/` | Base CDN URLs, analytics (reusable across games) |
| **Game** | `src/game/config/` | Game-specific paths, asset versions |

---

## Quick Start

```typescript
import { getCdnUrl, getLevelsUrl, getEnvironment } from '~/game/config';

// Get current environment
const env = getEnvironment(); // 'local' | 'development' | 'qa' | 'staging' | 'production'

// Get URLs for current environment
const assetsUrl = getCdnUrl();   // e.g., '/assets/assets/v1' or 'https://media.wolf.games/games/citylines/assets/v1'
const levelsUrl = getLevelsUrl(); // e.g., '/assets/levels' or 'https://media.wolf.games/games/citylines/levels'
```

---

## Environment Detection

Set via `VITE_APP_ENV` environment variable:

```bash
# Local development (default if not set)
npm run dev

# With specific environment
VITE_APP_ENV=QA npm run dev
VITE_APP_ENV=Production npm run build
```

| `VITE_APP_ENV` | Environment | CDN Base URL |
|----------------|-------------|--------------|
| _(not set)_ | `local` | _(empty - relative paths)_ |
| `Development` | `development` | `https://media.dev.wolf.games` |
| `QA` | `qa` | `https://media.qa.wolf.games` |
| `Staging` | `staging` | `https://media.staging.wolf.games` |
| `Production` | `production` | `https://media.wolf.games` |

---

## URL Resolution

### Local Development

When `VITE_APP_ENV` is not set:

```
getCdnUrl()    → /assets/assets/v1
getLevelsUrl() → /assets/levels

?level=default → /assets/levels/default.json
?level=wonder  → /assets/levels/wonder.json
```

### Production

When `VITE_APP_ENV=Production`:

```
getCdnUrl()    → https://media.wolf.games/games/citylines/assets/v1
getLevelsUrl() → https://media.wolf.games/games/citylines/levels

?level=default → https://media.wolf.games/games/citylines/levels/default.json
?level=wonder  → https://media.wolf.games/games/citylines/levels/wonder.json
```

### Full URL Override

Full URLs always pass through unchanged:

```
?level=https://custom.cdn.com/test.json → https://custom.cdn.com/test.json
```

---

## Configuration Files

### Scaffold Config (`src/scaffold/config/environment.ts`)

Base configuration shared across all games:

```typescript
export const ENV_CONFIG: Record<Environment, EnvConfig> = {
  local: {
    url: '',  // Empty = relative paths
    posthog: { enabled: false, ... },
  },
  production: {
    url: 'https://media.wolf.games',
    posthog: { enabled: true, ... },
  },
  // ...
};
```

### Game Config (`src/game/config/environment.ts`)

Game-specific paths that extend scaffold config:

```typescript
const GAME_PATHS = {
  gamePath: 'games/citylines',      // Path on CDN
  assetVersion: 'v1',               // Asset version
  localAssetPath: '/assets/assets/v1',
  localLevelsPath: '/assets/levels',
};
```

**To configure for a new game**, only change `GAME_PATHS`:

```typescript
const GAME_PATHS = {
  gamePath: 'games/my-new-game',  // ← Change this
  assetVersion: 'v1',
  localAssetPath: '/assets/assets/v1',
  localLevelsPath: '/assets/levels',
};
```

---

## Available Functions

### From `~/game/config`

| Function | Returns | Description |
|----------|---------|-------------|
| `getEnvironment()` | `Environment` | Current environment name |
| `getCdnUrl()` | `string` | Full CDN URL for assets |
| `getLevelsUrl()` | `string` | Full URL for level manifests |
| `resolveLevelUrl(name)` | `string` | Resolve level name to full URL |
| `isLocal()` | `boolean` | Check if local development |
| `isProduction()` | `boolean` | Check if production |

### From `~/scaffold/config`

| Function | Returns | Description |
|----------|---------|-------------|
| `getEnvConfig()` | `EnvConfig` | Full config object for current env |
| `getCdnBaseUrl()` | `string` | Base CDN URL (without game path) |
| `getPosthogConfig()` | `PosthogConfig` | Analytics configuration |

---

## Analytics (Posthog)

Posthog is configured per environment:

```typescript
const config = getPosthogConfig();
// { enabled: true, key: '...', host: '...', platform: 'advance' }

if (config.enabled) {
  posthog.init(config.key, { api_host: config.host });
}
```

| Environment | Analytics Enabled |
|-------------|-------------------|
| local | ❌ No |
| development | ❌ No |
| qa | ✅ Yes |
| staging | ✅ Yes |
| production | ✅ Yes |

---

## Testing Different Environments

```bash
# Test with QA CDN (loads from media.qa.wolf.games)
VITE_APP_ENV=QA npm run dev

# Test with production CDN
VITE_APP_ENV=Production npm run dev

# Test specific level from CDN
# http://localhost:5173/?level=wonder-nj-2026
```

---

## Related Documentation

- **[Level Manifests](./unified-manifest-design.md)** - Level manifest format and loading
- **[Asset Pipeline](./asset-pipeline.md)** - Creating and deploying assets
