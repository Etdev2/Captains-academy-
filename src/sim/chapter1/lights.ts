// Chapter 1, level 2: Lights (DECISIONS.md G7). Each card shows the navigation
// lights of one vessel on a night horizon, seen from one angle, and the player
// names the vessel. Which lights show at that angle comes from Rule 21 in
// src/sim/navigation-lights.ts, never from the card. Every cue, reason and
// citation below is copied word for word from
// docs/product/lights-regs-check-2026-10-23.md, which `uscg-regs` checks
// against 33 CFR 83.20 to 83.31 and the International Rules. Change one only
// together with that check.
//
// The deck is validated when this module loads (ADR 0002), so a bad card fails
// every test and every build instead of reaching a player.

import { z } from 'zod';
import {
  isVisible,
  lateralOffset,
  type LightArc,
  type LightColor,
  type LightSpec,
} from '../navigation-lights';

export const LEVEL_ID = 'ch1-lights';
export const TITLE = '2 · Lights';
/** Three stars need a clean run inside this time (G12), counting question time only. */
export const PAR_MS = 80_000;

export const QUESTION = 'Which vessel shows these lights?';

/** The answers in the order the buttons show them. Keys 1 to 7 follow this order. */
export const CATEGORIES = [
  { id: 'power', label: 'Power-driven', phrase: 'a power-driven vessel under way' },
  { id: 'sailing', label: 'Sailing', phrase: 'a sailing vessel under way' },
  { id: 'towing', label: 'Towing', phrase: 'a power-driven vessel towing astern' },
  { id: 'fishing', label: 'Engaged in fishing', phrase: 'a vessel engaged in fishing' },
  { id: 'nuc', label: 'Not under command', phrase: 'a vessel not under command' },
  { id: 'anchor', label: 'At anchor', phrase: 'a vessel at anchor' },
  {
    id: 'ram',
    label: 'Restricted in her ability to maneuver',
    phrase: 'a vessel restricted in her ability to maneuver',
  },
] as const;

export type Category = (typeof CATEGORIES)[number]['id'];
const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [Category, ...Category[]];

export type RuleSet = 'both' | 'inland' | 'international';

/** One light on a vessel, with where it sits so a renderer can draw the pattern. */
export interface PatternLight extends LightSpec {
  /** Offset toward her starboard side, in drawing units. */
  readonly athwart: number;
  /** Offset toward her bow. */
  readonly fore: number;
  /** Height above the deck line; a higher number is higher on the mast. */
  readonly height: number;
}

const light = (
  id: string,
  color: LightColor,
  arc: LightArc,
  athwart: number,
  fore: number,
  height: number,
): PatternLight => ({ id, color, arc, athwart, fore, height });

const sidelights = (fore: number): PatternLight[] => [
  light('starboard', 'green', 'starboard', 2, fore, 1),
  light('port', 'red', 'port', -2, fore, 1),
];
const sternlight = (): PatternLight => light('stern', 'white', 'stern', 0, -5, 1);

/** The lights each kind of vessel carries. Rule 21 decides which of them show from where. */
export const PATTERNS = {
  power: [light('masthead', 'white', 'masthead', 0, 4, 3), ...sidelights(2), sternlight()],
  'power-long': [
    light('masthead-fwd', 'white', 'masthead', 0, 6, 3),
    light('masthead-aft', 'white', 'masthead', 0, -2, 5),
    ...sidelights(3),
    sternlight(),
  ],
  sailing: [...sidelights(2), sternlight()],
  'sailing-top': [
    light('top-red', 'red', 'all-round', 0, 0, 6),
    light('top-green', 'green', 'all-round', 0, 0, 5),
    ...sidelights(2),
    sternlight(),
  ],
  'towing-short': [
    light('masthead-1', 'white', 'masthead', 0, 4, 3),
    light('masthead-2', 'white', 'masthead', 0, 4, 4),
    ...sidelights(2),
    sternlight(),
    light('towing', 'yellow', 'stern', 0, -5, 2),
  ],
  'towing-long': [
    light('masthead-1', 'white', 'masthead', 0, 4, 3),
    light('masthead-2', 'white', 'masthead', 0, 4, 4),
    light('masthead-3', 'white', 'masthead', 0, 4, 5),
    ...sidelights(2),
    sternlight(),
    light('towing', 'yellow', 'stern', 0, -5, 2),
  ],
  trawling: [
    light('trawl-green', 'green', 'all-round', 0, 2, 5),
    light('trawl-white', 'white', 'all-round', 0, 2, 4),
    ...sidelights(2),
    sternlight(),
  ],
  fishing: [
    light('fish-red', 'red', 'all-round', 0, 2, 5),
    light('fish-white', 'white', 'all-round', 0, 2, 4),
    ...sidelights(2),
    sternlight(),
  ],
  'nuc-stopped': [
    light('nuc-upper', 'red', 'all-round', 0, 0, 5),
    light('nuc-lower', 'red', 'all-round', 0, 0, 4),
  ],
  'nuc-under-way': [
    light('nuc-upper', 'red', 'all-round', 0, 0, 5),
    light('nuc-lower', 'red', 'all-round', 0, 0, 4),
    ...sidelights(2),
    sternlight(),
  ],
  'ram-stopped': [
    light('ram-upper', 'red', 'all-round', 0, 0, 6),
    light('ram-middle', 'white', 'all-round', 0, 0, 5),
    light('ram-lower', 'red', 'all-round', 0, 0, 4),
  ],
  'ram-under-way': [
    light('ram-upper', 'red', 'all-round', 0, 2, 6),
    light('ram-middle', 'white', 'all-round', 0, 2, 5),
    light('ram-lower', 'red', 'all-round', 0, 2, 4),
    light('masthead', 'white', 'masthead', 0, 4, 3),
    ...sidelights(2),
    sternlight(),
  ],
  'anchor-small': [light('anchor', 'white', 'all-round', 0, 0, 3)],
  'anchor-long': [
    light('anchor-fwd', 'white', 'all-round', 0, 6, 4),
    light('anchor-aft', 'white', 'all-round', 0, -6, 2),
  ],
} as const satisfies Record<string, readonly PatternLight[]>;

