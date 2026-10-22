import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { trafficCircles, trafficPose } from '../src/sim/course';
import { parseMission } from '../src/sim/mission';
import { replaySchema } from '../src/sim/replay';
import type { SimState } from '../src/sim/sim';
import {
  FRAMES_PER_SECOND,
  NO_INPUT,
  POS_SCALE,
  compileLevel,
  initialState,
  step,
  trafficPoses,
} from '../src/sim/sim';
import { firstTurn, framesOf, sampleAt, trace } from './helpers/encounter';

// The Long Beach harbor course (#46): gates in order, traffic on fixed tracks,
// a slip that waits for the last gate, and the traffic situations corrected by
// the uscg-regs check (docs/product/harbor-traffic-regs-check-2026-10-22.md).
// The powerboat is out of this slice; she returns with a Rule 13 lesson.

const root = join(import.meta.dirname, '..');
const load = (id: string) =>
  compileLevel(
    parseMission(JSON.parse(readFileSync(join(root, 'missions', `${id}.json`), 'utf8'))),
  );
const course = load('long-beach-traffic');
const { mission } = course;
const SHIP = 0;
const FERRY = 1;
const vessel = (i: number) => {
  const t = course.traffic[i];
  if (!t) throw new Error(`the course has no vessel ${i}`);
  return t;
};
const run = (state: SimState, frames: number) => {
  let s = state;
  for (let i = 0; i < frames; i++) s = step(course, s, NO_INPUT);
  return s;
};
const replay = (name: string) => {
  const r = replaySchema.parse(
    JSON.parse(readFileSync(join(root, 'tests', 'replays', `${name}.replay.json`), 'utf8')),
  );
  return trace(course, initialState(course), framesOf(r.runs));
};
const clean = replay('long-beach-traffic-docks');
const ferryHit = replay('long-beach-traffic-hit-by-ferry');
const last = (states: SimState[]) => {
  const s = states.at(-1);
  if (!s) throw new Error('empty trace');
  return s;
};

describe('the course level', () => {
  it('names its traffic in the order these tests use', () => {
    expect(course.traffic.map((t) => t.data.name)).toEqual(['container ship', 'ferry', 'kayak']);
  });

  it('leaves levels without a course exactly as they were', () => {
    const plain = load('long-beach-docking');
    const s = initialState(plain);
    expect('course' in s).toBe(false);
    expect('course' in step(plain, s, NO_INPUT)).toBe(false);
  });

  it('counts gates only in order', () => {
    // Coasting north through gate 2 before gate 1 counts nothing.
    const gate2 = mission.gates?.[1];
    if (!gate2) throw new Error('no gate 2');
    const below: SimState = {
      ...initialState(course),
      x: ((gate2.x1 + gate2.x2) / 2) * POS_SCALE,
      y: (gate2.y1 + 3000) * POS_SCALE,
      heading: 0,
      speed: Math.trunc((2500 * POS_SCALE) / FRAMES_PER_SECOND),
    };
    expect(run(below, 180).course?.gates).toBe(0);
    const afterGate1 = { ...below, course: { gates: 1, starts: [0, -1, -1], struckBy: -1 } };
    expect(run(afterGate1, 180).course?.gates).toBe(2);
  });

  it('does not count the slip until every gate is passed', () => {
    const { slip } = mission;
    const inSlip: SimState = {
      ...initialState(course),
      x: (slip.x + slip.w / 2) * POS_SCALE,
      y: (slip.y + slip.h / 2) * POS_SCALE,
      heading: 0,
    };
    const frames = course.holdFrames + 5;
    expect(run(inSlip, frames).outcome).toBe('playing');
    const allGates = { ...inSlip, course: { gates: 5, starts: [0, 1, 1], struckBy: -1 } };
    expect(run(allGates, frames).outcome).toBe('docked');
  });

  it('ends the run when traffic hits the boat, even a boat at rest', () => {
    const inShipsWay: SimState = {
      ...initialState(course),
      x: 150000 * POS_SCALE,
      y: 195000 * POS_SCALE,
    };
    const after = run(inShipsWay, 60 * FRAMES_PER_SECOND);
    expect(after.outcome).toBe('hit');
    expect(after.speed).toBe(0);
    expect(after.course?.struckBy).toBe(SHIP);
  });
});

describe('traffic start times', () => {
  it('starts the ship at once and holds the others at their first point', () => {
    const start = initialState(course);
    expect(start.course?.starts).toEqual([0, -1, -1]);
    const later = run(start, 300);
    const [ship, ferry] = trafficPoses(course, later);
    expect(ferry).toMatchObject(vessel(FERRY).data.path[0] ?? {});
    const shipStart = vessel(SHIP).data.path[0];
    expect(ship?.x).toBe((shipStart?.x ?? 0) + Math.trunc((3500 * 300) / FRAMES_PER_SECOND));
  });

  it('starts each vessel on the frame the player passes its gate', () => {
    const final = last(clean);
    course.traffic.forEach((t, i) => {
      const start = final.course?.starts[i] ?? -1;
      const gate = t.data.startAfterGate;
      if (gate === 0) {
        expect(start).toBe(0);
        return;
      }
      const passed = clean.findIndex((s) => (s.course?.gates ?? 0) >= gate);
      expect(passed).toBeGreaterThan(0);
      expect(start).toBe(passed);
    });
  });
});

