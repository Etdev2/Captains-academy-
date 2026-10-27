import { shotOf, variantShots, type CategoryId } from './categories';
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
//
// Each section belongs to one of the five product categories, and opens with
// that category's interactive prototypes, A, B and C, when their screenshots
// are in the inventory. Their iPhone captures are the twins of the desktop ones.

export type SectionId =
  | 'home'
  | 'forms-license'
  | 'sea-time-logbook'
  | 'study'
  | 'definitions'
  | 'lights'
  | 'arcade'
  | 'night-harbor'
  | 'docking';

export interface Group {
  /** A subheading inside the section, or null when the section has one group. */
  readonly title: string | null;
  readonly ids: readonly string[];
  /** Captures of a tile's same screen on another device, opened from the viewer. */
  readonly twins?: Readonly<Record<string, string>>;
}

export interface AsBuilt {
  readonly id: string;
  /** The same moment captured on another device, opened from the viewer. */
  readonly twin?: string;
}

export interface Section {
  readonly id: SectionId;
  readonly title: string;
  readonly category: CategoryId;
  readonly groups: readonly Group[];
  readonly asBuilt: readonly AsBuilt[];
}

const defs = (n: number, moment: string): AsBuilt => ({
  id: `app-definitions-phone-390-${n}-${moment}`,
  twin: `app-definitions-desktop-wide-${n}-${moment}`,
});

/** The A/B/C interactive-prototype group of a category, with whichever captures exist. */
export function variantGroup(category: CategoryId): Group[] {
  const shots = variantShots.filter((s) => s.category === category && byId.has(s.desktop));
  if (shots.length === 0) return [];
  return [
    {
      title: 'Interactive prototypes · A, B, C',
      ids: shots.map((s) => s.desktop),
      twins: Object.fromEntries(
        shots.filter((s) => byId.has(s.iphone)).map((s) => [s.desktop, s.iphone]),
      ),
    },
  ];
}

export const sections: readonly Section[] = [
  {
    id: 'home',
    title: 'Home',
    category: 'console',
    groups: [
      ...variantGroup('console'),
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
  // Captain's Console mockups (night-bridge direction) of the license and
  // sea-time screens, each as a desktop and an iPhone view.
  {
    id: 'forms-license',
    title: 'Forms & License Navigator',
    category: 'license',
    groups: [
      ...variantGroup('license'),
      {
        title: 'License Navigator',
        ids: ['cl-console-license-navigator-desktop', 'cl-console-license-navigator-iphone'],
      },
      {
        title: 'Forms workspace',
        ids: ['cl-console-forms-workspace-desktop', 'cl-console-forms-workspace-iphone'],
      },
    ],
    asBuilt: [],
  },
  {
    id: 'sea-time-logbook',
    title: 'Sea-Time Logbook',
    category: 'sea-time',
    groups: [
      ...variantGroup('sea-time'),
      {
        title: null,
        ids: ['cl-console-sea-time-logbook-desktop', 'cl-console-sea-time-logbook-iphone'],
      },
    ],
    asBuilt: [],
  },
  {
    id: 'study',
    title: 'Study & Exam Prep',
    category: 'study',
    groups: variantGroup('study'),
    asBuilt: [],
  },
  {
    id: 'definitions',
    title: 'Definitions',
    category: 'study',
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
    category: 'study',
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
    id: 'arcade',
    title: 'Arcade & Simulations',
    category: 'arcade',
    groups: variantGroup('arcade'),
    asBuilt: [],
  },
  {
    id: 'night-harbor',
    title: 'Night Harbor',
    category: 'arcade',
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
    category: 'arcade',
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

/** The twin of a screenshot, either way round, if it has one. */
export function twinOf(id: string): Item | undefined {
  for (const s of sections) {
    for (const g of s.groups) {
      for (const [a, b] of Object.entries(g.twins ?? {})) {
        if (a === id) return item(b);
        if (b === id) return item(a);
      }
    }
    for (const a of s.asBuilt) {
      if (a.twin === undefined) continue;
      if (a.id === id) return item(a.twin);
      if (a.twin === id) return item(a.id);
    }
  }
  return undefined;
}

/** Every twin on the board: concepts reached from another tile's viewer. */
export const twinIds = (): string[] =>
  sections.flatMap((s) => [
    ...s.groups.flatMap((g) => Object.values(g.twins ?? {})),
    ...s.asBuilt.flatMap((a) => (a.twin ? [a.twin] : [])),
  ]);

/** The category of the section a concept or its twin sits in. */
export function categoryOf(id: string): CategoryId | undefined {
  for (const s of sections) {
    const ids = [
      ...s.groups.flatMap((g) => [...g.ids, ...Object.values(g.twins ?? {})]),
      ...s.asBuilt.flatMap((a) => (a.twin ? [a.id, a.twin] : [a.id])),
    ];
    if (ids.includes(id)) return s.category;
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
  const shot = shotOf(item.id);
  if (shot) return `${shot.letter} · ${shot.name}`;
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

/**
 * Concepts of one shape share a masonry grid sized for that shape, so a wide
 * strip never shrinks to the width of a phone screen beside it.
 */
export function shapeOf(item: Item): Shape {
  const ratio = (item.width ?? 4) / (item.height ?? 3);
  if (ratio >= 2.6) return 'wide';
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
