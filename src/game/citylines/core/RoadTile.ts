import { Container, Sprite } from 'pixi.js';
import gsap from 'gsap';
import type { Edge, GridPosition, RoadTileType } from '../types';
import { EDGES } from '../types';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';

const ATLAS_NAME = 'tiles_citylines_v1';

/** Map tile type to sprite frames */
const TILE_SPRITES: Record<RoadTileType, { default: string; completed: string }> = {
  straight: { default: 'tile_a.png', completed: 'tile_a_completed.png' },
  corner: { default: 'tile_b.png', completed: 'tile_b_completed.png' },
  t_junction: { default: 'tile_c.png', completed: 'tile_c_completed.png' },
};

/**
 * Base connection edges for each tile type at rotation 0.
 * These rotate with the tile.
 */
const BASE_CONNECTIONS: Record<RoadTileType, Edge[]> = {
  straight: ['north', 'south'],      // Vertical straight
  corner: ['north', 'east'],         // Top-right corner
  t_junction: ['north', 'east', 'south'], // T facing right
};

/** Rotate an edge by 90 degrees clockwise */
function rotateEdge(edge: Edge, times: number): Edge {
  const index = EDGES.indexOf(edge);
  return EDGES[(index + times) % 4];
}

/** Road tile that can be rotated by player */
export class RoadTile extends Container {
  readonly type: RoadTileType;
  readonly gridPosition: GridPosition;
  readonly solutionRotation: number;

  private defaultSprite: Sprite;
  private completedSprite: Sprite;
  private _currentRotation: number;
  private _isConnected = false;
  private tileSize: number;

  constructor(
    type: RoadTileType,
    position: GridPosition,
    gpuLoader: PixiLoader,
    tileSize: number,
    solutionRotation: number,
    initialRotation: number
  ) {
    super();

    this.type = type;
    this.gridPosition = position;
    this.solutionRotation = solutionRotation;
    this._currentRotation = initialRotation;
    this.tileSize = tileSize;

    // Position on grid
    this.x = position.col * tileSize + tileSize / 2;
    this.y = position.row * tileSize + tileSize / 2;

    const sprites = TILE_SPRITES[type];

    // Create default sprite
    this.defaultSprite = gpuLoader.createSprite(ATLAS_NAME, sprites.default);
    this.defaultSprite.anchor.set(0.5);
    this.defaultSprite.width = tileSize;
    this.defaultSprite.height = tileSize;

    // Create completed sprite (hidden initially)
    this.completedSprite = gpuLoader.createSprite(ATLAS_NAME, sprites.completed);
    this.completedSprite.anchor.set(0.5);
    this.completedSprite.width = tileSize;
    this.completedSprite.height = tileSize;
    this.completedSprite.visible = false;

    this.addChild(this.defaultSprite);
    this.addChild(this.completedSprite);

    // Apply initial rotation
    this.applyRotation();

    // Make interactive
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.label = `road-${type}`;
  }

  get currentRotation(): number {
    return this._currentRotation;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  /** Get connected edges based on current rotation */
  getConnectedEdges(): Edge[] {
    const rotationSteps = this._currentRotation / 90;
    return BASE_CONNECTIONS[this.type].map((edge) => rotateEdge(edge, rotationSteps));
  }

  /** Check if correctly oriented (matches solution) */
  isCorrectlyOriented(): boolean {
    return this._currentRotation === this.solutionRotation;
  }

  /** Rotate 90 degrees clockwise */
  rotate(): void {
    this._currentRotation = (this._currentRotation + 90) % 360;
    this.applyRotation();
  }

  /** Set connected state (visual feedback) */
  setConnected(connected: boolean): void {
    this._isConnected = connected;
    this.defaultSprite.visible = !connected;
    this.completedSprite.visible = connected;
  }

  private applyRotation(): void {
    const radians = (this._currentRotation * Math.PI) / 180;
    this.defaultSprite.rotation = radians;
    this.completedSprite.rotation = radians;
  }

  /** Update tile size (for live tuning) */
  setTileSize(newSize: number): void {
    this.tileSize = newSize;
    this.x = this.gridPosition.col * newSize + newSize / 2;
    this.y = this.gridPosition.row * newSize + newSize / 2;
    this.defaultSprite.width = newSize;
    this.defaultSprite.height = newSize;
    this.completedSprite.width = newSize;
    this.completedSprite.height = newSize;
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
    const targetX = padding + this.gridPosition.col * effectiveSize + tileSize / 2;
    const targetY = padding + this.gridPosition.row * effectiveSize + tileSize / 2;

    if (duration > 0) {
      gsap.to(this, {
        x: targetX,
        y: targetY,
        duration,
        ease: 'power2.out',
        delay,
      });
      gsap.to(this.defaultSprite, {
        width: tileSize,
        height: tileSize,
        duration,
        ease: 'power2.out',
        delay,
      });
      gsap.to(this.completedSprite, {
        width: tileSize,
        height: tileSize,
        duration,
        ease: 'power2.out',
        delay,
      });
    } else {
      this.x = targetX;
      this.y = targetY;
      this.defaultSprite.width = tileSize;
      this.defaultSprite.height = tileSize;
      this.completedSprite.width = tileSize;
      this.completedSprite.height = tileSize;
    }
  }

  /** Clean up */
  override destroy(): void {
    super.destroy({ children: true });
  }
}
