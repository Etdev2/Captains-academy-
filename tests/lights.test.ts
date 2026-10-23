import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  CONSTRAINED_BY_DRAFT,
  LEVEL_RULE_SET,
  LIGHTS,
  PAR_MS,
  PATTERNS,
  QUESTION,
  answerLine,
  categoryLabel,
  pictureOf,
  shownLights,
} from '../src/sim/chapter1/lights';
import {
  RAPID_LEVELS,
  isUnlocked,
  levelBySlug,
  levelPath,
  levelTitle,
  nextLevel,
} from '../src/sim/chapter1/registry';
import { LIGHTS_SPEC } from '../src/game/rapid/specs';
import {
  HEARTS,
  RETURN_AFTER,
  answer,
  currentCard,
  runStars,
  startRun,
  type RapidRun,
} from '../src/sim/rapid';

// The Lights deck (issue #29): its checked text, its Rule 21 pictures, the
// scoring it shares with Definitions, and the unlock.

const root = join(import.meta.dirname, '..');
const regs = readFileSync(join(root, 'docs/product/lights-regs-check-2026-10-23.md'), 'utf8');
const ids = LIGHTS.map((c) => c.id);

describe('the Lights deck', () => {
  it('has unique ids that also key the mastery record', () => {
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^rule(2\d|3[01]):[a-z0-9-]+$/);
  });

  it('plays only shared cards in this shared level, and shows the rule set on each (G6)', () => {
    expect(LEVEL_RULE_SET).toBe('both');
    for (const c of LIGHTS) expect(c.ruleSet, c.id).toBe('both');
    expect(CONSTRAINED_BY_DRAFT.ruleSet).toBe('international');
    expect(ids).not.toContain(CONSTRAINED_BY_DRAFT.id);
  });

  it('cites a rule from Rules 20 to 31 and its 33 CFR 83 section on every card', () => {
    for (const c of LIGHTS) {
      const rule = /^Rule (\d+)/.exec(c.citation)?.[1];
      expect(Number(rule), c.id).toBeGreaterThanOrEqual(20);
      expect(Number(rule), c.id).toBeLessThanOrEqual(31);
      expect(c.citation, c.id).toContain(`33 CFR 83.${rule}`);
      expect(c.id.startsWith(`rule${rule}:`), c.id).toBe(true);
    }
  });

  it('uses every answer at least twice and every pattern at least once', () => {
    for (const cat of CATEGORIES) {
      expect(LIGHTS.filter((c) => c.answer === cat.id).length, cat.id).toBeGreaterThanOrEqual(2);
    }
    const used = new Set(LIGHTS.map((c) => c.art.pattern));
    expect([...used].sort()).toEqual(Object.keys(PATTERNS).sort());
  });

  it('asks which vessel shows these lights', () => {
    expect(QUESTION).toBe('Which vessel shows these lights?');
  });

  it('never says qualify, and never claims sea time', () => {
    const text = JSON.stringify([LIGHTS, CONSTRAINED_BY_DRAFT, CATEGORIES, QUESTION]);
    expect(text).not.toMatch(/qualif|sea[- ]time|credit/i);
  });

  it('shows from every card a picture that no other vessel in the answers shares', () => {
    for (const c of LIGHTS) {
      const mine = pictureOf(c.art);
      expect(mine, `${c.id} shows nothing`).not.toBe('');
      for (const other of new Set(LIGHTS.map((o) => o.art.pattern))) {
        const sameAnswer = LIGHTS.filter((o) => o.art.pattern === other).every(
          (o) => o.answer === c.answer,
        );
        if (sameAnswer) continue;
        expect(
          pictureOf({ pattern: other, aspect: c.art.aspect }),
          `${c.id} looks like ${other} from aspect ${c.art.aspect}`,
        ).not.toBe(mine);
      }
    }
  });

  it('leaves out the lights Rule 21 hides from the card aspect', () => {
    const astern = LIGHTS.find((c) => c.id === 'rule24:towing-astern');
    expect(astern && shownLights(astern.art).map((l) => l.id)).toEqual(['stern', 'towing']);
    const headOn = LIGHTS.find((c) => c.id === 'rule23:power-head-on');
    expect(headOn && shownLights(headOn.art).map((l) => l.id)).toEqual([
      'masthead',
      'starboard',
      'port',
    ]);
    const beam = LIGHTS.find((c) => c.id === 'rule25:sailing-starboard-beam');
    expect(beam && shownLights(beam.art).map((l) => l.id)).toEqual(['starboard']);
  });

  it('keeps the answer buttons in one fixed order, so the keys and the thumb learn it', () => {
    expect(CATEGORIES.map((c) => c.id)).toEqual([
      'power',
      'sailing',
      'towing',
      'fishing',
      'nuc',
      'anchor',
      'ram',
    ]);
  });

  it('says the answer in one line the panel can lead with', () => {
    const card = LIGHTS.find((c) => c.id === 'rule30:anchor-long');
    expect(card && answerLine(card)).toBe('Those are the lights of a vessel at anchor.');
    expect(LIGHTS_SPEC.answerLine(LIGHTS[0] as never, '')).toBe(answerLine(LIGHTS[0] as never));
  });
});

