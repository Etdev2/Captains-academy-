import { expect, test, type Page } from '@playwright/test';

// Vessels and roles in the sea-time log at /log (DECISIONS.md A3), against the
// production build in a real browser: the screens, the store on the device
// and the version 1 to 2 migration.

const DB = 'captains-academy-sea-log';

// A 4×3 PNG, small enough to inline.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAAEElEQVR4nGMQsamAIwacHACyRwlhJifK0QAAAABJRU5ErkJggg==',
  'base64',
);

async function openLog(page: Page, hash = ''): Promise<void> {
  await page.goto(`/log/${hash}`);
  await expect(page.locator('#entries')).toHaveAttribute('data-state', 'ready');
}

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

const vesselRows = (page: Page) => page.locator('#vessel-list a.row');

async function addVessel(page: Page, name: string): Promise<void> {
  await page.getByRole('link', { name: 'Add a vessel' }).click();
  await expect(page.getByRole('heading', { name: 'New vessel' })).toBeVisible();
  await page.getByLabel('Name').fill(name);
  await page.getByRole('button', { name: 'Save vessel' }).click();
  await expect(page.locator('#vessels-status')).toHaveText(`Saved ${name}.`);
}

test('a vessel is added, filled in later, and survives reloads online and offline', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const origins = new Set<string>();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'http:' || url.protocol === 'https:') origins.add(url.origin);
  });

  await openLog(page);
  await waitForOfflineCopy(page);
  await page.getByRole('link', { name: 'Vessels' }).click();
  await expect(page.getByRole('heading', { name: 'Vessels' })).toBeVisible();
  await expect(page.locator('#vessels-empty')).toBeVisible();

  // Only a name is needed at first.
  await addVessel(page, 'Sea Breeze');
  await expect(vesselRows(page)).toHaveCount(1);
  await expect(vesselRows(page).first()).toContainText('Sea Breeze');
  await expect(vesselRows(page).first()).toContainText('Still to add: official number, tonnage');

  // The rest is filled in later, from the list.
  await vesselRows(page).first().click();
  await expect(page.getByRole('heading', { name: 'Edit Sea Breeze' })).toBeVisible();
  await page.getByLabel('Official number').fill('1234567');
  await page.getByLabel('Official gross tonnage (GRT)').fill('24');
  await page.getByLabel('Length in feet').fill('42.5');
  await page.getByLabel('Propulsion').selectOption('motor');
  await page.getByLabel('Owner').fill('Harbor Charters LLC');
  await page.getByLabel('Horsepower').fill('450');
  await page.getByLabel('Your usual role aboard').selectOption('deck.mate');
  await page
    .getByLabel('Photo')
    .setInputFiles({ name: 'boat.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.locator('#vessel-photo-preview')).toBeVisible();
  await page.getByRole('button', { name: 'Save vessel' }).click();
  await expect(vesselRows(page).first()).toContainText('1234567 · 24 GRT · 42.5 ft');

  const stored = async () =>
    page.evaluate(async () => {
      const log = window.__seaTimeLog;
      if (!log) throw new Error('the store did not open');
      const [vessel] = await log.vessels.list();
      if (!vessel) return null;
      const { photo, ...rest } = vessel;
      return { ...rest, photoType: photo?.type ?? null, photoBytes: photo?.size ?? 0 };
    });
  const saved = await stored();
  expect(saved).toMatchObject({
    name: 'Sea Breeze',
    officialNumber: '1234567',
    officialGrossTons: 24,
    lengthFeet: 42.5,
    propulsion: 'motor',
    owner: 'Harbor Charters LLC',
    horsepower: 450,
    defaultRoleId: 'deck.mate',
    deletedAt: null,
    photoType: 'image/jpeg',
  });
  expect(saved?.photoBytes).toBeGreaterThan(0);

  await page.reload();
  await expect(vesselRows(page)).toHaveCount(1);
  expect(await stored()).toEqual(saved);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#network')).toHaveAttribute('data-state', 'offline');
  await expect(vesselRows(page)).toHaveCount(1);
  expect(await stored()).toEqual(saved);

  // Offline, the vessel still opens with every detail and its photo.
  await vesselRows(page).first().click();
  await expect(page.getByLabel('Official gross tonnage (GRT)')).toHaveValue('24');
  await expect(page.getByLabel('Your usual role aboard')).toHaveValue('deck.mate');
  await expect(page.locator('#vessel-photo-preview')).toBeVisible();

  // And an edit offline sticks too.
  await page.getByLabel('Owner').fill('Pacific Charters');
  await page.getByRole('button', { name: 'Save vessel' }).click();
  await expect(page.locator('#vessels-status')).toHaveText('Saved Sea Breeze.');
  await page.reload();
  await expect(vesselRows(page)).toHaveCount(1);
  expect(await stored()).toMatchObject({ owner: 'Pacific Charters' });

  expect(errors).toEqual([]);
  expect([...origins]).toEqual([new URL(page.url()).origin]);
});

