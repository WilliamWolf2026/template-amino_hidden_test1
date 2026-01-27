import { AnimatedSprite, Container, NineSliceSprite } from 'pixi.js';
import gsap from 'gsap';
import type { GridSize, LevelConfig } from '../types';
import { Landmark } from './Landmark';
import { Exit } from './Exit';
import { RoadTile } from './RoadTile';
import { posKey } from '../types';
import { DecorationSystem } from '../systems';
import { getAtlasName } from '../utils/atlasHelper';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import type { NineSliceConfig } from '~/game/tuning';
import {
  createLevelCompletionController,
  type LevelCompletionController,
} from '../controllers';
import {
  evaluateConnections,
  type TileData,
  type LandmarkData,
  type ExitData,
} from '../utils';

/** Animation config for tuning transitions */
const TUNING_ANIMATION = {
  duration: 0.3,
  ease: 'power2.out',
  stagger: 0.015,
};

/** Level complete event payload */
export interface LevelCompletePayload {
  levelId: number;
  moves: number;
  durationMs: number;
}

/** Events emitted by the game */
export interface CityLinesGameEvents {
  levelComplete: (payload: LevelCompletePayload) => void;
  landmarkConnected: (landmark: Landmark) => void;
  tileRotated: () => void;
  completionStart: (clue: string) => void;
  clueTimerEnd: () => void;
  completionEnd: () => void;
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
  private decorationSystem: DecorationSystem;

  // Grid background (9-slice sprite)
  private gridBackground: NineSliceSprite | null = null;

  // Containers for layering
  private gridContainer: Container;
  private decorationsContainer: Container;
  private roadTilesContainer: Container;
  private vfxContainer: Container;
  private landmarksContainer: Container;
  private exitsContainer: Container;

  // Event callbacks
  private eventHandlers: Partial<CityLinesGameEvents> = {};

  // Animation config for tile rotation (from tuning)
  private rotationAnimationConfig?: { duration: number; easing: string };

  // Completion lifecycle
  private completionController: LevelCompletionController;
  private currentLevelConfig: LevelConfig | null = null;
  private moveCount: number = 0;
  private levelStartTime: number = 0;

  constructor(
    gpuLoader: PixiLoader,
    tileSize: number = 128
  ) {
    super();

    this.gpuLoader = gpuLoader;
    this.tileSize = tileSize;
    this.decorationSystem = new DecorationSystem(gpuLoader, tileSize);

    // Create completion controller
    this.completionController = createLevelCompletionController({
      events: {
        onCompletionStart: (clue) => this.emitEvent('completionStart', clue),
        onClueTimerEnd: () => this.emitEvent('clueTimerEnd'),
        onCompletionEnd: () => this.emitEvent('completionEnd'),
        onLevelComplete: (payload) => this.emitEvent('levelComplete', payload),
      },
      celebrationDuration: 500,
      clueDuration: 3000,
    });

    // Create layer containers
    this.gridContainer = new Container();
    this.gridContainer.label = 'grid';

    this.decorationsContainer = this.decorationSystem.getContainer();

    this.roadTilesContainer = new Container();
    this.roadTilesContainer.label = 'roadTiles';

    this.vfxContainer = new Container();
    this.vfxContainer.label = 'vfx';

    this.landmarksContainer = new Container();
    this.landmarksContainer.label = 'landmarks';

    this.exitsContainer = new Container();
    this.exitsContainer.label = 'exits';

    // Layer order: grid -> decorations -> roads -> vfx -> exits -> landmarks
    this.addChild(this.gridContainer);
    this.addChild(this.decorationsContainer);
    this.addChild(this.roadTilesContainer);
    this.addChild(this.vfxContainer);
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

    this.currentLevelConfig = config;
    this.moveCount = 0;
    this.levelStartTime = Date.now();
    this.completionController.reset();

    this.gridSize = config.gridSize;

    // Create 9-slice grid background (single sprite)
    const texture = this.gpuLoader.getTexture(getAtlasName(), 'grid_backing.png');
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

    // Set pivot to center for center-based scaling
    this.updatePivot(false);
  }

  /** Handle tile rotation */
  private handleTileRotate(tile: RoadTile): void {
    // Block input during completion sequence
    if (this.completionController.isInputBlocked) {
      return;
    }

    // Rotate tile
    tile.rotate(this.rotationAnimationConfig);

    // Play rotation VFX
    this.playRotateVFX(tile);

    // Increment move counter
    this.moveCount++;

    // Update connections
    this.updateConnections();

    // Emit event
    this.emitEvent('tileRotated');
  }

