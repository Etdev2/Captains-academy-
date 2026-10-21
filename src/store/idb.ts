// A small promise wrapper around IndexedDB for anything saved on the device.
// It knows nothing about sea time or the game, so either can use it.
//
// Schemas change through migrations. migrations[i] upgrades a database from
// version i to version i + 1, so the version is the length of the list. A
// migration that has shipped is never edited or reordered: users' devices have
// already run it. Add a new one at the end instead.

export type Migration = (db: IDBDatabase, tx: IDBTransaction) => void;

export interface DatabaseSpec {
  readonly name: string;
  readonly migrations: readonly Migration[];
}

export interface OpenOptions {
  /** The IndexedDB to use. Defaults to the browser's. */
  readonly factory?: IDBFactory;
  /**
   * Called after another tab asked to upgrade this database and this
   * connection closed to let it. Every later call on the connection throws.
   */
  readonly onReplaced?: () => void;
}

/** Thrown when the device holds a newer version of the database than this code knows. */
export class NewerVersionOnDeviceError extends Error {
  override readonly name = 'NewerVersionOnDeviceError';
}

/** The migrations a database at `onDisk` still needs, in order. */
export function migrationsToRun(spec: DatabaseSpec, onDisk: number): readonly Migration[] {
  if (!Number.isInteger(onDisk) || onDisk < 0) {
    throw new RangeError(`${spec.name}: version on disk must be a whole number, got ${onDisk}.`);
  }
  if (onDisk > spec.migrations.length) {
    throw new NewerVersionOnDeviceError(
      `${spec.name} is at version ${onDisk} on this device, newer than ${spec.migrations.length}.`,
    );
  }
  return spec.migrations.slice(onDisk);
}

function defaultFactory(): IDBFactory {
  // Reading the global itself throws in some sandboxed and private contexts.
  const factory = (globalThis as { indexedDB?: IDBFactory }).indexedDB;
  if (!factory) throw new Error('This browser has no IndexedDB.');
  return factory;
}

/** Opens the database, running any migrations it still needs. */
export function openDatabase(spec: DatabaseSpec, options: OpenOptions = {}): Promise<IDBDatabase> {
  if (spec.migrations.length === 0) {
    return Promise.reject(new Error(`${spec.name} has no migrations, so it has no version.`));
  }
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = (options.factory ?? defaultFactory()).open(spec.name, spec.migrations.length);
    } catch (error) {
      reject(error);
      return;
    }
    request.onupgradeneeded = (event) => {
      const tx = request.transaction;
      if (!tx) return;
      try {
        for (const migrate of migrationsToRun(spec, event.oldVersion)) migrate(request.result, tx);
      } catch (error) {
        // Aborting the upgrade leaves the database as it was before.
        tx.abort();
        reject(error);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      // Another tab with newer code can upgrade only once this connection closes.
      db.onversionchange = () => {
        db.close();
        options.onReplaced?.();
      };
      resolve(db);
    };
    request.onerror = () => {
      const error = request.error;
      reject(
        error?.name === 'VersionError'
          ? new NewerVersionOnDeviceError(`${spec.name} on this device is newer than this code.`)
          : (error ?? new Error(`Could not open ${spec.name}.`)),
      );
    };
    // A blocked open waits for older tabs, which close through onversionchange above.
  });
}

/**
 * Resolves once the transaction has committed, and rejects if it aborts. Read
 * each request's `result` after this resolves: a failed request aborts the
 * whole transaction, so this one promise reports every failure.
 */
export function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed.'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted.'));
  });
}
