import type { Pane, FolderApi, BindingParams } from 'tweakpane';
import type { TuningState, ScaffoldTuning, GameTuningBase } from '../systems/tuning/types';

// Use any for Pane methods due to @tweakpane/core type definition issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FolderOrPane = Pane | FolderApi | any;

/**
 * Format a camelCase/snake_case key to Title Case label
 */
function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

/**
 * Infer binding parameters from key name patterns
 */
function inferBindingParams(key: string, value: number): Partial<BindingParams> {
  const keyLower = key.toLowerCase();

  // Volume/alpha: 0-1 range
  if (keyLower.includes('volume') || keyLower.includes('alpha')) {
    return { min: 0, max: 1, step: 0.01 };
  }

  // Duration/delay: 0-5000ms
  if (keyLower.includes('duration') || keyLower.includes('delay')) {
    return { min: 0, max: 5000, step: 50 };
  }

  // Scale: 0.1-3
  if (keyLower.includes('scale')) {
    return { min: 0.1, max: 3, step: 0.05 };
  }

  // Size (tile size, etc): 1-500
  if (keyLower.includes('size')) {
    return { min: 1, max: 500, step: 1 };
  }

  // FPS: 15-120
  if (keyLower.includes('fps')) {
    return { min: 15, max: 120, step: 1 };
  }

  // Probability: 0-1
  if (keyLower.includes('probability')) {
    return { min: 0, max: 1, step: 0.05 };
  }

  // Offset: 0-1
  if (keyLower.includes('offset')) {
    return { min: 0, max: 1, step: 0.01 };
  }

  // Padding/gap: 0-100
  if (keyLower.includes('padding') || keyLower.includes('gap')) {
    return { min: 0, max: 100, step: 1 };
  }

  // Count: 0-20
  if (keyLower.includes('count') || keyLower.includes('min') || keyLower.includes('max')) {
    return { min: 0, max: 20, step: 1 };
  }

  // Resolution: 0.5-3
  if (keyLower.includes('resolution')) {
    return { min: 0.5, max: 3, step: 0.25 };
  }

  // Particles/pool size: 10-10000
  if (keyLower.includes('particles') || keyLower.includes('pool')) {
    return { min: 10, max: 10000, step: 10 };
  }

  // Path length: 1-20
  if (keyLower.includes('path')) {
    return { min: 1, max: 20, step: 1 };
  }

  // Bonus/penalty/score: 0-1000
  if (
    keyLower.includes('bonus') ||
    keyLower.includes('penalty') ||
    keyLower.includes('score')
  ) {
    return { min: 0, max: 1000, step: 5 };
  }

  // Default numeric range
  return { min: 0, max: 1000, step: 1 };
}

/**
 * Create a Tweakpane binding for a single value
 */
function createBinding(
  parent: FolderOrPane,
  key: string,
  value: unknown,
  onUpdate: (value: unknown) => void
): void {
  const label = formatLabel(key);
  const obj = { [key]: value };

  if (typeof value === 'boolean') {
    parent.addBinding(obj, key, { label }).on('change', (ev: { value: boolean }) => onUpdate(ev.value));
    return;
  }

  if (typeof value === 'number') {
    // Grid size dropdown (constrained to 4, 5, 6)
    if (key === 'gridSize' || key === 'defaultGridSize') {
      parent
        .addBinding(obj, key, {
          label,
          options: {
            '4×4': 4,
            '5×5': 5,
            '6×6': 6,
          },
        })
        .on('change', (ev: { value: number }) => onUpdate(ev.value));
      return;
    }

    // Tile size dropdown (common game sizes)
    if (key === 'tileSize') {
      parent
        .addBinding(obj, key, {
          label,
          options: {
            '32px': 32,
            '48px': 48,
            '64px': 64,
            '80px': 80,
            '96px': 96,
            '128px': 128,
            '160px': 160,
            '192px': 192,
            '256px': 256,
          },
        })
        .on('change', (ev: { value: number }) => onUpdate(ev.value));
      return;
    }

    const params: BindingParams = { label, ...inferBindingParams(key, value) };
    parent.addBinding(obj, key, params).on('change', (ev: { value: number }) => onUpdate(ev.value));
    return;
  }

  if (typeof value === 'string') {
    // Check if it's a hex color
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      parent.addBinding(obj, key, { label, view: 'color' }).on('change', (ev: { value: string }) => onUpdate(ev.value));
      return;
    }

    // Log level dropdown
    if (key === 'logLevel') {
      parent
        .addBinding(obj, key, {
          label,
          options: {
            Debug: 'debug',
            Info: 'info',
            Warn: 'warn',
            Error: 'error',
            None: 'none',
          },
        })
        .on('change', (ev: { value: string }) => onUpdate(ev.value));
      return;
    }

    // Transition type dropdown
    if (key === 'transitionType') {
      parent
        .addBinding(obj, key, {
          label,
          options: { Fade: 'fade', Slide: 'slide', None: 'none' },
        })
        .on('change', (ev: { value: string }) => onUpdate(ev.value));
      return;
    }

    // Default text input
    parent.addBinding(obj, key, { label }).on('change', (ev: { value: string }) => onUpdate(ev.value));
  }
}

