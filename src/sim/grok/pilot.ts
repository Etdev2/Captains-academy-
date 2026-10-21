import { icos, isin } from '../trig';

// Grok's take on level 1: a night arrival into a Long Beach marina. Separate
// from the level in src/sim/sim.ts, it shares only the integer trig table.
//
// The player rides a tidal set through the harbor entrance, lines up two
// leading lights, uses a bow thruster with a small battery, and finishes by
// throwing a mooring line at the right moment. Everything is integer math on
// a fixed 60 Hz step: positions in 1/256 mm, speeds in 1/256 mm per frame and
// headings in 1/65536 of a turn. The same inputs give the same frames anywhere.

export const FPS = 60;
export const Q = 256;
export const TURN = 65536;

export interface Rect {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  readonly kind: 'breakwater' | 'pier' | 'finger' | 'moored';
}

/** All lengths in mm, speeds in mm/s, y grows southward (down the screen). */
export const HARBOR = {
  widthMm: 128_000,
  heightMm: 76_800,
  start: { x: 64_000, y: 69_000, headingDeg: 0 },
  boat: { lengthMm: 10_000, beamMm: 3_200 },
  maxAheadMmPerS: 2_600,
  maxAsternMmPerS: 1_300,
  accelMmPerS2: 650,
  turnDegPerS: 28,
  thrusterDegPerS: 14,
  /** Frames of thruster the full battery holds, and how fast it refills. */
  batteryFrames: 4 * FPS,
  rechargeEvery: 4,
  /** Tidal set across the entrance: east-west, swinging back and forth. */
  tideAmpMmPerS: 420,
  tidePeriodFrames: 24 * FPS,
  /** Inside the breakwater the set drops to a quarter. */
  shelterY: 50_000,
  /** Leading lights: two lights on one north-south line behind the slip. */
  rangeX: 64_000,
  rangeFrontY: 3_000,
  rangeRearY: 600,
  rangeHalfWidthMm: 1_800,
  /** The cleat on the pier head, where the line must land. */
  cleat: { x: 64_000, y: 8_600 },
  lineReachMm: 2_800,
  maxMoorMmPerS: 450,
  moorHeadingTolDeg: 18,
  lineCooldownFrames: 60,
  hearts: 3,
  parFrames: 75 * FPS,
} as const;

export const OBSTACLES: readonly Rect[] = [
  { x0: 0, y0: 50_000, x1: 50_000, y1: 53_500, kind: 'breakwater' },
  { x0: 78_000, y0: 50_000, x1: 128_000, y1: 53_500, kind: 'breakwater' },
  { x0: 0, y0: 0, x1: 128_000, y1: 7_000, kind: 'pier' },
  { x0: 52_000, y0: 7_000, x1: 56_500, y1: 24_000, kind: 'finger' },
  { x0: 71_500, y0: 7_000, x1: 76_000, y1: 24_000, kind: 'finger' },
  { x0: 22_000, y0: 28_000, x1: 40_000, y1: 33_500, kind: 'moored' },
  { x0: 88_000, y0: 22_000, x1: 106_000, y1: 27_500, kind: 'moored' },
];

export interface PilotInput {
  /** -100 full astern to 100 full ahead. */
  readonly throttle: number;
  /** -100 hard to port to 100 hard to starboard. */
  readonly rudder: number;
  /** -1 push the bow to port, 0 off, 1 push it to starboard. */
  readonly thruster: -1 | 0 | 1;
  /** Held down to throw the line; a throw fires on the frame it goes down. */
  readonly throwLine: boolean;
}
export const IDLE: PilotInput = { throttle: 0, rudder: 0, thruster: 0, throwLine: false };

export type PilotOutcome = 'playing' | 'moored' | 'out-of-hearts';
export type PilotEvent = 'none' | 'bump' | 'line-short' | 'line-fast' | 'moored';

export interface PilotState {
  readonly frame: number;
  readonly x: number;
  readonly y: number;
  readonly heading: number;
  readonly speed: number;
  readonly turnRate: number;
  readonly battery: number;
  readonly hearts: number;
  readonly outcome: PilotOutcome;
  readonly touching: boolean;
  readonly lineHeld: boolean;
  readonly lineCooldown: number;
  /** Frames spent inside the breakwater with the leading lights in line. */
  readonly onRangeFrames: number;
  /** Frames spent inside the breakwater at all. */
  readonly insideFrames: number;
  /** Speed at the moment the line landed, mm/s; 0 until moored. */
  readonly moorSpeedMmPerS: number;
  /** What happened on this frame, for the renderer's effects and sounds. */
  readonly event: PilotEvent;
}

const perFrame = (mmPerS: number): number => Math.trunc((mmPerS * Q) / FPS);
const degToHeading = (deg: number): number => Math.trunc((deg * TURN) / 360);
const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const wrap = (h: number): number => ((h % TURN) + TURN) % TURN;

