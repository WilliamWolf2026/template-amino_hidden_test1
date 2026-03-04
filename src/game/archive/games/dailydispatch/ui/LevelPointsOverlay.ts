import { Container, Sprite, Text } from 'pixi.js';
import gsap from 'gsap';
import type { PixiLoader } from '~/core/systems/assets/loaders/gpu/pixi';
import { SpriteButton } from '~/game/dailydispatch/core/SpriteButton';
import { getAtlasName } from '~/game/dailydispatch/utils/atlasHelper';
import { GAME_FONT_FAMILY } from '~/game/config/fonts';

export interface LevelPointsShowOptions {
  screenWidth: number;
  screenHeight: number;
  totalLevels: number;
  totalMoves: number;
  headline: string;
  articleUrl: string;
  onNext: () => void;
}

/**
 * Post-chapter story reveal overlay.
 * Shows bg-closing_truck_b background, story headline + link,
 * play stats, and a NEXT button to continue.
 */
export class LevelPointsOverlay extends Container {
  private background: Sprite;
  private character: Sprite;
  private headlineText: Text;
  private articleLink: Text;
  private statsText: Text;
  private nextButton: SpriteButton | null = null;
  private onNext: (() => void) | null = null;

  constructor(private gpuLoader: PixiLoader) {
    super();
    this.label = 'level-points-overlay';
    this.visible = false;

    const atlasName = getAtlasName();

    // Full-screen closed truck background
    this.background = gpuLoader.createSprite(atlasName, 'bg-closing_truck_b.png');
    this.background.anchor.set(0.5);
    this.addChild(this.background);

    // Marty idle character
    this.character = gpuLoader.createSprite(atlasName, 'character-marty_idle.png');
    this.character.anchor.set(0.5, 1);
    this.addChild(this.character);

    // Story headline
    this.headlineText = new Text({
      text: '',
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 26,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: { color: '#000000', width: 4 },
        wordWrap: true,
        wordWrapWidth: 300,
        align: 'center',
        lineHeight: 32,
      },
    });
    this.headlineText.anchor.set(0.5);
    this.addChild(this.headlineText);

    // Tappable article link
    this.articleLink = new Text({
      text: 'Read the full story',
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 16,
        fill: '#8BC4FF',
        align: 'center',
      },
    });
    this.articleLink.anchor.set(0.5);
    this.addChild(this.articleLink);

    // Stats line
    this.statsText = new Text({
      text: '',
      style: {
        fontFamily: GAME_FONT_FAMILY,
        fontSize: 18,
        fill: '#FFE66D',
        stroke: { color: '#000000', width: 3 },
        align: 'center',
      },
    });
    this.statsText.anchor.set(0.5);
    this.addChild(this.statsText);
  }

  /**
   * Show the story reveal overlay.
   */
  show(opts: LevelPointsShowOptions): void {
    const { screenWidth, screenHeight, totalLevels, totalMoves, headline, articleUrl, onNext } = opts;
    this.onNext = onNext;

    const centerX = screenWidth / 2;

    // Scale background to fill height
    const bgScale = screenHeight / this.background.texture.height;
    this.background.scale.set(bgScale);
    this.background.x = centerX;
    this.background.y = screenHeight / 2;

    // Character at lower-center
    const charScale = bgScale * 0.7;
    this.character.scale.set(charScale);
    this.character.x = centerX;
    this.character.y = screenHeight * 0.55;

    // Headline
    this.headlineText.text = headline;
    this.headlineText.style.wordWrapWidth = Math.min(300, screenWidth - 60);
    this.headlineText.x = centerX;
    this.headlineText.y = screenHeight * 0.18;

    // Article link
    this.articleLink.x = centerX;
    this.articleLink.y = this.headlineText.y + this.headlineText.height / 2 + 28;
    this.articleLink.eventMode = 'static';
    this.articleLink.cursor = 'pointer';
    this.articleLink.removeAllListeners();
    this.articleLink.on('pointertap', () => {
      window.open(articleUrl, '_blank');
    });

    // Stats
    this.statsText.text = `Levels: ${totalLevels}  |  Moves: ${totalMoves}`;
    this.statsText.x = centerX;
    this.statsText.y = screenHeight * 0.68;

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
    this.nextButton.y = screenHeight * 0.85;
    this.addChild(this.nextButton);

    // Animate in
    this.visible = true;
    this.alpha = 0;
    gsap.to(this, { alpha: 1, duration: 0.4, ease: 'power2.out' });

    // Headline bounce in
    this.headlineText.scale.set(0);
    gsap.to(this.headlineText.scale, { x: 1, y: 1, duration: 0.4, ease: 'back.out(1.7)', delay: 0.15 });
  }

  /** Hide the overlay */
  hide(): void {
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.headlineText.scale);
    this.articleLink.removeAllListeners();
    this.visible = false;
    this.alpha = 0;
  }

  destroy(): void {
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.headlineText.scale);
    this.articleLink.removeAllListeners();
    super.destroy({ children: true });
  }
}
