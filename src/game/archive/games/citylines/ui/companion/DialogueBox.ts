import { DialogueBox as SharedDialogueBox } from '~/modules/primitives/dialogue-box';
import type { PixiLoader } from '~/core/systems/assets/loaders/gpu/pixi';
import { getAtlasName } from '../../utils/atlasHelper';
import { POSITIONING } from './CompanionConfig';
import { GAME_FONT_FAMILY } from '~/game/config/fonts';

/**
 * City Lines dialogue box - thin wrapper around shared DialogueBox
 * that injects game-specific atlas name, font, and positioning.
 */
export class DialogueBox extends SharedDialogueBox {
  constructor(
    gpuLoader: PixiLoader,
    screenWidth: number,
    screenHeight: number,
    heightScale: number = 0.5
  ) {
    super(gpuLoader, {
      atlasName: getAtlasName(),
      spriteName: 'dialogue.png',
      fontFamily: GAME_FONT_FAMILY,
      positioning: {
        dialogueBottomPadding: POSITIONING.dialogueBottomPadding,
        dialogueMaxWidth: POSITIONING.dialogueMaxWidth,
        dialogueWidthPercent: POSITIONING.dialogueWidthPercent,
      },
    }, screenWidth, screenHeight, heightScale);
  }
}
