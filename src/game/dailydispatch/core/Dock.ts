import { Container, Sprite } from 'pixi.js';
import gsap from 'gsap';
import type { DockState } from '../types/dock';
import type { WallSide } from '../types/grid';
import type { BlockColor } from '../types/block';
import { GRID_SIZE } from '../types/grid';
import { getAtlasName } from '../utils/atlasHelper';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';

/**
 * Sprite frame naming convention for docks:
 * - Left/right walls: prop-truck_side_{open|close}_{color}.png
 * - Top wall:         prop-truck_up_{open|close}_{color}.png
 * - Bottom wall:      prop-truck_down_{open|close}_{color}.png
 */
function getDockFrame(wall: WallSide, open: boolean, color: BlockColor): string {
  const state = open ? 'open' : 'close';
  const direction = wall === 'left' || wall === 'right' ? 'side' : wall === 'top' ? 'up' : 'down';
  return `prop-truck_${direction}_${state}_${color}.png`;
}

/**
 * Visual representation of a truck dock (exit gate) on the grid edge.
 * Displays open/closed state sprites positioned outside the grid.
 */
export class Dock extends Container {
  readonly dockId: string;
  readonly color: BlockColor;
  readonly wall: WallSide;
  readonly wallIndices: number[];

  private openSprite: Sprite;
  private closedSprite: Sprite;
  private cellSize: number;
  private gridSize: number;

  constructor(
    state: DockState,
    gpuLoader: PixiLoader,
    cellSize: number,
    gridSize: number = GRID_SIZE,
  ) {
    super();

    this.dockId = state.id;
    this.color = state.color;
    this.wall = state.wall;
    this.wallIndices = state.wallIndices;
    this.cellSize = cellSize;
    this.gridSize = gridSize;

    this.label = `dock-${state.id}`;

    const atlas = getAtlasName();

    // Create open sprite
    this.openSprite = gpuLoader.createSprite(atlas, getDockFrame(state.wall, true, state.color));
    this.openSprite.anchor.set(0.5);
    this.openSprite.visible = !state.closed;

    // Create closed sprite
    this.closedSprite = gpuLoader.createSprite(atlas, getDockFrame(state.wall, false, state.color));
    this.closedSprite.anchor.set(0.5);
    this.closedSprite.visible = state.closed;

    this.addChild(this.openSprite);
    this.addChild(this.closedSprite);

    // Position dock outside the grid edge
    this.positionOnWall();

    // Flip side docks on the right wall so truck faces the grid
    if (state.wall === 'right') {
      this.openSprite.scale.x = -1;
      this.closedSprite.scale.x = -1;
    }
  }

  /** Animate dock closing (block exited through this dock) */
  close(duration: number = 0.3): Promise<void> {
    return new Promise((resolve) => {
      gsap.to(this.openSprite, {
        alpha: 0,
        duration: duration * 0.5,
        onComplete: () => {
          this.openSprite.visible = false;
          this.closedSprite.visible = true;
          this.closedSprite.alpha = 0;
          gsap.to(this.closedSprite, {
            alpha: 1,
            duration: duration * 0.5,
            onComplete: resolve,
          });
        },
      });
    });
  }

  /** Reset dock to open state */
  open(): void {
    this.openSprite.visible = true;
    this.openSprite.alpha = 1;
    this.closedSprite.visible = false;
    this.closedSprite.alpha = 1;
  }

  /** Position the dock container outside the grid based on its wall */
  private positionOnWall(): void {
    // Center of the dock's wallIndices span
    const minIdx = Math.min(...this.wallIndices);
    const maxIdx = Math.max(...this.wallIndices);
    const centerIdx = (minIdx + maxIdx) / 2;

    const gridPixelSize = this.gridSize * this.cellSize;
    const dockOffset = this.cellSize * 0.6; // How far outside the grid

    switch (this.wall) {
      case 'left':
        this.x = -dockOffset;
        this.y = centerIdx * this.cellSize + this.cellSize / 2;
        break;
      case 'right':
        this.x = gridPixelSize + dockOffset;
        this.y = centerIdx * this.cellSize + this.cellSize / 2;
        break;
      case 'top':
        this.x = centerIdx * this.cellSize + this.cellSize / 2;
        this.y = -dockOffset;
        break;
      case 'bottom':
        this.x = centerIdx * this.cellSize + this.cellSize / 2;
        this.y = gridPixelSize + dockOffset;
        break;
    }
  }

  override destroy(): void {
    gsap.killTweensOf(this.openSprite);
    gsap.killTweensOf(this.closedSprite);
    super.destroy({ children: true });
  }
}
