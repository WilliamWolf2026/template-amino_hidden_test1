import { Container, Sprite } from 'pixi.js';
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

/**
 * Character class for rendering character sprites
 *
 * This class represents the game's companion character (Paper Kid or News Hound)
 * that appears on the start screen and throughout the game flow.
 *
 * Base sprite dimensions: 222x243 pixels
 */
export class Character extends Container {
  readonly characterType: CharacterType;
  private sprite: Sprite;

  /**
   * Creates a new Character instance
   *
   * @param type - The character type to display
   * @param gpuLoader - The GPU loader for creating sprites from the atlas
   * @param scale - Scale factor for the character (default: 1)
   */
  constructor(type: CharacterType, gpuLoader: PixiLoader, scale: number = 1) {
    super();

    this.characterType = type;

    // Create sprite from atlas
    const spriteName = CHARACTER_SPRITES[type];
    this.sprite = gpuLoader.createSprite(getAtlasName(), spriteName);

    // Set center anchor for easy positioning
    this.sprite.anchor.set(0.5);

    // Apply scale (base size is 222x243)
    this.sprite.width = 222 * scale;
    this.sprite.height = 243 * scale;

    this.addChild(this.sprite);
    this.label = `character-${type}`;
  }

  /**
   * Updates the scale of the character sprite
   *
   * @param scale - New scale factor
   */
  setScale(scale: number): void {
    this.sprite.width = 222 * scale;
    this.sprite.height = 243 * scale;
  }

  /**
   * Gets the current scale of the character
   */
  getScale(): number {
    return this.sprite.width / 222;
  }

  override destroy(options?: boolean | { children?: boolean; texture?: boolean }): void {
    super.destroy(options);
  }
}
