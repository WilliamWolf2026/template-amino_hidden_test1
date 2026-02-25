import { AnimatedSprite, Container, NineSliceSprite } from 'pixi.js';
import type { LevelConfig } from '../types/level';
import type { BlockState } from '../types/block';
import type { DockState } from '../types/dock';
import type { Direction, GridPosition } from '../types/grid';
import { DIR_VECTORS, GRID_SIZE, posKey } from '../types/grid';
import { getAbsoluteCells, SHAPES } from '../data/shapes';
import { GridSimulation, type SlideResult } from './GridSimulation';
import { Block } from './Block';
import { Dock } from './Dock';
import { SwipeDetector, type SwipeEvent } from './SwipeDetector';
import { getAtlasName } from '../utils/atlasHelper';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';

/** Rotation (radians) to point the flash VFX in the swipe direction.
 *  The flash texture animates left→right, so 0 = right. */
const DIRECTION_ROTATION: Record<Direction, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

/** Events emitted by the game */
export interface DailyDispatchGameEvents {
  /** A block was moved (slid or exited) */
  blockMoved: (result: SlideResult, blockId: string) => void;
  /** Level is complete (all target blocks exited) */
  levelComplete: (moveCount: number) => void;
  /** A block exited through a dock */
  blockExited: (blockId: string, dockId: string) => void;
}

/** Sound events fired at precise animation moments */
export interface DailyDispatchSoundEvents {
  blockSlide: () => void;
  blockExit: () => void;
  truckClose: () => void;
  truckDriveAway: () => void;
}

/** Animation configuration for slides */
export interface SlideAnimationConfig {
  durationPerCell: number;
  slideEasing: string;
  exitDuration: number;
  exitEasing: string;
}

const DEFAULT_SLIDE_ANIM: SlideAnimationConfig = {
  durationPerCell: 0.08,
  slideEasing: 'power2.out',
  exitDuration: 0.4,
  exitEasing: 'power2.in',
};

/**
 * Main game container for Daily Dispatch sliding block puzzle.
 *
 * Scene graph:
 *   DailyDispatchGame
 *     ├─ gridContainer (NineSliceSprite: prop-grid_backing.png)
 *     ├─ docksContainer (Dock × N around grid edges)
 *     ├─ blocksContainer (Block × N on grid cells)
 *     └─ vfxContainer (confetti/particles)
 */
export class DailyDispatchGame extends Container {
  private gpuLoader: PixiLoader;
  private cellSize: number;
  private gridPixelSize: number;

  // Logic layer
  private simulation: GridSimulation | null = null;

  // Visual layers
  private gridContainer: Container;
  private docksContainer: Container;
  private blocksContainer: Container;
  private vfxContainer: Container;

  // Visual entities
  private blockViews: Map<string, Block> = new Map();
  private dockViews: Map<string, Dock> = new Map();
  private gridBackground: NineSliceSprite | null = null;

  // Input
  private swipeDetector: SwipeDetector | null = null;

  // State
  private moveCount = 0;
  private isAnimating = false;
  private eventHandlers: Partial<DailyDispatchGameEvents> = {};
  private soundHandlers: Partial<DailyDispatchSoundEvents> = {};
  private slideAnimConfig: SlideAnimationConfig = DEFAULT_SLIDE_ANIM;

  constructor(gpuLoader: PixiLoader, cellSize: number = 72) {
    super();

    this.gpuLoader = gpuLoader;
    this.cellSize = cellSize;
    this.gridPixelSize = GRID_SIZE * cellSize;

    // Create layer containers
    this.gridContainer = new Container();
    this.gridContainer.label = 'grid';

    this.docksContainer = new Container();
    this.docksContainer.label = 'docks';

    this.blocksContainer = new Container();
    this.blocksContainer.label = 'blocks';

    this.vfxContainer = new Container();
    this.vfxContainer.label = 'vfx';

    // Layer order (bottom to top) — blocks under docks so they slide beneath trucks
    this.addChild(this.gridContainer);
    this.addChild(this.blocksContainer);
    this.addChild(this.docksContainer);
    this.addChild(this.vfxContainer);

    this.label = 'dailydispatch-game';
  }

  /** Register an event handler */
  onGameEvent<K extends keyof DailyDispatchGameEvents>(
    event: K,
    handler: DailyDispatchGameEvents[K],
  ): void {
    this.eventHandlers[event] = handler;
  }

  /** Register a sound event handler (fires at precise animation moments) */
  onSoundEvent<K extends keyof DailyDispatchSoundEvents>(
    event: K,
    handler: DailyDispatchSoundEvents[K],
  ): void {
    this.soundHandlers[event] = handler;
  }

  /** Set slide animation config (from tuning) */
  setSlideAnimConfig(config: SlideAnimationConfig): void {
    this.slideAnimConfig = config;
  }

