import { z } from 'zod';

// A mission is level data: the harbor, the boat and the goal. Every number is
// an integer, so loading a mission can never introduce floating-point drift.
// Lengths are millimeters, x grows east and y grows south (screen order), and
// headings are degrees clockwise from north.

const mm = z.number().int();
const positiveMm = z.number().int().positive();

const rect = z
  .object({
    x: mm,
    y: mm,
    w: positiveMm,
    h: positiveMm,
  })
  .strict();

export const obstacleSchema = rect
  .extend({
    kind: z.enum(['shore', 'breakwater', 'dock', 'moored-boat']),
  })
  .strict();

export const missionSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    // A clean docking within this time earns three stars (G12).
    parSeconds: z.number().int().positive(),
    world: z.object({ w: positiveMm, h: positiveMm }).strict(),
    start: z
      .object({
        x: mm,
        y: mm,
        headingDeg: z.number().int().min(0).max(359),
      })
      .strict(),
    current: z
      .object({
        eastMmPerS: z.number().int(),
        southMmPerS: z.number().int(),
      })
      .strict(),
    boat: z
      .object({
        name: z.string().min(1),
        lengthMm: positiveMm,
        beamMm: positiveMm,
        maxAheadMmPerS: positiveMm,
        maxAsternMmPerS: positiveMm,
        accelMmPerS2: positiveMm,
        // Fraction of speed lost each frame, out of 65536.
        dragPer65536: z.number().int().min(0).max(65535),
        // Turn rate at full ahead speed. Slower boats turn proportionally less.
        turnDegPerSAtMax: positiveMm,
        // With the engine in gear, prop wash over the rudder steers the boat as if
        // it were moving at least this fast, even from a standstill.
        engineSteerMmPerS: positiveMm,
        // Hitting anything faster than this ends the level.
        maxContactMmPerS: positiveMm,
      })
      .strict(),
    obstacles: z.array(obstacleSchema).min(1),
    slip: rect
      .extend({
        headingDeg: z.number().int().min(0).max(359),
        headingToleranceDeg: z.number().int().min(1).max(90),
        maxDockMmPerS: positiveMm,
        holdSeconds: z.number().int().min(1).max(10),
      })
      .strict(),
  })
  .strict();

export type Mission = z.infer<typeof missionSchema>;
export type Obstacle = z.infer<typeof obstacleSchema>;

/** Parses unknown JSON into a mission, or throws with every problem listed. */
export function parseMission(data: unknown): Mission {
  return missionSchema.parse(data);
}
