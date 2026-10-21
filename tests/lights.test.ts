import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { LightsInput, LightsState } from '../src/sim/lights';
import {
  REPLAY_FRAMES,
  RETURN_GAP_START,
  compileLightsLevel,
  initialState,
  situationAt,
  starsFor,
  step,
} from '../src/sim/lights';
import { citeRule, lightsMissionSchema, parseLightsMission } from '../src/sim/lights-mission';
import { FRAMES_PER_SECOND } from '../src/sim/sim';

const root = join(import.meta.dirname, '..');
const raw: unknown = JSON.parse(
  readFileSync(join(root, 'missions', 'chapter-1-lights-rapid-fire.json'), 'utf8'),
);
const level = compileLightsLevel(parseLightsMission(raw));
const { situations } = level.mission;

const run = (state: LightsState, input: LightsInput, frames = 1): LightsState => {
  let s = state;
  for (let i = 0; i < frames; i++) s = step(level, s, i === 0 ? input : null);
  return s;
};
const headAnswer = (s: LightsState): string => situationAt(level, s.queue[0] ?? 0).answer;
const wrongPick = (s: LightsState): string => {
  const wrong = s.options.find((id) => id !== headAnswer(s));
  if (wrong === undefined) throw new Error('no wrong button');
  return wrong;
};
const right = (s: LightsState): LightsState => run(s, { kind: 'answer', pick: headAnswer(s) });
const wrong = (s: LightsState): LightsState => run(s, { kind: 'answer', pick: wrongPick(s) });
const afterReplay = (s: LightsState): LightsState => run(s, null, REPLAY_FRAMES);
/** Answers everything left correctly, waiting `framesEach` frames before each. */
const clear = (start: LightsState, framesEach: number): LightsState => {
  let s = start;
  while (s.outcome === 'playing') {
    s = run(s, null, framesEach - 1);
    s = right(s);
  }
  return s;
};

describe('lights rapid-fire level data', () => {
  it('passes the schema and has the expected shape', () => {
    expect(lightsMissionSchema.safeParse(raw).success).toBe(true);
    expect(level.mission.hearts).toBe(3);
    expect(situations.length).toBeGreaterThanOrEqual(10);
  });

  it('cites a rule from Rules 20 to 31 for every situation', () => {
    for (const s of situations) {
      expect(s.rule.number).toBeGreaterThanOrEqual(20);
      expect(s.rule.number).toBeLessThanOrEqual(31);
    }
  });

  it('shows both rule sets, and puts shared rules before the differences (G6)', () => {
    expect(new Set(situations.map((s) => s.ruleSet))).toEqual(new Set(['inland', 'international']));
    const firstDifference = situations.findIndex((s) => !s.shared);
    expect(firstDifference).toBeGreaterThan(0);
    expect(situations.slice(firstDifference).every((s) => !s.shared)).toBe(true);
    for (const s of situations.filter((x) => !x.shared)) {
      expect(s.differenceNote).toBeTruthy();
    }
  });

  it('writes citations in the form of the rule set in force', () => {
    const rule = { number: 23, paragraph: '(a)' } as const;
    expect(citeRule('inland', rule)).toBe('33 CFR 83.23(a)');
    expect(citeRule('international', rule)).toBe('COLREGS Rule 23(a)');
    expect(citeRule('international', { number: 28 })).toBe('COLREGS Rule 28');
  });

  it('interleaves: no two situations in a row teach the same answer', () => {
    for (let i = 1; i < situations.length; i++) {
      expect(situations[i]?.answer).not.toBe(situations[i - 1]?.answer);
    }
  });

  it('never says a player qualifies (ADR 0001, G17)', () => {
    expect(JSON.stringify(raw)).not.toMatch(/qualif/i);
  });

  it('only puts red and green on actual navigation lights: lights carry their color', () => {
    for (const s of situations) {
      for (const light of s.lights) {
        expect(['white', 'red', 'green', 'yellow']).toContain(light.color);
      }
    }
  });
});

describe('asking', () => {
  it('starts with three hearts, the first situation and four distinct buttons', () => {
    const s = initialState(level);
    expect(s.hearts).toBe(3);
    expect(s.queue).toEqual(situations.map((_, i) => i));
    expect(new Set(s.options).size).toBe(4);
    expect(s.options).toContain(headAnswer(s));
  });

  it('deals the same buttons for the same attempt, and keeps the content fixed across attempts', () => {
    expect(initialState(level, 0).options).toEqual(initialState(level, 0).options);
    expect(initialState(level, 1).queue).toEqual(initialState(level, 0).queue);
    const orders = [0, 1, 2, 3, 4, 5].map((a) => initialState(level, a).options.join());
    expect(new Set(orders).size).toBeGreaterThan(1);
  });

  it('moves straight on after a right answer and scores a streak bonus', () => {
    const one = right(initialState(level));
    expect(one.queue[0]).toBe(1);
    expect(one.correct).toBe(1);
    expect(one.points).toBe(100);
    const two = right(one);
    expect(two.streak).toBe(2);
    expect(two.points).toBe(100 + 110);
  });

  it('ignores an answer that is not on the buttons', () => {
    const s = initialState(level);
    const next = run(s, { kind: 'answer', pick: 'not-an-answer' });
    expect(next.queue).toEqual(s.queue);
    expect(next.hearts).toBe(3);
  });

  it('counts only asking time on the clock', () => {
    const s = afterReplay(wrong(run(initialState(level), null, 59)));
    expect(s.askingFrames).toBe(60);
    expect(s.frame).toBe(60 + REPLAY_FRAMES);
  });
});

