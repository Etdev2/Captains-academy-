// Interface color tokens for the arcade game (DECISIONS.md G15, proposed ADR
// 0008). The interface never uses red or green, because those colors mean port
// and starboard; only navigation-world art may draw them. Gold and electric blue
// mark wins, purple and white mark misses. docs/design/definitions-spec.md
// lists every pair below with its contrast ratio, and tests/palette.test.ts
// recomputes the ratios from this file.

export const PALETTE = {
  'ocean-900': '#06121f',
  'ocean-800': '#0b1a2b',
  'ocean-700': '#0f2236',
  'ink-100': '#eaf2fa',
  'ink-300': '#a9bdd1',
  'ink-400': '#8aa3bb',
  'line-500': '#5b82a8',
  'blue-300': '#8fd0ff',
  'blue-500': '#4fc3ff',
  'gold-500': '#f4d06f',
  'gold-tint': '#3a3418',
  'purple-300': '#c9b3ff',
  'purple-500': '#b48cff',
  'purple-tint': '#1e1240',
} as const;

export type Token = keyof typeof PALETTE;

/** Neutral colors for vessel drawings. Feedback colors (gold, blue, purple) stay out of the art. */
export const ART = {
  hull: 0xe8eef3,
  darkHull: 0x56636f,
  deck: 0x9aa8b4,
  cabin: 0xc9d3db,
  sail: 0xf4f6f8,
  line: 0xb8c6d2,
  wake: 0x8fd0ff,
  buoy: 0xc9a46a,
  smoke: 0x8d99a3,
  bank: 0x2a2f2a,
  bankEdge: 0x4a5048,
  highlight: 0xffffff,
} as const;

export interface ContrastPair {
  readonly fg: Token;
  readonly bg: Token;
  readonly where: string;
  /** Text needs 4.5:1, borders, icons and bars 3:1 (WCAG 2.x AA, 1.4.3 and 1.4.11). */
  readonly kind: 'text' | 'ui';
}

/** Every text and background pair the Definitions level draws. */
export const PAIRS: readonly ContrastPair[] = [
  { fg: 'ink-100', bg: 'ocean-900', where: 'Body text, level title, overlay text', kind: 'text' },
  {
    fg: 'ink-300',
    bg: 'ocean-900',
    where: 'Secondary text: progress count, hearts label',
    kind: 'text',
  },
  { fg: 'ink-100', bg: 'ocean-700', where: 'Cue under the art', kind: 'text' },
  { fg: 'ink-300', bg: 'ocean-700', where: 'Card meta text', kind: 'text' },
  { fg: 'blue-300', bg: 'ocean-700', where: 'Rule-set chip text on the card', kind: 'text' },
  { fg: 'blue-500', bg: 'ocean-700', where: 'Rule-set chip border', kind: 'ui' },
  { fg: 'ink-100', bg: 'ocean-800', where: 'Answer label, idle and pressed', kind: 'text' },
  { fg: 'ink-400', bg: 'ocean-800', where: 'Key hint digit on an answer', kind: 'text' },
  { fg: 'line-500', bg: 'ocean-900', where: 'Answer border against the page', kind: 'ui' },
  { fg: 'line-500', bg: 'ocean-800', where: 'Answer border against its own fill', kind: 'ui' },
  { fg: 'blue-300', bg: 'ocean-900', where: 'Focus ring', kind: 'ui' },
  { fg: 'ink-100', bg: 'gold-tint', where: 'Answer label, correct or answer state', kind: 'text' },
  {
    fg: 'gold-500',
    bg: 'gold-tint',
    where: '"Right" or "Answer" sublabel and check icon',
    kind: 'text',
  },
  {
    fg: 'gold-500',
    bg: 'ocean-900',
    where: 'Correct border and ring against the page',
    kind: 'ui',
  },
  {
    fg: 'ink-100',
    bg: 'purple-tint',
    where: 'Answer label, wrong state; explanation body',
    kind: 'text',
  },
  {
    fg: 'purple-300',
    bg: 'purple-tint',
    where: '"Your pick", "Not quite", "Comes back" lines',
    kind: 'text',
  },
  { fg: 'purple-500', bg: 'ocean-900', where: 'Wrong border against the page', kind: 'ui' },
  { fg: 'purple-500', bg: 'purple-tint', where: 'Countdown bar on the panel', kind: 'ui' },
  {
    fg: 'line-500',
    bg: 'purple-tint',
    where: 'Pause button and citation chip border on the panel',
    kind: 'ui',
  },
  { fg: 'ink-300', bg: 'purple-tint', where: 'Cue line inside the explanation', kind: 'text' },
  { fg: 'blue-300', bg: 'ocean-900', where: 'Citation chip text', kind: 'text' },
  {
    fg: 'gold-500',
    bg: 'ocean-900',
    where: 'Combo, points, star icons, cleared title',
    kind: 'text',
  },
  { fg: 'ink-400', bg: 'ocean-900', where: 'Lost heart and empty star outline', kind: 'ui' },
  {
    fg: 'ocean-900',
    bg: 'gold-500',
    where: 'Primary button label (Play again, Next)',
    kind: 'text',
  },
  { fg: 'blue-500', bg: 'ocean-700', where: 'Progress fill against its track', kind: 'ui' },
  { fg: 'ink-100', bg: 'ocean-800', where: 'Menu sheet text', kind: 'text' },
];

const channel = (v: number): number => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

/** WCAG 2.x relative luminance of a #rrggbb color. */
export function luminance(hex: string): number {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`not a #rrggbb color: ${hex}`);
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => channel(parseInt(h ?? '0', 16)));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

/** WCAG 2.x contrast ratio between two #rrggbb colors, from 1 to 21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

/** Hue in degrees and saturation from 0 to 1 (HSL), to keep red and green out of the interface. */
export function hueSaturation(hex: string): { hue: number; saturation: number } {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255) as [
    number,
    number,
    number,
  ];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  if (d === 0) return { hue: 0, saturation: 0 };
  const saturation = d / (1 - Math.abs(2 * l - 1));
  let hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  hue *= 60;
  if (hue < 0) hue += 360;
  return { hue, saturation };
}
