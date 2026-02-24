import { Container, Sprite, Graphics } from 'pixi.js';
import gsap from 'gsap';
import type { BlockState, BlockColor, BlockShape } from '../types/block';
import type { GridPosition } from '../types/grid';
import { SHAPES } from '../data/shapes';
import { getAtlasName } from '../utils/atlasHelper';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';

/** Sprite frame for each block color */
function getPaletteFrame(color: BlockColor): string {
  return `ui-palette_${color}.png`;
}

/**
 * Visual representation of a polyomino block on the grid.
 * Renders one sprite per cell of the shape.
 */
export class Block extends Container {
  readonly blockId: string;
  readonly color: BlockColor;
  readonly shape: BlockShape;

  private cellSprites: Sprite[] = [];
  private highlightOverlay: Graphics | null = null;
  private cellSize: number;
  private gpuLoader: PixiLoader;

  constructor(
    state: BlockState,
    gpuLoader: PixiLoader,
    cellSize: number,
  ) {
    super();

    this.blockId = state.id;
    this.color = state.color;
    this.shape = state.shape;
    this.cellSize = cellSize;
    this.gpuLoader = gpuLoader;

    this.label = `block-${state.id}`;
    this.eventMode = 'static';

    // Create one sprite per cell of the polyomino
    const shapeDef = SHAPES[state.shape];
    const frame = getPaletteFrame(state.color);

    for (const cell of shapeDef.cells) {
      const sprite = gpuLoader.createSprite(getAtlasName(), frame);
      sprite.anchor.set(0);
      sprite.width = cellSize;
      sprite.height = cellSize;
      sprite.x = cell.col * cellSize;
      sprite.y = cell.row * cellSize;
      this.cellSprites.push(sprite);
      this.addChild(sprite);
    }

    // Position the container at the grid anchor
    this.setGridPosition(state.position);
  }

  /** Update container position from grid coordinates */
  setGridPosition(pos: GridPosition): void {
    this.x = pos.col * this.cellSize;
    this.y = pos.row * this.cellSize;
  }

  /** Animate sliding to a new grid position */
  slideTo(
    pos: GridPosition,
    distance: number,
    config: { durationPerCell: number; easing: string },
  ): Promise<void> {
    const targetX = pos.col * this.cellSize;
    const targetY = pos.row * this.cellSize;
    const duration = distance * config.durationPerCell;

    return new Promise((resolve) => {
      gsap.to(this, {
        x: targetX,
        y: targetY,
        duration,
        ease: config.easing,
        onComplete: resolve,
      });
    });
  }

  /** Play exit animation (slide out + fade) */
  playExitAnimation(
    direction: { col: number; row: number },
    config: { duration: number; easing: string },
  ): Promise<void> {
    // Slide 2 cells past the edge and fade out
    const exitDistance = 2 * this.cellSize;
    return new Promise((resolve) => {
      gsap.to(this, {
        x: this.x + direction.col * exitDistance,
        y: this.y + direction.row * exitDistance,
        alpha: 0,
        duration: config.duration,
        ease: config.easing,
        onComplete: resolve,
      });
    });
  }

  /** Play eraser animation (shrink + fade) */
  playEraserAnimation(duration: number = 0.3): Promise<void> {
    return new Promise((resolve) => {
      gsap.to(this.scale, {
        x: 0,
        y: 0,
        duration,
        ease: 'back.in(2)',
      });
      gsap.to(this, {
        alpha: 0,
        duration,
        ease: 'power2.in',
        onComplete: resolve,
      });
    });
  }

  /** Toggle highlight overlay (used in eraser mode) */
  setHighlighted(highlighted: boolean): void {
    if (highlighted && !this.highlightOverlay) {
      const shapeDef = SHAPES[this.shape];
      this.highlightOverlay = new Graphics();
      for (const cell of shapeDef.cells) {
        this.highlightOverlay.rect(
          cell.col * this.cellSize,
          cell.row * this.cellSize,
          this.cellSize,
          this.cellSize,
        );
      }
      this.highlightOverlay.fill({ color: 0xffffff, alpha: 0.3 });
      this.addChild(this.highlightOverlay);
    } else if (!highlighted && this.highlightOverlay) {
      this.removeChild(this.highlightOverlay);
      this.highlightOverlay.destroy();
      this.highlightOverlay = null;
    }
  }

  /** Get the pixel bounds width of this block */
  get blockPixelWidth(): number {
    return SHAPES[this.shape].width * this.cellSize;
  }

  /** Get the pixel bounds height of this block */
  get blockPixelHeight(): number {
    return SHAPES[this.shape].height * this.cellSize;
  }

  override destroy(): void {
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.scale);
    super.destroy({ children: true });
  }
}
