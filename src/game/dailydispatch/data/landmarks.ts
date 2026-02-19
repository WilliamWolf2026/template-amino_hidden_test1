import type { LandmarkConfig, LandmarkType, BaseLandmarkType } from '../types';

/** Registry of all landmark type definitions */
export const LANDMARK_REGISTRY: Record<LandmarkType, LandmarkConfig> = {
  // Common landmarks (available in all chapters)
  house: {
    type: 'house',
    spriteFrame: 'house.png',
    connectableEdges: ['south'],
    displayName: 'House',
    county: null,
  },
  gas_station: {
    type: 'gas_station',
    spriteFrame: 'gas_station.png',
    connectableEdges: ['south', 'east'],
    displayName: 'Gas Station',
    county: null,
  },
  diner: {
    type: 'diner',
    spriteFrame: 'diner.png',
    connectableEdges: ['south'],
    displayName: 'Diner',
    county: null,
  },
  market: {
    type: 'market',
    spriteFrame: 'market.png',
    connectableEdges: ['south', 'west'],
    displayName: 'Market',
    county: null,
  },
  school: {
    type: 'school',
    spriteFrame: 'school.png',
    connectableEdges: ['south'],
    displayName: 'School',
    county: null,
  },

  // County-specific landmarks (placeholders - sprites TBD)
  casino: {
    type: 'casino',
    spriteFrame: 'casino.png',
    connectableEdges: ['south', 'north'],
    displayName: 'Casino',
    county: 'atlantic',
  },
  boardwalk: {
    type: 'boardwalk',
    spriteFrame: 'boardwalk.png',
    connectableEdges: ['south'],
    displayName: 'Boardwalk',
    county: 'atlantic',
  },
  mall: {
    type: 'mall',
    spriteFrame: 'mall.png',
    connectableEdges: ['south', 'east', 'west'],
    displayName: 'Mall',
    county: 'bergen',
  },
  gw_bridge: {
    type: 'gw_bridge',
    spriteFrame: 'gw_bridge.png',
    connectableEdges: ['east', 'west'],
    displayName: 'GW Bridge',
    county: 'bergen',
  },
  lighthouse: {
    type: 'lighthouse',
    spriteFrame: 'lighthouse.png',
    connectableEdges: ['south'],
    displayName: 'Lighthouse',
    county: 'cape_may',
  },
  beach: {
    type: 'beach',
    spriteFrame: 'beach.png',
    connectableEdges: ['north'],
    displayName: 'Beach',
    county: 'cape_may',
  },
  airport: {
    type: 'airport',
    spriteFrame: 'airport.png',
    connectableEdges: ['south', 'east'],
    displayName: 'Airport',
    county: 'essex',
  },
  arts_center: {
    type: 'arts_center',
    spriteFrame: 'arts_center.png',
    connectableEdges: ['south'],
    displayName: 'Arts Center',
    county: 'essex',
  },
  liberty_park: {
    type: 'liberty_park',
    spriteFrame: 'liberty_park.png',
    connectableEdges: ['south', 'east'],
    displayName: 'Liberty Park',
    county: 'hudson',
  },
  waterfront: {
    type: 'waterfront',
    spriteFrame: 'waterfront.png',
    connectableEdges: ['south'],
    displayName: 'Waterfront',
    county: 'hudson',
  },
};

/** Get landmark config by type */
export function getLandmarkConfig(type: LandmarkType): LandmarkConfig {
  const config = LANDMARK_REGISTRY[type];
  if (!config) {
    throw new Error(`Unknown landmark type: ${type}`);
  }
  return config;
}

/** Get all common landmarks */
export function getCommonLandmarks(): LandmarkConfig[] {
  return Object.values(LANDMARK_REGISTRY).filter((c) => c.county === null);
}

/** Get landmarks for a specific county */
export function getCountyLandmarks(county: string): LandmarkConfig[] {
  return Object.values(LANDMARK_REGISTRY).filter((c) => c.county === county);
}

/** Landmark cycling order per GDD */
const LANDMARK_CYCLE: BaseLandmarkType[] = ['diner', 'gas_station', 'market'];

/** Get landmark type for cycling */
export function getLandmarkTypeForIndex(index: number): BaseLandmarkType {
  return LANDMARK_CYCLE[index % LANDMARK_CYCLE.length];
}
