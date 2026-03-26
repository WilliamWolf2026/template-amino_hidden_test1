import { GameKIT } from '@wolfgames/game-kit';
import { getEnvironment } from '../config';
const projectId = import.meta.env.VITE_GAME_KIT_PROJECT_ID;

export const environment = getEnvironment();

let instance: GameKIT | null = null;

export function getGameKit(): GameKIT {
  if (instance) {
    return instance;
  }

  instance = new GameKIT({
    projectId,
    environment,
  });

  return instance;
}

export { type PostHog } from '@wolfgames/game-kit';
