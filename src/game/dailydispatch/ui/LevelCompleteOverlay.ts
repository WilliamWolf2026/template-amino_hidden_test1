import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { SpriteButton } from '~/game/dailydispatch/core/SpriteButton';
import { getAtlasName } from '~/game/dailydispatch/utils/atlasHelper';
import { GAME_FONT_FAMILY } from '~/game/config/fonts';

const CONFETTI_COUNT = 30;
const CONFETTI_COLORS = [0xFF6B6B, 0xFFE66D, 0x4ECDC4, 0xA8E6CF, 0xFF8C94, 0xC7CEEA];

/**
 * Level completion overlay with confetti, move count, clue text, and NEXT button.
 * Shown briefly between levels for a satisfying completion moment.
 */
export class LevelCompleteOverlay extends Container {
  private darkOverlay: Graphics;
  private confettiContainer: Container;
  private nextButton: SpriteButton | null = null;
  private titleText: Text;
  private moveText: Text;
  private clueText: Text;
  private onNext: (() => void) | null = null;
  private confettiPieces: Graphics[] = [];

  constructor(private gpuLoader: PixiLoader) {
    super();
    this.label = 'level-complete-overlay';
    this.visible = false;

    // Dark semi-transparent background
    this.darkOverlay = new Graphics();
    this.darkOverlay.eventMode = 'static';
    this.addChild(this.darkOverlay);

    // Confetti container
    this.confettiContainer = new Container();
    this.addChild(this.confettiContainer);

    // "Level Complete!" title
    this.titleText = new Text({
      text: 'Level Complete!',
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

    // Move count
    this.moveText = new Text({
      text: '',
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 22,
        fill: '#FFE66D',
        stroke: { color: '#000000', width: 3 },
      },
    });
    this.moveText.anchor.set(0.5);
    this.addChild(this.moveText);

    // Clue text
    this.clueText = new Text({
      text: '',
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 18,
        fill: '#ffffff',
        wordWrap: true,
        wordWrapWidth: 280,
        align: 'center',
        lineHeight: 24,
      },
    });
    this.clueText.anchor.set(0.5);
    this.addChild(this.clueText);
  }

  /**
   * Show the level completion overlay.
   */
  show(
    screenWidth: number,
    screenHeight: number,
    moves: number,
    clue: string | null,
    onNext: () => void,
  ): void {
    this.onNext = onNext;

    // Size overlay
    this.darkOverlay.clear();
    this.darkOverlay.rect(0, 0, screenWidth, screenHeight);
    this.darkOverlay.fill({ color: 0x000000, alpha: 0.7 });

    // Position elements
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    this.titleText.x = centerX;
    this.titleText.y = centerY - 80;

    this.moveText.text = `Moves: ${moves}`;
    this.moveText.x = centerX;
    this.moveText.y = centerY - 35;

    if (clue) {
      this.clueText.text = clue;
      this.clueText.style.wordWrapWidth = Math.min(280, screenWidth - 60);
      this.clueText.x = centerX;
      this.clueText.y = centerY + 10;
      this.clueText.visible = true;
    } else {
      this.clueText.visible = false;
    }

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
    this.nextButton.y = clue ? centerY + 80 : centerY + 40;
    this.addChild(this.nextButton);

    // Spawn confetti
    this.spawnConfetti(screenWidth, screenHeight);

    // Animate in
    this.visible = true;
    this.alpha = 0;
    gsap.to(this, { alpha: 1, duration: 0.3, ease: 'power2.out' });

    // Title bounce in
    this.titleText.scale.set(0);
    gsap.to(this.titleText.scale, { x: 1, y: 1, duration: 0.4, ease: 'back.out(1.7)', delay: 0.1 });
  }

  /** Hide the overlay */
  hide(): void {
    gsap.killTweensOf(this);
    this.clearConfetti();
    this.visible = false;
    this.alpha = 0;
  }

  private spawnConfetti(screenWidth: number, screenHeight: number): void {
    this.clearConfetti();

    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const piece = new Graphics();
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const w = 6 + Math.random() * 6;
      const h = 4 + Math.random() * 4;
      piece.rect(-w / 2, -h / 2, w, h);
      piece.fill({ color });

      piece.x = Math.random() * screenWidth;
      piece.y = -20 - Math.random() * 100;
      piece.rotation = Math.random() * Math.PI * 2;

      this.confettiContainer.addChild(piece);
      this.confettiPieces.push(piece);

      // Animate falling
      const duration = 1.5 + Math.random() * 1.5;
      const targetY = screenHeight + 20;
      gsap.to(piece, {
        y: targetY,
        rotation: piece.rotation + (Math.random() - 0.5) * 10,
        x: piece.x + (Math.random() - 0.5) * 120,
        duration,
        ease: 'power1.in',
        delay: Math.random() * 0.5,
      });
      gsap.to(piece, {
        alpha: 0,
        duration: 0.5,
        delay: duration - 0.3,
      });
    }
  }

  private clearConfetti(): void {
    for (const piece of this.confettiPieces) {
      gsap.killTweensOf(piece);
      piece.destroy();
    }
    this.confettiPieces = [];
    this.confettiContainer.removeChildren();
  }

  destroy(): void {
    this.clearConfetti();
    gsap.killTweensOf(this);
    if (this.titleText) gsap.killTweensOf(this.titleText.scale);
    super.destroy({ children: true });
  }
}
