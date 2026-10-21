// The sea-time log's local store. It works with no account and no network:
// everything is saved in IndexedDB on the device (A3, "syncs later").
//
// Every record is checked against its schema in src/log/entry.ts on the way
// in and on the way out, so a record that breaks the rules there is never
// saved and never shown.

import type { z } from 'zod';
import { openDatabase, transactionDone, type OpenOptions } from '../store/idb';
import {
  preferenceSchema,
  roleSchema,
  savableEntrySchema,
  seaTimeEntrySchema,
  vesselSchema,
  type BackfillConsent,
  type HoursBand,
  type LastCheckIn,
  type NewSeaTimeEntry,
  type NewVessel,
  type Role,
  type SeaTimeEntry,
  type Vessel,
  type Waters,
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

/** Where and as what a user is serving, as a check-in or backfilled day gives it. */
export interface Aboard {
  readonly vesselId: string;
  readonly roleId: string;
  /** The waters the user confirmed. */
  readonly waters: Waters;
  /** A GPS suggestion, if any, kept apart from the confirmed waters. */
  readonly watersSuggestion?: Waters | null;
}

export interface BackfilledDay extends Aboard {
  /** The day, as YYYY-MM-DD. */
  readonly day: string;
  readonly hoursBand: HoursBand;
}

export interface SeaLog {
  /**
   * Saves a new entry or replaces one with the same id, and returns what was
   * saved. Writes nothing and throws, when:
   * - DeletedEntryError: the entry with that id was deleted;
   * - SourceChangeError: it has the other source;
   * - UnknownVesselError or UnknownRoleError: its vessel or role is not
   *   saved (a deleted vessel is refused unless the entry already had it);
   * - OpenTripError: it would be a second open trip on this device;
   * - ConsentRequiredError: it is a backfilled day and the user has not
   *   consented to backfilling;
   * - FutureDayError: it is a backfilled day after today.
   * A backfilled day records when the user consented.
   */
  save(entry: NewSeaTimeEntry): Promise<SeaTimeEntry>;
  /**
   * Starts a live trip now and remembers its choices for the next check-in.
   * Throws OpenTripError while another trip is open, and as save does.
   */
  checkIn(aboard: Aboard): Promise<SeaTimeEntry>;
  /** Ends the open trip now. Undefined when no trip is open. */
  checkOut(): Promise<SeaTimeEntry | undefined>;
  /** The open live trip on this device, if any. */
  openTrip(): Promise<SeaTimeEntry | undefined>;
  /** Saves a backfilled day. Throws ConsentRequiredError without consent, and as save does. */
  backfill(day: BackfilledDay): Promise<SeaTimeEntry>;
  /** When the user consented to backfilling on this device, if they have. */
  backfillConsent(): Promise<BackfillConsent | undefined>;
  /** Records the user's consent to backfilling. The first consent's time is kept. */
  giveBackfillConsent(): Promise<BackfillConsent>;
  /** The last check-in's vessel, role and waters, if there was one. */
  lastCheckIn(): Promise<LastCheckIn | undefined>;
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

/** An entry whose vessel is not saved, or was deleted. */
export class UnknownVesselError extends Error {
  override readonly name = 'UnknownVesselError';
}

/** A check-in while another trip is still open on this device (D6). */
export class OpenTripError extends Error {
  override readonly name = 'OpenTripError';
}

/** A backfilled day saved before the user consented to backfilling (D1). */
export class ConsentRequiredError extends Error {
  override readonly name = 'ConsentRequiredError';
}

/** A backfilled day after today. */
export class FutureDayError extends Error {
  override readonly name = 'FutureDayError';
}

/** A vessel or entry whose role is not on the role list. */
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
const readPreference = reader(preferenceSchema, 'preference');

/** The date on this device's calendar, as YYYY-MM-DD. */
export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** An open live trip, not deleted. */
const isOpenTrip = (entry: SeaTimeEntry): boolean =>
  entry.source === 'live' && entry.endedAt === null && entry.deletedAt === null;

/** The fields a caller gives back to save: the bookkeeping is the store's. */
function savable(entry: SeaTimeEntry): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(entry).filter(
      ([key]) => key !== 'updatedAt' && key !== 'deletedAt' && key !== 'consentedAt',
    ),
  );
}

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
  const clock = options.now ?? (() => new Date());
  const now = () => clock().toISOString();

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

  const getPreference = (key: string) => getOne(STORES.preferences, readPreference, key);

  const putPreference = async (preference: unknown): Promise<void> => {
    const tx = db.transaction(STORES.preferences, 'readwrite');
    tx.objectStore(STORES.preferences).put(preferenceSchema.parse(preference));
    await transactionDone(tx);
  };

  const openTrip = async (): Promise<SeaTimeEntry | undefined> =>
    (await allEntries()).find(isOpenTrip);

  // Saves an entry after checking, in the same transaction as the write,
  // everything the entry refers to and the rules across entries. The checks
  // run one after another; the first to fail aborts and writes nothing.
  const saveEntry = async (entry: NewSeaTimeEntry): Promise<SeaTimeEntry> => {
    const at = now();
    // Throws before anything is written when the entry breaks the schema. A
    // backfilled day's consent time is a placeholder until consent is read.
    let record: SeaTimeEntry = savableEntrySchema.parse({
      ...entry,
      ...(entry.source === 'backfilled' ? { consentedAt: at } : {}),
      updatedAt: at,
      deletedAt: null,
    });
    if (record.source === 'backfilled' && record.day > localDay(clock())) {
      throw new FutureDayError(`${record.day} has not happened yet.`);
    }
    await update(
      STORES.entries,
      read,
      record.id,
      (existing, { tx, write, fail }) => {
        // A delete has to reach other devices later, so a save never undoes
        // one. Restoring an entry needs its own deliberate operation.
        if (existing && existing.deletedAt !== null) {
          throw new DeletedEntryError(`Entry ${record.id} was deleted and cannot be saved again.`);
        }
        // Backfilled time stays backfilled: a save may never turn it into
        // live time, or live time into backfilled.
        if (existing && existing.source !== record.source) {
          throw new SourceChangeError(
            `Entry ${record.id} is ${existing.source} and cannot be saved as ${record.source}.`,
          );
        }

        // Each check reads one thing and then calls the next check. A
        // request's callback runs later, outside any try here, so its body
        // runs under guard, which reports its error through fail.
        const checks: ((next: () => void) => void)[] = [];
        const guard = (body: () => void) => {
          try {
            body();
          } catch (error) {
            fail(error);
          }
        };
        const ask = (store: string, query: IDBValidKey, then: (result: unknown) => void) =>
          checks.push((next) => {
            const request = tx.objectStore(store).get(query);
            request.onsuccess = () =>
              guard(() => {
                then(request.result);
                next();
              });
          });

        // The vessel must be saved and not deleted, unless the entry already
        // had it: deleting a vessel never makes its entries unsaveable.
        if (!existing || existing.vesselId !== record.vesselId) {
          ask(STORES.vessels, String(record.vesselId), (found) => {
            if (found === undefined || readVessel(found).deletedAt !== null) {
              throw new UnknownVesselError(`There is no vessel ${String(record.vesselId)}.`);
            }
          });
        }
        ask(STORES.roles, String(record.roleId), (found) => {
          if (found === undefined) {
            throw new UnknownRoleError(`There is no role ${String(record.roleId)}.`);
          }
        });
        if (record.source === 'backfilled') {
          // No backfilled day without the user's consent (D1). An edit keeps
          // the time the day was first consented to.
          ask(STORES.preferences, 'backfill-consent', (found) => {
            const consent = found === undefined ? undefined : readPreference(found);
            if (consent?.key !== 'backfill-consent') {
              throw new ConsentRequiredError("Backfilling needs the user's consent first.");
            }
            const kept = existing?.source === 'backfilled' ? existing.consentedAt : null;
            record = { ...record, consentedAt: kept ?? consent.givenAt } as SeaTimeEntry;
          });
        }
        if (isOpenTrip(record)) {
          // At most one open trip on this device (D6).
          checks.push((next) => {
            const request = tx.objectStore(STORES.entries).getAll();
            request.onsuccess = () =>
              guard(() => {
                const other = (request.result as unknown[])
                  .map(read)
                  .find((entry) => isOpenTrip(entry) && entry.id !== record.id);
                if (other) {
                  throw new OpenTripError('A trip is already open. Check out of it first.');
                }
                next();
              });
          });
        }

        const run = (index: number): void => {
          const check = checks[index];
          if (check) check(() => run(index + 1));
          else write(record);
        };
        run(0);
        return null;
      },
      [STORES.vessels, STORES.roles, STORES.preferences],
    );
    return record;
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
    save: (entry) => saveEntry(entry),
    checkIn: async (aboard) => {
      const trip = await saveEntry({
        id: crypto.randomUUID(),
        source: 'live',
        startedAt: now(),
        endedAt: null,
        vesselId: aboard.vesselId,
        roleId: aboard.roleId,
        waters: aboard.waters,
        watersSuggestion: aboard.watersSuggestion ?? null,
      });
      await putPreference({
        key: 'last-check-in',
        vesselId: aboard.vesselId,
        roleId: aboard.roleId,
        waters: aboard.waters,
      });
      return trip;
    },
    checkOut: async () => {
      const trip = await openTrip();
      if (!trip || trip.source !== 'live') return undefined;
      return saveEntry({ ...savable(trip), endedAt: now() } as NewSeaTimeEntry);
    },
    openTrip: () => openTrip(),
    backfill: (day) =>
      saveEntry({
        id: crypto.randomUUID(),
        source: 'backfilled',
        day: day.day,
        hoursBand: day.hoursBand,
        vesselId: day.vesselId,
        roleId: day.roleId,
        waters: day.waters,
        watersSuggestion: day.watersSuggestion ?? null,
      }),
    backfillConsent: async () => {
      const consent = await getPreference('backfill-consent');
      return consent?.key === 'backfill-consent' ? consent : undefined;
    },
    giveBackfillConsent: async () => {
      const tx = db.transaction(STORES.preferences, 'readwrite');
      const store = tx.objectStore(STORES.preferences);
      const request = store.get('backfill-consent');
      let consent: BackfillConsent = { key: 'backfill-consent', givenAt: now() };
      request.onsuccess = () => {
        if (request.result === undefined) {
          store.put(preferenceSchema.parse(consent));
        } else {
          const kept = readPreference(request.result);
          if (kept.key === 'backfill-consent') consent = kept;
        }
      };
      await transactionDone(tx);
      return consent;
    },
    lastCheckIn: async () => {
      const last = await getPreference('last-check-in');
      return last?.key === 'last-check-in' ? last : undefined;
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
