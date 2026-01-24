import { createSignal, createRoot, batch } from 'solid-js';
import type { ScaffoldTuning, GameTuningBase, TuningState, TuningSource } from './types';
import { SCAFFOLD_DEFAULTS } from './types';
import {
  loadScaffoldTuning,
  loadGameTuning,
  STORAGE_KEYS,
  saveToStorage,
  clearTuningStorage,
} from './loader';

/**
 * Set a nested path in an object immutably
 */
function setPath<T extends object>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const result = { ...obj };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    current[key] = { ...current[key] };
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
  return result;
}

/**
 * Create a tuning state instance
 */
export function createTuningState<
  S extends ScaffoldTuning = ScaffoldTuning,
  G extends GameTuningBase = GameTuningBase
>(scaffoldDefaults: S, gameDefaults: G): TuningState<S, G> {
  const [scaffold, setScaffold] = createSignal<S>(scaffoldDefaults);
  const [game, setGame] = createSignal<G>(gameDefaults);
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [loadError, setLoadError] = createSignal<string | null>(null);
  const [source, setSource] = createSignal<{ scaffold: TuningSource; game: TuningSource }>({
    scaffold: 'local',
    game: 'local',
  });

  // Store original defaults for reset
  const originalScaffold = scaffoldDefaults;
  const originalGame = gameDefaults;

  const load = async (): Promise<void> => {
    try {
      const [scaffoldResult, gameResult] = await Promise.all([
        loadScaffoldTuning(),
        loadGameTuning(gameDefaults),
      ]);

      batch(() => {
        setScaffold(scaffoldResult.data as S);
        setGame(gameResult.data as G);
        setSource({
          scaffold: scaffoldResult.source,
          game: gameResult.source,
        });
        setIsLoaded(true);
        setLoadError(null);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Tuning] Load failed:', message);
      setLoadError(message);
      // Still mark as loaded, using defaults
      setIsLoaded(true);
    }
  };

  const setScaffoldPath = (path: string, value: unknown): void => {
    setScaffold((prev) => setPath(prev, path, value));
  };

  const setGamePath = (path: string, value: unknown): void => {
    setGame((prev) => setPath(prev, path, value));
  };

  const reset = (): void => {
    batch(() => {
      setScaffold(originalScaffold);
      setGame(originalGame);
      clearTuningStorage();
    });
  };

  const save = (): void => {
    saveToStorage(STORAGE_KEYS.SCAFFOLD, scaffold());
    saveToStorage(STORAGE_KEYS.GAME, game());
  };

  const exportJson = (): string => {
    return JSON.stringify(
      {
        scaffold: scaffold(),
        game: game(),
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  };

  const importJson = (json: string): boolean => {
    try {
      const data = JSON.parse(json);
      batch(() => {
        if (data.scaffold) setScaffold(data.scaffold);
        if (data.game) setGame(data.game);
      });
      return true;
    } catch (error) {
      console.error('[Tuning] Import failed:', error);
      return false;
    }
  };

  /**
   * Apply overrides to game tuning without saving to localStorage.
   * Used for URL params that should take effect but not persist.
   */
  const applyGameOverrides = (overrides: Record<string, unknown>): void => {
    setGame((prev) => {
      let result = prev;
      for (const [path, value] of Object.entries(overrides)) {
        result = setPath(result, path, value);
      }
      return result;
    });
  };

  return {
    scaffold,
    game,
    isLoaded,
    loadError,
    source,
    setScaffoldPath,
    setGamePath,
    applyGameOverrides,
    load,
    save,
    reset,
    exportJson,
    importJson,
  };
}

// Default singleton for scaffold-only usage (without game tuning)
export const scaffoldTuningState = createRoot(() =>
  createTuningState(SCAFFOLD_DEFAULTS, { version: '1.0.0' } as GameTuningBase)
);
