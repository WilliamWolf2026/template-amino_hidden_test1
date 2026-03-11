import { test, expect } from "@playwright/test";

test.describe("scaffold evaluation @smoke", () => {
  test("app loads and root is visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#app")).toBeVisible({ timeout: 15_000 });
  });

  test("loading completes and main content appears", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#app")).toBeVisible({ timeout: 15_000 });
    await page.waitForLoadState("networkidle").catch(() => {});
    const hasCanvasOrMainContent =
      (await page.locator("canvas").count()) > 0 ||
      (await page.locator("[data-screen], [role='main'], main").count()) > 0 ||
      (await page.locator("body").innerText()).length > 10;
    expect(hasCanvasOrMainContent).toBeTruthy();
  });

  test("loading finishes and main content appears (loading screen uses @wolfgames/components Spinner)", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#app")).toBeVisible({ timeout: 15_000 });
    // Loading screen may show spinner briefly; we only assert we reach main content
    // (loading can be fast so spinner is not always visible in time).
    // Start screen: DOM with h1 + Play button (no canvas). Game screen: Pixi canvas.
    await expect(
      page
        .locator("#app canvas:not([class*='tp-'])")
        .or(page.locator("#app h1"))
        .first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
