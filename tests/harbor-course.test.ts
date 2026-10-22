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
import {
  CROSSING_LIMIT_DEG,
  closingSamples,
  firstTurn,
  followRoute,
  framesOf,
  riskStart,
  routesOutOfGate,
  sampleAt,
  trace,
} from './helpers/encounter';

// The Long Beach harbor course (#46): gates in order, traffic on fixed tracks,
// a slip that waits for the last gate, and the traffic situations corrected by
// the uscg-regs check (docs/product/harbor-traffic-regs-check-2026-10-22.md).

const root = join(import.meta.dirname, '..');
const load = (id: string) =>
  compileLevel(
    parseMission(JSON.parse(readFileSync(join(root, 'missions', `${id}.json`), 'utf8'))),
  );
const course = load('long-beach-traffic');
const { mission } = course;
const SHIP = 0;
const POWERBOAT = 1;
const FERRY = 2;
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
const powerboatHit = replay('long-beach-traffic-hit-by-powerboat');
// The PR #54 review's probe: slow out of gate 3 on 306.9, holding course.
const overtakenFromGate3 = replay('long-beach-traffic-overtaken-from-gate-3');
const last = (states: SimState[]) => {
  const s = states.at(-1);
  if (!s) throw new Error('empty trace');
  return s;
};

describe('the course level', () => {
  it('names its traffic in the order these tests use', () => {
    expect(course.traffic.map((t) => t.data.name)).toEqual([
      'container ship',
      'powerboat',
      'ferry',
      'kayak',
    ]);
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
    const afterGate1 = { ...below, course: { gates: 1, starts: [0, -1, -1, -1], struckBy: -1 } };
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
    const allGates = { ...inSlip, course: { gates: 5, starts: [0, 1, 1, 1], struckBy: -1 } };
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
    expect(start.course?.starts).toEqual([0, -1, -1, -1]);
    const later = run(start, 300);
    const [ship, powerboat, ferry] = trafficPoses(course, later);
    expect(powerboat).toMatchObject(vessel(POWERBOAT).data.path[0] ?? {});
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

// Rule 13(b): a vessel coming up from more than 22.5 degrees abaft the beam is
// overtaking (more than 112.5 degrees relative). A crossing from starboard
// keeps the powerboat between dead ahead and that line less a 15 degree
// margin, CROSSING_LIMIT_DEG, on every frame from the start of risk of
// collision until the range stops closing or the hulls touch.
const crossesFromStarboard = (bearings: readonly number[]) =>
  bearings.every((b) => b > 0 && b < CROSSING_LIMIT_DEG);

describe('the powerboat crossing (Rule 15)', () => {
  it('is a crossing from starboard on every frame of risk in the golden replays', () => {
    for (const states of [clean, powerboatHit]) {
      const closing = closingSamples(course, states, POWERBOAT);
      expect(closing.length).toBeGreaterThan(0);
      for (const s of closing) {
        expect(s.relativeBearing).toBeGreaterThan(0);
        expect(s.relativeBearing).toBeLessThan(CROSSING_LIMIT_DEG);
      }
    }
  });

  it('hits a player who holds course instead of keeping out of her way', () => {
    const final = last(powerboatHit);
    expect(final.outcome).toBe('hit');
    expect(final.course?.struckBy).toBe(POWERBOAT);
    // The helmsman held one heading from risk of collision to the hit.
    const f = riskStart(course, powerboatHit, POWERBOAT) ?? 0;
    const headings = powerboatHit
      .slice(f)
      .map((s) => sampleAt(course, powerboatHit, s.frame, POWERBOAT).heading);
    expect(Math.max(...headings) - Math.min(...headings)).toBeLessThan(1);
  });

  it('never hits the review probe from abaft the beam', () => {
    // A slow player holding 306.9 out of gate 3 must not be hit by an
    // overtaking powerboat under the Rule 15 banner.
    const final = last(overtakenFromGate3);
    if (final.course?.struckBy !== POWERBOAT) return;
    for (const s of closingSamples(course, overtakenFromGate3, POWERBOAT)) {
      expect(s.relativeBearing).toBeGreaterThan(0);
      expect(s.relativeBearing).toBeLessThan(CROSSING_LIMIT_DEG);
    }
  });

  // Every straight, constant-speed route out of gate 3: points every metre
  // across the gate where the hull clears the moored boat at its east end,
  // every heading within 90 degrees of north in 2 degree steps, and a stopped
  // boat plus 0.5 to 3.5 m/s in 0.5 m/s steps. Each route runs until the
  // powerboat finishes her track, the boat leaves open water, or the boat
  // would reach gate 4. Contact uses the sim's own hull and traffic circles.
  it('meets the powerboat as a crossing from starboard on every route out of gate 3', () => {
    expect(vessel(POWERBOAT).data.startAfterGate).toBe(3);
    const routes = routesOutOfGate(course, 2);
    expect(routes.length).toBeGreaterThan(10000);
    const failures = routes
      .map((r) => followRoute(course, POWERBOAT, r, mission.gates?.[3]))
      .filter((r) => r.bearings.length > 0 && !crossesFromStarboard(r.bearings))
      .map((r) => ({
        ...r.route,
        contact: r.contact,
        first: Math.round(r.bearings[0] ?? 0),
        worst: Math.round(
          r.bearings.reduce((w, b) => (b <= 0 || b >= CROSSING_LIMIT_DEG ? b : w), 0),
        ),
      }));
    expect(failures.slice(0, 5), `${failures.length} of ${routes.length} routes fail`).toEqual([]);
  }, 120_000);
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
