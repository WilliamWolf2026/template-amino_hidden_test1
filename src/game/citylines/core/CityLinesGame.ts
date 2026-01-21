import { Container, NineSliceSprite } from 'pixi.js';
import gsap from 'gsap';
import type { GridSize, LevelConfig } from '../types';
import { Landmark } from './Landmark';
import { Exit } from './Exit';
import { RoadTile } from './RoadTile';
import { ConnectionDetector, type TileConnections } from './ConnectionDetector';
import { posKey } from '../types';
import { DecorationSystem } from '../systems';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import type { NineSliceConfig } from '~/game/tuning';

/** Animation config for tuning transitions */
const TUNING_ANIMATION = {
  duration: 0.3,
  ease: 'power2.out',
  stagger: 0.015,
};

/** Events emitted by the game */
export interface CityLinesGameEvents {
  levelComplete: () => void;
  landmarkConnected: (landmark: Landmark) => void;
  tileRotated: () => void;
}

/** Main game controller for City Lines */
export class CityLinesGame extends Container {
  private gpuLoader: PixiLoader;
  private tileSize: number;
  private padding: number = 0;
  private cellGap: number = 0;
  private nineSlice: NineSliceConfig = {
    leftWidth: 20,
    topHeight: 20,
    rightWidth: 20,
    bottomHeight: 20,
  };

  private gridSize: GridSize = 4;
  private landmarks: Landmark[] = [];
  private exits: Exit[] = [];
  private roadTiles: RoadTile[] = [];
  private connectionDetector: ConnectionDetector;
  private decorationSystem: DecorationSystem;

  // Grid background (9-slice sprite)
  private gridBackground: NineSliceSprite | null = null;

  // Containers for layering
  private gridContainer: Container;
  private decorationsContainer: Container;
  private roadTilesContainer: Container;
  private landmarksContainer: Container;
  private exitsContainer: Container;

  // Event callbacks
  private eventHandlers: Partial<CityLinesGameEvents> = {};

  // Animation config for tile rotation (from tuning)
  private rotationAnimationConfig?: { duration: number; easing: string };

  constructor(gpuLoader: PixiLoader, tileSize: number = 128) {
    super();

    this.gpuLoader = gpuLoader;
    this.tileSize = tileSize;
    this.connectionDetector = new ConnectionDetector(this.gridSize);
    this.decorationSystem = new DecorationSystem(gpuLoader, tileSize);

    // Create layer containers
    this.gridContainer = new Container();
    this.gridContainer.label = 'grid';

    this.decorationsContainer = this.decorationSystem.getContainer();

    this.roadTilesContainer = new Container();
    this.roadTilesContainer.label = 'roadTiles';

    this.landmarksContainer = new Container();
    this.landmarksContainer.label = 'landmarks';

    this.exitsContainer = new Container();
    this.exitsContainer.label = 'exits';

    // Layer order: grid -> decorations -> roads -> exits -> landmarks
    this.addChild(this.gridContainer);
    this.addChild(this.decorationsContainer);
    this.addChild(this.roadTilesContainer);
    this.addChild(this.exitsContainer);
    this.addChild(this.landmarksContainer);

    this.label = 'citylines-game';
  }

  /** Register event handler */
  onGameEvent<K extends keyof CityLinesGameEvents>(
    event: K,
    handler: CityLinesGameEvents[K]
  ): void {
    this.eventHandlers[event] = handler;
  }

  /** Emit event */
  private emitEvent<K extends keyof CityLinesGameEvents>(
    event: K,
    ...args: Parameters<CityLinesGameEvents[K]>
  ): void {
    const handler = this.eventHandlers[event];
    if (handler) {
      (handler as (...args: unknown[]) => void)(...args);
    }
  }

