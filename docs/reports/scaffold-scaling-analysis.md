# Scaffold & Game Architecture Analysis
## Scaling to 10+ Live Games — Next Steps Document

**Date:** 2026-02-23
**Scope:** Analysis of current scaffold/game architecture with recommendations for scaling

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Snapshot](#current-architecture-snapshot)
3. [What Works Well](#what-works-well)
4. [Scaling Bottlenecks](#scaling-bottlenecks)
5. [Recommendations by Priority](#recommendations-by-priority)
6. [Dynamic Asset Loading Strategy](#dynamic-asset-loading-strategy)
7. [Team Scaling Considerations](#team-scaling-considerations)
8. [6-Month Roadmap Proposal](#6-month-roadmap-proposal)

---

## Executive Summary

The scaffold is a **solid foundation** for rapid game development. Its provider/hook architecture, progressive asset loading, and clean separation from game code are genuine strengths. However, several areas need attention before scaling to 10+ games:

| Area | Current State | 10+ Game Readiness |
|------|--------------|-------------------|
| Scaffold ↔ Game boundary | Clean hooks, one-way deps | Ready |
| Asset loading | Eager, no cleanup, no versioning | Needs work |
| Game abstraction | Two games hardcoded, no interfaces | Needs work |
| Code duplication | ~30% between citylines/dailydispatch | Needs refactor |
| Team boundaries | Single repo, permission model exists | Partially ready |
| Backend/services | Firebase storage only | Needs architecture |
| Build pipeline | Single Vite build, manual deploys | Needs CI/CD |
| AI tool support | None currently | Needs planning |

**Bottom line:** The scaffold-game separation is the right architecture. The gap is in the **game layer** — there's no abstraction between "a game" and "this specific game." Closing that gap is the #1 priority.

---

## Current Architecture Snapshot

### Provider Stack (Boot → Play)

```
app.tsx
 └─ GlobalBoundary          ← Fatal error containment
     └─ TuningProvider      ← Config: localStorage → JSON → defaults
         └─ AnalyticsProvider
             └─ FeatureFlagProvider
                 └─ PauseProvider    ← Spacebar toggle
                     └─ ManifestProvider  ← CDN/local asset manifest
                         └─ AssetProvider  ← Pixi/Howler/DOM loaders
                             └─ ScreenProvider  ← State machine navigation
                                 └─ ScreenRenderer → [Current Screen]
```

### Scaffold Systems (6 core)

| System | Hook | Purpose | Files |
|--------|------|---------|-------|
| Assets | `useAssets()` | Load/cache textures, audio, data | 8 files |
| Screens | `useScreen()` | Navigate with transitions | 4 files |
| Tuning | `useTuning<S,G>()` | Live config with reactivity | 5 files |
| Audio | `useAudio()` | Volume, music/SFX toggle | 6 files |
| Pause | `usePause()` | Pause state management | 4 files |
| Errors | `ErrorBoundary` | Sentry + PostHog reporting | 4 files |

**Total scaffold:** ~65 TypeScript files, zero game logic.

### Game Layer

| Component | Files | Lines (approx) | Purpose |
|-----------|-------|-----------------|---------|
| Screens | 4 | 1,200 | Loading → Start → Game → Results |
| Dailydispatch core | 65 | 4,500 | Sliding block puzzle engine |
| Citylines core | 60 | 4,000 | Road connection puzzle engine |
| Shared components | 5 | 200 | SpriteButton, ProgressBar, DialogueBox |
| Audio | 2 | 150 | GameAudioManager + sound defs |
| Tuning | 2 | 250 | GameTuning type + defaults |
| Services | 8 | 600 | Progress, chapters, scoring |
| Config/manifest | 4 | 200 | Screen mapping, asset bundles |

**Total game:** ~155 TypeScript files across two complete game engines.

### Dependencies

| Layer | Key Deps |
|-------|----------|
| Framework | Solid.js ^1.9.5, Vite ^6.1.0, Tailwind ^4.0.7 |
| Rendering | Pixi.js ^8.15.0, GSAP ^3.14.2 |
| Audio | Howler ^2.2.4 |
| Services | @wolfgames/game-kit ^0.0.41, @sentry/solid ^10.38.0, posthog-js |
| Dev | Tweakpane ^4.0.5, arktype ^2.1.27 |

---

## What Works Well

### 1. Clean Scaffold ↔ Game Boundary
Game code imports from scaffold through hooks only. Out of 155 game files, only 44 import from `~/scaffold`, and those imports are limited to hooks and base classes. **This is the most important thing to preserve.**

### 2. Progressive Asset Loading
The phased loading system (boot → core → theme → audio → scene → defer) with `requestIdleCallback` for low-priority bundles is production-ready. CDN fallback to local is a nice resilience feature.

### 3. Fine-Grained Reactivity
Using Solid.js stores for tuning means changing `tuning.game.gridConfig.tileSize` only re-renders components that read that specific value. This scales well — more config doesn't mean more re-renders.

### 4. Extension Points
`BaseAudioManager`, `GameTuningBase`, and the screen mapping pattern give games clear "fill in the blanks" integration points. A new game can extend these without modifying scaffold.

### 5. Error Resilience
Three-layer error boundaries (Global → Screen → Asset) with Sentry + PostHog reporting and deduplication. Games crash gracefully.

### 6. Config Layering
The 4-layer config system (defaults → JSON → localStorage → URL params) means devs can override anything without code changes. The Tweakpane dev panel makes tuning fast.

---

## Scaling Bottlenecks

### CRITICAL: No Game Abstraction Layer

**The problem:** Screens import specific game controllers directly.

```typescript
// screens/GameScreen.tsx — hardwired to one game
import { setupDailyDispatchGame } from '~/game/dailydispatch/screens/gameController';
```

To run a different game, you must change imports. There's no `GameEngine` interface, no game registry, no way to select a game at runtime. For 10+ games, this means 10+ forks of the codebase or a monolith with 10 game engines bundled.

**Impact:** This is the single biggest blocker to scaling. Every other recommendation builds on fixing this first.

---

### CRITICAL: Asset Memory Never Freed

```typescript
// Assets are loaded once, never unloaded
loadBundle('scene-level-1')  // Stays in GPU memory forever
loadBundle('scene-level-2')  // Adds more, doesn't replace
```

- AudioLoader channels Map grows unbounded
- PixiLoader loadedBundles Set never cleared
- No `unloadBundle()` method exists

**Impact:** Fine for small advance games. For heavier games with many levels/scenes, mobile devices will run out of VRAM. This is the "dynamic asset loading" concern from the notes.

---

### HIGH: ~30% Code Duplication Between Games

Citylines and dailydispatch each independently implement:
- Companion dialogue system
- Level completion overlays
- Atlas helpers
- Start screen views
- Decoration systems
- Chapter generation services
- Level completion controllers

Shared components exist in `game/shared/` but are **unused** — each game rolled its own copies. Adding a 3rd game would triple this duplication.

---

### HIGH: No Build/Deploy Pipeline for Multiple Games

Current setup: single Vite build producing one bundle. No mechanism for:
- Building only the game that changed
- Independent deploys per game
- Shared scaffold versioning
- Asset CDN per game

---

### MEDIUM: Hardcoded Bundle Names Throughout

```typescript
await coordinator.loadBundle('atlas-tiles-daily-dispatch');  // Literal string
```

Bundle names appear in: manifest.ts, game controllers, atlas helpers, audio managers. No centralized registry. New games must find and replace all references.

---

### MEDIUM: Tuning Type Bloat

`GameTuning` interface contains fields for ALL game variants. At 10+ games, this becomes unmanageable. Each game should define its own tuning type extending `GameTuningBase`.

---

### MEDIUM: No Bundle Versioning/Cache Busting

Manifest has no version hashes. Browser caching could serve stale assets after deploys. Not critical at 1-2 games, but at 10+ with frequent updates, users will hit stale cache issues.

---

### LOW: Singleton State Patterns

4 singletons created with `createRoot()`: pause, audio, tuning, error reporter. These work fine for single-game instances but would need rethinking if hosting multiple games in one page or sharing scaffold between micro-frontends.

---

## Recommendations by Priority

### P0: Game Engine Interface (Weeks 1-3)

**Goal:** Any game can plug into the scaffold without modifying scaffold or screens.

```typescript
// Proposed: src/scaffold/systems/engine/types.ts
interface GameEngine {
  id: string;
  init(container: HTMLElement, deps: GameDeps): Promise<void>;
  destroy(): void;
  pause(): void;
  resume(): void;
  resize?(width: number, height: number): void;
}

interface GameDeps {
  coordinator: AssetCoordinator;
  tuning: TuningState;
  audio: AudioState;
  screen: ScreenManager;
  analytics: AnalyticsService;
}

// Game registration
interface GameConfig {
  engine: () => GameEngine;      // Factory function
  manifest: Manifest;            // Game-specific assets
  tuningDefaults: GameTuningBase;
  audioManager: () => BaseAudioManager;
  screens?: Partial<ScreenMap>;  // Override default screens
}
```

**Migration path:**
1. Define `GameEngine` interface in scaffold
2. Wrap `DailyDispatchGame` in a `GameEngine` adapter
3. Wrap `CityLinesGame` in a `GameEngine` adapter
4. `GameScreen.tsx` consumes engine through interface, not direct import
5. Game selection via config or URL param

---

### P0: Asset Lifecycle Management (Weeks 2-4)

**Goal:** Games can load and unload asset bundles, preventing memory growth.

```typescript
// Additions to AssetCoordinator
interface AssetCoordinator {
  // Existing
  loadBundle(name: string): Promise<void>;

  // New
  unloadBundle(name: string): void;       // Free GPU/audio memory
  isLoaded(name: string): boolean;         // Check before loading
  getMemoryUsage(): MemoryReport;          // Debug tool
  setMaxBundles?(limit: number): void;     // LRU eviction
}
```

**Implementation notes:**
- Pixi.Assets has `unload()` support — wrap it
- AudioLoader needs `channel.unload()` to destroy Howl instances
- Add optional LRU cache for scene bundles (keep last N loaded)
- Add `loadScene()` / `unloadScene()` high-level helpers

---

### P1: Extract Shared Game Components (Weeks 3-5)

**Goal:** Eliminate duplication, create a game-level component library.

**Move to `game/shared/`:**

| Component | Currently Duplicated In | Abstraction Needed |
|-----------|------------------------|-------------------|
| CompanionCharacter | citylines/ui, dailydispatch/ui | Generic with config slot |
| DialogueBox | citylines/ui, dailydispatch/ui, shared/ | Already exists, wire it up |
| LevelCompleteOverlay | citylines/ui, dailydispatch/ui | Generic with content slot |
| DecorationSystem | citylines/systems, dailydispatch/systems | Parameterize decorations |
| AtlasHelper | citylines/utils, dailydispatch/utils | Registry-based lookup |
| ChapterGenerationService | citylines/services, dailydispatch/services | Generic with game adapter |

**Approach:** Keep game-specific content (sprites, text, animations) as configuration. Make the component framework generic.

---

### P1: Asset Registry Pattern (Weeks 3-4)

**Goal:** No hardcoded bundle names in game logic.

```typescript
// Proposed: centralized per-game asset registry
interface AssetRegistry {
  tiles: string;          // Bundle name for tile atlas
  ui: string;             // Bundle name for UI atlas
  sfx: string;            // Bundle name for sound effects
  music: string[];        // Bundle names for music tracks
  scenes: Record<string, string>;  // Level → bundle mapping
}

// Usage in game
const registry = useAssetRegistry();
await coordinator.loadBundle(registry.tiles);
// Instead of: await coordinator.loadBundle('atlas-tiles-daily-dispatch');
```

---

### P1: Multi-Game Build Pipeline (Weeks 4-6)

**Goal:** Independent build/deploy per game sharing a common scaffold.

**Option A: Monorepo with Workspaces**
```
packages/
  scaffold/          # Published as @wolfgames/scaffold
  game-dailydispatch/
  game-citylines/
  game-new-game/
  shared-components/ # Game-level shared UI
```

**Option B: Scaffold as NPM Package**
```
@wolfgames/scaffold  → npm package (versioned)
advance-daily-dispatch → depends on @wolfgames/scaffold@^2.0
advance-citylines     → depends on @wolfgames/scaffold@^2.0
advance-new-game      → depends on @wolfgames/scaffold@^2.0
```

**Recommendation:** Start with **Option A** (monorepo). It's faster to develop and test. Migrate to Option B when scaffold is stable enough for independent versioning. Using Turborepo or Nx for build orchestration.

---

### P2: Bundle Versioning & CDN Strategy (Weeks 5-7)

**Goal:** Cache-safe deploys with per-game CDN paths.

```
CDN structure:
  /games/daily-dispatch/v1.2.3/assets/
  /games/citylines/v1.0.0/assets/
  /shared/scaffold/v2.0.0/assets/    # Shared branding, fonts
```

- Vite content hashing for bundle files (already default for JS/CSS)
- Manifest should include content hash per asset bundle
- Deploy pipeline: upload assets → update manifest → deploy app

---

### P2: Backend Service Layer (Weeks 6-10)

**Goal:** Shared backend for progress, leaderboards, analytics across games.

```
Current: Firebase Storage (chapters JSON only)
Proposed:
  /api/progress      # Save/load per-user, per-game progress
  /api/leaderboard   # Cross-game leaderboards
  /api/chapters      # Dynamic chapter delivery
  /api/config        # Remote tuning (feature flags, A/B tests)
  /api/analytics     # Event ingestion
```

**Scaffold additions:**
- `useProgress()` hook — save/load game state to backend
- `useRemoteConfig()` hook — fetch server-side tuning overrides
- `useLeaderboard()` hook — submit/fetch scores

**Tech options:**
- Firebase Functions + Firestore (fastest to ship, scales well)
- Custom Node.js/Bun service on Cloud Run (more control)
- Edge functions (Cloudflare Workers) for latency-sensitive reads

---

### P2: AI Tool Integration Points (Weeks 8-12)

**Goal:** Scaffold supports AI-assisted development workflows.

**For game developers:**
- Level generation APIs — AI generates level configs
- Tuning optimization — AI suggests parameter values based on playtesting data
- Asset pipeline — AI-assisted sprite generation/sizing

**For the scaffold itself:**
- Claude Code with the permission model (already working)
- Factory commands (/newgame, /audit, /review) for AI-assisted workflows
- Automated game scaffolding from templates

**For players:**
- AI-generated daily puzzles
- Dynamic difficulty adjustment
- Personalized content selection

---

## Dynamic Asset Loading Strategy

This was called out as a big consideration. Here's the detailed approach:

### Current State

```
Load everything → Keep everything → Never free anything
```

Works for advance games (~5-10MB total assets). Won't work for games with:
- 50+ levels with unique tilesets
- Character animation spritesheets
- Multiple themes/skins
- Video/audio-heavy content

### Proposed: Tiered Asset Strategy

```
Tier 1: Permanent (never unload)
  ├─ Boot assets (loading screen, branding)
  ├─ Core UI (buttons, progress bars, common sprites)
  └─ Audio engine (SFX sprites — small, reused constantly)

Tier 2: Session (load once per game session)
  ├─ Theme assets (current tile theme)
  ├─ Character sprites (active character set)
  └─ Music tracks (current playlist)

Tier 3: Scene (load/unload per level)
  ├─ Level-specific tilesets
  ├─ Background layers
  ├─ Decoration sprites
  └─ Level-specific audio

Tier 4: On-Demand (load when needed, evict with LRU)
  ├─ VFX particles
  ├─ Celebration animations
  └─ One-time cutscene assets
```

### Implementation Requirements

1. **AssetCoordinator.unloadBundle()** — Calls Pixi.Assets.unload() + Howl.unload()
2. **BundleTier enum** — Annotate bundles in manifest with their tier
3. **SceneManager** — Automatically unload Tier 3 on screen transition
4. **LRU Cache** — For Tier 4, keep last N bundles, evict oldest
5. **Memory Monitor** — Track GPU memory via `performance.memory` (Chrome) or estimate from bundle sizes
6. **Preload Hints** — Game can hint "I'll need scene-3 soon" to start background load

### Memory Budget Guidelines

| Device Class | VRAM Budget | Max Concurrent Bundles |
|-------------|-------------|----------------------|
| Low (iPhone SE) | 50MB | 5-8 |
| Mid (iPhone 12) | 150MB | 15-20 |
| High (iPad Pro) | 500MB+ | Unlimited |

---

## Team Scaling Considerations

### Current: Single developer, full-stack

### Target: Multiple developers, game teams + scaffold team

### Recommended Team Structure

```
Scaffold Team (1-2 devs)
├─ Owns: src/scaffold/, build pipeline, CI/CD
├─ Reviews: All scaffold changes
├─ Publishes: Scaffold versions with changelog
└─ Maintains: Shared components library

Game Team(s) (1-2 devs per game)
├─ Owns: src/game/[gamename]/
├─ Uses: Scaffold hooks + shared components
├─ Defines: Game tuning, assets, levels, audio
└─ Ships: Independent deploys

Platform Team (1 dev, could overlap with scaffold)
├─ Owns: Backend services, CDN, analytics
├─ Maintains: CI/CD pipelines
└─ Monitors: Production health across games
```

### Code Ownership Boundaries

```
CODEOWNERS:
  src/scaffold/         → @scaffold-team
  src/game/shared/      → @scaffold-team + @game-leads
  src/game/[gamename]/  → @game-team-[name]
  docs/scaffold/        → @scaffold-team
  docs/game/            → @game-teams
  .github/workflows/    → @platform-team
```

### Development Workflow

1. **Scaffold changes** → PR reviewed by scaffold team, tested against all games
2. **Game changes** → PR reviewed by game team lead, only that game's tests run
3. **Shared component changes** → PR reviewed by scaffold team + affected game leads
4. **New game** → `/newgame` factory command generates boilerplate from template

### Permission Model (Already Exists!)

The `.claude/settings.restricted.json` pattern is a great foundation. Extend it:

```
Game dev:  Can edit src/game/[their-game]/, docs/
Lead dev:  Can edit src/game/*, docs/, public/
Scaffold:  Can edit src/scaffold/, src/game/shared/
Admin:     Can edit everything
```

---

## 6-Month Roadmap Proposal

### Month 1-2: Foundation

| Week | Task | Outcome |
|------|------|---------|
| 1-2 | Define `GameEngine` interface | Games can plug in without modifying screens |
| 2-3 | Implement `unloadBundle()` on AssetCoordinator | Memory doesn't grow unbounded |
| 3-4 | Create asset registry pattern | No hardcoded bundle names |
| 4 | Migrate dailydispatch + citylines to new interfaces | Both games work through abstractions |

**Milestone:** Two games running through generic interfaces. Asset cleanup working.

### Month 2-3: Deduplication & Shared Library

| Week | Task | Outcome |
|------|------|---------|
| 5-6 | Extract shared components (dialogue, overlays, decorations) | ~30% less code |
| 6-7 | Bundle versioning + content hashing | Cache-safe deploys |
| 7-8 | `/newgame` template generator | New game in < 1 day setup |

**Milestone:** 3rd game can be created from template with shared components.

### Month 3-4: Build Pipeline & Team Support

| Week | Task | Outcome |
|------|------|---------|
| 9-10 | Monorepo setup (Turborepo/Nx) | Independent builds per game |
| 10-11 | CI/CD per game (GitHub Actions) | Auto-deploy on merge |
| 11-12 | Scaffold versioning + changelog | Games pin scaffold version |
| 12 | CODEOWNERS + review automation | Team boundaries enforced |

**Milestone:** Multiple developers can work on different games simultaneously without conflicts.

### Month 4-5: Backend & Services

| Week | Task | Outcome |
|------|------|---------|
| 13-14 | Backend service: progress sync | Cross-device save/load |
| 14-15 | Backend service: remote config | Server-side tuning + feature flags |
| 15-16 | Backend service: chapter delivery | Dynamic content without redeploy |
| 16 | Scaffold hooks: `useProgress()`, `useRemoteConfig()` | Games consume services via hooks |

**Milestone:** Games have shared backend for persistence and configuration.

### Month 5-6: Scale & AI

| Week | Task | Outcome |
|------|------|---------|
| 17-18 | Dynamic asset loading (tiered) | Heavy games supported |
| 18-19 | AI level generation pipeline | Automated content creation |
| 19-20 | Performance monitoring dashboard | Track all games in one view |
| 20-22 | Launch 5+ games on new architecture | Validate at scale |

**Milestone:** 5+ live games, AI-assisted content pipeline, monitoring across all games.

---

## Appendix: File Counts & Metrics

| Area | Files | Import from Scaffold? |
|------|-------|----------------------|
| scaffold/ | 65 | N/A (is scaffold) |
| game/screens/ | 4 | Yes (all 4) |
| game/audio/ | 2 | Yes (BaseAudioManager) |
| game/tuning/ | 2 | Yes (GameTuningBase) |
| game/shared/ | 5 | Yes (3 of 5) |
| game/dailydispatch/ | 65 | Rarely (5-8 files) |
| game/citylines/ | 60 | Rarely (5-8 files) |
| game/services/ | 8 | Minimal (storage utils) |
| game/config/ | 4 | Yes (env, manifest) |

**Key insight:** The deeper into game logic you go, the less scaffold is needed. This is the correct pattern — scaffold provides the shell, game logic is independent.

---

## Appendix: Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Scaffold breaking change breaks all games | High | Critical | Semantic versioning, integration tests per game |
| Asset memory OOM on mobile | Medium | High | Tiered loading, memory monitor, LRU eviction |
| Team stepping on each other's code | Medium | Medium | CODEOWNERS, monorepo with per-game builds |
| Stale cache after deploys | Medium | Medium | Content hashing, manifest versioning |
| Game-specific hacks leaking into scaffold | Low | High | Code review process, permission model |
| AI-generated levels being unsolvable | Medium | Low | Solver validation (already exists for dailydispatch) |
