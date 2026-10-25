import * as React from 'react';
import {
  addNote,
  BoardError,
  decide,
  displayName,
  importBoard,
  placeDot,
  removeDot,
  removeNote,
  setDone,
  setPhase,
  type BoardState,
  type ImportResult,
  type Phase,
} from './board';
import type { Item } from './inventory';
import { conceptIds, ROUND } from './round';
import { newId, openBoardStore } from './store';

// One board, one reviewer name and the actions on them, shared by every part of
// the page. Every change saves to the device at once; a rule the board refuses
// to break comes back as a message, not an exception.

interface BoardApi {
  readonly state: BoardState;
  readonly reviewer: string;
  readonly persistent: boolean;
  /** The last thing the board refused or confirmed, for the status line. */
  readonly message: { text: string; tone: 'info' | 'error' } | null;
  setReviewer(name: string): void;
  setPhase(phase: Phase): void;
  placeDot(itemId: string, x: number, y: number): void;
  removeDot(dotId: string): void;
  setDone(done: boolean): void;
  addNote(itemId: string, text: string): boolean;
  removeNote(noteId: string): void;
  decide(itemId: string, reason: string): boolean;
  importFile(text: string): ImportResult | null;
  say(text: string, tone?: 'info' | 'error'): void;
  /** Opens the full-size viewer on an item. */
  open(item: Item): void;
  readonly opened: Item | null;
  close(): void;
  /** Puts focus back on whatever opened the viewer. */
  returnFocus(): void;
}

const Context = React.createContext<BoardApi | null>(null);

export function useBoard(): BoardApi {
  const api = React.useContext(Context);
  if (!api) throw new Error('useBoard needs a BoardProvider.');
  return api;
}

const now = () => new Date().toISOString();

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const store = React.useMemo(() => openBoardStore(), []);
  const [state, setState] = React.useState<BoardState>(() => store.load());
  const [reviewer, setReviewerState] = React.useState(() => store.loadName());
  const [persistent, setPersistent] = React.useState(store.persistent);
  const [message, setMessage] = React.useState<BoardApi['message']>(null);
  const [opened, setOpened] = React.useState<Item | null>(null);
  const opener = React.useRef<HTMLElement | null>(null);

  const apply = React.useCallback(
    (change: (s: BoardState) => BoardState): boolean => {
      let next: BoardState;
      try {
        next = change(state);
      } catch (error) {
        if (error instanceof BoardError) {
          setMessage({ text: error.message, tone: 'error' });
          return false;
        }
        throw error;
      }
      setState(next);
      store.save(next);
      setPersistent(store.persistent);
      setMessage(null);
      return true;
    },
    [state, store],
  );

  const api: BoardApi = {
    state,
    reviewer,
    persistent,
    message,
    opened,
    setReviewer(name) {
      const clean = displayName(name).slice(0, 60);
      setReviewerState(name.slice(0, 60));
      store.saveName(clean);
    },
    setPhase: (phase) => void apply((s) => setPhase(s, phase, now())),
    placeDot(itemId, x, y) {
      const id = newId();
      void apply((s) => placeDot(s, reviewer, { id, itemId, x, y }, now(), conceptIds));
    },
    removeDot: (dotId) => void apply((s) => removeDot(s, reviewer, dotId, now())),
    setDone: (done) => void apply((s) => setDone(s, reviewer, done, now())),
    addNote(itemId, text) {
      const id = newId();
      return apply((s) => addNote(s, reviewer, { id, itemId, text }, now(), conceptIds));
    },
    removeNote: (noteId) => void apply((s) => removeNote(s, reviewer, noteId, now())),
    decide: (itemId, reason) =>
      apply((s) => decide(s, reviewer, { itemId, reason }, now(), ROUND.decider, conceptIds)),
    importFile(text) {
      const result = importBoard(state, text, conceptIds);
      apply(() => result.state);
      return result;
    },
    say: (text, tone = 'info') => setMessage({ text, tone }),
    open(item) {
      // Moving from a concept to its source board keeps the first opener.
      if (opened === null && document.activeElement instanceof HTMLElement) {
        opener.current = document.activeElement;
      }
      setOpened(item);
    },
    close: () => setOpened(null),
    returnFocus() {
      opener.current?.focus();
      opener.current = null;
    },
  };

  return <Context.Provider value={api}>{children}</Context.Provider>;
}
