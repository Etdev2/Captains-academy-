import { z } from 'zod';
import type { PilotInput, PilotState } from './pilot';
import { hashPilot, initialPilotState, stepPilot } from './pilot';

// A pilot replay is a list of input runs: hold these controls for this many
// frames. Running it from the start must always give the same result.

const axis = z.number().int().min(-100).max(100);

export const pilotReplaySchema = z
  .object({
    schemaVersion: z.literal(1),
    level: z.literal('grok-night-arrival'),
    note: z.string(),
    runs: z
      .array(
        z
          .object({
            frames: z.number().int().positive(),
            throttle: axis,
            rudder: axis,
            thruster: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
            throwLine: z.boolean(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export type PilotReplay = z.infer<typeof pilotReplaySchema>;

export function runPilotReplay(replay: PilotReplay): { final: PilotState; traceHash: number } {
  let state = initialPilotState();
  let traceHash = hashPilot(state);
  for (const run of replay.runs) {
    const input: PilotInput = {
      throttle: run.throttle,
      rudder: run.rudder,
      thruster: run.thruster,
      throwLine: run.throwLine,
    };
    for (let i = 0; i < run.frames; i++) {
      state = stepPilot(state, input);
      traceHash = hashPilot(state, traceHash);
    }
  }
  return { final: state, traceHash };
}
