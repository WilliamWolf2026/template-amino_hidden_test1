import type { LandmarkType } from '../types';

/** County configuration */
export interface CountyConfig {
  id: string;
  name: string;
  specificLandmarks: LandmarkType[];
  themeColor?: number;
}

/** All NJ counties with configurations */
export const COUNTY_REGISTRY: Record<string, CountyConfig> = {
  atlantic: {
    id: 'atlantic',
    name: 'Atlantic County',
    specificLandmarks: ['casino', 'boardwalk'],
    themeColor: 0x1a5276,
  },
  bergen: {
    id: 'bergen',
    name: 'Bergen County',
    specificLandmarks: ['mall', 'gw_bridge'],
    themeColor: 0x196f3d,
  },
  burlington: {
    id: 'burlington',
    name: 'Burlington County',
    specificLandmarks: [],
    themeColor: 0x7d3c98,
  },
  camden: {
    id: 'camden',
    name: 'Camden County',
    specificLandmarks: [],
    themeColor: 0xc0392b,
  },
  cape_may: {
    id: 'cape_may',
    name: 'Cape May County',
    specificLandmarks: ['lighthouse', 'beach'],
    themeColor: 0xd4ac0d,
  },
  cumberland: {
    id: 'cumberland',
    name: 'Cumberland County',
    specificLandmarks: [],
    themeColor: 0x935116,
  },
  essex: {
    id: 'essex',
    name: 'Essex County',
    specificLandmarks: ['airport', 'arts_center'],
    themeColor: 0x2874a6,
  },
  gloucester: {
    id: 'gloucester',
    name: 'Gloucester County',
    specificLandmarks: [],
    themeColor: 0x117a65,
  },
  hudson: {
    id: 'hudson',
    name: 'Hudson County',
    specificLandmarks: ['liberty_park', 'waterfront'],
    themeColor: 0x5d6d7e,
  },
  hunterdon: {
    id: 'hunterdon',
    name: 'Hunterdon County',
    specificLandmarks: [],
    themeColor: 0x784212,
  },
  mercer: {
    id: 'mercer',
    name: 'Mercer County',
    specificLandmarks: [],
    themeColor: 0x1f618d,
  },
  middlesex: {
    id: 'middlesex',
    name: 'Middlesex County',
    specificLandmarks: [],
    themeColor: 0x6c3483,
  },
  monmouth: {
    id: 'monmouth',
    name: 'Monmouth County',
    specificLandmarks: [],
    themeColor: 0x148f77,
  },
  morris: {
    id: 'morris',
    name: 'Morris County',
    specificLandmarks: [],
    themeColor: 0x1e8449,
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean County',
    specificLandmarks: [],
    themeColor: 0x2980b9,
  },
  passaic: {
    id: 'passaic',
    name: 'Passaic County',
    specificLandmarks: [],
    themeColor: 0x884ea0,
  },
  salem: {
    id: 'salem',
    name: 'Salem County',
    specificLandmarks: [],
    themeColor: 0xa04000,
  },
  somerset: {
    id: 'somerset',
    name: 'Somerset County',
    specificLandmarks: [],
    themeColor: 0x0e6655,
  },
  sussex: {
    id: 'sussex',
    name: 'Sussex County',
    specificLandmarks: [],
    themeColor: 0x145a32,
  },
  union: {
    id: 'union',
    name: 'Union County',
    specificLandmarks: [],
    themeColor: 0x4a235a,
  },
  warren: {
    id: 'warren',
    name: 'Warren County',
    specificLandmarks: [],
    themeColor: 0x7e5109,
  },
};

/** Get county config by id */
export function getCountyConfig(countyId: string): CountyConfig | undefined {
  return COUNTY_REGISTRY[countyId];
}

/** Get all county ids */
export function getAllCountyIds(): string[] {
  return Object.keys(COUNTY_REGISTRY);
}
