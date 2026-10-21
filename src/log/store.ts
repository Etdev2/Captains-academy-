// The sea-time log's local store. It works with no account and no network:
// everything is saved in IndexedDB on the device (A3, "syncs later").
//
// Every record is checked against the entry schema on the way in and on the
// way out, so a record that breaks the rules in src/log/entry.ts is never
// saved and never shown.

import { openDatabase, transactionDone, type OpenOptions } from '../store/idb';
import { seaTimeEntrySchema, type NewSeaTimeEntry, type SeaTimeEntry } from './entry';
import { SEA_LOG_DB, STORES } from './schema';

export interface SeaLog {
  /** Saves a new entry or replaces one with the same id, and returns what was saved. */
  save(entry: NewSeaTimeEntry): Promise<SeaTimeEntry>;
  /** The entry with this id, deleted or not. */
  get(id: string): Promise<SeaTimeEntry | undefined>;
  /** Entries not deleted, most recently changed first. */
  list(): Promise<SeaTimeEntry[]>;
  /** Number of entries not deleted. */
  count(): Promise<number>;
  /** Marks the entry deleted. False when there is no such entry or it was already deleted. */
  softDelete(id: string): Promise<boolean>;
  /** Number of changes waiting to sync. Always 0 until sync exists. */
  outboxSize(): Promise<number>;
  close(): void;
}

export interface SeaLogOptions extends OpenOptions {
  /** The clock for `updatedAt` and `deletedAt`. Defaults to the device clock. */
  readonly now?: () => Date;
}

/** A record on the device that no longer matches the entry schema. */
export class UnreadableEntryError extends Error {
  override readonly name = 'UnreadableEntryError';
}

function read(record: unknown): SeaTimeEntry {
  const parsed = seaTimeEntrySchema.safeParse(record);
  if (!parsed.success) {
    throw new UnreadableEntryError(
      `A saved entry does not match the schema: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

export async function openSeaLog(options: SeaLogOptions = {}): Promise<SeaLog> {
  const db = await openDatabase(SEA_LOG_DB, options);
  const now = () => (options.now ?? (() => new Date()))().toISOString();

  const allEntries = async (): Promise<SeaTimeEntry[]> => {
    const tx = db.transaction(STORES.entries, 'readonly');
    const request = tx.objectStore(STORES.entries).getAll();
    await transactionDone(tx);
    return (request.result as unknown[]).map(read);
  };

  return {
    async save(entry) {
      // Throws before anything is written when the entry breaks the schema.
      const record = seaTimeEntrySchema.parse({ ...entry, updatedAt: now(), deletedAt: null });
      const tx = db.transaction(STORES.entries, 'readwrite');
      tx.objectStore(STORES.entries).put(record);
      await transactionDone(tx);
      return record;
    },

    async get(id) {
      const tx = db.transaction(STORES.entries, 'readonly');
      const request = tx.objectStore(STORES.entries).get(id);
      await transactionDone(tx);
      return request.result === undefined ? undefined : read(request.result);
    },

    async list() {
      const live = (await allEntries()).filter((entry) => entry.deletedAt === null);
      return live.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async count() {
      return (await allEntries()).filter((entry) => entry.deletedAt === null).length;
    },

    async softDelete(id) {
      const tx = db.transaction(STORES.entries, 'readwrite');
      const store = tx.objectStore(STORES.entries);
      const request = store.get(id);
      let deleted = false;
      let failure: unknown = null;
      // The read and the write share one transaction, so nothing can change
      // the entry in between.
      request.onsuccess = () => {
        try {
          if (request.result === undefined) return;
          const entry = read(request.result);
          if (entry.deletedAt !== null) return;
          const at = now();
          store.put(seaTimeEntrySchema.parse({ ...entry, deletedAt: at, updatedAt: at }));
          deleted = true;
        } catch (error) {
          // Report the real problem, not the abort it causes.
          failure = error;
          tx.abort();
        }
      };
      try {
        await transactionDone(tx);
      } catch (error) {
        throw failure ?? error;
      }
      return deleted;
    },

    async outboxSize() {
      const tx = db.transaction(STORES.outbox, 'readonly');
      const request = tx.objectStore(STORES.outbox).count();
      await transactionDone(tx);
      return request.result;
    },

    close() {
      db.close();
    },
  };
}
