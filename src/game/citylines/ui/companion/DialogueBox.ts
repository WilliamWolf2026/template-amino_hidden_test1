import { Container, NineSliceSprite, Text } from 'pixi.js';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { getAtlasName } from '../../utils/atlasHelper';
import { DIALOGUE_BOX_BASE_SIZE, POSITIONING } from './CompanionConfig';

/**
 * Dialogue box sprite container
 * Uses NineSliceSprite for proper corner scaling (like grid_backing.png)
 * Includes Pixi Text for dialogue content
 */
export class DialogueBox extends Container {
  private boxSprite: NineSliceSprite;
  private textField: Text;
  private targetHeight: number;

  constructor(
    gpuLoader: PixiLoader,
    screenWidth: number,
    screenHeight: number,
    heightScale: number = 0.5 // Default to half height for peek effect
  ) {
    super();

    // Get texture for 9-slice sprite
    const texture = gpuLoader.getTexture(getAtlasName(), 'dialogue.png');

    // Create 9-slice sprite (borders won't stretch)
    this.boxSprite = new NineSliceSprite({
      texture,
      leftWidth: 20,
      topHeight: 20,
      rightWidth: 20,
      bottomHeight: 20,
    });
    this.boxSprite.anchor.set(0.5, 1); // Bottom center anchor

    // Calculate target dimensions
    const targetWidth = Math.min(
      screenWidth * POSITIONING.dialogueWidthPercent,
      POSITIONING.dialogueMaxWidth
    );
    this.targetHeight = 90 * heightScale; // Base height 90px, scaled by parameter

    // Set dimensions (9-slice handles corners automatically)
    this.boxSprite.width = targetWidth;
    this.boxSprite.height = this.targetHeight;

    this.addChild(this.boxSprite);

    // Create text field (Pixi Text, not DOM)
    this.textField = new Text({
      text: '',
      style: {
        fontFamily: 'Sniglet, system-ui, sans-serif',
        fontSize: 18,
        fill: '#2c2c2c',
        wordWrap: true,
        wordWrapWidth: targetWidth - 80, // More horizontal padding (40px each side)
        align: 'left',
        lineHeight: 26,
        padding: 4,
      },
    });
    // Position text inside dialogue box with more padding
    this.textField.anchor.set(0, 0.5); // Left-center anchor
    this.textField.x = -(targetWidth / 2) + 40; // 40px left padding
    this.textField.y = -(this.targetHeight / 2); // Centered vertically
    this.addChild(this.textField);

    // Position at bottom center
    this.updatePosition(screenWidth, screenHeight);

    // Initially hidden (for animation)
    this.alpha = 0;

    this.label = 'dialogue-box';
  }

  /**
   * Set dialogue text
   */
  setText(text: string): void {
    this.textField.text = text;
  }

  /**
   * Update dialogue box dimensions based on screen width
   */
  private updateDimensions(screenWidth: number): void {
    const targetWidth = Math.min(
      screenWidth * POSITIONING.dialogueWidthPercent,
      POSITIONING.dialogueMaxWidth
    );
    this.boxSprite.width = targetWidth;
    this.boxSprite.height = this.targetHeight;
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
    this.updateDimensions(screenWidth);
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
