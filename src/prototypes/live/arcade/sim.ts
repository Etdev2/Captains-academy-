// A tiny docking toy for the arcade prototypes. Not the real game physics:
// it only has to feel like a boat (slow to speed up, slow to stop, pushed by
// the wind) so a reviewer can judge the screens around it. World units are metres.

export const WORLD = { w: 80, h: 100 } as const;
export const SLIP = { cx: 40, left: 35, right: 45, back: 4, mouth: 24 } as const;
/** The spot the boat has to reach: centre line x, and a range for the boat's centre. */
export const BERTH = {
  halfWidth: 2.6,
  yMin: 9,
  yMax: 17.5,
  maxAngle: 0.22,
  maxSpeed: 0.7,
} as const;
export const DWELL_SECONDS = 1;
const MS_TO_KN = 1.944;

export interface Detent {
  readonly id: -1 | 0 | 1 | 2;
  readonly label: string;
  readonly speed: number;
}
export const DETENTS: readonly Detent[] = [
  { id: 2, label: 'Ahead', speed: 2.4 },
  { id: 1, label: 'Slow ahead', speed: 1 },
  { id: 0, label: 'Stop', speed: 0 },
  { id: -1, label: 'Astern', speed: -1 },
];
export const detentSpeed = (id: number): number => DETENTS.find((d) => d.id === id)?.speed ?? 0;

export interface Wind {
  readonly id: string;
  readonly label: string;
  /** Push in metres per second toward the east (positive x). */
  readonly push: number;
  readonly gusty: boolean;
}
export const WINDS: Readonly<Record<string, Wind>> = {
  'long-beach-docking': { id: 'light', label: 'Light, from the west', push: 0.18, gusty: false },
  'crosswind-slip': { id: 'gusty', label: 'Gusty, from the west', push: 0.4, gusty: true },
};
export const windFor = (challengeId: string): Wind =>
  WINDS[challengeId] ?? (WINDS['long-beach-docking'] as Wind);

export interface Sim {
  x: number;
  y: number;
  /** Heading in radians, 0 is north (up), clockwise. */
  h: number;
  /** Speed through the water along the hull, m/s. */
  u: number;
  r: number;
  /** Ground speed in m/s, wind included. */
  ground: number;
  t: number;
  bumps: number;
  lastBump: number;
  /** Seconds left of the "touched" flash. */
  contact: number;
  contactAt: { x: number; y: number } | null;
  dwell: number;
  docked: boolean;
  /** How the boat crossed the mouth of the slip. */
  mouthSpeed: number | null;
  mouthAngle: number | null;
  usedAuto: boolean;
}

export const initialSim = (): Sim => ({
  x: 52,
  y: 82,
  h: -0.3,
  u: 0,
  r: 0,
  ground: 0,
  t: 0,
  bumps: 0,
  lastBump: -9,
  contact: 0,
  contactAt: null,
  dwell: 0,
  docked: false,
  mouthSpeed: null,
  mouthAngle: null,
  usedAuto: false,
});

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Solid ground: left quay, right quay, back wall of the slip.
const SOLIDS = [
  { x0: 0, x1: SLIP.left, y0: 0, y1: SLIP.mouth, exits: ['right', 'down'] },
  { x0: SLIP.right, x1: WORLD.w, y0: 0, y1: SLIP.mouth, exits: ['left', 'down'] },
  { x0: SLIP.left, x1: SLIP.right, y0: 0, y1: SLIP.back, exits: ['down'] },
] as const;

const HULL: readonly (readonly [number, number])[] = [
  [0, 5.8],
  [1.8, 3],
  [1.8, -1],
  [1.8, -5],
  [0, -5],
  [-1.8, -5],
  [-1.8, -1],
  [-1.8, 3],
];

export function hullPoints(s: Pick<Sim, 'x' | 'y' | 'h'>): { x: number; y: number }[] {
  const fx = Math.sin(s.h);
  const fy = -Math.cos(s.h);
  const sx = Math.cos(s.h);
  const sy = Math.sin(s.h);
  return HULL.map(([lx, ly]) => ({ x: s.x + lx * sx + ly * fx, y: s.y + lx * sy + ly * fy }));
}

export interface Input {
  /** Wanted speed through the water, m/s. */
  speed: number;
  /** Rudder, -1 full left to 1 full right. */
  rudder: number;
}

export function windNow(wind: Wind, t: number): number {
  return wind.gusty ? wind.push * (1 + 0.35 * Math.sin(t * 0.8)) : wind.push;
}

