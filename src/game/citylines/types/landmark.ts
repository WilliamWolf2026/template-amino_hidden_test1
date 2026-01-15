import type { Edge, GridPosition } from './grid';

/** Base landmark types available in the tileset */
export type BaseLandmarkType = 'house' | 'gas_station' | 'diner' | 'market' | 'school';

/** County-specific landmark types (extensible) */
export type CountyLandmarkType =
  | 'casino'
  | 'boardwalk'
  | 'mall'
  | 'gw_bridge'
  | 'lighthouse'
  | 'beach'
  | 'airport'
  | 'arts_center'
  | 'liberty_park'
  | 'waterfront';

/** All landmark types */
export type LandmarkType = BaseLandmarkType | CountyLandmarkType;

/** Landmark type configuration */
export interface LandmarkConfig {
  type: LandmarkType;
  /** Sprite frame name in tileset */
  spriteFrame: string;
  /** Which edges can connect to roads */
  connectableEdges: Edge[];
  /** Display name for UI */
  displayName: string;
  /** County this landmark is specific to (null for common) */
  county: string | null;
}

/** Landmark placement in level config */
export interface LandmarkPlacement {
  type: LandmarkType;
  position: GridPosition;
  /** Override default connectable edges */
  connectableEdges?: Edge[];
}

/** Exit placement in level config */
export interface ExitPlacement {
  position: GridPosition;
  /** Which edge the exit faces (into the grid) */
  facingEdge: Edge;
}
