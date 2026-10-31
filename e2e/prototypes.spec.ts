import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isReviewable, parseInventory, type Item } from '../src/prototypes/inventory';

// The decision board at /prototypes (issue #72, ADR 0009), on a desktop and on
// phones: every image loads at its own size in a space reserved for it, tiles
// open a full-screen viewer that steps with swipes and arrow keys, reviewers
// drop five dots there where they like a concept, others' dots stay hidden until
// they finish, the heat ranks concepts with ties shown, and only the decider
// makes the call. The board is saved on this device and moves between devices
// as a file.

const root = join(import.meta.dirname, '..');
const inventory = parseInventory(
  JSON.parse(readFileSync(join(root, 'docs/prototypes/inventory.json'), 'utf8')),
);
const concepts = inventory.items.filter(isReviewable);
// The desktop captures of the Definitions screen open from their phone twins'
// viewer instead of having tiles of their own (src/prototypes/sections.ts), as
// do the iPhone captures of the interactive prototypes and climbed variants
// from their desktop twins.
const tiles = concepts.filter(
  (i) => !i.id.startsWith('app-definitions-desktop-') && !/^cl-(live|climb)-.+-iphone$/.test(i.id),
);
const withImages = inventory.items.filter((i) => i.image !== null);
const [first, second, third] = concepts;
if (!first || !second || !third) throw new Error('need three concepts');

/** A PNG's or JPEG's pixel size, read from the file on disk. */
function sizeOnDisk(path: string): { width: number; height: number } {
  const bytes = readFileSync(join(root, path));
  if (bytes.readUInt32BE(0) === 0x89504e47) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  let at = 2;
  while (at < bytes.length) {
    const marker = bytes.readUInt16BE(at);
    if (marker >= 0xffc0 && marker <= 0xffc3) {
      return { height: bytes.readUInt16BE(at + 5), width: bytes.readUInt16BE(at + 7) };
    }
    at += 2 + bytes.readUInt16BE(at + 2);
  }
  throw new Error(`${path}: no image size found`);
}

const card = (page: Page, id: string) => page.locator(`#board [data-id="${id}"]`);
const tileButton = (page: Page, id: string) => card(page, id).getByRole('button');
const viewer = (page: Page) => page.getByRole('dialog');
const dropZone = (page: Page, id: string) => viewer(page).locator(`[data-drop="${id}"]`);

async function open(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/prototypes/');
  await expect(page.getByRole('heading', { name: 'Decision board' })).toBeVisible();
  return errors;
}

async function choose(page: Page, trigger: string, option: string | RegExp) {
  await page.locator(trigger).click();
  await page.getByRole('option', { name: option }).click();
  await expect(page.getByRole('listbox')).toHaveCount(0);
}

const setStep = (page: Page, step: RegExp) => choose(page, '#round-step', step);

async function setName(page: Page, name: string) {
  await page.getByLabel('Your name').fill(name);
}

/** Opens a tile in the full-screen viewer. */
async function openViewer(page: Page, id: string) {
  await tileButton(page, id).click();
  await expect(viewer(page)).toBeVisible();
}

async function closeViewer(page: Page) {
  await page.keyboard.press('Escape');
  await expect(viewer(page)).toHaveCount(0);
}

/**
 * Opens a concept, drops a dot at a fraction of the image's width and height,
 * and closes the viewer again unless asked to keep it open.
 */
async function dropAt(page: Page, id: string, x: number, y: number, keepOpen = false) {
  await openViewer(page, id);
  const zone = dropZone(page, id);
  const box = await zone.boundingBox();
  if (!box) throw new Error(`no image for ${id}`);
  await zone.click({ position: { x: box.width * x, y: box.height * y } });
  if (!keepOpen) await closeViewer(page);
}

function boardFile(reviewer: string, dots: { itemId: string; x: number; y: number }[]) {
  const at = '2026-10-25T12:00:00.000Z';
  return {
    kind: 'captains-academy/decision-board',
    version: 1,
    exportedAt: at,
    phase: 'look',
    phaseUpdatedAt: '2000-01-01T00:00:00.000Z',
    reviewers: [
      {
        reviewer,
        dots: dots.map((d, i) => ({ id: `${reviewer}-${i}`, ...d })),
        notes: [],
        doneVoting: true,
        updatedAt: at,
      },
    ],
    decision: null,
  };
}

