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

/** Full ahead, full astern and hard over are 100, -100 and +/-100: two engine levers and a wheel. */
export const FULL = 100;
export interface Input {
  /** Port engine lever: -100 (full astern) to 100 (full ahead). */
  readonly port: number;
  /** Starboard engine lever: -100 (full astern) to 100 (full ahead). */
  readonly starboard: number;
  /** -100 (hard to port) to 100 (hard to starboard). */
  readonly rudder: number;
}
export const NO_INPUT: Input = { port: 0, starboard: 0, rudder: 0 };

export type Outcome = 'playing' | 'docked' | 'hit';

export interface SimState {
  readonly frame: number;
  readonly x: number;
  readonly y: number;
  readonly heading: number;
  readonly speed: number;
  /** Heading change per frame. The hull carries its swing, so a turn starts and stops late. */
  readonly turnRate: number;
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
  readonly engineSteer: number;
  readonly twinTurn: number;
  readonly yawResponse: number;
  readonly maxContact: number;
  readonly maxDock: number;
  readonly currentX: number;
  readonly currentY: number;
  readonly slipHeading: number;
  readonly slipTolerance: number;
  readonly holdFrames: number;
  readonly parFrames: number;
  readonly gust: number;
  readonly gustFrames: number;
  readonly gustSeed: number;
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
    engineSteer: mmPerSecondToSpeed(boat.engineSteerMmPerS),
    twinTurn: Math.trunc(degreesToHeading(boat.twinTurnDegPerS) / FRAMES_PER_SECOND),
    yawResponse: boat.yawResponsePer65536,
    maxContact: mmPerSecondToSpeed(boat.maxContactMmPerS),
    maxDock: mmPerSecondToSpeed(slip.maxDockMmPerS),
    currentX: mmPerSecondToSpeed(current.eastMmPerS),
    currentY: mmPerSecondToSpeed(current.southMmPerS),
    slipHeading: degreesToHeading(slip.headingDeg),
    slipTolerance: degreesToHeading(slip.headingToleranceDeg),
    holdFrames: slip.holdSeconds * FRAMES_PER_SECOND,
    parFrames: mission.parSeconds * FRAMES_PER_SECOND,
    gust: mmPerSecondToSpeed(mission.wind.gustMmPerS),
    gustFrames: mission.wind.gustSeconds * FRAMES_PER_SECOND,
    gustSeed: mission.wind.seed,
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
    turnRate: 0,
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

/** In the slip, slow enough and lined up with it. */
function settled(level: Level, x: number, y: number, heading: number, speed: number): boolean {
  return (
    inSlip(level, x, y) &&
    Math.abs(speed) <= level.maxDock &&
    Math.abs(headingDelta(heading, level.slipHeading)) <= level.slipTolerance
  );
}

/** Drag that always moves speed toward zero, so the boat comes fully to rest. */
function applyDrag(speed: number, drag: number): number {
  if (speed === 0) return 0;
  const loss = Math.max(1, Math.ceil((Math.abs(speed) * drag) / 65536));
  return speed > 0 ? Math.max(0, speed - loss) : Math.min(0, speed + loss);
}

/** A 32-bit integer hash: the same gusts for the same seed in every browser. */
function hash32(seed: number, k: number): number {
  let h = (seed ^ Math.imul(k, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

function gustAt(level: Level, segment: number): [number, number] {
  const h = hash32(level.gustSeed, segment);
  const direction = h % HEADING_UNITS;
  const strength = Math.trunc((level.gust * ((h >>> 10) % 1001)) / 1000);
  return [
    Math.trunc((strength * isin(direction)) / TRIG_ONE),
    -Math.trunc((strength * icos(direction)) / TRIG_ONE),
  ];
}

/**
 * Wind drift for a frame, in position units per frame. Gusts change direction
 * and strength every gustSeconds, blending smoothly from one to the next.
 */
export function windAt(level: Level, frame: number): [number, number] {
  if (level.gust === 0) return [0, 0];
  const segment = Math.trunc(frame / level.gustFrames);
  const t = frame % level.gustFrames;
  const [ax, ay] = gustAt(level, segment);
  const [bx, by] = gustAt(level, segment + 1);
  const n = level.gustFrames;
  return [Math.trunc((ax * (n - t) + bx * t) / n), Math.trunc((ay * (n - t) + by * t) / n)];
}

const axis = (v: number): number => clamp(Math.trunc(v), -FULL, FULL);

/** Moves the turn rate part of the way to its target, at least one unit, never past it. */
function swing(turnRate: number, target: number, response: number): number {
  const gap = target - turnRate;
  if (gap === 0) return turnRate;
  const move = Math.trunc((gap * response) / 65536);
  return move !== 0 ? turnRate + move : turnRate + Math.sign(gap);
}

/** Advances the simulation by one 60 Hz frame. Finished levels stay as they are. */
export function step(level: Level, state: SimState, input: Input): SimState {
  if (state.outcome !== 'playing') return state;
  const port = axis(input.port);
  const starboard = axis(input.starboard);
  const rudder = axis(input.rudder);
  // Both engines together drive the boat ahead or astern.
  const throttle = Math.trunc((port + starboard) / 2);

  let speed = clamp(
    state.speed + Math.trunc((throttle * level.accel) / FULL),
    -level.maxAstern,
    level.maxAhead,
  );
  speed = applyDrag(speed, level.drag);

  // Rudder authority grows with water flowing past the rudder: the boat's own
  // way, or prop wash whenever the engine is in gear, so a slow boat can still
  // steer by giving it a kick ahead. Going astern, the rudder works backwards.
  const wash = Math.trunc((level.engineSteer * Math.abs(throttle)) / FULL);
  const flow = throttle === 0 ? Math.abs(speed) : Math.max(Math.abs(speed), wash);
  const direction = speed !== 0 ? Math.sign(speed) : Math.sign(throttle);
  const rudderTurn = Math.trunc(
    (rudder * direction * level.turnAtMax * flow) / (level.maxAhead * FULL),
  );
  // Split levers twist the boat: port ahead and starboard astern swings the bow
  // to starboard, even dead in the water, because the propellers sit either
  // side of the centerline.
  const twinTurn = Math.trunc(((port - starboard) * level.twinTurn) / (2 * FULL));
  const turnRate = swing(state.turnRate, rudderTurn + twinTurn, level.yawResponse);
  const heading = wrapTurn(state.heading + turnRate);

  const t = trigIndex(heading);
  const [windX, windY] = windAt(level, state.frame);
  const x = state.x + Math.trunc((speed * isin(t)) / TRIG_ONE) + level.currentX + windX;
  const y = state.y - Math.trunc((speed * icos(t)) / TRIG_ONE) + level.currentY + windY;

  const frame = state.frame + 1;
  if (touchesSomething(level, x, y, heading)) {
    // The boat stays where it was. A soft touch is a bump; a hard one ends the level.
    const bumps = state.touching ? state.bumps : state.bumps + 1;
    if (Math.abs(state.speed) > level.maxContact) {
      return {
        ...state,
        frame,
        speed: 0,
        turnRate: 0,
        outcome: 'hit',
        dockedFrames: 0,
        bumps,
        touching: true,
      };
    }
    // Lying gently against a finger pier inside the slip still counts as docked,
    // which matters when the wind or current sets the boat onto the pier.
    const dockedFrames = settled(level, state.x, state.y, heading, 0) ? state.dockedFrames + 1 : 0;
    const outcome: Outcome = dockedFrames >= level.holdFrames ? 'docked' : 'playing';
    return { ...state, frame, speed: 0, turnRate: 0, outcome, dockedFrames, bumps, touching: true };
  }

  const dockedFrames = settled(level, x, y, heading, speed) ? state.dockedFrames + 1 : 0;
  const outcome: Outcome = dockedFrames >= level.holdFrames ? 'docked' : 'playing';

  const touching = state.touching && touchesSomething(level, x, y, heading, CONTACT_CLEARANCE_MM);
  return {
    frame,
    x,
    y,
    heading,
    speed,
    turnRate,
    outcome,
    dockedFrames,
    bumps: state.bumps,
    touching,
  };
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
    state.turnRate,
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

export type Stars = 0 | 1 | 2 | 3;

/**
 * Stars for a finished run (G12): three for a clean docking within par time,
 * two for at most two bumps within twice par, one for any docking.
 */
export function starsFor(level: Level, state: SimState): Stars {
  if (state.outcome !== 'docked') return 0;
  if (state.bumps === 0 && state.frame <= level.parFrames) return 3;
  if (state.bumps <= 2 && state.frame <= level.parFrames * 2) return 2;
  return 1;
}

/** Straight-line distance from the boat to the middle of the slip, in mm. */
export function distanceToSlipMm(level: Level, state: SimState): number {
  const { slip } = level.mission;
  const dx = Math.trunc(state.x / POS_SCALE) - (slip.x + Math.trunc(slip.w / 2));
  const dy = Math.trunc(state.y / POS_SCALE) - (slip.y + Math.trunc(slip.h / 2));
  return Math.round(Math.sqrt(dx * dx + dy * dy));
}
