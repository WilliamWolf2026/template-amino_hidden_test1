import { test, expect } from '@playwright/test';

/**
 * Scaffold smoke tests: app loads, screens visible, no crash.
 * Tag: @smoke — run with --grep "@smoke"
 */
test.describe('@smoke', () => {
  test('app loads and shows loading or start screen', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 15000 });
    const app = page.locator('#app');
    await expect(app).toBeVisible({ timeout: 5000 });
  });

  test('loading screen eventually leaves and main content is visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);
    const app = page.locator('#app');
    await expect(app).toBeVisible({ timeout: 20000 });
    const canvasOrInteractive = page.locator('canvas, [role="button"], button');
    await expect(canvasOrInteractive.first()).toBeVisible({ timeout: 15000 });
  });

  test('no unhandled console errors during load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error') {
        const text = msg.text();
        if (!text.includes('ResizeObserver') && !text.includes('favicon')) {
          errors.push(text);
        }
      }
    });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);
    expect(errors).toEqual([]);
  });
});
