import { Container, Sprite, Text } from 'pixi.js';
import gsap from 'gsap';
import type { PixiLoader } from '~/core/systems/assets/loaders/gpu/pixi';
import { SpriteButton } from '~/game/dailydispatch/core/SpriteButton';
import { getAtlasName } from '~/game/dailydispatch/utils/atlasHelper';
import { GAME_FONT_FAMILY } from '~/game/config/fonts';

/**
 * Level completion overlay — shown at chapter end.
 * Full-screen bg-closing_truck background with Marty talking,
 * "Chapter Complete!" title above, and a NEXT button.
 */
export class LevelCompleteOverlay extends Container {
  private background: Sprite;
  private character: Sprite;
  private titleText: Text;
  private nextButton: SpriteButton | null = null;
  private onNext: (() => void) | null = null;

  constructor(private gpuLoader: PixiLoader) {
    super();
    this.label = 'level-complete-overlay';
    this.visible = false;

    const atlasName = getAtlasName();

    // Full-screen truck background
    this.background = gpuLoader.createSprite(atlasName, 'bg-closing_truck.png');
    this.background.anchor.set(0.5);
    this.addChild(this.background);

    // Marty talking character — natural sprite size
    this.character = gpuLoader.createSprite(atlasName, 'character-marty_talking.png');
    this.character.anchor.set(0.5, 1);
    this.addChild(this.character);

    // "Chapter Complete!" title — sits above character
    this.titleText = new Text({
      text: 'Chapter Complete!',
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 36,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: { color: '#000000', width: 5 },
        dropShadow: { color: '#000000', alpha: 0.5, blur: 4, distance: 2 },
      },
    });
    this.titleText.anchor.set(0.5);
    this.addChild(this.titleText);
  }

  /**
   * Show the chapter completion overlay.
   */
  show(
    screenWidth: number,
    screenHeight: number,
    moves: number,
    clue: string | null,
    onNext: () => void,
  ): void {
    this.onNext = onNext;

    const centerX = screenWidth / 2;

    // Scale background to fill height, centered
    const bgScale = screenHeight / this.background.texture.height;
    this.background.scale.set(bgScale);
    this.background.x = centerX;
    this.background.y = screenHeight / 2;

    // Character at lower-center — no scale change, natural size
    this.character.x = centerX;
    this.character.y = screenHeight * 0.78;

    // Title above character
    const charTop = this.character.y - this.character.height;
    this.titleText.x = centerX;
    this.titleText.y = charTop - 20;

    // Create NEXT button
    if (this.nextButton) {
      this.removeChild(this.nextButton);
      this.nextButton.destroy();
    }

    const atlasName = getAtlasName();
    this.nextButton = new SpriteButton(this.gpuLoader, {
      atlasName,
      spriteName: 'ui-button_start.png',
      label: 'NEXT',
      width: 160,
      height: 60,
      use9Slice: true,
      nineSliceBorders: { leftWidth: 32, topHeight: 32, rightWidth: 32, bottomHeight: 32 },
      labelStyle: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 28,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: { color: '#000000', width: 3 },
      },
      onClick: () => {
        this.hide();
        this.onNext?.();
      },
    });
    this.nextButton.x = centerX;
    this.nextButton.y = screenHeight * 0.88;
    this.addChild(this.nextButton);

    // Animate in: background fades, then character slides up, then title bounces
    this.visible = true;
    this.alpha = 0;
    this.character.alpha = 0;
    this.character.y += 40;
    this.titleText.alpha = 0;
    this.titleText.scale.set(0);
    if (this.nextButton) this.nextButton.alpha = 0;

    const tl = gsap.timeline();

    // Fade in background
    tl.to(this, { alpha: 1, duration: 0.3, ease: 'power2.out' });

    // Slide character up + fade in
    tl.to(this.character, {
      alpha: 1,
      y: this.character.y - 40,
      duration: 0.4,
      ease: 'power2.out',
    }, '-=0.1');

    // Title bounce in
    tl.to(this.titleText, { alpha: 1, duration: 0.1 }, '-=0.1');
    tl.to(this.titleText.scale, {
      x: 1, y: 1,
      duration: 0.4,
      ease: 'back.out(1.7)',
    }, '<');

    // Fade in NEXT button
    tl.to(this.nextButton, { alpha: 1, duration: 0.3, ease: 'power2.out' }, '-=0.2');
  }

  /** Hide the overlay */
  hide(): void {
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.character);
    gsap.killTweensOf(this.titleText);
    gsap.killTweensOf(this.titleText.scale);
    if (this.nextButton) gsap.killTweensOf(this.nextButton);
    this.visible = false;
    this.alpha = 0;
  }

  destroy(): void {
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.character);
    gsap.killTweensOf(this.titleText);
    gsap.killTweensOf(this.titleText.scale);
    if (this.nextButton) gsap.killTweensOf(this.nextButton);
    super.destroy({ children: true });
  }
}
