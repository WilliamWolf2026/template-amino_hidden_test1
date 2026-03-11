/**
 * Asset coordinator — contract tests against GC-based coordinator.
 *
 * Run: bun run test:run (or npm run test:run)
 *
 * Unload tests are skipped until unloadBundle/unloadScene are implemented on the GC wrapper.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createScaffoldCoordinatorFromGc,
  type ScaffoldCoordinatorFromGc,
} from "../src/core/systems/assets/gc/coordinator-wrapper";
import type { Manifest } from "../src/core/systems/assets/types";

const MINIMAL_MANIFEST: Manifest = {
  cdnBase: "https://example.com/assets/",
  localBase: "/assets/",
  bundles: [{ name: "theme-test", assets: [] }],
};

describe("Asset coordinator — existing contract", () => {
  let coordinator: ScaffoldCoordinatorFromGc;

  beforeEach(() => {
    coordinator = createScaffoldCoordinatorFromGc(MINIMAL_MANIFEST, {
      engine: "pixi",
    });
  });

  it("unknown bundle: loadBundle does not throw, isLoaded is false", async () => {
    await expect(coordinator.loadBundle("unknown-bundle")).resolves.toBeUndefined();
    expect(coordinator.isLoaded("unknown-bundle")).toBe(false);
  });

  it("loadBundle(name) then isLoaded(name) is true for known bundle", async () => {
    await coordinator.loadBundle("theme-test");
    expect(coordinator.isLoaded("theme-test")).toBe(true);
  });
});

describe("Asset coordinator — unload (desired contract, not yet on GC wrapper)", () => {
  let coordinator: ScaffoldCoordinatorFromGc;

  beforeEach(() => {
    coordinator = createScaffoldCoordinatorFromGc(MINIMAL_MANIFEST, {
      engine: "pixi",
    });
  });

  it.skip("unloadBundle(name) exists on coordinator", () => {
    expect(typeof (coordinator as { unloadBundle?: (n: string) => void }).unloadBundle).toBe(
      "function"
    );
  });

  it.skip("after loadBundle(name) then unloadBundle(name), isLoaded(name) is false", async () => {
    await coordinator.loadBundle("theme-test");
    expect(coordinator.isLoaded("theme-test")).toBe(true);

    const coord = coordinator as unknown as { unloadBundle: (n: string) => void | Promise<void> };
    if (typeof coord.unloadBundle !== "function") throw new Error("unloadBundle not implemented");
    await Promise.resolve(coord.unloadBundle("theme-test"));

    expect(coordinator.isLoaded("theme-test")).toBe(false);
  });

  it.skip("unloadScene(name) exists and delegates to unloadBundle(`scene-${name}`)", () => {
    const coord = coordinator as { unloadScene?: (n: string) => void };
    expect(typeof coord.unloadScene).toBe("function");
  });
});
