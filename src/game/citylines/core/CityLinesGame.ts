import { Container } from 'pixi.js';
import type { GridSize, LevelConfig } from '../types';
import { Landmark } from './Landmark';
import { Exit } from './Exit';
import { RoadTile } from './RoadTile';
import { ConnectionDetector, type TileConnections } from './ConnectionDetector';
import { posKey } from '../types';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';

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

  private gridSize: GridSize = 4;
  private landmarks: Landmark[] = [];
  private exits: Exit[] = [];
  private roadTiles: RoadTile[] = [];
  private connectionDetector: ConnectionDetector;

  // Containers for layering
  private gridContainer: Container;
  private roadTilesContainer: Container;
  private landmarksContainer: Container;
  private exitsContainer: Container;

  // Event callbacks
  private eventHandlers: Partial<CityLinesGameEvents> = {};

  constructor(gpuLoader: PixiLoader, tileSize: number = 128) {
    super();

    this.gpuLoader = gpuLoader;
    this.tileSize = tileSize;
    this.connectionDetector = new ConnectionDetector(this.gridSize);

    // Create layer containers
    this.gridContainer = new Container();
    this.gridContainer.label = 'grid';

    this.roadTilesContainer = new Container();
    this.roadTilesContainer.label = 'roadTiles';

    this.landmarksContainer = new Container();
    this.landmarksContainer.label = 'landmarks';

    this.exitsContainer = new Container();
    this.exitsContainer.label = 'exits';

    this.addChild(this.gridContainer);
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

    // Create grid cell backgrounds
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const cellBg = this.gpuLoader.createSprite('tiles_citylines_v1', 'grid_backing.png');
        cellBg.anchor.set(0.5);
        cellBg.width = this.tileSize;
        cellBg.height = this.tileSize;
        cellBg.x = col * this.tileSize + this.tileSize / 2;
        cellBg.y = row * this.tileSize + this.tileSize / 2;
        this.gridContainer.addChild(cellBg);
      }
    }

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
  }

  /** Handle tile rotation */
  private handleTileRotate(tile: RoadTile): void {
    tile.rotate();
    this.syncTileConnections();
    this.updateConnections();
    this.emitEvent('tileRotated');
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
    // Clear grid backgrounds
    this.gridContainer.removeChildren();

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
    super.destroy({ children: true });
  }
}
