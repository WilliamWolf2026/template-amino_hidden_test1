import { __UPPER_SNAKE_NAME___DEFAULTS } from './defaults';

export const __CAMEL_NAME__Tuning = {
  name: '__DISPLAY_NAME__',
  defaults: __UPPER_SNAKE_NAME___DEFAULTS,
  schema: {
    /** TODO: add Tweakpane schema entries */
    exampleValue: { type: 'number', min: 0, max: 10, step: 1 },
  },
} as const;
