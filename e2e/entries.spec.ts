import { expect, test, type Page, type TestInfo } from '@playwright/test';

// Live and backfilled entries in the sea-time log (issue #40), against the
// production build in a real browser: checking in and out, backfilling with
// consent, the log list with its under-4 flag and day notes, editing, and the
// version 3 migration. The store runs against Chromium's real IndexedDB.

const DB = 'captains-academy-sea-log';
const FLAG = 'Not eligible: under 4 hours';
const SHORT_DAY_NOTE =
  'May count as a day only on vessels under 100 GRT if the Coast Guard accepts the schedule (46 CFR 10.232(h)(3)).';
const TWO_WATCH_NOTE =
  "On vessels authorized for two watches, a 12-hour day may be credited as 1½ days at the Coast Guard's discretion (46 CFR 10.232(h)(2)). Not guaranteed.";

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

/** Saves a vessel through the store and returns its id. */
async function addVessel(page: Page, name: string, defaultRoleId: string | null = 'deck.mate') {
  return page.evaluate(
    async ([name, defaultRoleId]) => {
      const log = window.__seaTimeLog;
      if (!log) throw new Error('the store did not open');
      const vessel = await log.vessels.save({
        id: crypto.randomUUID(),
        name,
        officialNumber: null,
        officialGrossTons: null,
        lengthFeet: null,
        propulsion: null,
        owner: null,
        horsepower: null,
        photo: null,
        defaultRoleId,
      });
      return vessel.id;
    },
    [name, defaultRoleId] as const,
  );
}

/** A phone screenshot for the proof bundle. */
async function shot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  if (testInfo.project.name === 'phone-portrait') {
    await page.screenshot({ path: testInfo.outputPath(name) });
  }
}

const home = {
  button: (page: Page) => page.locator('#check-in'),
  trip: (page: Page) => page.locator('#trip-status'),
  status: (page: Page) => page.locator('#home-status'),
};
const sheet = (page: Page) => page.locator('#view-check-in');
const backfill = (page: Page) => page.locator('#view-backfill');
const rows = (page: Page) => page.locator('#entry-list a.row');

test('check in and out from the home screen, kept across reloads online and offline', async ({
  page,
  context,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const origins = new Set<string>();
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol === 'http:' || url.protocol === 'https:') origins.add(url.origin);
  });

  await openLog(page);
  await waitForOfflineCopy(page);
  await addVessel(page, 'Sea Breeze');
  await page.reload();
  await expect(home.button(page)).toHaveText('Check in');
  await expect(home.trip(page)).toHaveText('Not checked in.');

  await home.button(page).click();
  await expect(sheet(page).getByRole('heading', { name: 'Check in' })).toBeVisible();
  // The only vessel and its usual role are already picked.
  await expect(sheet(page).getByLabel('Vessel')).toHaveValue(/.+/);
  await expect(sheet(page).getByLabel('Your role aboard')).toHaveValue('deck.mate');
  await sheet(page).getByLabel('Waters').selectOption('near-coastal');
  await sheet(page).getByRole('button', { name: 'Start the trip' }).click();

  await expect(home.status(page)).toHaveText('Checked in on Sea Breeze.');
  await expect(home.button(page)).toHaveText('Check out');
  await expect(home.trip(page)).toHaveAttribute('data-state', 'open');
  await expect(home.trip(page)).toContainText('Underway on Sea Breeze for 0:00:');
  await shot(page, testInfo, 'check-in.png');

  // The open trip survives a reload, and an offline one.
  await page.reload();
  await expect(home.button(page)).toHaveText('Check out');
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#network')).toHaveAttribute('data-state', 'offline');
  await expect(home.button(page)).toHaveText('Check out');
  await expect(home.trip(page)).toContainText('Underway on Sea Breeze');
  await shot(page, testInfo, 'offline-reload.png');

  // Checking out works offline too, and a trip that short is flagged.
  await home.button(page).click();
  await expect(home.status(page)).toHaveText(`Checked out after 0 h 00 min. ${FLAG}.`);
  await expect(home.button(page)).toHaveText('Check in');
  await expect(home.trip(page)).toHaveText('Not checked in.');
  await shot(page, testInfo, 'check-out.png');

  await page.reload();
  await expect(page.locator('#entries')).toHaveText('1 entry saved on this phone.');
  const stored = await page.evaluate(async () => (await window.__seaTimeLog?.list()) ?? []);
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({
    source: 'live',
    roleId: 'deck.mate',
    waters: 'near-coastal',
    watersSuggestion: null,
    deletedAt: null,
  });
  expect(stored[0]?.source === 'live' && stored[0].endedAt).not.toBeNull();

  expect(errors).toEqual([]);
  expect([...origins]).toEqual([new URL(page.url()).origin]);
});

