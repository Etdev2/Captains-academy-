import { describe, expect, it } from 'vitest';
import type { CompiledTraffic } from '../src/sim/course';
import { UNIT, compileTraffic, crossesGate, trafficCircles, trafficPose } from '../src/sim/course';
import type { Traffic } from '../src/sim/mission';

// Course primitives from #46, tested on their own: fixed-track traffic and gate
// crossings. Nothing here runs the boat simulation, which a later slice wires in.

const vessel = (over: Partial<Traffic>): Traffic => ({
  name: 'test vessel',
  kind: 'ship',
  lengthMm: 4000,
  beamMm: 1000,
  speedMmPerS: 1000,
  startAfterGate: 0,
  lesson: 'Test lesson line.',
  path: [
    { x: 0, y: 0 },
    { x: 1000, y: 0 },
    { x: 1000, y: 500 },
  ],
  ...over,
});

const expectIntegers = (values: readonly number[]) => {
  for (const v of values) expect(Number.isInteger(v)).toBe(true);
};

describe('trafficPose', () => {
  const bend = compileTraffic(vessel({}));

  it('starts at the first point, heading along the first leg', () => {
    expect(trafficPose(bend, 0)).toEqual({ x: 0, y: 0, ux: UNIT, uy: 0 });
  });

  it('stays at the first point for a negative distance', () => {
    expect(trafficPose(bend, -250)).toEqual(trafficPose(bend, 0));
  });

  it('moves part way along a leg', () => {
    expect(trafficPose(bend, 400)).toEqual({ x: 400, y: 0, ux: UNIT, uy: 0 });
  });

  it('keeps the first leg exactly at the corner and takes the second just past it', () => {
    expect(trafficPose(bend, 1000)).toEqual({ x: 1000, y: 0, ux: UNIT, uy: 0 });
    expect(trafficPose(bend, 1001)).toEqual({ x: 1000, y: 1, ux: 0, uy: UNIT });
  });

  it('stays at the end of its track, facing along the last leg', () => {
    const end = { x: 1000, y: 500, ux: 0, uy: UNIT };
    expect(trafficPose(bend, 1500)).toEqual(end);
    expect(trafficPose(bend, 1501)).toEqual(end);
    expect(trafficPose(bend, 10_000_000)).toEqual(end);
  });

  it('rounds a diagonal leg to whole millimeters', () => {
    // A 3-4-5 leg is exactly 5000 mm long.
    const diagonal = compileTraffic(
      vessel({
        path: [
          { x: 0, y: 0 },
          { x: 3000, y: 4000 },
        ],
      }),
    );
    expect(trafficPose(diagonal, 2500)).toEqual({
      x: 1500,
      y: 2000,
      ux: Math.trunc((3000 * UNIT) / 5000),
      uy: Math.trunc((4000 * UNIT) / 5000),
    });
  });

  it('returns only integers and the same pose for the same input', () => {
    const diagonal = compileTraffic(
      vessel({
        path: [
          { x: 17, y: -3 },
          { x: 7919, y: 1231 },
          { x: -4421, y: 6007 },
        ],
      }),
    );
    for (let d = -10; d <= 30000; d += 997) {
      const pose = trafficPose(diagonal, d);
      expectIntegers([pose.x, pose.y, pose.ux, pose.uy]);
      expect(trafficPose(diagonal, d)).toEqual(pose);
    }
  });

  it('builds the same track from the same data', () => {
    expect(compileTraffic(vessel({}))).toEqual(bend);
  });
});

describe('trafficCircles', () => {
  const centers = (t: CompiledTraffic, d: number) => trafficCircles(t, trafficPose(t, d));

  it('uses one circle at the center for a hull no longer than it is wide', () => {
    const round = compileTraffic(vessel({ lengthMm: 900, beamMm: 1000 }));
    expect(round.circles).toBe(1);
    expect(round.radiusMm).toBe(500);
    expect(centers(round, 400)).toEqual([[400, 0]]);
  });

  it('spreads many circles evenly from stern to bow along the heading', () => {
    // 60 m by 11 m: six circles of 5.5 m radius, ends 24.5 m either side of center.
    const ship = compileTraffic(
      vessel({
        lengthMm: 60000,
        beamMm: 11000,
        path: [
          { x: 0, y: 0 },
          { x: 200000, y: 0 },
        ],
      }),
    );
    expect(ship.circles).toBe(6);
    expect(ship.radiusMm).toBe(5500);
    expect(ship.halfSpanMm).toBe(24500);
    expect(centers(ship, 100000)).toEqual([
      [75500, 0],
      [85300, 0],
      [95100, 0],
      [104900, 0],
      [114700, 0],
      [124500, 0],
    ]);
  });

  it('turns the row of circles with the vessel', () => {
    const southbound = compileTraffic(
      vessel({
        path: [
          { x: 0, y: 0 },
          { x: 0, y: 10000 },
        ],
      }),
    );
    const row = centers(southbound, 5000);
    expect(row.map(([x]) => x)).toEqual(row.map(() => 0));
    expect(row[0]?.[1]).toBeLessThan(row.at(-1)?.[1] ?? 0);
    expectIntegers(row.flat());
  });
});

describe('crossesGate', () => {
  const gate = { x1: 0, y1: 0, x2: 1000, y2: 0 };

  it('counts a move that crosses the gate line in either direction', () => {
    expect(crossesGate(500, 100, 500, -100, gate)).toBe(true);
    expect(crossesGate(500, -100, 500, 100, gate)).toBe(true);
  });

  it('ignores a move that passes beside the gate or stops short of it', () => {
    expect(crossesGate(1500, 100, 1500, -100, gate)).toBe(false);
    expect(crossesGate(500, 300, 500, 100, gate)).toBe(false);
  });

  it('ignores a move of zero length, even on the gate line', () => {
    expect(crossesGate(500, 100, 500, 100, gate)).toBe(false);
    expect(crossesGate(500, 0, 500, 0, gate)).toBe(false);
  });

  it('counts a move that touches an end of the gate', () => {
    expect(crossesGate(0, 100, 0, -100, gate)).toBe(true);
    expect(crossesGate(1000, 100, 1000, 0, gate)).toBe(true);
  });

  it('ignores a move along the gate line itself', () => {
    expect(crossesGate(-100, 0, 1100, 0, gate)).toBe(false);
  });
});