  /** Load and display a level */
  loadLevel(config: LevelConfig): void {
    this.clearLevel();

    const gridSize = config.gridSize || GRID_SIZE;
    this.gridPixelSize = gridSize * this.cellSize;

    // Create logic simulation
    this.simulation = new GridSimulation(config);

    // Create grid backing
    const texture = this.gpuLoader.getTexture(getAtlasName(), 'prop-grid_backing.png');
    this.gridBackground = new NineSliceSprite({
      texture,
      leftWidth: 20,
      topHeight: 20,
      rightWidth: 20,
      bottomHeight: 20,
    });
    this.gridBackground.width = this.gridPixelSize;
    this.gridBackground.height = this.gridPixelSize;
    this.gridContainer.addChild(this.gridBackground);

    // Create dock views
    for (const dockState of this.simulation.getAllDocks()) {
      const dock = new Dock(dockState, this.gpuLoader, this.cellSize, gridSize);
      this.dockViews.set(dockState.id, dock);
      this.docksContainer.addChild(dock);
    }

    // Create block views
    for (const blockState of this.simulation.getAllBlocks()) {
      const block = new Block(blockState, this.gpuLoader, this.cellSize);
      this.blockViews.set(blockState.id, block);
      this.blocksContainer.addChild(block);
    }

    // Setup swipe detection on the blocks container
    this.swipeDetector = new SwipeDetector(this.blocksContainer, this.cellSize, gridSize);
    this.swipeDetector.onSwipe = (e) => this.handleSwipe(e);
    this.syncOccupancy();

    // Reset state
    this.moveCount = 0;
    this.isAnimating = false;
  }

  /** Clear the current level */
  clearLevel(): void {
    // Destroy swipe detector
    if (this.swipeDetector) {
      this.swipeDetector.destroy();
      this.swipeDetector = null;
    }

    // Destroy block views
    for (const block of this.blockViews.values()) {
      block.destroy();
    }
    this.blockViews.clear();

    // Destroy dock views
    for (const dock of this.dockViews.values()) {
      dock.destroy();
    }
    this.dockViews.clear();

    // Clear grid background
    if (this.gridBackground) {
      this.gridBackground.destroy();
      this.gridBackground = null;
    }

    // Clear containers
    this.gridContainer.removeChildren();
    this.docksContainer.removeChildren();
    this.blocksContainer.removeChildren();
    this.vfxContainer.removeChildren();

    this.simulation = null;
    this.moveCount = 0;
  }

  /** Get current move count */
  getMoveCount(): number {
    return this.moveCount;
  }

  /** Get the simulation (for external access, e.g., solver) */
  getSimulation(): GridSimulation | null {
    return this.simulation;
  }

  /** Get the grid pixel size */
  getGridPixelSize(): number {
    return this.gridPixelSize;
  }

  /** Get the cell size */
  getCellSize(): number {
    return this.cellSize;
  }

  /** Check if currently animating */
  getIsAnimating(): boolean {
    return this.isAnimating;
  }

  /** Enable/disable input */
  setInputEnabled(enabled: boolean): void {
    this.swipeDetector?.setEnabled(enabled);
  }

  /** Erase a block (booster) */
  async eraseBlock(blockId: string): Promise<boolean> {
    if (!this.simulation || this.isAnimating) return false;

    const erased = this.simulation.eraseBlock(blockId);
    if (!erased) return false;

    const blockView = this.blockViews.get(blockId);
    if (blockView) {
      this.isAnimating = true;
      await blockView.playEraserAnimation();
      blockView.destroy();
      this.blockViews.delete(blockId);
      this.isAnimating = false;
    }

    this.syncOccupancy();

    if (this.simulation.isLevelComplete()) {
      this.emitEvent('levelComplete', this.moveCount);
    }

    return true;
  }

  /** Set highlight state on all active blocks (for eraser mode) */
  setBlocksHighlighted(highlighted: boolean): void {
    for (const block of this.blockViews.values()) {
      block.setHighlighted(highlighted);
    }
  }

  /** Get vfx container for external effects */
  getVfxContainer(): Container {
    return this.vfxContainer;
  }

  // ── Private ──

