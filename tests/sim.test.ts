import { describe, expect, it } from 'vitest';
import missionJson from '../missions/long-beach-docking.json';
import { parseMission } from '../src/sim/mission';
import {
  FRAMES_PER_SECOND,
  distanceToSlipMm,
  starsFor,
  HEADING_FULL_TURN,
  NO_INPUT,
  POS_SCALE,
  windAt,
  compileLevel,
  hashState,
  headingDelta,
  initialState,
  step,
} from '../src/sim/sim';
import type { Input, SimState } from '../src/sim/sim';
import { HEADING_UNITS, TRIG_ONE, icos, isin } from '../src/sim/trig';

const mission = parseMission(missionJson);
const level = compileLevel(mission);
const still = { ...mission.wind, gustMmPerS: 0 };
const calm = compileLevel({ ...mission, current: { eastMmPerS: 0, southMmPerS: 0 }, wind: still });
const currentOnly = compileLevel({ ...mission, wind: still });

function run(lvl: typeof level, input: Input, frames: number, from = initialState(lvl)): SimState {
  let s = from;
  for (let i = 0; i < frames; i++) s = step(lvl, s, input);
  return s;
}

describe('integer trigonometry', () => {
  it('hits the exact values at the quarter turns', () => {
    const q = HEADING_UNITS / 4;
    expect([isin(0), isin(q), isin(2 * q), isin(3 * q)]).toEqual([0, TRIG_ONE, 0, -TRIG_ONE]);
    expect([icos(0), icos(q), icos(2 * q), icos(3 * q)]).toEqual([TRIG_ONE, 0, -TRIG_ONE, 0]);
  });

  it('is odd and wraps around a full turn', () => {
    for (let h = -2048; h <= 2048; h += 37) {
      expect(isin(-h)).toBe(0 - isin(h));
      expect(isin(h + HEADING_UNITS)).toBe(isin(h));
    }
  });
});

describe('mission data', () => {
  it('rejects fractional numbers, so no float enters the simulation', () => {
    expect(() =>
      parseMission({ ...missionJson, start: { ...missionJson.start, x: 1.5 } }),
    ).toThrow();
  });

  it('rejects unknown fields', () => {
    expect(() => parseMission({ ...missionJson, extra: true })).toThrow();
  });

  it('starts the boat clear of every obstacle', () => {
    const s = step(calm, initialState(calm), NO_INPUT);
    expect(s.bumps).toBe(0);
  });
});

