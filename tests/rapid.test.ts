import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  CONSTRAINED_BY_DRAFT,
  DEFINITIONS,
  LEVEL_RULE_SET,
  PAR_MS,
  QUESTION,
  categoryLabel,
  type Category,
} from '../src/sim/chapter1/definitions';
import {
  HEARTS,
  MAX_MULTIPLIER,
  POINTS,
  RETURN_AFTER,
  answer,
  currentCard,
  progress,
  runStars,
  shuffle,
  startRun,
  type RapidRun,
} from '../src/sim/rapid';

// The rapid-fire run (issue #47) and the Chapter 1 Definitions deck.

const root = join(import.meta.dirname, '..');
const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
const playOut = (run: RapidRun): RapidRun => {
  let r = run;
  while (r.outcome === 'playing') r = answer(r, true).run;
  return r;
};

describe('the run', () => {
  it('shuffles the same way for the same seed, and keeps every card', () => {
    expect(startRun(ids, 7).queue).toEqual(startRun(ids, 7).queue);
    expect(shuffle(ids, 7)).not.toEqual(ids);
    expect([...shuffle(ids, 7)].sort()).toEqual(ids);
    expect(shuffle(ids, 7)).not.toEqual(shuffle(ids, 8));
  });

  it('pins the shuffle so a golden run never drifts', () => {
    expect(shuffle(ids, 47)).toEqual(shuffle([...ids], 47));
    expect(
      startRun(
        DEFINITIONS.map((c) => c.id),
        1,
      ).queue,
    ).toMatchInlineSnapshot(`
      [
        "rule3:steering-failed",
        "rule3:sails-furled",
        "rule3:sailing",
        "rule3:trawler",
        "rule3:divers",
        "rule3:dredge",
        "rule3:container-ship",
        "rule3:motorboat",
        "rule3:engine-failed",
        "rule3:motorsailing",
        "rule3:trolling",
        "rule3:heavy-tow",
        "rule3:longliner",
        "rule3:buoy-tender",
        "rule3:replenishment",
        "rule3:spinnaker",
      ]
    `);
  });

  it('rejects an empty deck', () => {
    expect(() => startRun([], 1)).toThrow();
  });

  it('scores 100 times the combo, capped at five times', () => {
    let run = startRun(ids, 1);
    let total = 0;
    for (let i = 1; i <= ids.length; i++) {
      const r = answer(run, true);
      expect(r.correct).toBe(true);
      expect(r.points).toBe(POINTS * Math.min(i, MAX_MULTIPLIER));
      total += r.points;
      expect(r.run.score).toBe(total);
      expect(r.run.combo).toBe(i);
      run = r.run;
    }
    expect(total).toBe(100 + 200 + 300 + 400 + 500 + 500);
    expect(run.outcome).toBe('cleared');
    expect(run.bestCombo).toBe(ids.length);
  });

  it('costs a heart for a miss, resets the combo and brings the card back three cards later', () => {
    const run = answer(startRun(ids, 3), true).run;
    const missed = currentCard(run);
    const r = answer(run, false);
    expect(r.correct).toBe(false);
    expect(r.points).toBe(0);
    expect(r.run.hearts).toBe(HEARTS - 1);
    expect(r.run.combo).toBe(0);
    expect(r.run.bestCombo).toBe(1);
    expect(r.run.score).toBe(run.score);
    expect(r.run.queue[RETURN_AFTER]).toBe(missed);
    expect(r.run.queue).toHaveLength(run.queue.length);
    expect(r.run.missed).toEqual([missed]);
  });

  it('lists a card missed twice only once', () => {
    let run = answer(startRun(['x', 'y'], 1), false).run;
    const first = run.missed[0];
    while (currentCard(run) !== first) run = answer(run, true).run;
    run = answer(run, false).run;
    expect(run.missed).toEqual([first]);
    expect(run.misses).toBe(2);
  });

  it('brings the last card straight back when it is missed', () => {
    const run = answer(startRun(['only'], 1), false).run;
    expect(run.queue).toEqual(['only']);
    expect(run.outcome).toBe('playing');
  });

  it('ends the run when the hearts run out, and gives no stars', () => {
    let run = startRun(ids, 5);
    for (let i = 0; i < HEARTS; i++) run = answer(run, false).run;
    expect(run.outcome).toBe('out-of-hearts');
    expect(answer(run, true).run).toBe(run);
    expect(runStars(run, 10, PAR_MS)).toBe(0);
  });

  it('counts progress as cleared cards plus the one on screen', () => {
    let run = startRun(ids, 4);
    expect(progress(run, ids.length)).toEqual({ position: 1, total: 6 });
    run = answer(run, true).run;
    expect(progress(run, ids.length)).toEqual({ position: 2, total: 6 });
    run = answer(run, false).run;
    expect(progress(run, ids.length)).toEqual({ position: 2, total: 6 });
    run = playOut(run);
    expect(progress(run, ids.length)).toEqual({ position: 6, total: 6 });
  });

  it('gives three stars only for a clean run inside par', () => {
    const clean = playOut(startRun(ids, 2));
    expect(runStars(clean, PAR_MS, PAR_MS)).toBe(3);
    expect(runStars(clean, PAR_MS + 1, PAR_MS)).toBe(2);
    const oneMiss = playOut(answer(startRun(ids, 2), false).run);
    expect(runStars(oneMiss, 1, PAR_MS)).toBe(2);
    const twoMisses = playOut(answer(answer(startRun(ids, 2), false).run, false).run);
    expect(runStars(twoMisses, 1, PAR_MS)).toBe(1);
  });

  it('takes whole milliseconds only, so no float reaches a replay', () => {
    const clean = playOut(startRun(ids, 2));
    expect(() => runStars(clean, 1.5, PAR_MS)).toThrow();
    expect(() => runStars(clean, 1, 75.5)).toThrow();
    expect(Number.isSafeInteger(PAR_MS)).toBe(true);
  });
});

