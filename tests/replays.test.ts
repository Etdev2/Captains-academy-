import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseMission } from '../src/sim/mission';
import { runReplay, replaySchema } from '../src/sim/replay';
import { compileLevel, initialState } from '../src/sim/sim';
import { encounters, framesOf, trace } from './helpers/encounter';

// Golden replays: each recorded input file must reproduce its saved result
// exactly. A change to the simulation that moves any frame changes the trace
// hash and fails here. Update the saved results only on purpose, with
// VERIFY_UPDATE_REPLAYS=1 bash scripts/verify.sh.

const root = join(import.meta.dirname, '..');
const dir = join(root, 'tests', 'replays');
const levelFor = (missionId: string) =>
  compileLevel(
    parseMission(JSON.parse(readFileSync(join(root, 'missions', `${missionId}.json`), 'utf8'))),
  );
const expected: Record<string, string> = {
  'long-beach-docking-docks': 'docked',
  'long-beach-docking-hits-shore': 'hit',
  'long-beach-crosswind-docks': 'docked',
  'long-beach-traffic-docks': 'docked',
  'long-beach-traffic-hit-by-ferry': 'hit',
  'long-beach-traffic-hit-by-powerboat': 'hit',
};

describe('golden replays', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.replay.json'));

  it('covers every replay this test expects', () => {
    expect(files.map((f) => f.replace('.replay.json', '')).sort()).toEqual(
      Object.keys(expected).sort(),
    );
  });

  for (const file of files) {
    const name = file.replace('.replay.json', '');
    it(`${name} reproduces its saved result`, async () => {
      const replay = replaySchema.parse(JSON.parse(readFileSync(join(dir, file), 'utf8')));
      const level = levelFor(replay.missionId);
      const { final, traceHash } = runReplay(level, replay);
      expect(final.outcome).toBe(expected[name]);
      // Course levels also pin how each vessel meets the boat: the relative
      // bearing when risk of collision begins and when a vessel turns. Levels
      // without traffic save exactly what they saved before.
      const met =
        level.traffic.length > 0
          ? encounters(level, trace(level, initialState(level), framesOf(replay.runs)))
          : undefined;
      await expect(
        JSON.stringify({ final, traceHash, encounters: met }, null, 2) + '\n',
      ).toMatchFileSnapshot(join(dir, `${name}.result.json`));
    });
  }
});
