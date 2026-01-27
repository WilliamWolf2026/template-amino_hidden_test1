import { Container, Sprite } from 'pixi.js';
import gsap from 'gsap';
import type { Edge, GridPosition } from '../types';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { getAtlasName } from '../utils/atlasHelper';

/** Highway exit - the target that landmarks must connect to */
export class Exit extends Container {
  readonly gridPosition: GridPosition;
  readonly facingEdge: Edge;

  private sprite: Sprite;
  private tileSize: number;

  constructor(
    position: GridPosition,
    facingEdge: Edge,
    gpuLoader: PixiLoader,
    tileSize: number
  ) {
    super();

    this.gridPosition = position;
    this.facingEdge = facingEdge;
    this.tileSize = tileSize;

    // Position on grid (x = column, y = row)
    this.x = position.x * tileSize + tileSize / 2;
    this.y = position.y * tileSize + tileSize / 2;

    // Create sprite (no rotation - exits always face the same direction)
    this.sprite = gpuLoader.createSprite(getAtlasName(), 'exit.png');
    this.sprite.anchor.set(0.5);
    this.sprite.width = tileSize * 0.85;
    this.sprite.height = tileSize * 0.85;

    this.addChild(this.sprite);
    this.label = 'exit';
  }

  /** Update tile size (for live tuning) */
  setTileSize(newSize: number): void {
    this.tileSize = newSize;
    this.x = this.gridPosition.x * newSize + newSize / 2;
    this.y = this.gridPosition.y * newSize + newSize / 2;
    this.sprite.width = newSize * 0.85;
    this.sprite.height = newSize * 0.85;
  }

  /** Animate to new layout (for live tuning with GSAP) */
  animateToLayout(
    tileSize: number,
    padding: number,
    cellGap: number,
    duration: number,
    delay = 0
  ): void {
    this.tileSize = tileSize;
    const effectiveSize = tileSize + cellGap;
    const targetX = padding + this.gridPosition.x * effectiveSize + tileSize / 2;
    const targetY = padding + this.gridPosition.y * effectiveSize + tileSize / 2;

    if (duration > 0) {
      gsap.to(this, {
        x: targetX,
        y: targetY,
        duration,
        ease: 'power2.out',
        delay,
      });
      gsap.to(this.sprite, {
        width: tileSize * 0.85,
        height: tileSize * 0.85,
        duration,
        ease: 'power2.out',
        delay,
      });
    } else {
      this.x = targetX;
      this.y = targetY;
      this.sprite.width = tileSize * 0.85;
      this.sprite.height = tileSize * 0.85;
    }
  }

  /** Clean up resources */
  override destroy(): void {
    super.destroy({ children: true });
  }
}