test('a second open trip on this device is refused', async ({ page }) => {
  await openLog(page);
  const vesselId = await addVessel(page, 'Sea Breeze');
  const result = await page.evaluate(async (vesselId) => {
    const log = window.__seaTimeLog;
    if (!log) throw new Error('the store did not open');
    const aboard = { vesselId, roleId: 'deck.mate', waters: 'inland' } as const;
    const first = await log.checkIn(aboard);
    const refusals: string[] = [];
    for (const attempt of [
      () => log.checkIn(aboard),
      () =>
        log.save({
          id: crypto.randomUUID(),
          source: 'live',
          startedAt: '2026-10-21T06:00:00.000Z',
          endedAt: null,
          ...aboard,
          watersSuggestion: null,
        }),
    ]) {
      try {
        await attempt();
        refusals.push('saved');
      } catch (error) {
        refusals.push(error instanceof Error ? error.name : String(error));
      }
    }
    const open = await log.openTrip();
    return { refusals, openId: open?.id, firstId: first.id, count: await log.count() };
  }, vesselId);
  expect(result.refusals).toEqual(['OpenTripError', 'OpenTripError']);
  expect(result.openId).toBe(result.firstId);
  expect(result.count).toBe(1);

  // The check-in sheet sends the user back to check out first.
  await page.reload();
  await page.goto('/log/#check-in');
  await expect(home.status(page)).toHaveText('A trip is already open. Check out of it first.');
  await expect(home.button(page)).toHaveText('Check out');

  // Once checked out, a new trip can start.
  await home.button(page).click();
  await expect(home.button(page)).toHaveText('Check in');
  const again = await page.evaluate(
    (vesselId) => window.__seaTimeLog?.checkIn({ vesselId, roleId: 'deck.mate', waters: 'inland' }),
    vesselId,
  );
  expect(again?.source).toBe('live');
});

test('a repeat check-in is one tap: the sheet remembers the last choices', async ({ page }) => {
  await openLog(page);
  await addVessel(page, 'Sea Breeze');
  await addVessel(page, 'Kestrel', null);
  await page.reload();

  await home.button(page).click();
  await sheet(page).getByLabel('Vessel').selectOption({ label: 'Kestrel' });
  await sheet(page).getByLabel('Your role aboard').selectOption('deck.deckhand');
  await sheet(page).getByLabel('Waters').selectOption('western-rivers');
  await sheet(page).getByRole('button', { name: 'Start the trip' }).click();
  await expect(home.button(page)).toHaveText('Check out');
  await home.button(page).click();
  await expect(home.button(page)).toHaveText('Check in');

  // Next time, one tap on the sheet starts the same kind of trip.
  await home.button(page).click();
  await expect(sheet(page).getByLabel('Vessel').locator('option:checked')).toHaveText('Kestrel');
  await expect(sheet(page).getByLabel('Your role aboard')).toHaveValue('deck.deckhand');
  await expect(sheet(page).getByLabel('Waters')).toHaveValue('western-rivers');
  await sheet(page).getByRole('button', { name: 'Start the trip' }).click();
  await expect(home.status(page)).toHaveText('Checked in on Kestrel.');
});

test('the check-in sheet says what is missing and saves nothing until it is right', async ({
  page,
}) => {
  await openLog(page, '#check-in');
  // With no vessel saved, the sheet asks for one first.
  await expect(sheet(page).getByText("Add the vessel you're on first.")).toBeVisible();
  await expect(sheet(page).locator('form')).toBeHidden();

  await addVessel(page, 'Sea Breeze', null);
  await page.reload();
  await expect(sheet(page).locator('form')).toBeVisible();
  await sheet(page).getByRole('button', { name: 'Start the trip' }).click();
  await expect(sheet(page).getByRole('alert')).toHaveText('Pick your role aboard.');
  await sheet(page).getByLabel('Your role aboard').selectOption('engine.oiler');
  await sheet(page).getByRole('button', { name: 'Start the trip' }).click();
  await expect(sheet(page).getByRole('alert')).toHaveText('Pick the waters.');
  expect(await page.evaluate(() => window.__seaTimeLog?.count())).toBe(0);
});