async function importFile(page: Page, name: string, content: string) {
  await page.getByRole('tab', { name: 'Share' }).click();
  await page.locator('#import-file').setInputFiles({
    name,
    mimeType: 'application/json',
    buffer: Buffer.from(content),
  });
}

test('every listed image and preview loads, at the size of the file in the repo', async ({
  page,
}) => {
  const errors = await open(page);
  const urls = await page.evaluate(() => window.__prototypeGallery);
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
  await expect(page.locator('#board li[data-id]')).toHaveCount(tiles.length);
  // Every tile carries a label of its own.
  for (const label of await page.locator('#board .tile-label').allTextContents()) {
    expect(label.trim().length).toBeGreaterThan(1);
  }
  // Nothing runs wider than the screen, on a phone or a desktop.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()?.width ?? 0,
  );
  expect(errors).toEqual([]);
});

test('a dot lands where you tap in the viewer, five at most, and you can take one back', async ({
  page,
}) => {
  const errors = await open(page);
  // Looking silently: no dots yet.
  await openViewer(page, first.id);
  await expect(dropZone(page, first.id)).toHaveCount(0);
  await closeViewer(page);
  await setStep(page, /Dot vote/);
  // A dot needs a name, and the viewer says so.
  await dropAt(page, first.id, 0.5, 0.5, true);
  await expect(page.locator('#viewer-status')).toHaveText('Enter your name first.');
  await closeViewer(page);

  await setName(page, 'Ana');
  await dropAt(page, first.id, 0.25, 0.4);
  // The dot shows on the tile, in the same place on the image.
  const dot = card(page, first.id).locator('[data-dot="mine"]');
  await expect(dot).toHaveCount(1);
  const style = (await dot.getAttribute('style')) ?? '';
  const [left, top] = [...style.matchAll(/([\d.]+)%/g)].map((m) => Number(m[1]));
  expect(Math.abs((left ?? 0) - 25)).toBeLessThan(3);
  expect(Math.abs((top ?? 0) - 40)).toBeLessThan(3);

  await dropAt(page, first.id, 0.7, 0.6);
  await openViewer(page, second.id);
  await viewer(page)
    .getByRole('button', { name: /^Add a dot/ })
    .click();
  await closeViewer(page);
  await dropAt(page, third.id, 0.5, 0.5);
  await dropAt(page, third.id, 0.6, 0.5);
  await expect(page.locator('#dots-left')).toHaveText('0 of 5 dots left');
  await dropAt(page, second.id, 0.2, 0.2, true);
  await expect(page.locator('#viewer-status')).toContainText('You have placed all 5 dots');
  await closeViewer(page);

  await openViewer(page, first.id);
  await viewer(page)
    .getByRole('button', { name: /^Take back your dot/ })
    .first()
    .click();
  await closeViewer(page);
  await expect(page.locator('#dots-left')).toHaveText('1 of 5 dots left');
  await expect(tileButton(page, first.id)).toHaveAttribute('aria-label', /, your 1 dot$/);

  // Saved on this device: the name, the step and the dots survive a refresh.
  await page.reload();
  await expect(page.getByLabel('Your name')).toHaveValue('Ana');
  await expect(page.locator('#dots-left')).toHaveText('1 of 5 dots left');
  await expect(tileButton(page, third.id)).toHaveAttribute('aria-label', /, your 2 dots$/);
  await expect(page.locator('#saved-where')).toHaveText('Saved on this device');
  expect(errors).toEqual([]);
});

