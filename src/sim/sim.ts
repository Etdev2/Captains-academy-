import type { Mission, Obstacle } from './mission';
import { HEADING_UNITS, TRIG_ONE, icos, isin } from './trig';

// Deterministic boat handling for one docking level. Everything is integer
// arithmetic on a fixed 60 Hz step, so the same inputs give the same frames in
// every browser. Positions are in 1/256 mm (POS_SCALE), speeds in 1/256 mm per
// frame, and headings in 1/65536 of a turn.

export const FRAMES_PER_SECOND = 60;
export const POS_SCALE = 256;
export const HEADING_FULL_TURN = 65536;
const HEADING_TO_TRIG = HEADING_FULL_TURN / HEADING_UNITS;

export type Throttle = -1 | 0 | 1;
export type Rudder = -1 | 0 | 1;
export interface Input {
  readonly throttle: Throttle;
  readonly rudder: Rudder;
}
export const NO_INPUT: Input = { throttle: 0, rudder: 0 };

export type Outcome = 'playing' | 'docked' | 'hit';

export interface SimState {
  readonly frame: number;
  readonly x: number;
  readonly y: number;
  readonly heading: number;
  readonly speed: number;
  readonly outcome: Outcome;
  readonly dockedFrames: number;
  readonly bumps: number;
  /** True while the hull is pressed against something, so one contact counts as one bump. */
  readonly touching: boolean;
}

/** A mission converted once into the integer units the step function uses. */
export interface Level {
  readonly mission: Mission;
  readonly maxAhead: number;
  readonly maxAstern: number;
  readonly accel: number;
  readonly drag: number;
  readonly turnAtMax: number;
  readonly maxContact: number;
  readonly maxDock: number;
  readonly currentX: number;
  readonly currentY: number;
  readonly slipHeading: number;
  readonly slipTolerance: number;
  readonly holdFrames: number;
  readonly hullRadiusMm: number;
  readonly hullOffsetMm: number;
}

const mmPerSecondToSpeed = (mmPerS: number): number =>
  Math.trunc((mmPerS * POS_SCALE) / FRAMES_PER_SECOND);
const degreesToHeading = (deg: number): number => Math.trunc((deg * HEADING_FULL_TURN) / 360);

export function compileLevel(mission: Mission): Level {
  const { boat, slip, current } = mission;
  const hullRadiusMm = Math.trunc(boat.beamMm / 2);
  return {
    mission,
    maxAhead: mmPerSecondToSpeed(boat.maxAheadMmPerS),
    maxAstern: mmPerSecondToSpeed(boat.maxAsternMmPerS),
    accel: Math.trunc((boat.accelMmPerS2 * POS_SCALE) / (FRAMES_PER_SECOND * FRAMES_PER_SECOND)),
    drag: boat.dragPer65536,
    turnAtMax: Math.trunc(degreesToHeading(boat.turnDegPerSAtMax) / FRAMES_PER_SECOND),
    maxContact: mmPerSecondToSpeed(boat.maxContactMmPerS),
    maxDock: mmPerSecondToSpeed(slip.maxDockMmPerS),
    currentX: mmPerSecondToSpeed(current.eastMmPerS),
    currentY: mmPerSecondToSpeed(current.southMmPerS),
    slipHeading: degreesToHeading(slip.headingDeg),
    slipTolerance: degreesToHeading(slip.headingToleranceDeg),
    holdFrames: slip.holdSeconds * FRAMES_PER_SECOND,
    hullRadiusMm,
    hullOffsetMm: Math.max(0, Math.trunc(boat.lengthMm / 2) - hullRadiusMm),
  };
}

