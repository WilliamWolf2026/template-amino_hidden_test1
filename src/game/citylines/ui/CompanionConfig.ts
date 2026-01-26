import type { GridPosition } from '../types';

/** Character types available in the game */
export type CharacterType = 'news_hound' | 'paper_kid';

/** Display modes for companion character */
export type CompanionDisplayMode = 'full' | 'head';

/** Dialogue message structure */
export interface DialogueMessage {
  id: string;
  speaker?: string;
  text: string;
}

/** Companion character configuration */
export interface CompanionConfig {
  type: CharacterType;
  mode: CompanionDisplayMode;
}

/** Character sprite mapping */
export const CHARACTER_SPRITES: Record<CharacterType, string> = {
  news_hound: 'character_b.png',
  paper_kid: 'character_a.png',
};

/** Character base dimensions (from assets) */
export const CHARACTER_BASE_SIZE = {
  width: 222,
  height: 243,
};

/** Character scale by display mode */
export const CHARACTER_SCALES: Record<CompanionDisplayMode, number> = {
  full: 0.8,
  head: 0.4,
};

/** Dialogue box base dimensions */
export const DIALOGUE_BOX_BASE_SIZE = 128;

/** Positioning constants */
export const POSITIONING = {
  /** Distance from right edge for full character */
  rightEdgeOffset: 120,
  /** Distance from bottom for full character */
  bottomOffset: 200,
  /** Bottom padding for dialogue box */
  dialogueBottomPadding: 40,
  /** Max dialogue box width */
  dialogueMaxWidth: 600,
  /** Dialogue box screen width percentage */
  dialogueWidthPercent: 0.9,
};
