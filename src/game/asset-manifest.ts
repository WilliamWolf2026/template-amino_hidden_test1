/**
 * Asset manifest — single source for bundle list and paths.
 *
 * This file is intentionally free of runtime imports (no Solid.js, no ~/core)
 * so it can be imported by CLI scripts (scripts/check-manifest.ts) running
 * under plain Bun without the Vite/app dependency graph.
 *
 * cdnBase and localBase are static placeholders here. config.ts resolves the
 * real CDN URL at runtime and patches cdnBase before handing to the asset system.
 *
 * Bundle naming determines which loader handles the assets:
 *
 *   boot-*   → DOM only   — splash screen assets
 *   theme-*  → DOM only   — branding/logo (loading screen, pre-GPU)
 *   scene-*  → GPU (Pixi) — game spritesheets, backgrounds, tiles, characters
 *   core-*   → GPU (Pixi) — in-game UI atlases
 *   fx-*     → GPU (Pixi) — particles, effects, VFX spritesheets
 *   audio-*  → Howler     — sound effects, music
 *
 * Game atlases MUST use scene-* or core-* to be accessible via Pixi
 * (createSprite, getTexture, hasSheet). Using theme-* for game atlases
 * will silently fail — Pixi never sees them.
 *
 * Bundle names must match [a-z][a-z0-9-]* — only lowercase, digits, hyphens.
 * NO underscores. Asset file paths can have underscores; bundle names cannot.
 *
 * The bundle name is also the Pixi asset alias for single-asset bundles.
 * Example: { name: 'scene-tiles-daily-dispatch', assets: ['atlas-tiles-daily-dispatch.json'] }
 *   → gpuLoader.createSprite('scene-tiles-daily-dispatch', 'frame-name.png')
 */

export const LOCAL_ASSET_PATH = '/assets';

export interface ManifestBundle {
  name: string;
  assets: string[];
  target?: 'dom' | 'gpu' | 'agnostic';
  kind?: 'boot' | 'theme' | 'audio' | 'data' | 'core' | 'scene' | 'fx' | 'defer';
}

export interface Manifest {
  cdnBase: string;
  localBase?: string;
  bundles: ManifestBundle[];
}

export const manifest: Manifest = {
  cdnBase: LOCAL_ASSET_PATH,
  localBase: LOCAL_ASSET_PATH,
  bundles: [
    // DOM — branding logo shown on loading screen (pre-GPU)
    { name: 'theme-branding', assets: ['atlas-branding-wolf.json'] },

    // When adding bundles for your game, use the appropriate prefix:
    //
    //   scene-*  → GPU spritesheets, backgrounds, tiles
    //   core-*   → GPU in-game UI atlases
    //   fx-*     → GPU particles, effects, VFX
    //   audio-*  → Howler sound effects and music
    //   data-*   → JSON config files
    //   boot-*   → DOM pre-engine splash assets
    //
    // Examples:
    //   { name: 'scene-tiles-mygame', assets: ['atlas-tiles-mygame.json'] },
    //   { name: 'fx-blast', assets: ['vfx-blast.json'] },
    //   { name: 'audio-sfx-mygame', assets: ['sfx-mygame.json'] },
    //   { name: 'audio-music-mygame', assets: ['music-mygame.json'] },
  ],
};