/**
 * Recursively bind an object to Tweakpane folders
 */
function bindObjectToPane(
  parent: FolderOrPane,
  obj: Record<string, unknown>,
  onUpdate: (path: string, value: unknown) => void,
  pathPrefix = ''
): void {
  for (const [key, value] of Object.entries(obj)) {
    // Skip version field
    if (key === 'version') continue;

    const path = pathPrefix ? `${pathPrefix}.${key}` : key;

    if (value === null || value === undefined) continue;

    if (typeof value === 'object' && !Array.isArray(value)) {
      // Create subfolder for nested objects
      const folder = parent.addFolder({
        title: formatLabel(key),
        expanded: false,
      });
      bindObjectToPane(folder, value as Record<string, unknown>, onUpdate, path);
    } else {
      // Create binding for primitive values
      createBinding(parent, key, value, (newValue) => onUpdate(path, newValue));
    }
  }
}

/**
 * Bind tuning state to Tweakpane
 */
export function bindTuningToPane<S extends ScaffoldTuning, G extends GameTuningBase>(
  pane: Pane,
  state: TuningState<S, G>,
  options: {
    scaffoldFolder?: string;
    gameFolder?: string;
    onChange?: () => void;
  } = {}
): void {
  const { scaffoldFolder = 'Scaffold', gameFolder = 'Game', onChange } = options;

  // Create main folders
  const scaffoldPane = pane.addFolder({
    title: scaffoldFolder,
    expanded: false,
  });

  const gamePane = pane.addFolder({
    title: gameFolder,
    expanded: true,
  });

  // Bind scaffold tuning
  bindObjectToPane(scaffoldPane, state.scaffold() as Record<string, unknown>, (path, value) => {
    state.setScaffoldPath(path, value);
    onChange?.();
  });

  // Bind game tuning
  bindObjectToPane(gamePane, state.game() as Record<string, unknown>, (path, value) => {
    state.setGamePath(path, value);
    onChange?.();
  });
}

/**
 * Add preset control buttons to Tweakpane
 */
export function addPresetControls<S extends ScaffoldTuning, G extends GameTuningBase>(
  pane: Pane,
  state: TuningState<S, G>
): void {
  const presetsFolder = pane.addFolder({ title: 'Actions', expanded: false });

  // Save button
  presetsFolder.addButton({ title: 'Save to Browser' }).on('click', () => {
    state.save();
    console.log('[Tuning] Saved to localStorage');
  });

  // Export button
  presetsFolder.addButton({ title: 'Export JSON' }).on('click', () => {
    const json = state.exportJson();
    navigator.clipboard.writeText(json).then(() => {
      console.log('[Tuning] Exported to clipboard');
    });
  });

  // Reset button
  presetsFolder.addButton({ title: 'Reset to Defaults' }).on('click', () => {
    state.reset();
    console.log('[Tuning] Reset to defaults');
    // Refresh the pane - this requires rebuilding
    window.location.reload();
  });
}
