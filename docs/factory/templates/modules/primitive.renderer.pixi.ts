import { Container } from 'pixi.js';
import type { PixiLoader } from '~/core/systems/assets';
import { __UPPER_SNAKE_NAME___DEFAULTS } from '../defaults';

/**
 * Configuration for __PASCAL_NAME__
 */
export interface __PASCAL_NAME__Config {
  /** TODO: define config properties */
}

/**
 * __PASCAL_NAME__ — Pixi.js renderer
 */
export class __PASCAL_NAME__ extends Container {
  private config: __PASCAL_NAME__Config;

  constructor(gpuLoader: PixiLoader, config: __PASCAL_NAME__Config) {
    super();
    this.config = config;
    this.label = '__MODULE_NAME__';

    // TODO: build visuals using gpuLoader
  }

  override destroy(options?: boolean | { children?: boolean; texture?: boolean }): void {
    this.removeAllListeners();
    super.destroy(options);
  }
}
