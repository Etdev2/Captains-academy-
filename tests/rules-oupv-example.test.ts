import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SeaTimeEntry, Vessel } from '../src/log/entry';
import { oupvNearCoastalProgress } from '../src/log/rules';

// A worked example (issue #42): a fixture log, run through the engine, gives
// the OUPV near-coastal progress in progress.json. Each entry's _note says
// what it should come to. Set UPDATE_EXAMPLE=1 to rewrite progress.json.

const dir = join(import.meta.dirname, 'fixtures/oupv-near-coastal');
const log = JSON.parse(readFileSync(join(dir, 'log.json'), 'utf8')) as {
  timeZone: string;
  vessels: Vessel[];
  entries: { _note: string; entry: SeaTimeEntry }[];
};

describe('worked example: a fixture log to OUPV near-coastal progress', () => {
  const result = oupvNearCoastalProgress(
    log.entries.map((item) => item.entry),
    log.vessels,
    { timeZone: log.timeZone },
  );

  it('matches progress.json', () => {
    const path = join(dir, 'progress.json');
    if (process.env.UPDATE_EXAMPLE === '1') {
      writeFileSync(path, `${JSON.stringify(result, null, 2)}\n`);
    }
    expect(JSON.parse(JSON.stringify(result))).toEqual(JSON.parse(readFileSync(path, 'utf8')));
  });

  it('comes to what each entry says', () => {
    expect(result.parts.total).toMatchObject({
      creditedDays: 5,
      mayCountDays: 1,
      unknownTonnageDays: 0,
      stillNeededDays: 355,
      appearsMet: false,
    });
    // Jun 10 (Inside Passage), Jun 11 (Great Lakes), Jul 1 and Jul 2. Jul 4's
    // 6-hour trip and Jul 6's 5-hour ocean trip may count, kept apart.
    expect(result.parts.oceansOrNearCoastal).toMatchObject({
      creditedDays: 4,
      mayCountDays: 2,
      stillNeededDays: 86,
      appearsMet: false,
    });
    // 11 entries kept (the deleted one left out), 2 of them flagged not-a-day under 4 hours.
    expect(result.entries).toHaveLength(11);
    expect(
      result.entries.filter((e) => e.outcome === 'not-a-day' && e.band === 'under-4'),
    ).toHaveLength(2);
    expect(result.entries.find((e) => e.outcome === 'open')).toBeDefined();
  });
});
