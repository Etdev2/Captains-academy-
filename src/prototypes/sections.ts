import type { Item } from './inventory';
import { byId } from './round';

// How the decision board lays out its concepts: one section per screen, each
// with a sticky header, and the current app's screenshots folded into an
// "As built" row at the end of their section. Every concept on the board sits
// in exactly one place here; tests/prototype-sections.test.ts checks that.
//
// The Definitions screenshots exist twice, as a phone and a desktop capture of
// the same four moments. The board shows each moment once, as the phone
// capture, and the viewer links to its desktop twin. Both ids stay valid, so
// dots and notes saved on either still count.

export type SectionId = 'home' | 'definitions' | 'lights' | 'night-harbor' | 'docking';

export interface Group {
  /** A subheading inside the section, or null when the section has one group. */
  readonly title: string | null;
  readonly ids: readonly string[];
}

export interface AsBuilt {
  readonly id: string;
  /** The same moment captured on another device, opened from the viewer. */
  readonly twin?: string;
}

export interface Section {
  readonly id: SectionId;
  readonly title: string;
  readonly groups: readonly Group[];
  readonly asBuilt: readonly AsBuilt[];
}

const defs = (n: number, moment: string): AsBuilt => ({
  id: `app-definitions-phone-390-${n}-${moment}`,
  twin: `app-definitions-desktop-wide-${n}-${moment}`,
});

export const sections: readonly Section[] = [
  {
    id: 'home',
    title: 'Home',
    groups: [
      {
        title: null,
        ids: [
          'gpt-home-coastal-editorial',
          'gpt-home-precision-marine',
          'gpt-home-ocean-studio',
          'gpt-home-chart-house',
          'gpt-home-pacific-modern',
          'gpt-home-academy-fieldbook',
        ],
      },
    ],
    asBuilt: [],
  },
  {
    id: 'definitions',
    title: 'Definitions',
    groups: [
      {
        title: null,
        ids: [
          'gpt-definitions-chart-house',
          'gpt-definitions-precision-marine',
          'gpt-definitions-ocean-studio',
          'cl-mock-ch1-01-definitions',
        ],
      },
    ],
    asBuilt: [
      defs(1, 'first-card'),
      defs(2, 'correct'),
      defs(3, 'wrong-explanation'),
      defs(4, 'cleared'),
    ],
  },
  {
    id: 'lights',
    title: 'Lights',
    groups: [
      {
        title: null,
        ids: [
          'gpt-lights-chart-house',
          'gpt-lights-precision-marine',
          'gpt-lights-ocean-studio',
          'cl-mock-ch1-02-lights',
          'cl-mock-ch1-replay-lights-miss',
        ],
      },
    ],
    asBuilt: [],
  },
  {
    id: 'night-harbor',
    title: 'Night Harbor',
    groups: [
      {
        title: 'Chapter 1 levels',
        ids: [
          'cl-mock-ch1-map',
          'cl-mock-ch1-03-day-shapes',
          'cl-mock-ch1-04-horn-signals',
          'cl-mock-ch1-05-pecking-order',
          'cl-mock-ch1-replay-steering-miss',
          'cl-mock-ch1-boss-exam',
          'cl-mock-ch1-06-steady-bearing',
          'cl-mock-ch1-07-who-gives-way',
          'cl-mock-ch1-08-fog',
        ],
      },
      {
        title: 'Harbor Run',
        ids: [
          'cl-harbor-run-course',
          'cl-harbor-run-dredge-diamond-side',
          'cl-harbor-run-call-while-steering',
          'cl-harbor-run-finish-splits',
        ],
      },
      {
        title: 'Night Harbor Run',
        ids: [
          'cl-nhr-start-screen',
          'cl-nhr-head-on-lights',
          'cl-nhr-call-it-question',
          'cl-nhr-answer-and-rule',
          'cl-nhr-phone',
          'cl-nhr-crossing-from-starboard',
          'cl-nhr-sailing-vessel',
          'cl-nhr-day-leg-shapes',
          'cl-nhr-channel-dredge',
          'cl-nhr-tug-and-tow-from-astern',
          'cl-nhr-fog-leg',
        ],
      },
      {
        title: 'Prototype book',
        ids: ['gpt-book-dark-cleanup', 'gpt-book-light-alternate'],
      },
    ],
    asBuilt: [],
  },
  {
    id: 'docking',
    title: 'Docking',
    groups: [],
    asBuilt: [
      { id: 'app-level-1-docking-desktop' },
      { id: 'app-level-1-docking-phone-landscape' },
      { id: 'app-level-2-crosswind-slip' },
      { id: 'app-level-3-course-start' },
      { id: 'app-level-3-container-ship' },
      { id: 'app-level-3-hit-by-ship' },
    ],
  },
];

