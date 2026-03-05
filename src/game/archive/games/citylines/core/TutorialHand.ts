import { Container } from 'pixi.js';
import gsap from 'gsap';
import { getAtlasName } from '../utils/atlasHelper';
import type { PixiLoader } from '~/core/systems/assets/loaders/gpu/pixi';
import type { TutorialHandTuning } from '~/game/tuning/types';

/**
 * Animated tutorial hand that demonstrates tapping a road tile.
 * Fades in from below on first appearance, then loops a tap animation
 * until the player taps a tile themselves.
 */
export class TutorialHand extends Container {
  private handSprite: Container;
  private timeline: gsap.core.Timeline | null = null;
  private introTween: gsap.core.Tween | null = null;
  private tuning: TutorialHandTuning;
  private onTap?: () => void;

  constructor(gpuLoader: PixiLoader, tuning: TutorialHandTuning, onTap?: () => void) {
    super();
    this.label = 'tutorialHand';
    this.tuning = tuning;
    this.onTap = onTap;

    // Create hand sprite from atlas
    const sprite = gpuLoader.createSprite(getAtlasName(), 'sprite-hand.png');
    sprite.anchor.set(0.5, 0.15); // Fingertip near the top
    this.handSprite = new Container();
    this.handSprite.addChild(sprite);

    // Scale hand to rest size
    this.handSprite.scale.set(tuning.restScale);

    this.addChild(this.handSprite);

    // Start invisible
    this.alpha = 0;
    this.visible = false;

    // Non-interactive — let taps pass through to tiles underneath
    this.eventMode = 'none';
  }

  /** Start the tutorial animation loop targeting the given position */
  show(targetX: number, targetY: number): void {
    const t = this.tuning;
    this.visible = true;

    // Starting position: same X as tile, offset below
    this.x = targetX;
    this.y = targetY + t.startOffsetY;
    this.alpha = 0;
    this.handSprite.scale.set(t.restScale);

    // One-time intro: fade in + slide up to tile
    this.introTween = gsap.to(this, {
      y: targetY,
      alpha: 1,
      duration: t.fadeInDuration,
      ease: 'power2.out',
      onComplete: () => {
        this.introTween = null;
        this.startTapLoop(targetX, targetY);
      },
    });
  }

  /** Build and start the repeating tap loop (no fade, just move + tap) */
  private startTapLoop(_targetX: number, targetY: number): void {
    const t = this.tuning;
    const restY = targetY + t.backOffDistance;

    this.timeline = gsap.timeline({ repeat: -1 });

    // 1. Wait before first tap
    this.timeline.to({}, { duration: t.waitBeforeTap });

    // 2. Tap press
    this.timeline.to(this.handSprite.scale, {
      x: t.tapPressScale,
      y: t.tapPressScale,
      duration: t.tapPressDuration,
      ease: 'power2.in',
    });

    // 3. Fire onTap callback (rotates tile)
    this.timeline.call(() => {
      this.onTap?.();
    });

    // 4. Hold
    this.timeline.to({}, { duration: t.tapHoldDuration });

    // 5. Release
    this.timeline.to(this.handSprite.scale, {
      x: t.restScale,
      y: t.restScale,
      duration: t.tapReleaseDuration,
      ease: 'power2.out',
    });

    // 6. Back off — move down to rest position
    this.timeline.to(this, {
      y: restY,
      duration: t.backOffDuration,
      ease: 'power2.out',
    });

    // 7. Wait before next tap
    this.timeline.to({}, { duration: t.waitBetweenTaps });

    // 8. Slide back up to tile
    this.timeline.to(this, {
      y: targetY,
      duration: t.slideUpDuration,
      ease: 'power2.out',
    });
  }

  /** Fade out and clean up the tutorial hand */
  hide(): void {
    if (this.introTween) {
      this.introTween.kill();
      this.introTween = null;
    }
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }

    gsap.to(this, {
      alpha: 0,
      duration: this.tuning.fadeOutDuration,
      ease: 'power2.in',
      onComplete: () => {
        this.visible = false;
        if (this.parent) {
          this.parent.removeChild(this);
        }
        this.destroy();
      },
    });
  }

  /** Clean up resources */
  override destroy(): void {
    if (this.introTween) {
      this.introTween.kill();
      this.introTween = null;
    }
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
    super.destroy({ children: true });
  }
}
