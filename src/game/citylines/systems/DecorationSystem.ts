import { Container, Sprite } from 'pixi.js';
import type { GridPosition, GridSize, County } from '../types';
import { posKey } from '../types';
import type { PixiLoader } from '~/scaffold/systems/assets/loaders/gpu/pixi';
import { getAtlasName } from '../utils/atlasHelper';

/** Available decoration sprites */
const DECORATION_SPRITES = [
  'tree.png',
  'bush.png',
  'flower_a.png',
  'flower_b.png',
  'flower_c.png',
] as const;

type DecorationSprite = (typeof DECORATION_SPRITES)[number];

/** Decoration weights by county theme */
const COUNTY_WEIGHTS: Record<County, Record<DecorationSprite, number>> = {
  atlantic: {
    'tree.png': 1,
    'bush.png': 2,
    'flower_a.png': 3,
    'flower_b.png': 3,
    'flower_c.png': 2,
  },
  bergen: {
    'tree.png': 3,
    'bush.png': 2,
    'flower_a.png': 1,
    'flower_b.png': 1,
    'flower_c.png': 1,
  },
  cape_may: {
    'tree.png': 1,
    'bush.png': 1,
    'flower_a.png': 3,
    'flower_b.png': 3,
    'flower_c.png': 3,
  },
  essex: {
    'tree.png': 2,
    'bush.png': 3,
    'flower_a.png': 2,
    'flower_b.png': 2,
    'flower_c.png': 1,
  },
  hudson: {
    'tree.png': 1,
    'bush.png': 2,
    'flower_a.png': 2,
    'flower_b.png': 2,
    'flower_c.png': 2,
  },
};

/** Density settings by difficulty */
export interface DecorationDensity {
  /** Chance (0-1) that an empty cell gets a decoration */
  fillChance: number;
  /** Min decorations per cell (if filled) */
  minPerCell: number;
  /** Max decorations per cell (if filled) */
  maxPerCell: number;
}

const DEFAULT_DENSITY: DecorationDensity = {
  fillChance: 0.7,
  minPerCell: 1,
  maxPerCell: 3,
};

/** Seeded random number generator for consistent decoration placement */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

/** System for placing decorations on empty grid cells */
export class DecorationSystem {
  private gpuLoader: PixiLoader;
  private tileSize: number;
  private container: Container;
  private decorations: Sprite[] = [];
  private decorationPositions: Map<Sprite, GridPosition> = new Map();
  private decorationScales: Map<Sprite, { x: number; y: number }> = new Map();

  constructor(gpuLoader: PixiLoader, tileSize: number) {
    this.gpuLoader = gpuLoader;
    this.tileSize = tileSize;
    this.container = new Container();
    this.container.label = 'decorations';
  }

  /** Get the container for adding to stage */
  getContainer(): Container {
    return this.container;
  }

  /** Select a decoration sprite based on county weights */
  private selectDecoration(county: County, rng: SeededRandom): DecorationSprite {
    const weights = COUNTY_WEIGHTS[county];
    const totalWeight = DECORATION_SPRITES.reduce((sum, sprite) => sum + weights[sprite], 0);
    let random = rng.next() * totalWeight;

    for (const sprite of DECORATION_SPRITES) {
      random -= weights[sprite];
      if (random <= 0) {
        return sprite;
      }
    }

    return DECORATION_SPRITES[0];
  }

