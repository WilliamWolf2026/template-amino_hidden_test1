/**
 * Asset manifest — single source for bundle list and paths.
 * Used by config.ts and by scripts/check-manifest.ts (no Solid/app deps).
 */

import type { Manifest } from '~/core/systems/assets';
import { getCdnBaseUrl } from '~/core/config';
import { GAME_CDN_PATH } from './config';

const LOCAL_ASSET_PATH = '/assets';

function getCdnUrl(): string {
  const baseUrl = getCdnBaseUrl();
  if (!baseUrl) return LOCAL_ASSET_PATH;
  return `${baseUrl}/${GAME_CDN_PATH}/assets`;
}

/**
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
export const manifest: Manifest = {
  cdnBase: getCdnUrl(),
  localBase: LOCAL_ASSET_PATH,
  bundles: [
    // DOM — branding logo shown on loading screen (pre-GPU)
    { name: 'theme-branding', assets: ['atlas-branding-wolf.json'] },

    // GPU — game spritesheets (Pixi)
    { name: 'scene-tiles-daily-dispatch', assets: ['atlas-tiles-daily-dispatch.json'] },

    // GPU — VFX spritesheets (Pixi)
    // Bundle names must match [a-z][a-z0-9-]* (no underscores). Asset paths can differ.
    { name: 'fx-rotate', assets: ['vfx-rotate.json'] },
    { name: 'fx-blast', assets: ['vfx-blast.json'] },
    { name: 'fx-flash-fx-shape-04', assets: ['vfx-flash_fx_shape_04.json'] },
    { name: 'fx-mg-glow-09', assets: ['vfx-mg_glow_09.json'] },
    { name: 'fx-mg-noglow-01', assets: ['vfx-mg_noglow_01.json'] },

    // Audio — sound effects and music (Howler)
    { name: 'audio-sfx-daily-dispatch', assets: ['sfx-daily-dispatch.json'] },
    { name: 'audio-music-warehouse-puzzle', assets: ['music-warehouse-puzzle.json'] },
  ],
};
