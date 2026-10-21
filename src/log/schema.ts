// The sea-time log's database on the device. See src/store/idb.ts for how
// migrations work: never edit a shipped one, add a new one at the end.

import type { DatabaseSpec } from '../store/idb';
import type { Role } from './entry';

export const STORES = {
  entries: 'sea_time_entries',
  /**
   * Changes waiting to reach the server. Reserved for sync, which a later
   * change adds with the academy login (A4). Nothing writes here yet.
   */
  outbox: 'outbox',
  vessels: 'vessels',
  /** The seeded role list. Only migrations write here. */
  roles: 'roles',
  /** Choices kept on this device: backfill consent and the last check-in. */
  preferences: 'preferences',
} as const;

/**
 * Version 3's change to an entry saved before it: the fields entries gained
 * (vessel, role, waters, the GPS suggestion and, on a backfilled day,
 * consent) are added as null, meaning "not recorded". Frozen with that
 * migration, like ROLES_V2.
 */
export function entryToV3(entry: Record<string, unknown>): Record<string, unknown> {
  const upgraded: Record<string, unknown> = {
    vesselId: null,
    roleId: null,
    waters: null,
    watersSuggestion: null,
    ...entry,
  };
  if (entry.source === 'backfilled' && !('consentedAt' in entry)) upgraded.consentedAt = null;
  return upgraded;
}

/**
 * The roles version 2 seeds, frozen with that migration. A later role list
 * arrives in a later migration that adds to this one; an id here is never
 * reused or removed, because saved vessels and the rules engine refer to it.
 * Nothing here says how a role credits toward a license (open decision D4).
 */
export const ROLES_V2: readonly Role[] = [
  { id: 'deck.master', label: 'Master or captain', category: 'deck', position: 0 },
  { id: 'deck.mate', label: 'Mate', category: 'deck', position: 1 },
  { id: 'deck.pilot', label: 'Pilot', category: 'deck', position: 2 },
  { id: 'deck.boatswain', label: 'Boatswain (bosun)', category: 'deck', position: 3 },
  { id: 'deck.able-seaman', label: 'Able seaman', category: 'deck', position: 4 },
  { id: 'deck.ordinary-seaman', label: 'Ordinary seaman', category: 'deck', position: 5 },
  { id: 'deck.deckhand', label: 'Deckhand', category: 'deck', position: 6 },
  { id: 'deck.cadet', label: 'Deck cadet', category: 'deck', position: 7 },
  { id: 'engine.chief-engineer', label: 'Chief engineer', category: 'engine', position: 0 },
  {
    id: 'engine.assistant-engineer',
    label: 'Assistant engineer',
    category: 'engine',
    position: 1,
  },
  {
    id: 'engine.electro-technical-officer',
    label: 'Electro-technical officer',
    category: 'engine',
    position: 2,
  },
  { id: 'engine.qmed', label: 'QMED', category: 'engine', position: 3 },
  { id: 'engine.oiler', label: 'Oiler', category: 'engine', position: 4 },
  { id: 'engine.wiper', label: 'Wiper', category: 'engine', position: 5 },
  { id: 'engine.cadet', label: 'Engine cadet', category: 'engine', position: 6 },
];

export const SEA_LOG_DB: DatabaseSpec = {
  name: 'captains-academy-sea-log',
  migrations: [
    // Version 1: entries keyed by id, and the outbox in write order.
    (db) => {
      const entries = db.createObjectStore(STORES.entries, { keyPath: 'id' });
      entries.createIndex('updatedAt', 'updatedAt');
      db.createObjectStore(STORES.outbox, { keyPath: 'seq', autoIncrement: true });
    },
    // Version 2: vessels keyed by id, and the seeded role list. Entries are untouched.
    (db) => {
      const vessels = db.createObjectStore(STORES.vessels, { keyPath: 'id' });
      vessels.createIndex('updatedAt', 'updatedAt');
      const roles = db.createObjectStore(STORES.roles, { keyPath: 'id' });
      for (const role of ROLES_V2) roles.put(role);
    },
    // Version 3: entries gain a vessel, role and waters, and the preferences
    // store holds backfill consent and the last check-in. Every entry already
    // saved is kept, with its new fields set to null.
    (db, tx) => {
      db.createObjectStore(STORES.preferences, { keyPath: 'key' });
      const cursor = tx.objectStore(STORES.entries).openCursor();
      cursor.onsuccess = () => {
        const current = cursor.result;
        if (!current) return;
        current.update(entryToV3(current.value as Record<string, unknown>));
        current.continue();
      };
    },
  ],
};
