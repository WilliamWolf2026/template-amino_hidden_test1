import {
  GameKIT,
  GetAnalyticsServiceCommand,
  type AnalyticsService,
} from "@wolfgames/game-kit";
import { getEnvironment } from "../config";
import { baseParamsSet, type BaseAnalyticsContext } from "~/game/setup/events";
import { GAME_NAME } from "~/game/config";

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
  const service = await gameKit.execute(
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

  // Extend with game identity params — every tracker that includes 'base'
  // automatically gets game_name, game_slug, game_id, session_elapsed
  analyticsInstance = service
    .withContext<BaseAnalyticsContext>({
      sessionStartTime: Date.now(),
      gameSlug: projectId,
    })
    .addParamsSet({ base: baseParamsSet })
    .addParamsDefault({
      base: (ctx) => ({
        game_name: GAME_NAME,
        game_slug: ctx.gameSlug,
        session_elapsed: parseFloat(
          ((Date.now() - ctx.sessionStartTime) / 1000).toFixed(2)
        ),
      }),
    }) as unknown as AnalyticsService;

  return analyticsInstance;
}

export { type AnalyticsService, type PostHog } from "@wolfgames/game-kit";
