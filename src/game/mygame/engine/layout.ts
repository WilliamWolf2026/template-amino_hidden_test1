/**
 * Recipe Hunt — Item Placement
 *
 * Places food items at random non-overlapping positions with organic scatter.
 * Pure function — no DOM, no Math.random().
 */

import type { Ingredient, PlacedItem, Position } from './types';

const MIN_EDGE_MARGIN = 28;

/**
 * Place items at random non-overlapping positions within the play area.
 *
 * @param requiredIngredients — ingredients the player must find
 * @param distractors — extra items that fill the field
 * @param width — play area width in px
 * @param height — play area height in px
 * @param minSpacing — minimum distance between item centres (default 52)
 * @param rng — seeded RNG returning [0,1)
 * @returns array of PlacedItem with positions assigned
 */
export function placeItems(
  requiredIngredients: Ingredient[],
  distractors: Ingredient[],
  width: number,
  height: number,
  minSpacing: number,
  rng: () => number,
): PlacedItem[] {
  const allIngredients: { ingredient: Ingredient; isRequired: boolean }[] = [
    ...requiredIngredients.map((ing) => ({ ingredient: ing, isRequired: true })),
    ...distractors.map((ing) => ({ ingredient: ing, isRequired: false })),
  ];

  // Shuffle so required items are not always first in the DOM
  for (let i = allIngredients.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = allIngredients[i]!;
    allIngredients[i] = allIngredients[j]!;
    allIngredients[j] = tmp;
  }

  const placed: PlacedItem[] = [];
  const positions: Position[] = [];

  const usableW = width - MIN_EDGE_MARGIN * 2;
  const usableH = height - MIN_EDGE_MARGIN * 2;

  for (let idx = 0; idx < allIngredients.length; idx++) {
    const entry = allIngredients[idx]!;
    const pos = findPosition(positions, usableW, usableH, minSpacing, rng);

    placed.push({
      id: `item_${idx}`,
      ingredient: entry.ingredient,
      position: { x: pos.x + MIN_EDGE_MARGIN, y: pos.y + MIN_EDGE_MARGIN },
      found: false,
      isRequired: entry.isRequired,
    });
    positions.push(pos);
  }

  return placed;
}

/**
 * Find a valid position that doesn't overlap existing positions.
 * Tries up to 200 random attempts, then falls back to grid-offset placement.
 */
function findPosition(
  existing: Position[],
  width: number,
  height: number,
  minSpacing: number,
  rng: () => number,
): Position {
  const maxAttempts = 200;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = rng() * width;
    const y = rng() * height;

    if (isValidPosition(x, y, existing, minSpacing)) {
      return { x, y };
    }
  }

  // Fallback: place in a grid with jitter
  const cols = Math.max(1, Math.floor(width / minSpacing));
  const idx = existing.length;
  const row = Math.floor(idx / cols);
  const col = idx % cols;
  const baseX = (col + 0.5) * (width / cols);
  const baseY = (row + 0.5) * minSpacing;
  const jitterX = (rng() - 0.5) * minSpacing * 0.3;
  const jitterY = (rng() - 0.5) * minSpacing * 0.3;

  return {
    x: Math.max(0, Math.min(width, baseX + jitterX)),
    y: Math.max(0, Math.min(height, baseY + jitterY)),
  };
}

function isValidPosition(
  x: number,
  y: number,
  existing: Position[],
  minSpacing: number,
): boolean {
  const minSq = minSpacing * minSpacing;
  for (const pos of existing) {
    const dx = x - pos.x;
    const dy = y - pos.y;
    if (dx * dx + dy * dy < minSq) return false;
  }
  return true;
}
