/**
 * Adapts scaffold Manifest to game-components Manifest and maintains
 * bundle name mapping (scaffold uses theme-/atlas- etc., GC uses boot-/core-/audio-).
 */

import type { Manifest as ScaffoldManifest, ManifestBundle, BundleKind } from '../types';
import type { Manifest as GcManifest, AssetDefinition, Bundle } from '@wolfgames/components/core';

const SCAFFOLD_PREFIX_TO_KIND: Record<string, BundleKind> = {
  'boot-': 'boot',
  'theme-': 'theme',
  'audio-': 'audio',
  'data-': 'data',
  'core-': 'core',
  'scene-': 'scene',
  'fx-': 'fx',
  'defer-': 'defer',
};

function inferScaffoldKind(name: string): BundleKind | undefined {
  for (const [prefix, kind] of Object.entries(SCAFFOLD_PREFIX_TO_KIND)) {
    if (name.startsWith(prefix)) return kind;
  }
  return undefined;
}

/** Key from asset path (filename without extension) for use as alias */
function pathToAlias(path: string): string {
  const filename = path.split('/').pop() || path;
  return filename.replace(/\.(json|png|jpg|jpeg|webp|gif|svg)$/i, '');
}

/**
 * Map scaffold bundle name to GC bundle name so GC's LOADER_PREFIXES route correctly:
 * - boot-* -> dom
 * - core-* -> gpu
 * - scene-* -> gpu
 * - audio-* -> audio
 * We map theme-* -> boot-theme-* (dom), and unprefixed gpu bundles -> core-*
 */
function scaffoldBundleNameToGc(name: string, target: 'dom' | 'gpu' | 'agnostic'): string {
  if (name.startsWith('boot-')) return name;
  if (name.startsWith('core-') || name.startsWith('scene-') || name.startsWith('audio-')) return name;
  if (name.startsWith('theme-')) return `boot-${name}`;
  if (target === 'gpu') return `core-${name}`;
  if (target === 'agnostic') {
    // Theme and audio: theme -> dom, audio -> audio
    if (name.startsWith('audio-')) return name;
    return `boot-${name}`;
  }
  return `boot-${name}`;
}

function getBundleTarget(bundle: ManifestBundle): 'dom' | 'gpu' | 'agnostic' {
  if (bundle.target) return bundle.target;
  if (bundle.name.startsWith('boot-')) return 'dom';
  if (bundle.name.startsWith('theme-')) return 'agnostic';
  if (bundle.name.startsWith('audio-')) return 'agnostic';
  if (bundle.name.startsWith('data-')) return 'agnostic';
  return 'gpu';
}

export interface ManifestAdapterResult {
  gcManifest: GcManifest;
  /** Scaffold bundle name -> GC bundle name */
  scaffoldToGc: Map<string, string>;
  /** GC bundle name -> scaffold bundle name */
  gcToScaffold: Map<string, string>;
}

/**
 * Convert scaffold manifest to game-components manifest and build name maps.
 * Uses cdnBase only (GC loaders don't support localBase fallback).
 */
export function scaffoldManifestToGc(scaffold: ScaffoldManifest): ManifestAdapterResult {
  const scaffoldToGc = new Map<string, string>();
  const gcToScaffold = new Map<string, string>();

  const bundles: Bundle[] = scaffold.bundles.map((b) => {
    const target = getBundleTarget(b);
    const gcName = scaffoldBundleNameToGc(b.name, target);
    scaffoldToGc.set(b.name, gcName);
    gcToScaffold.set(gcName, b.name);

    const assets: AssetDefinition[] = b.assets.map((path) => ({
      alias: pathToAlias(path),
      src: path,
    }));

    const kind = b.kind ?? inferScaffoldKind(b.name);
    return { name: gcName, assets, ...(kind ? { kind } : {}) };
  });

  const gcManifest: GcManifest = {
    cdnBase: scaffold.cdnBase,
    bundles,
  };

  return { gcManifest, scaffoldToGc, gcToScaffold };
}
