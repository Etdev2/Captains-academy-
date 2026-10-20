import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import missionJson from '../missions/long-beach-docking.json';
import { parseMission } from '../src/sim/mission';
import { runReplay, replaySchema } from '../src/sim/replay';
import { compileLevel } from '../src/sim/sim';

// Golden replays: each recorded input file must reproduce its saved result
// exactly. A change to the simulation that moves any frame changes the trace
// hash and fails here. Update the saved results only on purpose, with
// VERIFY_UPDATE_REPLAYS=1 bash scripts/verify.sh.

const dir = join(import.meta.dirname, 'replays');
const level = compileLevel(parseMission(missionJson));
const expected: Record<string, string> = {
  'long-beach-docking-docks': 'docked',
  'long-beach-docking-hits-shore': 'hit',
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
      const { final, traceHash } = runReplay(level, replay);
      expect(final.outcome).toBe(expected[name]);
      await expect(JSON.stringify({ final, traceHash }, null, 2) + '\n').toMatchFileSnapshot(
        join(dir, `${name}.result.json`),
      );
    });
  }
});
