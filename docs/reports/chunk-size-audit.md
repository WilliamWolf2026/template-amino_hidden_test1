# Chunk Size Audit

Bundle analysis and optimization history for City Lines.

Build tool: Vite 6.4 via Vinxi (SolidStart)

---

## Current State

Main chunk: **101 KB raw / 34 KB gzipped**

### JavaScript Chunks

| Chunk | Raw | Gzipped | Loading | Contents |
|-------|----:|--------:|---------|----------|
| `client-*.js` | 101 KB | 34 KB | Entry | Scaffold + LoadingScreen + ResultsScreen + solid-js |
| `GameScreen-*.js` | 91 KB | 28 KB | Lazy | Game screen + citylines logic |
| `StartScreen-*.js` | 9 KB | 4 KB | Lazy | Start screen |
| `index-*.js` (sentry) | 414 KB | 137 KB | Lazy | @sentry/browser (loaded on init) |
| `index-*.js` (pixi core) | 199 KB | 61 KB | Lazy | pixi.js static core |
| `module-*.js` (posthog) | 171 KB | 56 KB | Lazy | posthog-js (loaded when API key set) |
| `tweakpane-*.js` | 152 KB | 32 KB | Lazy | Dev-only tuning panel |
| `gsap-*.js` | 70 KB | 28 KB | Import | GSAP animation library |
| `WebGLRenderer-*.js` | 64 KB | 18 KB | Lazy | Pixi WebGL renderer |
| `webworkerAll-*.js` | 56 KB | 15 KB | Lazy | Pixi web worker support |
| `SharedSystems-*.js` | 55 KB | 15 KB | Lazy | Pixi shared systems |
| `browserAll-*.js` | 43 KB | 11 KB | Lazy | Pixi browser extensions |
| `WebGPURenderer-*.js` | 37 KB | 10 KB | Lazy | Pixi WebGPU renderer |
| `pixi-*.js` | 33 KB | 11 KB | Lazy | Pixi GPU loader |
| `audio-*.js` | 37 KB | 10 KB | Import | Howler audio library |
| `vendor-*.js` | 21 KB | 8 KB | Import | earcut, eventemitter3, tiny-lru, etc. |
| `fonts-*.js` | 16 KB | 5 KB | Lazy | Font utilities |
| `NineSliceGeometry-*.js` | 13 KB | 4 KB | Lazy | Pixi nine-slice |
| `BitmapFontManager-*.js` | 11 KB | 4 KB | Lazy | Pixi bitmap fonts |
| `Filter-*.js` | 2 KB | 1 KB | Lazy | Pixi filter base |
| `colorToUniform-*.js` | 2 KB | 1 KB | Lazy | Pixi color utility |

### Other Assets

| Asset | Size | Notes |
|-------|-----:|-------|
| `client-*.css` | 27 KB (5.6 KB gz) | Tailwind output |
| `Baloo-Regular.woff2` | 151 KB | Primary (preloaded) |
| `Baloo-Regular.ttf` | 615 KB | Fallback only |

### Critical Path

The initial page load only downloads the entry chunk + CSS:

1. Entry: ~34 KB gz
2. CSS: ~6 KB gz
3. **Total initial load: ~40 KB gzipped**

Everything else (pixi, game screens, observability) loads lazily as needed.

---

## Optimization History

### Round 1: Manual chunk splitting + WOFF2 font

**Main chunk: 979 KB / 301 KB gz → 874 KB / 264 KB gz**

Changes:
1. Extracted GSAP and Howler into separate cacheable chunks via `manualChunks`
2. Converted TTF font (615 KB) to WOFF2 (151 KB)

### Round 2: Lazy observability + vendor extraction + lazy screens

**Main chunk: 874 KB / 264 KB gz → 101 KB / 34 KB gz**

Changes:
1. **Sentry → dynamic import** (-64 KB gz) — `src/core/lib/sentry.ts` loads `@sentry/browser` via `await import()` only when DSN is configured and environment is enabled
2. **PostHog → dynamic import** (-18 KB gz) — `src/core/lib/posthog.ts` loads `posthog-js` via `await import()` only when API key is provided
3. **Tweakpane → dynamic import** (-28 KB gz) — Both `src/core/dev/TuningPanel.tsx` and `src/core/dev/Tweakpane.tsx` load tweakpane via `await import()` inside `onMount`, dev-only
4. **Vendor chunk** (-6 KB gz) — Extracted earcut, eventemitter3, tiny-lru, parse-svg-path, @pixi/colord into a `vendor` chunk via `manualChunks`
5. **Lazy game screens** (-96 KB gz) — StartScreen and GameScreen use Solid `lazy()` in `src/game/config.ts`, wrapped in `<Suspense>` in ScreenRenderer. This moves pixi.js core and all game-specific code out of the entry chunk

### Summary

| Metric | Original | Round 1 | Round 2 |
|--------|----------|---------|---------|
| Main chunk (gz) | 301 KB | 264 KB | **34 KB** |
| Font download | 615 KB | 151 KB | 151 KB |
| First load (gz) | ~999 KB | ~535 KB | **~40 KB** |

**Total reduction: 301 KB → 34 KB gzipped (89% smaller main chunk)**

---

## Architecture

### What's in the entry chunk

- solid-js (~10 KB gz) — UI framework, required everywhere
- @solidjs/start + vinxi (~2 KB gz) — SPA bootstrap
- src/core (~15 KB gz) — providers, hooks, UI components
- LoadingScreen (~2 KB gz) — no pixi dependency
- ResultsScreen (~1 KB gz) — minimal UI
- Shared game config/services (~4 KB gz)

### Lazy loading strategy

| Content | Trigger | Method |
|---------|---------|--------|
| StartScreen + pixi core | `goto('start')` from LoadingScreen | Solid `lazy()` |
| GameScreen + game logic | `goto('game')` from StartScreen | Solid `lazy()` |
| Pixi GPU renderers | First GPU asset load | Dynamic `import()` in asset loader |
| Sentry | `onMount` in App (if DSN configured) | Dynamic `import()` |
| PostHog | `onMount` in App (if API key set) | Dynamic `import()` |
| Tweakpane | `onMount` in TuningPanel (dev only) | Dynamic `import()` |

### Key files

- [app.config.ts](../../app.config.ts) — `manualChunks` configuration
- [src/game/config.ts](../../src/game/config.ts) — `lazy()` screen definitions
- [src/core/systems/screens/context.tsx](../../src/core/systems/screens/context.tsx) — `<Suspense>` in ScreenRenderer
- [src/core/lib/sentry.ts](../../src/core/lib/sentry.ts) — Dynamic Sentry import
- [src/core/lib/posthog.ts](../../src/core/lib/posthog.ts) — Dynamic PostHog import
- [src/core/dev/TuningPanel.tsx](../../src/core/dev/TuningPanel.tsx) — Dynamic Tweakpane import

---

## Verification

```bash
bun run build
# Check main chunk gzipped size:
gzip -c .vinxi/build/client/_build/assets/client-*.js | wc -c
```

For detailed composition, temporarily enable sourcemaps in [app.config.ts](../../app.config.ts):

```ts
build: { sourcemap: true, rollupOptions: { ... } }
```

---

*Updated: 2026-02-11*
