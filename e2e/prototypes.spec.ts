import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isReviewable, parseInventory } from '../src/prototypes/inventory';

// The prototype review gallery at /prototypes (issue #72), on a desktop and an
// upright phone: every image loads at its own size, the viewer keeps
// proportions and closes with Escape, filters and comparison work, and ratings
// save, edit, survive a refresh and add up correctly on this device.

const root = join(import.meta.dirname, '..');
const inventory = parseInventory(
  JSON.parse(readFileSync(join(root, 'docs/prototypes/inventory.json'), 'utf8')),
);
const reviewable = inventory.items.filter(isReviewable);
const withImages = inventory.items.filter((i) => i.image !== null);

/** A PNG's or JPEG's pixel size, read from the file on disk. */
function sizeOnDisk(path: string): { width: number; height: number } {
  const bytes = readFileSync(join(root, path));
  if (bytes.readUInt32BE(0) === 0x89504e47) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  // JPEG: walk the segments to the start-of-frame marker.
  let at = 2;
  while (at < bytes.length) {
    const marker = bytes.readUInt16BE(at);
    const length = bytes.readUInt16BE(at + 2);
    if (marker >= 0xffc0 && marker <= 0xffc3) {
      return { height: bytes.readUInt16BE(at + 5), width: bytes.readUInt16BE(at + 7) };
    }
    at += 2 + length;
  }
  throw new Error(`${path}: no image size found`);
}

const card = (page: Page, id: string) => page.locator(`.card[data-id="${id}"]`);

async function open(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/prototypes/');
  await expect(page.getByRole('heading', { name: 'Prototype review' })).toBeVisible();
  return errors;
}

async function setName(page: Page, name: string) {
  await page.getByLabel('Your name').fill(name);
  await page.getByLabel('Your name').press('Enter');
  await page.getByLabel('Your name').blur();
}

async function rate(page: Page, id: string, score: number, comment = '', favorite = false) {
  await card(page, id).locator('.open').click();
  const dialog = page.locator('#viewer');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(`${score} of 10`, { exact: true }).check({ force: true });
  if (comment !== '') await dialog.getByLabel('Comment (optional)').fill(comment);
  if (favorite) await dialog.getByLabel('Mark as a favorite').check();
  await dialog.getByRole('button', { name: /Save rating|Update rating/ }).click();
  await expect(dialog.locator('form .status')).toContainText(
    `Saved on this device: ${score} of 10`,
  );
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
}

test('every listed image and preview loads, at the size of the file in the repo', async ({
  page,
}) => {
  const errors = await open(page);
  const urls = await page.evaluate(() => window.__prototypeGallery);
  expect(urls).toBeDefined();
  expect(Object.keys(urls?.images ?? {}).sort()).toEqual(withImages.map((i) => i.id).sort());
  const loaded = await page.evaluate(async (all) => {
    const load = (src: string) =>
      new Promise<[number, number]>((resolve) => {
        const img = new Image();
        img.onload = () => resolve([img.naturalWidth, img.naturalHeight]);
        img.onerror = () => resolve([0, 0]);
        img.src = src;
      });
    const out: Record<string, { image: [number, number]; thumb: [number, number] }> = {};
    for (const [id, src] of Object.entries(all?.images ?? {})) {
      out[id] = { image: await load(src), thumb: await load(all?.thumbnails[id] ?? '') };
    }
    return out;
  }, urls);
  for (const item of withImages) {
    const size = sizeOnDisk(item.image ?? '');
    expect(loaded[item.id]?.image, item.id).toEqual([size.width, size.height]);
    expect(loaded[item.id]?.thumb[0], `${item.id} preview`).toBeGreaterThan(0);
  }
  expect(errors).toEqual([]);
});

test('the full-size viewer keeps proportions, zooms to 100% and closes with Escape', async ({
  page,
}) => {
  await open(page);
  const item = reviewable[0];
  if (!item) throw new Error('no reviewable item');
  const opener = card(page, item.id).locator('.open');
  await opener.click();
  const dialog = page.locator('#viewer');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: item.title })).toBeVisible();
  const image = page.locator('#viewer-image');
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  const ratio = () =>
    image.evaluate((img: HTMLImageElement) => {
      const box = img.getBoundingClientRect();
      return {
        shown: box.width / box.height,
        file: img.naturalWidth / img.naturalHeight,
        width: box.width,
        natural: img.naturalWidth,
      };
    });
  const fitted = await ratio();
  expect(Math.abs(fitted.shown - fitted.file) / fitted.file).toBeLessThan(0.01);
  await dialog.getByRole('button', { name: '100%' }).click();
  const actual = await ratio();
  expect(Math.round(actual.width)).toBe(actual.natural);
  expect(Math.abs(actual.shown - actual.file) / actual.file).toBeLessThan(0.01);
  await dialog.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.locator('#zoom-level')).toHaveText('150%');
  await expect(dialog).toContainText('Visual concept');
  await expect(dialog).toContainText('require verification before instructional use');

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('an extracted detail links to its whole source board, which is not rated', async ({
  page,
}) => {
  await open(page);
  const detail = reviewable.find((i) => i.extractedFrom !== undefined);
  const board = inventory.items.find((i) => i.id === detail?.extractedFrom);
  if (!detail || !board) throw new Error('no extracted detail');
  await card(page, detail.id).locator('.open').click();
  const dialog = page.locator('#viewer');
  await expect(dialog).toContainText('Extracted detail');
  await dialog.getByRole('button', { name: 'View the source board' }).click();
  await expect(dialog.getByRole('heading', { name: board.title })).toBeVisible();
  await expect(dialog).toContainText('Reference material. Not rated or ranked.');
  await expect(dialog.locator('form')).toHaveCount(0);
});

