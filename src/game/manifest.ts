import type { Manifest } from '~/scaffold/systems/assets';
import { getCdnUrl, getLocalAssetPath } from '~/game/config';

export const manifest: Manifest = {
  cdnBase: getCdnUrl(),
  localBase: getLocalAssetPath(),
  bundles: [
    // THEME - Branding (agnostic, loaded first)
    { name: 'theme-branding', assets: ['atlas-branding-wolf.json'] },

    // TILES - Game tiles (theme variants - only one loaded based on tuning)
    { name: 'atlas-tiles-citylines', assets: ['atlas-tiles-citylines.json'] },
    { name: 'atlas-tiles-citylines-fall', assets: ['atlas-tiles-citylines-fall.json'] },
    { name: 'atlas-tiles-citylines-winter', assets: ['atlas-tiles-citylines-winter.json'] },

    // VFX
    { name: 'vfx-rotate', assets: ['vfx-rotate.json'] },
    { name: 'vfx-blast', assets: ['vfx-blast.json'] },

    // AUDIO
    { name: 'audio-sfx-citylines', assets: ['sfx-citylines.json'] },
    { name: 'audio-music-citylines-1', assets: ['music-citylines-1.json'] },
  ],
};
