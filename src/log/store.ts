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
  /**
   * Saves a new entry or replaces one with the same id, and returns what was
   * saved. Writes nothing and throws DeletedEntryError when the entry with
   * that id was deleted, or SourceChangeError when it has the other source.
   */
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

/** A save that would change whether an entry is live or backfilled. */
export class SourceChangeError extends Error {
  override readonly name = 'SourceChangeError';
}

/** A save to an entry that was soft-deleted. */
export class DeletedEntryError extends Error {
  override readonly name = 'DeletedEntryError';
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

  // Reads the entry and writes what `change` returns, or nothing for null.
  // The read and the write share one transaction, so nothing can change the
  // entry in between. If `change` throws, nothing is written and its error is
  // the one reported, not the abort it causes.
  const update = async (
    id: string,
    change: (existing: SeaTimeEntry | undefined) => SeaTimeEntry | null,
  ): Promise<SeaTimeEntry | null> => {
    const tx = db.transaction(STORES.entries, 'readwrite');
    const store = tx.objectStore(STORES.entries);
    const request = store.get(id);
    let written: SeaTimeEntry | null = null;
    let failure: unknown = null;
    request.onsuccess = () => {
      try {
        const next = change(request.result === undefined ? undefined : read(request.result));
        if (next !== null) {
          store.put(next);
          written = next;
        }
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    try {
      await transactionDone(tx);
    } catch (error) {
      throw failure ?? error;
    }
    return written;
  };

  return {
    async save(entry) {
      // Throws before anything is written when the entry breaks the schema.
      const record = seaTimeEntrySchema.parse({ ...entry, updatedAt: now(), deletedAt: null });
      await update(record.id, (existing) => {
        // Backfilled time stays backfilled: a save may never turn it into live
        // time, or live time into backfilled.
        // A delete has to reach other devices later, so a save never undoes
        // one. Restoring an entry needs its own deliberate operation.
        if (existing && existing.deletedAt !== null) {
          throw new DeletedEntryError(`Entry ${record.id} was deleted and cannot be saved again.`);
        }
        if (existing && existing.source !== record.source) {
          throw new SourceChangeError(
            `Entry ${record.id} is ${existing.source} and cannot be saved as ${record.source}.`,
          );
        }
        return record;
      });
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
      const deleted = await update(id, (existing) => {
        if (!existing || existing.deletedAt !== null) return null;
        const at = now();
        return seaTimeEntrySchema.parse({ ...existing, deletedAt: at, updatedAt: at });
      });
      return deleted !== null;
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
