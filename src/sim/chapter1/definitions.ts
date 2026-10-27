// Chapter 1, level 1: Definitions (DECISIONS.md G7). Each card is one vessel
// the player names with a Rule 3 term. Every cue, reason, citation and answer
// label below is copied word for word from
// docs/product/definitions-regs-check-2026-10-23.md, which uscg-regs checked
// against 33 CFR 83.03 and International Rule 3. Change one only together with
// that check.

export const LEVEL_ID = 'ch1-definitions';
/** Three stars need a clean run inside this time (G12), counting question time only. */
export const PAR_MS = 75_000;

/** The question over the answers (regs-check finding F2). */
export const QUESTION = 'Which Rule 3 term fits her best?';

/** The answers in the order the buttons show them. Keys 1 to 5 follow this order. */
export const CATEGORIES = [
  { id: 'power', label: 'Power-driven' },
  { id: 'sailing', label: 'Sailing' },
  { id: 'fishing', label: 'Engaged in fishing' },
  { id: 'nuc', label: 'Not under command' },
  { id: 'ram', label: 'Restricted in her ability to maneuver' },
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

export type RuleSet = 'both' | 'international';

export interface DefinitionCard {
  /** Also the mastery record's key, shared with the flashcards (G9). Never change one. */
  readonly id: string;
  readonly art: Art;
  /** One line under the drawing: what the player would see or know. */
  readonly cue: string;
  readonly answer: Category;
  /** The citation shown on the miss replay, as the regs check prints it. */
  readonly citation: string;
  /** One line for the replay after a miss (G11, G20). */
  readonly why: string;
  readonly ruleSet: RuleSet;
}

/** Level 1 is a shared level (G6): every card holds under Inland and International rules. */
export const LEVEL_RULE_SET: RuleSet = 'both';

export const DEFINITIONS: readonly DefinitionCard[] = [
  {
    id: 'rule3:motorboat',
    art: 'motorboat',
    cue: 'Motoring across the harbor',
    answer: 'power',
    citation: 'Rule 3(b), 33 CFR 83.03(b)',
    why: 'Any vessel driven by machinery is a power-driven vessel.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:container-ship',
    art: 'container-ship',
    cue: 'Container ship under way at sea',
    answer: 'power',
    citation: 'Rule 3(b), 33 CFR 83.03(b)',
    why: 'Size makes no difference: driven by machinery, she is power-driven.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:sailing',
    art: 'sailboat',
    cue: 'Sails full, engine off',
    answer: 'sailing',
    citation: 'Rule 3(c), 33 CFR 83.03(c)',
    why: 'Under sail with no engine in use: a sailing vessel.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:spinnaker',
    art: 'spinnaker',
    cue: 'Racing downwind under spinnaker',
    answer: 'sailing',
    citation: 'Rule 3(c), 33 CFR 83.03(c)',
    why: 'Any sail counts while the engine is not in use: a sailing vessel.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:motorsailing',
    art: 'motorsailer',
    cue: 'Sails up, engine running',
    answer: 'power',
    citation: 'Rule 3(b) and (c), 33 CFR 83.03(b) and (c)',
    why: 'With her engine in use she is power-driven, sails or not.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:sails-furled',
    art: 'sails-furled',
    cue: 'Sails furled, motoring home',
    answer: 'power',
    citation: 'Rule 3(b), 33 CFR 83.03(b)',
    why: 'A sailboat under engine alone is a power-driven vessel.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:trawler',
    art: 'trawler',
    cue: 'Towing a trawl net astern',
    answer: 'fishing',
    citation: 'Rule 3(d), 33 CFR 83.03(d)',
    why: 'She has an engine too, but a trawl that restricts her maneuvering makes her a vessel engaged in fishing.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:longliner',
    art: 'longliner',
    cue: 'Setting a longline over the stern',
    answer: 'fishing',
    citation: 'Rule 3(d), 33 CFR 83.03(d)',
    why: 'Lines that limit her maneuvering make her engaged in fishing.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:trolling',
    art: 'troller',
    cue: 'Motoring slowly, trolling two lines for salmon',
    answer: 'power',
    citation: 'Rule 3(b) and (d), 33 CFR 83.03(b) and (d)',
    why: 'Trolling lines do not restrict her maneuvering, so she is not engaged in fishing. Under engine, she is power-driven.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:engine-failed',
    art: 'drifting-ship',
    cue: 'Engine failed, drifting',
    answer: 'nuc',
    citation: 'Rule 3(f), 33 CFR 83.03(f)',
    why: 'An exceptional circumstance leaves her unable to maneuver: not under command.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:steering-failed',
    art: 'no-steering',
    cue: 'Steering gear broken, circling',
    answer: 'nuc',
    citation: 'Rule 3(f), 33 CFR 83.03(f)',
    why: 'A breakdown, not her work, stops her maneuvering: not under command.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:buoy-tender',
    art: 'buoy-tender',
    cue: 'Lifting a navigation buoy aboard',
    answer: 'ram',
    citation: 'Rule 3(g)(i), 33 CFR 83.03(g)(i)',
    why: 'Her work servicing a navigation mark limits her maneuvering: restricted.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:dredge',
    art: 'dredge',
    cue: 'Dredging the channel',
    answer: 'ram',
    citation: 'Rule 3(g)(ii), 33 CFR 83.03(g)(ii)',
    why: 'Dredging is work that limits her maneuvering: restricted.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:divers',
    art: 'dive-boat',
    cue: 'Tending divers working below',
    answer: 'ram',
    citation: 'Rule 3(g)(ii), 33 CFR 83.03(g)(ii)',
    why: 'Underwater operations limit her maneuvering: restricted.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:heavy-tow',
    art: 'heavy-tow',
    cue: 'Towing a heavy barge; she and her tow can hardly leave their course',
    answer: 'ram',
    citation: 'Rule 3(g)(vi), 33 CFR 83.03(g)(vi)',
    why: 'A tow that severely restricts her and her tow from leaving their course makes her restricted.',
    ruleSet: 'both',
  },
  {
    id: 'rule3:replenishment',
    art: 'replenishment',
    cue: 'Transferring cargo to another ship, under way',
    answer: 'ram',
    citation: 'Rule 3(g)(iii), 33 CFR 83.03(g)(iii)',
    why: 'Transferring cargo under way limits her maneuvering: restricted.',
    ruleSet: 'both',
  },
];

/**
 * Checked, but not played in level 1. Regs-check finding F1 moves it to the
 * International differences level (G6), which does not exist yet. Kept here so
 * its checked text and mastery key travel with the deck.
 */
export const CONSTRAINED_BY_DRAFT: Omit<DefinitionCard, 'answer'> & {
  readonly answerLabel: 'Constrained by her draft';
} = {
  id: 'rule3:deep-draft',
  art: 'deep-draft',
  cue: 'Deep tanker in a narrow channel, little water under her',
  answerLabel: 'Constrained by her draft',
  citation: 'Rule 3(h), International only',
  why: 'Her draft, against the depth and width of the channel, severely restricts her from leaving her course. The Inland Rules have no such term.',
  ruleSet: 'international',
};

export const categoryLabel = (id: Category): string =>
  CATEGORIES.find((c) => c.id === id)?.label ?? id;

export const cardById = (id: string): DefinitionCard | undefined =>
  DEFINITIONS.find((c) => c.id === id);