export type PatternId = keyof typeof PATTERNS;
const PATTERN_IDS = Object.keys(PATTERNS) as [PatternId, ...PatternId[]];

/** What the bridge view draws for a card: a pattern seen from one aspect (Rule 21). */
export interface LightsArt {
  readonly pattern: PatternId;
  /** The observer's bearing from the vessel, relative to her heading, in 1,024-unit turns. */
  readonly aspect: number;
}

export interface LightsCard {
  /** Also the mastery record's key, shared with the flashcards (G9). Never change one. */
  readonly id: string;
  readonly art: LightsArt;
  /** One line under the drawing: where she is heading and whether she is moving. */
  readonly cue: string;
  readonly answer: Category;
  /** The citation shown on the miss replay and the right answer, as the regs check prints it. */
  readonly citation: string;
  /** One line for the replay after a miss (G11, G20). */
  readonly why: string;
  readonly ruleSet: RuleSet;
}

const cardSchema = z.object({
  id: z.string().regex(/^rule(2\d|3[01]):[a-z0-9-]+$/),
  art: z.object({
    pattern: z.enum(PATTERN_IDS),
    aspect: z.number().int().gt(-512).lte(512),
  }),
  cue: z.string().min(1),
  answer: z.enum(CATEGORY_IDS),
  // Rules 20 to 31 only. A shared card names the International rule and the Inland CFR section.
  citation: z.string().regex(/^Rule (2\d|3[01])(\(.+?\))*.*33 CFR 83\.(2\d|3[01])/),
  why: z.string().min(1),
  ruleSet: z.enum(['both', 'inland', 'international']),
});

const deckSchema = z
  .array(cardSchema)
  .min(1)
  .superRefine((cards, ctx) => {
    const seen = new Set<string>();
    cards.forEach((c, i) => {
      if (seen.has(c.id))
        ctx.addIssue({ code: 'custom', message: `duplicate id ${c.id}`, path: [i] });
      seen.add(c.id);
    });
    // Shared cards come first (G6): no shared card follows an Inland-only or International-only one.
    const firstFlagged = cards.findIndex((c) => c.ruleSet !== 'both');
    if (firstFlagged >= 0 && cards.slice(firstFlagged).some((c) => c.ruleSet === 'both')) {
      ctx.addIssue({ code: 'custom', message: 'shared cards must come first' });
    }
  });