describe('the ship in the channel (Rules 9(b), 9(d))', () => {
  const channel = mission.channels?.[0];
  if (!channel) throw new Error('the course has no channel');
  const ship = vessel(SHIP);

  it('runs the channel across the open water between the shores', () => {
    const shores = mission.obstacles.filter((o) => o.kind === 'shore' && o.h > channel.h);
    const west = Math.max(...shores.filter((o) => o.x === 0).map((o) => o.x + o.w));
    const east = Math.min(...shores.filter((o) => o.x > 0).map((o) => o.x));
    expect(channel.x).toBe(west);
    expect(channel.x + channel.w).toBe(east);
  });

  it('keeps the whole ship inside the channel limits wherever she is on the water', () => {
    const end = ship.segments.reduce((sum, s) => sum + s.len, 0);
    let checked = 0;
    for (let d = 0; d <= end; d += 1000) {
      const pose = trafficPose(ship, d);
      for (const [cx, cy] of trafficCircles(ship, pose)) {
        if (cx - ship.radiusMm < channel.x || cx + ship.radiusMm > channel.x + channel.w) continue;
        checked++;
        expect(cy - ship.radiusMm).toBeGreaterThanOrEqual(channel.y);
        expect(cy + ship.radiusMm).toBeLessThanOrEqual(channel.y + channel.h);
      }
    }
    expect(checked).toBeGreaterThan(1000);
  });

  it('starts the player south of the channel with gate 1 north of it, so every run crosses it', () => {
    const gate1 = mission.gates?.[0];
    if (!gate1) throw new Error('no gate 1');
    expect(mission.start.y).toBeGreaterThan(channel.y + channel.h);
    expect(Math.max(gate1.y1, gate1.y2)).toBeLessThan(channel.y);
    const ys = clean.map((s) => s.y / POS_SCALE);
    const inside = ys.findIndex((y) => y <= channel.y + channel.h && y >= channel.y);
    const beyond = ys.findIndex((y) => y < channel.y);
    expect(inside).toBeGreaterThan(0);
    expect(beyond).toBeGreaterThan(inside);
  });

  it('keeps the boat under 20 m, so Rule 9(b) applies to it', () => {
    expect(mission.boat.lengthMm).toBeLessThan(20000);
  });

  it('cites Rules 9(b) and 9(d) with the checked "not impede" lesson', () => {
    expect(ship.data.lesson).toBe(
      "You're under 20 m. Don't impede a ship that can navigate only inside the channel, and don't cross ahead of her if that would impede her (Rules 9(b), 9(d)).",
    );
  });
});

describe('the ferry head-on (Rule 14)', () => {
  it('is within a few degrees of dead ahead, on a nearly reciprocal course, when she turns to starboard', () => {
    for (const states of [clean, ferryHit]) {
      const f = firstTurn(course, states, FERRY);
      if (f === null) throw new Error('the ferry never reached her turn');
      const s = sampleAt(course, states, f, FERRY);
      expect(Math.abs(s.relativeBearing)).toBeLessThanOrEqual(5);
      const offReciprocal = Math.abs(((((s.heading - s.vesselCourse) % 360) + 360) % 360) - 180);
      expect(offReciprocal).toBeLessThanOrEqual(10);
    }
  });

  it('turns to her own starboard', () => {
    const [leg1, leg2] = vessel(FERRY).segments;
    if (!leg1 || !leg2) throw new Error('the ferry track has no turn');
    // Eastbound, starboard is south: y grows on the second leg.
    expect(leg1.dx).toBeGreaterThan(0);
    expect(leg1.dy).toBe(0);
    expect(leg2.dy).toBeGreaterThan(0);
  });

  it('passes port to port in the clean run', () => {
    // At her closest approach she is on the player's port side.
    const closest = clean
      .map((st) => sampleAt(course, clean, st.frame, FERRY))
      .filter((st) => (clean[st.frame]?.course?.starts[FERRY] ?? -1) >= 0)
      .reduce((a, b) => (b.rangeMm < a.rangeMm ? b : a));
    expect(closest.relativeBearing).toBeLessThan(0);
    expect(closest.relativeBearing).toBeGreaterThan(-180);
  });

  it('hits a player who turns to port into her', () => {
    const final = last(ferryHit);
    expect(final.outcome).toBe('hit');
    expect(final.course?.struckBy).toBe(FERRY);
  });
});

describe('the clean run', () => {
  it('docks after every gate without touching anything', () => {
    const final = last(clean);
    expect(final.outcome).toBe('docked');
    expect(final.course?.gates).toBe(mission.gates?.length);
    expect(final.bumps).toBe(0);
  });
});

describe('the verification driver', () => {
  it('keeps LEVER_HALF at 135, half the helm track, centered on stop at y 473', () => {
    const drive = readFileSync(
      join(root, '.claude', 'skills', 'verify-captains-academy', 'drive.mjs'),
      'utf8',
    );
    const helm = readFileSync(join(root, 'src', 'game', 'helm.ts'), 'utf8');
    expect(drive).toMatch(/^const LEVER_HALF = 135;$/m);
    expect(drive).toMatch(/^const LEVER_MID_Y = 473;$/m);
    const track = /top: viewH - (\d+), bottom: viewH - (\d+)/.exec(helm);
    const top = Number(track?.[1]);
    const bottom = Number(track?.[2]);
    expect((top - bottom) / 2).toBe(135);
    expect(768 - (top + bottom) / 2).toBe(473);
  });
});
