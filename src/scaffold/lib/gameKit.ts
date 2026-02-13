// --- 1. GameKIT Initialization ---

import { GameKIT } from "@wolfgames/game-kit";
import { getEnvironment } from "../config";

type GameKITEnv = ConstructorParameters<typeof GameKIT>[0]["environment"];

export const PROJECT_ID = "CityLines" as const;
export const ENVIRONMENT: GameKITEnv = getEnvironment() as GameKITEnv;

let instance: GameKIT | null = null;

export function getGameKit(): GameKIT {
  if (instance) return instance;
  instance = new GameKIT({
    projectId: PROJECT_ID,
    environment: ENVIRONMENT,
  });
  return instance;
}

export { type PostHog } from "@wolfgames/game-kit";
