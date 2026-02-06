// Asset target types
export type AssetTarget = 'dom' | 'gpu' | 'agnostic';

// Manifest types
export interface ManifestBundle {
  name: string;
  assets: string[];
  target?: AssetTarget; // Optional override, otherwise inferred from prefix
}

export interface Manifest {
  cdnBase: string;
  localBase?: string; // Fallback path if CDN fails
  bundles: ManifestBundle[];
}

// Spritesheet types (TexturePacker format)
export interface SpriteFrame {
  frame: { x: number; y: number; w: number; h: number };
  sourceSize?: { w: number; h: number };
  spriteSourceSize?: { x: number; y: number; w: number; h: number };
}

export interface SpriteSheetData {
  frames: Record<string, SpriteFrame>;
  meta: {
    image: string;
    size: { w: number; h: number };
    scale: number;
  };
  animations?: Record<string, string[]>;
}

export interface LoadedSheet {
  json: SpriteSheetData;
  image: ImageBitmap;
}

// Audio sprite types (Howler format)
export interface AudioSpriteData {
  src: string[];
  sprite: Record<string, [number, number]>;
}

export interface LoadedAudioSprite {
  json: AudioSpriteData;
  basePath: string;
}

// Asset types (inferred from file extension)
export type AssetType = 'spritesheet' | 'image' | 'audio' | 'json' | 'font';

export function inferAssetType(path: string): AssetType {
  if (path.includes('audio/') && path.endsWith('.json')) return 'audio';
  if (path.endsWith('.json')) return 'spritesheet';
  if (path.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i)) return 'image';
  if (path.match(/\.(woff|woff2|ttf|otf)$/i)) return 'font';
  return 'json';
}

// Raw image (single file, no spritesheet)
export interface LoadedImage {
  image: ImageBitmap;
  width: number;
  height: number;
}

// Raw JSON data
export interface LoadedJson<T = unknown> {
  data: T;
}

// Loader interface
export interface AssetLoader {
  init(manifest: Manifest): void;
  loadBundle(name: string): Promise<void>;
  loadBundles(prefix: string): Promise<void>;
  isLoaded(bundle: string): boolean;
}

// Infer target from bundle prefix
export function inferTarget(bundleName: string): AssetTarget {
  if (bundleName.startsWith('boot-')) return 'dom';
  if (bundleName.startsWith('theme-')) return 'agnostic';
  if (bundleName.startsWith('audio-')) return 'agnostic';
  if (bundleName.startsWith('data-')) return 'agnostic';
  return 'gpu';
}

// Get target for a bundle
export function getBundleTarget(bundle: ManifestBundle): AssetTarget {
  return bundle.target ?? inferTarget(bundle.name);
}
