import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileLightsLevel, starsFor } from '../src/sim/lights';
import { parseLightsMission } from '../src/sim/lights-mission';
import { lightsReplaySchema, runLightsReplay } from '../src/sim/lights-replay';

// Replays for the lights rapid-fire level: each recorded input file must end
// exactly as described here, and running it twice must give the same trace hash.
// The recordings live in tests/replays/lights/, which scripts/verify.sh also
// freezes: changing one needs VERIFY_UPDATE_REPLAYS=1.

const root = join(import.meta.dirname, '..');
const dir = join(root, 'tests', 'replays', 'lights');
const level = compileLightsLevel(
  parseLightsMission(
    JSON.parse(readFileSync(join(root, 'missions', 'chapter-1-lights-rapid-fire.json'), 'utf8')),
  ),
);

const expected: Record<
  string,
  { outcome: string; hearts: number; misses: number; correct: number; stars: number }
> = {
  'lights-clean-run': { outcome: 'cleared', hearts: 3, misses: 0, correct: 17, stars: 3 },
  'lights-miss-and-return': { outcome: 'cleared', hearts: 2, misses: 1, correct: 17, stars: 2 },
  'lights-out-of-hearts': { outcome: 'out-of-hearts', hearts: 0, misses: 3, correct: 0, stars: 0 },
};

describe('lights golden replays', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.replay.json'));

  it('covers every replay this test expects', () => {
    expect(files.map((f) => f.replace('.replay.json', '')).sort()).toEqual(
      Object.keys(expected).sort(),
    );
  });

  for (const file of files) {
    const name = file.replace('.replay.json', '');
    it(`${name} ends as recorded, the same way every time`, () => {
      const replay = lightsReplaySchema.parse(JSON.parse(readFileSync(join(dir, file), 'utf8')));
      const first = runLightsReplay(level, replay);
      const again = runLightsReplay(level, replay);
      expect(again.traceHash).toBe(first.traceHash);
      expect(again.final).toEqual(first.final);

      const { final } = first;
      expect({
        outcome: final.outcome,
        hearts: final.hearts,
        misses: final.misses,
        correct: final.correct,
        stars: starsFor(level, final),
      }).toEqual(expected[name]);
    });
  }

  it('a different button order still replays when the answers are on screen', () => {
    // The clean run names answers, not button positions, so any attempt's
    // shuffle plays the same level.
    const replay = lightsReplaySchema.parse(
      JSON.parse(readFileSync(join(dir, 'lights-clean-run.replay.json'), 'utf8')),
    );
    const other = runLightsReplay(level, replay, 3);
    expect(other.final.outcome).toBe('cleared');
    expect(other.final.misses).toBe(0);
  });

  it('refuses a recording that answers a button that is not on screen', () => {
    const replay = lightsReplaySchema.parse({
      schemaVersion: 1,
      missionId: level.mission.id,
      note: 'bad',
      runs: [{ waitFrames: 1, answer: 'draft' }],
    });
    expect(() => runLightsReplay(level, replay)).toThrow(/not on the buttons/);
  });

  it('the miss-and-return recording meets the missed lights a second time', () => {
    const replay = lightsReplaySchema.parse(
      JSON.parse(readFileSync(join(dir, 'lights-miss-and-return.replay.json'), 'utf8')),
    );
    const { final } = runLightsReplay(level, replay);
    expect(final.missCounts[1]).toBe(1);
    // 17 situations, and the missed one is answered right on its return.
    expect(final.correct).toBe(17);
    expect(replay.runs.filter((run) => 'answer' in run)).toHaveLength(18);
  });
});
