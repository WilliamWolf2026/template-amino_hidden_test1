import type { Manifest } from '~/scaffold/systems/assets';
import { getCdnUrl, getLocalAssetPath } from '~/game/config';

export const manifest: Manifest = {
  cdnBase: getCdnUrl(),
  localBase: getLocalAssetPath(),
  bundles: [
    // THEME - Branding (agnostic, loaded first)
    { name: 'theme-branding', assets: ['atlas-branding-wolf.json'] },

    // TILES - Game tiles (theme variants - only one loaded based on tuning)
    { name: 'atlas-tiles-daily-dispatch', assets: ['atlas-tiles-daily-dispatch.json'] },
    { name: 'atlas-tiles-citylines', assets: ['atlas-tiles-citylines.json'] },
    { name: 'atlas-tiles-citylines-fall', assets: ['atlas-tiles-citylines-fall.json'] },
    { name: 'atlas-tiles-citylines-winter', assets: ['atlas-tiles-citylines-winter.json'] },

    // VFX
    { name: 'vfx-rotate', assets: ['vfx-rotate.json'] },
    { name: 'vfx-blast', assets: ['vfx-blast.json'] },
    { name: 'vfx-flash_fx_shape_04', assets: ['vfx-flash_fx_shape_04.json'] },
    { name: 'vfx-mg_glow_09', assets: ['vfx-mg_glow_09.json'] },
    { name: 'vfx-mg_noglow_01', assets: ['vfx-mg_noglow_01.json'] },

    // AUDIO
    { name: 'audio-sfx-citylines', assets: ['sfx-citylines.json'] },
    { name: 'audio-music-citylines-1', assets: ['music-citylines-1.json'] },
    { name: 'audio-music-warehouse-puzzle', assets: ['music-warehouse-puzzle.json'] },
  ],
};
