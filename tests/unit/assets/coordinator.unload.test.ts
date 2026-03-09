import { describe, it, expect, beforeEach, vi } from "vitest";
import { AssetCoordinator } from "~/core/systems/assets/coordinator";
import type { Manifest } from "~/core/systems/assets/types";

/**
 * TDD: These tests define the desired unload API. They should FAIL until
 * unloadBundle/unloadScene are implemented in the coordinator and loaders.
 * Run: bun run test:run
 */

const minimalManifest: Manifest = {
  cdnBase: "/assets",
  localBase: "/assets",
  bundles: [
    { name: "theme-branding", assets: ["atlas-branding-wolf.json"], target: "dom" },
    { name: "scene-foo", assets: [], target: "dom" },
  ],
};

describe("AssetCoordinator unload (TDD — expect fail until implemented)", () => {
  let coordinator: AssetCoordinator;

  beforeEach(() => {
    coordinator = new AssetCoordinator();
    coordinator.init(minimalManifest, { engine: "pixi" });
  });

  it("has unloadBundle method", () => {
    expect(coordinator).toHaveProperty("unloadBundle");
    expect(typeof coordinator.unloadBundle).toBe("function");
  });

  it("has unloadScene method", () => {
    expect(coordinator).toHaveProperty("unloadScene");
    expect(typeof coordinator.unloadScene).toBe("function");
  });

  it("unloadBundle('unknown') is no-op and does not throw", async () => {
    await expect(coordinator.unloadBundle("unknown")).resolves.toBeUndefined();
  });

  it("unloadScene('foo') delegates to unloadBundle('scene-foo')", async () => {
    const unloadSpy = vi.spyOn(coordinator as any, "unloadBundle");
    await coordinator.unloadScene("foo");
    expect(unloadSpy).toHaveBeenCalledWith("scene-foo");
  });
});
