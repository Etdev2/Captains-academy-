import { z } from 'zod';
import type { Input, Level, SimState } from './sim';
import { hashState, initialState, step } from './sim';

// A replay is a list of input runs: hold these engine levers and rudder for this
// many frames. Running it from the mission's start must always give the same
// result, which the golden-replay tests check.

// -100 to 100, like the engine levers and the wheel.
const axis = z.number().int().min(-100).max(100);

export const replaySchema = z
  .object({
    schemaVersion: z.literal(2),
    missionId: z.string().min(1),
    note: z.string(),
    runs: z
      .array(
        z
          .object({
            frames: z.number().int().positive(),
            port: axis,
            starboard: axis,
            rudder: axis,
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export type Replay = z.infer<typeof replaySchema>;

export interface ReplayResult {
  readonly final: SimState;
  /** Hash of every frame's state, so a divergence anywhere in the run shows. */
  readonly traceHash: number;
}

export function runReplay(level: Level, replay: Replay): ReplayResult {
  if (replay.missionId !== level.mission.id) {
    throw new Error(`replay is for ${replay.missionId}, not ${level.mission.id}`);
  }
  let state = initialState(level);
  let traceHash = hashState(state);
  for (const run of replay.runs) {
    const input: Input = { port: run.port, starboard: run.starboard, rudder: run.rudder };
    for (let i = 0; i < run.frames; i++) {
      state = step(level, state, input);
      traceHash = hashState(state, traceHash);
    }
  }
  return { final: state, traceHash };
}