export function initialState(level: Level): SimState {
  const { start } = level.mission;
  return {
    frame: 0,
    x: start.x * POS_SCALE,
    y: start.y * POS_SCALE,
    heading: degreesToHeading(start.headingDeg),
    speed: 0,
    outcome: 'playing',
    dockedFrames: 0,
    bumps: 0,
    touching: false,
  };
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const wrapTurn = (h: number): number =>
  ((h % HEADING_FULL_TURN) + HEADING_FULL_TURN) % HEADING_FULL_TURN;
const trigIndex = (heading: number): number => Math.trunc(heading / HEADING_TO_TRIG);

/** Smallest signed difference between two headings, in heading units. */
export function headingDelta(a: number, b: number): number {
  const d = wrapTurn(a - b);
  return d > HEADING_FULL_TURN / 2 ? d - HEADING_FULL_TURN : d;
}

/** Centers of the circles that stand in for the hull: bow, middle and stern, in mm. */
export function hullCircles(
  level: Level,
  x: number,
  y: number,
  heading: number,
): [number, number][] {
  const cx = Math.trunc(x / POS_SCALE);
  const cy = Math.trunc(y / POS_SCALE);
  const t = trigIndex(heading);
  const ox = Math.trunc((level.hullOffsetMm * isin(t)) / TRIG_ONE);
  const oy = -Math.trunc((level.hullOffsetMm * icos(t)) / TRIG_ONE);
  return [
    [cx + ox, cy + oy],
    [cx, cy],
    [cx - ox, cy - oy],
  ];
}

function circleHitsRect(px: number, py: number, r: number, o: Obstacle): boolean {
  const nx = clamp(px, o.x, o.x + o.w);
  const ny = clamp(py, o.y, o.y + o.h);
  const dx = px - nx;
  const dy = py - ny;
  return dx * dx + dy * dy < r * r;
}

// A contact ends only once the hull is this far clear, so sub-millimeter
// creeping against a dock counts as one bump, not one per frame.
const CONTACT_CLEARANCE_MM = 100;

function touchesSomething(
  level: Level,
  x: number,
  y: number,
  heading: number,
  marginMm = 0,
): boolean {
  const { world, obstacles } = level.mission;
  const r = level.hullRadiusMm + marginMm;
  for (const [px, py] of hullCircles(level, x, y, heading)) {
    if (px - r < 0 || py - r < 0 || px + r > world.w || py + r > world.h) return true;
    for (const o of obstacles) if (circleHitsRect(px, py, r, o)) return true;
  }
  return false;
}

function inSlip(level: Level, x: number, y: number): boolean {
  const { slip } = level.mission;
  const cx = Math.trunc(x / POS_SCALE);
  const cy = Math.trunc(y / POS_SCALE);
  return cx >= slip.x && cx <= slip.x + slip.w && cy >= slip.y && cy <= slip.y + slip.h;
}

/** Drag that always moves speed toward zero, so the boat comes fully to rest. */
function applyDrag(speed: number, drag: number): number {
  if (speed === 0) return 0;
  const loss = Math.max(1, Math.ceil((Math.abs(speed) * drag) / 65536));
  return speed > 0 ? Math.max(0, speed - loss) : Math.min(0, speed + loss);
}

/** Advances the simulation by one 60 Hz frame. Finished levels stay as they are. */
export function step(level: Level, state: SimState, input: Input): SimState {
  if (state.outcome !== 'playing') return state;

  let speed = clamp(state.speed + input.throttle * level.accel, -level.maxAstern, level.maxAhead);
  speed = applyDrag(speed, level.drag);

  // Rudder authority grows with speed through the water. Astern, it reverses.
  const heading = wrapTurn(
    state.heading + Math.trunc((input.rudder * level.turnAtMax * speed) / level.maxAhead),
  );

  const t = trigIndex(heading);
  const x = state.x + Math.trunc((speed * isin(t)) / TRIG_ONE) + level.currentX;
  const y = state.y - Math.trunc((speed * icos(t)) / TRIG_ONE) + level.currentY;

  const frame = state.frame + 1;
  if (touchesSomething(level, x, y, heading)) {
    // The boat stays where it was. A soft touch is a bump; a hard one ends the level.
    const outcome: Outcome = Math.abs(state.speed) > level.maxContact ? 'hit' : 'playing';
    const bumps = state.touching ? state.bumps : state.bumps + 1;
    return { ...state, frame, speed: 0, outcome, dockedFrames: 0, bumps, touching: true };
  }

  const settled =
    inSlip(level, x, y) &&
    Math.abs(speed) <= level.maxDock &&
    Math.abs(headingDelta(heading, level.slipHeading)) <= level.slipTolerance;
  const dockedFrames = settled ? state.dockedFrames + 1 : 0;
  const outcome: Outcome = dockedFrames >= level.holdFrames ? 'docked' : 'playing';

  const touching = state.touching && touchesSomething(level, x, y, heading, CONTACT_CLEARANCE_MM);
  return { frame, x, y, heading, speed, outcome, dockedFrames, bumps: state.bumps, touching };
}

const OUTCOME_CODE: Record<Outcome, number> = { playing: 0, docked: 1, hit: 2 };

/** FNV-1a over a state's integers, folded into a running hash. */
export function hashState(state: SimState, seed = 0x811c9dc5): number {
  let h = seed >>> 0;
  const fields = [
    state.frame,
    state.x,
    state.y,
    state.heading,
    state.speed,
    OUTCOME_CODE[state.outcome],
    state.dockedFrames,
    state.bumps,
    state.touching ? 1 : 0,
  ];
  for (const v of fields) {
    // Split each value into two 32-bit halves so values past 2^31 still count.
    const lo = v % 0x100000000;
    const hi = Math.trunc(v / 0x100000000);
    for (const part of [lo, hi]) {
      h = Math.imul(h ^ (part & 0xffff), 0x01000193) >>> 0;
      h = Math.imul(h ^ ((part >>> 16) & 0xffff), 0x01000193) >>> 0;
    }
  }
  return h;
}