test('backfilling saves nothing without consent', async ({ page }, testInfo) => {
  await openLog(page);
  const vesselId = await addVessel(page, 'Sea Breeze');
  await page.goto('/log/#backfill');

  await expect(backfill(page).getByRole('heading', { name: 'Before you backfill' })).toBeVisible();
  await expect(backfill(page).locator('#backfill-form')).toBeHidden();
  await expect(backfill(page).locator('#consent')).toContainText('"backfilled" everywhere');
  await shot(page, testInfo, 'consent.png');

  // The store refuses too, so no screen can get around the consent step.
  const refused = await page.evaluate(async (vesselId) => {
    const log = window.__seaTimeLog;
    if (!log) throw new Error('the store did not open');
    const aboard = { vesselId, roleId: 'deck.mate', waters: 'inland' } as const;
    const names: string[] = [];
    for (const attempt of [
      () => log.backfill({ ...aboard, day: '2026-06-14', hoursBand: '8-12' }),
      () =>
        log.save({
          id: crypto.randomUUID(),
          source: 'backfilled',
          day: '2026-06-14',
          hoursBand: '8-12',
          ...aboard,
          watersSuggestion: null,
        }),
    ]) {
      try {
        await attempt();
        names.push('saved');
      } catch (error) {
        names.push(error instanceof Error ? error.name : String(error));
      }
    }
    return { names, consent: await log.backfillConsent(), count: await log.count() };
  }, vesselId);
  expect(refused).toEqual({
    names: ['ConsentRequiredError', 'ConsentRequiredError'],
    consent: undefined,
    count: 0,
  });

  // Declining leaves the log as it was.
  await backfill(page).getByRole('link', { name: 'Not now' }).click();
  await expect(home.button(page)).toBeVisible();
  await page.reload();
  await expect(page.locator('#entries')).toHaveText('No sea time logged yet.');
  expect(await page.evaluate(() => window.__seaTimeLog?.backfillConsent())).toBeUndefined();
});

test('with consent, backfilled days save, record the consent and say "backfilled"', async ({
  page,
}, testInfo) => {
  await openLog(page);
  await addVessel(page, 'Sea Breeze');
  await page.goto('/log/#backfill');
  await backfill(page).getByRole('button', { name: 'I agree, backfill days' }).click();
  const form = backfill(page).locator('#backfill-form');
  await expect(form).toBeVisible();

  // The form says what is missing before it saves.
  await form.getByRole('button', { name: 'Save backfilled day' }).click();
  await expect(form.getByRole('alert')).toHaveText('Pick the day.');
  await form.getByLabel('Day').fill('2026-06-14');
  await form.getByRole('button', { name: 'Save backfilled day' }).click();
  await expect(form.getByRole('alert')).toHaveText('Pick the hours for that day.');

  await form.getByText('8 to 12 hours').click();
  await form.getByLabel('Waters').selectOption('great-lakes');
  await form.getByRole('button', { name: 'Save backfilled day' }).click();
  await expect(form.locator('#backfill-status')).toHaveText(
    'Saved 2026-06-14 as backfilled, 8 to 12 hours.',
  );
  await shot(page, testInfo, 'backfill-form.png');

  // A day that hasn't happened yet is refused.
  await form.getByLabel('Day').fill('2099-01-01');
  await form.getByText('4 to 8 hours').click();
  await form.getByRole('button', { name: 'Save backfilled day' }).click();
  await expect(form.getByRole('alert')).toHaveText("That day hasn't happened yet.");

  const stored = await page.evaluate(async () => {
    const log = window.__seaTimeLog;
    if (!log) throw new Error('the store did not open');
    const consent = await log.backfillConsent();
    // Agreeing again keeps the first time.
    const again = await log.giveBackfillConsent();
    return { entries: await log.list(), consent, again };
  });
  expect(stored.entries).toHaveLength(1);
  const day = stored.entries[0];
  expect(day).toMatchObject({
    source: 'backfilled',
    day: '2026-06-14',
    hoursBand: '8-12',
    waters: 'great-lakes',
  });
  expect(day?.source === 'backfilled' && day.consentedAt).toBe(stored.consent?.givenAt);
  expect(stored.again.givenAt).toBe(stored.consent?.givenAt);

  // The list labels it backfilled, and so does its edit screen.
  await page.goto('/log/#entries');
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toHaveAttribute('data-source', 'backfilled');
  await expect(rows(page).first().locator('.tag')).toHaveText('Backfilled');
  await expect(rows(page).first()).toContainText('Sea Breeze · Mate · Great Lakes');
  await shot(page, testInfo, 'backfilled-day.png');
  await rows(page).first().click();
  await expect(page.locator('#entry-source')).toHaveText('Backfilled');
  await expect(page.getByRole('heading', { name: 'Edit backfilled day' })).toBeVisible();

  // The consent screen doesn't show again on this device.
  await page.goto('/log/#backfill');
  await expect(backfill(page).locator('#consent')).toBeHidden();
  await expect(form).toBeVisible();
});

