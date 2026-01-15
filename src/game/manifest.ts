import type { Manifest } from '~/scaffold/systems/assets';

export const manifest: Manifest = {
  cdnBase: '/assets',
  bundles: [
    // THEME - Branding (agnostic, loaded first)
    { name: 'theme-branding', assets: ['atlas-branding-wolf.json'] },

    // BOOT - Minimal for loading screen
    // { name: 'boot-spinner', assets: ['ui/spinner.json'] },

    // CORE - Required before gameplay
    { name: 'core-background', assets: ['animation-water.json'] },
    // { name: 'core-chrome', assets: ['ui/buttons.json', 'ui/modals.json'] },

    // TILES - Game tiles
    { name: 'tiles_citylines_v1', assets: ['tiles_citylines_v1.json'] },

    // SCENES
    // { name: 'scene-gameplay', assets: ['scenes/gameplay/entities.json'] },

    // AUDIO (agnostic)
    // { name: 'audio-sfx-ui', assets: ['audio/sfx-ui.json'] },
    // { name: 'audio-music', assets: ['audio/music.json'] },

    // DEFERRED - Low priority
    // { name: 'defer-extras', assets: ['ui/achievements.json'] },
  ],
};
