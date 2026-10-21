import { describe, expect, it } from 'vitest';
import { entryToV3, ROLES_V2, SEA_LOG_DB } from '../src/log/schema';
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

// Records what a migration does to a database, without a browser. `existing`
// stands in for the entries already saved, which a migration may walk with a
// cursor and update.
function recordMigration(migration: Migration | undefined, existing: unknown[] = []) {
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
  const updated: unknown[] = [];
  const tx = {
    objectStore: (name: string) => ({
      openCursor() {
        const request: { result: unknown; onsuccess: (() => void) | null } = {
          result: null,
          onsuccess: null,
        };
        let index = 0;
        const step = () => {
          const value = existing[index];
          request.result =
            name === 'sea_time_entries' && index < existing.length
              ? {
                  value,
                  update: (next: unknown) => updated.push(next),
                  continue: () => {
                    index++;
                    step();
                  },
                }
              : null;
          request.onsuccess?.();
        };
        queueMicrotask(step);
        return request;
      },
    }),
  };
  migration(db as unknown as IDBDatabase, tx as unknown as IDBTransaction);
  return { stores, updated };
}

describe('the sea-time log database', () => {
  // A shipped migration is never edited: devices that already ran it would
  // keep a different schema from new ones.
  it('is at version 3, with three migrations', () => {
    expect(SEA_LOG_DB.name).toBe('captains-academy-sea-log');
    expect(SEA_LOG_DB.migrations).toHaveLength(3);
  });

  it('version 1 still makes the entries and outbox stores, and nothing else', () => {
    expect(recordMigration(SEA_LOG_DB.migrations[0]).stores).toEqual({
      sea_time_entries: { options: { keyPath: 'id' }, indexes: ['updatedAt'], rows: [] },
      outbox: { options: { keyPath: 'seq', autoIncrement: true }, indexes: [], rows: [] },
    });
  });

  it('version 2 adds vessels and the seeded roles, and leaves entries alone', () => {
    const { stores, updated } = recordMigration(SEA_LOG_DB.migrations[1], [{ id: 'kept' }]);
    expect(stores).toEqual({
      vessels: { options: { keyPath: 'id' }, indexes: ['updatedAt'], rows: [] },
      roles: { options: { keyPath: 'id' }, indexes: [], rows: ROLES_V2 },
    });
    expect(updated).toEqual([]);
  });

  it('version 3 adds the preferences store and gives every saved entry its new fields', async () => {
    const live = {
      id: '3f6c1a52-8e4b-4d2a-9c1f-5b7e2d8a9f10',
      source: 'live',
      startedAt: '2026-10-21T06:00:00.000Z',
      endedAt: null,
      updatedAt: '2026-10-21T06:00:00.000Z',
      deletedAt: null,
    };
    const day = {
      id: '9a2b7c4d-1e3f-4a5b-8c6d-7e8f9a0b1c2d',
      source: 'backfilled',
      day: '2026-06-14',
      hoursBand: 'under-4',
      updatedAt: '2026-10-21T06:00:00.000Z',
      deletedAt: null,
    };
    const { stores, updated } = recordMigration(SEA_LOG_DB.migrations[2], [live, day]);
    expect(stores).toEqual({
      preferences: { options: { keyPath: 'key' }, indexes: [], rows: [] },
    });
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Every entry is kept, under-4 days included, with nulls for the new fields.
    expect(updated).toEqual([entryToV3(live), entryToV3(day)]);
  });
});
