import type { ShapeDefinition, BlockShape } from '../types/block';

/**
 * Polyomino shape library.
 * Each shape is defined as cell offsets from the anchor (0,0 = top-left of bounding box).
 */
export const SHAPES: Record<BlockShape, ShapeDefinition> = {
  // ── 1-cell ──
  DOT: {
    cells: [{ col: 0, row: 0 }],
    width: 1,
    height: 1,
  },

  // ── I-pieces (lines) ──
  I2_H: {
    cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }],
    width: 2,
    height: 1,
  },
  I2_V: {
    cells: [{ col: 0, row: 0 }, { col: 0, row: 1 }],
    width: 1,
    height: 2,
  },
  I3_H: {
    cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }],
    width: 3,
    height: 1,
  },
  I3_V: {
    cells: [{ col: 0, row: 0 }, { col: 0, row: 1 }, { col: 0, row: 2 }],
    width: 1,
    height: 3,
  },
  I4_H: {
    cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }],
    width: 4,
    height: 1,
  },
  I4_V: {
    cells: [{ col: 0, row: 0 }, { col: 0, row: 1 }, { col: 0, row: 2 }, { col: 0, row: 3 }],
    width: 1,
    height: 4,
  },

  // ── L / J / T (tri/tetrominoes) ──
  L: {
    // ##
    // #
    cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 0, row: 1 }],
    width: 2,
    height: 2,
  },
  J: {
    // ##
    //  #
    cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 1, row: 1 }],
    width: 2,
    height: 2,
  },
  T: {
    // ###
    //  #
    cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 1, row: 1 }],
    width: 3,
    height: 2,
  },

  // ── O (square) ──
  O: {
    cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 0, row: 1 }, { col: 1, row: 1 }],
    width: 2,
    height: 2,
  },

  // ── S / Z ──
  S: {
    //  ##
    // ##
    cells: [{ col: 1, row: 0 }, { col: 2, row: 0 }, { col: 0, row: 1 }, { col: 1, row: 1 }],
    width: 3,
    height: 2,
  },
  Z: {
    // ##
    //  ##
    cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 1, row: 1 }, { col: 2, row: 1 }],
    width: 3,
    height: 2,
  },

  // ── Rectangles ──
  RECT_2x3: {
    cells: [
      { col: 0, row: 0 }, { col: 1, row: 0 },
      { col: 0, row: 1 }, { col: 1, row: 1 },
      { col: 0, row: 2 }, { col: 1, row: 2 },
    ],
    width: 2,
    height: 3,
  },
  RECT_3x2: {
    cells: [
      { col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 },
      { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 },
    ],
    width: 3,
    height: 2,
  },
};

/** Get absolute cell positions for a block at a given anchor position */
export function getAbsoluteCells(
  shape: BlockShape,
  anchor: { col: number; row: number },
): { col: number; row: number }[] {
  return SHAPES[shape].cells.map((c) => ({
    col: anchor.col + c.col,
    row: anchor.row + c.row,
  }));
}

/** Get the set of unique row indices occupied by a shape at an anchor */
export function getOccupiedRows(shape: BlockShape, anchor: { col: number; row: number }): number[] {
  const rows = new Set<number>();
  for (const c of SHAPES[shape].cells) {
    rows.add(anchor.row + c.row);
  }
  return [...rows].sort((a, b) => a - b);
}

/** Get the set of unique column indices occupied by a shape at an anchor */
export function getOccupiedCols(shape: BlockShape, anchor: { col: number; row: number }): number[] {
  const cols = new Set<number>();
  for (const c of SHAPES[shape].cells) {
    cols.add(anchor.col + c.col);
  }
  return [...cols].sort((a, b) => a - b);
}
