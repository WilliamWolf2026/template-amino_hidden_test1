import { Container, Sprite } from 'pixi.js';
import type { PixiLoader } from '~/core/systems/assets/loaders/gpu/pixi';
import { getAtlasName } from '../../utils/atlasHelper';
import {
  type CharacterType,
  type CompanionDisplayMode,
  CHARACTER_SPRITES,
  CHARACTER_BASE_SIZE,
  CHARACTER_SCALES,
  POSITIONING,
} from './CompanionConfig';

/**
 * Companion character sprite container
 * Supports two display modes:
 * - 'full': Full body character (intro, chapter screens)
 * - 'head': Head only (level completion, masked by HTML overlay)
 */
export class CompanionCharacter extends Container {
  private sprite: Sprite;
  private characterType: CharacterType;
  private displayMode: CompanionDisplayMode;
  private gpuLoader: PixiLoader;

  constructor(
    type: CharacterType,
    gpuLoader: PixiLoader,
    mode: CompanionDisplayMode = 'full'
  ) {
    super();

    this.characterType = type;
    this.displayMode = mode;
    this.gpuLoader = gpuLoader;

    // Load character sprite from atlas
    const spriteName = CHARACTER_SPRITES[type];
    this.sprite = gpuLoader.createSprite(getAtlasName(), spriteName);
    this.sprite.anchor.set(0.5);

    // Apply scale based on display mode
    const scale = CHARACTER_SCALES[mode];
    this.sprite.width = CHARACTER_BASE_SIZE.width * scale;
    this.sprite.height = CHARACTER_BASE_SIZE.height * scale;

    this.addChild(this.sprite);

    // Start off-screen right for slide-in animation
    this.x = 2000;

    this.label = `companion-${type}-${mode}`;
  }

  /**
   * Position character for dialogue (right side of screen)
   * Used for: Introduction, Chapter Start, Chapter End
   */
  positionForDialogue(screenWidth: number, screenHeight: number): void {
    this.x = screenWidth - POSITIONING.rightEdgeOffset;
    this.y = screenHeight - POSITIONING.bottomOffset;
  }

  /**
   * Position character for level completion (center-ish)
   * Character head will be masked by circular HTML overlay
   */
  positionForCompletion(screenWidth: number, screenHeight: number): void {
    this.x = screenWidth / 2 - 100; // Left of center
    this.y = screenHeight / 2 - 50; // Near top of dialogue
  }

  /**
   * Get character type
   */
  getCharacterType(): CharacterType {
    return this.characterType;
  }

  /**
   * Get display mode
   */
  getDisplayMode(): CompanionDisplayMode {
    return this.displayMode;
  }

  /**
   * Update display mode and scale
   */
  setDisplayMode(mode: CompanionDisplayMode): void {
    if (this.displayMode === mode) return;

    this.displayMode = mode;
    const scale = CHARACTER_SCALES[mode];
    this.sprite.width = CHARACTER_BASE_SIZE.width * scale;
    this.sprite.height = CHARACTER_BASE_SIZE.height * scale;
  }

  /**
   * Swap character type at runtime (replaces sprite texture)
   */
  setCharacterType(type: CharacterType): void {
    if (this.characterType === type) return;

    this.characterType = type;
    const spriteName = CHARACTER_SPRITES[type];
    const texture = this.gpuLoader.getTexture(getAtlasName(), spriteName);
    this.sprite.texture = texture;

    // Re-apply current scale
    const scale = CHARACTER_SCALES[this.displayMode];
    this.sprite.width = CHARACTER_BASE_SIZE.width * scale;
    this.sprite.height = CHARACTER_BASE_SIZE.height * scale;

    this.label = `companion-${type}-${this.displayMode}`;
  }
}
