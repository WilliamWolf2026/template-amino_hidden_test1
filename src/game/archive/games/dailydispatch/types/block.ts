import type { GridPosition } from './grid';

/** Available block colors (match atlas ui-palette_{color}.png frames) */
export type BlockColor = 'blue' | 'cyan' | 'orange' | 'pink' | 'purple' | 'yellow';

/** All block colors as array */
export const BLOCK_COLORS: BlockColor[] = ['blue', 'cyan', 'orange', 'pink', 'purple', 'yellow'];

/** Named block shapes (polyominoes with fixed orientation) */
export type BlockShape =
  | 'DOT'       // 1×1
  | 'I2_H'      // 1×2 horizontal
  | 'I2_V'      // 2×1 vertical
  | 'I3_H'      // 1×3 horizontal
  | 'I3_V'      // 3×1 vertical
  | 'I4_H'      // 1×4 horizontal
  | 'I4_V'      // 4×1 vertical
  | 'L'          // L-shape
  | 'J'          // J-shape (mirror of L)
  | 'T'          // T-shape
  | 'O'          // 2×2 square
  | 'S'          // S-shape
  | 'Z'          // Z-shape
  | 'RECT_2x3'  // 2 wide × 3 tall
  | 'RECT_3x2'; // 3 wide × 2 tall

/** Shape definition: cell offsets relative to anchor (0,0 = top-left of bounding box) */
export interface ShapeDefinition {
  cells: GridPosition[];
  width: number;
  height: number;
}

/** A block's placement in the level config */
export interface BlockPlacement {
  id: string;
  color: BlockColor;
  shape: BlockShape;
  /** Top-left anchor position on the grid */
  position: GridPosition;
}

/** Runtime block state during gameplay */
export interface BlockState extends BlockPlacement {
  /** Whether this block has exited the grid via a dock */
  exited: boolean;
}