test("others' dots stay hidden until you finish voting, then the heat ranks concepts with ties", async ({
  page,
}) => {
  await open(page);
  await setName(page, 'Ana');
  await importFile(
    page,
    'ben.json',
    JSON.stringify(
      boardFile('Ben', [
        { itemId: second.id, x: 0.5, y: 0.5 },
        { itemId: second.id, x: 0.4, y: 0.5 },
        { itemId: 'not-on-the-board', x: 0.5, y: 0.5 },
      ]),
    ),
  );
  await expect(page.locator('#share-status')).toContainText(
    '1 reviewers added, 0 updated, 1 dots or notes skipped',
  );
  await page.getByRole('tab', { name: 'Board' }).click();
  await setStep(page, /Dot vote/);
  await dropAt(page, first.id, 0.5, 0.5);
  await dropAt(page, first.id, 0.6, 0.5);

  // Still voting: Ben's two dots are not shown and the heat is hidden.
  await expect(card(page, second.id).locator('[data-dot]')).toHaveCount(0);
  await expect(page.locator('[data-heat]')).toHaveCount(0);

  await page.getByRole('button', { name: 'Done voting' }).click();
  await expect(card(page, second.id).locator('[data-dot="other"]')).toHaveCount(2);
  await expect(tileButton(page, second.id)).toHaveAttribute('aria-label', /, 2 dots$/);
  // Two dots each: a tie, shown as =1.
  await expect(page.locator(`[data-heat="${first.id}"]`)).toContainText('=1');
  await expect(page.locator(`[data-heat="${second.id}"]`)).toContainText('=1');

  await setStep(page, /Discuss/);
  await page.getByRole('button', { name: 'Only dotted concepts' }).click();
  await expect(page.locator('#board li[data-id]')).toHaveCount(2);
});

test('only the decider makes the call, with a reason', async ({ page }) => {
  await open(page);
  await setName(page, 'Ana');
  await setStep(page, /Decider's call/);
  await expect(page.getByRole('button', { name: 'Only Elliott makes the call' })).toBeDisabled();

  await setName(page, 'elliott');
  await choose(page, '#decision-pick', first.title);
  await page.getByLabel('Why this one').fill('Clearest on a phone in sun glare.');
  await page.getByRole('button', { name: 'Make the call' }).click();
  await expect(page.locator('#decision')).toContainText(`Decision: ${first.title}`);
  await expect(page.locator('#decision')).toContainText('Clearest on a phone in sun glare.');
  await page.reload();
  await expect(page.locator('#decision')).toContainText('Decided by elliott');
});

test('the viewer fills the screen, keeps proportions, closes with Escape, links an extracted detail to its board, and shows notes as text', async ({
  page,
}) => {
  await open(page);
  await setName(page, 'Ana');
  const detail = concepts.find((i) => i.extractedFrom !== undefined);
  const board = inventory.items.find((i) => i.id === detail?.extractedFrom);
  if (!detail || !board) throw new Error('no extracted detail');
  const opener = tileButton(page, detail.id);
  await opener.click();
  const dialog = viewer(page);
  await expect(dialog.getByRole('heading', { name: detail.title })).toBeVisible();
  // Full screen, with the page header and anything floating over it hidden.
  const screen = page.viewportSize();
  const frame = await dialog.boundingBox();
  expect(frame?.width).toBe(screen?.width);
  expect(frame?.height).toBe(screen?.height);
  await expect(page.locator('#page-header')).toBeHidden();
  const image = dialog.getByRole('img', { name: detail.title });
  await expect
    .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  const shown = await image.evaluate((img: HTMLImageElement) => {
    const box = img.getBoundingClientRect();
    return {
      ratio: box.width / box.height,
      file: img.naturalWidth / img.naturalHeight,
      inside: box.left >= 0 && box.top >= 0 && box.right <= innerWidth && box.bottom <= innerHeight,
    };
  });
  expect(Math.abs(shown.ratio - shown.file) / shown.file).toBeLessThan(0.01);
  expect(shown.inside).toBe(true);

  // Notes and details open in a sheet over the bottom of the image.
  await dialog.getByRole('button', { name: /^Notes and details/ }).click();
  await expect(dialog.locator('#viewer-sheet')).toBeVisible();
  await expect(dialog).toContainText('require verification before instructional use');

  const hostile = '<img src=x onerror="window.__hacked=1"> Calm and clear';
  await dialog.getByLabel('Add a note').fill(hostile);
  await dialog.getByRole('button', { name: 'Save note' }).click();
  await expect(dialog.locator('li').filter({ hasText: 'Calm and clear' })).toContainText(hostile);
  await expect(dialog.locator('li img')).toHaveCount(0);
  expect(await page.evaluate(() => (window as { __hacked?: number }).__hacked)).toBeUndefined();

  await dialog.getByRole('button', { name: 'View the source board' }).click();
  await expect(dialog.getByRole('heading', { name: board.title })).toBeVisible();
  await expect(dialog).toContainText('Reference material. Not on the board.');

  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.locator('#page-header')).toBeVisible();
  await expect(
    page.getByLabel('Your sticky notes').or(page.getByText('Your sticky notes')),
  ).toBeVisible();
  await expect(page.locator('aside')).toContainText('Calm and clear');
});

