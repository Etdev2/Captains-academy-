// The shapes the engine returns: a license's sea-service requirement, the
// progress a log makes toward it, and what the engine does not check.
//
// Progress is never a verdict. Even when every part appears met, the NMC
// decides, and the parts listed under notChecked are still open.

import { DAYS_PER_MONTH, type Cfr, type Rule } from './cfr';
import type { DayOutcome, EntryCredit } from './day-credit';

/** A sea-service amount a license asks for, in months as 46 CFR states it. */
export interface Requirement extends Rule {
  readonly label: string;
  readonly amount: number;
  readonly unit: 'month';
  /** The amount in days: a month is 30 days (46 CFR 10.107). */
  readonly days: number;
}

export function requirement(fields: Omit<Requirement, 'days'>): Requirement {
  return { ...fields, days: fields.amount * DAYS_PER_MONTH };
}

/** One calendar day of the log, credited at most once. */
export interface DateCredit {
  readonly date: string;
  /** The best outcome among the day's entries. */
  readonly outcome: Exclude<DayOutcome, 'open'>;
  readonly entryIds: readonly string[];
  /** True when an entry with the day's outcome was on ocean or near-coastal waters. */
  readonly oceansOrNearCoastal: boolean;
}

/** Progress toward one requirement. */
export interface PartProgress {
  readonly requirement: Requirement;
  /** Standard days credited. */
  readonly creditedDays: number;
  /** 4-to-8-hour days on vessels under 100 GRT. Shown apart, never added to creditedDays. */
  readonly mayCountDays: number;
  /** 4-to-8-hour days on vessels with no official tonnage saved. Never added. */
  readonly unknownTonnageDays: number;
  /** Standard days still needed, never below 0. */
  readonly stillNeededDays: number;
  /** True when the standard days reach the amount. Not a verdict: the NMC decides. */
  readonly appearsMet: boolean;
}

/** Something the license needs that the engine does not check yet. */
export interface NotChecked {
  readonly id: string;
  readonly label: string;
  readonly why: string;
  readonly cfr: readonly Cfr[];
}

export interface Progress {
  readonly license: { readonly id: string; readonly label: string; readonly cfr: readonly Cfr[] };
  readonly parts: {
    readonly total: PartProgress;
    readonly oceansOrNearCoastal: PartProgress;
  };
  readonly dates: readonly DateCredit[];
  /** Every entry given, flagged ones included, deleted ones left out. */
  readonly entries: readonly EntryCredit[];
  readonly notChecked: readonly NotChecked[];
  /** One sentence of progress, never a verdict. */
  readonly summary: string;
  readonly citations: readonly Cfr[];
}

/**
 * What no license's progress checks yet. Each waits on an open decision or on
 * reading more than the regulation text, so the engine lists it instead of
 * guessing.
 */
export const NOT_CHECKED: readonly NotChecked[] = [
  {
    id: 'recency',
    label: 'Recent service',
    why: 'How recent the service must be is open decision D3.',
    cfr: [],
  },
  {
    id: 'role-credit',
    label: 'Which roles count',
    why: 'Which roles aboard count toward this license is open decision D4. Every role is shown, none is filtered.',
    cfr: [],
  },
  {
    id: 'tonnage-limit',
    label: "The license's tonnage limit",
    why: 'The tonnage a license is limited to depends on the vessels served on; that is open decision D5.',
    cfr: ['46 CFR 11.422'],
  },
  {
    id: 'same-day-watches',
    label: 'Separate watches on one day',
    why: '⚠️ Unverified: whether two shorter entries on one day add up to a day. Each entry is judged alone.',
    cfr: ['46 CFR 10.107'],
  },
  {
    id: 'exam',
    label: 'Exam',
    why: 'Not sea time. Tracked on the license screen later.',
    cfr: [],
  },
  {
    id: 'physical',
    label: 'Physical and medical certificate',
    why: 'Not sea time. Tracked on the license screen later.',
    cfr: [],
  },
  {
    id: 'drug-test',
    label: 'Drug test',
    why: 'Not sea time. Tracked on the license screen later.',
    cfr: [],
  },
  {
    id: 'twic',
    label: 'TWIC',
    why: 'Not sea time. Tracked on the license screen later.',
    cfr: [],
  },
];
