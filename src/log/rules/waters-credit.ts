// Which waters count toward the part of a license's service that must be on
// particular waters. For OUPV near coastal, that part is service on ocean or
// near-coastal waters (46 CFR 11.467(c)). For near-coastal endorsements,
// Great Lakes service is credited day for day, and other inland service only
// up to half (46 CFR 10.232(b), 11.211(b), per the uscg-regs research on
// issue #30). Inland service is left out of the part until that 50% limit is
// applied; see NOT_CHECKED. Every value of WATERS has a rule.

import { WATERS, type Waters } from '../entry';
import type { Rule } from './cfr';

export interface WatersRule extends Rule {
  readonly waters: Waters;
  /** True when service on these waters counts as ocean or near-coastal service. */
  readonly oceansOrNearCoastal: boolean;
}

export const WATERS_RULES: Readonly<Record<Waters, WatersRule>> = {
  oceans: {
    id: 'waters.oceans',
    waters: 'oceans',
    oceansOrNearCoastal: true,
    text: 'Oceans: seaward of the Boundary Lines. Counts as ocean or near-coastal service.',
    cfr: ['46 CFR 10.107', '46 CFR 11.467(c)'],
  },
  'near-coastal': {
    id: 'waters.near-coastal',
    waters: 'near-coastal',
    oceansOrNearCoastal: true,
    text: 'Near coastal: ocean waters up to 200 miles offshore. Counts as ocean or near-coastal service.',
    cfr: ['46 CFR 10.107', '46 CFR 11.467(c)'],
  },
  'inside-passage': {
    id: 'waters.inside-passage',
    waters: 'inside-passage',
    oceansOrNearCoastal: true,
    text: 'Inside Passage (Puget Sound to Cape Spencer): credited as near-coastal service, not as oceans.',
    cfr: ['46 CFR 10.232(b)(3)', '46 CFR 11.467(c)'],
  },
  'great-lakes': {
    id: 'waters.great-lakes',
    waters: 'great-lakes',
    oceansOrNearCoastal: true,
    text: 'Great Lakes: credited day for day toward the ocean or near-coastal part of a near-coastal endorsement.',
    cfr: ['46 CFR 10.107', '46 CFR 10.232(b)', '46 CFR 11.211(b)', '46 CFR 11.467(c)'],
  },
  inland: {
    id: 'waters.inland',
    waters: 'inland',
    oceansOrNearCoastal: false,
    text: 'Inland: counts toward total operating experience. Not yet counted toward the ocean or near-coastal part (see not checked).',
    cfr: ['46 CFR 10.107', '46 CFR 11.467(c)'],
  },
  'western-rivers': {
    id: 'waters.western-rivers',
    waters: 'western-rivers',
    oceansOrNearCoastal: false,
    text: 'Western Rivers: counts toward total operating experience. Not yet counted toward the ocean or near-coastal part (see not checked).',
    cfr: ['46 CFR 10.107', '46 CFR 11.467(c)'],
  },
  rivers: {
    id: 'waters.rivers',
    waters: 'rivers',
    oceansOrNearCoastal: false,
    text: 'Rivers: counts toward total operating experience. Not yet counted toward the ocean or near-coastal part (see not checked).',
    cfr: ['46 CFR 10.107', '46 CFR 11.467(c)'],
  },
};

/** Every waters value, in the order WATERS lists them. */
export const ALL_WATERS_RULES: readonly WatersRule[] = WATERS.map((waters) => WATERS_RULES[waters]);
