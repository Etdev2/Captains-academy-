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

const point = z.object({ x: mm, y: mm }).strict();

// A gate is a line the boat's center must cross. Gates count only in order.
export const gateSchema = z.object({ x1: mm, y1: mm, x2: mm, y2: mm }).strict();

// Another vessel that runs a fixed track at a steady speed. Its track never
// reacts to the player, so the same inputs always meet it in the same place.
export const trafficSchema = z
  .object({
    name: z.string().min(1),
    kind: z.enum(['ship', 'ferry', 'powerboat', 'kayak']),
    lengthMm: positiveMm,
    beamMm: positiveMm,
    speedMmPerS: positiveMm,
    // Starts moving once the player passes this gate (1 is the first), or at once for 0.
    startAfterGate: z.number().int().min(0),
    // One line shown when this vessel hits the player.
    lesson: z.string().min(1),
    path: z.array(point).min(2),
  })
  .strict();

export const missionSchema = z
  .object({
    schemaVersion: z.literal(2),
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
        // Turn rate with one engine full ahead and the other full astern.
        twinTurnDegPerS: positiveMm,
        // How quickly the boat's swing follows the helm, out of 65536 per frame.
        // Lower carries the swing longer, so turns start and stop later.
        yawResponsePer65536: z.number().int().min(1).max(65536),
        // Hitting anything faster than this ends the level.
        maxContactMmPerS: positiveMm,
      })
      .strict(),
    // Gusts on top of the current. They change every gustSeconds, from a seeded
    // hash, so a replay meets exactly the same wind. Zero means calm.
    wind: z
      .object({
        gustMmPerS: z.number().int().min(0),
        gustSeconds: z.number().int().min(1).max(30),
        seed: z.number().int().min(0).max(0xffffffff),
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
    // A course: pass every gate in order before the slip counts.
    gates: z.array(gateSchema).min(1).optional(),
    traffic: z.array(trafficSchema).min(1).optional(),
  })
  .strict()
  .superRefine((m, ctx) => {
    const gateCount = m.gates?.length ?? 0;
    m.traffic?.forEach((t, i) => {
      if (t.startAfterGate > gateCount) {
        ctx.addIssue({
          code: 'custom',
          path: ['traffic', i, 'startAfterGate'],
          message: `starts after gate ${t.startAfterGate}, but the mission has ${gateCount} gate(s)`,
        });
      }
      t.path.forEach((p, j) => {
        const prev = t.path[j - 1];
        if (prev && prev.x === p.x && prev.y === p.y) {
          ctx.addIssue({
            code: 'custom',
            path: ['traffic', i, 'path', j],
            message: 'repeats the point before it',
          });
        }
      });
    });
  });

export type Mission = z.infer<typeof missionSchema>;
export type Obstacle = z.infer<typeof obstacleSchema>;
export type Gate = z.infer<typeof gateSchema>;
export type Traffic = z.infer<typeof trafficSchema>;

/** Parses unknown JSON into a mission, or throws with every problem listed. */
export function parseMission(data: unknown): Mission {
  return missionSchema.parse(data);
}
