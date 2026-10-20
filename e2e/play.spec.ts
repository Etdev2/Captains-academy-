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

test('the level stays paused behind the rotate prompt in portrait', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 412, height: 839 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto('/play/');
  await expect(page.locator('#rotate')).toBeVisible();
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => window.__captainsAcademy?.frame ?? 0)).toBe(0);
  await context.close();
});

test('the level plays offline after one online visit', async ({ page, context }) => {
  await page.goto('/play/');
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const cache = await caches.open('captains-academy-play-v1');
        return navigator.serviceWorker.controller !== null && (await cache.keys()).length >= 2;
      }),
    )
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#game canvas')).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.__captainsAcademy?.frame ?? 0))
    .toBeGreaterThan(30);
});
