import { z } from 'zod';

// Ratings for the prototype review gallery (issue #72). Pure data in and data
// out, so the rules below are tested without a browser:
//
// - One current rating per reviewer per item. Saving again replaces it.
// - Scores are whole numbers from 1 to 10. An unrated item has no average; it is
//   never scored as zero.
// - Items with the same average share a rank and stay in inventory order. Ties
//   are not broken by the number of reviewers, so a tie is shown as a tie.
// - An export from one device merges into another. The newer rating wins for
//   each reviewer and item.

export const MIN_SCORE = 1;
export const MAX_SCORE = 10;
export const MAX_NAME = 60;
export const MAX_COMMENT = 2000;
export const FILE_KIND = 'captains-academy/prototype-ratings';

const reviewSchema = z
  .object({
    itemId: z.string().min(1).max(120),
    reviewer: z.string().trim().min(1).max(MAX_NAME),
    score: z.number().int().min(MIN_SCORE).max(MAX_SCORE),
    comment: z.string().max(MAX_COMMENT),
    favorite: z.boolean(),
    updatedAt: z.iso.datetime(),
  })
  .strict();

const fileSchema = z
  .object({
    kind: z.literal(FILE_KIND),
    version: z.literal(1),
    exportedAt: z.iso.datetime(),
    reviewer: z.string().optional(),
    reviews: z.array(reviewSchema),
  })
  .strict();

export type Review = z.infer<typeof reviewSchema>;

/** Parses saved ratings. Throws when they are not a list of valid ratings. */
export const parseReviews = (data: unknown): Review[] => z.array(reviewSchema).parse(data);
export type RatingsFile = z.infer<typeof fileSchema>;

/** Collapses spaces so " Ana  Lopez" and "Ana Lopez" display the same. */
export const displayName = (name: string): string => name.trim().replace(/\s+/g, ' ');

/** The key that decides whether two names are the same reviewer. */
export const reviewerKey = (name: string): string => displayName(name).toLowerCase();

const sameSlot = (a: Review, b: Review) =>
  a.itemId === b.itemId && reviewerKey(a.reviewer) === reviewerKey(b.reviewer);

/** Adds a rating, or replaces this reviewer's earlier rating of the same item. Throws on a bad rating. */
export function saveReview(book: readonly Review[], review: Review): Review[] {
  const clean = reviewSchema.parse({ ...review, reviewer: displayName(review.reviewer) });
  const at = book.findIndex((r) => sameSlot(r, clean));
  if (at === -1) return [...book, clean];
  return book.map((r, i) => (i === at ? clean : r));
}

export function myReview(book: readonly Review[], reviewer: string, itemId: string) {
  const key = reviewerKey(reviewer);
  if (key === '') return undefined;
  return book.find((r) => r.itemId === itemId && reviewerKey(r.reviewer) === key);
}

/** Other reviewers' scores stay hidden until this reviewer has rated the item. */
export const canSeeResults = (book: readonly Review[], reviewer: string, itemId: string) =>
  myReview(book, reviewer, itemId) !== undefined;

export interface Summary {
  readonly itemId: string;
  readonly count: number;
  readonly sum: number;
  /** Null when nobody has rated the item. */
  readonly average: number | null;
  /** How many reviewers gave each score; index 0 is a score of 1. */
  readonly distribution: readonly number[];
  readonly favorites: number;
  readonly comments: readonly { reviewer: string; text: string; updatedAt: string }[];
}

export function summarize(book: readonly Review[], itemId: string): Summary {
  const mine = book.filter((r) => r.itemId === itemId);
  const distribution = Array.from({ length: MAX_SCORE }, () => 0);
  let sum = 0;
  for (const r of mine) {
    sum += r.score;
    distribution[r.score - MIN_SCORE] = (distribution[r.score - MIN_SCORE] ?? 0) + 1;
  }
  return {
    itemId,
    count: mine.length,
    sum,
    average: mine.length === 0 ? null : sum / mine.length,
    distribution,
    favorites: mine.filter((r) => r.favorite).length,
    comments: mine
      .filter((r) => r.comment.trim() !== '')
      .map((r) => ({ reviewer: r.reviewer, text: r.comment.trim(), updatedAt: r.updatedAt })),
  };
}

export interface Ranked extends Summary {
  /** Shared by tied items, as in 1, 2, 2, 4. Null for an item nobody has rated. */
  readonly rank: number | null;
  readonly tied: boolean;
}

/** Compares averages exactly, by cross-multiplying, so 7/3 and 14/6 tie. */
const byAverage = (a: Summary, b: Summary) => b.sum * a.count - a.sum * b.count;

/**
 * Ranks the given items by average, highest first. Only these ids are ranked, so
 * reference boards and unavailable items stay out. Unrated items come last.
 */
export function rankItems(book: readonly Review[], itemIds: readonly string[]): Ranked[] {
  const summaries = itemIds.map((id) => summarize(book, id));
  const rated = summaries.filter((s) => s.count > 0).sort(byAverage);
  const unrated = summaries.filter((s) => s.count === 0);
  const ranked: Ranked[] = rated.map((s) => {
    const level = rated.filter((o) => byAverage(o, s) === 0);
    // The rank is one more than the number of items with a strictly higher average.
    const rank = rated.filter((o) => byAverage(o, s) < 0).length + 1;
    return { ...s, rank, tied: level.length > 1 };
  });
  return [...ranked, ...unrated.map((s) => ({ ...s, rank: null, tied: false }))];
}

/** A ratings file. With a reviewer, only that reviewer's ratings go in it. */
export function exportReviews(
  book: readonly Review[],
  reviewer: string | undefined,
  exportedAt: string,
): RatingsFile {
  const key = reviewer === undefined ? undefined : reviewerKey(reviewer);
  return {
    kind: FILE_KIND,
    version: 1,
    exportedAt,
    ...(reviewer === undefined ? {} : { reviewer: displayName(reviewer) }),
    reviews: book.filter((r) => key === undefined || reviewerKey(r.reviewer) === key),
  };
}

export interface ImportResult {
  readonly book: Review[];
  readonly added: number;
  readonly updated: number;
  /** Older than what this device has, or for an item the gallery does not list. */
  readonly skipped: number;
}

export class NotARatingsFileError extends Error {
  override readonly name = 'NotARatingsFileError';
  constructor() {
    super("This is not a Captain's Academy ratings file.");
  }
}

/** Merges a ratings file into the book. Throws NotARatingsFileError on anything else. */
export function importReviews(
  book: readonly Review[],
  text: string,
  knownIds: readonly string[],
): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new NotARatingsFileError();
  }
  const parsed = fileSchema.safeParse(data);
  if (!parsed.success) throw new NotARatingsFileError();

  const known = new Set(knownIds);
  let next = [...book];
  let added = 0;
  let updated = 0;
  let skipped = 0;
  for (const incoming of parsed.data.reviews) {
    if (!known.has(incoming.itemId)) {
      skipped++;
      continue;
    }
    const at = next.findIndex((r) => sameSlot(r, incoming));
    const current = next[at];
    if (current === undefined) {
      next.push(incoming);
      added++;
    } else if (Date.parse(incoming.updatedAt) > Date.parse(current.updatedAt)) {
      next = next.map((r, i) => (i === at ? incoming : r));
      updated++;
    } else {
      skipped++;
    }
  }
  return { book: next, added, updated, skipped };
}
