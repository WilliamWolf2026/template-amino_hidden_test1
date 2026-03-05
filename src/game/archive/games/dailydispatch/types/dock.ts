import type { WallSide } from './grid';
import type { BlockColor } from './block';

/** A dock (exit) placement on the grid edge */
export interface DockPlacement {
  id: string;
  color: BlockColor;
  /** Which wall the dock is on */
  wall: WallSide;
  /**
   * Cell indices along the wall that this dock spans.
   * For left/right walls: row indices.
   * For top/bottom walls: column indices.
   */
  wallIndices: number[];
}

/** Runtime dock state during gameplay */
export interface DockState extends DockPlacement {
  /** Whether a block has exited through this dock */
  closed: boolean;
}
