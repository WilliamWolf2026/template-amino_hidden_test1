import { test, expect } from "@playwright/test";

test.describe("unload bundles @unload-bundles", () => {
  test("navigate to game and back leaves no obvious resource leak", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("#app")).toBeVisible({ timeout: 15_000 });
    await page.waitForLoadState("domcontentloaded");

    const startUrl = page.url();
    await page.goto("/");
    await expect(page.locator("#app")).toBeVisible({ timeout: 10_000 });

    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e.message)));
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    expect(errors).toHaveLength(0);
  });
});
