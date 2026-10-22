import type { Gate, Traffic } from './mission';

// Gates and traffic for a course level, in whole millimeters. A traffic
// vessel's place depends only on how far along its track it has run, so it
// moves the same way in every browser and every replay.

/** Directions are scaled by UNIT, the way sines are scaled in trig.ts. */
export const UNIT = 1024;

interface Segment {
  readonly x1: number;
  readonly y1: number;
  readonly dx: number;
  readonly dy: number;
  readonly len: number;
}

export interface CompiledTraffic {
  readonly data: Traffic;
  readonly segments: readonly Segment[];
  /** The hull is a row of circles this wide, spread along its length. */
  readonly radiusMm: number;
  readonly circles: number;
  readonly halfSpanMm: number;
}

export interface TrafficPose {
  readonly x: number;
  readonly y: number;
  /** Direction of travel, scaled by UNIT. */
  readonly ux: number;
  readonly uy: number;
}

export function compileTraffic(data: Traffic): CompiledTraffic {
  const segments: Segment[] = [];
  for (let i = 1; i < data.path.length; i++) {
    const a = data.path[i - 1];
    const b = data.path[i];
    if (!a || !b) continue;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    // Math.sqrt is correctly rounded everywhere, so lengths agree across browsers.
    segments.push({
      x1: a.x,
      y1: a.y,
      dx,
      dy,
      len: Math.max(1, Math.round(Math.sqrt(dx * dx + dy * dy))),
    });
  }
  const radiusMm = Math.trunc(data.beamMm / 2);
  return {
    data,
    segments,
    radiusMm,
    circles: Math.max(1, Math.ceil(data.lengthMm / data.beamMm)),
    halfSpanMm: Math.max(0, Math.trunc(data.lengthMm / 2) - radiusMm),
  };
}

function along(s: Segment, d: number): TrafficPose {
  return {
    x: s.x1 + Math.trunc((s.dx * d) / s.len),
    y: s.y1 + Math.trunc((s.dy * d) / s.len),
    ux: Math.trunc((s.dx * UNIT) / s.len),
    uy: Math.trunc((s.dy * UNIT) / s.len),
  };
}

/** Where a vessel is after running this far along its track. Past the end, it stays there. */
export function trafficPose(t: CompiledTraffic, travelledMm: number): TrafficPose {
  let left = Math.max(0, travelledMm);
  let last: Segment | undefined;
  for (const s of t.segments) {
    last = s;
    if (left <= s.len) return along(s, left);
    left -= s.len;
  }
  if (!last) throw new Error(`${t.data.name} has no track`);
  return along(last, last.len);
}

/** Centers of the circles that stand in for the vessel's hull, in mm. */
export function trafficCircles(t: CompiledTraffic, pose: TrafficPose): [number, number][] {
  const out: [number, number][] = [];
  for (let k = 0; k < t.circles; k++) {
    const off =
      t.circles === 1 ? 0 : -t.halfSpanMm + Math.trunc((2 * t.halfSpanMm * k) / (t.circles - 1));
    out.push([
      pose.x + Math.trunc((off * pose.ux) / UNIT),
      pose.y + Math.trunc((off * pose.uy) / UNIT),
    ]);
  }
  return out;
}

const cross = (ax: number, ay: number, bx: number, by: number): number =>
  Math.sign(ax * by - ay * bx);

/** True when the move from (x0, y0) to (x1, y1) crosses the gate line. */
export function crossesGate(x0: number, y0: number, x1: number, y1: number, g: Gate): boolean {
  if (x0 === x1 && y0 === y1) return false;
  const gx = g.x2 - g.x1;
  const gy = g.y2 - g.y1;
  const a = cross(gx, gy, x0 - g.x1, y0 - g.y1);
  const b = cross(gx, gy, x1 - g.x1, y1 - g.y1);
  const c = cross(x1 - x0, y1 - y0, g.x1 - x0, g.y1 - y0);
  const d = cross(x1 - x0, y1 - y0, g.x2 - x0, g.y2 - y0);
  if (a === 0 && b === 0) return false;
  return a * b <= 0 && c * d <= 0;
}
