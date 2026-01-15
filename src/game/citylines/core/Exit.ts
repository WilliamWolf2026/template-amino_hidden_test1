import { Container, Sprite } from 'pixi.js';
import type { Edge, GridPosition } from '../types';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';

const ATLAS_NAME = 'tiles_citylines_v1';

/** Highway exit - the target that landmarks must connect to */
export class Exit extends Container {
  readonly gridPosition: GridPosition;
  readonly facingEdge: Edge;

  private sprite: Sprite;

  constructor(
    position: GridPosition,
    facingEdge: Edge,
    gpuLoader: PixiLoader,
    tileSize: number
  ) {
    super();

    this.gridPosition = position;
    this.facingEdge = facingEdge;

    // Position on grid
    this.x = position.col * tileSize + tileSize / 2;
    this.y = position.row * tileSize + tileSize / 2;

    // Create sprite
    this.sprite = gpuLoader.createSprite(ATLAS_NAME, 'exit.png');
    this.sprite.anchor.set(0.5);
    this.sprite.width = tileSize * 0.85;
    this.sprite.height = tileSize * 0.85;

    // Rotate based on facing edge
    this.sprite.rotation = this.getRotationForEdge(facingEdge);

    this.addChild(this.sprite);
    this.label = 'exit';
  }

  private getRotationForEdge(edge: Edge): number {
    switch (edge) {
      case 'south':
        return 0; // Default orientation facing south
      case 'west':
        return Math.PI / 2; // 90 degrees
      case 'north':
        return Math.PI; // 180 degrees
      case 'east':
        return -Math.PI / 2; // -90 degrees
    }
  }

  /** Clean up resources */
  override destroy(): void {
    super.destroy({ children: true });
  }
}
