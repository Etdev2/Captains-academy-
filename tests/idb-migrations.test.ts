import { describe, expect, it } from 'vitest';
import { ROLES_V2, SEA_LOG_DB } from '../src/log/schema';
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

// Records what a migration does to a database, without a browser.
function recordMigration(migration: Migration | undefined) {
  if (!migration) throw new Error('no such migration');
  const stores: Record<
    string,
    { options: IDBObjectStoreParameters | undefined; indexes: string[]; rows: unknown[] }
  > = {};
  const db = {
    createObjectStore(name: string, options?: IDBObjectStoreParameters) {
      const store = { options, indexes: [] as string[], rows: [] as unknown[] };
      stores[name] = store;
      return {
        createIndex: (index: string) => store.indexes.push(index),
        put: (row: unknown) => store.rows.push(row),
      };
    },
  };
  migration(db as unknown as IDBDatabase, {} as IDBTransaction);
  return stores;
}

describe('the sea-time log database', () => {
  // A shipped migration is never edited: devices that already ran it would
  // keep a different schema from new ones.
  it('is at version 2, with two migrations', () => {
    expect(SEA_LOG_DB.name).toBe('captains-academy-sea-log');
    expect(SEA_LOG_DB.migrations).toHaveLength(2);
  });

  it('version 1 still makes the entries and outbox stores, and nothing else', () => {
    expect(recordMigration(SEA_LOG_DB.migrations[0])).toEqual({
      sea_time_entries: { options: { keyPath: 'id' }, indexes: ['updatedAt'], rows: [] },
      outbox: { options: { keyPath: 'seq', autoIncrement: true }, indexes: [], rows: [] },
    });
  });

  it('version 2 adds vessels and the seeded roles, and leaves entries alone', () => {
    expect(recordMigration(SEA_LOG_DB.migrations[1])).toEqual({
      vessels: { options: { keyPath: 'id' }, indexes: ['updatedAt'], rows: [] },
      roles: { options: { keyPath: 'id' }, indexes: [], rows: ROLES_V2 },
    });
  });
});
