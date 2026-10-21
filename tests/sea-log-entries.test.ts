import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BAND_LOWER_EDGE_HOURS,
  bandForHours,
  dayNoteFor,
  entryBand,
  entryHours,
  isUnderFourHours,
  preferenceSchema,
  savableEntrySchema,
  seaTimeEntrySchema,
  WATERS,
  type SeaTimeEntry,
} from '../src/log/entry';
import {
  DAY_NOTES,
  formatClock,
  formatHours,
  fromLocalInput,
  toLocalInput,
  UNDER_FOUR_FLAG,
  WATERS_LABELS,
} from '../src/log/entry-screens';
import { entryToV3 } from '../src/log/schema';

// Live and backfilled entries (issue #40): the waters list (D2), the hours
// bands and the under-4 flag (D1), and consent for backfilled days. The store
// and screens run against real IndexedDB in e2e/entries.spec.ts.

const aboard = {
  vesselId: '5d1c6a7e-2b3f-4c8d-9e0a-1b2c3d4e5f60',
  roleId: 'deck.mate',
  waters: 'near-coastal' as const,
  watersSuggestion: null,
};

const at = '2026-10-21T15:00:00.000Z';

function trip(hours: number | null): SeaTimeEntry {
  const startedAt = '2026-10-21T06:00:00.000Z';
  return seaTimeEntrySchema.parse({
    id: '3f6c1a52-8e4b-4d2a-9c1f-5b7e2d8a9f10',
    source: 'live',
    startedAt,
    endedAt:
      hours === null ? null : new Date(Date.parse(startedAt) + hours * 3_600_000).toISOString(),
    ...aboard,
    updatedAt: at,
    deletedAt: null,
  });
}

function day(hoursBand: string): SeaTimeEntry {
  return seaTimeEntrySchema.parse({
    id: '9a2b7c4d-1e3f-4a5b-8c6d-7e8f9a0b1c2d',
    source: 'backfilled',
    day: '2026-06-14',
    hoursBand,
    ...aboard,
    consentedAt: at,
    updatedAt: at,
    deletedAt: null,
  });
}

describe('waters (D2)', () => {
  it('are exactly the seven values the ticket lists, in order', () => {
    expect(WATERS).toEqual([
      'oceans',
      'near-coastal',
      'great-lakes',
      'inland',
      'western-rivers',
      'inside-passage',
      'rivers',
    ]);
  });

  it('each cite their source in the domain module', () => {
    const source = readFileSync(join(import.meta.dirname, '../src/log/entry.ts'), 'utf8');
    for (const waters of WATERS) {
      const line = source.split('\n').find((text) => text.includes(`\`${waters}\`:`));
      const cited = source
        .slice(source.indexOf(line ?? '\0'))
        .split('\n * - ')[0]
        ?.match(/\d+ CFR [\d.]+(\([a-z0-9]+\))*/g);
      expect(cited, `${waters} has no citation`).not.toBeNull();
    }
  });

  it('each have a label, and an entry refuses any other value', () => {
    expect(Object.keys(WATERS_LABELS)).toEqual([...WATERS]);
    expect(seaTimeEntrySchema.safeParse({ ...trip(9), waters: 'harbor' }).success).toBe(false);
    expect(seaTimeEntrySchema.safeParse({ ...trip(9), waters: 'foreign-inland' }).success).toBe(
      false,
    );
  });

  it('keep the GPS suggestion in its own field, apart from the confirmed waters', () => {
    const suggested = seaTimeEntrySchema.parse({ ...trip(9), watersSuggestion: 'inland' });
    expect(suggested.waters).toBe('near-coastal');
    expect(suggested.watersSuggestion).toBe('inland');
  });
});