  /** Load a level configuration */
  loadLevel(config: LevelConfig): void {
    this.clearLevel();

    this.gridSize = config.gridSize;
    this.connectionDetector = new ConnectionDetector(this.gridSize);

    // Create 9-slice grid background (single sprite)
    const texture = this.gpuLoader.getTexture('tiles_citylines_v1', 'grid_backing.png');
    this.gridBackground = new NineSliceSprite({
      texture,
      leftWidth: this.nineSlice.leftWidth,
      topHeight: this.nineSlice.topHeight,
      rightWidth: this.nineSlice.rightWidth,
      bottomHeight: this.nineSlice.bottomHeight,
    });

    // Size to fit grid with padding
    const totalSize = this.getGridPixelSize();
    this.gridBackground.width = totalSize;
    this.gridBackground.height = totalSize;
    this.gridContainer.addChild(this.gridBackground);

    // Create exits
    for (const exitConfig of config.exits) {
      const exit = new Exit(
        exitConfig.position,
        exitConfig.facingEdge,
        this.gpuLoader,
        this.tileSize
      );
      this.exits.push(exit);
      this.exitsContainer.addChild(exit);
    }

    // Create landmarks
    for (const landmarkConfig of config.landmarks) {
      const landmark = new Landmark(
        landmarkConfig.type,
        landmarkConfig.position,
        this.gpuLoader,
        this.tileSize,
        landmarkConfig.connectableEdges
      );
      this.landmarks.push(landmark);
      this.landmarksContainer.addChild(landmark);
    }

    // Create road tiles
    for (const tileConfig of config.roadTiles) {
      const roadTile = new RoadTile(
        tileConfig.type,
        { row: tileConfig.row, col: tileConfig.col },
        this.gpuLoader,
        this.tileSize,
        tileConfig.solutionRotation,
        tileConfig.initialRotation
      );

      // Add tap handler for rotation
      roadTile.on('pointertap', () => this.handleTileRotate(roadTile));

      this.roadTiles.push(roadTile);
      this.roadTilesContainer.addChild(roadTile);
    }

    // Initial connection check
    this.syncTileConnections();
    this.updateConnections();

    // Place decorations on empty cells
    const occupiedPositions = new Set<string>();
    for (const exit of this.exits) {
      occupiedPositions.add(posKey(exit.gridPosition));
    }
    for (const landmark of this.landmarks) {
      occupiedPositions.add(posKey(landmark.gridPosition));
    }
    for (const tile of this.roadTiles) {
      occupiedPositions.add(posKey(tile.gridPosition));
    }

    this.decorationSystem.placeDecorations(
      this.gridSize,
      occupiedPositions,
      config.county,
      config.levelNumber
    );
  }

  /** Handle tile rotation */
  private handleTileRotate(tile: RoadTile): void {
    tile.rotate(this.rotationAnimationConfig);
    this.syncTileConnections();
    this.updateConnections();
    this.emitEvent('tileRotated');
  }

  /** Set rotation animation config (from tuning) */
  setRotationAnimationConfig(config: { duration: number; easing: string }): void {
    this.rotationAnimationConfig = config;
  }

  /** Sync all road tile connections to detector */
  private syncTileConnections(): void {
    const tileConnections: TileConnections[] = this.roadTiles.map((tile) => ({
      position: tile.gridPosition,
      connectedEdges: tile.getConnectedEdges(),
    }));
    this.connectionDetector.setAllTiles(tileConnections);
  }

  /** Clear current level */
  clearLevel(): void {
    // Clear grid background
    this.gridContainer.removeChildren();
    this.gridBackground = null;

    // Clear decorations
    this.decorationSystem.clear();

    // Destroy landmarks
    for (const landmark of this.landmarks) {
      landmark.destroy();
    }
    this.landmarks = [];

    // Destroy exits
    for (const exit of this.exits) {
      exit.destroy();
    }
    this.exits = [];

    // Destroy road tiles
    for (const tile of this.roadTiles) {
      tile.off('pointertap');
      tile.destroy();
    }
    this.roadTiles = [];

    // Clear connection detector
    this.connectionDetector.clear();
  }

  /** Update road tile connections (called when tiles rotate) */
  updateTileConnections(tiles: TileConnections[]): void {
    this.connectionDetector.setAllTiles(tiles);
    this.updateConnections();
    this.emitEvent('tileRotated');
  }

  /** Update single tile connection */
  updateTileConnection(tile: TileConnections): void {
    this.connectionDetector.updateTile(tile);
    this.updateConnections();
    this.emitEvent('tileRotated');
  }

  /** Run connection detection and update landmarks + road tiles */
  private updateConnections(): void {
    const previouslyConnected = this.landmarks.filter((l) => l.isConnectedToExit);

    // Get connected tiles from detector
    const connectedTileKeys = this.connectionDetector.getConnectedTileKeys(this.exits);

    // Update road tile visuals
    for (const tile of this.roadTiles) {
      const key = posKey(tile.gridPosition);
      tile.setConnected(connectedTileKeys.has(key));
    }

    // Update landmarks
    this.connectionDetector.updateLandmarks(this.exits, this.landmarks);

    // Check for newly connected landmarks
    for (const landmark of this.landmarks) {
      if (landmark.isConnectedToExit && !previouslyConnected.includes(landmark)) {
        this.emitEvent('landmarkConnected', landmark);
      }
    }

    // Check win condition
    if (this.isLevelComplete()) {
      this.emitEvent('levelComplete');
    }
  }