test('filters narrow the gallery to one style and one feature', async ({ page }) => {
  await open(page);
  await expect(page.locator('#gallery .card')).toHaveCount(reviewable.length);
  await page.getByLabel('Style').selectOption('Chart house');
  const chart = reviewable.filter((i) => i.style === 'Chart house');
  await expect(page.locator('#gallery .card')).toHaveCount(chart.length);
  await page.getByLabel('Screen or feature').selectOption('Lights');
  await expect(page.locator('#gallery .card')).toHaveCount(
    chart.filter((i) => i.feature === 'Lights').length,
  );
  await expect(page.locator('#filter-count')).toHaveText(/^Showing 1 of /);
  // Boards are not in the gallery's style list: they are reference only.
  await expect(
    page.getByLabel('Style').locator('option', { hasText: 'Comparison board' }),
  ).toHaveCount(0);
});

test('compare puts up to four images side by side on a desktop and one after another on a phone', async ({
  page,
}) => {
  await open(page);
  const ids = reviewable.slice(0, 5).map((i) => i.id);
  for (const id of ids.slice(0, 4))
    await card(page, id)
      .getByLabel(/^Compare /)
      .check();
  await expect(card(page, ids[4] ?? '').getByLabel(/^Compare /)).toBeDisabled();
  await page.getByRole('button', { name: /^Compare/ }).click();
  await page.locator('#compare').getByRole('button', { name: 'Remove' }).nth(3).click();
  const figures = page.locator('#compare figure');
  await expect(figures).toHaveCount(3);
  const first = await figures.nth(0).boundingBox();
  const second = await figures.nth(1).boundingBox();
  if (!first || !second) throw new Error('no figures');
  // Side by side from 900 px wide (prototypes/index.html), so a phone stacks them
  // even when held sideways.
  if ((page.viewportSize()?.width ?? 0) < 900) {
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
  } else {
    expect(Math.abs(second.y - first.y)).toBeLessThan(2);
    expect(second.x).toBeGreaterThan(first.x);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()?.width ?? 0,
  );
  await page.getByRole('button', { name: 'Clear comparison' }).click();
  await expect(figures).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Compare/ })).toHaveText('Compare');
});

test('a rating saves, survives a refresh and can be changed, and a comment shows as plain text', async ({
  page,
}) => {
  const errors = await open(page);
  const item = reviewable[0];
  if (!item) throw new Error('no reviewable item');
  // No name, no rating.
  await card(page, item.id).locator('.open').click();
  await expect(page.locator('#viewer').getByRole('button', { name: 'Save rating' })).toBeDisabled();
  await page.keyboard.press('Escape');

  await setName(page, 'Ana');
  const hostile = '<img src=x onerror="window.__hacked=1"> Calm and clear';
  await rate(page, item.id, 8, hostile, true);
  await expect(card(page, item.id)).toContainText('Your score: 8 of 10 · ★ favorite');

  await page.reload();
  await expect(page.getByLabel('Your name')).toHaveValue('Ana');
  await expect(card(page, item.id)).toContainText('Your score: 8 of 10');
  await card(page, item.id).locator('.open').click();
  await expect(page.locator('#viewer').getByLabel('8 of 10', { exact: true })).toBeChecked();
  await page.keyboard.press('Escape');
  await rate(page, item.id, 6);

  await page.getByRole('button', { name: 'Results' }).click();
  const row = page.locator(`.result[data-id="${item.id}"]`);
  await expect(row).toContainText('6.00');
  await expect(row).toContainText('n = 1 reviewer');
  await row.getByText('1 comment').click();
  await expect(row.locator('.comments li')).toContainText(hostile);
  await expect(row.locator('.comments img')).toHaveCount(0);
  expect(await page.evaluate(() => (window as { __hacked?: number }).__hacked)).toBeUndefined();
  await expect(page.locator('#results-scope')).toContainText('Saved on this device');
  await expect(page.locator('#results-scope')).toContainText('not shared team results');
  expect(errors).toEqual([]);
});

