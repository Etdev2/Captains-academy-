// The sea-time log's local store. It works with no account and no network:
// everything is saved in IndexedDB on the device (A3, "syncs later").
//
// Every record is checked against its schema in src/log/entry.ts on the way
// in and on the way out, so a record that breaks the rules there is never
// saved and never shown.

import type { z } from 'zod';
import { openDatabase, transactionDone, type OpenOptions } from '../store/idb';
import {
  roleSchema,
  seaTimeEntrySchema,
  vesselSchema,
  type NewSeaTimeEntry,
  type NewVessel,
  type Role,
  type SeaTimeEntry,
  type Vessel,
} from './entry';
import { SEA_LOG_DB, STORES } from './schema';

export interface Vessels {
  /**
   * Saves a new vessel or replaces one with the same id, and returns what was
   * saved. Writes nothing and throws DeletedEntryError when the vessel with
   * that id was deleted, or UnknownRoleError when its default role is not on
   * the role list.
   */
  save(vessel: NewVessel): Promise<Vessel>;
  /** The vessel with this id, deleted or not. */
  get(id: string): Promise<Vessel | undefined>;
  /** Vessels not deleted, by name. */
  list(): Promise<Vessel[]>;
  /** Marks the vessel deleted. False when there is no such vessel or it was already deleted. */
  softDelete(id: string): Promise<boolean>;
}

export interface Roles {
  /** The seeded role list: deck first, then engine, each in list order. */
  list(): Promise<Role[]>;
}

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
  readonly vessels: Vessels;
  readonly roles: Roles;
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

/** A save to an entry or vessel that was soft-deleted. */
export class DeletedEntryError extends Error {
  override readonly name = 'DeletedEntryError';
}

/** A vessel whose default role is not on the role list. */
export class UnknownRoleError extends Error {
  override readonly name = 'UnknownRoleError';
}

/** A record on the device (an entry, vessel or role) that no longer matches its schema. */
export class UnreadableEntryError extends Error {
  override readonly name = 'UnreadableEntryError';
}

function reader<T>(schema: z.ZodType<T>, kind: string): (record: unknown) => T {
  return (record) => {
    const parsed = schema.safeParse(record);
    if (!parsed.success) {
      throw new UnreadableEntryError(
        `A saved ${kind} does not match the schema: ${parsed.error.message}`,
      );
    }
    return parsed.data;
  };
}

const read = reader(seaTimeEntrySchema, 'entry');
const readVessel = reader(vesselSchema, 'vessel');
const readRole = reader(roleSchema, 'role');

interface Later<T> {
  readonly tx: IDBTransaction;
  readonly write: (next: T) => void;
  readonly fail: (error: unknown) => void;
}

interface Deletable {
  readonly deletedAt: string | null;
}

const byName = (a: Vessel, b: Vessel): number =>
  a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.id.localeCompare(b.id);

const roleOrder = (a: Role, b: Role): number =>
  a.category === b.category ? a.position - b.position : a.category === 'deck' ? -1 : 1;