test('a vessel is soft-deleted with two taps and stays gone after a reload', async ({ page }) => {
  await openLog(page, '#vessels');
  await addVessel(page, 'Old Salt');
  await addVessel(page, 'Kestrel');
  await expect(vesselRows(page)).toHaveText([/Kestrel/, /Old Salt/]);

  await vesselRows(page).filter({ hasText: 'Old Salt' }).click();
  const remove = page.locator('#delete-vessel');
  await remove.click();
  // One tap only arms it.
  await expect(remove).toHaveText('Tap again to delete');
  await expect(page.getByRole('heading', { name: 'Edit Old Salt' })).toBeVisible();
  await remove.click();
  await expect(page.locator('#vessels-status')).toHaveText('Deleted Old Salt.');
  await expect(vesselRows(page)).toHaveText([/Kestrel/]);

  await page.reload();
  await expect(vesselRows(page)).toHaveText([/Kestrel/]);

  // The record stays on the device, marked deleted, so the delete can reach
  // other devices once sync exists. A stale save can't bring it back.
  const result = await page.evaluate(async () => {
    const log = window.__seaTimeLog;
    if (!log) throw new Error('the store did not open');
    const all = await new Promise<{ name: string; deletedAt: string | null }[]>(
      (resolve, reject) => {
        const request = indexedDB.open('captains-academy-sea-log');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const get = db.transaction('vessels').objectStore('vessels').getAll();
          get.onsuccess = () => {
            resolve(get.result);
            db.close();
          };
        };
      },
    );
    const gone = all.find((v) => v.name === 'Old Salt') as unknown as { id: string };
    let resurrect = '';
    try {
      const old = await log.vessels.get(gone.id);
      if (!old) throw new Error('missing');
      await log.vessels.save(old);
    } catch (error) {
      resurrect = error instanceof Error ? error.name : String(error);
    }
    return {
      names: all.map((v) => [v.name, v.deletedAt !== null]).sort(),
      resurrect,
      deletedAgain: await log.vessels.softDelete(gone.id),
    };
  });
  expect(result).toEqual({
    names: [
      ['Kestrel', false],
      ['Old Salt', true],
    ],
    resurrect: 'DeletedEntryError',
    deletedAgain: false,
  });
});

