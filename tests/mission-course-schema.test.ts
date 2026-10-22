import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { missionSchema, parseMission } from '../src/sim/mission';

// The optional gates and traffic fields added to the mission schema for #46.
// Missions without them must parse exactly as before.

const dir = join(import.meta.dirname, '..', 'missions');
const read = (file: string): Record<string, unknown> =>
  JSON.parse(readFileSync(join(dir, file), 'utf8')) as Record<string, unknown>;

const gates = [
  { x1: 1000, y1: 5000, x2: 3000, y2: 5000 },
  { x1: 1000, y1: 3000, x2: 3000, y2: 3000 },
];
const vessel = {
  name: 'test vessel',
  kind: 'ferry',
  lengthMm: 30000,
  beamMm: 8000,
  speedMmPerS: 4000,
  startAfterGate: 2,
  lesson: 'Test lesson line.',
  path: [
    { x: 0, y: 1000 },
    { x: 9000, y: 1000 },
  ],
};
const base = read('long-beach-docking.json');
const withCourse = (traffic: Record<string, unknown>) => ({
  ...base,
  gates,
  traffic: [{ ...vessel, ...traffic }],
});
// Each problem as "path: message", so a test can name the exact field it expects.
const problems = (data: unknown): string[] => {
  const result = missionSchema.safeParse(data);
  if (result.success) throw new Error('expected the mission to be rejected');
  return result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};
const pathsOf = (data: unknown): string[] => problems(data).map((p) => p.split(':')[0] ?? '');

describe('every mission file', () => {
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    it(`${file} parses unchanged`, () => {
      const data = read(file);
      const mission = parseMission(data);
      expect(mission).toEqual(data);
      if (!('gates' in data) && !('traffic' in data)) {
        expect(mission.gates).toBeUndefined();
        expect(mission.traffic).toBeUndefined();
      }
    });
  }
});

describe('missions with a course', () => {
  it('accepts valid gates and traffic', () => {
    const mission = parseMission(withCourse({}));
    expect(mission.gates).toEqual(gates);
    expect(mission.traffic?.[0]).toEqual(vessel);
  });

  it('accepts traffic that starts at once', () => {
    expect(parseMission(withCourse({ startAfterGate: 0 })).traffic?.[0]?.startAfterGate).toBe(0);
  });

  it('rejects traffic that waits for a gate the mission does not have', () => {
    expect(problems(withCourse({ startAfterGate: 3 }))).toEqual([
      'traffic.0.startAfterGate: starts after gate 3, but the mission has 2 gate(s)',
    ]);
    expect(problems({ ...base, traffic: [vessel] })).toEqual([
      'traffic.0.startAfterGate: starts after gate 2, but the mission has 0 gate(s)',
    ]);
  });

  it('rejects a track that repeats a point', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 5000, y: 0 },
      { x: 5000, y: 0 },
    ];
    expect(problems(withCourse({ path }))).toEqual([
      'traffic.0.path.2: repeats the point before it',
    ]);
  });

  it('rejects a track shorter than two points', () => {
    expect(pathsOf(withCourse({ path: [{ x: 0, y: 0 }] }))).toEqual(['traffic.0.path']);
  });

  it('rejects unknown keys on a gate, a vessel or a track point', () => {
    expect(pathsOf({ ...base, gates: [{ ...gates[0], width: 5 }] })).toEqual(['gates.0']);
    expect(pathsOf(withCourse({ color: 'gold' }))).toEqual(['traffic.0']);
    expect(
      pathsOf(
        withCourse({
          path: [
            { x: 0, y: 0, z: 1 },
            { x: 1, y: 0 },
          ],
        }),
      ),
    ).toEqual(['traffic.0.path.0']);
  });

  it('rejects sizes and speeds that are not positive whole millimeters', () => {
    for (const key of ['lengthMm', 'beamMm', 'speedMmPerS']) {
      for (const bad of [0, -1, 1.5]) {
        expect(pathsOf(withCourse({ [key]: bad }))).toEqual([`traffic.0.${key}`]);
      }
    }
  });

  it('rejects an empty course list or an unknown vessel kind', () => {
    expect(pathsOf({ ...base, gates: [] })).toEqual(['gates']);
    expect(pathsOf(withCourse({ kind: 'submarine' }))).toEqual(['traffic.0.kind']);
  });
});