describe('boat handling', () => {
  it('sits still with no input and no current', () => {
    const s = run(calm, NO_INPUT, 300);
    expect([s.x, s.y, s.speed, s.heading]).toEqual([
      initialState(calm).x,
      initialState(calm).y,
      0,
      initialState(calm).heading,
    ]);
  });

  it('drifts with the current when the engine is idle', () => {
    const s = run(currentOnly, NO_INPUT, FRAMES_PER_SECOND * 10);
    expect(s.x).toBeGreaterThan(initialState(currentOnly).x);
    expect(s.y).toBe(initialState(currentOnly).y);
  });

  it('gathers way ahead, never past the top speed', () => {
    const east = { ...initialState(calm), heading: HEADING_FULL_TURN / 4 };
    const s = run(calm, { port: 100, starboard: 100, rudder: 0 }, FRAMES_PER_SECOND * 5, east);
    expect(s.speed).toBeGreaterThan(0);
    expect(s.speed).toBeLessThanOrEqual(calm.maxAhead);
    // Heading 090: all the motion is east.
    expect(s.x).toBeGreaterThan(east.x);
    expect(s.y).toBe(east.y);
  });

  it('steers from a standstill once the engine is in gear', () => {
    const kicked = step(calm, initialState(calm), { port: 100, starboard: 100, rudder: 100 });
    expect(headingDelta(kicked.heading, initialState(calm).heading)).toBeGreaterThan(0);
  });

  it('comes fully to rest once the throttle is released', () => {
    const moving = run(calm, { port: 100, starboard: 100, rudder: 0 }, FRAMES_PER_SECOND * 3);
    const stopped = run(calm, NO_INPUT, FRAMES_PER_SECOND * 60, moving);
    expect(stopped.speed).toBe(0);
  });

  it('has no steerage when dead in the water', () => {
    const s = run(calm, { port: 0, starboard: 0, rudder: 100 }, FRAMES_PER_SECOND * 5);
    expect(s.heading).toBe(initialState(calm).heading);
  });

  it('turns to starboard with right rudder going ahead, and the other way going astern', () => {
    const ahead = run(calm, { port: 100, starboard: 100, rudder: 100 }, FRAMES_PER_SECOND * 2);
    expect(headingDelta(ahead.heading, initialState(calm).heading)).toBeGreaterThan(0);
    const astern = run(calm, { port: -100, starboard: -100, rudder: 100 }, FRAMES_PER_SECOND * 2);
    expect(headingDelta(astern.heading, initialState(calm).heading)).toBeLessThan(0);
  });

  it('treats a slow touch as a bump and a fast one as a hit', () => {
    const nearShore = {
      ...initialState(calm),
      x: (mission.world.w - 8000 - 6000) * POS_SCALE,
      heading: HEADING_FULL_TURN / 4,
    };
    const slow = run(calm, { port: 0, starboard: 0, rudder: 0 }, 400, {
      ...nearShore,
      speed: calm.maxContact - 10,
    });
    expect(slow.outcome).toBe('playing');
    expect(slow.bumps).toBeGreaterThan(0);
    const fast = run(calm, { port: 100, starboard: 100, rudder: 0 }, 400, {
      ...nearShore,
      speed: calm.maxAhead,
    });
    expect(fast.outcome).toBe('hit');
  });

  it('counts a sustained soft contact as one bump', () => {
    // Bow 5 cm off the east shore, heading east, engine just engaged.
    const bowGap = calm.hullOffsetMm + calm.hullRadiusMm + 50;
    const start = {
      ...initialState(calm),
      x: (mission.world.w - 8000 - bowGap) * POS_SCALE,
      heading: HEADING_FULL_TURN / 4,
    };
    const pushed = run(
      calm,
      { port: 100, starboard: 100, rudder: 0 },
      FRAMES_PER_SECOND * 10,
      start,
    );
    expect(pushed.outcome).toBe('playing');
    expect(pushed.bumps).toBe(1);
    // Back off, then nudge in again: a second, separate bump.
    const clear = run(calm, { port: -100, starboard: -100, rudder: 0 }, 30, pushed);
    const coasted = run(calm, NO_INPUT, FRAMES_PER_SECOND * 2, clear);
    const nudged = run(calm, { port: 100, starboard: 100, rudder: 0 }, 40, coasted);
    const again = run(calm, NO_INPUT, FRAMES_PER_SECOND * 6, nudged);
    expect(again.outcome).toBe('playing');
    expect(again.bumps).toBe(2);
  });

  it('gives the same frames for the same inputs', () => {
    const inputs: Input[] = [
      { port: 100, starboard: 100, rudder: 0 },
      { port: 100, starboard: 100, rudder: -100 },
      { port: 0, starboard: 0, rudder: 100 },
      { port: -100, starboard: -100, rudder: 0 },
    ];
    const trace = () => {
      let s = initialState(level);
      let h = hashState(s);
      for (let i = 0; i < 2000; i++) {
        s = step(level, s, inputs[Math.trunc(i / 250) % inputs.length] ?? NO_INPUT);
        h = hashState(s, h);
      }
      return h;
    };
    expect(trace()).toBe(trace());
  });
});

describe('scoring', () => {
  const docked = (frame: number, bumps: number): SimState => ({
    ...initialState(level),
    outcome: 'docked',
    frame,
    bumps,
  });
  const par = mission.parSeconds * FRAMES_PER_SECOND;

  it('gives three stars for a clean docking within par', () => {
    expect(starsFor(level, docked(par, 0))).toBe(3);
  });

  it('gives two stars for a few bumps or a slower time', () => {
    expect(starsFor(level, docked(par, 1))).toBe(2);
    expect(starsFor(level, docked(par + 1, 0))).toBe(2);
  });

  it('gives one star for any docking, and none for a hit', () => {
    expect(starsFor(level, docked(par * 3, 5))).toBe(1);
    expect(starsFor(level, { ...docked(par, 0), outcome: 'hit' })).toBe(0);
  });

  it('measures the distance to the middle of the slip', () => {
    const { slip } = mission;
    const inSlip = {
      ...initialState(level),
      x: (slip.x + slip.w / 2) * POS_SCALE,
      y: (slip.y + slip.h / 2) * POS_SCALE,
    };
    expect(distanceToSlipMm(level, inSlip)).toBe(0);
    expect(distanceToSlipMm(level, initialState(level))).toBeGreaterThan(50000);
  });
});

