import { AvatarPopup } from '~/modules/prefabs/avatar-popup';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { getAtlasName } from '../utils/atlasHelper';
import { CHARACTER_BASE_SIZE } from './companion/CompanionConfig';
import { GAME_FONT_FAMILY } from '~/game/config/fonts';

/**
 * Daily Dispatch clue popup - thin wrapper around shared AvatarPopup
 * that injects game-specific atlas name, character sprite, and font.
 */
export class CluePopup extends AvatarPopup {
  constructor(gpuLoader: PixiLoader) {
    super(gpuLoader, {
      atlasName: getAtlasName(),
      characterSpriteName: 'character-marty_popup.png',
      dialogueSpriteName: 'ui-dialogue.png',
      characterBaseSize: CHARACTER_BASE_SIZE,
      fontFamily: GAME_FONT_FAMILY,
    });
  }
}