const MAX_AHEAD = perFrame(HARBOR.maxAheadMmPerS);
const MAX_ASTERN = perFrame(HARBOR.maxAsternMmPerS);
const ACCEL = Math.max(1, Math.trunc((HARBOR.accelMmPerS2 * Q) / (FPS * FPS)));
const TURN_MAX = Math.trunc(degToHeading(HARBOR.turnDegPerS) / FPS);
const THRUST_TURN = Math.trunc(degToHeading(HARBOR.thrusterDegPerS) / FPS);
const HALF_LEN = HARBOR.boat.lengthMm / 2;
const RADIUS = HARBOR.boat.beamMm / 2;

export function initialPilotState(): PilotState {
  return {
    frame: 0,
    x: HARBOR.start.x * Q,
    y: HARBOR.start.y * Q,
    heading: degToHeading(HARBOR.start.headingDeg),
    speed: 0,
    turnRate: 0,
    battery: HARBOR.batteryFrames,
    hearts: HARBOR.hearts,
    outcome: 'playing',
    touching: false,
    lineHeld: false,
    lineCooldown: 0,
    onRangeFrames: 0,
    insideFrames: 0,
    moorSpeedMmPerS: 0,
    event: 'none',
  };
}

/** Sine and cosine of a 1/65536-turn heading, scaled by 16384. */
const hsin = (h: number): number => isin(wrap(h) >> 6);
const hcos = (h: number): number => icos(wrap(h) >> 6);

/** East-west tidal set at this frame and place, in 1/256 mm per frame. */
export function tideAt(frame: number, yQ: number): number {
  const p = HARBOR.tidePeriodFrames;
  const phase = frame % p;
  const half = p / 2;
  const tri = phase < half ? phase : p - phase; // 0 .. half
  const mmPerS = Math.trunc(((tri * 2 - half) * HARBOR.tideAmpMmPerS) / half);
  const sheltered = yQ < HARBOR.shelterY * Q;
  return perFrame(sheltered ? Math.trunc(mmPerS / 4) : mmPerS);
}

/** Bow position in mm. */
export function bowMm(s: Pick<PilotState, 'x' | 'y' | 'heading'>): { x: number; y: number } {
  return {
    x: Math.trunc(s.x / Q) + Math.trunc((HALF_LEN * hsin(s.heading)) / 16384),
    y: Math.trunc(s.y / Q) - Math.trunc((HALF_LEN * hcos(s.heading)) / 16384),
  };
}

function hullHits(xQ: number, yQ: number, heading: number): boolean {
  const cx = Math.trunc(xQ / Q);
  const cy = Math.trunc(yQ / Q);
  const dx = Math.trunc(((HALF_LEN - RADIUS) * hsin(heading)) / 16384);
  const dy = -Math.trunc(((HALF_LEN - RADIUS) * hcos(heading)) / 16384);
  const points = [
    [cx, cy],
    [cx + dx, cy + dy],
    [cx - dx, cy - dy],
  ] as const;
  for (const [px, py] of points) {
    if (px < RADIUS || py < RADIUS) return true;
    if (px > HARBOR.widthMm - RADIUS || py > HARBOR.heightMm - RADIUS) return true;
    for (const r of OBSTACLES) {
      const nx = clamp(px, r.x0, r.x1) - px;
      const ny = clamp(py, r.y0, r.y1) - py;
      if (nx * nx + ny * ny < RADIUS * RADIUS) return true;
    }
  }
  return false;
}

