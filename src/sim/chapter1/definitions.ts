// Chapter 1, level 1: Definitions (DECISIONS.md G7). Each card is one vessel
// the player names with a Rule 3 term. The reasons paraphrase Rule 3 of the
// Navigation Rules (COLREGS and the Inland Rules in 33 CFR 83). uscg-regs
// checks every card before launch (issue #47).

export const LEVEL_ID = 'ch1-definitions';
/** Three stars need a clean run inside this time (G12): about four seconds a card. */
export const PAR_SECONDS = 75;

export const CATEGORIES = [
  { id: 'power', label: 'Power-driven', note: '' },
  { id: 'sailing', label: 'Sailing', note: '' },
  { id: 'fishing', label: 'Engaged in fishing', note: '' },
  { id: 'nuc', label: 'Not under command', note: '' },
  { id: 'ram', label: 'Restricted in ability to maneuver', note: '' },
  { id: 'cbd', label: 'Constrained by her draft', note: 'International only' },
] as const;

export type Category = (typeof CATEGORIES)[number]['id'];

/** The top-down drawing for a card. src/game/rapid/vesselArt.ts draws each one. */
export type Art =
  | 'motorboat'
  | 'container-ship'
  | 'sailboat'
  | 'spinnaker'
  | 'motorsailer'
  | 'sails-furled'
  | 'trawler'
  | 'troller'
  | 'longliner'
  | 'drifting-ship'
  | 'no-steering'
  | 'buoy-tender'
  | 'dredge'
  | 'dive-boat'
  | 'heavy-tow'
  | 'replenishment'
  | 'deep-draft';

export interface DefinitionCard {
  /** Also the mastery record's key, shared with the flashcards (G9). */
  readonly id: string;
  readonly art: Art;
  /** One line under the drawing: what the player would see or know. */
  readonly cue: string;
  readonly answer: Category;
  readonly rule: string;
  /** One line for the replay after a miss (G11, G20). */
  readonly why: string;
  /** Which rule set the card holds under. Constrained by draft is International only. */
  readonly ruleSet: 'both' | 'international';
}

export const DEFINITIONS: readonly DefinitionCard[] = [
  {
    id: 'rule3:motorboat',
    art: 'motorboat',
    cue: 'Motoring across the harbor',
    answer: 'power',
    rule: 'Rule 3(b)',
    why: 'Any vessel driven by machinery is a power-driven vessel.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:container-ship',
    art: 'container-ship',
    cue: 'Container ship under way at sea',
    answer: 'power',
    rule: 'Rule 3(b)',
    why: 'Size makes no difference: driven by machinery, she is power-driven.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:sailing',
    art: 'sailboat',
    cue: 'Sails full, engine off',
    answer: 'sailing',
    rule: 'Rule 3(c)',
    why: 'Under sail with no engine in use: a sailing vessel.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:spinnaker',
    art: 'spinnaker',
    cue: 'Racing downwind under spinnaker',
    answer: 'sailing',
    rule: 'Rule 3(c)',
    why: 'Any sail counts while the engine is not in use: a sailing vessel.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:motorsailing',
    art: 'motorsailer',
    cue: 'Sails up, engine running',
    answer: 'power',
    rule: 'Rule 3(c)',
    why: 'With her engine in use she is power-driven, sails or not.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:sails-furled',
    art: 'sails-furled',
    cue: 'Sails furled, motoring home',
    answer: 'power',
    rule: 'Rule 3(b)',
    why: 'A sailboat under engine alone is a power-driven vessel.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:trawler',
    art: 'trawler',
    cue: 'Towing a trawl net astern',
    answer: 'fishing',
    rule: 'Rule 3(d)',
    why: 'Her trawl limits how she can maneuver: engaged in fishing.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:longliner',
    art: 'longliner',
    cue: 'Setting a longline over the stern',
    answer: 'fishing',
    rule: 'Rule 3(d)',
    why: 'Lines that limit her maneuvering make her engaged in fishing.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:trolling',
    art: 'troller',
    cue: 'Trolling two lines for salmon',
    answer: 'power',
    rule: 'Rule 3(d)',
    why: 'Trolling lines do not limit maneuvering, so she is not engaged in fishing. She is power-driven.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:engine-failed',
    art: 'drifting-ship',
    cue: 'Engine failed, drifting',
    answer: 'nuc',
    rule: 'Rule 3(f)',
    why: 'An exceptional circumstance leaves her unable to maneuver: not under command.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:steering-failed',
    art: 'no-steering',
    cue: 'Steering gear broken, circling',
    answer: 'nuc',
    rule: 'Rule 3(f)',
    why: 'A breakdown, not her work, stops her maneuvering: not under command.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:buoy-tender',
    art: 'buoy-tender',
    cue: 'Lifting a navigation buoy aboard',
    answer: 'ram',
    rule: 'Rule 3(g)(i)',
    why: 'Her work servicing a navigation mark limits her maneuvering: restricted.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:dredge',
    art: 'dredge',
    cue: 'Dredging the channel',
    answer: 'ram',
    rule: 'Rule 3(g)(ii)',
    why: 'Dredging is work that limits her maneuvering: restricted.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:divers',
    art: 'dive-boat',
    cue: 'Tending divers working below',
    answer: 'ram',
    rule: 'Rule 3(g)(ii)',
    why: 'Underwater operations limit her maneuvering: restricted.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:heavy-tow',
    art: 'heavy-tow',
    cue: "Heavy tow: she can't turn off her course",
    answer: 'ram',
    rule: 'Rule 3(g)(vi)',
    why: 'A tow that severely limits turning from her course makes her restricted.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:replenishment',
    art: 'replenishment',
    cue: 'Transferring cargo to another ship, under way',
    answer: 'ram',
    rule: 'Rule 3(g)(iii)',
    why: 'Transferring cargo under way limits her maneuvering: restricted.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:deep-draft',
    art: 'deep-draft',
    cue: 'Deep tanker in a narrow channel, little water under her',
    answer: 'cbd',
    rule: 'Rule 3(h), International',
    why: 'Her draft against the depth and width of water pins her to her course. Inland rules have no such term.',
    ruleSet: 'international',
  },
];

export const categoryLabel = (id: Category): string =>
  CATEGORIES.find((c) => c.id === id)?.label ?? id;
