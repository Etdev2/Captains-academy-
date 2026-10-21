import { expect, test, type Page } from '@playwright/test';

// The sea-time log at /log (DECISIONS.md A3): the app shell and the store on
// the device, against the production build in a real browser.

const DB = 'captains-academy-sea-log';

const entries = (page: Page) => page.locator('#entries');

// After one online visit, the service worker controls the page and the cache
// holds the page and its files.
async function waitForOfflineCopy(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const cache = await caches.open('captains-academy-offline-v1');
        return navigator.serviceWorker.controller !== null && (await cache.keys()).length >= 2;
      }),
    )
    .toBe(true);
}

// Entries need a saved vessel, and backfilled days need the user's consent
// (issue #40). Returns where the test's entries are served.
async function prepareAboard(page: Page) {
  const vesselId = await page.evaluate(async () => {
    const log = window.__seaTimeLog;
    if (!log) throw new Error('the store did not open');
    await log.giveBackfillConsent();
    const vessel = await log.vessels.save({
      id: crypto.randomUUID(),
      name: 'Sea Breeze',
      officialNumber: null,
      officialGrossTons: null,
      lengthFeet: null,
      propulsion: null,
      owner: null,
      horsepower: null,
      photo: null,
      defaultRoleId: null,
    });
    return vessel.id;
  });
  return { vesselId, roleId: 'deck.mate', waters: 'near-coastal', watersSuggestion: null } as const;
}

async function openLog(page: Page): Promise<void> {
  await page.goto('/log/');
  await expect(page.getByRole('heading', { name: 'Sea-time log' })).toBeVisible();
  await expect(entries(page)).toHaveAttribute('data-state', 'ready');
}

test('the log opens with no account and talks to no other server', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const origins = new Set<string>();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'http:' || url.protocol === 'https:') origins.add(url.origin);
  });

  await openLog(page);
  await expect(entries(page)).toHaveText('No sea time logged yet.');
  await expect(page.getByRole('button', { name: 'Check in' })).toBeVisible();
  await expect(page.locator('#network')).toHaveText('Online');

  expect(errors).toEqual([]);
  expect([...origins]).toEqual([new URL(page.url()).origin]);
  expect(await page.locator('body').innerText()).not.toMatch(/qualif/i);
});

test('the check-in button is big and sits where a thumb reaches', async ({ page }, testInfo) => {
  await openLog(page);
  const box = await page.getByRole('button', { name: 'Check in' }).boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) throw new Error('no button or viewport');
  expect(box.height).toBeGreaterThanOrEqual(64);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
  if (testInfo.project.name === 'phone-portrait') {
    // Upright with one hand, the thumb reaches the lower half of the screen.
    expect(box.y).toBeGreaterThan(viewport.height / 2);
    expect(box.width).toBeGreaterThan(viewport.width * 0.8);
  }
});

test('the log opens offline after one online visit', async ({ page, context }) => {
  await openLog(page);
  await waitForOfflineCopy(page);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sea-time log' })).toBeVisible();
  await expect(page.locator('#network')).toHaveAttribute('data-state', 'offline');
  await expect(entries(page)).toHaveAttribute('data-state', 'ready');
});

test('a saved entry survives a reload, online and offline', async ({ page, context }) => {
  await openLog(page);
  await waitForOfflineCopy(page);

  const aboard = await prepareAboard(page);
  const saved = await page.evaluate(async (aboard) => {
    const log = window.__seaTimeLog;
    if (!log) throw new Error('the store did not open');
    return log.save({
      id: crypto.randomUUID(),
      source: 'backfilled',
      day: '2026-06-14',
      hoursBand: '8-12',
      ...aboard,
    });
  }, aboard);
  expect(saved.deletedAt).toBeNull();

  await page.reload();
  await expect(entries(page)).toHaveText('1 entry saved on this phone.');

  await context.setOffline(true);
  await page.reload();
  await expect(entries(page)).toHaveText('1 entry saved on this phone.');
  expect(await page.evaluate((id) => window.__seaTimeLog?.get(id), saved.id)).toEqual(saved);
});