test('every entry under 4 hours is flagged and stays; the day notes cite the CFR', async ({
  page,
}, testInfo) => {
  await openLog(page);
  const vesselId = await addVessel(page, 'Sea Breeze');
  const ids = await page.evaluate(async (vesselId) => {
    const log = window.__seaTimeLog;
    if (!log) throw new Error('the store did not open');
    await log.giveBackfillConsent();
    const aboard = {
      vesselId,
      roleId: 'deck.mate',
      waters: 'inland',
      watersSuggestion: null,
    } as const;
    const trip = async (start: string, hours: number) =>
      (
        await log.save({
          id: crypto.randomUUID(),
          source: 'live',
          startedAt: start,
          endedAt: new Date(Date.parse(start) + hours * 3_600_000).toISOString(),
          ...aboard,
        } as const)
      ).id;
    const day = async (date: string, hoursBand: 'under-4' | '4-8' | '8-12' | '12-plus') =>
      (await log.backfill({ ...aboard, waters: 'inland', day: date, hoursBand })).id;
    return {
      liveUnder: await trip('2026-10-01T06:00:00.000Z', 4 - 1 / 3600),
      liveFour: await trip('2026-10-02T06:00:00.000Z', 4),
      liveEight: await trip('2026-10-03T06:00:00.000Z', 8),
      liveTwelve: await trip('2026-10-04T06:00:00.000Z', 12),
      dayUnder: await day('2026-09-01', 'under-4'),
      dayShort: await day('2026-09-02', '4-8'),
      dayLong: await day('2026-09-03', '12-plus'),
    };
  }, vesselId);

  await page.goto('/log/#entries');
  await expect(rows(page)).toHaveCount(7);
  const row = (id: string) => page.locator(`#entry-list a[data-entry-id="${id}"]`);

  // Flagged: the trip a second short of 4 hours, and the under-4 day. Kept in the list.
  for (const id of [ids.liveUnder, ids.dayUnder]) {
    await expect(row(id).locator('.flag')).toHaveText(FLAG);
  }
  await expect(page.locator('#entry-list .flag')).toHaveCount(2);
  await expect(row(ids.liveUnder)).toContainText('3 h 59 min');
  await expect(row(ids.liveFour)).toContainText('4 h 00 min');

  // Notes: 4 up to 8 hours, and 12 or more. Exactly 8 hours gets none.
  for (const id of [ids.liveFour, ids.dayShort]) {
    await expect(row(id).locator('.day-note')).toHaveText(SHORT_DAY_NOTE);
  }
  for (const id of [ids.liveTwelve, ids.dayLong]) {
    await expect(row(id).locator('.day-note')).toHaveText(TWO_WATCH_NOTE);
  }
  await expect(row(ids.liveEight).locator('.day-note')).toHaveCount(0);
  await expect(row(ids.dayUnder).locator('.day-note')).toHaveCount(0);
  await row(ids.dayUnder).scrollIntoViewIfNeeded();
  await shot(page, testInfo, 'under-4.png');

  // No number of credited days is shown or stored.
  const text = await page.locator('#view-entries').innerText();
  expect(text).not.toMatch(/credited days|days credited|total days|\b\d+(\.\d+)? days?\b/i);
  const keys = await page.evaluate(async () =>
    [...new Set(((await window.__seaTimeLog?.list()) ?? []).flatMap((e) => Object.keys(e)))].sort(),
  );
  expect(keys.filter((key) => /credit|days|eligib/i.test(key))).toEqual([]);

  // All seven, flagged ones included, are still there after a reload.
  await page.reload();
  await expect(rows(page)).toHaveCount(7);
  await expect(page.locator('#entry-list .flag')).toHaveCount(2);
});

