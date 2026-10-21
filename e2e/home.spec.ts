import { expect, test, type Page } from '@playwright/test';

// The front page at / (issue #37): one link to the arcade game and one to the
// sea-time log, usable on an iPhone.

const links = (page: Page) => ({
  game: page.getByRole('link', { name: /Arcade game/ }),
  log: page.getByRole('link', { name: /Sea-time log/ }),
});

test('the root shows a link to the game and one to the sea-time log', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const response = await page.goto('/');
  // The root is the front page itself, not a redirect to the game.
  expect(response?.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe('/');
  await expect(page.getByRole('heading', { name: "Captain's Academy" })).toBeVisible();

  const { game, log } = links(page);
  await expect(game).toHaveAttribute('href', '/play/');
  await expect(log).toHaveAttribute('href', '/log/');
  await expect(page.getByRole('link')).toHaveCount(2);
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/qualif/i);
  expect(text).toContain('never counts as sea time');
  expect(errors).toEqual([]);
});

test('the game link opens the game', async ({ page }, testInfo) => {
  await page.goto('/');
  await links(page).game.click();
  await expect(page).toHaveURL(/\/play\/$/);
  if (testInfo.project.name === 'phone-portrait') {
    // Upright, the game asks to be turned sideways before it starts.
    await expect(page.locator('#rotate')).toBeVisible();
  } else {
    await expect(page.locator('#game canvas')).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => window.__captainsAcademy?.frame ?? 0))
      .toBeGreaterThan(0);
  }
});

test('the sea-time log link opens the log', async ({ page }) => {
  await page.goto('/');
  await links(page).log.click();
  await expect(page).toHaveURL(/\/log\/$/);
  await expect(page.getByRole('heading', { name: 'Sea-time log' })).toBeVisible();
  await expect(page.locator('#entries')).toHaveAttribute('data-state', 'ready');
});

// The service worker controls the page and the cache holds the front page.
async function waitForFrontPageCopy(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const cache = await caches.open('captains-academy-offline-v1');
        return (
          navigator.serviceWorker.controller !== null && (await cache.match('/')) !== undefined
        );
      }),
    )
    .toBe(true);
}

async function expectFrontPageOffline(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: "Captain's Academy" })).toBeVisible();
  await expect(links(page).game).toBeVisible();
  await expect(links(page).log).toBeVisible();
}

test('the front page opens offline after one online visit', async ({ page, context }) => {
  await page.goto('/');
  await waitForFrontPageCopy(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: "Captain's Academy" })).toBeVisible();

  // And the log it links to opens offline from there too, once it has been visited.
  await context.setOffline(false);
  await links(page).log.click();
  await expect(page.locator('#entries')).toHaveAttribute('data-state', 'ready');
  await context.setOffline(true);
  await page.goBack();
  await expect(page.getByRole('heading', { name: "Captain's Academy" })).toBeVisible();
  await links(page).log.click();
  await expect(page.getByRole('heading', { name: 'Sea-time log' })).toBeVisible();
});

test('the front page opens offline even if only the log was visited online', async ({
  page,
  context,
}) => {
  await page.goto('/log/');
  await expect(page.locator('#entries')).toHaveAttribute('data-state', 'ready');
  await waitForFrontPageCopy(page);
  await context.setOffline(true);
  await expectFrontPageOffline(page);
});

test.describe('at iPhone width', () => {
  // iPhone 15: 393×852 CSS pixels at 3× scale.
  test.use({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  test('both links are big, on screen, and nothing scrolls sideways', async ({
    page,
  }, testInfo) => {
    await page.goto('/');
    for (const link of Object.values(links(page))) {
      const box = await link.boundingBox();
      if (!box) throw new Error('link not shown');
      expect(box.height).toBeGreaterThanOrEqual(56);
      expect(box.width).toBeGreaterThan(393 * 0.8);
      expect(box.y + box.height).toBeLessThanOrEqual(852);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      393,
    );
    await page.screenshot({ path: testInfo.outputPath('home-iphone.png') });

    // A tap works as well as a click.
    await links(page).log.tap();
    await expect(page.getByRole('heading', { name: 'Sea-time log' })).toBeVisible();
  });
});