const rawDeck: z.input<typeof deckSchema> = [
  {
    id: 'rule23:power-head-on',
    art: { pattern: 'power', aspect: 0 },
    cue: 'Heading straight at you',
    answer: 'power',
    citation: 'Rule 23(a), 33 CFR 83.23(a)',
    why: 'A masthead light with a red and a green sidelight: a power-driven vessel under way.',
    ruleSet: 'both',
  },
  {
    id: 'rule23:power-starboard-bow',
    art: { pattern: 'power', aspect: 128 },
    cue: 'Closing, her bow angled to your right',
    answer: 'power',
    citation: 'Rule 23(a), 33 CFR 83.23(a)',
    why: 'A masthead light with one sidelight: a power-driven vessel under way.',
    ruleSet: 'both',
  },
  {
    id: 'rule23:power-port-beam',
    art: { pattern: 'power', aspect: -256 },
    cue: 'Crossing, her bow pointing to your left',
    answer: 'power',
    citation: 'Rule 23(a), 33 CFR 83.23(a)',
    why: 'A masthead light with one sidelight: a power-driven vessel under way.',
    ruleSet: 'both',
  },
  {
    id: 'rule23:power-long',
    art: { pattern: 'power-long', aspect: -128 },
    cue: 'Closing, her bow angled to your left',
    answer: 'power',
    citation: 'Rule 23(a), 33 CFR 83.23(a)',
    why: 'Two masthead lights, the after one higher, with a sidelight: a power-driven vessel under way.',
    ruleSet: 'both',
  },
  {
    id: 'rule24:towing-short',
    art: { pattern: 'towing-short', aspect: 128 },
    cue: 'Closing, her bow angled to your right',
    answer: 'towing',
    citation: 'Rule 24(a), 33 CFR 83.24(a)',
    why: 'Two masthead lights in a vertical line with a sidelight: a power-driven vessel towing astern.',
    ruleSet: 'both',
  },
  {
    id: 'rule24:towing-long',
    art: { pattern: 'towing-long', aspect: -128 },
    cue: 'Closing, her bow angled to your left',
    answer: 'towing',
    citation: 'Rule 24(a), 33 CFR 83.24(a)',
    why: 'Three masthead lights in a vertical line with a sidelight: a power-driven vessel towing astern with a long tow.',
    ruleSet: 'both',
  },
  {
    id: 'rule24:towing-astern',
    art: { pattern: 'towing-short', aspect: 512 },
    cue: 'Heading away from you',
    answer: 'towing',
    citation: 'Rule 24(a), 33 CFR 83.24(a)',
    why: 'A yellow towing light above a white sternlight: a power-driven vessel towing astern.',
    ruleSet: 'both',
  },
  {
    id: 'rule25:sailing-head-on',
    art: { pattern: 'sailing', aspect: 0 },
    cue: 'Heading straight at you',
    answer: 'sailing',
    citation: 'Rule 25(a), 33 CFR 83.25(a)',
    why: 'A red and a green sidelight with no masthead light: a sailing vessel under way.',
    ruleSet: 'both',
  },
  {
    id: 'rule25:sailing-starboard-beam',
    art: { pattern: 'sailing', aspect: 256 },
    cue: 'Crossing, her bow pointing to your right',
    answer: 'sailing',
    citation: 'Rule 25(a), 33 CFR 83.25(a)',
    why: 'One sidelight and no masthead light: a sailing vessel under way.',
    ruleSet: 'both',
  },
  {
    id: 'rule25:sailing-red-over-green',
    art: { pattern: 'sailing-top', aspect: -128 },
    cue: 'Closing, her bow angled to your left',
    answer: 'sailing',
    citation: 'Rule 25(c), 33 CFR 83.25(c)',
    why: 'Red over green at the masthead, with a sidelight: a sailing vessel under way.',
    ruleSet: 'both',
  },
  {
    id: 'rule26:trawling-head-on',
    art: { pattern: 'trawling', aspect: 0 },
    cue: 'Making way, heading straight at you',
    answer: 'fishing',
    citation: 'Rule 26(b), 33 CFR 83.26(b)',
    why: 'Green over white, all-round, with sidelights: a vessel engaged in fishing, trawling.',
    ruleSet: 'both',
  },
  {
    id: 'rule26:trawling-starboard-beam',
    art: { pattern: 'trawling', aspect: 256 },
    cue: 'Crossing, her bow pointing to your right',
    answer: 'fishing',
    citation: 'Rule 26(b), 33 CFR 83.26(b)',
    why: 'Green over white, all-round, with a sidelight: a vessel engaged in fishing, trawling.',
    ruleSet: 'both',
  },
  {
    id: 'rule26:fishing-port-bow',
    art: { pattern: 'fishing', aspect: -128 },
    cue: 'Making way, her bow angled to your left',
    answer: 'fishing',
    citation: 'Rule 26(c), 33 CFR 83.26(c)',
    why: 'Red over white, all-round, with a sidelight: a vessel engaged in fishing, not trawling.',
    ruleSet: 'both',
  },
  {
    id: 'rule27:nuc-stopped',
    art: { pattern: 'nuc-stopped', aspect: 200 },
    cue: 'Not moving, no way on',
    answer: 'nuc',
    citation: 'Rule 27(a), 33 CFR 83.27(a)',
    why: 'Two red lights in a vertical line and no others: a vessel not under command, with no way on.',
    ruleSet: 'both',
  },
  {
    id: 'rule27:nuc-under-way',
    art: { pattern: 'nuc-under-way', aspect: 0 },
    cue: 'Making way, heading straight at you',
    answer: 'nuc',
    citation: 'Rule 27(a), 33 CFR 83.27(a)',
    why: 'Two red lights in a vertical line, with sidelights: a vessel not under command, making way.',
    ruleSet: 'both',
  },
  {
    id: 'rule27:ram-stopped',
    art: { pattern: 'ram-stopped', aspect: -200 },
    cue: 'Not moving, no way on',
    answer: 'ram',
    citation: 'Rule 27(b), 33 CFR 83.27(b)',
    why: 'Red, white, red in a vertical line and no others: a vessel restricted in her ability to maneuver, with no way on.',
    ruleSet: 'both',
  },
  {
    id: 'rule27:ram-under-way',
    art: { pattern: 'ram-under-way', aspect: 128 },
    cue: 'Making way, her bow angled to your right',
    answer: 'ram',
    citation: 'Rule 27(b), 33 CFR 83.27(b)',
    why: 'Red, white, red in a vertical line, with a masthead light and a sidelight: a vessel restricted in her ability to maneuver, making way.',
    ruleSet: 'both',
  },
  {
    id: 'rule30:anchor-small',
    art: { pattern: 'anchor-small', aspect: 0 },
    cue: 'Not moving, riding to her anchor',
    answer: 'anchor',
    citation: 'Rule 30(b), 33 CFR 83.30(b)',
    why: 'One white light seen all round: a vessel at anchor.',
    ruleSet: 'both',
  },
  {
    id: 'rule30:anchor-long',
    art: { pattern: 'anchor-long', aspect: 128 },
    cue: 'Not moving, riding to her anchor',
    answer: 'anchor',
    citation: 'Rule 30(a), 33 CFR 83.30(a)',
    why: 'Two white lights all round, the after one lower: a vessel at anchor.',
    ruleSet: 'both',
  },
];

