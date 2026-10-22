import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileTraffic, trafficCircles, trafficPose } from '../src/sim/course';
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
  RISK_CPA_MM,
  RISK_HORIZON_S,
  firstTurn,
  framesOf,
  riskStart,
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
// overtaking. A crossing needs the powerboat forward of that line, with margin.
const OVERTAKING_LINE = 112.5;
const MARGIN = 15;

describe('the powerboat crossing (Rule 15)', () => {
  it('is a crossing from starboard when risk of collision begins in the golden replays', () => {
    for (const states of [clean, powerboatHit]) {
      const f = riskStart(course, states, POWERBOAT);
      if (f === null) throw new Error('no risk of collision with the powerboat');
      const { relativeBearing } = sampleAt(course, states, f, POWERBOAT);
      expect(relativeBearing).toBeGreaterThan(0);
      expect(relativeBearing).toBeLessThan(OVERTAKING_LINE - MARGIN);
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

  // Every straight-leg route from a point on gate 2 to a point on gate 3, then
  // to a point on gate 4 or on along the same course, at slow, middle and full
  // speed. Risk of collision is judged the way the replays judge it.
  it('stays forward of the overtaking line on every route through gates 2 to 4', () => {
    const pb = compileTraffic(vessel(POWERBOAT).data);
    const g = mission.gates ?? [];
    const along = (i: number) => {
      const q = g[i];
      if (!q) throw new Error(`no gate ${i + 1}`);
      return [0.15, 0.5, 0.85].map((k) => ({
        x: q.x1 + (q.x2 - q.x1) * k,
        y: q.y1 + (q.y2 - q.y1) * k,
      }));
    };
    expect(pb.data.startAfterGate).toBe(3);
    const end = trafficPose(pb, Number.MAX_SAFE_INTEGER);
    let routes = 0;
    let withRisk = 0;
    for (const a of along(1)) {
      for (const b of along(2)) {
        const ab = Math.hypot(b.x - a.x, b.y - a.y);
        const holding = {
          x: b.x + ((b.x - a.x) / ab) * 80000,
          y: b.y + ((b.y - a.y) / ab) * 80000,
        };
        for (const c of [...along(3), holding]) {
          for (const v of [1500, 2500, 3500]) {
            routes++;
            const ux = (c.x - b.x) / Math.hypot(c.x - b.x, c.y - b.y);
            const uy = (c.y - b.y) / Math.hypot(c.x - b.x, c.y - b.y);
            const heading = (Math.atan2(ux, -uy) * 180) / Math.PI;
            const legMm = Math.hypot(c.x - b.x, c.y - b.y);
            // The powerboat starts as the player crosses gate 3, at b.
            for (let t = 0; t * v < legMm; t += 0.1) {
              const px = b.x + ux * v * t;
              const py = b.y + uy * v * t;
              const pose = trafficPose(pb, Math.trunc(t * pb.data.speedMmPerS));
              if (pose.x === end.x && pose.y === end.y) break;
              const scale = pb.data.speedMmPerS / Math.hypot(pose.ux, pose.uy);
              const rx = pose.x - px;
              const ry = pose.y - py;
              const wx = pose.ux * scale - ux * v;
              const wy = pose.uy * scale - uy * v;
              const tcpa = Math.max(0, -(rx * wx + ry * wy) / (wx * wx + wy * wy));
              if (
                Math.hypot(rx + wx * tcpa, ry + wy * tcpa) < RISK_CPA_MM &&
                tcpa <= RISK_HORIZON_S
              ) {
                withRisk++;
                const bearing = (Math.atan2(rx, -ry) * 180) / Math.PI;
                const relative = ((((bearing - heading + 180) % 360) + 360) % 360) - 180;
                expect(relative).toBeGreaterThan(0);
                expect(relative).toBeLessThan(OVERTAKING_LINE - MARGIN);
                break;
              }
            }
          }
        }
      }
    }
    expect(routes).toBe(108);
    expect(withRisk).toBeGreaterThan(0);
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
