import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CATEGORIES, DEFINITIONS, PAR_SECONDS } from '../src/sim/chapter1/definitions';
import {
  HEARTS,
  MAX_MULTIPLIER,
  POINTS,
  RETURN_AFTER,
  answer,
  currentCard,
  runStars,
  shuffle,
  startRun,
} from '../src/sim/rapid';

// The rapid-fire run (issue #47) and the Chapter 1 Definitions deck.

const ids = ['a', 'b', 'c', 'd', 'e', 'f'];

describe('the run', () => {
  it('shuffles the same way for the same seed', () => {
    expect(startRun(ids, 7).queue).toEqual(startRun(ids, 7).queue);
    expect(shuffle(ids, 7)).not.toEqual(ids);
    expect([...shuffle(ids, 7)].sort()).toEqual(ids);
  });

  it('counts a right answer, builds the combo and moves on', () => {
    let run = startRun(ids, 1);
    for (let i = 1; i <= MAX_MULTIPLIER + 1; i++) {
      const r = answer(run, true);
      expect(r.points).toBe(POINTS * Math.min(i, MAX_MULTIPLIER));
      run = r.run;
    }
    expect(run.outcome).toBe('cleared');
    expect(run.bestCombo).toBe(ids.length);
  });

  it('costs a heart for a miss and brings the card back three cards later', () => {
    const run = startRun(ids, 3);
    const missed = currentCard(run);
    const r = answer(run, false);
    expect(r.correct).toBe(false);
    expect(r.run.hearts).toBe(HEARTS - 1);
    expect(r.run.combo).toBe(0);
    expect(r.run.queue[RETURN_AFTER]).toBe(missed);
    expect(r.run.queue).toHaveLength(ids.length);
  });

  it('brings the last card straight back when it is missed', () => {
    let run = startRun(['only'], 1);
    run = answer(run, false).run;
    expect(run.queue).toEqual(['only']);
    expect(run.outcome).toBe('playing');
  });

  it('ends the run when the hearts run out, and gives no stars', () => {
    let run = startRun(ids, 5);
    for (let i = 0; i < HEARTS; i++) run = answer(run, false).run;
    expect(run.outcome).toBe('out-of-hearts');
    expect(answer(run, true).run).toBe(run);
    expect(runStars(run, 10, PAR_SECONDS)).toBe(0);
  });

  it('gives three stars only for a clean run inside par', () => {
    let clean = startRun(ids, 2);
    while (clean.outcome === 'playing') clean = answer(clean, true).run;
    expect(runStars(clean, PAR_SECONDS, PAR_SECONDS)).toBe(3);
    expect(runStars(clean, PAR_SECONDS + 1, PAR_SECONDS)).toBe(2);
    let oneMiss = answer(startRun(ids, 2), false).run;
    while (oneMiss.outcome === 'playing') oneMiss = answer(oneMiss, true).run;
    expect(runStars(oneMiss, 1, PAR_SECONDS)).toBe(2);
    let twoMisses = answer(answer(startRun(ids, 2), false).run, false).run;
    while (twoMisses.outcome === 'playing') twoMisses = answer(twoMisses, true).run;
    expect(runStars(twoMisses, 1, PAR_SECONDS)).toBe(1);
  });
});

describe('the Definitions deck', () => {
  it('has unique ids that also key the mastery record', () => {
    const seen = new Set(DEFINITIONS.map((c) => c.id));
    expect(seen.size).toBe(DEFINITIONS.length);
    for (const c of DEFINITIONS) expect(c.id).toMatch(/^rule3:[a-z-]+$/);
  });

  it('uses every answer at least once and cites Rule 3 on every card', () => {
    const used = new Set(DEFINITIONS.map((c) => c.answer));
    expect([...used].sort()).toEqual(CATEGORIES.map((c) => c.id).sort());
    for (const c of DEFINITIONS) expect(c.rule).toMatch(/^Rule 3\([a-z]\)/);
  });

  it('marks constrained by draft as International only, and nothing else', () => {
    for (const c of DEFINITIONS) {
      expect(c.ruleSet === 'international').toBe(c.answer === 'cbd');
    }
  });

  it('keeps the trick cards: motor-sailing and trolling are power-driven', () => {
    const byId = new Map(DEFINITIONS.map((c) => [c.id, c]));
    expect(byId.get('rule3:motorsailing')?.answer).toBe('power');
    expect(byId.get('rule3:trolling')?.answer).toBe('power');
  });
});

describe('the verification answer key', () => {
  it('matches the deck, so the driver taps the button a player should', () => {
    const file = join(
      import.meta.dirname,
      '..',
      '.claude/skills/verify-captains-academy/features/steps/definitions.answers.json',
    );
    const key = JSON.parse(readFileSync(file, 'utf8')) as Record<string, number>;
    const expected = Object.fromEntries(
      DEFINITIONS.map((c) => [c.id, CATEGORIES.findIndex((k) => k.id === c.answer) + 1]),
    );
    expect(key).toEqual(expected);
  });
});
