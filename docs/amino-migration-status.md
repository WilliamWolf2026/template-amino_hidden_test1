# Amino Migration Status Report

**Date**: 2026-03-25
**Related tickets**: ENG-1619, ENG-1620, ENG-1622, ENG-1635

## Overview

Migration of shared utilities and systems out of `template-amino` into `game-kit` (pure JS) and `game-components` (framework-agnostic core + React/Solid adapters).

## Migration Status

| System | Migrated | Destination | Notes |
|---|---|---|---|
| Analytics (providers, session, PostHog bridge) | Yes | game-components | ENG-1622 — PR #25 (game-components), PR #9 (amino cleanup) |
| Audio state | Yes | game-components | |
| Pause | Yes | game-components | |
| Screen manager | Yes | game-components | Named `screen-manager` in game-components vs `screens` in amino |
| Error boundary | Yes | game-components | Amino reporter stripped to Sentry-only during ENG-1622 |
| Manifest | Yes | game-components | |
| Assets (coordinator, loaders) | Yes | game-components | |
| Settings menu | Yes | game-components | |
| Tuning panel | Yes | game-components | |
| Viewport | Yes | game-components | ENG-1620 — PR #26 (game-components), PR #10 (amino cleanup) |
| Environment / CDN config | Yes | game-kit | ENG-1635 — PR #57 (game-kit), PR #12 (amino cleanup) |
| Sentry | Yes | game-kit | |
| **Versioned storage** | **No** | game-kit | Pure JS, zero deps — strong candidate |
| **Feature flags** | **No** | game-components or game-kit | Registry + cache + context; needs decision on where UI context lives |
| **VFX / particles** | **No** | game-components | Particle runtime and data format types |
| **Analytics event schemas** | **No** | game-kit | arktype schemas, framework-agnostic |

## Cleanup Remaining

The 12 migrated systems still have copies in `template-amino/src/core/` that need to be deleted and imports rewired to `@wolfgames/components` or `@wolfgames/game-kit`. This cleanup has been done for some (analytics via PR #9, viewport via PR #10, config via PR #12) but not all.

## Open Questions

- **Feature flags**: Should the cache logic (pure JS) go to game-kit while the provider/context goes to game-components? Or keep it all in one place?
- **deepMerge**: Listed in ENG-1619 but not found in the codebase. Likely no longer needed.