  /** Check if all landmarks are connected */
  isLevelComplete(): boolean {
    return (
      this.landmarks.length > 0 &&
      this.landmarks.every((l) => l.isConnectedToExit)
    );
  }

  /** Get connected landmark count */
  getConnectedCount(): number {
    return this.landmarks.filter((l) => l.isConnectedToExit).length;
  }

  /** Get total landmark count */
  getTotalLandmarkCount(): number {
    return this.landmarks.length;
  }

  /** Get grid size */
  getGridSize(): GridSize {
    return this.gridSize;
  }

  /** Get tile size */
  getTileSize(): number {
    return this.tileSize;
  }

  /** Set tile size and update all elements with animation (for live tuning) */
  setTileSize(newSize: number, animate = true): void {
    if (newSize === this.tileSize) return;

    this.tileSize = newSize;
    this.updateLayout(animate);
  }

  /** Set grid layout (padding and cell gap) with animation */
  setGridLayout(padding: number, cellGap: number, animate = true): void {
    if (padding === this.padding && cellGap === this.cellGap) return;

    this.padding = padding;
    this.cellGap = cellGap;
    this.updateLayout(animate);
  }

  /** Set 9-slice border config (requires rebuilding background) */
  setNineSlice(config: NineSliceConfig): void {
    const changed =
      config.leftWidth !== this.nineSlice.leftWidth ||
      config.topHeight !== this.nineSlice.topHeight ||
      config.rightWidth !== this.nineSlice.rightWidth ||
      config.bottomHeight !== this.nineSlice.bottomHeight;

    if (!changed) return;

    this.nineSlice = { ...config };

    // Rebuild the 9-slice sprite with new borders
    if (this.gridBackground) {
      const texture = this.gpuLoader.getTexture('tiles_citylines_v1', 'grid_backing.png');
      const totalSize = this.getGridPixelSize();

      // Remove old background
      this.gridContainer.removeChild(this.gridBackground);
      this.gridBackground.destroy();

      // Create new background with updated borders
      this.gridBackground = new NineSliceSprite({
        texture,
        leftWidth: this.nineSlice.leftWidth,
        topHeight: this.nineSlice.topHeight,
        rightWidth: this.nineSlice.rightWidth,
        bottomHeight: this.nineSlice.bottomHeight,
      });
      this.gridBackground.width = totalSize;
      this.gridBackground.height = totalSize;

      // Add at the bottom of gridContainer
      this.gridContainer.addChildAt(this.gridBackground, 0);
    }
  }

  /** Update all element positions with optional animation */
  private updateLayout(animate = true): void {
    const { duration, ease, stagger } = TUNING_ANIMATION;
    const animDuration = animate ? duration : 0;

    // Update 9-slice grid background
    const totalSize = this.getGridPixelSize();
    if (this.gridBackground) {
      if (animate) {
        gsap.to(this.gridBackground, {
          width: totalSize,
          height: totalSize,
          duration: animDuration,
          ease,
        });
      } else {
        this.gridBackground.width = totalSize;
        this.gridBackground.height = totalSize;
      }
    }

    // Update exits
    this.exits.forEach((exit, i) => {
      exit.animateToLayout(this.tileSize, this.padding, this.cellGap, animate ? animDuration : 0, i * stagger);
    });

    // Update landmarks
    this.landmarks.forEach((landmark, i) => {
      landmark.animateToLayout(this.tileSize, this.padding, this.cellGap, animate ? animDuration : 0, i * stagger);
    });

    // Update road tiles
    this.roadTiles.forEach((tile, i) => {
      tile.animateToLayout(this.tileSize, this.padding, this.cellGap, animate ? animDuration : 0, i * stagger);
    });
  }

  /** Get total grid pixel size (including padding and gaps) */
  getGridPixelSize(): number {
    return this.padding * 2 + this.gridSize * this.tileSize + (this.gridSize - 1) * this.cellGap;
  }

  /** Get all landmarks */
  getLandmarks(): readonly Landmark[] {
    return this.landmarks;
  }

  /** Get all exits */
  getExits(): readonly Exit[] {
    return this.exits;
  }

  /** Clean up resources */
  override destroy(): void {
    this.clearLevel();
    this.decorationSystem.destroy();
    super.destroy({ children: true });
  }
}
