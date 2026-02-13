import { AnimatedSprite, ColorMatrixFilter, Container, NineSliceSprite } from 'pixi.js';
import gsap from 'gsap';
import type { GridSize, LevelConfig } from '../types';
import { Landmark } from './Landmark';
import { Exit } from './Exit';
import { RoadTile } from './RoadTile';
import { posKey } from '../types';
import { DecorationSystem } from '../systems';
import { getAtlasName } from '../utils/atlasHelper';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import type { NineSliceConfig, LevelTransitionConfig } from '~/game/tuning';
import {
  createLevelCompletionController,
  type LevelCompletionController,
} from '../controllers';
import {
  evaluateConnections,
  getConnectedTilesInOrder,
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
  completionStart: (clue: string, levelNumber: number) => void;
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

  // VFX config (from tuning)
  private vfxConfig = { alpha: 1, sizePercent: 200 };

  // Level transition animation
  private levelTransitionConfig?: LevelTransitionConfig;
  private isTransitioning: boolean = false;
  private originalScales: Map<Container, { x: number; y: number }> = new Map();

  // Completion paint animation config
  private completionPaintConfig = { staggerDelay: 50, tileDuration: 150, easing: 'power2.out', blastSizePercent: 200 };
  private isPaintAnimationPlaying = false;
  private isSolved = false;

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
        onCompletionStart: (clue, levelNumber) => this.emitEvent('completionStart', clue, levelNumber),
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

    // Layer order (bottom to top): grid -> exits -> roads -> vfx -> decorations -> landmarks
    // VFX plays on top of roads, decorations above for visual pop
    this.addChild(this.gridContainer);
    this.addChild(this.exitsContainer);
    this.addChild(this.roadTilesContainer);
    this.addChild(this.vfxContainer);
    this.addChild(this.decorationsContainer);
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
    this.isSolved = false;
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
        this.tileSize,
        exitConfig.connectableEdges
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
    const tileTypeCounts = { straight: 0, corner: 0, t_junction: 0 };
    for (const tileConfig of config.roadTiles) {
      tileTypeCounts[tileConfig.type]++;

      const roadTile = new RoadTile(
        tileConfig.type,
        { x: tileConfig.x, y: tileConfig.y },
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
      Date.now() ^ (Math.random() * 0x100000000), // Random seed for varied decorations
      undefined, // use default density
      this.padding,
      this.cellGap
    );

    // Update layout to apply padding/cellGap to all elements
    this.updateLayout(false);
  }

  /** Handle tile rotation */
  private handleTileRotate(tile: RoadTile): void {
    // Block input during completion sequence, level transition, or solved puzzle
    if (this.completionController.isInputBlocked || this.isTransitioning || this.isSolved) {
      return;
    }

    // Rotate tile
    tile.rotate(this.rotationAnimationConfig);

    // Play rotation VFX
    this.playRotateVFX(tile);

    // Increment move counter
    this.moveCount++;

    // Emit event
    this.emitEvent('tileRotated');

    // Update visuals immediately (tile colors change right away)
    this.updateConnectionVisuals();

    // Check if this rotation solved the puzzle — block input immediately
    const result = this.evaluateCurrentConnections();
    if (result.solved) {
      this.isSolved = true;
    }

    // Delay level completion check until tile rotation animation finishes
    const rotationDuration = this.rotationAnimationConfig?.duration ?? 300;
    gsap.delayedCall(rotationDuration / 1000, () => {
      this.checkLevelCompletion();
    });
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

    // VFX size calculation (linear scaling, no power-of-2 snapping)
    const desiredSize = this.tileSize * (this.vfxConfig.sizePercent / 100);
    const vfxScale = desiredSize / 256;
    vfx.scale.set(-vfxScale, vfxScale); // Negative X for clockwise spin
    vfx.alpha = this.vfxConfig.alpha;

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

  /** Play blast VFX at a position (for completion animation on landmarks) */
  private playBlastVFX(x: number, y: number): void {
    // Check if VFX sheet is loaded
    if (!this.gpuLoader.hasSheet('vfx-blast')) {
      console.warn('[VFX] vfx-blast sheet not loaded');
      return;
    }

    // Create animated sprite from spritesheet
    const vfx = this.gpuLoader.createAnimatedSprite('vfx-blast', 'blast');

    // Position at center
    vfx.anchor.set(0.5);
    vfx.x = x;
    vfx.y = y;

    // VFX size calculation (uses completionPaint config for blast VFX)
    const desiredSize = this.tileSize * (this.completionPaintConfig.blastSizePercent / 100);
    const vfxScale = desiredSize / 256;
    vfx.scale.set(vfxScale);
    vfx.alpha = this.vfxConfig.alpha;

    // Animation settings - play at 24fps
    vfx.animationSpeed = 0.4; // ~24fps at 60fps ticker
    vfx.loop = false;

    // Remove when animation completes
    vfx.onComplete = () => {
      this.removeChild(vfx);
      vfx.destroy();
    };

    // Add directly to game container (on top of everything, including landmarks)
    this.addChild(vfx);
    vfx.play();
  }

  /** Set rotation animation config (from tuning) */
  setRotationAnimationConfig(config: { duration: number; easing: string }): void {
    this.rotationAnimationConfig = config;
  }

  /** Set VFX config (from tuning) */
  setVfxConfig(config: { alpha: number; sizePercent: number }): void {
    this.vfxConfig = config;
  }

  /** Set level transition animation config (from tuning) */
  setLevelTransitionConfig(config: LevelTransitionConfig): void {
    this.levelTransitionConfig = config;
  }

  /** Set completion paint animation config (from tuning) */
  setCompletionPaintConfig(config: { staggerDelay: number; tileDuration: number; easing: string; blastSizePercent: number }): void {
    this.completionPaintConfig = config;
  }

  /** Group all elements by their diagonal index (x + y) for wave animation */
  private groupElementsByDiagonal(): Map<number, Container[]> {
    const groups = new Map<number, Container[]>();

    // Add road tiles
    this.roadTiles.forEach(tile => {
      const diagonal = tile.gridPosition.x + tile.gridPosition.y;
      if (!groups.has(diagonal)) groups.set(diagonal, []);
      groups.get(diagonal)!.push(tile);
    });

    // Add landmarks
    this.landmarks.forEach(landmark => {
      const diagonal = landmark.gridPosition.x + landmark.gridPosition.y;
      if (!groups.has(diagonal)) groups.set(diagonal, []);
      groups.get(diagonal)!.push(landmark);
    });

    // Add exits
    this.exits.forEach(exit => {
      const diagonal = exit.gridPosition.x + exit.gridPosition.y;
      if (!groups.has(diagonal)) groups.set(diagonal, []);
      groups.get(diagonal)!.push(exit);
    });

    // Add decorations
    const decorations = this.decorationSystem.getDecorationsByDiagonal();
    decorations.forEach((decos, diagonal) => {
      if (!groups.has(diagonal)) groups.set(diagonal, []);
      groups.get(diagonal)!.push(...decos);
    });

    return groups;
  }

  /** Set all elements to initial animation state (scale=0, alpha=0) */
  private setElementsToInitialState(): void {
    // Clear previous scales
    this.originalScales.clear();

    // Tiles - store original scale
    this.roadTiles.forEach(tile => {
      this.originalScales.set(tile, { x: tile.scale.x, y: tile.scale.y });
      tile.scale.set(0);
      tile.alpha = 0;
    });

    // Landmarks - store original scale
    this.landmarks.forEach(landmark => {
      this.originalScales.set(landmark, { x: landmark.scale.x, y: landmark.scale.y });
      landmark.scale.set(0);
      landmark.alpha = 0;
    });

    // Exits - store original scale
    this.exits.forEach(exit => {
      this.originalScales.set(exit, { x: exit.scale.x, y: exit.scale.y });
      exit.scale.set(0);
      exit.alpha = 0;
    });

    // Decorations
    this.decorationSystem.setInitialState();
  }

  /** Create GSAP timeline for diagonal wave animation */
  private createDiagonalWaveTimeline(config: LevelTransitionConfig): gsap.core.Timeline {
    const timeline = gsap.timeline({ paused: true });

    // Group elements by diagonal index
    const diagonalGroups = this.groupElementsByDiagonal();

    // Sort diagonals (0 to max)
    const sortedDiagonals = Array.from(diagonalGroups.keys()).sort((a, b) => a - b);

    // Add animations for each diagonal
    sortedDiagonals.forEach((diagonalIndex, groupIndex) => {
      const elements = diagonalGroups.get(diagonalIndex)!;
      const groupStartTime = groupIndex * (config.diagonalStagger / 1000);

      elements.forEach((element, elementIndex) => {
        const elementDelay = groupStartTime + (elementIndex * config.elementStagger / 1000);

        // Get target scale (original scale before animation)
        let targetScale = { x: 1, y: 1 };

        // Check if we have stored original scale for this element
        const storedScale = this.originalScales.get(element);
        if (storedScale) {
          targetScale = storedScale;
        } else {
          // For decorations, get scale from decoration system
          const decorationScale = this.decorationSystem.getOriginalScale(element as any);
          if (decorationScale) {
            targetScale = decorationScale;
          }
        }

        timeline.to(element.scale, {
          x: targetScale.x,
          y: targetScale.y,
          duration: config.elementDuration / 1000,
          ease: config.elementEasing,
        }, elementDelay);

        timeline.to(element, {
          alpha: 1,
          duration: config.elementDuration / 1000,
          ease: config.elementEasing,
        }, elementDelay);
      });
    });

    return timeline;
  }

  /** Play level transition animation (diagonal wave from top-left to bottom-right) */
  playLevelTransition(): Promise<void> {
    if (!this.levelTransitionConfig) {
      // No config, skip animation
      return Promise.resolve();
    }

    const config = this.levelTransitionConfig;
    this.isTransitioning = true;

    return new Promise((resolve) => {
      // 1. Set all elements to initial state (scale=0, alpha=0)
      this.setElementsToInitialState();

      // 2. Animate background (if grid size changed)
      if (config.animateBackground && this.gridBackground) {
        const totalSize = this.getGridPixelSize();
        gsap.to(this.gridBackground, {
          width: totalSize,
          height: totalSize,
          duration: config.elementDuration / 1000,
          ease: config.backgroundEasing,
        });
      }

      // 3. Create staggered animations for all elements
      const timeline = this.createDiagonalWaveTimeline(config);

      // 4. Start animation after delay
      gsap.delayedCall(config.startDelay / 1000, () => {
        timeline.play();
        timeline.eventCallback('onComplete', () => {
          this.isTransitioning = false;
          resolve();
        });
      });
    });
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

  /** Evaluate connections and return result */
  private evaluateCurrentConnections() {
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
      connectableEdges: e.connectableEdges,
    }));

    return evaluateConnections(this.gridSize, tiles, landmarks, exits);
  }

  /** Update visual state of landmarks only (tiles are updated via paint animation on completion) */
  private updateConnectionVisuals(): void {
    const result = this.evaluateCurrentConnections();

    // Track previously connected for landmark events
    const previouslyConnected = this.landmarks.filter(l => l.isConnectedToExit);

    // NOTE: Road tiles are NOT updated here during gameplay.
    // They only change to "completed" state via playCompletionPaintAnimation() when level is won.

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
  }

  /** Check if level is complete and trigger completion sequence */
  private checkLevelCompletion(): void {
    const result = this.evaluateCurrentConnections();

    // Check if level solved (guard against double-trigger with isPaintAnimationPlaying)
    if (result.solved && this.completionController.state === 'playing' && this.currentLevelConfig && !this.isPaintAnimationPlaying) {
      this.isPaintAnimationPlaying = true;
      // Play the paint animation from exit outward, THEN start completion sequence
      this.playCompletionPaintAnimation().then(() => {
        this.isPaintAnimationPlaying = false;
        if (this.currentLevelConfig) {
          this.completionController.startCompletion(
            this.currentLevelConfig.levelNumber,
            this.moveCount,
            Date.now() - this.levelStartTime,
            this.currentLevelConfig.clue
          );
        }
      });
    }
  }

  /**
   * Play the "paint" animation when level is complete.
   * Roads instantly swap to completed state in BFS order from exit, with a white flash.
   */
  private playCompletionPaintAnimation(): Promise<void> {
    // Get tiles in BFS order (exit → outward)
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
      connectableEdges: e.connectableEdges,
    }));

    const traversal = getConnectedTilesInOrder(this.gridSize, tiles, landmarks, exits);

    // Build lookup from grid index to RoadTile
    const tileByIndex = new Map<number, RoadTile>();
    for (const tile of this.roadTiles) {
      const index = tile.gridPosition.y * this.gridSize + tile.gridPosition.x;
      tileByIndex.set(index, tile);
    }

    const { staggerDelay, tileDuration, easing } = this.completionPaintConfig;

    return new Promise((resolve) => {
      if (traversal.tilesInOrder.length === 0) {
        resolve();
        return;
      }

      // Flash exits first (distance 0 - the starting point of the pulse)
      for (const exit of this.exits) {
        const filter = new ColorMatrixFilter();
        filter.brightness(2, false);
        exit.filters = [filter];

        const brightness = { value: 2 };
        gsap.to(brightness, {
          value: 1,
          duration: tileDuration / 1000,
          ease: easing,
          onUpdate: () => {
            filter.brightness(brightness.value, false);
          },
          onComplete: () => {
            exit.filters = [];
          },
        });
      }

      // Calculate max distance including landmarks for total duration
      const maxTileDistance = Math.max(...traversal.tilesInOrder.map(t => t.distance));
      const maxLandmarkDistance = traversal.landmarkDistances.size > 0
        ? Math.max(...traversal.landmarkDistances.values())
        : 0;
      const maxDistance = Math.max(maxTileDistance, maxLandmarkDistance);
      const totalDuration = (maxDistance * staggerDelay + tileDuration) / 1000;

      // Animate each tile based on its distance from exit
      for (const tileInfo of traversal.tilesInOrder) {
        const roadTile = tileByIndex.get(tileInfo.index);
        if (!roadTile) continue;

        // Calculate delay based on distance from exit
        const delay = tileInfo.distance * staggerDelay / 1000;

        // Schedule the traveling pulse - tile changes and flashes as pulse passes through
        gsap.delayedCall(delay, () => {
          // Instantly swap to completed state
          roadTile.setConnected(true);

          // Apply brightness filter for pulse flash
          const filter = new ColorMatrixFilter();
          filter.brightness(2, false); // Flash bright
          roadTile.filters = [filter];

          // Fade brightness back to normal
          const brightness = { value: 2 };
          gsap.to(brightness, {
            value: 1,
            duration: tileDuration / 1000,
            ease: easing,
            onUpdate: () => {
              filter.brightness(brightness.value, false);
            },
            onComplete: () => {
              roadTile.filters = []; // Remove filter when done
            },
          });
        });
      }

      // Play blast VFX on each landmark when the pulse reaches it
      // landmarkDistances uses array index as key (same as LandmarkData.id)
      for (const [landmarkIndex, distance] of traversal.landmarkDistances) {
        const landmark = this.landmarks[landmarkIndex];
        if (!landmark) continue;

        const delay = distance * staggerDelay / 1000;
        gsap.delayedCall(delay, () => {
          this.playBlastVFX(landmark.x, landmark.y);
        });
      }

      // Resolve after all animations complete
      gsap.delayedCall(totalDuration, () => {
        resolve();
      });
    });
  }

  /** Run connection evaluation and update visuals (used for initial load) */
  private updateConnections(): void {
    this.updateConnectionVisuals();
    this.checkLevelCompletion();
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

  /**
   * Calculate optimal tile size to fit grid within available viewport
   * @param availableWidth - Available width for the grid
   * @param availableHeight - Available height for the grid
   * @param maxTileSize - Maximum tile size to use (from tuning)
   * @returns Optimal tile size that fits within constraints
   */
  calculateOptimalTileSize(availableWidth: number, availableHeight: number, maxTileSize: number): number {
    // Calculate the maximum tile size that fits within available space
    // Grid size = padding * 2 + gridSize * tileSize + (gridSize - 1) * cellGap
    // Solving for tileSize: tileSize = (available - padding * 2 - (gridSize - 1) * cellGap) / gridSize

    const maxTileForWidth = (availableWidth - this.padding * 2 - (this.gridSize - 1) * this.cellGap) / this.gridSize;
    const maxTileForHeight = (availableHeight - this.padding * 2 - (this.gridSize - 1) * this.cellGap) / this.gridSize;

    // Use the smaller of the two to ensure grid fits in both dimensions
    const fittedSize = Math.floor(Math.min(maxTileForWidth, maxTileForHeight));

    // Don't exceed the configured max tile size, but also don't go below minimum
    const minTileSize = 48; // Minimum tile size for playability
    return Math.max(minTileSize, Math.min(fittedSize, maxTileSize));
  }

  /**
   * Auto-size tiles to fit within viewport
   * @param viewportWidth - Current viewport width
   * @param viewportHeight - Current viewport height
   * @param maxTileSize - Maximum tile size from tuning
   * @param reservedTop - Space reserved at top (HUD, etc)
   * @param reservedBottom - Space reserved at bottom (logo, etc)
   */
  autoSizeToViewport(
    viewportWidth: number,
    viewportHeight: number,
    maxTileSize: number,
    reservedTop: number = 80,
    reservedBottom: number = 100
  ): void {
    const availableWidth = viewportWidth;
    const availableHeight = viewportHeight - reservedTop - reservedBottom;

    const optimalSize = this.calculateOptimalTileSize(availableWidth, availableHeight, maxTileSize);

    if (optimalSize !== this.tileSize) {
      this.setTileSize(optimalSize, false);
    }
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

    // Update decorations
    this.decorationSystem.updateLayout(this.tileSize, this.padding, this.cellGap);
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

  /** Get all tile rotations (for saving progress) */
  getTileRotations(): number[] {
    return this.roadTiles.map(tile => tile.currentRotation);
  }

  /** Set tile rotations (for loading saved progress) */
  setTileRotations(rotations: number[]): void {
    if (rotations.length !== this.roadTiles.length) {
      console.warn('[CityLinesGame] Rotation count mismatch, ignoring saved state');
      return;
    }

    for (let i = 0; i < this.roadTiles.length; i++) {
      this.roadTiles[i].setRotation(rotations[i]);
    }

    // Update connection visuals after applying rotations
    this.updateConnectionVisuals();
  }

  /** Get first road tile position (for tutorial hand targeting) */
  getFirstTilePosition(): { x: number; y: number } | null {
    if (this.roadTiles.length === 0) return null;
    const tile = this.roadTiles[0];
    return { x: tile.x, y: tile.y };
  }

  /** Programmatically rotate the first road tile (for tutorial demo) */
  rotateFirstTile(): void {
    if (this.roadTiles.length === 0) return;
    this.handleTileRotate(this.roadTiles[0]);
  }

  /** Clean up resources */
  override destroy(): void {
    this.clearLevel();
    this.completionController.destroy();
    this.decorationSystem.destroy();
    super.destroy({ children: true });
  }
}