test('the viewer steps through the board with the arrow keys, a swipe and its buttons', async ({
  page,
}) => {
  await open(page);
  // The viewer steps in board order: the board opens with Captain's Console's
  // interactive variants A, B and C (src/prototypes/sections.ts). The masonry
  // grid's DOM order differs by screen width, so the ids are named here.
  const [first, second, third] = ['a', 'b', 'c'].map((v) => {
    const item = concepts.find((c) => c.id === `cl-live-console-${v}-desktop`);
    if (!item) throw new Error(`no console variant ${v}`);
    return item;
  }) as [Item, Item, Item];
  await openViewer(page, first.id);
  const heading = (title: string) =>
    viewer(page).getByRole('heading', { name: title, exact: true });
  await expect(heading(first.title)).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(heading(second.title)).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(heading(first.title)).toBeVisible();
  await expect(viewer(page).getByRole('button', { name: 'Previous screen' })).toBeDisabled();
  await viewer(page).getByRole('button', { name: 'Next screen' }).click();
  await expect(heading(second.title)).toBeVisible();

  // A sideways swipe to the left moves on; a short one is a tap, not a step.
  const stage = viewer(page).locator('.viewer-stage');
  const swipe = async (from: number, to: number) => {
    const init = { pointerType: 'touch', pointerId: 7, isPrimary: true, clientY: 200 };
    await stage.dispatchEvent('pointerdown', { ...init, clientX: from });
    await stage.dispatchEvent('pointerup', { ...init, clientX: to });
  };
  await swipe(300, 120);
  await expect(heading(third.title)).toBeVisible();
  await swipe(300, 290);
  await expect(heading(third.title)).toBeVisible();
  await swipe(100, 320);
  await expect(heading(second.title)).toBeVisible();

  // Zoom shows the image larger than the screen; the next image starts fitted.
  // A phone held sideways leaves it out of the rail to make room for the thumbs.
  const zoom = viewer(page).getByRole('button', { name: 'Zoom in' });
  if (!(await zoom.isVisible())) return;
  await zoom.click();
  await expect(zoom).toHaveAttribute('aria-pressed', 'true');
  const wider = await viewer(page)
    .locator('#viewer-image')
    .evaluate((img) => img.getBoundingClientRect().width > innerWidth);
  expect(wider).toBe(true);
  await page.keyboard.press('ArrowRight');
  await expect(heading(third.title)).toBeVisible();
  await expect(zoom).toHaveAttribute('aria-pressed', 'false');
});

test('images keep their space, show their color until they load, and the first screen loads at once', async ({
  page,
}) => {
  // Add up every layout shift the page makes while it loads and scrolls.
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: number };
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[])
        if (!e.hadRecentInput) w.__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await open(page);
  const images = page.locator('#board img');
  await expect(images).toHaveCount(tiles.length);
  for (const img of await images.all()) {
    await expect(img).toHaveAttribute('width', /^\d+$/);
    await expect(img).toHaveAttribute('height', /^\d+$/);
  }
  // Each image sits in a box painted its dominant color, never blank.
  const colors = await page
    .locator('#board .dot-image')
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
  for (const c of colors) expect(c).toMatch(/^rgb\(/);
  // The first tiles load at once; the rest wait until they are near the screen.
  const loading = await images.evaluateAll((els) =>
    els.map((el) => (el as HTMLImageElement).loading),
  );
  expect(loading.slice(0, 4)).toEqual(['eager', 'eager', 'eager', 'eager']);
  expect(loading.slice(4).every((l) => l === 'lazy')).toBe(true);

  // Scroll the whole board quickly: nothing moves.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(30);
  }
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(
    0.05,
  );
});

