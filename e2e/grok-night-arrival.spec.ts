import { expect, test } from '@playwright/test';

// Smoke test for Grok's take on level 1 at /play/grok/: it loads, runs, and the helm answers.

test('night arrival loads and the boat gets under way', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/play/grok/');
  await expect(page.locator('#game canvas')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.__grokNightArrival?.frame ?? 0))
    .toBeGreaterThan(30);
  expect(await page.evaluate(() => window.__grokNightArrival?.outcome)).toBe('playing');
  await page.keyboard.press('KeyW');
  await page.keyboard.press('KeyW');
  await expect
    .poll(() => page.evaluate(() => window.__grokNightArrival?.speedMmPerS ?? 0))
    .toBeGreaterThan(300);
  expect(errors).toEqual([]);
});

test('?take=grok on /play/ opens the night arrival', async ({ page }) => {
  await page.goto('/play/?take=grok');
  await expect(page).toHaveURL(/\/play\/grok\/$/);
  await expect
    .poll(() => page.evaluate(() => window.__grokNightArrival?.frame ?? 0))
    .toBeGreaterThan(10);
});
