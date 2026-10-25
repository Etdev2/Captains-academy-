// Where the review gallery keeps ratings: this browser's localStorage, and
// nothing else. No server or shared database exists yet (issue #72), so every
// screen that shows ratings says they are saved on this device, and team
// results come only from exported files someone imports.
//
// A private window, full storage or a blocked site can make localStorage throw.
// Then ratings last until the tab closes, and the page says so.

import type { Review } from './ratings';

const REVIEWS_KEY = 'captains-academy:prototype-reviews:v1';
const NAME_KEY = 'captains-academy:prototype-reviewer:v1';

export interface ReviewStore {
  /** False when the browser refused storage, so nothing survives a refresh. */
  readonly persistent: boolean;
  load(): Review[];
  save(book: readonly Review[]): boolean;
  loadName(): string;
  saveName(name: string): void;
}

function read(storage: Storage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(storage: Storage | undefined, key: string, value: string): boolean {
  try {
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function probe(): Storage | undefined {
  try {
    const storage = window.localStorage;
    const key = `${REVIEWS_KEY}:probe`;
    storage.setItem(key, '1');
    storage.removeItem(key);
    return storage;
  } catch {
    return undefined;
  }
}

/**
 * Opens the store. `parse` checks what was saved; a value it rejects is
 * ignored rather than trusted, and is overwritten by the next save.
 */
export function openReviewStore(parse: (data: unknown) => Review[]): ReviewStore {
  const storage = probe();
  let memory: Review[] = [];
  let name = '';
  let persistent = storage !== undefined;
  return {
    get persistent() {
      return persistent;
    },
    load() {
      const saved = read(storage, REVIEWS_KEY);
      if (saved === null) return memory;
      try {
        memory = parse(JSON.parse(saved));
      } catch {
        // Unreadable: start empty rather than show ratings that may be wrong.
      }
      return memory;
    },
    save(book) {
      memory = [...book];
      const ok = write(storage, REVIEWS_KEY, JSON.stringify(book));
      if (!ok) persistent = false;
      return ok;
    },
    loadName() {
      return read(storage, NAME_KEY) ?? name;
    },
    saveName(next) {
      name = next;
      write(storage, NAME_KEY, next);
    },
  };
}
