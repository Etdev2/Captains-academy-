import { describe, expect, it } from 'vitest';
import { ENTRY_SOURCES, HOURS_BANDS, seaTimeEntrySchema } from '../src/log/entry';

// The rules the saved shape of a sea-time entry carries (DECISIONS.md A3).

const aboard = {
  vesselId: '5d1c6a7e-2b3f-4c8d-9e0a-1b2c3d4e5f60',
  roleId: 'deck.mate',
  waters: 'near-coastal',
  watersSuggestion: null,
};

const live = {
  id: '3f6c1a52-8e4b-4d2a-9c1f-5b7e2d8a9f10',
  source: 'live',
  startedAt: '2026-10-21T06:00:00.000Z',
  endedAt: '2026-10-21T14:30:00.000Z',
  ...aboard,
  updatedAt: '2026-10-21T14:30:00.000Z',
  deletedAt: null,
};

const backfilled = {
  id: '9a2b7c4d-1e3f-4a5b-8c6d-7e8f9a0b1c2d',
  source: 'backfilled',
  day: '2026-06-14',
  hoursBand: '8-12',
  ...aboard,
  consentedAt: '2026-10-21T14:59:00.000Z',
  updatedAt: '2026-10-21T15:00:00.000Z',
  deletedAt: null,
};

describe('sea-time entry schema', () => {
  it('accepts a live entry, an open trip and a backfilled day', () => {
    expect(seaTimeEntrySchema.parse(live)).toEqual(live);
    expect(seaTimeEntrySchema.parse({ ...live, endedAt: null }).source).toBe('live');
    expect(seaTimeEntrySchema.parse(backfilled)).toEqual(backfilled);
  });

  it('knows only two sources, live and backfilled', () => {
    expect(ENTRY_SOURCES).toEqual(['live', 'backfilled']);
    for (const source of ['verified', 'gps', 'game', 'simulator', 'arcade', 'imported']) {
      expect(seaTimeEntrySchema.safeParse({ ...live, source }).success).toBe(false);
    }
  });

  it('has the four hours ranges from A3 and nothing else', () => {
    expect(HOURS_BANDS).toEqual(['under-4', '4-8', '8-12', '12-plus']);
    expect(seaTimeEntrySchema.safeParse({ ...backfilled, hoursBand: '24' }).success).toBe(false);
  });

  // No extra field can sneak in, so nothing can mark a backfilled day as
  // verified, store credited days, or tie an entry to game time.
  it.each([
    { field: 'verified', value: true },
    { field: 'gpsVerified', value: true },
    { field: 'creditedDays', value: 1 },
    { field: 'gameMinutes', value: 30 },
    { field: 'simulatorSessionId', value: 'abc' },
  ])('refuses a backfilled day with an extra $field field', ({ field, value }) => {
    expect(seaTimeEntrySchema.safeParse({ ...backfilled, [field]: value }).success).toBe(false);
  });

  it.each([
    { field: 'verified', value: true },
    { field: 'creditedDays', value: 1 },
  ])('refuses a live entry with an extra $field field', ({ field, value }) => {
    expect(seaTimeEntrySchema.safeParse({ ...live, [field]: value }).success).toBe(false);
  });

  it('keeps live and backfilled fields apart', () => {
    // A backfilled day has no clock times, and a live entry has no hours range.
    expect(seaTimeEntrySchema.safeParse({ ...backfilled, startedAt: live.startedAt }).success).toBe(
      false,
    );
    expect(seaTimeEntrySchema.safeParse({ ...live, hoursBand: '4-8' }).success).toBe(false);
    const noStart: Record<string, unknown> = { ...live };
    delete noStart.startedAt;
    expect(seaTimeEntrySchema.safeParse(noStart).success).toBe(false);
  });

  it('refuses a trip that ends before it starts', () => {
    const result = seaTimeEntrySchema.safeParse({ ...live, endedAt: '2026-10-21T05:59:59.000Z' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['endedAt']);
  });

  it('refuses bad ids, dates and times', () => {
    expect(seaTimeEntrySchema.safeParse({ ...live, id: 'entry-1' }).success).toBe(false);
    expect(seaTimeEntrySchema.safeParse({ ...live, startedAt: 'yesterday' }).success).toBe(false);
    expect(seaTimeEntrySchema.safeParse({ ...backfilled, day: '2026-13-40' }).success).toBe(false);
    expect(seaTimeEntrySchema.safeParse({ ...backfilled, deletedAt: 'now' }).success).toBe(false);
  });
});
