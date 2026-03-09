/**
 * Level → background frame mapping for simplegame1 flip-book.
 * Cycles through 4 atlas backgrounds for 12 levels.
 */

export const BACKGROUND_FRAMES = [
  'bg-closing_truck.png',
  'bg-closing_truck_b.png',
  'bg-gameboard.png',
  'bg-warehouse_interior.png',
] as const;

export function getBackgroundFrame(levelNumber: number): string {
  return BACKGROUND_FRAMES[(levelNumber - 1) % BACKGROUND_FRAMES.length];
}
