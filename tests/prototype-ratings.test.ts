import { describe, expect, it } from 'vitest';
import {
  canSeeResults,
  exportReviews,
  importReviews,
  rankItems,
  reviewerKey,
  saveReview,
  summarize,
  type Review,
} from '../src/prototypes/ratings';

// The prototype review gallery's ratings (issue #72): one current rating per
// reviewer per item, 1 to 10, unrated is not zero, ties stay ties, and a file
// exported on one device merges into another.

const at = (minute: number) => `2026-10-25T15:${String(minute).padStart(2, '0')}:00.000Z`;
const review = (over: Partial<Review>): Review => ({
  itemId: 'a',
  reviewer: 'Ana',
  score: 7,
  comment: '',
  favorite: false,
  updatedAt: at(0),
  ...over,
});

describe('saving a rating', () => {
  it('keeps one current rating per reviewer and item, so a change replaces the old one', () => {
    let book = saveReview([], review({ score: 4 }));
    book = saveReview(book, review({ score: 9, updatedAt: at(5) }));
    expect(book).toHaveLength(1);
    expect(book[0]?.score).toBe(9);
  });

  it('treats the same name typed differently as the same reviewer', () => {
    expect(reviewerKey('  Ana   Lopez ')).toBe(reviewerKey('ana lopez'));
    const book = saveReview(
      saveReview([], review({ reviewer: 'Ana Lopez' })),
      review({ reviewer: ' ana  lopez', score: 2 }),
    );
    expect(book).toHaveLength(1);
  });

  it('rejects a score outside 1 to 10 or a missing name', () => {
    expect(() => saveReview([], review({ score: 0 }))).toThrow();
    expect(() => saveReview([], review({ score: 11 }))).toThrow();
    expect(() => saveReview([], review({ score: 6.5 }))).toThrow();
    expect(() => saveReview([], review({ reviewer: '  ' }))).toThrow();
  });
});

describe('results', () => {
  const book: Review[] = [
    review({ itemId: 'a', reviewer: 'Ana', score: 8, favorite: true, comment: 'Calm and clear' }),
    review({ itemId: 'a', reviewer: 'Ben', score: 6 }),
    review({ itemId: 'b', reviewer: 'Ana', score: 7 }),
    review({ itemId: 'b', reviewer: 'Ben', score: 7 }),
    review({ itemId: 'c', reviewer: 'Ana', score: 10 }),
    review({ itemId: 'board', reviewer: 'Ana', score: 10 }),
  ];
  const rankable = ['a', 'b', 'c', 'd'];

  it('gives the average, the number of reviewers, the 1 to 10 spread, favorites and comments', () => {
    const a = summarize(book, 'a');
    expect(a.count).toBe(2);
    expect(a.average).toBe(7);
    expect(a.distribution).toEqual([0, 0, 0, 0, 0, 1, 0, 1, 0, 0]);
    expect(a.favorites).toBe(1);
    expect(a.comments).toEqual([{ reviewer: 'Ana', text: 'Calm and clear', updatedAt: at(0) }]);
  });

  it('leaves an unrated item without an average instead of scoring it zero', () => {
    const d = summarize(book, 'd');
    expect(d.count).toBe(0);
    expect(d.average).toBeNull();
    const ranked = rankItems(book, rankable);
    expect(ranked.at(-1)).toMatchObject({ itemId: 'd', rank: null });
  });

  it('ranks only the reviewable items and shares a rank on a tie', () => {
    const ranked = rankItems(book, rankable);
    expect(ranked.map((r) => r.itemId)).toEqual(['c', 'a', 'b', 'd']);
    // a and b both average 7.
    expect(ranked.map((r) => [r.rank, r.tied])).toEqual([
      [1, false],
      [2, true],
      [2, true],
      [null, false],
    ]);
    expect(ranked.some((r) => r.itemId === 'board')).toBe(false);
  });

  it("hides an item's results until this reviewer has rated it", () => {
    expect(canSeeResults(book, 'Ana', 'a')).toBe(true);
    expect(canSeeResults(book, 'ana', 'a')).toBe(true);
    expect(canSeeResults(book, 'Cy', 'a')).toBe(false);
    expect(canSeeResults(book, '', 'a')).toBe(false);
  });
});

describe('export and import', () => {
  const known = ['a', 'b'];

  it("round-trips one reviewer's ratings", () => {
    const mine = [
      review({ itemId: 'a', score: 3 }),
      review({ itemId: 'b', reviewer: 'Ben', score: 5 }),
    ];
    const file = exportReviews(mine, 'Ana', at(30));
    expect(file.reviews).toHaveLength(1);
    const result = importReviews([], JSON.stringify(file), known);
    expect(result.book).toEqual([mine[0]]);
    expect(result.added).toBe(1);
  });

  it('keeps the newer of two ratings for the same reviewer and item', () => {
    const older = review({ score: 2, updatedAt: at(1) });
    const newer = review({ score: 9, updatedAt: at(9) });
    const fromNewer = importReviews(
      [older],
      JSON.stringify(exportReviews([newer], undefined, at(30))),
      known,
    );
    expect(fromNewer.book).toEqual([newer]);
    expect(fromNewer.updated).toBe(1);
    const fromOlder = importReviews(
      [newer],
      JSON.stringify(exportReviews([older], undefined, at(30))),
      known,
    );
    expect(fromOlder.book).toEqual([newer]);
    expect(fromOlder.skipped).toBe(1);
  });

  it('skips ratings for items the gallery does not know, and refuses a file that is not a ratings export', () => {
    const file = exportReviews([review({ itemId: 'gone' })], undefined, at(30));
    expect(importReviews([], JSON.stringify(file), known)).toMatchObject({ added: 0, skipped: 1 });
    expect(() => importReviews([], '{"hello":1}', known)).toThrow(
      /not a Captain's Academy ratings file/,
    );
    expect(() => importReviews([], 'not json', known)).toThrow(
      /not a Captain's Academy ratings file/,
    );
  });
});