test('results stay hidden until you rate, leave unrated items out, show ties and merge imports', async ({
  page,
}) => {
  await open(page);
  const [a, b, c] = reviewable;
  if (!a || !b || !c) throw new Error('need three reviewable items');
  await setName(page, 'Ana');
  await rate(page, a.id, 8);

  const at = new Date().toISOString();
  const file = {
    kind: 'captains-academy/prototype-ratings',
    version: 1,
    exportedAt: at,
    reviews: [
      { itemId: a.id, reviewer: 'Ben', score: 6, comment: '', favorite: false, updatedAt: at },
      { itemId: b.id, reviewer: 'Ben', score: 4, comment: '', favorite: true, updatedAt: at },
      {
        itemId: 'no-such-item',
        reviewer: 'Ben',
        score: 9,
        comment: '',
        favorite: false,
        updatedAt: at,
      },
    ],
  };
  await page.getByRole('button', { name: 'Results' }).click();
  await page.locator('#import-file').setInputFiles({
    name: 'ben.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(file)),
  });
  await expect(page.locator('#import-status')).toContainText('2 added, 0 updated, 1 skipped');
  await expect(page.locator('#results-scope')).toContainText('from 2 reviewers');

  // Ana rated a only: b's score from Ben stays hidden, and c has no ratings at all.
  await expect(page.locator('.result')).toHaveCount(1);
  await expect(page.locator(`.result[data-id="${a.id}"]`)).toContainText('7.00');
  await expect(page.locator(`.result[data-id="${a.id}"]`)).toContainText('n = 2 reviewers');
  await expect(page.locator(`.result[data-id="${b.id}"]`)).toHaveCount(0);
  await expect(page.locator('#results-hidden')).toContainText('Not yet rated by you');

  // Once Ana rates b at 10, b averages 7 too: a tie, shown as one shared rank.
  await page.getByRole('button', { name: 'Gallery' }).click();
  await rate(page, b.id, 10);
  await page.getByRole('button', { name: 'Results' }).click();
  await expect(page.locator('.result')).toHaveCount(2);
  await expect(page.locator('.result .rank')).toHaveText(['=1Tied', '=1Tied']);
  await expect(page.locator(`.result[data-id="${c.id}"]`)).toHaveCount(0);

  await page.locator('#import-file').setInputFiles({
    name: 'notes.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hello":1}'),
  });
  await expect(page.locator('#import-status')).toHaveText(
    "This is not a Captain's Academy ratings file.",
  );
});

test("export downloads this reviewer's ratings as a file another device can import", async ({
  page,
}) => {
  await open(page);
  const item = reviewable[1];
  if (!item) throw new Error('no reviewable item');
  await setName(page, 'Ana');
  await rate(page, item.id, 9, 'Strong');
  await page.getByRole('button', { name: 'Results' }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export my ratings' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(
    /^captains-academy-prototype-ratings-ana-\d{4}-\d{2}-\d{2}\.json$/,
  );
  const path = await download.path();
  const file = JSON.parse(readFileSync(path, 'utf8')) as {
    kind: string;
    reviews: { itemId: string; score: number }[];
  };
  expect(file.kind).toBe('captains-academy/prototype-ratings');
  expect(file.reviews).toEqual([expect.objectContaining({ itemId: item.id, score: 9 })]);
});

test('with storage blocked, the page says ratings are not saved', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    });
  });
  const errors = await open(page);
  await expect(page.locator('#saved-where')).toContainText(
    'Not saved: this browser is blocking storage',
  );
  expect(errors).toEqual([]);
});

test('reference keeps the boards, the playable example and the missing styles apart from the ranking', async ({
  page,
}) => {
  await open(page);
  await page.getByRole('button', { name: 'Reference' }).click();
  const boards = inventory.items.filter((i) => i.style === 'Comparison board');
  for (const board of boards) await expect(card(page, board.id)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Night Harbor Run' })).toHaveAttribute(
    'href',
    'https://claude.ai/artifact/QNbtXuSXRQzjc64s4LWbVU',
  );
  await expect(page.locator('#unavailable li')).toHaveText([
    /^Clean maritime/,
    /^Professional academy/,
    /^Night bridge/,
  ]);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test('the offline cache never stores the gallery or its images', async ({ page }) => {
  // Opening the sea-time log installs the site's service worker.
  await page.goto('/log/');
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await open(page);
  const item = reviewable[0];
  if (!item) throw new Error('no reviewable item');
  await card(page, item.id).locator('.open').click();
  await expect
    .poll(() => page.locator('#viewer-image').evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  const cached = await page.evaluate(async () => {
    const cache = await caches.open('captains-academy-offline-v1');
    return (await cache.keys()).map((r) => new URL(r.url).pathname);
  });
  const urls = await page.evaluate(() => window.__prototypeGallery);
  const galleryFiles = [
    ...Object.values(urls?.images ?? {}),
    ...Object.values(urls?.thumbnails ?? {}),
  ].map((u) => new URL(u, page.url()).pathname);
  expect(cached.filter((path) => path.startsWith('/prototypes/'))).toEqual([]);
  expect(cached.filter((path) => galleryFiles.includes(path))).toEqual([]);
  // The log's own copy is still there.
  expect(cached).toContain('/log/');
});

test('the gallery and the viewer pass axe with no violations', async ({ page }) => {
  await open(page);
  const scan = async (label: string) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, label).toEqual([]);
  };
  await scan('gallery');
  await setName(page, 'Ana');
  await card(page, reviewable[0]?.id ?? '')
    .locator('.open')
    .click();
  await expect(page.locator('#viewer')).toBeVisible();
  await scan('viewer');
});