test('a photo still being prepared is never saved late, or onto another vessel', async ({
  page,
}) => {
  // Shrinking a photo can take a while on a phone. Hold it until the test lets go.
  await page.addInitScript(() => {
    const original = window.createImageBitmap.bind(window);
    const held: (() => void)[] = [];
    (window as unknown as { releasePhotos: () => void }).releasePhotos = () =>
      held.splice(0).forEach((go) => go());
    window.createImageBitmap = ((...args: Parameters<typeof createImageBitmap>) =>
      new Promise<void>((go) => held.push(go)).then(() =>
        original(...args),
      )) as typeof createImageBitmap;
  });
  const release = () =>
    page.evaluate(() => (window as unknown as { releasePhotos: () => void }).releasePhotos());
  const photoOf = (name: string) =>
    page.evaluate(async (wanted) => {
      const vessels = (await window.__seaTimeLog?.vessels.list()) ?? [];
      return vessels.find((v) => v.name === wanted)?.photo?.size ?? null;
    }, name);
  const save = page.getByRole('button', { name: 'Save vessel' });

  await openLog(page, '#vessels');
  await addVessel(page, 'Kestrel');
  await addVessel(page, 'Old Salt');

  // While the photo is being prepared, the vessel can't be saved without it.
  await vesselRows(page).filter({ hasText: 'Kestrel' }).click();
  await expect(page.getByRole('heading', { name: 'Edit Kestrel' })).toBeVisible();
  await page
    .getByLabel('Photo')
    .setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: PNG });
  await expect(save).toBeDisabled();
  await expect(page.locator('#photo-status')).toHaveText('Preparing the photo…');
  await release();
  await expect(save).toBeEnabled();
  await expect(page.locator('#vessel-photo-preview')).toBeVisible();
  await save.click();
  await expect(page.locator('#vessels-status')).toHaveText('Saved Kestrel.');
  expect(await photoOf('Kestrel')).toBeGreaterThan(0);

  // A photo picked for one vessel and finished after moving to another is dropped.
  await vesselRows(page).filter({ hasText: 'Old Salt' }).click();
  await expect(page.getByRole('heading', { name: 'Edit Old Salt' })).toBeVisible();
  await page
    .getByLabel('Photo')
    .setInputFiles({ name: 'b.png', mimeType: 'image/png', buffer: PNG });
  await expect(save).toBeDisabled();
  await page.getByRole('link', { name: 'Cancel' }).click();
  await vesselRows(page).filter({ hasText: 'Kestrel' }).click();
  await expect(page.getByRole('heading', { name: 'Edit Kestrel' })).toBeVisible();
  await page
    .getByLabel('Photo')
    .setInputFiles({ name: 'c.png', mimeType: 'image/png', buffer: PNG });
  await page.getByRole('link', { name: 'Cancel' }).click();
  await vesselRows(page).filter({ hasText: 'Old Salt' }).click();
  await expect(page.getByRole('heading', { name: 'Edit Old Salt' })).toBeVisible();
  await release();
  await expect(save).toBeEnabled();
  await expect(page.locator('#vessel-photo-preview')).toBeHidden();
  await save.click();
  await expect(page.locator('#vessels-status')).toHaveText('Saved Old Salt.');
  expect(await photoOf('Old Salt')).toBeNull();

  // Removing the photo while a new one is being prepared drops both.
  await vesselRows(page).filter({ hasText: 'Kestrel' }).click();
  await expect(page.getByRole('heading', { name: 'Edit Kestrel' })).toBeVisible();
  await page
    .getByLabel('Photo')
    .setInputFiles({ name: 'd.png', mimeType: 'image/png', buffer: PNG });
  await expect(save).toBeDisabled();
  await page.getByRole('button', { name: 'Remove photo' }).click();
  await expect(save).toBeEnabled();
  await release();
  await expect(page.locator('#vessel-photo-preview')).toBeHidden();
  await save.click();
  await expect(page.locator('#vessels-status')).toHaveText('Saved Kestrel.');
  expect(await photoOf('Kestrel')).toBeNull();
});

test('two quick taps on Save add a new vessel once', async ({ page }) => {
  await openLog(page, '#vessels/new');
  await expect(page.getByRole('heading', { name: 'New vessel' })).toBeVisible();
  await page.getByLabel('Name').fill('Kestrel');
  // Both taps land before the first save reaches the store.
  await page.locator('#vessel-form').evaluate((form) => {
    const submit = () => (form as HTMLFormElement).requestSubmit();
    submit();
    submit();
  });
  await expect(page.locator('#vessels-status')).toHaveText('Saved Kestrel.');
  await page.reload();
  await expect(vesselRows(page)).toHaveText([/Kestrel/]);
  expect(await page.evaluate(async () => (await window.__seaTimeLog?.vessels.list())?.length)).toBe(
    1,
  );

  // The next new vessel can be saved: the guard is lifted for the next form.
  await addVessel(page, 'Old Salt');
  await expect(vesselRows(page)).toHaveText([/Kestrel/, /Old Salt/]);
});

