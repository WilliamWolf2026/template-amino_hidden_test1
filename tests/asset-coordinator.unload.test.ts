/**
 * Asset coordinator — contract tests against @wolfgames/components coordinator.
 *
 * Run: bun run test:run (or npm run test:run)
 *
 * Uses mock loaders to test coordinator behavior in a node environment,
 * following the same pattern as game-components' own test suite.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAssetCoordinator } from "@wolfgames/components/core";
import type { Manifest, LoaderAdapter } from "@wolfgames/components/core";

const createMockLoader = (): LoaderAdapter => ({
  init: vi.fn(),
  loadBundle: vi.fn(async () => {}),
  get: vi.fn(() => null),
  has: vi.fn(() => false),
  unloadBundle: vi.fn(),
  dispose: vi.fn(),
});

const MINIMAL_MANIFEST: Manifest = {
  cdnBase: "https://example.com/assets/",
  localBase: "/assets/",
  bundles: [
    {
      name: "theme-test",
      assets: [{ alias: "theme-test", src: "theme-test.json" }],
    },
  ],
};

describe("Asset coordinator — existing contract", () => {
  let coordinator: ReturnType<typeof createAssetCoordinator>;
  let domLoader: LoaderAdapter;

  beforeEach(() => {
    domLoader = createMockLoader();
    coordinator = createAssetCoordinator({
      manifest: MINIMAL_MANIFEST,
      loaders: { dom: domLoader },
    });
  });

  it("unknown bundle: loadBundle records error, isLoaded is false", async () => {
    await coordinator.loadBundle("unknown-bundle");
    expect(coordinator.isLoaded("unknown-bundle")).toBe(false);
  });

  it("loadBundle(name) then isLoaded(name) is true for known bundle", async () => {
    await coordinator.loadBundle("theme-test");
    expect(coordinator.isLoaded("theme-test")).toBe(true);
  });
});

describe("Asset coordinator — unload contract", () => {
  let coordinator: ReturnType<typeof createAssetCoordinator>;
  let domLoader: LoaderAdapter;

  beforeEach(() => {
    domLoader = createMockLoader();
    coordinator = createAssetCoordinator({
      manifest: MINIMAL_MANIFEST,
      loaders: { dom: domLoader },
    });
  });

  it("unloadBundle exists on coordinator", () => {
    expect(typeof coordinator.unloadBundle).toBe("function");
  });

  it("after loadBundle then unloadBundle, isLoaded is false", async () => {
    await coordinator.loadBundle("theme-test");
    expect(coordinator.isLoaded("theme-test")).toBe(true);

    coordinator.unloadBundle("theme-test");
    expect(coordinator.isLoaded("theme-test")).toBe(false);
  });

  it("unloadBundle for non-existent bundle is a no-op", () => {
    expect(() => coordinator.unloadBundle("nonexistent")).not.toThrow();
  });
});
