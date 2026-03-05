import { Container, Sprite, Graphics } from 'pixi.js';
import gsap from 'gsap';
import type { Edge, GridPosition, LandmarkType } from '../types';
import { getLandmarkConfig } from '../data';
import type { PixiLoader } from '~/core/systems/assets/loaders/gpu/pixi';
import { getAtlasName } from '../utils/atlasHelper';

/** Visual representation of a landmark on the grid */
export class Landmark extends Container {
  readonly type: LandmarkType;
  readonly gridPosition: GridPosition;
  readonly connectableEdges: Edge[];

  private sprite: Sprite;
  private connectionIndicators: Map<Edge, Graphics> = new Map();
  private roadBackgrounds: Map<Edge, Container> = new Map();
  private _connectedEdges: Edge[] = [];
  private _isConnectedToExit = false;
  private tileSize: number;
  private gpuLoader: PixiLoader;

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
    this.tileSize = tileSize;
    this.gpuLoader = gpuLoader;

    const config = getLandmarkConfig(type);
    this.connectableEdges = connectableEdgesOverride ?? config.connectableEdges;

    // Position on grid (x = column, y = row)
    this.x = position.x * tileSize + tileSize / 2;
    this.y = position.y * tileSize + tileSize / 2;

    // Create road backgrounds (behind landmark sprite)
    this.createRoadBackgrounds(tileSize);

    // Create sprite
    this.sprite = gpuLoader.createSprite(getAtlasName(), config.spriteFrame);
    this.sprite.anchor.set(0.5);
    this.sprite.width = tileSize + 1;
    this.sprite.height = tileSize + 1;
    this.addChild(this.sprite);

    // Connection indicators removed per user request
    // this.createConnectionIndicators(tileSize);

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

  /** Create road background sprites for each connectable edge */
  private createRoadBackgrounds(tileSize: number): void {
    for (const edge of this.connectableEdges) {
      const container = new Container();
      container.label = `road-bg-${edge}`;

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

      // Rotation for each edge
      const rotations: Record<Edge, number> = {
        north: 0,
        east: Math.PI / 2,
        south: Math.PI,
        west: -Math.PI / 2,
      };
      container.rotation = rotations[edge];

      // Position at center of landmark
      container.x = 0;
      container.y = 0;

      // Store in map
      this.roadBackgrounds.set(edge, container);

      // Add BEFORE landmark sprite (so it's behind)
      this.addChild(container);
    }
  }

  private updateVisuals(): void {
    // Connection indicators removed per user request
    // for (const [edge, indicator] of this.connectionIndicators) {
    //   indicator.clear();
    //   indicator.circle(0, 0, indicator.width / 2 || 8);
    //
    //   if (this._connectedEdges.includes(edge)) {
    //     indicator.fill({ color: 0x27ae60 }); // Green when connected
    //   } else {
    //     indicator.fill({ color: 0xcccccc }); // Gray when unconnected
    //   }
    // }

    // Update road backgrounds visibility - always visible for connectable edges
    for (const [edge, roadBg] of this.roadBackgrounds) {
      roadBg.visible = true; // Always show roads for all connectable edges
    }

    // Landmark appearance - no darkening when unconnected per user request
    this.sprite.tint = 0xffffff;
    this.sprite.alpha = 1.0;
  }

  /** Update tile size (for live tuning) */
  setTileSize(newSize: number): void {
    this.tileSize = newSize;
    this.x = this.gridPosition.x * newSize + newSize / 2;
    this.y = this.gridPosition.y * newSize + newSize / 2;
    this.sprite.width = newSize + 1;
    this.sprite.height = newSize + 1;
    this.updateIndicatorPositions(newSize);
    this.updateRoadBackgroundPositions(newSize);
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
        width: tileSize + 1,
        height: tileSize + 1,
        duration,
        ease: 'power2.out',
        delay,
      });
    } else {
      this.x = targetX;
      this.y = targetY;
      this.sprite.width = tileSize + 1;
      this.sprite.height = tileSize + 1;
    }

    // Update indicators and road backgrounds (instant, as they're relative to sprite)
    this.updateIndicatorPositions(tileSize);
    this.updateRoadBackgroundPositions(tileSize);
  }

  /** Update connection indicator positions */
  private updateIndicatorPositions(tileSize: number): void {
    // Connection indicators removed per user request
    // const indicatorSize = tileSize * 0.08;
    // const offset = tileSize * 0.42;
    //
    // const edgePositions: Record<Edge, { x: number; y: number }> = {
    //   north: { x: 0, y: -offset },
    //   east: { x: offset, y: 0 },
    //   south: { x: 0, y: offset },
    //   west: { x: -offset, y: 0 },
    // };
    //
    // for (const [edge, indicator] of this.connectionIndicators) {
    //   const pos = edgePositions[edge];
    //   indicator.x = pos.x;
    //   indicator.y = pos.y;
    //   indicator.clear();
    //   indicator.circle(0, 0, indicatorSize);
    //   if (this._connectedEdges.includes(edge)) {
    //     indicator.fill({ color: 0x27ae60 });
    //   } else {
    //     indicator.fill({ color: 0xcccccc });
    //   }
    // }
  }

  /** Update road background positions and sizes */
  private updateRoadBackgroundPositions(tileSize: number): void {
    for (const [edge, container] of this.roadBackgrounds) {
      // Keep at center
      container.x = 0;
      container.y = 0;

      // Update road sprite and mask sizes
      const road = container.children[1] as Sprite;
      const mask = container.children[0] as Graphics;

      road.width = tileSize;
      road.height = tileSize;

      mask.clear();
      mask.rect(-tileSize / 2, -tileSize / 2, tileSize, tileSize / 2);
      mask.fill({ color: 0xffffff });
    }
  }

  /** Clean up resources */
  override destroy(): void {
    this.connectionIndicators.clear();
    this.roadBackgrounds.clear();
    super.destroy({ children: true });
  }
}
