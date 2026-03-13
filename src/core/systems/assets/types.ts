// Re-export manifest types from game-components (single source of truth)
export type {
  Manifest,
  Bundle as ManifestBundle,
  AssetDefinition,
  AssetType,
  BundleKind,
  LoadBundleOptions,
  LoadingState,
  BundleProgress,
  LoaderAdapter,
  LoaderType,
} from '@wolfgames/components/core';

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

// Progress callback (0.0 to 1.0)
export type ProgressCallback = (progress: number) => void;
