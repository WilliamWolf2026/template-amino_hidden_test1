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

/** Drive-away direction vector per wall side */
function getDriveVector(wall: WallSide): { x: number; y: number } {
  switch (wall) {
    case 'left': return { x: -1, y: 0 };
    case 'right': return { x: 1, y: 0 };
    case 'top': return { x: 0, y: -1 };
    case 'bottom': return { x: 0, y: 1 };
  }
}

/** One open/closed sprite pair for a single truck */
interface TruckSpritePair {
  open: Sprite;
  closed: Sprite;
}

/**
 * Visual representation of a truck dock (exit gate) on the grid edge.
 * Creates one truck sprite per wallIndex so multi-cell docks show multiple trucks.
 */
export class Dock extends Container {
  readonly dockId: string;
  readonly color: BlockColor;
  readonly wall: WallSide;
  readonly wallIndices: number[];

  private trucks: TruckSpritePair[] = [];
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

    // Create one truck sprite pair per wallIndex
    for (const idx of state.wallIndices) {
      const openSprite = gpuLoader.createSprite(atlas, getDockFrame(state.wall, true, state.color));
      openSprite.anchor.set(0.5);
      openSprite.visible = !state.closed;

      const closedSprite = gpuLoader.createSprite(atlas, getDockFrame(state.wall, false, state.color));
      closedSprite.anchor.set(0.5);
      closedSprite.visible = state.closed;

      // Position each truck at its own wall index
      this.positionTruck(openSprite, idx);
      this.positionTruck(closedSprite, idx);

      // Flip side docks on the left wall so truck faces the grid
      if (state.wall === 'left') {
        openSprite.scale.x = -1;
        closedSprite.scale.x = -1;
      }

      this.addChild(openSprite);
      this.addChild(closedSprite);
      this.trucks.push({ open: openSprite, closed: closedSprite });
    }
  }

  /** Animate dock closing then driving away */
  close(duration: number = 0.3): Promise<void> {
    return new Promise((resolve) => {
      let completed = 0;
      const total = this.trucks.length;
      const driveVec = getDriveVector(this.wall);
      const driveDistance = this.cellSize * 2.5;

      for (let i = 0; i < this.trucks.length; i++) {
        const truck = this.trucks[i];
        const stagger = i * 0.08;

        const tl = gsap.timeline({
          delay: stagger,
          onComplete: () => {
            completed++;
            if (completed >= total) resolve();
          },
        });

        // Instant frame swap — no fade, no flash
        tl.call(() => {
          truck.open.visible = false;
          truck.closed.visible = true;
          truck.closed.alpha = 1;
        });

        // Scale punch on the closed sprite
        const baseScaleX = truck.closed.scale.x;
        tl.fromTo(
          truck.closed.scale,
          { x: baseScaleX * 1.15, y: 1.15 },
          { x: baseScaleX, y: 1, duration: duration * 0.5, ease: 'back.out(2)' },
        );

        // Brief pause then drive away
        tl.to(truck.closed, {
          x: truck.closed.x + driveVec.x * driveDistance,
          y: truck.closed.y + driveVec.y * driveDistance,
          alpha: 0,
          duration: 0.5,
          ease: 'power2.in',
          delay: 0.1,
        });
      }
    });
  }

  /** Reset dock to open state */
  open(): void {
    for (const truck of this.trucks) {
      truck.open.visible = true;
      truck.open.alpha = 1;
      truck.closed.visible = false;
      truck.closed.alpha = 1;
      // Reset closed sprite position in case it drove away
      this.positionTruck(truck.closed, this.wallIndices[this.trucks.indexOf(truck)]);
    }
  }

  /** Position a single truck sprite at the given wall index */
  private positionTruck(sprite: Sprite, idx: number): void {
    const gridPixelSize = this.gridSize * this.cellSize;
    const dockOffset = this.cellSize * 0.6;
    const cellCenter = idx * this.cellSize + this.cellSize / 2;

    switch (this.wall) {
      case 'left':
        sprite.x = -dockOffset;
        sprite.y = cellCenter;
        break;
      case 'right':
        sprite.x = gridPixelSize + dockOffset;
        sprite.y = cellCenter;
        break;
      case 'top':
        sprite.x = cellCenter;
        sprite.y = -dockOffset;
        break;
      case 'bottom':
        sprite.x = cellCenter;
        sprite.y = gridPixelSize + dockOffset;
        break;
    }
  }

  override destroy(): void {
    for (const truck of this.trucks) {
      gsap.killTweensOf(truck.open);
      gsap.killTweensOf(truck.closed);
      gsap.killTweensOf(truck.closed.scale);
    }
    super.destroy({ children: true });
  }
}
