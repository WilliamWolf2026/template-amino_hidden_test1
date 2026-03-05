import { Container, Graphics, Sprite, Text } from 'pixi.js';
import gsap from 'gsap';
import type { PixiLoader } from '~/core/systems/assets/loaders/gpu/pixi';
import { getAtlasName } from '~/game/dailydispatch/utils/atlasHelper';
import { GAME_FONT_FAMILY } from '~/game/config/fonts';

/**
 * Chapter-end truck door closing overlay.
 * Shows a truck door that the player swipes to close, revealing the completed chapter.
 */
export class TruckCloseOverlay extends Container {
  private darkOverlay: Graphics;
  private doorOpen: Sprite;
  private doorClosed: Sprite;
  private instructionText: Text;
  private isDragging = false;
  private dragStartY = 0;
  private doorProgress = 0; // 0 = open, 1 = closed
  private onComplete: (() => void) | null = null;

  constructor(gpuLoader: PixiLoader) {
    super();
    this.label = 'truck-close-overlay';
    this.visible = false;

    const atlasName = getAtlasName();

    // Dark background
    this.darkOverlay = new Graphics();
    this.addChild(this.darkOverlay);

    // Truck door sprites
    this.doorOpen = gpuLoader.createSprite(atlasName, 'prop-truck_door_open.png');
    this.doorOpen.anchor.set(0.5);
    this.addChild(this.doorOpen);

    this.doorClosed = gpuLoader.createSprite(atlasName, 'prop-truck_door_closed.png');
    this.doorClosed.anchor.set(0.5);
    this.doorClosed.alpha = 0;
    this.addChild(this.doorClosed);

    // "Swipe down to close" instruction
    this.instructionText = new Text({
      text: 'Swipe down to close!',
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 22,
        fill: '#ffffff',
        stroke: { color: '#000000', width: 4 },
      },
    });
    this.instructionText.anchor.set(0.5);
    this.addChild(this.instructionText);

    // Swipe interaction
    this.doorOpen.eventMode = 'static';
    this.doorOpen.cursor = 'grab';

    this.doorOpen.on('pointerdown', (e) => {
      this.isDragging = true;
      this.dragStartY = e.globalY;
    });

    this.doorOpen.on('pointermove', (e) => {
      if (!this.isDragging) return;
      const delta = e.globalY - this.dragStartY;
      this.doorProgress = Math.min(1, Math.max(0, delta / 150));
      this.updateDoorVisual();
    });

    this.doorOpen.on('pointerup', () => {
      if (!this.isDragging) return;
      this.isDragging = false;

      if (this.doorProgress > 0.5) {
        this.completeDoorClose();
      } else {
        // Snap back open
        gsap.to(this, {
          doorProgress: 0,
          duration: 0.3,
          ease: 'power2.out',
          onUpdate: () => this.updateDoorVisual(),
        });
      }
    });

    this.doorOpen.on('pointerupoutside', () => {
      if (!this.isDragging) return;
      this.isDragging = false;

      if (this.doorProgress > 0.5) {
        this.completeDoorClose();
      } else {
        gsap.to(this, {
          doorProgress: 0,
          duration: 0.3,
          ease: 'power2.out',
          onUpdate: () => this.updateDoorVisual(),
        });
      }
    });
  }

  /**
   * Show the truck close overlay.
   */
  show(screenWidth: number, screenHeight: number, onComplete: () => void): void {
    this.onComplete = onComplete;
    this.doorProgress = 0;

    // Size overlay
    this.darkOverlay.clear();
    this.darkOverlay.rect(0, 0, screenWidth, screenHeight);
    this.darkOverlay.fill({ color: 0x2A1A0E, alpha: 0.9 });

    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    // Scale door to fit screen
    const doorScale = Math.min(
      (screenWidth * 0.7) / this.doorOpen.texture.width,
      (screenHeight * 0.5) / this.doorOpen.texture.height,
    );
    this.doorOpen.scale.set(doorScale);
    this.doorOpen.x = centerX;
    this.doorOpen.y = centerY;

    this.doorClosed.scale.set(doorScale);
    this.doorClosed.x = centerX;
    this.doorClosed.y = centerY;
    this.doorClosed.alpha = 0;

    this.instructionText.x = centerX;
    this.instructionText.y = centerY + (this.doorOpen.texture.height * doorScale) / 2 + 40;

    this.updateDoorVisual();

    // Animate in
    this.visible = true;
    this.alpha = 0;
    gsap.to(this, { alpha: 1, duration: 0.4, ease: 'power2.out' });

    // Pulse instruction text
    gsap.to(this.instructionText, {
      alpha: 0.5,
      duration: 0.8,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private updateDoorVisual(): void {
    // Cross-fade between open and closed sprites
    this.doorOpen.alpha = 1 - this.doorProgress;
    this.doorClosed.alpha = this.doorProgress;
    // Slight downward shift as door closes
    const offsetY = this.doorProgress * 20;
    this.doorClosed.y = this.doorOpen.y + offsetY;
  }

  private completeDoorClose(): void {
    this.doorOpen.eventMode = 'none';

    gsap.to(this, {
      doorProgress: 1,
      duration: 0.4,
      ease: 'power2.out',
      onUpdate: () => this.updateDoorVisual(),
      onComplete: () => {
        // Brief pause then callback
        gsap.to(this.instructionText, { alpha: 0, duration: 0.2 });
        gsap.delayedCall(0.6, () => {
          this.onComplete?.();
        });
      },
    });
  }

  /** Hide the overlay */
  hide(): void {
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.instructionText);
    this.visible = false;
    this.alpha = 0;
  }

  destroy(): void {
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.instructionText);
    super.destroy({ children: true });
  }
}
