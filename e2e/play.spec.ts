import { expect, test } from '@playwright/test';

// Smoke test: the level loads at /play, the simulation runs, and the helm answers.

test('the docking level loads and the boat gets under way', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/play/');
  await expect(page.locator('#game canvas')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.__captainsAcademy?.frame ?? 0))
    .toBeGreaterThan(30);
  expect(await page.evaluate(() => window.__captainsAcademy?.outcome)).toBe('playing');

  await page.keyboard.down('ArrowUp');
  await expect
    .poll(() => page.evaluate(() => window.__captainsAcademy?.speedMmPerS ?? 0))
    .toBeGreaterThan(100);
  await page.keyboard.up('ArrowUp');
  expect(errors).toEqual([]);
});
