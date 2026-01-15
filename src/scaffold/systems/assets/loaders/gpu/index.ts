import type { AssetLoader } from '../../types';

export type EngineType = 'pixi' | 'phaser' | 'three';

// Dynamic import factory for tree-shaking
export async function createGpuLoader(engine: EngineType): Promise<AssetLoader> {
  switch (engine) {
    case 'pixi': {
      const { PixiLoader } = await import('./pixi');
      return new PixiLoader();
    }
    case 'phaser': {
      // TODO: Implement PhaserLoader
      throw new Error('Phaser loader not yet implemented');
    }
    case 'three': {
      // TODO: Implement ThreeLoader
      throw new Error('Three loader not yet implemented');
    }
    default:
      throw new Error(`Unknown engine: ${engine}`);
  }
}

// Re-export types
export type { PixiLoader } from './pixi';
