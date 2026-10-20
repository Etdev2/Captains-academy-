import { z } from 'zod';
import type { Input, Level, SimState } from './sim';
import { hashState, initialState, step } from './sim';

// A replay is a list of input runs: hold this throttle and rudder for this
// many frames. Running it from the mission's start must always give the same
// result, which the golden-replay tests check.

const axis = z.union([z.literal(-1), z.literal(0), z.literal(1)]);

export const replaySchema = z
  .object({
    schemaVersion: z.literal(1),
    missionId: z.string().min(1),
    note: z.string(),
    runs: z
      .array(
        z.object({ frames: z.number().int().positive(), throttle: axis, rudder: axis }).strict(),
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
    const input: Input = { throttle: run.throttle, rudder: run.rudder };
    for (let i = 0; i < run.frames; i++) {
      state = step(level, state, input);
      traceHash = hashState(state, traceHash);
    }
  }
  return { final: state, traceHash };
}
