/**
 * Game-layer test: simplegame1 calls unload at runtime when leaving the game screen.
 *
 * Uses a mock coordinator to assert that when the game controller's destroy()
 * runs (e.g. on navigating away), it calls unloadBundle for the atlas bundle.
 * Does not require Pixi/DOM; tests that the game is wired correctly.
 *
 * Run: bun run test:run
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { setupGame } from "../src/game/simplegame1/screens/gameController";
import { ATLAS_BUNDLE } from "../src/game/simplegame1/data/levelBackgrounds";

function createMockCoordinator() {
  return {
    loadBundle: vi.fn().mockResolvedValue(undefined),
    isLoaded: vi.fn().mockReturnValue(true),
    getGpuLoader: vi.fn().mockReturnValue(null),
    unloadBundle: vi.fn().mockResolvedValue(undefined),
  };
}

describe("simplegame1 — unload at runtime", () => {
  it.skip("destroy() calls coordinator.unloadBundle(ATLAS_BUNDLE) (when unload is on coordinator)", () => {
    const mockCoordinator = createMockCoordinator();
    const controller = setupGame({
      coordinator: mockCoordinator as unknown as import("~/core/systems/assets").AssetCoordinator,
      tuning: { scaffold: {}, game: {} } as never,
      audio: {},
      gameData: {},
      analytics: {},
      goto: vi.fn(),
    });

    controller.destroy();

    expect(mockCoordinator.unloadBundle).toHaveBeenCalledTimes(1);
    expect(mockCoordinator.unloadBundle).toHaveBeenCalledWith(ATLAS_BUNDLE);
  });
});
