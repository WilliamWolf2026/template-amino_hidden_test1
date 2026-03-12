/**
 * Adapts scaffold Manifest to game-components Manifest and maintains
 * bundle name mapping (scaffold uses theme-/atlas- etc., GC uses boot-/core-/audio-).
 */

import type { Manifest as ScaffoldManifest, ManifestBundle, BundleKind } from '../types';
import { inferAssetType } from '../types';
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
 *
 * Explicit `target` on a ManifestBundle overrides the default prefix routing.
 * For example `{ name: 'theme-atlas', target: 'gpu' }` routes to core-theme-atlas
 * instead of the default boot-theme-atlas (dom).
 */
function scaffoldBundleNameToGc(name: string, target: 'dom' | 'gpu' | 'agnostic'): string {
  // audio-* always stays audio-* (dedicated loader, no dom/gpu ambiguity)
  if (name.startsWith('audio-')) return name;

  // Prefixes that already map 1:1 to GC LOADER_PREFIXES — pass through
  // unless explicit target disagrees
  if (name.startsWith('boot-')) {
    if (target === 'gpu') return name.replace(/^boot-/, 'core-');
    return name;
  }
  if (name.startsWith('core-') || name.startsWith('scene-')) {
    if (target === 'dom') return name.replace(/^(?:core|scene)-/, 'boot-');
    return name;
  }

  // All other prefixes (theme-, data-, fx-, defer-, custom):
  // route based on resolved target
  if (target === 'gpu') return `core-${name}`;
  return `boot-${name}`;
}

/** Maps explicit kind → target so `kind` can override prefix-based inference. */
const KIND_TO_TARGET: Partial<Record<BundleKind, 'dom' | 'gpu' | 'agnostic'>> = {
  boot: 'dom',
  theme: 'dom',
  audio: 'agnostic',
  data: 'agnostic',
  core: 'gpu',
  scene: 'gpu',
  fx: 'gpu',
  // defer omitted — it's a loading strategy, not a content type
};

function getBundleTarget(bundle: ManifestBundle): 'dom' | 'gpu' | 'agnostic' {
  // 1. Explicit target always wins
  if (bundle.target) return bundle.target;
  // 2. Explicit kind overrides prefix inference
  if (bundle.kind) {
    const fromKind = KIND_TO_TARGET[bundle.kind];
    if (fromKind) return fromKind;
  }
  // 3. Fall back to prefix inference
  if (bundle.name.startsWith('boot-')) return 'dom';
  if (bundle.name.startsWith('theme-')) return 'dom';
  if (bundle.name.startsWith('audio-')) return 'agnostic';
  if (bundle.name.startsWith('data-')) return 'agnostic';
  return 'gpu';
}

/** Asset types that require the GPU loader. */
const GPU_ASSET_TYPES = new Set(['spritesheet', 'image']);

/**
 * Resolve an `agnostic` target to a concrete `dom` or `gpu` by inspecting the
 * bundle's assets. If any asset requires GPU (spritesheet, image), the whole
 * bundle is promoted to GPU so Pixi can use it. Bundles that only contain
 * fonts, raw JSON data, or audio stay on DOM.
 *
 * To keep a spritesheet on DOM (e.g. CSS-sprite branding), set explicit
 * `target: 'dom'` on the bundle — explicit target is checked before this
 * function is ever called.
 */
function resolveAgnostic(bundle: ManifestBundle): 'dom' | 'gpu' {
  const needsGpu = bundle.assets.some((p) => GPU_ASSET_TYPES.has(inferAssetType(p)));
  return needsGpu ? 'gpu' : 'dom';
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
    const raw = getBundleTarget(b);
    const target = raw === 'agnostic' ? resolveAgnostic(b) : raw;
    const gcName = scaffoldBundleNameToGc(b.name, target);
    scaffoldToGc.set(b.name, gcName);
    gcToScaffold.set(gcName, b.name);

    // GPU bundles: use scaffold bundle name as alias for single-asset bundles.
    // This preserves the convention that game code uses bundle names for Pixi
    // lookups (getTexture, createSprite, hasSheet). The old scaffold PixiLoader
    // registered assets this way, and generators reproduce that pattern.
    // DOM bundles: use path-derived alias (Logo and DOM consumers expect it).
    const usesBundleNameAlias = target === 'gpu' && b.assets.length === 1;
    const assets: AssetDefinition[] = b.assets.map((path) => ({
      alias: usesBundleNameAlias ? b.name : pathToAlias(path),
      src: path,
    }));

    // Only forward kind when the name wasn't rewritten — GC's validator
    // rejects kind/prefix mismatches. When name IS rewritten the target
    // already determined the correct GC prefix, so kind is redundant.
    const scaffoldKind = b.kind ?? inferScaffoldKind(b.name);
    const nameWasRewritten = gcName !== b.name;
    const kind = nameWasRewritten ? undefined : scaffoldKind;
    return { name: gcName, assets, ...(kind ? { kind } : {}) };
  });

  const gcManifest: GcManifest = {
    cdnBase: scaffold.cdnBase,
    bundles,
  };

  return { gcManifest, scaffoldToGc, gcToScaffold };
}
