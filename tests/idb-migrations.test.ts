import { describe, expect, it } from 'vitest';
import { SEA_LOG_DB } from '../src/log/schema';
import { migrationsToRun, NewerVersionOnDeviceError, type Migration } from '../src/store/idb';

// Which migrations a device still needs. The browser tests in e2e/log.spec.ts
// run the real migrations against Chromium's IndexedDB.

const step = (): Migration => () => undefined;
const v1 = step();
const v2 = step();
const v3 = step();
const spec = { name: 'test-db', migrations: [v1, v2, v3] };

describe('migrationsToRun', () => {
  it('runs every migration on a new device', () => {
    expect(migrationsToRun(spec, 0)).toEqual([v1, v2, v3]);
  });

  it('runs only the migrations an older database is missing, in order', () => {
    expect(migrationsToRun(spec, 1)).toEqual([v2, v3]);
    expect(migrationsToRun(spec, 2)).toEqual([v3]);
  });

  it('runs nothing on a database that is up to date', () => {
    expect(migrationsToRun(spec, 3)).toEqual([]);
  });

  it('refuses a database newer than the code, rather than guess at it', () => {
    expect(() => migrationsToRun(spec, 4)).toThrow(NewerVersionOnDeviceError);
  });

  it('refuses a version that is not a whole number', () => {
    expect(() => migrationsToRun(spec, -1)).toThrow(RangeError);
    expect(() => migrationsToRun(spec, 1.5)).toThrow(RangeError);
  });
});

describe('the sea-time log database', () => {
  // Version 1 has shipped once this merges. Changing it would leave devices
  // that already ran it with a different schema from new ones.
  it('is at version 1, with one migration', () => {
    expect(SEA_LOG_DB.name).toBe('captains-academy-sea-log');
    expect(SEA_LOG_DB.migrations).toHaveLength(1);
  });
});
