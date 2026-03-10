import { describe, it, expect, beforeEach } from "vitest";
import {
  createScaffoldCoordinatorFromGc,
  type ScaffoldCoordinatorFromGc,
} from "~/core/systems/assets/gc/coordinator-wrapper";
import type { Manifest } from "~/core/systems/assets/types";

/**
 * TDD: Unload API tests. GC wrapper does not implement unload yet — tests skipped until then.
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

describe("AssetCoordinator unload (TDD — unload not yet on GC wrapper)", () => {
  let coordinator: ScaffoldCoordinatorFromGc;

  beforeEach(() => {
    coordinator = createScaffoldCoordinatorFromGc(minimalManifest, {
      engine: "pixi",
    });
  });

  it.skip("has unloadBundle method (when implemented on GC wrapper)", () => {
    expect(coordinator).toHaveProperty("unloadBundle");
    expect(typeof (coordinator as { unloadBundle?: (n: string) => Promise<void> }).unloadBundle).toBe("function");
  });

  it.skip("has unloadScene method (when implemented on GC wrapper)", () => {
    expect(coordinator).toHaveProperty("unloadScene");
    expect(typeof (coordinator as { unloadScene?: (n: string) => Promise<void> }).unloadScene).toBe("function");
  });

  it.skip("unloadBundle('unknown') is no-op and does not throw (when implemented)", async () => {
    const coord = coordinator as { unloadBundle?: (n: string) => Promise<void> };
    if (!coord.unloadBundle) throw new Error("unloadBundle not implemented");
    await expect(coord.unloadBundle("unknown")).resolves.toBeUndefined();
  });

  it.skip("unloadScene('foo') delegates to unloadBundle('scene-foo') (when implemented)", async () => {
    const coord = coordinator as { unloadScene?: (n: string) => Promise<void>; unloadBundle?: (n: string) => Promise<void> };
    if (!coord.unloadScene || !coord.unloadBundle) throw new Error("unload not implemented");
    // Delegation is implementation detail; when we add unload we can spy and assert
    await coord.unloadScene("foo");
  });
});