describe('engine levers and wheel', () => {
  it('half throttle gathers way about half as fast as full', () => {
    const east = { ...initialState(calm), heading: HEADING_FULL_TURN / 4 };
    const full = step(calm, east, { port: 100, starboard: 100, rudder: 0 });
    const half = step(calm, east, { port: 50, starboard: 50, rudder: 0 });
    expect(half.speed).toBeGreaterThan(0);
    expect(Math.abs(half.speed * 2 - full.speed)).toBeLessThanOrEqual(2);
  });

  it('turns less with a little wheel than with hard over', () => {
    const moving = run(calm, { port: 100, starboard: 100, rudder: 0 }, FRAMES_PER_SECOND * 3);
    // A full second, because the hull's swing takes a moment to build.
    const gentle = run(calm, { port: 100, starboard: 100, rudder: 25 }, FRAMES_PER_SECOND, moving);
    const hard = run(calm, { port: 100, starboard: 100, rudder: 100 }, FRAMES_PER_SECOND, moving);
    const turn = (s: SimState) => headingDelta(s.heading, moving.heading);
    expect(turn(gentle)).toBeGreaterThan(0);
    expect(turn(gentle)).toBeLessThan(turn(hard));
  });

  it('splitting the levers pivots the boat with no way on', () => {
    const pivot = run(calm, { port: 100, starboard: -100, rudder: 0 }, FRAMES_PER_SECOND * 2);
    expect(headingDelta(pivot.heading, initialState(calm).heading)).toBeGreaterThan(0);
    expect(pivot.speed).toBe(0);
    const other = run(calm, { port: -100, starboard: 100, rudder: 0 }, FRAMES_PER_SECOND * 2);
    expect(headingDelta(other.heading, initialState(calm).heading)).toBeLessThan(0);
  });

  it('carries its swing after the levers come back together', () => {
    const swinging = run(calm, { port: 100, starboard: -100, rudder: 0 }, FRAMES_PER_SECOND * 2);
    const released = step(calm, swinging, NO_INPUT);
    expect(released.turnRate).toBeGreaterThan(0);
    expect(headingDelta(released.heading, swinging.heading)).toBeGreaterThan(0);
    const settled = run(calm, NO_INPUT, FRAMES_PER_SECOND * 5, swinging);
    expect(settled.turnRate).toBe(0);
  });

  it('turns more slowly with a little split than with the levers fully split', () => {
    const little = run(calm, { port: 25, starboard: -25, rudder: 0 }, FRAMES_PER_SECOND * 2);
    const full = run(calm, { port: 100, starboard: -100, rudder: 0 }, FRAMES_PER_SECOND * 2);
    const turn = (s: SimState) => headingDelta(s.heading, initialState(calm).heading);
    expect(turn(little)).toBeGreaterThan(0);
    expect(turn(little)).toBeLessThan(turn(full));
  });

  it('clamps out-of-range input to full', () => {
    const over = step(calm, initialState(calm), { port: 500, starboard: 500, rudder: 900 });
    const full = step(calm, initialState(calm), { port: 100, starboard: 100, rudder: 100 });
    expect(over).toEqual(full);
  });
});

describe('wind', () => {
  const windy = compileLevel(
    parseMission(
      JSON.parse(
        JSON.stringify({ ...missionJson, wind: { gustMmPerS: 400, gustSeconds: 4, seed: 7 } }),
      ),
    ),
  );

  it('is calm when the mission has no gusts', () => {
    expect(windAt(calm, 1234)).toEqual([0, 0]);
  });

  it('gives the same gust for the same frame every time', () => {
    for (const f of [0, 100, 239, 240, 5000]) expect(windAt(windy, f)).toEqual(windAt(windy, f));
  });

  it('changes over time but never blows harder than the mission allows', () => {
    const seen = new Set<string>();
    for (let f = 0; f < 60 * 60; f += 30) {
      const [x, y] = windAt(windy, f);
      seen.add(`${x},${y}`);
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(windy.gust + 2);
    }
    expect(seen.size).toBeGreaterThan(10);
  });
});
