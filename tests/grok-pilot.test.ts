import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  HARBOR,
  IDLE,
  Q,
  initialPilotState,
  moorFeel,
  pilotStars,
  stepPilot,
  tideAt,
  type PilotInput,
  type PilotState,
} from '../src/sim/grok/pilot';
import { pilotReplaySchema, runPilotReplay } from '../src/sim/grok/replay';

// Grok's night-arrival take on level 1. Golden replays live in
// tests/replays/grok and freeze every frame through a trace hash.

const dir = join(import.meta.dirname, 'replays', 'grok');
const expected: Record<string, PilotState['outcome']> = {
  'night-arrival-moors': 'moored',
  'night-arrival-rams-breakwater': 'out-of-hearts',
  'night-arrival-throws-short': 'out-of-hearts',
};

const run = (input: PilotInput, frames: number, from = initialPilotState()): PilotState => {
  let s = from;
  for (let i = 0; i < frames; i++) s = stepPilot(s, input);
  return s;
};

describe('grok night arrival: golden replays', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.pilot.json'));

  it('covers every replay this test expects', () => {
    expect(files.map((f) => f.replace('.pilot.json', '')).sort()).toEqual(
      Object.keys(expected).sort(),
    );
  });

  for (const file of files) {
    const name = file.replace('.pilot.json', '');
    it(`${name} reproduces its saved result`, async () => {
      const replay = pilotReplaySchema.parse(JSON.parse(readFileSync(join(dir, file), 'utf8')));
      const result = runPilotReplay(replay);
      expect(result.final.outcome).toBe(expected[name]);
      await expect(JSON.stringify(result, null, 2) + '\n').toMatchFileSnapshot(
        join(dir, `${name}.result.json`),
      );
    });
  }

  it('the docking replay earns three stars with a soft landing', () => {
    const replay = pilotReplaySchema.parse(
      JSON.parse(readFileSync(join(dir, 'night-arrival-moors.pilot.json'), 'utf8')),
    );
    const { final } = runPilotReplay(replay);
    expect(pilotStars(final)).toBe(3);
    expect(final.moorSpeedMmPerS).toBeLessThanOrEqual(HARBOR.maxMoorMmPerS);
    expect(moorFeel(final)).not.toBe('none');
  });
});

describe('grok night arrival: handling', () => {
  it('is deterministic: the same inputs give the same state', () => {
    const input: PilotInput = { throttle: 60, rudder: 30, thruster: 1, throwLine: false };
    expect(run(input, 500)).toEqual(run(input, 500));
  });

  it('drifts with the tide outside the breakwater and much less inside', () => {
    const outside = Math.abs(tideAt(0, 60_000 * Q));
    const inside = Math.abs(tideAt(0, 30_000 * Q));
    expect(outside).toBeGreaterThan(0);
    expect(inside).toBeLessThan(outside);
  });

  it('turns the bow with the thruster while stopped, and drains the battery', () => {
    const s = run({ ...IDLE, thruster: 1 }, 90);
    expect(s.heading).toBeGreaterThan(0);
    expect(s.battery).toBeLessThan(HARBOR.batteryFrames);
  });

  it('stops turning once the battery is flat', () => {
    const flat = run({ ...IDLE, thruster: 1 }, HARBOR.batteryFrames + 120);
    expect(flat.battery).toBe(0);
    const later = run({ ...IDLE, thruster: 1 }, 120, flat);
    expect(Math.abs(later.turnRate)).toBeLessThan(Math.abs(flat.turnRate) + 1);
  });

  it('a throw far from the cleat splashes and costs one heart, then must recoil', () => {
    const s = stepPilot(initialPilotState(), { ...IDLE, throwLine: true });
    expect(s.event).toBe('line-short');
    expect(s.hearts).toBe(HARBOR.hearts - 1);
    const held = stepPilot(s, { ...IDLE, throwLine: true });
    expect(held.hearts).toBe(s.hearts);
  });

  it('one contact costs one heart, not one per frame', () => {
    const s = run({ throttle: 100, rudder: -100, thruster: 0, throwLine: false }, 1800);
    expect(s.outcome).toBe('out-of-hearts');
    expect(s.hearts).toBe(0);
  });

  it('a finished run ignores further input', () => {
    const done = run({ throttle: 100, rudder: -100, thruster: 0, throwLine: false }, 1800);
    expect(stepPilot(done, { ...IDLE, throttle: 100 }).frame).toBe(done.frame);
  });
});
