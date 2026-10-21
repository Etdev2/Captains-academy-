import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { WATERS, type SeaTimeEntry, type Vessel } from '../src/log/entry';
import {
  ALL_RULES,
  ALL_WATERS_RULES,
  CFR_FORMAT,
  creditEntry,
  DAY_DEFINITION,
  DAY_RULES,
  DAYS_PER_MONTH,
  DAYS_PER_YEAR,
  MIDNIGHT_RULE,
  NOT_CHECKED,
  OUPV_NEAR_COASTAL_REQUIREMENTS,
  oupvNearCoastalProgress,
  TWO_WATCH_NOTE,
  WATERS_RULES,
} from '../src/log/rules';

// The rules engine (issue #42): day credit per entry (D1), waters for OUPV
// near coastal (D2), and progress that never says the user qualifies.

const rulesDir = join(import.meta.dirname, '../src/log/rules');
const ruleFiles = readdirSync(rulesDir).filter((name) => name.endsWith('.ts'));
const source = (name: string) => readFileSync(join(rulesDir, name), 'utf8');

const SMALL = 'aaaaaaaa-1111-4111-8111-111111111111';
const BIG = 'bbbbbbbb-2222-4222-8222-222222222222';
const UNKNOWN = 'cccccccc-3333-4333-8333-333333333333';

function vessel(id: string, officialGrossTons: number | null, deleted = false): Vessel {
  return {
    id,
    name: id.slice(0, 4),
    officialNumber: null,
    officialGrossTons,
    lengthFeet: null,
    propulsion: null,
    owner: null,
    horsepower: null,
    photo: null,
    defaultRoleId: null,
    updatedAt: '2026-10-21T00:00:00.000Z',
    deletedAt: deleted ? '2026-10-21T00:00:00.000Z' : null,
  };
}

const vessels = [vessel(SMALL, 24), vessel(BIG, 150), vessel(UNKNOWN, null)];
const byId = new Map(vessels.map((v) => [v.id, v]));
let n = 0;
const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;

function trip(
  start: string,
  hours: number | null,
  more: Partial<{ vesselId: string | null; waters: SeaTimeEntry['waters']; deleted: boolean }> = {},
): SeaTimeEntry {
  return {
    id: id(),
    source: 'live',
    startedAt: start,
    endedAt: hours === null ? null : new Date(Date.parse(start) + hours * 3_600_000).toISOString(),
    vesselId: more.vesselId === undefined ? SMALL : more.vesselId,
    roleId: 'deck.mate',
    waters: more.waters === undefined ? 'near-coastal' : more.waters,
    watersSuggestion: null,
    updatedAt: '2026-10-21T00:00:00.000Z',
    deletedAt: more.deleted ? '2026-10-21T00:00:00.000Z' : null,
  };
}

function day(
  date: string,
  hoursBand: 'under-4' | '4-8' | '8-12' | '12-plus',
  more: Partial<{ vesselId: string; waters: SeaTimeEntry['waters'] }> = {},
): SeaTimeEntry {
  return {
    id: id(),
    source: 'backfilled',
    day: date,
    hoursBand,
    vesselId: more.vesselId ?? SMALL,
    roleId: 'deck.mate',
    waters: more.waters === undefined ? 'near-coastal' : more.waters,
    watersSuggestion: null,
    consentedAt: '2026-10-21T00:00:00.000Z',
    updatedAt: '2026-10-21T00:00:00.000Z',
    deletedAt: null,
  };
}

const UTC = { timeZone: 'UTC' };
const credit = (entry: SeaTimeEntry) => creditEntry(entry, byId, 'UTC');
const progress = (entries: SeaTimeEntry[]) => oupvNearCoastalProgress(entries, vessels, UTC);

/** n consecutive backfilled days from 2026-01-01. */
function days(count: number, band: '8-12' | '12-plus', waters: SeaTimeEntry['waters']) {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
    return day(date, band, { waters });
  });
}

