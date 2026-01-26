import { Container, Sprite } from 'pixi.js';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { getAtlasName } from '../utils/atlasHelper';
import { DIALOGUE_BOX_BASE_SIZE, POSITIONING } from './CompanionConfig';

/**
 * Dialogue box sprite container
 * Uses 9-slice scaling via simple scaling (dialogue.png is designed for this)
 * Positioned at bottom center of screen
 */
export class DialogueBox extends Container {
  private boxSprite: Sprite;

  constructor(gpuLoader: PixiLoader, screenWidth: number, screenHeight: number) {
    super();

    // Create dialogue box sprite from atlas
    this.boxSprite = gpuLoader.createSprite(getAtlasName(), 'dialogue.png');
    this.boxSprite.anchor.set(0.5, 1); // Bottom center anchor

    // Calculate scale to fit screen
    this.updateScale(screenWidth);

    this.addChild(this.boxSprite);

    // Position at bottom center
    this.updatePosition(screenWidth, screenHeight);

    // Initially hidden (for animation)
    this.alpha = 0;

    this.label = 'dialogue-box';
  }

  /**
   * Update dialogue box scale based on screen width
   */
  private updateScale(screenWidth: number): void {
    const targetWidth = Math.min(
      screenWidth * POSITIONING.dialogueWidthPercent,
      POSITIONING.dialogueMaxWidth
    );
    const scale = targetWidth / DIALOGUE_BOX_BASE_SIZE;
    this.boxSprite.scale.set(scale);
  }

  /**
   * Update dialogue box position
   */
  private updatePosition(screenWidth: number, screenHeight: number): void {
    this.x = screenWidth / 2;
    this.y = screenHeight - POSITIONING.dialogueBottomPadding;
  }

  /**
   * Resize dialogue box (called on window resize)
   */
  resize(screenWidth: number, screenHeight: number): void {
    this.updateScale(screenWidth);
    this.updatePosition(screenWidth, screenHeight);
  }

  /**
   * Get current dialogue box width
   */
  getWidth(): number {
    return this.boxSprite.width;
  }

  /**
   * Get current dialogue box height
   */
  getHeight(): number {
    return this.boxSprite.height;
  }
}