describe('a miss (G11, G20)', () => {
  const missed = wrong(initialState(level));

  it('costs one heart and starts a replay of exactly 5 seconds', () => {
    expect(REPLAY_FRAMES).toBe(5 * FRAMES_PER_SECOND);
    expect(missed.hearts).toBe(2);
    expect(missed.misses).toBe(1);
    expect(missed.streak).toBe(0);
    expect(missed.phase).toBe('replay');
    expect(missed.replayFramesLeft).toBe(REPLAY_FRAMES);
    expect(missed.missed).toBe(0);
  });

  it('never blocks the player longer than 5 seconds', () => {
    let s = missed;
    let frames = 0;
    while (s.phase === 'replay') {
      s = step(level, s, null);
      frames++;
    }
    expect(frames).toBe(REPLAY_FRAMES);
    expect(s.phase).toBe('asking');
    expect(s.outcome).toBe('playing');
  });

  it('can be skipped at once', () => {
    const s = run(missed, { kind: 'skip' });
    expect(s.phase).toBe('asking');
    expect(s.hearts).toBe(2);
  });

  it('ignores answers and does not advance until the replay ends', () => {
    const during = run(missed, { kind: 'answer', pick: headAnswer(missed) }, 10);
    expect(during.phase).toBe('replay');
    expect(during.correct).toBe(0);
    expect(during.replayFramesLeft).toBe(REPLAY_FRAMES - 10);
  });

  it('ignores a skip while asking', () => {
    const s = initialState(level);
    expect(run(s, { kind: 'skip' }).queue).toEqual(s.queue);
  });

  it('brings the missed situation back later in the level', () => {
    expect(missed.queue.indexOf(0)).toBe(RETURN_GAP_START);
    let s = afterReplay(missed);
    const seen: number[] = [];
    while (s.outcome === 'playing') {
      seen.push(s.queue[0] ?? -1);
      s = right(s);
    }
    expect(seen.filter((i) => i === 0)).toHaveLength(1);
    expect(seen.indexOf(0)).toBe(RETURN_GAP_START);
    expect(s.outcome).toBe('cleared');
    expect(s.correct).toBe(situations.length);
  });

  it('brings a situation missed twice back later each time (growing gap)', () => {
    const first = afterReplay(missed);
    // Walk to the return of situation 0, then miss it again.
    let s = first;
    while (s.queue[0] !== 0) s = right(s);
    const again = wrong(s);
    expect(again.missCounts[0]).toBe(2);
    expect(again.queue.indexOf(0)).toBe(RETURN_GAP_START + 2);
  });
});

describe('hearts (G11)', () => {
  it('ends the level when the third heart goes, after the last replay', () => {
    let s = initialState(level);
    s = afterReplay(wrong(s));
    s = afterReplay(wrong(s));
    expect(s.hearts).toBe(1);
    expect(s.outcome).toBe('playing');
    s = wrong(s);
    expect(s.hearts).toBe(0);
    expect(s.outcome).toBe('playing');
    expect(s.phase).toBe('replay');
    s = afterReplay(s);
    expect(s.outcome).toBe('out-of-hearts');
    expect(s.options).toEqual([]);
    expect(starsFor(level, s)).toBe(0);
    expect(step(level, s, null)).toBe(s);
  });
});

describe('stars (G12)', () => {
  const par = level.parFrames;

  it('gives three for no misses within par time', () => {
    const s = clear(initialState(level), 90);
    expect(s.outcome).toBe('cleared');
    expect(s.misses).toBe(0);
    expect(starsFor(level, s)).toBe(3);
  });

  it('gives two for no misses but slower than par, within twice par', () => {
    const s: LightsState = { ...clear(initialState(level), 90), askingFrames: par + 1 };
    expect(starsFor(level, s)).toBe(2);
  });

  it('gives two for one miss within twice par', () => {
    const s = clear(afterReplay(wrong(initialState(level))), 90);
    expect(s.outcome).toBe('cleared');
    expect(s.misses).toBe(1);
    expect(s.hearts).toBe(2);
    expect(starsFor(level, s)).toBe(2);
  });

  it('gives one for two misses, or for a slow clear', () => {
    const twoMisses = clear(afterReplay(wrong(afterReplay(wrong(initialState(level))))), 90);
    expect(twoMisses.misses).toBe(2);
    expect(starsFor(level, twoMisses)).toBe(1);
    const slow: LightsState = { ...clear(initialState(level), 90), askingFrames: par * 2 + 1 };
    expect(starsFor(level, slow)).toBe(1);
  });

  it('gives none while playing', () => {
    expect(starsFor(level, initialState(level))).toBe(0);
  });
});

describe('unlocking', () => {
  it('opens after one star on the Long Beach docking level (G12)', () => {
    const docking: { id: string } = JSON.parse(
      readFileSync(join(root, 'missions', 'long-beach-docking.json'), 'utf8'),
    );
    expect(level.mission.unlockedBy).toBe(docking.id);
  });
});
