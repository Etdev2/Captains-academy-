import { trafficPose } from '../../src/sim/course';
import type { Input, Level, SimState } from '../../src/sim/sim';
import {
  FRAMES_PER_SECOND,
  HEADING_FULL_TURN,
  POS_SCALE,
  step,
  trafficPoses,
} from '../../src/sim/sim';

// Measures how a traffic vessel meets the player, the way the uscg-regs check
// of the harbor course did (docs/product/harbor-traffic-regs-check-2026-10-22.md).
// This is test code: it uses floating-point angles to report results and never
// feeds anything back into the simulation.

/** Risk of collision begins when the closest approach on present courses falls under this. */
export const RISK_CPA_MM = 12000;
/** ...and that closest approach is no more than this far ahead in time. */
export const RISK_HORIZON_S = 60;
/** The player's velocity is measured over this many frames. */
const VELOCITY_FRAMES = 30;

export interface Sample {
  readonly frame: number;
  /** Player position in mm and heading in degrees clockwise from north. */
  readonly x: number;
  readonly y: number;
  readonly heading: number;
  /** Bearing of the vessel from the player's bow, degrees, positive to starboard. */
  readonly relativeBearing: number;
  /** The vessel's course in degrees clockwise from north. */
  readonly vesselCourse: number;
  readonly rangeMm: number;
}

const degrees = (rad: number): number => (rad * 180) / Math.PI;
const wrap180 = (deg: number): number => ((((deg + 180) % 360) + 360) % 360) - 180;
const round1 = (v: number): number => Math.round(v * 10) / 10;

/** Runs a recorded input list and keeps every frame's state, starting state first. */
export function trace(level: Level, start: SimState, inputs: readonly Input[]): SimState[] {
  const states = [start];
  let s = start;
  for (const input of inputs) {
    s = step(level, s, input);
    states.push(s);
  }
  return states;
}

/** Expands replay runs into one input per frame. */
export function framesOf(
  runs: readonly { frames: number; port: number; starboard: number; rudder: number }[],
): Input[] {
  return runs.flatMap((r) =>
    Array.from({ length: r.frames }, () => ({
      port: r.port,
      starboard: r.starboard,
      rudder: r.rudder,
    })),
  );
}

/** How the vessel lies from the player on one frame of a trace. */
export function sampleAt(
  level: Level,
  states: readonly SimState[],
  frame: number,
  vessel: number,
): Sample {
  const s = states[frame];
  if (!s) throw new Error(`no state for frame ${frame}`);
  const pose = trafficPoses(level, s)[vessel];
  if (!pose) throw new Error(`no vessel ${vessel}`);
  const x = s.x / POS_SCALE;
  const y = s.y / POS_SCALE;
  const heading = (s.heading * 360) / HEADING_FULL_TURN;
  const trueBearing = degrees(Math.atan2(pose.x - x, -(pose.y - y)));
  return {
    frame,
    x: Math.round(x),
    y: Math.round(y),
    heading: round1(((heading % 360) + 360) % 360),
    relativeBearing: round1(wrap180(trueBearing - heading)),
    vesselCourse: round1(((degrees(Math.atan2(pose.ux, -pose.uy)) % 360) + 360) % 360),
    rangeMm: Math.round(Math.hypot(pose.x - x, pose.y - y)),
  };
}

/** True while the vessel has started and has not reached the end of its track. */
function underway(level: Level, s: SimState, vessel: number): boolean {
  const t = level.traffic[vessel];
  const start = s.course?.starts[vessel] ?? -1;
  if (!t || start < 0) return false;
  const run = Math.trunc((t.data.speedMmPerS * (s.frame - start)) / FRAMES_PER_SECOND);
  const end = trafficPose(t, Number.MAX_SAFE_INTEGER);
  const here = trafficPose(t, run);
  return here.x !== end.x || here.y !== end.y;
}

/**
 * The first frame on which risk of collision with the vessel exists: both
 * vessels moving, and on present courses and speeds the closest approach comes
 * within RISK_CPA_MM inside RISK_HORIZON_S. Null if it never does.
 */
export function riskStart(
  level: Level,
  states: readonly SimState[],
  vessel: number,
): number | null {
  const t = level.traffic[vessel];
  if (!t) throw new Error(`no vessel ${vessel}`);
  for (let f = VELOCITY_FRAMES; f < states.length; f++) {
    const s = states[f];
    const before = states[f - VELOCITY_FRAMES];
    if (!s || !before || s.outcome !== 'playing' || !underway(level, s, vessel)) continue;
    const pose = trafficPoses(level, s)[vessel];
    if (!pose) continue;
    // Velocities in mm per second.
    const px = s.x / POS_SCALE;
    const py = s.y / POS_SCALE;
    const pvx = ((s.x - before.x) / POS_SCALE) * (FRAMES_PER_SECOND / VELOCITY_FRAMES);
    const pvy = ((s.y - before.y) / POS_SCALE) * (FRAMES_PER_SECOND / VELOCITY_FRAMES);
    const scale = t.data.speedMmPerS / Math.hypot(pose.ux, pose.uy);
    const rx = pose.x - px;
    const ry = pose.y - py;
    const wx = pose.ux * scale - pvx;
    const wy = pose.uy * scale - pvy;
    const w2 = wx * wx + wy * wy;
    const tcpa = w2 === 0 ? 0 : Math.max(0, -(rx * wx + ry * wy) / w2);
    const cpa = Math.hypot(rx + wx * tcpa, ry + wy * tcpa);
    if (cpa < RISK_CPA_MM && tcpa <= RISK_HORIZON_S) return f;
  }
  return null;
}

/** The first frame on which a vessel with a bent track reaches the end of its first leg. */
export function firstTurn(
  level: Level,
  states: readonly SimState[],
  vessel: number,
): number | null {
  const t = level.traffic[vessel];
  const leg = t?.segments[0];
  if (!t || !leg || t.segments.length < 2) return null;
  const f = states.findIndex((s) => {
    const start = s.course?.starts[vessel] ?? -1;
    return (
      start >= 0 &&
      Math.trunc((t.data.speedMmPerS * (s.frame - start)) / FRAMES_PER_SECOND) >= leg.len
    );
  });
  return f < 0 ? null : f;
}

/** What a golden replay pins for each vessel: the bearings when risk of collision begins and at its first turn. */
export function encounters(level: Level, states: readonly SimState[]) {
  return Object.fromEntries(
    level.traffic.map((t, i) => {
      const risk = riskStart(level, states, i);
      const turn = firstTurn(level, states, i);
      return [
        t.data.name,
        {
          riskBegins: risk === null ? null : sampleAt(level, states, risk, i),
          ...(t.segments.length > 1
            ? { firstTurn: turn === null ? null : sampleAt(level, states, turn, i) }
            : {}),
        },
      ];
    }),
  );
}
