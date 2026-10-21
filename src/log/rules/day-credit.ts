// How one entry's time may be credited as a day of sea service (D1), worked
// out from the stored entry and its vessel each time and never stored.
//
// Bands come from src/log/entry.ts: under 4 hours, 4 up to 8, 8 up to 12, and
// 12 or more. What each band can be, under the "Day" definition quoted in
// cfr.ts and 46 CFR 10.232(h):
//
// - Under 4 hours is never a day: "in no case will this period be less than
//   4 hours". The entry stays in the output, flagged.
// - 4 up to 8 hours may count as a day only on a vessel under 100 GRT, and
//   only if the Coast Guard accepts the vessel's schedule. It is reported apart
//   from standard days and never added to them.
// - 8 up to 12 hours is one day. Overtime adds nothing.
// - 12 hours or more is one day. The 1½-day credit for two-watch vessels is
//   discretionary ("may be creditable"), so it is a note, never a number.

import { entryBand, type HoursBand, type SeaTimeEntry, type Vessel } from '../entry';
import type { Cfr, Rule } from './cfr';

/**
 * What an entry is, as a day:
 * - `day`: one standard day.
 * - `may-count`: 4 to 8 hours on a vessel under 100 GRT; counts only if the
 *   Coast Guard accepts the schedule.
 * - `unknown-tonnage`: 4 to 8 hours on a vessel with no official tonnage saved.
 * - `not-a-day`: under 4 hours, or 4 to 8 hours at 100 GRT or more.
 * - `open`: a trip still underway, not credited until it ends.
 */
export type DayOutcome = 'day' | 'may-count' | 'unknown-tonnage' | 'not-a-day' | 'open';

export interface DayRule extends Rule {
  readonly band: HoursBand;
}

/** The 100 GRT line in the "Day" definition, compared against official tonnage only. */
export const SMALL_VESSEL_GRT = 100;

export const DAY_RULES: Readonly<Record<HoursBand, DayRule>> = {
  'under-4': {
    id: 'day.under-4',
    band: 'under-4',
    text: 'Under 4 hours is never a day of service. The entry is kept and flagged.',
    cfr: ['46 CFR 10.232(h)(3)', '46 CFR 10.107'],
  },
  '4-8': {
    id: 'day.4-8',
    band: '4-8',
    text: 'A day is 8 hours. On a vessel under 100 GRT, a shorter day of at least 4 hours may count if the Coast Guard accepts the schedule. Otherwise 4 to 8 hours is not a day.',
    cfr: ['46 CFR 10.232(h)(1)', '46 CFR 10.232(h)(3)', '46 CFR 10.107'],
  },
  '8-12': {
    id: 'day.8-12',
    band: '8-12',
    text: 'Eight hours of watchstanding or day-working is one day. Overtime adds nothing.',
    cfr: ['46 CFR 10.232(h)(1)', '46 CFR 10.107'],
  },
  '12-plus': {
    id: 'day.12-plus',
    band: '12-plus',
    text: "Twelve hours or more is one day. The 1½-day credit on two-watch vessels is at the Coast Guard's discretion and is never added here.",
    cfr: ['46 CFR 10.232(h)(1)', '46 CFR 10.232(h)(2)', '46 CFR 15.705'],
  },
};

/** The informational note on 12-hour days. Never a number, never in a total. */
export const TWO_WATCH_NOTE: Rule = {
  id: 'day.two-watch-note',
  text: "May be credited as 1½ days at the Coast Guard's discretion on vessels authorized for two watches (46 CFR 10.232(h)(2), 15.705). Not added to any total.",
  cfr: ['46 CFR 10.232(h)(2)', '46 CFR 15.705'],
};

/** One entry's credit, with the rule that gave it. */
export interface EntryCredit {
  readonly entryId: string;
  readonly source: SeaTimeEntry['source'];
  /** The calendar day the entry is credited to, as YYYY-MM-DD. */
  readonly date: string;
  readonly band: HoursBand | null;
  readonly outcome: DayOutcome;
  readonly vesselId: string | null;
  readonly waters: SeaTimeEntry['waters'];
  /** The rule's text and anything else the entry should say, such as the two-watch note. */
  readonly notes: readonly string[];
  readonly cfr: readonly Cfr[];
}

/** The calendar day an instant falls on in a time zone, as YYYY-MM-DD. */
export function calendarDay(instant: string, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(instant));
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/**
 * The rule for a live trip that crosses midnight: ⚠️ unverified. 46 CFR
 * doesn't say which calendar day a period of service that runs past midnight
 * belongs to. The engine takes the conservative reading: the whole trip is
 * credited to the day it began, and one entry is never more than one day.
 */
export const MIDNIGHT_RULE: Rule = {
  id: 'day.crosses-midnight',
  text: '⚠️ Unverified: 46 CFR does not say how to date service that crosses midnight. A trip is credited to the day it began, and one entry is never more than one day.',
  cfr: ['46 CFR 10.107', '46 CFR 10.232(h)(1)'],
};

/** How an entry may be credited, given the vessels it may refer to. */
export function creditEntry(
  entry: SeaTimeEntry,
  vessels: ReadonlyMap<string, Vessel>,
  timeZone: string,
): EntryCredit {
  const date = entry.source === 'backfilled' ? entry.day : calendarDay(entry.startedAt, timeZone);
  const base = {
    entryId: entry.id,
    source: entry.source,
    date,
    vesselId: entry.vesselId,
    waters: entry.waters,
  };
  const band = entryBand(entry);
  if (band === null) {
    return {
      ...base,
      band: null,
      outcome: 'open',
      notes: ['Still underway. Credited once the trip ends.'],
      cfr: ['46 CFR 10.232(h)(1)'],
    };
  }
  const rule = DAY_RULES[band];
  const notes: string[] = [rule.text];
  if (entry.source === 'live' && entry.endedAt !== null) {
    if (calendarDay(entry.endedAt, timeZone) !== date) notes.push(MIDNIGHT_RULE.text);
  }

  let outcome: DayOutcome;
  if (band === 'under-4') {
    outcome = 'not-a-day';
  } else if (band === '4-8') {
    const vessel = entry.vesselId ? vessels.get(entry.vesselId) : undefined;
    const tons = vessel?.officialGrossTons ?? null;
    if (tons === null) {
      outcome = 'unknown-tonnage';
      notes.push(
        'The vessel has no official gross tonnage saved, so whether 4 to 8 hours may count is unknown.',
      );
    } else {
      outcome = tons < SMALL_VESSEL_GRT ? 'may-count' : 'not-a-day';
    }
  } else {
    outcome = 'day';
    if (band === '12-plus') notes.push(TWO_WATCH_NOTE.text);
  }
  return { ...base, band, outcome, notes, cfr: rule.cfr };
}