export async function openSeaLog(options: SeaLogOptions = {}): Promise<SeaLog> {
  const db = await openDatabase(SEA_LOG_DB, options);
  const now = () => (options.now ?? (() => new Date()))().toISOString();

  const all = async <T>(storeName: string, parse: (record: unknown) => T): Promise<T[]> => {
    const tx = db.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).getAll();
    await transactionDone(tx);
    return (request.result as unknown[]).map(parse);
  };

  const allEntries = () => all(STORES.entries, read);

  const getOne = async <T>(
    storeName: string,
    parse: (record: unknown) => T,
    id: string,
  ): Promise<T | undefined> => {
    const tx = db.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).get(id);
    await transactionDone(tx);
    return request.result === undefined ? undefined : parse(request.result);
  };

  // Reads the record and writes what `change` returns, or nothing for null.
  // The read and the write share one transaction, so nothing can change the
  // record in between. If `change` throws, nothing is written and its error
  // is the one reported, not the abort it causes.
  //
  // To check other stores first, which `also` names, `change` returns null
  // and finishes later through `later`: `write` the record, or `fail` with an
  // error, which aborts the transaction and is reported the same way.
  const update = async <T>(
    storeName: string,
    parse: (record: unknown) => T,
    id: string,
    change: (existing: T | undefined, later: Later<T>) => T | null,
    also: readonly string[] = [],
  ): Promise<T | null> => {
    const tx = db.transaction([storeName, ...also], 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    let written: T | null = null;
    let failure: unknown = null;
    const fail = (error: unknown) => {
      failure = error;
      tx.abort();
    };
    const write = (next: T) => {
      store.put(next);
      written = next;
    };
    request.onsuccess = () => {
      try {
        const next = change(request.result === undefined ? undefined : parse(request.result), {
          tx,
          write,
          fail,
        });
        if (next !== null) write(next);
      } catch (error) {
        fail(error);
      }
    };
    try {
      await transactionDone(tx);
    } catch (error) {
      throw failure ?? error;
    }
    return written;
  };

  // Marks a record deleted, in one transaction. False when there is none or
  // it was already deleted.
  const softDelete = async <T extends Deletable>(
    storeName: string,
    schema: z.ZodType<T>,
    parse: (record: unknown) => T,
    id: string,
  ): Promise<boolean> => {
    const deleted = await update(storeName, parse, id, (existing) => {
      if (!existing || existing.deletedAt !== null) return null;
      const at = now();
      return schema.parse({ ...existing, deletedAt: at, updatedAt: at });
    });
    return deleted !== null;
  };

  const vessels: Vessels = {
    async save(vessel) {
      // Throws before anything is written when the vessel breaks the schema.
      const record = vesselSchema.parse({ ...vessel, updatedAt: now(), deletedAt: null });
      await update(
        STORES.vessels,
        readVessel,
        record.id,
        (existing, { tx, write, fail }) => {
          // As with entries, a save never undoes a delete.
          if (existing && existing.deletedAt !== null) {
            throw new DeletedEntryError(
              `Vessel ${record.id} was deleted and cannot be saved again.`,
            );
          }
          if (record.defaultRoleId === null) return record;
          // The default role is checked in the same transaction as the write.
          const role = tx.objectStore(STORES.roles).get(record.defaultRoleId);
          role.onsuccess = () => {
            if (role.result === undefined) {
              fail(new UnknownRoleError(`There is no role ${String(record.defaultRoleId)}.`));
            } else {
              write(record);
            }
          };
          return null;
        },
        [STORES.roles],
      );
      return record;
    },

    get: (id) => getOne(STORES.vessels, readVessel, id),

    async list() {
      const live = (await all(STORES.vessels, readVessel)).filter((v) => v.deletedAt === null);
      return live.sort(byName);
    },

    softDelete: (id) => softDelete(STORES.vessels, vesselSchema, readVessel, id),
  };

  const roles: Roles = {
    async list() {
      return (await all(STORES.roles, readRole)).sort(roleOrder);
    },
  };

  return {
    async save(entry) {
      // Throws before anything is written when the entry breaks the schema.
      const record = seaTimeEntrySchema.parse({ ...entry, updatedAt: now(), deletedAt: null });
      await update(STORES.entries, read, record.id, (existing) => {
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

    get: (id) => getOne(STORES.entries, read, id),

    async list() {
      const live = (await allEntries()).filter((entry) => entry.deletedAt === null);
      return live.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async count() {
      return (await allEntries()).filter((entry) => entry.deletedAt === null).length;
    },

    softDelete: (id) => softDelete(STORES.entries, seaTimeEntrySchema, read, id),

    async outboxSize() {
      const tx = db.transaction(STORES.outbox, 'readonly');
      const request = tx.objectStore(STORES.outbox).count();
      await transactionDone(tx);
      return request.result;
    },

    vessels,
    roles,

    close() {
      db.close();
    },
  };
}