test('the form says what to fix and saves nothing until it is right', async ({ page }) => {
  await openLog(page, '#vessels/new');
  await page.getByRole('button', { name: 'Save vessel' }).click();
  await expect(page.getByRole('alert')).toHaveText('Give the vessel a name.');

  await page.getByLabel('Name').fill('Kestrel');
  await page.getByLabel('Official gross tonnage (GRT)').fill('about 20');
  await page.getByRole('button', { name: 'Save vessel' }).click();
  await expect(page.getByRole('alert')).toHaveText('Tonnage must be a number above 0, or blank.');
  expect(await page.evaluate(() => window.__seaTimeLog?.vessels.list())).toEqual([]);

  await page.getByLabel('Official gross tonnage (GRT)').fill('');
  await page.getByRole('button', { name: 'Save vessel' }).click();
  await expect(vesselRows(page)).toHaveText([/Kestrel/]);
});

test('only official tonnage can be entered, with no estimate anywhere', async ({ page }) => {
  await openLog(page, '#vessels/new');
  const names = await page
    .locator('#vessel-form')
    .evaluate((form) =>
      [...(form as HTMLFormElement).elements]
        .map((el) => el.getAttribute('name'))
        .filter((name): name is string => name !== null),
    );
  expect(names).toEqual([
    'name',
    'officialNumber',
    'officialGrossTons',
    'lengthFeet',
    'propulsion',
    'owner',
    'horsepower',
    'defaultRoleId',
    'photo',
  ]);
  expect(names.filter((name) => /ton/i.test(name))).toEqual(['officialGrossTons']);
  const html = await page.content();
  expect(html).not.toMatch(/estimat/i);
  expect(html).not.toMatch(/qualif/i);
});

test('roles are a seeded deck and engine list, and a vessel keeps a default role', async ({
  page,
}) => {
  await openLog(page);
  await page.getByRole('link', { name: 'Roles' }).click();
  await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible();
  const deck = page.locator('#roles-deck li');
  const engine = page.locator('#roles-engine li');
  await expect(deck).toHaveCount(8);
  await expect(engine).toHaveCount(7);
  await expect(deck.first()).toHaveText('Master or captain');
  await expect(deck.first()).toHaveAttribute('data-role-id', 'deck.master');
  await expect(engine.first()).toHaveText('Chief engineer');
  expect(await page.locator('body').innerText()).not.toMatch(/qualif|estimat/i);

  const roles = await page.evaluate(() => window.__seaTimeLog?.roles.list());
  expect(roles?.length).toBe(15);
  for (const role of roles ?? []) {
    expect(Object.keys(role).sort()).toEqual(['category', 'id', 'label', 'position']);
  }

  // The default role is optional, and only a role on the list is accepted.
  const result = await page.evaluate(async () => {
    const log = window.__seaTimeLog;
    if (!log) throw new Error('the store did not open');
    const base = {
      name: 'Tug',
      officialNumber: null,
      officialGrossTons: null,
      lengthFeet: null,
      propulsion: null,
      owner: null,
      horsepower: null,
      photo: null,
    };
    const none = await log.vessels.save({ ...base, id: crypto.randomUUID(), defaultRoleId: null });
    const oiler = await log.vessels.save({
      ...base,
      id: crypto.randomUUID(),
      defaultRoleId: 'engine.oiler',
    });
    const id = crypto.randomUUID();
    let unknown = '';
    try {
      await log.vessels.save({ ...base, id, defaultRoleId: 'deck.admiral' });
    } catch (error) {
      unknown = error instanceof Error ? error.name : String(error);
    }
    return {
      none: none.defaultRoleId,
      oiler: (await log.vessels.get(oiler.id))?.defaultRoleId,
      unknown,
      unknownSaved: (await log.vessels.get(id)) !== undefined,
    };
  });
  expect(result).toEqual({
    none: null,
    oiler: 'engine.oiler',
    unknown: 'UnknownRoleError',
    unknownSaved: false,
  });
});

