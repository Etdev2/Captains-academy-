// The 46 CFR text the rules engine relies on, quoted, and the shape every
// rule shares. Read from eCFR (46 CFR 10.107, as amended through 89 FR
// 102332, Dec. 17, 2024) on Oct 21, 2026.
//
// The engine follows the regulation text only. National Maritime Center
// (NMC) policy documents are still unread, and the NMC decides every
// application.

/** 46 CFR 10.107, "Day", quoted in full. */
export const DAY_DEFINITION =
  "Day means, for the purpose of complying with the service requirements of this subchapter, 8 hours of watchstanding or day-working not to include overtime. On vessels authorized by 46 U.S.C. 8104 and § 15.705 of this subchapter, to operate a two-watch system, a 12-hour working day may be creditable as 1½ days of service. On vessels of less than 100 GRT, a day is considered as 8 hours unless the Coast Guard determines that the vessel's operating schedule makes this criteria inappropriate; in no case will this period be less than 4 hours.";

/** 46 CFR 10.107: "Month means 30 days, for the purpose of complying with the service requirements of this subchapter." */
export const DAYS_PER_MONTH = 30;

/** 46 CFR 10.107: "Year means 360 days for the purpose of complying with the service requirements of this subchapter." */
export const DAYS_PER_YEAR = 360;

/** A 46 CFR citation, such as "46 CFR 10.232(h)(3)". */
export type Cfr = `46 CFR ${string}`;

/** What every rule carries. A test fails if any rule's `cfr` is missing or malformed. */
export interface Rule {
  readonly id: string;
  /** The rule in plain words. */
  readonly text: string;
  /** Where the rule comes from. At least one 46 CFR section. */
  readonly cfr: readonly Cfr[];
}

/** A citation in the form the engine uses: "46 CFR" then a section, with optional paragraphs. */
export const CFR_FORMAT = /^46 CFR \d+\.\d+(\([a-z0-9]+\))*$/;
