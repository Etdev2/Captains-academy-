// The sea-time rules engine (issue #42). Pure: it reads only what callers
// pass in (entries, vessels and a time zone) and never touches the page, the
// device's store, the network or the clock. It imports only from
// src/log/entry.ts. It shows progress toward a requirement and never a
// verdict: the National Maritime Center (NMC) decides.

import type { Rule } from './cfr';
import { DAY_RULES, MIDNIGHT_RULE, TWO_WATCH_NOTE } from './day-credit';
import { OUPV_RULES } from './oupv';
import { ALL_WATERS_RULES } from './waters-credit';

export * from './cfr';
export * from './day-credit';
export * from './oupv';
export * from './requirements';
export * from './waters-credit';

/** Every rule the engine has. A test checks that each cites 46 CFR. */
export const ALL_RULES: readonly Rule[] = [
  ...Object.values(DAY_RULES),
  TWO_WATCH_NOTE,
  MIDNIGHT_RULE,
  ...ALL_WATERS_RULES,
  ...OUPV_RULES,
];
