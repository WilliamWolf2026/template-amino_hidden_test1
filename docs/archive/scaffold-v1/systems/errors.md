# Error Handling

Layered error boundaries with Sentry and PostHog integration.

## Overview

The scaffold provides three layers of error boundaries, each handling different scopes of failure.

## Error Boundary Layers

```
┌─────────────────────────────────────────────────┐
│  GlobalBoundary                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  ScreenBoundary                           │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  AssetBoundary                      │  │  │
│  │  │                                     │  │  │
│  │  │     Component Tree                  │  │  │
│  │  │                                     │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### GlobalBoundary

Catches unhandled errors at the application level.

```typescript
import { GlobalBoundary } from '~/scaffold/systems/errors';

function App() {
  return (
    <GlobalBoundary>
      <RestOfApp />
    </GlobalBoundary>
  );
}
```

**Recovery:** Full page reload button.

### ScreenBoundary

Catches errors within a specific screen.

```typescript
import { ScreenBoundary } from '~/scaffold/systems/errors';

function GameScreen() {
  return (
    <ScreenBoundary screenId="game">
      <GameContent />
    </ScreenBoundary>
  );
}
```

**Recovery:** Retry current screen or return to menu.

### AssetBoundary

Catches asset loading failures.

```typescript
import { AssetBoundary } from '~/scaffold/systems/errors';

function LoadingScreen() {
  return (
    <AssetBoundary bundleName="core-ui">
      <AssetLoadingLogic />
    </AssetBoundary>
  );
}
```

**Recovery:** Retry loading or skip non-critical assets.

## Error Types

```typescript
type ErrorSeverity = 'fatal' | 'error' | 'warning';

interface GameError {
  message: string;
  severity: ErrorSeverity;
  context?: {
    screen?: string;
    boundary?: string;
    bundle?: string;
  };
}
```

## Sentry Integration

Errors are automatically reported to Sentry with context:

```typescript
// src/scaffold/lib/sentry.ts
import * as Sentry from '@sentry/solid';

export function initSentry(dsn: string) {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
  });
}
```

### Manual Reporting

```typescript
import { reportError } from '~/scaffold/systems/errors';

try {
  riskyOperation();
} catch (error) {
  reportError(error, {
    severity: 'error',
    context: { screen: 'game', action: 'loadLevel' },
  });
}
```

## PostHog Integration

Error events are also tracked in PostHog for analytics:

```typescript
// src/scaffold/lib/posthog.ts
import posthog from 'posthog-js';

export function initPostHog(apiKey: string, apiHost: string) {
  posthog.init(apiKey, { api_host: apiHost });
}

// Track error events
posthog.capture('error_occurred', {
  error_type: 'asset_load_failed',
  bundle: 'core-ui',
});
```

## Configuration

Configure error tracking in `src/scaffold/config.ts`:

```typescript
export const scaffoldConfig = {
  sentry: {
    dsn: 'https://xxx@sentry.io/xxx',
  },
  posthog: {
    apiKey: 'phc_xxx',
    apiHost: 'https://app.posthog.com',
  },
};
```

## Custom Error Boundaries

Create game-specific boundaries:

```typescript
import { ErrorBoundary } from 'solid-js';
import { reportError } from '~/scaffold/systems/errors';

function CustomBoundary(props: { children: JSXElement }) {
  return (
    <ErrorBoundary
      fallback={(err, reset) => {
        reportError(err, { context: { custom: true } });
        return (
          <div>
            <p>Something went wrong</p>
            <button onClick={reset}>Try Again</button>
          </div>
        );
      }}
    >
      {props.children}
    </ErrorBoundary>
  );
}
```

## Error Recovery Patterns

### Retry with Backoff

```typescript
async function loadWithRetry(fn: () => Promise<void>, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await fn();
      return;
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await delay(attempt * 1000); // Backoff
    }
  }
}
```

### Graceful Degradation

```typescript
async function loadOptionalBundle(bundleName: string) {
  try {
    await coordinator.loadBundle(bundleName);
  } catch (error) {
    console.warn(`Optional bundle ${bundleName} failed to load`);
    // Continue without it
  }
}
```

## See Also

- [Architecture](../architecture.md) — Provider hierarchy
- [Configuration](../../guides/configuration.md) — Sentry/PostHog setup
- [Sentry Docs](https://docs.sentry.io/platforms/javascript/guides/solid/)