  /** Place decorations on empty cells */
  placeDecorations(
    gridSize: GridSize,
    occupiedPositions: Set<string>,
    county: County,
    levelSeed: number,
    density: DecorationDensity = DEFAULT_DENSITY,
    padding: number = 0,
    cellGap: number = 0
  ): void {
    this.clear();

    const rng = new SeededRandom(levelSeed);

    // Iterate through all grid cells
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        // GridPosition uses {x, y} format where x=col, y=row
        const pos: GridPosition = { x: col, y: row };
        const key = posKey(pos);

        // Skip occupied cells
        if (occupiedPositions.has(key)) {
          continue;
        }

        // Random chance to fill this cell
        if (rng.next() > density.fillChance) {
          continue;
        }

        // Determine number of decorations for this cell
        const count = rng.nextInt(density.minPerCell, density.maxPerCell);

        for (let i = 0; i < count; i++) {
          const spriteFrame = this.selectDecoration(county, rng);
          const sprite = this.gpuLoader.createSprite(getAtlasName(), spriteFrame);

          // Base position at cell center (accounting for padding and cell gap)
          const effectiveSize = this.tileSize + cellGap;
          const cellCenterX = padding + col * effectiveSize + this.tileSize / 2;
          const cellCenterY = padding + row * effectiveSize + this.tileSize / 2;

          // Random offset within cell (avoid edges)
          const margin = this.tileSize * 0.15;
          const offsetX = (rng.next() - 0.5) * (this.tileSize - margin * 2);
          const offsetY = (rng.next() - 0.5) * (this.tileSize - margin * 2);

          sprite.anchor.set(0.5);
          sprite.x = cellCenterX + offsetX;
          sprite.y = cellCenterY + offsetY;

          // Scale decorations to fit nicely
          const baseScale = this.tileSize / 128;
          const scaleVariation = 0.7 + rng.next() * 0.6; // 0.7 to 1.3
          const finalScale = baseScale * scaleVariation * 0.5; // 50% of tile size
          sprite.scale.set(finalScale);

          // Store original scale for animation
          this.decorationScales.set(sprite, { x: finalScale, y: finalScale });

          // Slight random rotation for flowers
          if (spriteFrame.startsWith('flower')) {
            sprite.rotation = rng.next() * Math.PI * 2;
          }

          this.container.addChild(sprite);
          this.decorations.push(sprite);
          this.decorationPositions.set(sprite, pos); // Track position for diagonal grouping
        }
      }
    }
  }

  /** Update decoration positions when grid layout changes */
  updateLayout(tileSize: number, padding: number, cellGap: number): void {
    this.tileSize = tileSize;

    for (const sprite of this.decorations) {
      const pos = this.decorationPositions.get(sprite);
      if (!pos) continue;

      // Recalculate position based on new tile size
      const effectiveSize = tileSize + cellGap;
      const cellCenterX = padding + pos.x * effectiveSize + tileSize / 2;
      const cellCenterY = padding + pos.y * effectiveSize + tileSize / 2;

      // Get original offset ratio (stored implicitly in current position)
      // We need to maintain relative position within cell
      const oldScale = this.decorationScales.get(sprite);
      if (oldScale) {
        // Update scale based on new tile size
        const baseScale = tileSize / 128;
        const scaleRatio = oldScale.x / (this.tileSize / 128 * 0.5); // Get original variation
        const newScale = baseScale * scaleRatio * 0.5;
        sprite.scale.set(newScale);
        this.decorationScales.set(sprite, { x: newScale, y: newScale });
      }

      // Random offset is preserved as ratio of tile size
      // For now, just reposition to cell center (offset will be recalculated on reload)
      sprite.x = cellCenterX;
      sprite.y = cellCenterY;
    }
  }

  /** Clear all decorations */
  clear(): void {
    for (const decoration of this.decorations) {
      decoration.destroy();
    }
    this.decorations = [];
    this.decorationPositions.clear();
    this.decorationScales.clear();
    this.container.removeChildren();
  }

  /** Get decorations grouped by diagonal index (for level transition animation) */
  getDecorationsByDiagonal(): Map<number, Sprite[]> {
    const groups = new Map<number, Sprite[]>();

    this.decorations.forEach(sprite => {
      const pos = this.decorationPositions.get(sprite);
      if (pos) {
        const diagonal = pos.x + pos.y;
        if (!groups.has(diagonal)) {
          groups.set(diagonal, []);
        }
        groups.get(diagonal)!.push(sprite);
      }
    });

    return groups;
  }

  /** Get original scale for a decoration sprite */
  getOriginalScale(sprite: Sprite): { x: number; y: number } | undefined {
    return this.decorationScales.get(sprite);
  }

  /** Set all decorations to initial state (scale=0, alpha=0) for level transition */
  setInitialState(): void {
    this.decorations.forEach(sprite => {
      sprite.scale.set(0);
      sprite.alpha = 0;
    });
  }

  /** Destroy the system */
  destroy(): void {
    this.clear();
    this.container.destroy();
  }
}
