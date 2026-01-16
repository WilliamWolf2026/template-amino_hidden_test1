import { Container, Sprite, Graphics } from 'pixi.js';
import type { Edge, GridPosition, LandmarkType } from '../types';
import { getLandmarkConfig } from '../data';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';

const ATLAS_NAME = 'tiles_citylines_v1';

/** Visual representation of a landmark on the grid */
export class Landmark extends Container {
  readonly type: LandmarkType;
  readonly gridPosition: GridPosition;
  readonly connectableEdges: Edge[];

  private sprite: Sprite;
  private connectionIndicators: Map<Edge, Graphics> = new Map();
  private _connectedEdges: Edge[] = [];
  private _isConnectedToExit = false;

  constructor(
    type: LandmarkType,
    position: GridPosition,
    gpuLoader: PixiLoader,
    tileSize: number,
    connectableEdgesOverride?: Edge[]
  ) {
    super();

    this.type = type;
    this.gridPosition = position;

    const config = getLandmarkConfig(type);
    this.connectableEdges = connectableEdgesOverride ?? config.connectableEdges;

    // Position on grid
    this.x = position.col * tileSize + tileSize / 2;
    this.y = position.row * tileSize + tileSize / 2;

    // Create sprite
    this.sprite = gpuLoader.createSprite(ATLAS_NAME, config.spriteFrame);
    this.sprite.anchor.set(0.5);
    this.sprite.width = tileSize * 0.85;
    this.sprite.height = tileSize * 0.85;
    this.addChild(this.sprite);

    // Create connection indicators
    this.createConnectionIndicators(tileSize);

    // Initial visual state (unconnected)
    this.updateVisuals();

    this.label = `landmark-${type}`;
  }

  get connectedEdges(): Edge[] {
    return this._connectedEdges;
  }

  get isConnectedToExit(): boolean {
    return this._isConnectedToExit;
  }

  /** Update connection state */
  setConnected(connectedEdges: Edge[], isConnectedToExit: boolean): void {
    this._connectedEdges = connectedEdges;
    this._isConnectedToExit = isConnectedToExit;
    this.updateVisuals();
  }

  private createConnectionIndicators(tileSize: number): void {
    const indicatorSize = tileSize * 0.08;
    const offset = tileSize * 0.42;

    const edgePositions: Record<Edge, { x: number; y: number }> = {
      north: { x: 0, y: -offset },
      east: { x: offset, y: 0 },
      south: { x: 0, y: offset },
      west: { x: -offset, y: 0 },
    };

    for (const edge of this.connectableEdges) {
      const indicator = new Graphics();
      const pos = edgePositions[edge];

      indicator.circle(0, 0, indicatorSize);
      indicator.fill({ color: 0xcccccc });
      indicator.x = pos.x;
      indicator.y = pos.y;

      this.connectionIndicators.set(edge, indicator);
      this.addChild(indicator);
    }
  }

  private updateVisuals(): void {
    // Update connection indicators
    for (const [edge, indicator] of this.connectionIndicators) {
      indicator.clear();
      indicator.circle(0, 0, indicator.width / 2 || 8);

      if (this._connectedEdges.includes(edge)) {
        indicator.fill({ color: 0x27ae60 }); // Green when connected
      } else {
        indicator.fill({ color: 0xcccccc }); // Gray when unconnected
      }
    }

    // Update sprite appearance
    if (this._isConnectedToExit) {
      this.sprite.tint = 0xffffff;
      this.sprite.alpha = 1.0;
    } else {
      this.sprite.tint = 0xe0e0e0;
      this.sprite.alpha = 0.9;
    }
  }

  /** Clean up resources */
  override destroy(): void {
    this.connectionIndicators.clear();
    super.destroy({ children: true });
  }
}
