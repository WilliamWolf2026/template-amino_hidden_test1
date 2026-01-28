import { Container, Sprite } from 'pixi.js';
import gsap from 'gsap';
import type { Edge, GridPosition, RoadTileType } from '../types';
import { EDGES } from '../types';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { getAtlasName } from '../utils/atlasHelper';

/** Map tile type to sprite frames */
const TILE_SPRITES: Record<RoadTileType, { default: string; completed: string }> = {
  straight: { default: 'tile_a.png', completed: 'tile_a_completed.png' },
  corner: { default: 'tile_c.png', completed: 'tile_c_completed.png' },
  t_junction: { default: 'tile_b.png', completed: 'tile_b_completed.png' },
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
  readonly solutionRotation: number; // Rotation state (0, 1, 2, 3)

  private defaultSprite: Sprite;
  private completedSprite: Sprite;
  private _currentRotation: number; // Rotation state (0, 1, 2, 3) - aligned with generator
  private _visualRotation: number; // Cumulative degrees for smooth animations (never wraps)
  private _isConnected = false;
  private tileSize: number;

  constructor(
    type: RoadTileType,
    position: GridPosition,
    gpuLoader: PixiLoader,
    tileSize: number,
    solutionRotation: number, // Rotation state (0, 1, 2, 3)
    initialRotation: number // Rotation state (0, 1, 2, 3)
  ) {
    super();

    this.type = type;
    this.gridPosition = position;
    this.solutionRotation = solutionRotation;
    this._currentRotation = initialRotation;
    this._visualRotation = initialRotation * 90; // Convert state to degrees for animation
    this.tileSize = tileSize;

    // Position on grid (x = column, y = row)
    this.x = position.x * tileSize + tileSize / 2;
    this.y = position.y * tileSize + tileSize / 2;

    const sprites = TILE_SPRITES[type];

    // Create default sprite
    this.defaultSprite = gpuLoader.createSprite(getAtlasName(), sprites.default);
    this.defaultSprite.anchor.set(0.5);
    this.defaultSprite.width = tileSize;
    this.defaultSprite.height = tileSize;

    // Create completed sprite (hidden initially)
    this.completedSprite = gpuLoader.createSprite(getAtlasName(), sprites.completed);
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
    return this._currentRotation; // Returns rotation state (0, 1, 2, 3)
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  /** Get connected edges based on current rotation state */
  getConnectedEdges(): Edge[] {
    return BASE_CONNECTIONS[this.type].map((edge) => rotateEdge(edge, this._currentRotation));
  }

  /** Check if correctly oriented (matches solution) */
  isCorrectlyOriented(): boolean {
    return this._currentRotation === this.solutionRotation;
  }

  /** Rotate 90 degrees clockwise with optional animation */
  rotate(animationConfig?: { duration: number; easing: string }): void {
    this._currentRotation = (this._currentRotation + 1) % 4; // Increment rotation state
    this._visualRotation += 90; // Cumulative degrees for animation

    if (animationConfig && animationConfig.duration > 0) {
      const targetRadians = (this._visualRotation * Math.PI) / 180;

      // Kill any existing rotation animations to handle rapid taps
      gsap.killTweensOf(this.defaultSprite, 'rotation');
      gsap.killTweensOf(this.completedSprite, 'rotation');

      // Animate to absolute target (no relative +=, no onComplete needed)
      gsap.to(this.defaultSprite, {
        rotation: targetRadians,
        duration: animationConfig.duration / 1000,
        ease: animationConfig.easing,
      });
      gsap.to(this.completedSprite, {
        rotation: targetRadians,
        duration: animationConfig.duration / 1000,
        ease: animationConfig.easing,
      });
    } else {
      // Immediate (no animation)
      this.applyRotation();
    }
  }

  /** Set connected state (visual feedback) */
  setConnected(connected: boolean): void {
    this._isConnected = connected;
    this.defaultSprite.visible = !connected;
    this.completedSprite.visible = connected;
  }

  private applyRotation(): void {
    const radians = (this._visualRotation * Math.PI) / 180;
    this.defaultSprite.rotation = radians;
    this.completedSprite.rotation = radians;
  }

  /** Update tile size (for live tuning) */
  setTileSize(newSize: number): void {
    this.tileSize = newSize;
    this.x = this.gridPosition.x * newSize + newSize / 2;
    this.y = this.gridPosition.y * newSize + newSize / 2;
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
