import { Container } from 'pixi.js';
import type { PixiLoader } from '~/core/systems/assets/loaders/gpu/pixi';
import { __UPPER_SNAKE_NAME___DEFAULTS } from '../defaults';

/**
 * Configuration for __PASCAL_NAME__
 */
export interface __PASCAL_NAME__Config {
  /** TODO: define config properties */
}

/**
 * __PASCAL_NAME__ — Pixi.js prefab renderer
 *
 * Assembles primitives into a higher-level component.
 */
export class __PASCAL_NAME__ extends Container {
  private config: __PASCAL_NAME__Config;

  constructor(gpuLoader: PixiLoader, config: __PASCAL_NAME__Config) {
    super();
    this.config = config;
    this.label = '__MODULE_NAME__';

    // TODO: compose primitives here
  }

  override destroy(options?: boolean | { children?: boolean; texture?: boolean }): void {
    this.removeAllListeners();
    super.destroy(options);
  }
}
