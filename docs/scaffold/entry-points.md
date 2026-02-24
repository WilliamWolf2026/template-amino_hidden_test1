# Entry Points

How the app boots — the three files at the root of `src/` and what each one does.

---

## Overview

SolidStart apps have three entry points that run at different stages:

```
Server:  entry-server.tsx  →  renders app.tsx  →  sends HTML to browser
Browser: entry-client.tsx  →  loads font + hydrates app.tsx  →  interactive app
```

| File | Runs On | Purpose |
|------|---------|---------|
| `entry-server.tsx` | Server (SSR) | HTML shell — `<head>`, viewport script, font preload |
| `entry-client.tsx` | Browser | Font loading + app hydration |
| `app.tsx` | Both | Root component — provider stack, screen routing, dev tools |

---

## entry-server.tsx — The HTML Shell

Runs **on the server** during SSR. Defines the raw HTML document that the browser receives before any JavaScript executes.

**What it contains:**

| Element | Purpose |
|---------|---------|
| `<meta charset>` | Character encoding |
| `<meta viewport>` | Mobile viewport config (`viewport-fit=cover`, no user scaling) |
| `<link rel="preload">` | Font preload to prevent FOUT (Flash of Unstyled Text) |
| `{assets}` | Framework-injected CSS/JS assets |
| Inline `<script>` | Sets `--dynamic-vh` CSS variable for mobile browser chrome |
| `<div id="app">` | Mount point for the Solid.js app |

### Dynamic Viewport Height

The inline script runs immediately (before any framework JS) to handle mobile browsers where the address bar changes the viewport height:

```javascript
var vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--dynamic-vh', vh + 'px');
```

This gives CSS access to `--dynamic-vh` which updates on resize and orientation change. Use `calc(var(--dynamic-vh, 1vh) * 100)` instead of `100vh` to get the real visible height on mobile.

### When to Edit

- **New game font**: Update the `<link rel="preload">` path to your WOFF2 file
- **New meta tags**: Add OpenGraph, favicon, etc. in the `<head>`
- **Never**: Remove the viewport script or viewport meta tag

---

## entry-client.tsx — The Client Bootstrap

Runs **in the browser** once JavaScript loads. Does two things in parallel:

### 1. Font Loading (FontFace API)

```typescript
const gameFont = new FontFace('Baloo', "url('/assets/fonts/Baloo-Regular.woff2')");
gameFont.load().then((loaded) => document.fonts.add(loaded));
```

Registers the game font with the browser's font system. This runs in parallel with app mount so the font is ready before any Pixi `Text` objects need it. The `<link rel="preload">` in entry-server already started downloading the file — this step just registers it as a usable font face.

### 2. App Hydration

```typescript
mount(() => <StartClient />, document.getElementById("app")!);
```

Takes the server-rendered HTML and "hydrates" it — attaching event listeners and making it interactive. After this, `app.tsx` takes over.

### When to Edit

- **New game font**: Update the `FontFace` constructor with your font name and path
- **Never**: Remove the `mount()` call

---

## app.tsx — The Root Component

The actual application component tree. Rendered by **both** server and client. This is where the scaffold provider stack lives.

### Provider Stack

The providers nest in a specific order (outer → inner):

```
GlobalBoundary          ← Error boundary (catches everything)
  TuningProvider        ← Live config system (dev tuning panel)
    ViewportModeWrapper ← Mobile viewport frame (small/large/none)
      PauseProvider     ← Pause/resume state
        ManifestProvider ← Level manifest loading
          AssetProvider  ← Asset loading (Pixi, Howler, DOM)
            ScreenProvider ← Screen routing (goto/back)
              ScreenRenderer ← Renders current screen
```

Each provider makes its hook available to everything nested inside it:
- `useTuning()` — available everywhere below `TuningProvider`
- `useAssets()` — available in screens (below `AssetProvider`)
- `useScreen()` — available in screens (below `ScreenProvider`)

### Dev-Only Features

Wrapped in `<Show when={IS_DEV_ENV}>`:
- **TuningPanel** — Press backtick (`` ` ``) to open live parameter editing
- **ViewportToggle** — Top-left button to cycle viewport modes (S/L/full)
- **Reset Progress** — In settings menu (top-right)

### Initialization (onMount)

Runs once on client after hydration:
1. **Sentry** — Error tracking (lazy-loaded)
2. **PostHog** — Analytics (if configured)
3. **Global error handlers** — Window-level error/rejection catching
4. **Pause keyboard** — Spacebar pause listener

### When to Edit

- **New game**: Update `gameDefaults` import in `TuningProvider`
- **New provider**: Add to the provider stack in the correct order
- **New dev tool**: Add inside `<Show when={IS_DEV_ENV}>`
- **Never**: Remove `GlobalBoundary`, `AssetProvider`, or `ScreenProvider`

---

## Boot Sequence (Timeline)

```
1. Server renders entry-server.tsx
   └── HTML shell with <head>, preloaded font, viewport script

2. Browser receives HTML
   └── Viewport script runs immediately (--dynamic-vh set)
   └── Font file starts downloading (from preload link)

3. JavaScript loads, entry-client.tsx runs
   ├── FontFace API registers font (parallel)
   └── mount() hydrates app.tsx (parallel)

4. app.tsx onMount fires
   ├── Sentry initialized
   ├── PostHog initialized
   ├── Error handlers attached
   └── Pause keyboard listener attached

5. ScreenProvider renders initial screen (loading)
   └── Game begins
```

---

## Per-Game Changes

When creating a new game, these are the only entry point changes needed:

| File | Change | Why |
|------|--------|-----|
| `entry-server.tsx` | Update font `<link>` path | Preload your game's font |
| `entry-client.tsx` | Update `FontFace` name and URL | Register your game's font |
| `app.tsx` | Update `gameDefaults` import | Point to your tuning defaults |

Everything else (screens, assets, audio) is configured through [game/config.ts](../../src/game/config.ts) and the scaffold provider stack handles the rest.

---

## Related

- [Architecture](architecture.md) — Full system architecture diagram
- [Context Map](context-map.md) — Dependency relationships
- [Creating a New Game](../guides/getting-started/new-game.md) — Step-by-step setup
- [Viewport Mode](systems/viewport-mode.md) — Desktop preview frame modes