  private async handleSwipe(event: SwipeEvent): Promise<void> {
    if (!this.simulation || this.isAnimating) return;

    const result = this.simulation.slideBlock(event.blockId, event.direction);
    if (!result.moved) return;

    this.isAnimating = true;
    this.moveCount++;

    const blockView = this.blockViews.get(event.blockId);

    // Sound: play slide at the START of movement
    this.emitSoundEvent('blockSlide');

    // Flash VFX on every successful swipe (fire-and-forget, don't await)
    if (blockView) {
      this.playSwipeFlash(blockView, event.direction);
    }

    if (blockView && result.newPosition) {
      if (result.exitedDock) {
        // Slide to wall, then play exit animation
        await blockView.slideTo(result.newPosition, result.distance, {
          durationPerCell: this.slideAnimConfig.durationPerCell,
          easing: this.slideAnimConfig.slideEasing,
        });

        // Sound: block exits through dock
        this.emitSoundEvent('blockExit');

        const vec = DIR_VECTORS[event.direction];
        await blockView.playExitAnimation(vec, {
          duration: this.slideAnimConfig.exitDuration,
          easing: this.slideAnimConfig.exitEasing,
        });

        // Glow VFX at the dock (fire-and-forget)
        const dockView = this.dockViews.get(result.exitedDock.id);
        if (dockView) {
          this.playDockGlow(dockView, result.exitedDock.wall);
        }

        // Close the dock (truck drives away) — sound callbacks fire inside the GSAP timeline
        await dockView?.close(0.3, {
          onDoorClose: () => this.emitSoundEvent('truckClose'),
          onDriveAway: () => this.emitSoundEvent('truckDriveAway'),
        });

        // Remove block view
        blockView.destroy();
        this.blockViews.delete(event.blockId);

        this.emitEvent('blockExited', event.blockId, result.exitedDock.id);
      } else {
        // Normal slide
        await blockView.slideTo(result.newPosition, result.distance, {
          durationPerCell: this.slideAnimConfig.durationPerCell,
          easing: this.slideAnimConfig.slideEasing,
        });
      }
    }

    this.syncOccupancy();
    this.isAnimating = false;

    this.emitEvent('blockMoved', result, event.blockId);

    // Check completion
    if (this.simulation.isLevelComplete()) {
      this.emitEvent('levelComplete', this.moveCount);
    }
  }

  /** Sync the swipe detector's occupancy from the simulation */
  private syncOccupancy(): void {
    if (!this.simulation || !this.swipeDetector) return;

    const occupancy = new Map<string, string>();
    for (const block of this.simulation.getActiveBlocks()) {
      const cells = getAbsoluteCells(block.shape, block.position);
      for (const cell of cells) {
        occupancy.set(posKey(cell), block.id);
      }
    }
    this.swipeDetector.setOccupancy(occupancy);
  }

  private emitEvent<K extends keyof DailyDispatchGameEvents>(
    event: K,
    ...args: Parameters<DailyDispatchGameEvents[K]>
  ): void {
    const handler = this.eventHandlers[event];
    if (handler) {
      (handler as (...a: unknown[]) => void)(...args);
    }
  }

  private emitSoundEvent<K extends keyof DailyDispatchSoundEvents>(event: K): void {
    this.soundHandlers[event]?.();
  }

  // ── VFX ──

  /** Play flash VFX on every cell of the block, rotated to face swipe direction */
  private playSwipeFlash(blockView: Block, direction: Direction): void {
    if (!this.gpuLoader.hasSheet('vfx-flash_fx_shape_04')) return;

    const shapeDef = SHAPES[blockView.shape];
    const half = this.cellSize / 2;
    const vec = DIR_VECTORS[direction];

    for (const cell of shapeDef.cells) {
      const vfx = this.gpuLoader.createAnimatedSprite('vfx-flash_fx_shape_04', 'flash');
      vfx.anchor.set(0.5);
      // Position in front of each cell (offset one cell in swipe direction)
      vfx.x = blockView.x + cell.col * this.cellSize + half + vec.col * this.cellSize;
      vfx.y = blockView.y + cell.row * this.cellSize + half + vec.row * this.cellSize;
      vfx.rotation = DIRECTION_ROTATION[direction];
      vfx.scale.set(this.cellSize / 48);
      vfx.alpha = 0.85;
      vfx.animationSpeed = 0.6;
      vfx.loop = false;
      vfx.onComplete = () => {
        this.vfxContainer.removeChild(vfx);
        vfx.destroy();
      };
      this.vfxContainer.addChild(vfx);
      vfx.play();
    }
  }

  /** Play glow VFX at dock position when a block exits, rotated 45 degrees */
  private playDockGlow(dockView: Dock, wall: string): void {
    if (!this.gpuLoader.hasSheet('vfx-mg_glow_09')) return;

    const vfx = this.gpuLoader.createAnimatedSprite('vfx-mg_glow_09', 'glow');
    vfx.anchor.set(0.5);

    // Position at the dock's center (in game-local coordinates)
    const dockBounds = dockView.getBounds();
    const localPos = this.toLocal({ x: dockBounds.x + dockBounds.width / 2, y: dockBounds.y + dockBounds.height / 2 });
    vfx.x = localPos.x;
    vfx.y = localPos.y;

    // Rotate 45 degrees as requested
    vfx.rotation = Math.PI / 4;
    vfx.scale.set(this.cellSize / 40);
    vfx.alpha = 0.9;
    vfx.animationSpeed = 0.5;
    vfx.loop = false;
    vfx.onComplete = () => {
      this.vfxContainer.removeChild(vfx);
      vfx.destroy();
    };
    this.vfxContainer.addChild(vfx);
    vfx.play();
  }

  override destroy(): void {
    this.clearLevel();
    super.destroy({ children: true });
  }
}
