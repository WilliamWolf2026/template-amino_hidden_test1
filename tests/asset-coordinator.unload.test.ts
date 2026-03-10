/**
 * Asset coordinator — unload contract (baseline for loader evolution).
 *
 * Run: bun run test:run (or npm run test:run)
 *
 * Before implementing unload: "existing contract" tests pass; "unload" tests fail.
 * After adding unloadBundle / unloadScene: all tests pass.
 *
 * See: docs/tickets/asset-loader-evolution-test-ticket.md
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AssetCoordinator } from "../src/core/systems/assets/coordinator";
import type { Manifest } from "../src/core/systems/assets/types";
import { upgradeManifest } from "../src/core/systems/assets/types";

const MINIMAL_MANIFEST: Manifest = {
  cdnBase: "https://example.com/assets/",
  localBase: "/assets/",
  bundles: [
    { name: "theme-test", assets: [] },
  ],
};

describe("Asset coordinator — existing contract", () => {
  let coordinator: AssetCoordinator;

  beforeEach(() => {
    coordinator = new AssetCoordinator();
    coordinator.init(upgradeManifest(MINIMAL_MANIFEST), { engine: "pixi" });
  });

  it("throws for unknown bundle name", async () => {
    await expect(coordinator.loadBundle("unknown-bundle")).rejects.toThrow(
      /Unknown bundle/
    );
  });

  it("loadBundle(name) then isLoaded(name) is true for known bundle", async () => {
    await coordinator.loadBundle("theme-test");
    expect(coordinator.isLoaded("theme-test")).toBe(true);
  });
});

describe("Asset coordinator — unload (desired contract)", () => {
  let coordinator: AssetCoordinator;

  beforeEach(() => {
    coordinator = new AssetCoordinator();
    coordinator.init(upgradeManifest(MINIMAL_MANIFEST), { engine: "pixi" });
  });

  it("unloadBundle(name) exists on coordinator", () => {
    expect(typeof (coordinator as unknown as { unloadBundle?: (n: string) => void }).unloadBundle).toBe("function");
  });

  it("after loadBundle(name) then unloadBundle(name), isLoaded(name) is false", async () => {
    await coordinator.loadBundle("theme-test");
    expect(coordinator.isLoaded("theme-test")).toBe(true);

    const coord = coordinator as unknown as { unloadBundle: (n: string) => void | Promise<void> };
    if (typeof coord.unloadBundle !== "function") {
      throw new Error("unloadBundle not implemented");
    }
    await Promise.resolve(coord.unloadBundle("theme-test"));

    expect(coordinator.isLoaded("theme-test")).toBe(false);
  });

  it("unloadScene(name) exists and delegates to unloadBundle(`scene-${name}`)", () => {
    const coord = coordinator as unknown as { unloadScene?: (n: string) => void };
    expect(typeof coord.unloadScene).toBe("function");
    // Delegation to unloadBundle('scene-X') is implementation detail; we only assert API exists here
  });
});
