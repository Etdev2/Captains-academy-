// Where the decision board is kept: this browser's localStorage, and nothing
// else. No server or shared database exists yet, so the page says the board is
// saved on this device, and a team combines boards by exporting and importing
// files. The database planned under DECISIONS.md A1 replaces this module.
//
// A private window, full storage or a blocked site can make localStorage throw.
// Then the board lasts until the tab closes, and the page says so.

import { emptyBoard, parseBoard, type BoardState } from './board';
import { ROUND } from './round';

const BOARD_KEY = `captains-academy:decision-board:${ROUND.id}:v1`;
const NAME_KEY = 'captains-academy:reviewer-name:v1';

function storage(): Storage | undefined {
  try {
    const s = window.localStorage;
    const probe = `${BOARD_KEY}:probe`;
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return undefined;
  }
}

export interface BoardStore {
  /** False when the browser refused storage, so nothing survives a refresh. */
  readonly persistent: boolean;
  load(): BoardState;
  save(state: BoardState): boolean;
  loadName(): string;
  saveName(name: string): void;
}

export function openBoardStore(): BoardStore {
  const s = storage();
  let persistent = s !== undefined;
  const read = (key: string) => {
    try {
      return s?.getItem(key) ?? null;
    } catch {
      return null;
    }
  };
  const write = (key: string, value: string) => {
    try {
      if (!s) return false;
      s.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  };
  return {
    get persistent() {
      return persistent;
    },
    load() {
      const saved = read(BOARD_KEY);
      if (saved !== null) {
        try {
          return parseBoard(JSON.parse(saved));
        } catch {
          // Unreadable: start a fresh board rather than show dots that may be wrong.
        }
      }
      return emptyBoard(new Date().toISOString());
    },
    save(state) {
      const ok = write(BOARD_KEY, JSON.stringify(state));
      if (!ok) persistent = false;
      return ok;
    },
    loadName: () => read(NAME_KEY) ?? '',
    saveName: (name) => void write(NAME_KEY, name),
  };
}

export const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
