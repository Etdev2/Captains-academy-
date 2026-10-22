import type { CompiledTraffic } from '../../src/sim/course';
import { crossesGate, trafficCircles, trafficPose } from '../../src/sim/course';
import type { Input, Level, SimState } from '../../src/sim/sim';
import {
  FRAMES_PER_SECOND,
  HEADING_FULL_TURN,
  POS_SCALE,
  hullCircles,
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

/** A crossing from starboard keeps the vessel between dead ahead and this bearing. */
export const CROSSING_LIMIT_DEG = 112.5 - 15;

/**
 * Every frame from the start of risk of collision until the range stops
 * closing or the vessel hits the boat. A run where the vessel hits the boat
 * without risk ever beginning yields the contact frame alone. Empty if the
 * vessel never comes into risk or contact.
 */
export function closingSamples(
  level: Level,
  states: readonly SimState[],
  vessel: number,
): Sample[] {
  const hitAt = states.findIndex((s) => s.course?.struckBy === vessel);
  const from = riskStart(level, states, vessel) ?? (hitAt < 0 ? null : hitAt);
  if (from === null) return [];
  const out: Sample[] = [];
  for (let f = from; f < states.length; f++) {
    const sample = sampleAt(level, states, f, vessel);
    const before = out.at(-1);
    if (before && sample.rangeMm > before.rangeMm) break;
    out.push(sample);
    if (f === hitAt) break;
  }
  return out;
}

export interface Route {
  readonly x: number;
  readonly y: number;
  readonly heading: number;
  readonly speedMmPerS: number;
}

export interface RouteResult {
  readonly route: Route;
  /** Relative bearings, degrees, on every frame checked. Empty if risk never began. */
  readonly bearings: readonly number[];
  readonly contact: boolean;
}

function circleHitsRect(
  px: number,
  py: number,
  r: number,
  o: { x: number; y: number; w: number; h: number },
): boolean {
  const dx = px - Math.max(o.x, Math.min(px, o.x + o.w));
  const dy = py - Math.max(o.y, Math.min(py, o.y + o.h));
  return dx * dx + dy * dy < r * r;
}

/** True when the boat's hull, as the sim draws it, touches the shore, an obstacle or the chart edge. */
function outOfOpenWater(level: Level, x: number, y: number, heading: number): boolean {
  const { world, obstacles } = level.mission;
  const r = level.hullRadiusMm;
  for (const [px, py] of hullCircles(level, x * POS_SCALE, y * POS_SCALE, heading)) {
    if (px - r < 0 || py - r < 0 || px + r > world.w || py + r > world.h) return true;
    if (obstacles.some((o) => circleHitsRect(px, py, r, o))) return true;
  }
  return false;
}

function hullsTouch(
  level: Level,
  t: CompiledTraffic,
  x: number,
  y: number,
  heading: number,
  run: number,
): boolean {
  const reach = level.hullRadiusMm + t.radiusMm;
  const hull = hullCircles(level, x * POS_SCALE, y * POS_SCALE, heading);
  for (const [tx, ty] of trafficCircles(t, trafficPose(t, run))) {
    for (const [hx, hy] of hull) {
      if ((hx - tx) ** 2 + (hy - ty) ** 2 < reach * reach) return true;
    }
  }
  return false;
}

/**
 * Follows one straight, constant-speed route from the moment the vessel starts
 * until she finishes her track, the boat leaves open water, or the boat would
 * cross the stop gate. Judges risk of collision as riskStart does, and records
 * the vessel's relative bearing on every frame from the start of risk until the
 * range stops closing or the hulls touch.
 */
export function followRoute(
  level: Level,
  vessel: number,
  route: Route,
  stopGate: { x1: number; y1: number; x2: number; y2: number } | undefined,
): RouteResult {
  const t = level.traffic[vessel];
  if (!t) throw new Error(`no vessel ${vessel}`);
  const rad = (route.heading * Math.PI) / 180;
  const ux = Math.sin(rad);
  const uy = -Math.cos(rad);
  const v = route.speedMmPerS;
  const heading = Math.round((route.heading * HEADING_FULL_TURN) / 360);
  const end = trafficPose(t, Number.MAX_SAFE_INTEGER);
  const bearings: number[] = [];
  let risk = false;
  let lastRange = Infinity;
  for (let f = 0; ; f++) {
    const run = Math.trunc((t.data.speedMmPerS * f) / FRAMES_PER_SECOND);
    const pose = trafficPose(t, run);
    if (pose.x === end.x && pose.y === end.y) break;
    const x = route.x + (ux * v * f) / FRAMES_PER_SECOND;
    const y = route.y + (uy * v * f) / FRAMES_PER_SECOND;
    if (f > 0 && stopGate) {
      const px = route.x + (ux * v * (f - 1)) / FRAMES_PER_SECOND;
      const py = route.y + (uy * v * (f - 1)) / FRAMES_PER_SECOND;
      if (crossesGate(Math.trunc(px), Math.trunc(py), Math.trunc(x), Math.trunc(y), stopGate))
        break;
    }
    if (f % 6 === 0 && outOfOpenWater(level, x, y, heading)) break;
    const rx = pose.x - x;
    const ry = pose.y - y;
    const range = Math.hypot(rx, ry);
    const contact = range < t.data.lengthMm + 20000 && hullsTouch(level, t, x, y, heading, run);
    if (!risk) {
      const scale = t.data.speedMmPerS / Math.hypot(pose.ux, pose.uy);
      const wx = pose.ux * scale - ux * v;
      const wy = pose.uy * scale - uy * v;
      const w2 = wx * wx + wy * wy;
      const tcpa = w2 === 0 ? 0 : Math.max(0, -(rx * wx + ry * wy) / w2);
      const cpa = Math.hypot(rx + wx * tcpa, ry + wy * tcpa);
      risk = (cpa < RISK_CPA_MM && tcpa <= RISK_HORIZON_S) || contact;
      lastRange = Infinity;
    }
    if (risk) {
      if (range > lastRange) {
        if (!contact) break;
      }
      lastRange = range;
      bearings.push(wrap180(degrees(Math.atan2(rx, -ry)) - route.heading));
    }
    if (contact) return { route, bearings, contact: true };
  }
  return { route, bearings, contact: false };
}

/**
 * Every straight route out of a gate the sweep tests: start points every
 * metre across the gate wherever the hull clears every obstacle on every
 * heading, every heading within 90 degrees of north in 2 degree steps, and a
 * stopped boat plus 0.5 to 3.5 m/s in 0.5 m/s steps.
 */
export function routesOutOfGate(level: Level, gateIndex: number): Route[] {
  const gate = level.gates[gateIndex];
  if (!gate) throw new Error(`no gate ${gateIndex + 1}`);
  const headings = Array.from({ length: 91 }, (_, i) => (((-90 + 2 * i) % 360) + 360) % 360);
  const length = Math.hypot(gate.x2 - gate.x1, gate.y2 - gate.y1);
  const points: { x: number; y: number }[] = [];
  for (let d = 0; d <= length; d += 1000) {
    const x = gate.x1 + ((gate.x2 - gate.x1) * d) / length;
    const y = gate.y1 + ((gate.y2 - gate.y1) * d) / length;
    const clear = headings.every(
      (h) => !outOfOpenWater(level, x, y, Math.round((h * HEADING_FULL_TURN) / 360)),
    );
    if (clear) points.push({ x, y });
  }
  const speeds = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500];
  return points.flatMap((p) =>
    headings.flatMap((heading) => speeds.map((speedMmPerS) => ({ ...p, heading, speedMmPerS }))),
  );
}
