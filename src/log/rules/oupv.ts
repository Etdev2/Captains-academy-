// Progress toward the sea service for OUPV near coastal. 46 CFR 11.467(c)
// asks for "a minimum of 12 months of experience in the operation of vessels,
// including at least 3 months of service on vessels operating on ocean or
// near-coastal waters." (Quoted from eCFR by the GitHub Claude run on PR #43;
// the build session could not reach eCFR itself.) A month is 30 days (46 CFR
// 10.107), so that is 360 days, 90 of them on ocean or near-coastal waters.
// Inside Passage service counts as near coastal (10.232(b)(3)), and Great
// Lakes service counts day for day (11.211(b)(1)).

import { seaTimeEntrySchema, type SeaTimeEntry, type Vessel } from '../entry';
import type { Cfr, Rule } from './cfr';
import { creditEntry, MIDNIGHT_RULE, TWO_WATCH_NOTE, type EntryCredit } from './day-credit';
import {
  NOT_CHECKED,
  requirement,
  type DateCredit,
  type PartProgress,
  type Progress,
  type Requirement,
} from './requirements';
import { WATERS_RULES } from './waters-credit';

export const OUPV_NEAR_COASTAL = {
  id: 'oupv-near-coastal',
  label: 'OUPV near coastal',
  cfr: ['46 CFR 11.467(c)'],
} as const satisfies { id: string; label: string; cfr: readonly Cfr[] };

export const OUPV_NEAR_COASTAL_REQUIREMENTS = {
  total: requirement({
    id: 'oupv-near-coastal.total',
    label: 'Operating experience on any waters',
    text: 'Twelve months of experience in the operation of vessels.',
    amount: 12,
    unit: 'month',
    cfr: ['46 CFR 11.467(c)', '46 CFR 10.107'],
  }),
  oceansOrNearCoastal: requirement({
    id: 'oupv-near-coastal.oceans-or-near-coastal',
    label: 'Of which on ocean or near-coastal waters',
    text: 'At least 3 of the 12 months on ocean or near-coastal waters. Inside Passage service counts as near coastal, and Great Lakes service counts day for day.',
    amount: 3,
    unit: 'month',
    cfr: [
      '46 CFR 11.467(c)',
      '46 CFR 10.107',
      '46 CFR 10.232(b)(3)',
      '46 CFR 10.232(b)',
      '46 CFR 11.211(b)(1)',
    ],
  }),
} as const satisfies Record<string, Requirement>;

/**
 * The same-day rule: one calendar day is credited at most once, however many
 * entries fall on it, so overlapping entries never count twice. The day takes
 * the best outcome among its entries.
 */
export const SAME_DAY_RULE: Rule = {
  id: 'day.once-per-date',
  text: 'A calendar day is credited at most once, however many entries fall on it. It takes the best outcome among its entries.',
  cfr: ['46 CFR 10.107', '46 CFR 10.232(h)(1)'],
};

const RANK: Readonly<Record<DateCredit['outcome'], number>> = {
  day: 3,
  'may-count': 2,
  'unknown-tonnage': 1,
  'not-a-day': 0,
};

const best = (entries: readonly EntryCredit[]): DateCredit['outcome'] =>
  entries
    .map((entry) => entry.outcome as DateCredit['outcome'])
    .reduce((top, next) => (RANK[next] > RANK[top] ? next : top));

/**
 * Each calendar day once, with the best outcome among its closed entries. The
 * ocean or near-coastal outcome is worked out on its own, from the day's
 * entries on waters that count toward that part, so a better entry elsewhere
 * that day never hides it.
 */
export function creditDates(judged: readonly EntryCredit[]): DateCredit[] {
  const byDate = new Map<string, EntryCredit[]>();
  for (const credit of judged) {
    if (credit.outcome === 'open') continue;
    byDate.set(credit.date, [...(byDate.get(credit.date) ?? []), credit]);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, entries]) => {
      const onRoute = entries.filter(
        (entry) => entry.waters !== null && WATERS_RULES[entry.waters].oceansOrNearCoastal,
      );
      return {
        date,
        outcome: best(entries),
        entryIds: entries.map((entry) => entry.entryId),
        oceansOrNearCoastalOutcome: onRoute.length > 0 ? best(onRoute) : null,
      };
    });
}