export function step(prev: Sim, dt: number, input: Input, wind: Wind): Sim {
  const s: Sim = { ...prev };
  s.t += dt;
  s.contact = Math.max(0, s.contact - dt);
  // Speed follows the wanted speed with a lag, as a heavy boat does.
  s.u += ((input.speed - s.u) / 2.5) * dt;
  const grip = clamp(Math.abs(s.u) / 1.2, 0.2, 1);
  const rWanted = input.rudder * 0.45 * grip * (s.u < -0.1 ? -1 : 1);
  s.r += ((rWanted - s.r) / 0.8) * dt;
  s.h += s.r * dt;
  const shelter = s.y < SLIP.mouth ? 0.3 : 1;
  const wx = windNow(wind, s.t) * shelter;
  const vx = Math.sin(s.h) * s.u + wx;
  const vy = -Math.cos(s.h) * s.u;
  const prevY = s.y;
  s.x += vx * dt;
  s.y += vy * dt;
  s.ground = Math.hypot(vx, vy);
  if (prevY >= SLIP.mouth && s.y < SLIP.mouth) {
    s.mouthSpeed = s.ground;
    s.mouthAngle = Math.abs(Math.atan2(Math.sin(s.h), Math.cos(s.h)));
  }
  // Contact: push the hull out of anything solid.
  let hit = false;
  for (let pass = 0; pass < 3; pass += 1) {
    for (const p of hullPoints(s)) {
      for (const b of SOLIDS) {
        if (p.x > b.x0 && p.x < b.x1 && p.y > b.y0 && p.y < b.y1) {
          const options = b.exits.map((e) =>
            e === 'right'
              ? { dx: b.x1 - p.x, dy: 0 }
              : e === 'left'
                ? { dx: b.x0 - p.x, dy: 0 }
                : { dx: 0, dy: b.y1 - p.y },
          );
          options.sort((a, c) => Math.abs(a.dx + a.dy) - Math.abs(c.dx + c.dy));
          const o = options[0];
          if (o) {
            s.x += o.dx;
            s.y += o.dy;
            hit = true;
            s.contactAt = { x: p.x + o.dx, y: p.y + o.dy };
          }
        }
      }
    }
  }
  if (hit) {
    s.u *= 0.5;
    s.r *= 0.5;
    s.contact = 0.9;
    if (s.t - s.lastBump > 1) {
      s.bumps += 1;
      s.lastBump = s.t;
    }
  }
  s.x = clamp(s.x, 2, WORLD.w - 2);
  s.y = clamp(s.y, 0, WORLD.h - 2);
  // Docked: inside the berth, lined up, nearly still, for a moment.
  const diff = Math.atan2(Math.sin(s.h), Math.cos(s.h));
  const ok =
    Math.abs(s.x - SLIP.cx) <= BERTH.halfWidth &&
    s.y >= BERTH.yMin &&
    s.y <= BERTH.yMax &&
    Math.abs(diff) <= BERTH.maxAngle &&
    s.ground < BERTH.maxSpeed;
  s.dwell = ok ? s.dwell + dt : Math.max(0, s.dwell - dt * 2);
  if (s.dwell >= DWELL_SECONDS) s.docked = true;
  return s;
}

/** What the autopilot would do. It lines up on the slip, then slows to a stop inside it. */
export function autopilot(s: Sim, wind: Wind): Input {
  const e = s.x - SLIP.cx;
  const limit = s.y > 32 ? 0.5 : 0.15;
  const shelter = s.y < SLIP.mouth ? 0.3 : 1;
  const ff = -Math.atan2(windNow(wind, s.t) * shelter, Math.max(s.u, 0.8));
  const want = clamp(-0.07 * e, -limit, limit) + (s.y > 20 ? ff : ff * 0.5);
  const diff = Math.atan2(Math.sin(want - s.h), Math.cos(want - s.h));
  return {
    rudder: clamp(2.2 * diff, -1, 1),
    speed: s.y > 45 ? 2.4 : clamp((s.y - 13) * 0.06 + 0.25, 0.25, 1.5),
  };
}

export const hullHeading = (h: number): number => (h * 180) / Math.PI;
export const knots = (ms: number): number => ms * MS_TO_KN;
export const headingDeg = (h: number): number =>
  ((Math.round((h * 180) / Math.PI) % 360) + 360) % 360;

export interface DockResult {
  readonly time: number;
  readonly bumps: number;
  readonly stars: 0 | 1 | 2 | 3;
  readonly auto: boolean;
  readonly mouthSpeed: number;
  readonly mouthAngle: number;
}

export function rate(time: number, bumps: number): 1 | 2 | 3 {
  if (bumps === 0 && time <= 75) return 3;
  if (bumps <= 2) return 2;
  return 1;
}

export function resultOf(s: Sim): DockResult {
  return {
    time: s.t,
    bumps: s.bumps,
    stars: s.usedAuto ? 0 : rate(s.t, s.bumps),
    auto: s.usedAuto,
    mouthSpeed: s.mouthSpeed ?? 1,
    mouthAngle: s.mouthAngle ?? 0,
  };
}

/** Shown when a reviewer opens a result screen without playing. */
export const SAMPLE_RESULT: DockResult = {
  time: 46.2,
  bumps: 1,
  stars: 2,
  auto: false,
  mouthSpeed: 1.1,
  mouthAngle: 0.1,
};

export const clock = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const r = Math.floor(sec % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
};

export interface Debrief {
  readonly well: readonly string[];
  readonly tip: string;
}

export function debrief(r: DockResult): Debrief {
  const well: string[] = [];
  if (r.bumps === 0) well.push('You never touched a piling.');
  if (r.mouthSpeed < 1.4) well.push('You slowed down before the slip.');
  if (r.mouthAngle < 0.14) well.push('You lined up with the slip before you went in.');
  if (well.length === 0) well.push('You got her into the slip.');
  const tip =
    r.mouthSpeed >= 1.4
      ? 'Come back to Slow ahead before the mouth of the slip. A boat takes a few seconds to slow down.'
      : r.bumps > 0
        ? 'Aim a little upwind of the slip. The wind pushes you toward the east piling.'
        : 'Try the Crosswind slip next. The wind is stronger and it gusts.';
  return { well: well.slice(0, 3), tip };
}