  /** Play rotation VFX on a tile */
  private playRotateVFX(tile: RoadTile): void {
    // Check if VFX sheet is loaded
    if (!this.gpuLoader.hasSheet('vfx-rotate')) {
      return;
    }

    // Create animated sprite from spritesheet
    const vfx = this.gpuLoader.createAnimatedSprite('vfx-rotate', 'rotate');

    // Position at tile center
    vfx.anchor.set(0.5);
    vfx.x = tile.x;
    vfx.y = tile.y;

    // VFX 160% of tile size, flipped horizontally for clockwise spin
    const vfxScale = (this.tileSize / 256) * 1.6;
    vfx.scale.set(-vfxScale, vfxScale);
    vfx.alpha = 1;

    // Random initial rotation for visual variety
    vfx.rotation = Math.random() * Math.PI * 2;

    // Animation settings - faster than tile rotation
    // 24 frames, 60fps ticker: animationSpeed = frames / (duration_ms * 0.06) * 1.5
    const duration = this.rotationAnimationConfig?.duration ?? 300;
    vfx.animationSpeed = (24 / (duration * 0.06)) * 1.5;
    vfx.loop = false;

    // Remove when animation completes
    vfx.onComplete = () => {
      this.vfxContainer.removeChild(vfx);
      vfx.destroy();
    };

    // Add to VFX layer and play
    this.vfxContainer.addChild(vfx);
    vfx.play();
  }

  /** Set rotation animation config (from tuning) */
  setRotationAnimationConfig(config: { duration: number; easing: string }): void {
    this.rotationAnimationConfig = config;
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
  }

  /** Run connection evaluation and update visuals */
  private updateConnections(): void {
    // Convert game objects to evaluation format
    const tiles: TileData[] = this.roadTiles.map(t => ({
      type: t.type,
      rotation: t.currentRotation,
      position: t.gridPosition,
    }));

    const landmarks: LandmarkData[] = this.landmarks.map((l, index) => ({
      id: index,
      position: l.gridPosition,
      connectableEdges: l.connectableEdges,
    }));

    const exits: ExitData[] = this.exits.map(e => ({
      position: e.gridPosition,
      facingEdge: e.facingEdge,
    }));

    // Evaluate connections (pure, efficient)
    const result = evaluateConnections(this.gridSize, tiles, landmarks, exits);

    // Track previously connected for landmark events
    const previouslyConnected = this.landmarks.filter(l => l.isConnectedToExit);

    // Update road tile visuals (green chain rule from GDD)
    for (const tile of this.roadTiles) {
      const index = tile.gridPosition.row * this.gridSize + tile.gridPosition.col;
      const isConnected = result.connectedTiles.has(index);
      tile.setConnected(isConnected);
    }

    // Update landmarks
    for (let i = 0; i < this.landmarks.length; i++) {
      const landmark = this.landmarks[i];
      const isConnected = result.connectedLandmarkIds.has(i);
      
      // Set connected state
      landmark.setConnected([], isConnected);
      
      // Emit event for newly connected landmarks
      if (isConnected && !previouslyConnected.includes(landmark)) {
        this.emitEvent('landmarkConnected', landmark);
      }
    }

    // Check if level solved
    if (result.solved && this.completionController.state === 'playing' && this.currentLevelConfig) {
      // Start completion sequence with level stats
      this.completionController.startCompletion(
        this.currentLevelConfig.levelNumber,
        this.moveCount,
        Date.now() - this.levelStartTime,
        this.currentLevelConfig.clue
      );
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

  /** Get completion controller */
  getCompletionController(): LevelCompletionController {
    return this.completionController;
  }

  /** Get current level config */
  getCurrentLevelConfig(): LevelConfig | null {
    return this.currentLevelConfig;
  }

  /** Get current move count */
  getMoveCount(): number {
    return this.moveCount;
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
      const texture = this.gpuLoader.getTexture(getAtlasName(), 'grid_backing.png');
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

  /** Update pivot to center of grid for center-based scaling */
  private updatePivot(animate = true): void {
    const totalSize = this.getGridPixelSize();
    const center = totalSize / 2;

    if (animate) {
      gsap.to(this.pivot, {
        x: center,
        y: center,
        duration: TUNING_ANIMATION.duration,
        ease: TUNING_ANIMATION.ease,
      });
    } else {
      this.pivot.set(center, center);
    }
  }

  /** Update all element positions with optional animation */
  private updateLayout(animate = true): void {
    const { duration, ease, stagger } = TUNING_ANIMATION;
    const animDuration = animate ? duration : 0;

    // Update pivot to new center for center-based scaling
    this.updatePivot(animate);

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
    this.completionController.destroy();
    this.decorationSystem.destroy();
    super.destroy({ children: true });
  }
}
