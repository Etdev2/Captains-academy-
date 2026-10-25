import { z } from 'zod';

// The prototype inventory (issue #72): every image the review gallery shows,
// read from docs/prototypes/inventory.json. Ids are stable, so ratings saved or
// exported today still match the same image after the inventory grows.
//
// Only design concepts and current-app screenshots are rated and ranked.
// Comparison boards, decks, wireframes and documents are reference material:
// a board's concepts are rated one by one as extracted details, so rating the
// board too would count the same concept twice.

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
    availability: z.enum(['available', 'unavailable']),
    notes: z.string(),
    extractedFrom: z.string().optional(),
    document: z.string().optional(),
  })
  .strict()
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

/** Rated and ranked: an available concept or current-app screenshot. */
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
      `${count(isReviewable)} are rated in the review gallery at /prototypes/. ` +
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
    '| Id | Title | Kind | Rated | Creator | Style | Feature | Device | Image | Source | Notes |',
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
