// Rule 21 visibility (ADR 0004): which navigation lights an observer can see.
// Pure integer math on the 1,024-unit turn from src/sim/trig.ts. It imports no
// Phaser, DOM or audio code, so the Lights level, the flashcards and a later
// Night Harbor Run all ask the same question and get the same answer.
//
// The sector values are Rule 21's, from docs/product/lights-regs-check-*.md:
//   masthead light      225 degrees, 112.5 either side of ahead  (Rule 21(a))
//   sidelight           112.5 degrees from dead ahead to abaft the beam (Rule 21(b), (c))
//   sternlight          135 degrees, 67.5 either side of astern  (Rule 21(c))
//   towing light        the sternlight's sector                  (Rule 21(d))
//   all-round light     360 degrees                              (Rule 21(e))

import { HEADING_UNITS, TRIG_ONE, icos, isin, wrapHeading } from './trig';

const HALF_TURN = HEADING_UNITS / 2;
/** 112.5 degrees: the aft edge of the masthead and sidelight sectors. Exact in 1,024 units. */
export const AFT_EDGE = 320;
/** 67.5 degrees either side of astern is the same line: HALF_TURN - 192 = 320. */
export const STERN_HALF_SECTOR = HALF_TURN - AFT_EDGE;

export type LightColor = 'white' | 'red' | 'green' | 'yellow';
export type LightArc = 'masthead' | 'starboard' | 'port' | 'stern' | 'all-round';

export interface LightSpec {
  /** Stable within one vessel. Renderers and replays name a visible light by this id. */
  readonly id: string;
  readonly color: LightColor;
  readonly arc: LightArc;
}

/**
 * The observer's bearing from the vessel, relative to her heading, as a signed
 * half-turn: 0 is dead ahead of her, 256 her starboard beam, 512 dead astern,
 * and -256 her port beam. Astern is always +512, never -512.
 */
export function relativeAspect(heading: number, bearing: number): number {
  const turn = wrapHeading(bearing - heading);
  return turn > HALF_TURN ? turn - HEADING_UNITS : turn;
}

/**
 * Whether one light shows at this aspect. `overlap` is how many units each
 * sidelight is allowed to reach across the bow (Annex I's forward cutoff). It
 * defaults to none, so the sidelights meet exactly at dead ahead. The aft
 * edge, exactly 320 units, belongs to the stern sector (ADR 0004).
 */
export function isVisible(light: LightSpec, aspect: number, overlap = 0): boolean {
  const a = relativeAspect(0, aspect);
  switch (light.arc) {
    case 'all-round':
      return true;
    case 'masthead':
      return Math.abs(a) < AFT_EDGE;
    case 'starboard':
      return a >= -overlap && a < AFT_EDGE;
    case 'port':
      return a <= overlap && a > -AFT_EDGE;
    case 'stern':
      return Math.abs(a) >= AFT_EDGE;
  }
}

export interface Visibility {
  readonly aspect: number;
  /** Ids of the visible lights, in the order the specs were given. */
  readonly visible: readonly string[];
}

/** Which of `lights` an observer at `bearing` sees from a vessel steering `heading`. */
export function visibleLights(
  lights: readonly LightSpec[],
  heading: number,
  bearing: number,
  overlap = 0,
): Visibility {
  const aspect = relativeAspect(heading, bearing);
  return {
    aspect,
    visible: lights.filter((l) => isVisible(l, aspect, overlap)).map((l) => l.id),
  };
}

/**
 * The integer bearing, in 1,024-unit turns clockwise from north, from one point
 * to another. `east` and `north` are the offsets of the target from the
 * observer, in any whole unit. The answer is the heading whose unit vector
 * points most nearly at the target, so it is exact to one unit (0.35 degrees).
 */
export function bearingUnits(east: number, north: number): number {
  if (!Number.isInteger(east) || !Number.isInteger(north)) {
    throw new RangeError('bearingUnits takes whole offsets');
  }
  if (east === 0 && north === 0) return 0;
  let tied: number[] = [];
  let bestDot = Number.NEGATIVE_INFINITY;
  for (let h = 0; h < HEADING_UNITS; h++) {
    const dot = isin(h) * east + icos(h) * north;
    if (dot > bestDot) {
      bestDot = dot;
      tied = [h];
    } else if (dot === bestDot) {
      tied.push(h);
    }
  }
  // The sine table is flat at its peaks, so a few headings can tie. Take the
  // one in the middle of them, going around north if the tie does.
  const apart = (a: number, b: number): number => {
    const d = Math.abs(a - b);
    return Math.min(d, HEADING_UNITS - d);
  };
  let best = tied[0] ?? 0;
  let bestSpread = Number.POSITIVE_INFINITY;
  for (const h of tied) {
    const spread = Math.max(...tied.map((t) => apart(h, t)));
    if (spread < bestSpread) {
      bestSpread = spread;
      best = h;
    }
  }
  return best;
}

/**
 * Where a light sits across the observer's view, in the same unit as `athwart`
 * and `fore`: positive is to the observer's right. `athwart` is the light's
 * offset to the vessel's starboard, `fore` its offset toward her bow. At
 * aspect 0 the vessel faces the observer, so her starboard side is on the left.
 */
export function lateralOffset(athwart: number, fore: number, aspect: number): number {
  // Adding 0 turns a rounded -0 into 0, so equal offsets compare equal.
  return Math.round((fore * isin(aspect) - athwart * icos(aspect)) / TRIG_ONE) + 0;
}
