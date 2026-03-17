import { __UPPER_SNAKE_NAME___DEFAULTS } from './defaults';

/**
 * Configuration for __PASCAL_NAME__
 */
export interface __PASCAL_NAME__Config {
  /** TODO: define config properties */
}

/**
 * Public interface returned by create__PASCAL_NAME__
 */
export interface __PASCAL_NAME__Controller {
  /** TODO: define controller methods */
  destroy(): void;
}

/**
 * Create a __DISPLAY_NAME__ controller.
 */
export function create__PASCAL_NAME__(
  config: __PASCAL_NAME__Config,
): __PASCAL_NAME__Controller {
  // TODO: implement state and logic

  const destroy = (): void => {
    // TODO: clean up timers, listeners
  };

  return Object.freeze({
    destroy,
  });
}

export { __UPPER_SNAKE_NAME___DEFAULTS } from './defaults';
export { __CAMEL_NAME__Tuning } from './tuning';