test('entries carry their vessel, role and confirmed waters; a GPS suggestion stays apart', async ({
  page,
}) => {
  await openLog(page);
  const vesselId = await addVessel(page, 'Sea Breeze');
  const result = await page.evaluate(async (vesselId) => {
    const log = window.__seaTimeLog;
    if (!log) throw new Error('the store did not open');
    const base = {
      source: 'live',
      startedAt: '2026-10-01T06:00:00.000Z',
      endedAt: '2026-10-01T15:00:00.000Z',
    } as const;
    const saved = await log.save({
      ...base,
      id: crypto.randomUUID(),
      vesselId,
      roleId: 'deck.master',
      waters: 'near-coastal',
      watersSuggestion: 'inland',
    });
    const stored = await log.get(saved.id);
    const refusals: string[] = [];
    for (const change of [
      { vesselId: crypto.randomUUID() },
      { roleId: 'deck.admiral' },
      { waters: 'harbor' },
    ]) {
      try {
        await log.save({
          ...base,
          id: crypto.randomUUID(),
          vesselId,
          roleId: 'deck.master',
          waters: 'near-coastal',
          watersSuggestion: null,
          ...change,
        } as Parameters<typeof log.save>[0]);
        refusals.push('saved');
      } catch (error) {
        refusals.push(error instanceof Error ? error.name : String(error));
      }
    }

    // A deleted vessel can't take new entries, but its old entries can still be edited.
    await log.vessels.softDelete(vesselId);
    let newOnDeleted = '';
    try {
      await log.checkIn({ vesselId, roleId: 'deck.master', waters: 'inland' });
    } catch (error) {
      newOnDeleted = error instanceof Error ? error.name : String(error);
    }
    const edited = await log.save({
      ...base,
      id: saved.id,
      vesselId,
      roleId: 'deck.mate',
      waters: 'near-coastal',
      watersSuggestion: 'inland',
    });
    return { saved: stored, refusals, newOnDeleted, edited };
  }, vesselId);

  expect(result.saved).toMatchObject({
    vesselId,
    roleId: 'deck.master',
    waters: 'near-coastal',
    watersSuggestion: 'inland',
  });
  expect(result.refusals).toEqual(['UnknownVesselError', 'UnknownRoleError', 'ZodError']);
  expect(result.newOnDeleted).toBe('UnknownVesselError');
  expect(result.edited.roleId).toBe('deck.mate');

  // The list shows the confirmed waters, not the suggestion.
  await page.goto('/log/#entries');
  await expect(rows(page).first()).toContainText('Sea Breeze · Mate · Near coastal');
});