export function stepPilot(s: PilotState, input: PilotInput): PilotState {
  if (s.outcome !== 'playing') return { ...s, event: 'none' };
  const throttle = clamp(Math.trunc(input.throttle), -100, 100);
  const rudder = clamp(Math.trunc(input.rudder), -100, 100);

  // Engine: the hull speeds up and slows down at a fixed rate.
  const target =
    throttle >= 0
      ? Math.trunc((throttle * MAX_AHEAD) / 100)
      : Math.trunc((throttle * MAX_ASTERN) / 100);
  const speed = s.speed + clamp(target - s.speed, -ACCEL, ACCEL);

  // Rudder bites with water flow; a little prop wash keeps it alive at rest.
  const flow = Math.abs(speed) + Math.trunc(Math.abs(target) / 4);
  const bite = Math.trunc((Math.min(flow, MAX_AHEAD) * 1024) / MAX_AHEAD);
  const dir = speed < 0 ? -1 : 1;
  let turnTarget = Math.trunc((((rudder * TURN_MAX) / 100) * bite) / 1024) * dir;

  // Bow thruster: turns the bow even when stopped, while the battery lasts.
  let battery = s.battery;
  if (input.thruster !== 0 && battery > 0) {
    turnTarget += input.thruster * THRUST_TURN;
    battery -= 1;
  } else if (input.thruster === 0 && s.frame % HARBOR.rechargeEvery === 0) {
    battery = Math.min(HARBOR.batteryFrames, battery + 1);
  }
  const turnRate = s.turnRate + Math.trunc((turnTarget - s.turnRate) / 12);
  const heading = wrap(s.heading + turnRate);

  const vx = Math.trunc((speed * hsin(heading)) / 16384) + tideAt(s.frame, s.y);
  const vy = -Math.trunc((speed * hcos(heading)) / 16384);
  let x = s.x + vx;
  let y = s.y + vy;

  let hearts = s.hearts;
  let event: PilotEvent = 'none';
  let nextSpeed = speed;
  let touching = false;
  if (hullHits(x, y, heading)) {
    touching = true;
    x = s.x;
    y = s.y;
    nextSpeed = -Math.trunc(speed / 3);
    if (!s.touching) {
      hearts -= 1;
      event = 'bump';
    }
  }

  const inside = y < HARBOR.shelterY * Q;
  const onRange = inside && Math.abs(Math.trunc(x / Q) - HARBOR.rangeX) <= HARBOR.rangeHalfWidthMm;

  // Line handling: a throw fires on the frame the button goes down.
  let lineCooldown = Math.max(0, s.lineCooldown - 1);
  let outcome: PilotOutcome = hearts <= 0 ? 'out-of-hearts' : 'playing';
  let moorSpeedMmPerS = 0;
  if (input.throwLine && !s.lineHeld && lineCooldown === 0 && outcome === 'playing') {
    const bow = bowMm({ x, y, heading });
    const dx = bow.x - HARBOR.cleat.x;
    const dy = bow.y - HARBOR.cleat.y;
    const near = dx * dx + dy * dy <= HARBOR.lineReachMm * HARBOR.lineReachMm;
    const mmPerS = Math.trunc((Math.abs(nextSpeed) * FPS) / Q);
    const off = Math.abs(((heading + TURN / 2) % TURN) - TURN / 2);
    const square = off <= degToHeading(HARBOR.moorHeadingTolDeg);
    if (near && square && mmPerS <= HARBOR.maxMoorMmPerS) {
      outcome = 'moored';
      moorSpeedMmPerS = mmPerS;
      event = 'moored';
    } else {
      // A missed throw splashes and costs a heart, then the deckhand recoils it.
      hearts -= 1;
      lineCooldown = HARBOR.lineCooldownFrames;
      event = near && square ? 'line-fast' : 'line-short';
      if (hearts <= 0) outcome = 'out-of-hearts';
    }
  }

  return {
    frame: s.frame + 1,
    x,
    y,
    heading,
    speed: outcome === 'moored' ? 0 : nextSpeed,
    turnRate: outcome === 'moored' ? 0 : turnRate,
    battery,
    hearts,
    outcome,
    touching,
    lineHeld: input.throwLine,
    lineCooldown,
    onRangeFrames: s.onRangeFrames + (onRange ? 1 : 0),
    insideFrames: s.insideFrames + (inside ? 1 : 0),
    moorSpeedMmPerS,
    event,
  };
}

/** 1 to 3 stars once moored (DECISIONS.md G12): 3 needs no hearts lost and par time. */
export function pilotStars(s: PilotState): 0 | 1 | 2 | 3 {
  if (s.outcome !== 'moored') return 0;
  if (s.hearts === HARBOR.hearts && s.frame <= HARBOR.parFrames) return 3;
  if (s.hearts >= 2) return 2;
  return 1;
}

/** How gently the line went over: "kiss" under 150 mm/s, "firm" otherwise. */
export function moorFeel(s: PilotState): 'kiss' | 'firm' | 'none' {
  if (s.outcome !== 'moored') return 'none';
  return s.moorSpeedMmPerS <= 150 ? 'kiss' : 'firm';
}

/** Share of the time inside the breakwater spent on the leading line, 0 to 100. */
export function rangePercent(s: PilotState): number {
  return s.insideFrames === 0 ? 0 : Math.trunc((s.onRangeFrames * 100) / s.insideFrames);
}

/** FNV-1a over the state's numbers, for golden replays. */
export function hashPilot(s: PilotState, seed = 0x811c9dc5): number {
  const outcomes: Record<PilotOutcome, number> = { playing: 0, moored: 1, 'out-of-hearts': 2 };
  const fields = [
    s.frame,
    s.x,
    s.y,
    s.heading,
    s.speed,
    s.turnRate,
    s.battery,
    s.hearts,
    outcomes[s.outcome],
    s.lineCooldown,
    s.onRangeFrames,
  ];
  let h = seed >>> 0;
  for (const f of fields) {
    let v = f | 0;
    for (let i = 0; i < 4; i++) {
      h ^= v & 0xff;
      h = Math.imul(h, 0x01000193) >>> 0;
      v >>= 8;
    }
  }
  return h;
}