describe('the deck is the regs check, word for word', () => {
  for (const card of LIGHTS) {
    describe(card.id, () => {
      it('copies its cue, reason and citation from the regs check', () => {
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
    for (const c of CATEGORIES) {
      expect(regs).toContain(`| \`${c.id}\` |`);
      expect(regs).toContain(c.label);
      expect(regs).toContain(c.phrase);
    }
  });

  it('copies the constrained-by-draft text, kept out of this level', () => {
    expect(regs).toContain(CONSTRAINED_BY_DRAFT.why);
    expect(regs).toContain(CONSTRAINED_BY_DRAFT.citation);
  });

  it('carries no unchecked card: every card is verified or corrected', () => {
    for (const card of LIGHTS) {
      const row = regs.split('\n').find((l) => l.includes(`\`${card.id}\``) && l.includes(' | `'));
      expect(row, card.id).toBeTruthy();
      expect(row ?? '', card.id).toMatch(/`(verified|corrected)`/);
    }
  });
});

describe('Lights scoring is the shared rapid-fire run', () => {
  const play = (run: RapidRun, picks: readonly ('right' | 'wrong')[]): RapidRun => {
    let r = run;
    for (const pick of picks) r = answer(r, pick === 'right').run;
    return r;
  };

  it('takes a hull heart for each wrong answer and ends the run on the third', () => {
    let run = startRun(ids, 29);
    expect(run.hearts).toBe(HEARTS);
    run = play(run, ['wrong']);
    expect(run.hearts).toBe(2);
    run = play(run, ['wrong', 'wrong']);
    expect(run).toMatchObject({ hearts: 0, outcome: 'out-of-hearts', misses: 3 });
  });

  it('brings a missed situation back later in the run (G11, G20)', () => {
    const first = startRun(ids, 29);
    const missed = currentCard(first);
    const after = answer(first, false).run;
    expect(after.queue[RETURN_AFTER]).toBe(missed);
    expect(after.queue).toHaveLength(ids.length);
    expect(after.missed).toEqual([missed]);
  });

  it('gives three stars for a clean run inside the par time', () => {
    const run = play(startRun(ids, 29), Array<'right'>(ids.length).fill('right'));
    expect(run.outcome).toBe('cleared');
    expect(runStars(run, PAR_MS, PAR_MS)).toBe(3);
    expect(runStars(run, PAR_MS + 1, PAR_MS)).toBe(2);
  });

  it('gives two stars for one miss and one star for more', () => {
    const one = play(startRun(ids, 29), ['wrong', ...Array<'right'>(ids.length).fill('right')]);
    expect(one).toMatchObject({ outcome: 'cleared', misses: 1 });
    expect(runStars(one, 1000, PAR_MS)).toBe(2);
    const two = play(startRun(ids, 29), [
      'wrong',
      'wrong',
      ...Array<'right'>(ids.length + 1).fill('right'),
    ]);
    expect(two).toMatchObject({ outcome: 'cleared', misses: 2 });
    expect(runStars(two, 1000, PAR_MS)).toBe(1);
  });

  it('gives no stars for running out of hearts', () => {
    const run = play(startRun(ids, 29), ['wrong', 'wrong', 'wrong']);
    expect(runStars(run, 1000, PAR_MS)).toBe(0);
  });

  it('keeps the par time in whole milliseconds, at most a minute and a half', () => {
    expect(Number.isSafeInteger(PAR_MS)).toBe(true);
    expect(PAR_MS).toBeLessThanOrEqual(90_000);
    expect(() => runStars(startRun(ids, 1), 1.5, PAR_MS)).toThrow();
  });
});

describe('level 2 opens after one star on level 1 (G12)', () => {
  const lights = levelBySlug('lights');
  const stars = (map: Record<string, number>) => (id: string) => map[id] ?? 0;

  it('lists Definitions then Lights, in order', () => {
    expect(RAPID_LEVELS.map((l) => levelTitle(l))).toEqual(['1 · Definitions', '2 · Lights']);
    expect(RAPID_LEVELS.map(levelPath)).toEqual(['/rules/', '/rules/?level=lights']);
    expect(lights && levelTitle(lights)).toBe(LIGHTS_SPEC.title);
  });

  it('stays shut with no stars and opens with one', () => {
    expect(lights && isUnlocked(lights, stars({}))).toBe(false);
    expect(lights && isUnlocked(lights, stars({ 'ch1-definitions': 0 }))).toBe(false);
    expect(lights && isUnlocked(lights, stars({ 'ch1-definitions': 1 }))).toBe(true);
    expect(lights && isUnlocked(lights, stars({ 'ch1-definitions': 3 }))).toBe(true);
    expect(lights && isUnlocked(lights, stars({ 'ch1-lights': 3 }))).toBe(false);
  });

  it('keeps Definitions open and finds the next level', () => {
    const first = RAPID_LEVELS[0];
    expect(first && isUnlocked(first, stars({}))).toBe(true);
    expect(first && nextLevel(first)?.id).toBe('ch1-lights');
    expect(lights && nextLevel(lights)).toBeUndefined();
    expect(levelBySlug('nonsense')).toBeUndefined();
    expect(levelBySlug(null)).toBeUndefined();
  });
});
