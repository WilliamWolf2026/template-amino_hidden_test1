import { Container, Sprite, Graphics } from 'pixi.js';
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
  private gpuLoader: PixiLoader;
  private roadBackground: Container;

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
    this.gpuLoader = gpuLoader;

    // Position on grid (x = column, y = row)
    this.x = position.x * tileSize + tileSize / 2;
    this.y = position.y * tileSize + tileSize / 2;

    // Create road background (behind exit sprite)
    this.createRoadBackground(tileSize);

    // Create sprite (no rotation - exits always face the same direction)
    this.sprite = gpuLoader.createSprite(getAtlasName(), 'exit.png');
    this.sprite.anchor.set(0.5);
    this.sprite.width = tileSize * 0.85;
    this.sprite.height = tileSize * 0.85;

    this.addChild(this.sprite);
    this.label = 'exit';
  }

  /** Create road background sprite for the facing edge */
  private createRoadBackground(tileSize: number): void {
    const container = new Container();
    container.label = 'road-bg';

    // Create straight road sprite
    const road = this.gpuLoader.createSprite(getAtlasName(), 'tile_a_completed.png');
    road.anchor.set(0.5, 1); // Anchor at bottom-center
    road.width = tileSize;
    road.height = tileSize;
    road.y = 0;

    // Create mask to show only top half (the half extending away)
    const mask = new Graphics();
    mask.rect(-tileSize / 2, -tileSize / 2, tileSize, tileSize / 2);
    mask.fill({ color: 0xffffff });
    road.mask = mask;

    container.addChild(mask);
    container.addChild(road);

    // Rotation for the facing edge
    const rotations: Record<Edge, number> = {
      north: 0,
      east: Math.PI / 2,
      south: Math.PI,
      west: -Math.PI / 2,
    };
    container.rotation = rotations[this.facingEdge];

    // Position at center of exit
    container.x = 0;
    container.y = 0;

    this.roadBackground = container;

    // Add BEFORE exit sprite (so it's behind)
    this.addChild(container);
  }

  /** Update tile size (for live tuning) */
  setTileSize(newSize: number): void {
    this.tileSize = newSize;
    this.x = this.gridPosition.x * newSize + newSize / 2;
    this.y = this.gridPosition.y * newSize + newSize / 2;
    this.sprite.width = newSize * 0.85;
    this.sprite.height = newSize * 0.85;
    this.updateRoadBackgroundSize(newSize);
  }

  /** Update road background size */
  private updateRoadBackgroundSize(tileSize: number): void {
    const road = this.roadBackground.children[1] as Sprite;
    const mask = this.roadBackground.children[0] as Graphics;

    road.width = tileSize;
    road.height = tileSize;

    mask.clear();
    mask.rect(-tileSize / 2, -tileSize / 2, tileSize, tileSize / 2);
    mask.fill({ color: 0xffffff });
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

    // Update road background size (instant, as it's relative to exit)
    this.updateRoadBackgroundSize(tileSize);
  }

  /** Clean up resources */
  override destroy(): void {
    super.destroy({ children: true });
  }
}
