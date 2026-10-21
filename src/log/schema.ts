// The sea-time log's database on the device. See src/store/idb.ts for how
// migrations work: never edit a shipped one, add a new one at the end.

import type { DatabaseSpec } from '../store/idb';

export const STORES = {
  entries: 'sea_time_entries',
  /**
   * Changes waiting to reach the server. Reserved for sync, which a later
   * change adds with the academy login (A4). Nothing writes here yet.
   */
  outbox: 'outbox',
} as const;

export const SEA_LOG_DB: DatabaseSpec = {
  name: 'captains-academy-sea-log',
  migrations: [
    // Version 1: entries keyed by id, and the outbox in write order.
    (db) => {
      const entries = db.createObjectStore(STORES.entries, { keyPath: 'id' });
      entries.createIndex('updatedAt', 'updatedAt');
      db.createObjectStore(STORES.outbox, { keyPath: 'seq', autoIncrement: true });
    },
  ],
};