test('the board groups concepts by screen under headers that stick while scrolling', async ({
  page,
}) => {
  await open(page);
  const headers = page.locator('#board .section-head');
  await expect(headers).toHaveCount(9);
  await expect(page.locator('#board section > h2')).toHaveText([
    /^Home/,
    /^Forms & License Navigator/,
    /^Sea-Time Logbook/,
    /^Study & Exam Prep/,
    /^Definitions/,
    /^Lights/,
    /^Arcade & Simulations/,
    /^Night Harbor/,
    /^Docking/,
  ]);
  // The app's own screenshots sit in an as-built row at the end of their section.
  await expect(page.locator('#section-definitions .as-built-row li')).toHaveCount(4);
  await expect(page.locator('#section-docking .as-built-row li')).toHaveCount(6);
  // Jump to a section: its header stays at the top as you scroll through it.
  await page.getByRole('link', { name: /^Night Harbor/ }).click();
  await page.mouse.wheel(0, 900);
  await expect
    .poll(() =>
      page
        .locator('#section-night-harbor .section-head')
        .evaluate((h) => h.getBoundingClientRect().top),
    )
    .toBeLessThan(2);
});

test('every control on the board and in the viewer is at least 44px each way', async ({ page }) => {
  await open(page);
  await setName(page, 'Ana');
  await setStep(page, /Dot vote/);
  await dropAt(page, first.id, 0.5, 0.5);
  const small = async (scope: string) =>
    page.locator(scope).evaluateAll((els) =>
      els.flatMap((el) => {
        const box = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (style.visibility === 'hidden' || box.width === 0) return [];
        if (el.closest('.sr-only')) return [];
        return box.width < 43.5 || box.height < 43.5
          ? [`${el.outerHTML.slice(0, 80)} ${Math.round(box.width)}x${Math.round(box.height)}`]
          : [];
      }),
    );
  const controls = 'button, a[href], input, textarea, [role="combobox"], [role="tab"]';
  expect(await small(`main :is(${controls})`)).toEqual([]);
  await openViewer(page, first.id);
  await viewer(page)
    .getByRole('button', { name: /^Notes and details/ })
    .click();
  expect(await small(`[role="dialog"] :is(${controls})`)).toEqual([]);
});

