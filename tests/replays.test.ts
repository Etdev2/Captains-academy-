import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseMission } from '../src/sim/mission';
import { runReplay, replaySchema } from '../src/sim/replay';
import { compileLevel } from '../src/sim/sim';

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
      const { final, traceHash } = runReplay(levelFor(replay.missionId), replay);
      expect(final.outcome).toBe(expected[name]);
      await expect(JSON.stringify({ final, traceHash }, null, 2) + '\n').toMatchFileSnapshot(
        join(dir, `${name}.result.json`),
      );
    });
  }
});