test('version 1 upgrades to the current version and keeps its entries', async ({ page }) => {
  // A device that ran only PR 1's code: version 1 with one saved entry.
  await page.goto('/sw.js');
  const entry = {
    id: '9a2b7c4d-1e3f-4a5b-8c6d-7e8f9a0b1c2d',
    source: 'backfilled',
    day: '2026-06-14',
    hoursBand: '8-12',
    updatedAt: '2026-10-21T15:00:00.000Z',
    deletedAt: null,
  };
  await page.evaluate(
    ([name, saved]) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(name, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          const entries = db.createObjectStore('sea_time_entries', { keyPath: 'id' });
          entries.createIndex('updatedAt', 'updatedAt');
          db.createObjectStore('outbox', { keyPath: 'seq', autoIncrement: true });
          entries.put(saved);
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          request.result.close();
          resolve();
        };
      }),
    [DB, entry] as const,
  );

  await openLog(page);
  await expect(page.locator('#entries')).toHaveText('1 entry saved on this phone.');
  const after = await page.evaluate(
    (name) =>
      new Promise<{ version: number; stores: string[]; roles: number; vesselIndexes: string[] }>(
        (resolve, reject) => {
          const request = indexedDB.open(name);
          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction(['roles', 'vessels']);
            const count = tx.objectStore('roles').count();
            const vesselIndexes = [...tx.objectStore('vessels').indexNames];
            tx.oncomplete = () => {
              resolve({
                version: db.version,
                stores: [...db.objectStoreNames],
                roles: count.result,
                vesselIndexes,
              });
              db.close();
            };
          };
        },
      ),
    DB,
  );
  expect(after).toEqual({
    version: 3,
    stores: ['outbox', 'preferences', 'roles', 'sea_time_entries', 'vessels'],
    roles: 15,
    vesselIndexes: ['updatedAt'],
  });
  // Version 3 adds the fields entries gained since, as null (not recorded).
  expect(await page.evaluate((id) => window.__seaTimeLog?.get(id), entry.id)).toEqual({
    ...entry,
    vesselId: null,
    roleId: null,
    waters: null,
    watersSuggestion: null,
    consentedAt: null,
  });
  expect(await page.evaluate(() => window.__seaTimeLog?.outboxSize())).toBe(0);
});

test('vessel screens fit one thumb: big controls, save within reach', async ({
  page,
}, testInfo) => {
  await openLog(page);
  for (const name of ['Vessels', 'Roles']) {
    const box = await page.getByRole('link', { name, exact: true }).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(56);
  }

  // Each screen renders after a read from the store, so wait for it before measuring.
  await page.getByRole('link', { name: 'Vessels' }).click();
  await expect(page.getByRole('heading', { name: 'Vessels' })).toBeVisible();
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('no viewport');
  const add = await page.getByRole('link', { name: 'Add a vessel' }).boundingBox();
  if (!add) throw new Error('no add button');
  expect(add.height).toBeGreaterThanOrEqual(56);
  expect(add.y + add.height).toBeLessThanOrEqual(viewport.height);

  await page.getByRole('link', { name: 'Add a vessel' }).click();
  await expect(page.getByRole('heading', { name: 'New vessel' })).toBeVisible();
  for (const control of await page.locator('#vessel-form input, #vessel-form select').all()) {
    const box = await control.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(56);
  }
  // The save button stays at the bottom of the screen while the form scrolls.
  const save = await page.getByRole('button', { name: 'Save vessel' }).boundingBox();
  if (!save) throw new Error('no save button');
  expect(save.height).toBeGreaterThanOrEqual(56);
  expect(save.y + save.height).toBeLessThanOrEqual(viewport.height);
  if (testInfo.project.name === 'phone-portrait') {
    expect(save.y).toBeGreaterThan(viewport.height / 2);
    expect(save.width).toBeGreaterThan(viewport.width * 0.8);
    await page.screenshot({ path: testInfo.outputPath('vessel-form-phone.png') });
  }
  // Nothing scrolls sideways on a phone.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    viewport.width,
  );
});