describe('the Definitions deck', () => {
  const regs = readFileSync(
    join(root, 'docs/product/definitions-regs-check-2026-10-23.md'),
    'utf8',
  );

  it('has 16 shared cards with unique ids that also key the mastery record', () => {
    expect(DEFINITIONS).toHaveLength(16);
    expect(new Set(DEFINITIONS.map((c) => c.id)).size).toBe(16);
    for (const c of DEFINITIONS) expect(c.id).toMatch(/^rule3:[a-z-]+$/);
  });

  it('plays only shared cards in this shared level (G6, regs-check F1)', () => {
    expect(LEVEL_RULE_SET).toBe('both');
    for (const c of DEFINITIONS) expect(c.ruleSet).toBe('both');
    expect(DEFINITIONS.some((c) => c.id === CONSTRAINED_BY_DRAFT.id)).toBe(false);
    expect(CONSTRAINED_BY_DRAFT.ruleSet).toBe('international');
  });

  it('uses every answer at least once and has no red-herring answer', () => {
    const used = new Set(DEFINITIONS.map((c) => c.answer));
    expect([...used].sort()).toEqual(CATEGORIES.map((c) => c.id).sort());
  });

  it('asks for the best-fitting term (regs-check F2)', () => {
    expect(QUESTION).toBe('Which Rule 3 term fits her best?');
  });

  const expected: Record<string, [Category, string]> = {
    'rule3:motorboat': ['power', 'Rule 3(b), 33 CFR 83.03(b)'],
    'rule3:container-ship': ['power', 'Rule 3(b), 33 CFR 83.03(b)'],
    'rule3:sailing': ['sailing', 'Rule 3(c), 33 CFR 83.03(c)'],
    'rule3:spinnaker': ['sailing', 'Rule 3(c), 33 CFR 83.03(c)'],
    'rule3:motorsailing': ['power', 'Rule 3(b) and (c), 33 CFR 83.03(b) and (c)'],
    'rule3:sails-furled': ['power', 'Rule 3(b), 33 CFR 83.03(b)'],
    'rule3:trawler': ['fishing', 'Rule 3(d), 33 CFR 83.03(d)'],
    'rule3:longliner': ['fishing', 'Rule 3(d), 33 CFR 83.03(d)'],
    'rule3:trolling': ['power', 'Rule 3(b) and (d), 33 CFR 83.03(b) and (d)'],
    'rule3:engine-failed': ['nuc', 'Rule 3(f), 33 CFR 83.03(f)'],
    'rule3:steering-failed': ['nuc', 'Rule 3(f), 33 CFR 83.03(f)'],
    'rule3:buoy-tender': ['ram', 'Rule 3(g)(i), 33 CFR 83.03(g)(i)'],
    'rule3:dredge': ['ram', 'Rule 3(g)(ii), 33 CFR 83.03(g)(ii)'],
    'rule3:divers': ['ram', 'Rule 3(g)(ii), 33 CFR 83.03(g)(ii)'],
    'rule3:heavy-tow': ['ram', 'Rule 3(g)(vi), 33 CFR 83.03(g)(vi)'],
    'rule3:replenishment': ['ram', 'Rule 3(g)(iii), 33 CFR 83.03(g)(iii)'],
  };

  for (const card of DEFINITIONS) {
    describe(card.id, () => {
      it('has the checked answer and citation', () => {
        const [ans, citation] = expected[card.id] ?? [];
        expect(card.answer).toBe(ans);
        expect(card.citation).toBe(citation);
      });

      it('copies its cue, reason and citation word for word from the regs check', () => {
        const rows = regs.split('\n').filter((l) => l.includes(`\`${card.id}\``));
        expect(rows.some((l) => l.includes(`| ${card.citation} |`))).toBe(true);
        expect(regs).toContain(`| ${card.cue} |`);
        expect(regs).toContain(card.why);
      });

      it('scores right only for its own answer', () => {
        for (const cat of CATEGORIES) {
          expect(cat.id === card.answer).toBe(cat.label === categoryLabel(card.answer));
        }
      });
    });
  }

  it('copies the answer labels from the regs check', () => {
    for (const c of CATEGORIES) expect(regs).toContain(`| \`${c.id}\` |`);
    expect(categoryLabel('ram')).toBe('Restricted in her ability to maneuver');
    expect(regs).toContain(
      '| Restricted in ability to maneuver | Restricted in her ability to maneuver |',
    );
  });

  it('keeps the trick cards: motor-sailing and trolling are power-driven', () => {
    const byId = new Map(DEFINITIONS.map((c) => [c.id, c]));
    expect(byId.get('rule3:motorsailing')?.answer).toBe('power');
    expect(byId.get('rule3:trolling')?.answer).toBe('power');
  });

  it('never says qualify', () => {
    const text = JSON.stringify([DEFINITIONS, CONSTRAINED_BY_DRAFT, CATEGORIES, QUESTION]);
    expect(text).not.toMatch(/qualif/i);
  });
});

describe('the verification answer key', () => {
  it('matches the deck, so the driver taps the button a player should', () => {
    const file = join(
      root,
      '.claude/skills/verify-captains-academy/features/steps/definitions.answers.json',
    );
    const key = JSON.parse(readFileSync(file, 'utf8')) as Record<string, number>;
    const expectedKey = Object.fromEntries(
      DEFINITIONS.map((c) => [c.id, CATEGORIES.findIndex((k) => k.id === c.answer) + 1]),
    );
    expect(key).toEqual(expectedKey);
  });
});
