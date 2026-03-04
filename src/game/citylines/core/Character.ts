import { CharacterSprite } from '~/modules/primitives/character-sprite';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { getAtlasName } from '../utils/atlasHelper';

/**
 * Character types available in the game
 */
export type CharacterType = 'paper_kid' | 'news_hound';

/**
 * Mapping of character types to their sprite frame names
 */
const CHARACTER_SPRITES: Record<CharacterType, string> = {
  paper_kid: 'character_a.png',
  news_hound: 'character_b.png',
};

const CHARACTER_BASE_SIZE = { width: 222, height: 243 };

/**
 * City Lines character - thin wrapper around shared CharacterSprite
 * that injects game-specific atlas name, sprite mapping, and base size.
 */
export class Character extends CharacterSprite<CharacterType> {
  constructor(type: CharacterType, gpuLoader: PixiLoader, scale: number = 1) {
    super(gpuLoader, {
      type,
      spriteMap: CHARACTER_SPRITES,
      atlasName: getAtlasName(),
      baseSize: CHARACTER_BASE_SIZE,
    }, scale);
  }
}