test('the store refuses bad entries, soft-deletes and leaves the outbox empty', async ({
  page,
}) => {
  await openLog(page);
  const aboard = await prepareAboard(page);
  const result = await page.evaluate(async (aboard) => {
    const log = window.__seaTimeLog;
    if (!log) throw new Error('the store did not open');
    const trip = await log.save({
      id: crypto.randomUUID(),
      source: 'live',
      startedAt: '2026-10-21T06:00:00.000Z',
      endedAt: null,
      ...aboard,
    });
    const day = await log.save({
      id: crypto.randomUUID(),
      source: 'backfilled',
      day: '2026-06-14',
      hoursBand: '4-8',
      ...aboard,
    });

    // A backfilled day marked verified is refused, and nothing is written.
    let refused = false;
    try {
      await log.save({ ...day, verified: true } as unknown as Parameters<typeof log.save>[0]);
    } catch {
      refused = true;
    }

    // Saving live time under the backfilled day's id is refused too, so a
    // backfilled day can never turn into live time.
    let sourceChangeRefused = '';
    try {
      await log.save({
        id: day.id,
        source: 'live',
        startedAt: '2026-06-14T06:00:00.000Z',
        endedAt: '2026-06-14T14:00:00.000Z',
        ...aboard,
      });
    } catch (error) {
      sourceChangeRefused = error instanceof Error ? error.name : String(error);
    }
    const dayAfter = await log.get(day.id);

    const deleted = await log.softDelete(trip.id);
    const deletedAgain = await log.softDelete(trip.id);
    const tripAfter = await log.get(trip.id);

    // A stale save, say from another tab, never brings a deleted entry back.
    let resurrectRefused = '';
    try {
      await log.save({
        id: trip.id,
        source: 'live',
        startedAt: '2026-10-21T06:00:00.000Z',
        endedAt: '2026-10-21T12:00:00.000Z',
        ...aboard,
      });
    } catch (error) {
      resurrectRefused = error instanceof Error ? error.name : String(error);
    }
    const tripAfterStaleSave = await log.get(trip.id);
    return {
      refused,
      sourceChangeRefused,
      dayUnchanged: JSON.stringify(dayAfter) === JSON.stringify(day),
      deleted,
      deletedAgain,
      tripDeletedAt: tripAfter?.deletedAt ?? null,
      resurrectRefused,
      tombstoneKept: JSON.stringify(tripAfterStaleSave) === JSON.stringify(tripAfter),
      listed: (await log.list()).map((entry) => entry.id),
      dayId: day.id,
      count: await log.count(),
      outbox: await log.outboxSize(),
    };
  }, aboard);

  expect(result.refused).toBe(true);
  expect(result.sourceChangeRefused).toBe('SourceChangeError');
  expect(result.dayUnchanged).toBe(true);
  expect(result.deleted).toBe(true);
  expect(result.deletedAgain).toBe(false);
  expect(result.tripDeletedAt).not.toBeNull();
  expect(result.resurrectRefused).toBe('DeletedEntryError');
  expect(result.tombstoneKept).toBe(true);
  expect(result.listed).toEqual([result.dayId]);
  expect(result.count).toBe(1);
  expect(result.outbox).toBe(0);

  await page.reload();
  await expect(entries(page)).toHaveText('1 entry saved on this phone.');
});

test('version 3 of the database keeps the entries and outbox stores as version 1 made them', async ({
  page,
}) => {
  await openLog(page);
  const shape = await page.evaluate(
    (name) =>
      new Promise<{
        version: number;
        stores: string[];
        entriesKey: string | string[] | null;
        indexes: string[];
        outboxKey: string | string[] | null;
        outboxAutoIncrement: boolean;
      }>((resolve, reject) => {
        const request = indexedDB.open(name);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction(['sea_time_entries', 'outbox']);
          const entriesStore = tx.objectStore('sea_time_entries');
          const outbox = tx.objectStore('outbox');
          resolve({
            version: db.version,
            stores: [...db.objectStoreNames],
            entriesKey: entriesStore.keyPath,
            indexes: [...entriesStore.indexNames],
            outboxKey: outbox.keyPath,
            outboxAutoIncrement: outbox.autoIncrement,
          });
          db.close();
        };
      }),
    DB,
  );
  expect(shape).toEqual({
    version: 3,
    stores: ['outbox', 'preferences', 'roles', 'sea_time_entries', 'vessels'],
    entriesKey: 'id',
    indexes: ['updatedAt'],
    outboxKey: 'seq',
    outboxAutoIncrement: true,
  });
});

test('a newer database from another tab is never opened by older code', async ({ page }) => {
  await openLog(page);
  // Newer code in another tab upgrades the database. This tab lets it, and says so.
  await page.evaluate(
    (name) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(name, 5);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          request.result.close();
          resolve();
        };
      }),
    DB,
  );
  await expect(entries(page)).toHaveAttribute('data-state', 'replaced');

  // This tab's code knows only version 3, so it refuses version 5 instead of guessing.
  await page.reload();
  await expect(entries(page)).toHaveAttribute('data-state', 'newer');
});

test('a new cache name keeps what the old cache held, so earlier offline pages still open', async ({
  page,
}) => {
  // Before any page registers the service worker, leave an offline copy under
  // the game's old cache name, as a visitor from before the sea-time log has.
  await page.goto('/sw.js');
  await page.evaluate(async () => {
    const old = await caches.open('captains-academy-play-v1');
    await old.put('/play/old-offline-copy', new Response('kept'));
  });

  // The first visit after the change is to the log, not the game.
  await openLog(page);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const names = await caches.keys();
        const kept = await (
          await caches.open('captains-academy-offline-v1')
        ).match('/play/old-offline-copy');
        return { names, kept: kept ? await kept.text() : null };
      }),
    )
    .toEqual({ names: ['captains-academy-offline-v1'], kept: 'kept' });
});