describe('the engine is pure', () => {
  it('has files to check', () => {
    expect(ruleFiles.length).toBeGreaterThanOrEqual(5);
  });

  it.each(ruleFiles)('%s reads no page, store, network or clock', (name) => {
    const banned =
      /\b(document|window|indexedDB|localStorage|sessionStorage|navigator|fetch|XMLHttpRequest|WebSocket|EventSource|Date\.now|performance)\b|new Date\(\s*\)/;
    expect(source(name)).not.toMatch(banned);
  });

  it.each(ruleFiles)('%s imports only from the engine and src/log/entry.ts', (name) => {
    const imports = [...source(name).matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
    for (const spec of imports) {
      expect(spec, `${name} imports ${spec}`).toMatch(/^(\.\/[\w-]+|\.\.\/entry)$/);
    }
  });

  // Game and simulator time are never sea time.
  it.each(ruleFiles)('%s names nothing from the game, the simulator or missions', (name) => {
    expect(source(name)).not.toMatch(
      /\b(src\/sim|src\/game|missions|phaser)\b|\.\.\/\.\.\/(sim|game)/,
    );
  });

  it('refuses anything that is not a sea-time entry, such as game time', () => {
    const game = { ...trip('2026-01-01T06:00:00.000Z', 9), gameMinutes: 600 };
    expect(() => progress([game as SeaTimeEntry])).toThrow();
    expect(() =>
      progress([{ source: 'simulator', minutes: 600 } as unknown as SeaTimeEntry]),
    ).toThrow();
  });
});

describe('every rule cites 46 CFR', () => {
  it.each(ALL_RULES.map((rule) => [rule.id, rule] as const))('%s', (_id, rule) => {
    expect(rule.cfr.length).toBeGreaterThan(0);
    for (const cfr of rule.cfr) expect(cfr).toMatch(CFR_FORMAT);
  });

  it('covers every band and every waters value', () => {
    const ids = ALL_RULES.map((rule) => rule.id);
    for (const band of ['under-4', '4-8', '8-12', '12-plus']) expect(ids).toContain(`day.${band}`);
    for (const waters of WATERS) expect(ids).toContain(`waters.${waters}`);
  });

  it('fails a rule with no citation', () => {
    const uncited = { id: 'x', text: 'x', cfr: [] };
    const cited = (rule: typeof uncited) =>
      rule.cfr.length > 0 && rule.cfr.every((cfr) => CFR_FORMAT.test(cfr));
    expect(cited(uncited)).toBe(false);
    expect(CFR_FORMAT.test('10.232(h)(1)')).toBe(false);
  });
});

describe('46 CFR 10.107 definitions', () => {
  it('a month is 30 days and a year 360', () => {
    expect(DAYS_PER_MONTH).toBe(30);
    expect(DAYS_PER_YEAR).toBe(360);
    expect(source('cfr.ts')).toContain('Month means 30 days, for the purpose of complying');
    expect(source('cfr.ts')).toContain('Year means 360 days for the purpose of complying');
  });

  it('quotes the "Day" definition', () => {
    expect(DAY_DEFINITION).toContain(
      '8 hours of watchstanding or day-working not to include overtime',
    );
    expect(DAY_DEFINITION).toContain('in no case will this period be less than 4 hours');
  });

  it('OUPV near coastal asks for 360 days, 90 of them on ocean or near-coastal waters', () => {
    expect(OUPV_NEAR_COASTAL_REQUIREMENTS.total).toMatchObject({
      amount: 12,
      unit: 'month',
      days: 360,
    });
    expect(OUPV_NEAR_COASTAL_REQUIREMENTS.oceansOrNearCoastal).toMatchObject({
      amount: 3,
      unit: 'month',
      days: 90,
    });
  });
});

describe('day credit per entry (D1)', () => {
  const start = '2026-03-01T06:00:00.000Z';

  it.each([
    [0, 'not-a-day'],
    [3.999, 'not-a-day'],
    [4, 'may-count'],
    [7.999, 'may-count'],
    [8, 'day'],
    [11.999, 'day'],
    [12, 'day'],
    [20, 'day'],
  ] as const)('%s hours on a 24 GRT vessel is %s', (hours, outcome) => {
    expect(credit(trip(start, hours)).outcome).toBe(outcome);
  });

  it('4 to 8 hours may count only under 100 GRT', () => {
    const under = vessel(SMALL, 99.9);
    const at = vessel(BIG, 100);
    const tons = new Map([
      [under.id, under],
      [at.id, at],
    ]);
    expect(creditEntry(trip(start, 6, { vesselId: SMALL }), tons, 'UTC').outcome).toBe('may-count');
    expect(creditEntry(trip(start, 6, { vesselId: BIG }), tons, 'UTC').outcome).toBe('not-a-day');
    expect(credit(day('2026-03-02', '4-8', { vesselId: BIG })).outcome).toBe('not-a-day');
  });

  it('4 to 8 hours with no official tonnage is unknown-tonnage', () => {
    expect(credit(trip(start, 6, { vesselId: UNKNOWN })).outcome).toBe('unknown-tonnage');
    expect(credit(trip(start, 6, { vesselId: null })).outcome).toBe('unknown-tonnage');
    expect(
      credit(trip(start, 6, { vesselId: 'dddddddd-4444-4444-8444-444444444444' })).outcome,
    ).toBe('unknown-tonnage');
  });

  it("uses a deleted vessel's official tonnage for its old entries", () => {
    const gone = vessel(SMALL, 24, true);
    expect(creditEntry(trip(start, 6), new Map([[gone.id, gone]]), 'UTC').outcome).toBe(
      'may-count',
    );
  });

  it('tonnage does not matter outside 4 to 8 hours', () => {
    for (const vesselId of [SMALL, BIG, UNKNOWN]) {
      expect(credit(trip(start, 3, { vesselId })).outcome).toBe('not-a-day');
      expect(credit(trip(start, 9, { vesselId })).outcome).toBe('day');
    }
  });

  it('a 12-hour day carries the two-watch note, and only that band does', () => {
    expect(credit(trip(start, 12)).notes).toContain(TWO_WATCH_NOTE.text);
    expect(credit(day('2026-03-02', '12-plus')).notes).toContain(TWO_WATCH_NOTE.text);
    expect(credit(trip(start, 11.999)).notes).not.toContain(TWO_WATCH_NOTE.text);
    expect(TWO_WATCH_NOTE.text).toContain('Not added to any total');
  });

  it('each outcome cites its rule', () => {
    expect(credit(trip(start, 3)).cfr).toEqual(DAY_RULES['under-4'].cfr);
    expect(credit(trip(start, 6)).cfr).toContain('46 CFR 10.232(h)(3)');
    expect(credit(trip(start, 9)).cfr).toContain('46 CFR 10.232(h)(1)');
    expect(credit(trip(start, 13)).cfr).toEqual(
      expect.arrayContaining(['46 CFR 10.232(h)(2)', '46 CFR 15.705']),
    );
  });

  it('an open trip is not credited until it ends', () => {
    expect(credit(trip(start, null))).toMatchObject({ outcome: 'open', band: null });
  });
});

describe('midnight (⚠️ unverified, conservative)', () => {
  it('a trip that crosses midnight counts once, on the day it began', () => {
    const overnight = trip('2026-03-01T20:00:00.000Z', 10);
    const judged = credit(overnight);
    expect(judged).toMatchObject({ date: '2026-03-01', outcome: 'day' });
    expect(judged.notes).toContain(MIDNIGHT_RULE.text);
    const result = progress([overnight]);
    expect(result.dates.map((d) => d.date)).toEqual(['2026-03-01']);
    expect(result.parts.total.creditedDays).toBe(1);
  });

  it('a two-day trip is still one entry, so at most one day', () => {
    expect(progress([trip('2026-03-01T06:00:00.000Z', 40)]).parts.total.creditedDays).toBe(1);
  });

  it("reads the calendar day in the caller's time zone", () => {
    // 03:00 UTC on Oct 1 is the evening of Sep 30 in Los Angeles.
    const evening = trip('2026-10-01T03:00:00.000Z', 9);
    expect(creditEntry(evening, byId, 'UTC').date).toBe('2026-10-01');
    expect(creditEntry(evening, byId, 'America/Los_Angeles').date).toBe('2026-09-30');
  });
});

describe('same-day overlaps', () => {
  it('two entries on one day credit one day', () => {
    const result = progress([
      trip('2026-03-01T06:00:00.000Z', 9),
      trip('2026-03-01T08:00:00.000Z', 9),
      day('2026-03-01', '8-12'),
    ]);
    expect(result.dates).toHaveLength(1);
    expect(result.dates[0]?.entryIds).toHaveLength(3);
    expect(result.parts.total.creditedDays).toBe(1);
    expect(result.entries).toHaveLength(3);
  });

  it('the day takes the best outcome among its entries', () => {
    const result = progress([
      trip('2026-03-01T06:00:00.000Z', 2),
      trip('2026-03-01T12:00:00.000Z', 6),
      trip('2026-03-01T18:00:00.000Z', 9),
    ]);
    expect(result.dates[0]?.outcome).toBe('day');
    expect(result.parts.total).toMatchObject({ creditedDays: 1, mayCountDays: 0 });
  });

  it('two short entries on one day are not added into a day (⚠️ listed as not checked)', () => {
    const result = progress([
      trip('2026-03-01T06:00:00.000Z', 3),
      trip('2026-03-01T14:00:00.000Z', 3),
    ]);
    expect(result.dates[0]?.outcome).toBe('not-a-day');
    expect(result.notChecked.map((item) => item.id)).toContain('same-day-watches');
  });
});

describe('under 4 hours is flagged, never dropped', () => {
  it('stays in the entries and the dates', () => {
    const short = trip('2026-03-01T06:00:00.000Z', 1);
    const shortDay = day('2026-03-02', 'under-4');
    const result = progress([short, shortDay]);
    expect(result.entries.map((e) => [e.entryId, e.outcome])).toEqual([
      [short.id, 'not-a-day'],
      [shortDay.id, 'not-a-day'],
    ]);
    expect(result.dates.map((d) => d.outcome)).toEqual(['not-a-day', 'not-a-day']);
    expect(result.parts.total.creditedDays).toBe(0);
  });
});

describe('totals', () => {
  it('never add the extra half day for 12-hour days', () => {
    const result = progress(days(10, '12-plus', 'near-coastal'));
    expect(result.parts.total.creditedDays).toBe(10);
    expect(result.parts.oceansOrNearCoastal.creditedDays).toBe(10);
    // No half day hides anywhere: every count is a whole number of days.
    for (const part of Object.values(result.parts)) {
      for (const key of [
        'creditedDays',
        'mayCountDays',
        'unknownTonnageDays',
        'stillNeededDays',
      ] as const) {
        expect(Number.isInteger(part[key]), key).toBe(true);
      }
    }
  });

  it('keep may-count days apart from standard days', () => {
    const result = progress([
      day('2026-03-01', '4-8'),
      day('2026-03-02', '4-8'),
      day('2026-03-03', '8-12'),
      day('2026-03-04', '4-8', { vesselId: UNKNOWN }),
    ]);
    expect(result.parts.total).toMatchObject({
      creditedDays: 1,
      mayCountDays: 2,
      unknownTonnageDays: 1,
      stillNeededDays: 359,
    });
  });

  it('leave deleted entries out', () => {
    const kept = trip('2026-03-01T06:00:00.000Z', 9);
    const gone = trip('2026-03-02T06:00:00.000Z', 9, { deleted: true });
    const result = progress([kept, gone]);
    expect(result.entries.map((e) => e.entryId)).toEqual([kept.id]);
    expect(result.parts.total.creditedDays).toBe(1);
  });

  it('show the open trip but count nothing for it', () => {
    const result = progress([trip('2026-03-01T06:00:00.000Z', null)]);
    expect(result.entries[0]?.outcome).toBe('open');
    expect(result.dates).toEqual([]);
  });
});

describe('waters for OUPV near coastal (D2)', () => {
  it.each(WATERS.map((waters) => [waters] as const))('%s', (waters) => {
    const result = progress([day('2026-03-01', '8-12', { waters })]);
    const counts = ['oceans', 'near-coastal', 'inside-passage', 'great-lakes'].includes(waters);
    expect(WATERS_RULES[waters].oceansOrNearCoastal).toBe(counts);
    expect(result.parts.total.creditedDays).toBe(1);
    expect(result.parts.oceansOrNearCoastal.creditedDays).toBe(counts ? 1 : 0);
  });

  it('counts Inside Passage as near coastal, citing 10.232(b)(3)', () => {
    expect(WATERS_RULES['inside-passage'].cfr).toContain('46 CFR 10.232(b)(3)');
  });

  it('counts Great Lakes service day for day, citing 10.232(b) and 11.211(b)', () => {
    expect(WATERS_RULES['great-lakes'].cfr).toEqual(
      expect.arrayContaining(['46 CFR 10.232(b)', '46 CFR 11.211(b)']),
    );
    const result = progress(days(360, '8-12', 'great-lakes'));
    expect(result.parts.oceansOrNearCoastal).toMatchObject({ creditedDays: 360, appearsMet: true });
  });

  it('leaves inland service out of the route part, and says so under not checked', () => {
    const result = progress(days(360, '8-12', 'inland'));
    expect(result.parts.total.appearsMet).toBe(true);
    expect(result.parts.oceansOrNearCoastal).toMatchObject({
      creditedDays: 0,
      stillNeededDays: 90,
    });
    expect(result.notChecked.find((item) => item.id === 'inland-toward-near-coastal')?.cfr).toEqual(
      ['46 CFR 10.232(b)', '46 CFR 11.211(b)'],
    );
  });

  it('works out the route part apart from the day, so a better entry elsewhere never hides it', () => {
    const result = progress([
      // A full inland day and a shorter near-coastal trip on a small vessel the same day.
      trip('2026-03-01T06:00:00.000Z', 9, { waters: 'inland' }),
      trip('2026-03-01T16:00:00.000Z', 6, { waters: 'near-coastal' }),
    ]);
    expect(result.dates[0]).toMatchObject({
      outcome: 'day',
      oceansOrNearCoastalOutcome: 'may-count',
    });
    expect(result.parts.total).toMatchObject({ creditedDays: 1, mayCountDays: 0 });
    expect(result.parts.oceansOrNearCoastal).toMatchObject({ creditedDays: 0, mayCountDays: 1 });
  });

  it('has a rule for every waters value, in order', () => {
    expect(ALL_WATERS_RULES.map((rule) => rule.waters)).toEqual([...WATERS]);
  });

  it('counts an entry with no waters recorded toward the total only', () => {
    const result = progress([day('2026-03-01', '8-12', { waters: null })]);
    expect(result.parts.total.creditedDays).toBe(1);
    expect(result.parts.oceansOrNearCoastal.creditedDays).toBe(0);
  });

  it('counts a day toward the ocean part when an entry with its outcome was on those waters', () => {
    const result = progress([
      day('2026-03-01', '8-12', { waters: 'inland' }),
      day('2026-03-01', '8-12', { waters: 'oceans' }),
      day('2026-03-02', 'under-4', { waters: 'oceans' }),
      day('2026-03-02', '8-12', { waters: 'inland' }),
    ]);
    expect(result.parts.total.creditedDays).toBe(2);
    expect(result.parts.oceansOrNearCoastal.creditedDays).toBe(1);
  });
});

describe('progress, never a verdict', () => {
  it('shows the total and the ocean or near-coastal part apart, with citations', () => {
    const result = progress([
      ...days(300, '8-12', 'inland'),
      ...days(40, '8-12', 'near-coastal').map((e, i) => ({
        ...e,
        day: new Date(Date.UTC(2027, 0, 1 + i)).toISOString().slice(0, 10),
      })),
    ]);
    expect(result.parts.total).toMatchObject({
      creditedDays: 340,
      stillNeededDays: 20,
      appearsMet: false,
    });
    expect(result.parts.oceansOrNearCoastal).toMatchObject({
      creditedDays: 40,
      stillNeededDays: 50,
      appearsMet: false,
    });
    expect(result.citations).toEqual(
      expect.arrayContaining(['46 CFR 11.467(c)', '46 CFR 10.107', '46 CFR 10.232(b)(3)']),
    );
    expect(result.summary).toBe(
      'Your logged sea time does not yet appear to meet the sea-service amount for OUPV near coastal: 20 more days in total, 50 more on ocean or near-coastal waters. The NMC decides.',
    );
  });

  it('says "appears to meet" when the amounts are reached, and the NMC decides', () => {
    const result = progress(days(360, '8-12', 'near-coastal'));
    expect(result.parts.total.appearsMet).toBe(true);
    expect(result.parts.oceansOrNearCoastal.appearsMet).toBe(true);
    expect(result.summary).toContain(
      'appears to meet the sea-service amount for OUPV near coastal',
    );
    expect(result.summary).toContain('The NMC decides');
  });

  it('lists what it does not check: recency, role credit, tonnage limit and the non-sea-time items', () => {
    const ids = progress([]).notChecked.map((item) => item.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'recency',
        'role-credit',
        'tonnage-limit',
        'exam',
        'physical',
        'drug-test',
        'twic',
        'inland-toward-near-coastal',
      ]),
    );
    expect(NOT_CHECKED.find((item) => item.id === 'tonnage-limit')?.cfr).toEqual(['46 CFR 11.422']);
  });

  it('never says qualify, eligible for or you meet, in any result', () => {
    const banned = /qualif|eligible for|you meet|you are eligible|you're eligible/i;
    for (const result of [progress([]), progress(days(360, '12-plus', 'oceans'))]) {
      expect(JSON.stringify(result)).not.toMatch(banned);
    }
    expect(JSON.stringify(ALL_RULES)).not.toMatch(banned);
  });
});