test('a thumbs up or down from the viewer shows on the tile and in the heat, and closes for the call', async ({
  page,
}) => {
  await open(page);
  await setName(page, 'Ana');
  await openViewer(page, first.id);
  const up = viewer(page).getByRole('button', { name: 'Thumbs up' });
  const down = viewer(page).getByRole('button', { name: 'Thumbs down' });
  await up.click();
  await expect(up).toHaveAttribute('aria-pressed', 'true');
  // A thumbs down replaces the thumbs up; pressing it again takes it back.
  await down.click();
  await expect(up).toHaveAttribute('aria-pressed', 'false');
  await expect(down).toHaveAttribute('aria-pressed', 'true');
  await viewer(page).getByRole('button', { name: 'Next screen' }).click();
  await up.click();
  await closeViewer(page);
  await expect(tileButton(page, first.id)).toHaveAttribute('aria-label', /, 1 thumbs down$/);
  await expect(tileButton(page, second.id)).toHaveAttribute('aria-label', /, 1 thumbs up$/);
  await expect(card(page, second.id).locator('[data-thumbs="up"]')).toContainText('1');

  // Discussing, the heat lists thumbed concepts beside the dotted ones.
  await setStep(page, /Discuss/);
  await expect(page.locator(`[data-heat="${second.id}"]`)).toContainText('1 thumbs up');
  // Saved on this device.
  await page.reload();
  await expect(tileButton(page, second.id)).toHaveAttribute('aria-label', /, 1 thumbs up$/);

  // Closed for the decider's call.
  await setStep(page, /Decider's call/);
  await openViewer(page, first.id);
  await expect(viewer(page).getByRole('button', { name: 'Thumbs up' })).toHaveCount(0);
});

test('filters narrow the board to one style and one feature', async ({ page }) => {
  await open(page);
  await choose(page, '#filter-style', /^Chart house/);
  const chart = tiles.filter((i) => i.style === 'Chart house');
  await expect(page.locator('#board li[data-id]')).toHaveCount(chart.length);
  await choose(page, '#filter-feature', /^Lights/);
  await expect(page.locator('#board li[data-id]')).toHaveCount(
    chart.filter((i) => i.feature === 'Lights').length,
  );
  await expect(page.locator('#board-count')).toContainText('Showing 1 of');
});

test('export writes your dots to a file, and import refuses a file that is not a board', async ({
  page,
}) => {
  await open(page);
  await setName(page, 'Ana');
  await setStep(page, /Dot vote/);
  await dropAt(page, second.id, 0.5, 0.5);
  await page.getByRole('tab', { name: 'Share' }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export my dots and notes' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(
    /^decision-board-frontend-direction-1-ana-\d{4}-\d{2}-\d{2}\.json$/,
  );
  const file = JSON.parse(readFileSync(await download.path(), 'utf8')) as {
    kind: string;
    reviewers: { reviewer: string; dots: { itemId: string }[] }[];
  };
  expect(file.kind).toBe('captains-academy/decision-board');
  expect(file.reviewers).toEqual([
    expect.objectContaining({
      reviewer: 'Ana',
      dots: [expect.objectContaining({ itemId: second.id })],
    }),
  ]);

  await importFile(page, 'notes.json', '{"hello":1}');
  await expect(page.locator('#share-status')).toHaveText(
    "This is not a Captain's Academy decision board file.",
  );
});

test('with storage blocked, the page says the board is not saved', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    });
  });
  const errors = await open(page);
  await expect(page.locator('#saved-where')).toHaveText('Not saved: storage is blocked');
  expect(errors).toEqual([]);
});

test('reference keeps the boards, the playable example and the missing styles off the board', async ({
  page,
}) => {
  await open(page);
  await page.getByRole('tab', { name: 'Reference' }).click();
  for (const board of inventory.items.filter((i) => i.style === 'Comparison board')) {
    await expect(page.locator(`#reference [data-id="${board.id}"]`)).toBeVisible();
    await expect(page.locator(`#board [data-id="${board.id}"]`)).toHaveCount(0);
  }
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

test('the offline cache never stores the board or its images', async ({ page }) => {
  // Opening the sea-time log installs the site's service worker.
  await page.goto('/log/');
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);
  await open(page);
  await openViewer(page, first.id);
  await expect
    .poll(() =>
      page
        .getByRole('dialog')
        .getByRole('img')
        .first()
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  const cached = await page.evaluate(async () => {
    const cache = await caches.open('captains-academy-offline-v1');
    return (await cache.keys()).map((r) => new URL(r.url).pathname);
  });
  const urls = await page.evaluate(() => window.__prototypeGallery);
  const files = [
    ...Object.values(urls?.images ?? {}),
    ...Object.values(urls?.thumbnails ?? {}),
  ].map((u) => new URL(u, page.url()).pathname);
  expect(cached.filter((path) => path.startsWith('/prototypes/'))).toEqual([]);
  expect(cached.filter((path) => files.includes(path))).toEqual([]);
  expect(cached).toContain('/log/');
});

test('the board and the viewer pass axe with no violations', async ({ page }) => {
  await open(page);
  const scan = async (label: string) => {
    // The notes sheet fades in; mid-fade, axe measures contrast against a
    // half-transparent sheet. Scan the settled page.
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))),
    );
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, label).toEqual([]);
  };
  await setName(page, 'Ana');
  await setStep(page, /Dot vote/);
  await dropAt(page, first.id, 0.5, 0.5);
  await scan('board while voting');
  await openViewer(page, first.id);
  await scan('viewer');
  await viewer(page)
    .getByRole('button', { name: /^Notes and details/ })
    .click();
  await scan('viewer with notes open');
});
