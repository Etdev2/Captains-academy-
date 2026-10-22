import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileTraffic, crossesGate, trafficPose } from '../src/sim/course';
import { parseMission } from '../src/sim/mission';
import { runReplay, replaySchema } from '../src/sim/replay';
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

// The course level (#46): gates in order, traffic on fixed tracks, and a slip
// that waits for the last gate.

const root = join(import.meta.dirname, '..');
const load = (id: string) =>
  compileLevel(
    parseMission(JSON.parse(readFileSync(join(root, 'missions', `${id}.json`), 'utf8'))),
  );
const course = load('long-beach-traffic');
const run = (state: SimState, frames: number) => {
  let s = state;
  for (let i = 0; i < frames; i++) s = step(course, s, NO_INPUT);
  return s;
};

describe('gates', () => {
  const gate = { x1: 0, y1: 0, x2: 1000, y2: 0 };
  it('counts a move that crosses the gate line', () => {
    expect(crossesGate(500, 100, 500, -100, gate)).toBe(true);
    expect(crossesGate(500, -100, 500, 100, gate)).toBe(true);
  });
  it('ignores a move that passes beside the gate or stops short of it', () => {
    expect(crossesGate(1500, 100, 1500, -100, gate)).toBe(false);
    expect(crossesGate(500, 300, 500, 100, gate)).toBe(false);
    expect(crossesGate(500, 100, 500, 100, gate)).toBe(false);
  });
});

describe('traffic tracks', () => {
  const ferry = course.traffic[2];
  if (!ferry) throw new Error('the course has no ferry');
  it('runs along its track and stops at the end', () => {
    const [a, b] = ferry.data.path;
    expect(trafficPose(ferry, 0)).toMatchObject({ x: a?.x, y: a?.y });
    expect(trafficPose(ferry, 90000)).toMatchObject({ x: b?.x, y: b?.y });
    const end = ferry.data.path.at(-1);
    expect(trafficPose(ferry, 10_000_000)).toMatchObject({ x: end?.x, y: end?.y });
  });
  it('waits at its first point until the player passes its gate', () => {
    const start = initialState(course);
    expect(start.course?.starts).toEqual([0, -1, -1, -1]);
    const later = run(start, 300);
    const [ship, , waiting] = trafficPoses(course, later);
    expect(waiting).toMatchObject({ x: 30000, y: 55000 });
    const shipStart = course.traffic[0]?.data.path[0];
    expect(ship?.x).toBe((shipStart?.x ?? 0) + Math.trunc((3500 * 300) / FRAMES_PER_SECOND));
  });
  it('builds the same track from the same data', () => {
    expect(compileTraffic(ferry.data)).toEqual(ferry);
  });
});

describe('the course level', () => {
  it('leaves levels without a course exactly as they were', () => {
    const plain = initialState(load('long-beach-docking'));
    expect('course' in plain).toBe(false);
    expect('course' in step(load('long-beach-docking'), plain, NO_INPUT)).toBe(false);
  });

  it('does not count the slip until every gate is passed', () => {
    const { slip } = course.mission;
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
    expect(after.course?.struckBy).toBe(0);
  });

  it('turning to port into the head-on ferry gets the boat hit by the ferry', () => {
    const replay = replaySchema.parse(
      JSON.parse(
        readFileSync(
          join(root, 'tests', 'replays', 'long-beach-traffic-hit-by-ferry.replay.json'),
          'utf8',
        ),
      ),
    );
    const { final } = runReplay(course, replay);
    expect(final.outcome).toBe('hit');
    expect(course.traffic[final.course?.struckBy ?? -1]?.data.name).toBe('ferry');
  });
});
