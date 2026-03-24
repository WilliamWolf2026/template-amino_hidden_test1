import { GameKIT } from '@wolfgames/game-kit';
import { getEnvironment } from '../config';
import { toGameKitEnvironment } from '../config/environment';
import { projectId } from '../../../wolf-game-kit.json';

export const environment = toGameKitEnvironment(getEnvironment());

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
