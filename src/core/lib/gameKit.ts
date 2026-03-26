import {
  GameKIT,
  GetAnalyticsServiceCommand,
  type AnalyticsService,
} from "@wolfgames/game-kit";
import { getEnvironment } from "../config";
const projectId = import.meta.env.VITE_GAME_KIT_PROJECT_ID;

export const environment = getEnvironment();

let instance: GameKIT | null = null;
let analyticsInstance: AnalyticsService | null = null;

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

export async function getAnalyticsService(): Promise<AnalyticsService> {
  if (analyticsInstance) return analyticsInstance;

  const gameKit = getGameKit();
  analyticsInstance = await gameKit.execute(
    new GetAnalyticsServiceCommand({
      enabled: !!import.meta.env.VITE_POSTHOG_API_KEY,
      platform: "web",
      environment: String(environment),
      userId: "anonymous",
      userName: "",
      userEmail: "",
      apiKey: import.meta.env.VITE_POSTHOG_API_KEY || "",
      apiHost: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
    }),
  ).promise;

  return analyticsInstance;
}

export { type AnalyticsService, type PostHog } from "@wolfgames/game-kit";
