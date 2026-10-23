// A rapid-fire level (DECISIONS.md G7, G11, G12): one card at a time, the
// player taps an answer, and a missed card comes back a few cards later. Pure
// data in and data out, with a seeded shuffle, so a run can be replayed and
// tested without a browser.

export const HEARTS = 3;
/** A missed card comes back after this many other cards (G11). */
export const RETURN_AFTER = 3;
export const POINTS = 100;
/** The combo multiplies points up to this (G13). */
export const MAX_MULTIPLIER = 5;

export type RunOutcome = 'playing' | 'cleared' | 'out-of-hearts';

export interface RapidRun {
  /** Card ids still to show. The first one is on screen. */
  readonly queue: readonly string[];
  readonly hearts: number;
  readonly combo: number;
  readonly bestCombo: number;
  readonly score: number;
  readonly misses: number;
  /** Card ids missed at least once this run, in the order first missed. */
  readonly missed: readonly string[];
  readonly answered: number;
  readonly outcome: RunOutcome;
}

export interface Answered {
  readonly run: RapidRun;
  readonly correct: boolean;
  readonly points: number;
}

/** Mulberry32: a 32-bit seeded generator, the same in every browser. */
function generator(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
}

/** Fisher-Yates with the seeded generator. */
export function shuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  const next = generator(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = next() % (i + 1);
    const a = out[i];
    const b = out[j];
    if (a === undefined || b === undefined) continue;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

export function startRun(cardIds: readonly string[], seed: number): RapidRun {
  if (cardIds.length === 0) throw new Error('a run needs at least one card');
  return {
    queue: shuffle(cardIds, seed),
    hearts: HEARTS,
    combo: 0,
    bestCombo: 0,
    score: 0,
    misses: 0,
    missed: [],
    answered: 0,
    outcome: 'playing',
  };
}

export const currentCard = (run: RapidRun): string | undefined => run.queue[0];

/**
 * The "7 of 16" count: cards cleared plus the one on screen, over the deck size.
 * A missed card coming back does not change the total.
 */
export function progress(run: RapidRun, deckSize: number): { position: number; total: number } {
  const cleared = deckSize - run.queue.length;
  return { position: Math.min(deckSize, cleared + 1), total: deckSize };
}

/** Scores the answer to the card on screen and moves on. A finished run stays as it is. */
export function answer(run: RapidRun, correct: boolean): Answered {
  const card = currentCard(run);
  if (run.outcome !== 'playing' || card === undefined) return { run, correct: false, points: 0 };
  const rest = run.queue.slice(1);
  if (correct) {
    const combo = run.combo + 1;
    const points = POINTS * Math.min(combo, MAX_MULTIPLIER);
    return {
      correct,
      points,
      run: {
        ...run,
        queue: rest,
        combo,
        bestCombo: Math.max(run.bestCombo, combo),
        score: run.score + points,
        answered: run.answered + 1,
        outcome: rest.length === 0 ? 'cleared' : 'playing',
      },
    };
  }
  // The missed card goes back in the deck, RETURN_AFTER cards later (G11).
  const at = Math.min(RETURN_AFTER, rest.length);
  const queue = [...rest.slice(0, at), card, ...rest.slice(at)];
  const hearts = run.hearts - 1;
  return {
    correct,
    points: 0,
    run: {
      ...run,
      queue,
      hearts,
      combo: 0,
      misses: run.misses + 1,
      missed: run.missed.includes(card) ? run.missed : [...run.missed, card],
      answered: run.answered + 1,
      outcome: hearts <= 0 ? 'out-of-hearts' : 'playing',
    },
  };
}

export type RunStars = 0 | 1 | 2 | 3;

/**
 * G12: three for no misses inside par time, two for one miss, one for clearing
 * the level. Times are whole milliseconds, so a replay never depends on a float
 * (G1, ADR 0001).
 */
export function runStars(run: RapidRun, elapsedMs: number, parMs: number): RunStars {
  if (!Number.isSafeInteger(elapsedMs) || !Number.isSafeInteger(parMs)) {
    throw new Error('runStars takes whole milliseconds');
  }
  if (run.outcome !== 'cleared') return 0;
  if (run.misses === 0 && elapsedMs <= parMs) return 3;
  if (run.misses <= 1) return 2;
  return 1;
}