export const LIGHTS: readonly LightsCard[] = deckSchema.parse(rawDeck) as LightsCard[];

/** Level 2 is a shared level (G6): every card holds under Inland and International rules. */
export const LEVEL_RULE_SET: RuleSet = 'both';

/**
 * Checked, but not played in level 2. Rule 28 is International only (the Inland
 * rule is reserved), so under G6 it belongs to the International differences
 * level, which does not exist yet. Kept so its checked text travels with the deck.
 */
export const CONSTRAINED_BY_DRAFT = {
  id: 'rule28:constrained-by-draft',
  cue: 'Deep tanker in a narrow channel, making way',
  answerLabel: 'Constrained by her draft',
  citation: 'Rule 28, International only',
  why: 'Three red lights in a vertical line, with her power-driven lights: a vessel constrained by her draft. The Inland Rules have no such vessel.',
  ruleSet: 'international',
} as const;

export const categoryLabel = (id: Category): string =>
  CATEGORIES.find((c) => c.id === id)?.label ?? id;

export const cardById = (id: string): LightsCard | undefined => LIGHTS.find((c) => c.id === id);

/** "Those are the lights of a vessel at anchor." The line the explanation panel leads with. */
export function answerLine(card: LightsCard): string {
  const phrase = CATEGORIES.find((c) => c.id === card.answer)?.phrase ?? card.answer;
  return `Those are the lights of ${phrase}.`;
}

/** The lights of a card that an observer can see: Rule 21 applied to its pattern and aspect. */
export function shownLights(art: LightsArt, overlap = 0): readonly PatternLight[] {
  return PATTERNS[art.pattern].filter((l) => isVisible(l, art.aspect, overlap));
}

/**
 * What a viewer can tell apart: the visible lights grouped by how far across
 * the view they sit (to the nearest drawing unit), left to right, each group
 * listed top down by color. Two vessels with the same picture cannot be told
 * apart by their lights from this angle.
 */
export function pictureOf(art: LightsArt, overlap = 0): string {
  const columns = new Map<number, PatternLight[]>();
  for (const l of shownLights(art, overlap)) {
    const x = lateralOffset(l.athwart, l.fore, art.aspect);
    columns.set(x, [...(columns.get(x) ?? []), l]);
  }
  return [...columns.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, ls]) =>
      ls
        .sort((p, q) => q.height - p.height)
        .map((l) => l.color)
        .join('/'),
    )
    .join(' | ');
}
