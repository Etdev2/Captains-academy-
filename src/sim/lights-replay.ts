import { z } from 'zod';
import type { LightsInput, LightsLevel, LightsState } from './lights';
import { hashLightsState, initialState, step } from './lights';

// A lights replay is a list of runs: wait this many frames, then answer or skip
// the replay. It names answers by id, so the file reads like a game. Running it
// from the start of the level must always give the same result.

const waitFrames = z.number().int().min(0);

export const lightsReplaySchema = z
  .object({
    schemaVersion: z.literal(1),
    missionId: z.string().min(1),
    note: z.string(),
    runs: z
      .array(
        z.union([
          z.object({ waitFrames, answer: z.string().min(1) }).strict(),
          z.object({ waitFrames, skip: z.literal(true) }).strict(),
        ]),
      )
      .min(1),
    // Frames to let pass after the last run, such as a replay timing out.
    settleFrames: waitFrames.default(0),
  })
  .strict();

export type LightsReplay = z.infer<typeof lightsReplaySchema>;

export interface LightsReplayResult {
  readonly final: LightsState;
  /** Hash of every frame's state, so a divergence anywhere in the run shows. */
  readonly traceHash: number;
}

/** Throws when the replay answers a button that is not on screen, so a bad recording is loud. */
export function runLightsReplay(
  level: LightsLevel,
  replay: LightsReplay,
  attempt = 0,
): LightsReplayResult {
  if (replay.missionId !== level.mission.id) {
    throw new Error(`replay is for ${replay.missionId}, not ${level.mission.id}`);
  }
  let state = initialState(level, attempt);
  let traceHash = hashLightsState(state);
  const advance = (input: LightsInput) => {
    state = step(level, state, input);
    traceHash = hashLightsState(state, traceHash);
  };
  replay.runs.forEach((run, n) => {
    for (let i = 0; i < run.waitFrames; i++) advance(null);
    if (state.outcome !== 'playing') {
      throw new Error(`run ${n}: the level already ended (${state.outcome})`);
    }
    if ('answer' in run) {
      if (state.phase !== 'asking' || !state.options.includes(run.answer)) {
        throw new Error(`run ${n}: "${run.answer}" is not on the buttons`);
      }
      advance({ kind: 'answer', pick: run.answer });
    } else {
      if (state.phase !== 'replay') throw new Error(`run ${n}: there is no replay to skip`);
      advance({ kind: 'skip' });
    }
  });
  for (let i = 0; i < replay.settleFrames; i++) advance(null);
  return { final: state, traceHash };
}
