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

export const manifest: Manifest = {
  cdnBase: getCdnUrl(),
  localBase: LOCAL_ASSET_PATH,
  bundles: [{ name: 'theme-branding', assets: ['atlas-branding-wolf.json'] }],
};