test('entries are edited and soft-deleted, and a backfilled day stays backfilled', async ({
  page,
}) => {
  await openLog(page);
  const vesselId = await addVessel(page, 'Sea Breeze');
  const ids = await page.evaluate(async (vesselId) => {
    const log = window.__seaTimeLog;
    if (!log) throw new Error('the store did not open');
    await log.giveBackfillConsent();
    const aboard = { vesselId, roleId: 'deck.mate', waters: 'inland' } as const;
    const trip = await log.save({
      id: crypto.randomUUID(),
      source: 'live',
      startedAt: '2026-10-01T06:00:30.000Z',
      endedAt: '2026-10-01T15:00:30.000Z',
      ...aboard,
      watersSuggestion: null,
    });
    const day = await log.backfill({ ...aboard, day: '2026-09-01', hoursBand: '8-12' });
    return { trip: trip.id, day: day.id };
  }, vesselId);

  // Change the backfilled day's hours to under 4: it is flagged, and still backfilled.
  await page.goto(`/log/#entries/${ids.day}`);
  const form = page.locator('#entry-form');
  await expect(page.getByRole('heading', { name: 'Edit backfilled day' })).toBeVisible();
  await expect(form.locator('.live-fields')).toBeHidden();
  await form.getByLabel('Hours that day').selectOption('under-4');
  await form.getByRole('button', { name: 'Save entry' }).click();
  await expect(page.locator('#entries-status')).toHaveText('Entry saved.');
  const day = page.locator(`#entry-list a[data-entry-id="${ids.day}"]`);
  await expect(day.locator('.tag')).toHaveText('Backfilled');
  await expect(day.locator('.flag')).toHaveText(FLAG);

  // Editing only the waters keeps the trip's times to the second.
  await page.goto(`/log/#entries/${ids.trip}`);
  await expect(page.getByRole('heading', { name: 'Edit live trip' })).toBeVisible();
  await form.getByLabel('Waters').selectOption('oceans');
  await form.getByRole('button', { name: 'Save entry' }).click();
  await expect(page.locator('#entries-status')).toHaveText('Entry saved.');
  const trip = await page.evaluate((id) => window.__seaTimeLog?.get(id), ids.trip);
  expect(trip).toMatchObject({
    waters: 'oceans',
    startedAt: '2026-10-01T06:00:30.000Z',
    endedAt: '2026-10-01T15:00:30.000Z',
  });

  // A check-out before the check-in is refused.
  await page.goto(`/log/#entries/${ids.trip}`);
  const startValue = await form.getByLabel('Checked in').inputValue();
  await form.getByLabel('Checked out').fill(startValue.replace(/T\d\d/, 'T00'));
  await form.getByRole('button', { name: 'Save entry' }).click();
  await expect(form.getByRole('alert')).toHaveText('The check-out has to come after the check-in.');

  // Two taps delete it; it leaves the list but stays on the device, marked deleted.
  const remove = page.locator('#delete-entry');
  await remove.click();
  await expect(remove).toHaveText('Tap again to delete');
  await remove.click();
  await expect(page.locator('#entries-status')).toHaveText('Entry deleted.');
  await expect(rows(page)).toHaveCount(1);
  const deleted = await page.evaluate((id) => window.__seaTimeLog?.get(id), ids.trip);
  expect(deleted?.deletedAt).not.toBeNull();
});

test('version 2 upgrades to version 3 and keeps its vessels and entries', async ({ page }) => {
  // A device that ran PR 2's code: version 2 with a vessel and two entries.
  await page.goto('/sw.js');
  const vessel = {
    id: '5d1c6a7e-2b3f-4c8d-9e0a-1b2c3d4e5f60',
    name: 'Old Salt',
    officialNumber: null,
    officialGrossTons: null,
    lengthFeet: null,
    propulsion: null,
    owner: null,
    horsepower: null,
    photo: null,
    defaultRoleId: 'deck.mate',
    updatedAt: '2026-10-21T15:00:00.000Z',
    deletedAt: null,
  };
  const live = {
    id: '3f6c1a52-8e4b-4d2a-9c1f-5b7e2d8a9f10',
    source: 'live',
    startedAt: '2026-10-21T06:00:00.000Z',
    endedAt: '2026-10-21T08:00:00.000Z',
    updatedAt: '2026-10-21T08:00:00.000Z',
    deletedAt: null,
  };
  const day = {
    id: '9a2b7c4d-1e3f-4a5b-8c6d-7e8f9a0b1c2d',
    source: 'backfilled',
    day: '2026-06-14',
    hoursBand: '8-12',
    updatedAt: '2026-10-21T15:00:00.000Z',
    deletedAt: null,
  };
  await page.evaluate(
    ([name, vessel, entries]) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(name, 2);
        request.onupgradeneeded = () => {
          const db = request.result;
          const store = db.createObjectStore('sea_time_entries', { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt');
          db.createObjectStore('outbox', { keyPath: 'seq', autoIncrement: true });
          const vessels = db.createObjectStore('vessels', { keyPath: 'id' });
          vessels.createIndex('updatedAt', 'updatedAt');
          const roles = db.createObjectStore('roles', { keyPath: 'id' });
          roles.put({ id: 'deck.mate', label: 'Mate', category: 'deck', position: 1 });
          roles.put({ id: 'engine.oiler', label: 'Oiler', category: 'engine', position: 4 });
          vessels.put(vessel);
          for (const entry of entries) store.put(entry);
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          request.result.close();
          resolve();
        };
      }),
    [DB, vessel, [live, day]] as const,
  );

  await openLog(page);
  await expect(page.locator('#entries')).toHaveText('2 entries saved on this phone.');
  const after = await page.evaluate(async () => {
    const log = window.__seaTimeLog;
    if (!log) throw new Error('the store did not open');
    const version = await new Promise<{ version: number; stores: string[] }>((resolve) => {
      const request = indexedDB.open('captains-academy-sea-log');
      request.onsuccess = () => {
        resolve({ version: request.result.version, stores: [...request.result.objectStoreNames] });
        request.result.close();
      };
    });
    return { ...version, vessels: await log.vessels.list(), entries: await log.list() };
  });
  expect(after.version).toBe(3);
  expect(after.stores).toEqual(['outbox', 'preferences', 'roles', 'sea_time_entries', 'vessels']);
  expect(after.vessels).toEqual([vessel]);
  const nulls = { vesselId: null, roleId: null, waters: null, watersSuggestion: null };
  expect(after.entries.find((e) => e.id === live.id)).toEqual({ ...live, ...nulls });
  expect(after.entries.find((e) => e.id === day.id)).toEqual({
    ...day,
    ...nulls,
    consentedAt: null,
  });

  // The list shows them, with the details still to fill in.
  await page.goto('/log/#entries');
  await expect(rows(page)).toHaveCount(2);
  await expect(rows(page).first()).toContainText('Vessel, role or waters not recorded yet.');

  // Filling in the old trip saves it with its new fields.
  await page.goto(`/log/#entries/${live.id}`);
  const form = page.locator('#entry-form');
  await form.getByLabel('Vessel').selectOption(vessel.id);
  await form.getByLabel('Your role aboard').selectOption('deck.mate');
  await form.getByLabel('Waters').selectOption('inland');
  await form.getByRole('button', { name: 'Save entry' }).click();
  await expect(page.locator('#entries-status')).toHaveText('Entry saved.');
  await expect(page.locator(`#entry-list a[data-entry-id="${live.id}"]`)).toContainText(
    'Old Salt · Mate · Inland',
  );
});

