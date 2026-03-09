import { test, expect } from '@playwright/test';

/**
 * Tests relevant to "unload bundles" scaffold modification.
 * Tag: @unload-bundles — run with --grep "@unload-bundles"
 *
 * Runs the REAL app in a real browser. Uses window.__scaffold__.coordinator
 * (exposed in dev only) to assert loaded bundles and to call unloadBundle.
 * These tests FAIL until unloadBundle is implemented in the coordinator and loaders.
 */
test.describe('@unload-bundles', () => {
  test('running game: after unloadBundle(name), bundle is no longer in getLoadedBundles()', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    await expect
      .poll(
        async () => {
          return await page.evaluate(() => (window as unknown as { __scaffold__?: { coordinator: { getLoadedBundles: () => string[] } } }).__scaffold__?.coordinator != null);
        },
        { timeout: 15000 }
      )
      .toBe(true);

    const getLoadedBundles = () =>
      page.evaluate(() => (window as unknown as { __scaffold__: { coordinator: { getLoadedBundles: () => string[] } } }).__scaffold__.coordinator.getLoadedBundles());

    const loadedBefore = await getLoadedBundles();
    expect(loadedBefore.length).toBeGreaterThan(0);
    const bundleToUnload = loadedBefore[0];

    await page.evaluate(
      (name) => (window as unknown as { __scaffold__: { coordinator: { unloadBundle: (n: string) => Promise<void> } } }).__scaffold__.coordinator.unloadBundle(name),
      bundleToUnload
    );

    const loadedAfter = await getLoadedBundles();
    expect(loadedAfter).not.toContain(bundleToUnload);
  });

  test('load app then reload without crash', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    await expect(page.locator('#app')).toBeVisible({ timeout: 5000 });
  });

  test('navigate to start and wait — no crash', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(5000);
    const app = page.locator('#app');
    await expect(app).toBeVisible();
  });

  test('load → reload cycle 3 times without crash', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
    }
    await expect(page.locator('#app')).toBeVisible({ timeout: 5000 });
  });

  /**
   * Memory behavior (no unload): measure heap after repeated full-page reloads.
   * Assets are never unloaded, so we expect memory to grow as the game loads more.
   * This establishes baseline behavior; no unloadBundle required.
   * Uses performance.memory.usedJSHeapSize (Chromium-only).
   */
  test('memory behavior: heap after repeated reloads (no unload, baseline)', async ({ page }) => {
    const getHeapMb = () =>
      page.evaluate(() => {
        const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
        return mem ? mem.usedJSHeapSize / (1024 * 1024) : 0;
      });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const heapAfterFirstLoad = await getHeapMb();
    if (heapAfterFirstLoad === 0) {
      test.skip(true, 'performance.memory not available (non-Chromium or disabled)');
      return;
    }

    const numReloads = 5;
    for (let i = 0; i < numReloads; i++) {
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    }

    const heapAfterReloads = await getHeapMb();
    const growthMb = heapAfterReloads - heapAfterFirstLoad;
    const growthPercent = heapAfterFirstLoad > 0 ? (growthMb / heapAfterFirstLoad) * 100 : 0;

    // Without unload we expect memory to grow (or stay high). Only fail on catastrophic growth.
    const maxGrowthMb = 150;
    expect(
      growthMb,
      `Heap after ${numReloads} reloads: ${heapAfterReloads.toFixed(1)} MB (was ${heapAfterFirstLoad.toFixed(1)} MB, +${growthMb.toFixed(1)} MB / +${growthPercent.toFixed(0)}%)`
    ).toBeLessThan(maxGrowthMb);
  });
});
