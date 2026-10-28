import { z } from 'zod';

// The prototype inventory (issue #72): every image the decision board shows,
// read from docs/prototypes/inventory.json. Ids are stable, so dots saved or
// exported today still match the same image after the inventory grows.
//
// Only design concepts and current-app screenshots go on the decision board.
// Comparison boards, decks, wireframes and documents are reference material:
// a comparison board's concepts are on the board one by one as extracted
// details, so adding the comparison board too would count them twice.

export const kinds = ['concept', 'app-screenshot', 'reference'] as const;
export type Kind = (typeof kinds)[number];

export const kindLabel: Record<Kind, string> = {
  concept: 'Visual concept',
  'app-screenshot': 'Current app',
  reference: 'Reference',
};

const itemSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    creator: z.string().min(1),
    source: z.string().min(1),
    style: z.string().min(1),
    feature: z.string().min(1),
    kind: z.enum(kinds),
    device: z.string().min(1),
    image: z.string().min(1).nullable(),
    /** The image's own pixel size, so a page can reserve its space before it loads. */
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    /** The image's dominant color, painted in its space until it loads. */
    color: z
      .string()
      .regex(/^#[0-9a-f]{6}$/)
      .optional(),
    availability: z.enum(['available', 'unavailable']),
    notes: z.string(),
    extractedFrom: z.string().optional(),
    document: z.string().optional(),
    /**
     * The interactive prototype this screenshot captures, at its stable URL: a
     * variant at /prototypes/live, a playable prototype page in
     * public/prototypes/play, or the game itself for a screenshot of the arcade
     * as built. /play opens every level with ?unlock=all.
     */
    interactive: z
      .string()
      .regex(
        /^\/prototypes\/live\/\?category=[a-z-]+&variant=[abc]$|^\/prototypes\/play\/[a-z0-9-]+\.html$|^\/play\/\?unlock=all$/,
      )
      .optional(),
  })
  .strict()
  .refine(
    (i) =>
      (i.image !== null) ===
      (i.width !== undefined && i.height !== undefined && i.color !== undefined),
    { message: 'an item with an image records its width, height and color, and only then' },
  )
  .refine(
    (i) => (i.availability === 'available') === (i.image !== null || i.document !== undefined),
    { message: 'an available item has an image or a document, and an unavailable one has neither' },
  );

const sourceSchema = z
  .object({ file: z.string(), sha256: z.string().regex(/^[0-9a-f]{64}$/), note: z.string() })
  .strict();

export const inventorySchema = z
  .object({
    schemaVersion: z.literal(1),
    question: z.string().min(1),
    sources: z.record(z.string(), sourceSchema),
    items: z.array(itemSchema).min(1),
  })
  .strict();

export type Inventory = z.infer<typeof inventorySchema>;
export type Item = z.infer<typeof itemSchema>;

export const parseInventory = (data: unknown): Inventory => inventorySchema.parse(data);

/** On the decision board: an available concept or current-app screenshot. */
export const isReviewable = (item: Item): boolean =>
  item.kind !== 'reference' && item.availability === 'available';

export const thumbnailPath = (item: Item): string | null =>
  item.image === null ? null : `docs/prototypes/thumbnails/${item.id}.jpg`;

/** The distinct values of a field, in first-seen order, for the filters. */
export function categories(items: readonly Item[], field: 'style' | 'feature'): string[] {
  return [...new Set(items.map((i) => i[field]))];
}

export interface Filter {
  readonly style: string;
  readonly feature: string;
}

export const ALL = '';

export const matches = (item: Item, filter: Filter): boolean =>
  (filter.style === ALL || item.style === filter.style) &&
  (filter.feature === ALL || item.feature === filter.feature);

const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');

/** docs/prototypes/INVENTORY.md, written by scripts/prototype-inventory.ts. */
export function inventoryMarkdown(inventory: Inventory): string {
  const { items } = inventory;
  const count = (pred: (i: Item) => boolean) => items.filter(pred).length;
  const lines = [
    '# Prototype inventory',
    '',
    '<!-- Generated from inventory.json by scripts/prototype-inventory.ts. Do not edit by hand. -->',
    '',
    `${items.length} items: ${count((i) => i.kind === 'concept')} visual concepts, ` +
      `${count((i) => i.kind === 'app-screenshot')} current-app screenshots and ` +
      `${count((i) => i.kind === 'reference')} reference items. ` +
      `${count(isReviewable)} are on the decision board at /prototypes/. ` +
      `${count((i) => i.availability === 'unavailable')} are unavailable.`,
    '',
    'Generated screens are visual concepts. Their lesson text and navigation diagrams need ' +
      'checking before anyone uses them to teach.',
    '',
    '## Sources',
    '',
    '| Source | File | SHA-256 | Note |',
    '| --- | --- | --- | --- |',
    ...Object.entries(inventory.sources).map(
      ([key, s]) => `| ${key} | ${cell(s.file)} | \`${s.sha256}\` | ${cell(s.note)} |`,
    ),
    '',
    '## Items',
    '',
    '| Id | Title | Kind | On the board | Creator | Style | Feature | Device | Image | Source | Notes |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...items
      .map((i) =>
        [
          `\`${i.id}\``,
          cell(i.title),
          kindLabel[i.kind],
          isReviewable(i) ? 'yes' : 'no',
          cell(i.creator),
          cell(i.style),
          cell(i.feature),
          cell(i.device),
          i.image !== null
            ? `[image](../../${i.image})`
            : i.document !== undefined
              ? `[PDF](../../${i.document})`
              : '**unavailable**',
          cell(i.extractedFrom ? `Extracted detail of \`${i.extractedFrom}\`` : i.source),
          cell(i.notes),
        ].join(' | '),
      )
      .map((row) => `| ${row} |`),
    '',
  ];
  return lines.join('\n');
}
