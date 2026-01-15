import { Container, Sprite } from 'pixi.js';
import type { Edge, GridPosition, RoadTileType } from '../types';
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
  const edges: Edge[] = ['north', 'east', 'south', 'west'];
  const index = edges.indexOf(edge);
  return edges[(index + times) % 4];
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

  /** Clean up */
  override destroy(): void {
    super.destroy({ children: true });
  }
}