const item = (id: string): Item => {
  const found = byId.get(id);
  if (!found) throw new Error(`sections.ts names ${id}, which is not in the inventory.`);
  return found;
};

/** The twin of an as-built screenshot, either way round, if it has one. */
export function twinOf(id: string): Item | undefined {
  for (const s of sections) {
    for (const a of s.asBuilt) {
      if (a.twin === undefined) continue;
      if (a.id === id) return item(a.twin);
      if (a.twin === id) return item(a.id);
    }
  }
  return undefined;
}

/** Every concept that has its own tile on the board, in board order. */
export function tileIds(): string[] {
  return sections.flatMap((s) => [
    ...s.groups.flatMap((g) => g.ids),
    ...s.asBuilt.map((a) => a.id),
  ]);
}

// Short tile labels. The section header already names the screen, so a tile
// drops the prefix its title shares with the others in its section.
const prefixes = [
  /^Home:\s*/,
  /^Definitions lesson:\s*/,
  /^Lights lesson:\s*/,
  /^Mockup:\s*(Level \d+:\s*)?/,
  /^Night Harbor Run:\s*/,
  /^Prototype book:\s*/,
  /^Definitions as built:\s*/,
];

export function tileLabel(item: Item): string {
  let label = item.title;
  for (const p of prefixes) label = label.replace(p, '');
  // Keep the level number visible on the Chapter 1 mockups.
  const level = /^Mockup:\s*Level (\d+):/.exec(item.title);
  if (level) label = `${level[1]} · ${label}`;
  if (item.id.startsWith('app-definitions-')) {
    const step = /-(\d)-/.exec(item.id);
    if (step) label = `${step[1]} · ${label}`;
  }
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export type Shape = 'wide' | 'landscape' | 'portrait';

// A wide strip is a label, a desktop mockup and a phone mockup side by side,
// about five times wider than tall. On a phone its tile shows a 4:3 crop
// around the desktop mockup, cut from the original by
// scripts/prototype-thumbnails.py with these same numbers.
export const WIDE = 2.6;
export const CROP_RATIO = 4 / 3;
export const FOCUS = 0.31;

/** Where a wide strip's phone crop sits in it, as fractions of its width. */
export function cropOf(item: Item): { left: number; width: number } | undefined {
  const ratio = (item.width ?? 4) / (item.height ?? 3);
  if (ratio < WIDE || item.kind === 'reference') return undefined;
  const width = CROP_RATIO / ratio;
  return { left: FOCUS * (1 - width), width };
}

/**
 * Concepts of one shape share a masonry grid sized for that shape, so a wide
 * strip never shrinks to the width of a phone screen beside it.
 */
export function shapeOf(item: Item): Shape {
  const ratio = (item.width ?? 4) / (item.height ?? 3);
  if (ratio >= WIDE) return 'wide';
  if (ratio >= 1.15) return 'landscape';
  return 'portrait';
}

/** A group's items split by shape, the shapes in the order they first appear. */
export function byShape(items: readonly Item[]): { shape: Shape; items: Item[] }[] {
  const out: { shape: Shape; items: Item[] }[] = [];
  for (const i of items) {
    const shape = shapeOf(i);
    const bucket = out.find((b) => b.shape === shape);
    if (bucket) bucket.items.push(i);
    else out.push({ shape, items: [i] });
  }
  return out;
}

export interface LaidOutSection {
  readonly section: Section;
  readonly groups: readonly { title: string | null; buckets: { shape: Shape; items: Item[] }[] }[];
  readonly asBuilt: readonly Item[];
  readonly count: number;
}

/** The board's sections with only the concepts that pass `keep`, empty ones left out. */
export function layout(keep: (item: Item) => boolean): LaidOutSection[] {
  return sections
    .map((section) => {
      const groups = section.groups
        .map((g) => ({ title: g.title, buckets: byShape(g.ids.map(item).filter(keep)) }))
        .filter((g) => g.buckets.length > 0);
      const asBuilt = section.asBuilt.map((a) => item(a.id)).filter(keep);
      const count =
        groups.reduce((n, g) => n + g.buckets.reduce((m, b) => m + b.items.length, 0), 0) +
        asBuilt.length;
      return { section, groups, asBuilt, count };
    })
    .filter((s) => s.count > 0);
}

/** The order the viewer steps through: the order the tiles are shown in. */
export const order = (laidOut: readonly LaidOutSection[]): Item[] =>
  laidOut.flatMap((s) => [
    ...s.groups.flatMap((g) => g.buckets.flatMap((b) => b.items)),
    ...s.asBuilt,
  ]);
