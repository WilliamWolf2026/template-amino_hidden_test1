# Viewport Mode System

Configurable desktop viewport constraint for previewing the game at different screen sizes.

## Overview

On desktop, the game renders inside a constrained mobile-sized frame via the `MobileViewport` core component. The viewport mode system lets developers toggle between three sizes without touching code.

| Mode | Max Width | Frame | Description |
|------|-----------|-------|-------------|
| `small` | 430px | Phone bezel | iPhone 14 Pro Max (default) |
| `large` | 768px | Tablet bezel | iPad Mini portrait |
| `none` | Full window | No frame | Unconstrained desktop |

On actual mobile devices or narrow viewports (<=768px), the game always renders full-screen regardless of mode.

## Architecture

The viewport mode lives in **core tuning** (`ScaffoldTuning.viewport.mode`) and follows the standard override chain:

```
SCAFFOLD_DEFAULTS          (hardcoded baseline: 'small')
  -> gameConfig            (game config default, set per-game in src/game/)
    -> localStorage        (persisted when changed via TweakPane or toggle)
      -> ?viewport= param  (session-only URL override)
```

### Key files

| File | Role |
|------|------|
| `src/core/systems/tuning/types.ts` | `ViewportMode` type, `ViewportConfig` interface, `SCAFFOLD_DEFAULTS` |
| `src/core/config/viewport.ts` | `getViewportModeFromUrl()` URL param parser |
| `src/core/dev/bindings.ts` | TweakPane dropdown binding for mode selection |
| `src/game/config.ts` | `GameConfig.defaultViewportMode` -- per-game default |
| `src/app.tsx` | `ViewportModeWrapper` -- reads tuning and configures `MobileViewport` |
| `src/core/ui/ViewportToggle.tsx` | Dev-only toggle button (top-left corner) |

## Usage

### URL parameter

```
http://localhost:3000/?viewport=large
http://localhost:3000/?viewport=none
http://localhost:3000/?viewport=small
```

Session-only -- does not persist to localStorage.

### TweakPane (dev mode)

1. Press backtick (`` ` ``) to open TweakPane
2. Expand **Core > Viewport**
3. Select mode from the dropdown: Small (430px) / Large (768px) / None (full)
4. Change is auto-saved to localStorage

### Toggle button (dev mode)

The `ViewportToggle` component lives at `src/core/ui/ViewportToggle.tsx` and renders a small button in the top-left corner that cycles through modes on click:
- **S** = small
- **L** = large
- **∞** = none

It is mounted in `app.tsx` inside a dev-only `<Show>` guard:

```tsx
// src/app.tsx
import { ViewportToggle } from '~/core/ui/ViewportToggle';

<Show when={IS_DEV_ENV}>
  <div class="fixed top-2 left-2 z-[9999]">
    <ViewportToggle />
  </div>
</Show>
```

### Game config default

Each game sets its preferred default in `src/game/config.ts`:

```ts
export const gameConfig: GameConfig = {
  screens: { ... },
  initialScreen: 'loading',
  defaultViewportMode: 'small',  // or 'large' or 'none'
  serverStorageUrl: null,
};
```

This is applied on first load. Once a developer changes the mode (via TweakPane or toggle), the localStorage value takes precedence.

## How it works

`ViewportModeWrapper` in `app.tsx` reads `tuning.scaffold.viewport.mode` and renders:

- **`small`** -- `<MobileViewport>` (430px max, 9:16 aspect, phone frame)
- **`large`** -- `<MobileViewport maxWidth={768}>` (768px max, 9:16 aspect, tablet frame)
- **`none`** -- plain `<div class="fixed inset-0">` (no constraint, no frame)

The Pixi.js game canvas auto-resizes to its container (`resizeTo: containerRef`), and `CityLinesGame.autoSizeToViewport()` recalculates tile sizes on every resize event. This means switching modes triggers a smooth resize -- no reload required.