function part(
  requirement: Requirement,
  outcomes: readonly (DateCredit['outcome'] | null)[],
): PartProgress {
  const count = (outcome: DateCredit['outcome']) =>
    outcomes.filter((each) => each === outcome).length;
  const creditedDays = count('day');
  return {
    requirement,
    creditedDays,
    mayCountDays: count('may-count'),
    unknownTonnageDays: count('unknown-tonnage'),
    stillNeededDays: Math.max(0, requirement.days - creditedDays),
    appearsMet: creditedDays >= requirement.days,
  };
}

export interface ProgressOptions {
  /** The IANA time zone a live trip's calendar day is read in, such as "America/Los_Angeles". */
  readonly timeZone: string;
}

/**
 * Progress toward the OUPV near-coastal sea service, from the log's entries
 * and vessels. Deleted entries are left out; every other entry is in the
 * output, flagged ones included. Takes only sea-time entries: each is checked
 * against the strict entry schema, so nothing else can be passed in.
 */
export function oupvNearCoastalProgress(
  entries: readonly SeaTimeEntry[],
  vessels: readonly Vessel[],
  options: ProgressOptions,
): Progress {
  const byId = new Map(vessels.map((vessel) => [vessel.id, vessel]));
  const judged = entries
    .map((entry) => seaTimeEntrySchema.parse(entry))
    .filter((entry) => entry.deletedAt === null)
    .map((entry) => creditEntry(entry, byId, options.timeZone));
  const dates = creditDates(judged);
  const total = part(
    OUPV_NEAR_COASTAL_REQUIREMENTS.total,
    dates.map((date) => date.outcome),
  );
  const oceans = part(
    OUPV_NEAR_COASTAL_REQUIREMENTS.oceansOrNearCoastal,
    dates.map((date) => date.oceansOrNearCoastalOutcome),
  );
  const citations = [
    ...new Set<Cfr>([
      ...OUPV_NEAR_COASTAL.cfr,
      ...OUPV_NEAR_COASTAL_REQUIREMENTS.total.cfr,
      ...OUPV_NEAR_COASTAL_REQUIREMENTS.oceansOrNearCoastal.cfr,
      ...SAME_DAY_RULE.cfr,
      ...judged.flatMap((credit) => credit.cfr),
    ]),
  ].sort();
  return {
    license: OUPV_NEAR_COASTAL,
    parts: { total, oceansOrNearCoastal: oceans },
    dates,
    entries: judged,
    notChecked: NOT_CHECKED,
    summary: summarize(total, oceans),
    citations,
  };
}

/** One sentence of progress. Never a verdict: the NMC decides. */
export function summarize(total: PartProgress, oceans: PartProgress): string {
  const license = OUPV_NEAR_COASTAL.label;
  if (total.appearsMet && oceans.appearsMet) {
    return `Your logged sea time appears to meet the sea-service amount for ${license}. The NMC decides, and the items not checked here are still open.`;
  }
  const needs = [`${total.stillNeededDays} more days in total`];
  if (!oceans.appearsMet) {
    needs.push(`${oceans.stillNeededDays} more on ocean or near-coastal waters`);
  }
  return `Your logged sea time does not yet appear to meet the sea-service amount for ${license}: ${needs.join(', ')}. The NMC decides.`;
}

/** Every rule the OUPV near-coastal progress relies on, for the citation test. */
export const OUPV_RULES: readonly Rule[] = [
  OUPV_NEAR_COASTAL_REQUIREMENTS.total,
  OUPV_NEAR_COASTAL_REQUIREMENTS.oceansOrNearCoastal,
  SAME_DAY_RULE,
  MIDNIGHT_RULE,
  TWO_WATCH_NOTE,
];