describe('hours bands (D1)', () => {
  it('have their lower edges at exactly 4, 8 and 12 hours', () => {
    expect(BAND_LOWER_EDGE_HOURS).toEqual({ 'under-4': 0, '4-8': 4, '8-12': 8, '12-plus': 12 });
  });

  it.each([
    [0, 'under-4'],
    [3.999, 'under-4'],
    [4, '4-8'],
    [7.999, '4-8'],
    [8, '8-12'],
    [11.999, '8-12'],
    [12, '12-plus'],
    [26, '12-plus'],
  ] as const)('put %s hours in %s', (hours, band) => {
    expect(bandForHours(hours)).toBe(band);
  });

  it('refuse a negative or missing number of hours', () => {
    for (const hours of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => bandForHours(hours)).toThrow(RangeError);
    }
  });

  it('come from the stored times for a live trip, and the stored band for a backfilled day', () => {
    expect(entryHours(trip(9.5))).toBe(9.5);
    expect(entryBand(trip(9.5))).toBe('8-12');
    expect(entryBand(trip(null))).toBeNull();
    expect(entryHours(day('4-8'))).toBeNull();
    expect(entryBand(day('4-8'))).toBe('4-8');
  });
});

describe('the under-4 flag (D1)', () => {
  it('marks a trip under 4 hours, and not one of exactly 4', () => {
    expect(isUnderFourHours(trip(3.999))).toBe(true);
    expect(isUnderFourHours(trip(0))).toBe(true);
    expect(isUnderFourHours(trip(4))).toBe(false);
  });

  it('marks a backfilled under-4 day, and no other band', () => {
    expect(isUnderFourHours(day('under-4'))).toBe(true);
    for (const band of ['4-8', '8-12', '12-plus']) expect(isUnderFourHours(day(band))).toBe(false);
  });

  it('waits for an open trip to end', () => {
    expect(isUnderFourHours(trip(null))).toBe(false);
  });

  it('says exactly what the ticket asks, and is never stored', () => {
    expect(UNDER_FOUR_FLAG).toBe('Not eligible: under 4 hours');
    for (const field of ['notEligible', 'underFourHours', 'eligible', 'flag']) {
      expect(seaTimeEntrySchema.safeParse({ ...trip(2), [field]: true }).success).toBe(false);
    }
  });
});

describe('day notes (D1)', () => {
  it('note 4 to 8 hours and 12 or more, and nothing else', () => {
    expect(dayNoteFor(day('under-4'))).toBeNull();
    expect(dayNoteFor(day('4-8'))).toBe('short-day');
    expect(dayNoteFor(day('8-12'))).toBeNull();
    expect(dayNoteFor(day('12-plus'))).toBe('two-watch');
    expect(dayNoteFor(trip(7.999))).toBe('short-day');
    expect(dayNoteFor(trip(8))).toBeNull();
    expect(dayNoteFor(trip(12))).toBe('two-watch');
    expect(dayNoteFor(trip(null))).toBeNull();
  });

  it('use the ticket copy, with its CFR citations', () => {
    expect(DAY_NOTES['short-day']).toBe(
      'May count as a day only on vessels under 100 GRT if the Coast Guard accepts the schedule (46 CFR 10.232(h)(3)).',
    );
    expect(DAY_NOTES['two-watch']).toBe(
      "On vessels authorized for two watches, a 12-hour day may be credited as 1½ days at the Coast Guard's discretion (46 CFR 10.232(h)(2)). Not guaranteed.",
    );
  });

  // Credited days belong to the rules engine (PR 4). No entry holds a count.
  it.each(['creditedDays', 'days', 'dayCredit', 'credit'])(
    'leave no %s field on an entry',
    (field) => {
      expect(seaTimeEntrySchema.safeParse({ ...day('12-plus'), [field]: 1.5 }).success).toBe(false);
      expect(seaTimeEntrySchema.safeParse({ ...trip(13), [field]: 1.5 }).success).toBe(false);
    },
  );
});

