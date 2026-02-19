import type { FederatedPointerEvent } from 'pixi.js';
import type { Container } from 'pixi.js';
import type { Direction, GridPosition } from '../types/grid';

/** Minimum drag distance (pixels) to register as a swipe */
const MIN_SWIPE_DISTANCE = 8;

/** Result of a detected swipe gesture */
export interface SwipeEvent {
  /** The block ID that was swiped (from hit-testing) */
  blockId: string;
  /** Cardinal direction of the swipe */
  direction: Direction;
}

/**
 * Detects swipe gestures on a Pixi container.
 * Hit-tests against block sprites to determine which block was swiped,
 * then resolves the swipe angle to a cardinal direction.
 */
export class SwipeDetector {
  private container: Container;
  private cellSize: number;
  private gridSize: number;

  /** Callback when a valid swipe is detected */
  onSwipe: ((event: SwipeEvent) => void) | null = null;

  /** Lookup: posKey → blockId for hit-testing */
  private occupancyLookup: Map<string, string> = new Map();

  private pointerDown = false;
  private startX = 0;
  private startY = 0;
  private startBlockId: string | null = null;

  private enabled = true;

  constructor(container: Container, cellSize: number, gridSize: number) {
    this.container = container;
    this.cellSize = cellSize;
    this.gridSize = gridSize;

    container.eventMode = 'static';
    container.on('pointerdown', this.handlePointerDown);
    container.on('pointermove', this.handlePointerMove);
    container.on('pointerup', this.handlePointerUp);
    container.on('pointerupoutside', this.handlePointerUp);
  }

  /** Update the occupancy map (call after each move) */
  setOccupancy(occupancy: Map<string, string>): void {
    this.occupancyLookup = occupancy;
  }

  /** Enable or disable swipe detection */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.pointerDown = false;
      this.startBlockId = null;
    }
  }

  /** Convert pixel position to grid cell */
  private pixelToGrid(px: number, py: number): GridPosition | null {
    const col = Math.floor(px / this.cellSize);
    const row = Math.floor(py / this.cellSize);
    if (col < 0 || col >= this.gridSize || row < 0 || row >= this.gridSize) {
      return null;
    }
    return { col, row };
  }

  private handlePointerDown = (e: FederatedPointerEvent): void => {
    if (!this.enabled) return;

    const local = this.container.toLocal(e.global);
    this.startX = local.x;
    this.startY = local.y;
    this.pointerDown = true;

    // Hit-test: which block cell was tapped?
    // Check exact cell first, then check neighboring cells for a forgiving touch
    const gridPos = this.pixelToGrid(local.x, local.y);
    if (gridPos) {
      const key = `${gridPos.col},${gridPos.row}`;
      this.startBlockId = this.occupancyLookup.get(key) ?? null;

      // If no exact hit, check adjacent cells (forgiving tap radius)
      if (!this.startBlockId) {
        const neighbors = [
          { col: gridPos.col - 1, row: gridPos.row },
          { col: gridPos.col + 1, row: gridPos.row },
          { col: gridPos.col, row: gridPos.row - 1 },
          { col: gridPos.col, row: gridPos.row + 1 },
        ];
        for (const n of neighbors) {
          if (n.col >= 0 && n.col < this.gridSize && n.row >= 0 && n.row < this.gridSize) {
            const nKey = `${n.col},${n.row}`;
            const blockId = this.occupancyLookup.get(nKey);
            if (blockId) {
              this.startBlockId = blockId;
              break;
            }
          }
        }
      }
    } else {
      this.startBlockId = null;
    }
  };

  private handlePointerMove = (e: FederatedPointerEvent): void => {
    if (!this.pointerDown || !this.enabled || !this.startBlockId) return;

    const local = this.container.toLocal(e.global);
    const dx = local.x - this.startX;
    const dy = local.y - this.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= MIN_SWIPE_DISTANCE) {
      const direction = this.resolveDirection(dx, dy);
      this.pointerDown = false;

      this.onSwipe?.({
        blockId: this.startBlockId,
        direction,
      });

      this.startBlockId = null;
    }
  };

  private handlePointerUp = (): void => {
    this.pointerDown = false;
    this.startBlockId = null;
  };

  /** Resolve a dx/dy vector to a cardinal direction */
  private resolveDirection(dx: number, dy: number): Direction {
    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    }
    return dy > 0 ? 'down' : 'up';
  }

  /** Clean up event listeners */
  destroy(): void {
    this.container.off('pointerdown', this.handlePointerDown);
    this.container.off('pointermove', this.handlePointerMove);
    this.container.off('pointerup', this.handlePointerUp);
    this.container.off('pointerupoutside', this.handlePointerUp);
    this.onSwipe = null;
  }
}
