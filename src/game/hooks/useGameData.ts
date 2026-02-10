import { type Accessor } from 'solid-js';
import { useManifest } from '~/scaffold/systems/manifest/context';
import type { GameData } from '~/game/citylines/types/gameData';

/**
 * Typed accessor for game data from the manifest provider.
 * Returns the raw game data cast to the GameData schema type.
 */
export function useGameData(): {
  gameData: Accessor<GameData | null>;
  mode: Accessor<'standalone' | 'injected'>;
  injectData: (data: GameData) => void;
} {
  const { gameData, mode, injectData } = useManifest();

  return {
    gameData: () => gameData() as GameData | null,
    mode,
    injectData: (data: GameData) => injectData(data),
  };
}
