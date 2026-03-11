/** Game-components asset loading integration */
export { scaffoldManifestToGc, type ManifestAdapterResult } from './manifest-adapter';
export { createDomAdapter, getFrameURLFromSpritesheet } from './dom-adapter';
export {
  createScaffoldCoordinatorFromGc,
  type ScaffoldCoordinatorFromGc,
} from './coordinator-wrapper';