test('the new screens never say qualify or eligible for', async ({ page }) => {
  await openLog(page);
  const vesselId = await addVessel(page, 'Sea Breeze');
  const id = await page.evaluate(async (vesselId) => {
    const log = window.__seaTimeLog;
    if (!log) throw new Error('the store did not open');
    const trip = await log.checkIn({ vesselId, roleId: 'deck.mate', waters: 'inland' });
    await log.checkOut();
    return trip.id;
  }, vesselId);
  const banned = /qualif|eligible for|you are eligible|you're eligible/i;
  for (const hash of ['', '#check-in', '#backfill', '#entries', `#entries/${id}`]) {
    await page.goto(`/log/${hash}`);
    await expect(page.locator('#entries')).toHaveAttribute('data-state', 'ready');
    expect(await page.locator('body').innerText(), hash).not.toMatch(banned);
  }
  // The backfill form, after consent.
  await page.goto('/log/#backfill');
  await page.getByRole('button', { name: 'I agree, backfill days' }).click();
  await expect(page.locator('#backfill-form')).toBeVisible();
  expect(await page.locator('body').innerText()).not.toMatch(banned);
});

test('the entry screens fit one thumb', async ({ page }, testInfo) => {
  await openLog(page);
  await addVessel(page, 'Sea Breeze');
  const viewport = page.viewportSize();
  if (!viewport) throw new Error('no viewport');
  const inReach = async (name: string) => {
    const box = await page.getByRole('button', { name, exact: true }).boundingBox();
    if (!box) throw new Error(`${name} not shown`);
    expect(box.height).toBeGreaterThanOrEqual(56);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    if (testInfo.project.name === 'phone-portrait') {
      expect(box.y).toBeGreaterThan(viewport.height / 2);
    }
  };

  await page.goto('/log/#check-in');
  await expect(sheet(page).locator('form')).toBeVisible();
  await inReach('Start the trip');
  for (const control of await sheet(page).locator('select').all()) {
    expect((await control.boundingBox())?.height).toBeGreaterThanOrEqual(56);
  }

  // Each screen renders after a read from the store, so wait for it before measuring.
  await page.goto('/log/#backfill');
  await expect(page.getByRole('button', { name: 'I agree, backfill days' })).toBeVisible();
  await inReach('I agree, backfill days');
  await page.getByRole('button', { name: 'I agree, backfill days' }).click();
  await expect(page.getByRole('button', { name: 'Save backfilled day' })).toBeVisible();
  await inReach('Save backfilled day');
  for (const choice of await backfill(page).locator('label.choice').all()) {
    expect((await choice.boundingBox())?.height).toBeGreaterThanOrEqual(56);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    viewport.width,
  );
});
