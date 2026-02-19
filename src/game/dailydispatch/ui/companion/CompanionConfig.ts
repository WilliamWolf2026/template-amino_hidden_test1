/** Character types available in the game */
export type CharacterType = 'marty';

/** Display modes for companion character */
export type CompanionDisplayMode = 'full' | 'head';

/** Dialogue message structure (re-exported from template types) */
export type { DialogueMessage } from '~/game/types/dialogue';

/** Companion character configuration */
export interface CompanionConfig {
  type: CharacterType;
  mode: CompanionDisplayMode;
}

/** Character sprite mapping (atlas frame names) */
export const CHARACTER_SPRITES: Record<CharacterType, string> = {
  marty: 'character-marty_idle.png',
};

/** Character base dimensions (from atlas trimmed sizes) */
export const CHARACTER_BASE_SIZE = {
  width: 135,
  height: 244,
};

/** Character scale by display mode */
export const CHARACTER_SCALES: Record<CompanionDisplayMode, number> = {
  full: 1.0,
  head: 0.5,
};

/** Dialogue box base dimensions */
export const DIALOGUE_BOX_BASE_SIZE = 128;

/** Positioning constants */
export const POSITIONING = {
  rightEdgeOffset: 120,
  bottomOffset: 200,
  dialogueBottomPadding: 40,
  dialogueMaxWidth: 600,
  dialogueWidthPercent: 0.9,
};
