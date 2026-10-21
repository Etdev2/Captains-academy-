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

test('the engine levers stay where they are left, and the boat answers', async ({ page }) => {
  await page.goto('/play/');
  const canvas = page.locator('#game canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('no canvas');
  // The two lever tracks run up the right-hand side of the 1280 x 768 game,
  // port at x 1124 and starboard at x 1204, with a grip for both at x 1164.
  const at = (x: number, y: number) =>
    [box.x + (x / 1280) * box.width, box.y + (y / 768) * box.height] as const;
  const drag = async (x: number) => {
    await page.mouse.move(...at(x, 473));
    await page.mouse.down();
    await page.mouse.move(...at(x, 340), { steps: 5 });
    await page.mouse.up();
  };
  const debug = () => page.evaluate(() => window.__captainsAcademy);

  await drag(1124);
  await expect.poll(async () => (await debug())?.port ?? 0).toBeGreaterThan(50);
  expect((await debug())?.starboard).toBe(0);

  await drag(1164);
  await expect.poll(async () => (await debug())?.starboard ?? 0).toBeGreaterThan(50);
  await expect.poll(async () => (await debug())?.speedMmPerS ?? 0).toBeGreaterThan(200);
});