describe('entry schemas', () => {
  it('read an entry saved before version 3, with its new fields null', () => {
    const old = { ...trip(9), vesselId: null, roleId: null, waters: null };
    expect(seaTimeEntrySchema.safeParse(old).success).toBe(true);
    expect(seaTimeEntrySchema.safeParse({ ...day('8-12'), consentedAt: null }).success).toBe(true);
  });

  it('save only an entry with its vessel, role and confirmed waters', () => {
    for (const missing of ['vesselId', 'roleId', 'waters']) {
      expect(savableEntrySchema.safeParse({ ...trip(9), [missing]: null }).success).toBe(false);
    }
    expect(savableEntrySchema.safeParse(trip(9)).success).toBe(true);
  });

  it('save a backfilled day only with its consent time', () => {
    expect(savableEntrySchema.safeParse({ ...day('8-12'), consentedAt: null }).success).toBe(false);
    expect(savableEntrySchema.safeParse(day('8-12')).success).toBe(true);
  });

  it('refuse a role that is not a role id, and a vessel that is not an id', () => {
    expect(seaTimeEntrySchema.safeParse({ ...trip(9), roleId: 'captain' }).success).toBe(false);
    expect(seaTimeEntrySchema.safeParse({ ...trip(9), vesselId: 'Sea Breeze' }).success).toBe(
      false,
    );
  });

  it.each([
    { field: 'verified', value: true },
    { field: 'gpsVerified', value: true },
    { field: 'gameMinutes', value: 30 },
    { field: 'simulatorSessionId', value: 'abc' },
  ])('refuse an extra $field field on either source', ({ field, value }) => {
    expect(seaTimeEntrySchema.safeParse({ ...trip(9), [field]: value }).success).toBe(false);
    expect(seaTimeEntrySchema.safeParse({ ...day('8-12'), [field]: value }).success).toBe(false);
  });

  it('keep consent on backfilled days only', () => {
    expect(seaTimeEntrySchema.safeParse({ ...trip(9), consentedAt: at }).success).toBe(false);
  });
});

describe('preferences on this device', () => {
  it('hold backfill consent and the last check-in, and nothing else', () => {
    expect(preferenceSchema.parse({ key: 'backfill-consent', givenAt: at }).key).toBe(
      'backfill-consent',
    );
    expect(
      preferenceSchema.parse({
        key: 'last-check-in',
        vesselId: aboard.vesselId,
        roleId: 'deck.mate',
        waters: 'inland',
      }).key,
    ).toBe('last-check-in');
    expect(preferenceSchema.safeParse({ key: 'game-progress', level: 2 }).success).toBe(false);
    expect(preferenceSchema.safeParse({ key: 'backfill-consent' }).success).toBe(false);
  });
});

describe('version 3 of an older entry', () => {
  it('adds the new fields as null and keeps everything else', () => {
    const v1Live = {
      id: '3f6c1a52-8e4b-4d2a-9c1f-5b7e2d8a9f10',
      source: 'live',
      startedAt: '2026-10-21T06:00:00.000Z',
      endedAt: null,
      updatedAt: at,
      deletedAt: null,
    };
    expect(entryToV3(v1Live)).toEqual({
      ...v1Live,
      vesselId: null,
      roleId: null,
      waters: null,
      watersSuggestion: null,
    });
    const v1Day = {
      id: '9a2b7c4d-1e3f-4a5b-8c6d-7e8f9a0b1c2d',
      source: 'backfilled',
      day: '2026-06-14',
      hoursBand: 'under-4',
      updatedAt: at,
      deletedAt: at,
    };
    const upgraded = entryToV3(v1Day);
    expect(upgraded).toEqual({
      ...v1Day,
      vesselId: null,
      roleId: null,
      waters: null,
      watersSuggestion: null,
      consentedAt: null,
    });
    // The upgraded entries read under the version 3 schema.
    expect(seaTimeEntrySchema.safeParse(entryToV3(v1Live)).success).toBe(true);
    expect(seaTimeEntrySchema.safeParse(upgraded).success).toBe(true);
  });

  it('never overwrites a field the entry already has', () => {
    const already = { ...day('8-12') } as Record<string, unknown>;
    expect(entryToV3(already)).toEqual(already);
  });
});

describe('entry screen helpers', () => {
  it('format hours and a running trip', () => {
    expect(formatHours(9.5)).toBe('9 h 30 min');
    expect(formatHours(3.999)).toBe('3 h 59 min');
    expect(formatClock(1 + 5 / 60 + 32 / 3600)).toBe('1:05:32');
  });

  it('read a datetime-local field back to the same instant', () => {
    const iso = '2026-10-21T13:45:00.000Z';
    expect(fromLocalInput(toLocalInput(iso))).toBe(iso);
    expect(fromLocalInput('')).toBeNull();
    expect(fromLocalInput('not a time')).toBeNull();
  });
});
