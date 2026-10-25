import { z } from 'zod';

// The decision board for prototype review rounds (issue #72, ADR 0009). It
// follows the Design Sprint "decide" steps: everyone looks in silence, places
// a limited number of dots on what they like, the team discusses the dotted
// concepts, and the decider makes the call with a written reason. Dots point
// the discussion; they never pick the winner.
//
// Pure data in and data out, so the rules are tested without a browser. Ids and
// times come from the caller.

export const DOTS_PER_REVIEWER = 5;
export const MAX_NAME = 60;
export const MAX_NOTE = 500;
export const MAX_REASON = 1000;
export const FILE_KIND = 'captains-academy/decision-board';

export const phases = ['look', 'vote', 'discuss', 'decide'] as const;
export type Phase = (typeof phases)[number];

export const phaseLabel: Record<Phase, string> = {
  look: 'Look silently',
  vote: 'Dot vote',
  discuss: 'Discuss top dots',
  decide: "Decider's call",
};

const iso = z.iso.datetime();
const dotSchema = z
  .object({
    id: z.string().min(1).max(80),
    itemId: z.string().min(1).max(120),
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  })
  .strict();
const noteSchema = z
  .object({
    id: z.string().min(1).max(80),
    itemId: z.string().min(1).max(120),
    text: z.string().min(1).max(MAX_NOTE),
    at: iso,
  })
  .strict();
const reviewerSchema = z
  .object({
    reviewer: z.string().trim().min(1).max(MAX_NAME),
    dots: z.array(dotSchema).max(DOTS_PER_REVIEWER),
    notes: z.array(noteSchema).max(500),
    doneVoting: z.boolean(),
    updatedAt: iso,
  })
  .strict();
const decisionSchema = z
  .object({
    itemId: z.string().min(1).max(120),
    reason: z.string().min(1).max(MAX_REASON),
    decider: z.string().min(1).max(MAX_NAME),
    at: iso,
  })
  .strict();
const stateSchema = z
  .object({
    phase: z.enum(phases),
    phaseUpdatedAt: iso,
    reviewers: z.array(reviewerSchema),
    decision: decisionSchema.nullable(),
  })
  .strict();
const fileSchema = z
  .object({
    kind: z.literal(FILE_KIND),
    version: z.literal(1),
    exportedAt: iso,
    phase: z.enum(phases),
    phaseUpdatedAt: iso,
    reviewers: z.array(reviewerSchema),
    decision: decisionSchema.nullable(),
  })
  .strict();

export type Dot = z.infer<typeof dotSchema>;
export type Note = z.infer<typeof noteSchema>;
export type ReviewerEntry = z.infer<typeof reviewerSchema>;
export type Decision = z.infer<typeof decisionSchema>;
export type BoardState = z.infer<typeof stateSchema>;
export type BoardFile = z.infer<typeof fileSchema>;

/** A rule the board refuses to break. The message is shown to the reviewer. */
export class BoardError extends Error {
  override readonly name = 'BoardError';
}

export const displayName = (name: string): string => name.trim().replace(/\s+/g, ' ');
export const reviewerKey = (name: string): string => displayName(name).toLowerCase();

export const emptyBoard = (at: string): BoardState => ({
  phase: 'look',
  phaseUpdatedAt: at,
  reviewers: [],
  decision: null,
});

/** Parses a saved board. Throws when it is not one. */
export const parseBoard = (data: unknown): BoardState => stateSchema.parse(data);

export const setPhase = (state: BoardState, phase: Phase, at: string): BoardState => ({
  ...state,
  phase,
  phaseUpdatedAt: at,
});

function entryOf(state: BoardState, reviewer: string): ReviewerEntry | undefined {
  const key = reviewerKey(reviewer);
  return key === '' ? undefined : state.reviewers.find((r) => reviewerKey(r.reviewer) === key);
}

/** Applies a change to one reviewer's entry, creating it on first use. */
function withEntry(
  state: BoardState,
  reviewer: string,
  at: string,
  change: (entry: ReviewerEntry) => ReviewerEntry,
): BoardState {
  const name = displayName(reviewer);
  if (name === '') throw new BoardError('Enter your name first.');
  const current = entryOf(state, name) ?? {
    reviewer: name,
    dots: [],
    notes: [],
    doneVoting: false,
    updatedAt: at,
  };
  const next = { ...change(current), updatedAt: at };
  const index = state.reviewers.indexOf(current);
  const reviewers =
    index === -1
      ? [...state.reviewers, next]
      : state.reviewers.map((r, i) => (i === index ? next : r));
  return { ...state, reviewers };
}

export const dotsLeft = (state: BoardState, reviewer: string): number =>
  DOTS_PER_REVIEWER - (entryOf(state, reviewer)?.dots.length ?? 0);

const clamp = (n: number) => Math.min(1, Math.max(0, n));

export function placeDot(
  state: BoardState,
  reviewer: string,
  dot: Dot,
  at: string,
  known: readonly string[],
): BoardState {
  if (state.phase !== 'vote') throw new BoardError('Dots open in the voting step.');
  if (!known.includes(dot.itemId)) throw new BoardError('That concept is not on this board.');
  return withEntry(state, reviewer, at, (entry) => {
    if (entry.doneVoting)
      throw new BoardError('You marked your vote done. Reopen it to change your dots.');
    if (entry.dots.length >= DOTS_PER_REVIEWER) {
      throw new BoardError(
        `You have placed all ${DOTS_PER_REVIEWER} dots. Take one back to move it.`,
      );
    }
    return { ...entry, dots: [...entry.dots, { ...dot, x: clamp(dot.x), y: clamp(dot.y) }] };
  });
}

export function removeDot(
  state: BoardState,
  reviewer: string,
  dotId: string,
  at: string,
): BoardState {
  if (state.phase !== 'vote') throw new BoardError('Dots can change only in the voting step.');
  const entry = entryOf(state, reviewer);
  if (!entry?.dots.some((d) => d.id === dotId))
    throw new BoardError('You can take back only your own dots.');
  return withEntry(state, reviewer, at, (e) => {
    if (e.doneVoting)
      throw new BoardError('You marked your vote done. Reopen it to change your dots.');
    return { ...e, dots: e.dots.filter((d) => d.id !== dotId) };
  });
}

/** Marks this reviewer's vote done, or reopens it while voting is still open. */
export function setDone(
  state: BoardState,
  reviewer: string,
  done: boolean,
  at: string,
): BoardState {
  if (state.phase !== 'vote') throw new BoardError('Voting is not open.');
  return withEntry(state, reviewer, at, (e) => ({ ...e, doneVoting: done }));
}

/**
 * Others' dots stay hidden while a reviewer is still voting, so nobody follows
 * the crowd. They show once the reviewer is done or out of dots, and to
 * everyone after voting closes.
 */
export function canSeeOthers(state: BoardState, reviewer: string): boolean {
  if (state.phase === 'discuss' || state.phase === 'decide') return true;
  if (state.phase === 'look') return false;
  const entry = entryOf(state, reviewer);
  return entry !== undefined && (entry.doneVoting || entry.dots.length >= DOTS_PER_REVIEWER);
}

export interface PlacedDot extends Dot {
  readonly reviewer: string;
  readonly mine: boolean;
}

/** The dots this reviewer may see: their own always, others' once allowed. */
export function visibleDots(state: BoardState, reviewer: string): PlacedDot[] {
  const key = reviewerKey(reviewer);
  const others = canSeeOthers(state, reviewer);
  return state.reviewers.flatMap((r) => {
    const mine = key !== '' && reviewerKey(r.reviewer) === key;
    if (!mine && !others) return [];
    return r.dots.map((d) => ({ ...d, reviewer: r.reviewer, mine }));
  });
}

export interface Heat {
  readonly itemId: string;
  readonly dots: number;
  /** How many reviewers put at least one dot on it. */
  readonly reviewers: number;
  /** Shared by tied concepts, as in 1, 1, 3. Null with no dots. */
  readonly rank: number | null;
  readonly tied: boolean;
}

/**
 * Concepts by number of dots, most first. Ties share a rank and stay in board
 * order. Concepts with no dots come last, unranked.
 */
export function heat(state: BoardState, itemIds: readonly string[]): Heat[] {
  const counts = itemIds.map((itemId) => {
    const on = state.reviewers.map((r) => r.dots.filter((d) => d.itemId === itemId).length);
    return {
      itemId,
      dots: on.reduce((a, b) => a + b, 0),
      reviewers: on.filter((c) => c > 0).length,
    };
  });
  const dotted = counts.filter((c) => c.dots > 0).sort((a, b) => b.dots - a.dots);
  return [
    ...dotted.map((c) => ({
      ...c,
      rank: dotted.filter((o) => o.dots > c.dots).length + 1,
      tied: dotted.filter((o) => o.dots === c.dots).length > 1,
    })),
    ...counts.filter((c) => c.dots === 0).map((c) => ({ ...c, rank: null, tied: false })),
  ];
}

export function addNote(
  state: BoardState,
  reviewer: string,
  note: { id: string; itemId: string; text: string },
  at: string,
  known: readonly string[],
): BoardState {
  if (state.phase === 'decide') throw new BoardError('Notes are closed while the decider decides.');
  if (!known.includes(note.itemId)) throw new BoardError('That concept is not on this board.');
  const text = note.text.trim();
  if (text === '') throw new BoardError('Write the note first.');
  if (text.length > MAX_NOTE) throw new BoardError(`Keep a note under ${MAX_NOTE} characters.`);
  return withEntry(state, reviewer, at, (e) => ({
    ...e,
    notes: [...e.notes, { id: note.id, itemId: note.itemId, text, at }],
  }));
}

export function removeNote(
  state: BoardState,
  reviewer: string,
  noteId: string,
  at: string,
): BoardState {
  return withEntry(state, reviewer, at, (e) => ({
    ...e,
    notes: e.notes.filter((n) => n.id !== noteId),
  }));
}

export const isDecider = (reviewer: string, decider: string): boolean =>
  reviewerKey(reviewer) !== '' && reviewerKey(reviewer) === reviewerKey(decider);

export function decide(
  state: BoardState,
  reviewer: string,
  pick: { itemId: string; reason: string },
  at: string,
  decider: string,
  known: readonly string[],
): BoardState {
  if (state.phase !== 'decide') throw new BoardError('The call is made in the decide step.');
  if (!isDecider(reviewer, decider))
    throw new BoardError(`Only the decider, ${decider}, makes the call.`);
  if (!known.includes(pick.itemId)) throw new BoardError('That concept is not on this board.');
  const reason = pick.reason.trim();
  if (reason === '') throw new BoardError('Write a reason for the decision log.');
  return {
    ...state,
    decision: {
      itemId: pick.itemId,
      reason: reason.slice(0, MAX_REASON),
      decider: displayName(reviewer),
      at,
    },
  };
}

/** A board file. With a reviewer, only that reviewer's dots and notes go in it. */
export function exportBoard(
  state: BoardState,
  reviewer: string | undefined,
  exportedAt: string,
): BoardFile {
  const key = reviewer === undefined ? undefined : reviewerKey(reviewer);
  return {
    kind: FILE_KIND,
    version: 1,
    exportedAt,
    phase: state.phase,
    phaseUpdatedAt: state.phaseUpdatedAt,
    reviewers: state.reviewers.filter((r) => key === undefined || reviewerKey(r.reviewer) === key),
    decision: state.decision,
  };
}

export interface ImportResult {
  readonly state: BoardState;
  /** Reviewers new to this device. */
  readonly added: number;
  /** Reviewers whose newer copy replaced this device's. */
  readonly updated: number;
  /** Dots and notes on concepts this board does not list. */
  readonly skipped: number;
}

export class NotABoardFileError extends Error {
  override readonly name = 'NotABoardFileError';
  constructor() {
    super("This is not a Captain's Academy decision board file.");
  }
}

const newer = (a: string, b: string) => Date.parse(a) > Date.parse(b);

/** Merges a board file. Each reviewer's newer copy wins as a whole. */
export function importBoard(
  state: BoardState,
  text: string,
  known: readonly string[],
): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new NotABoardFileError();
  }
  const parsed = fileSchema.safeParse(data);
  if (!parsed.success) throw new NotABoardFileError();
  const file = parsed.data;

  let skipped = 0;
  let added = 0;
  let updated = 0;
  let reviewers = [...state.reviewers];
  for (const incoming of file.reviewers) {
    const dots = incoming.dots.filter((d) => known.includes(d.itemId));
    const notes = incoming.notes.filter((n) => known.includes(n.itemId));
    skipped += incoming.dots.length - dots.length + incoming.notes.length - notes.length;
    const clean = { ...incoming, dots, notes };
    const at = reviewers.findIndex(
      (r) => reviewerKey(r.reviewer) === reviewerKey(incoming.reviewer),
    );
    const current = reviewers[at];
    if (current === undefined) {
      reviewers.push(clean);
      added++;
    } else if (newer(incoming.updatedAt, current.updatedAt)) {
      reviewers = reviewers.map((r, i) => (i === at ? clean : r));
      updated++;
    }
  }
  const takePhase = newer(file.phaseUpdatedAt, state.phaseUpdatedAt);
  const takeDecision =
    file.decision !== null &&
    known.includes(file.decision.itemId) &&
    (state.decision === null || newer(file.decision.at, state.decision.at));
  return {
    state: {
      phase: takePhase ? file.phase : state.phase,
      phaseUpdatedAt: takePhase ? file.phaseUpdatedAt : state.phaseUpdatedAt,
      reviewers,
      decision: takeDecision ? file.decision : state.decision,
    },
    added,
    updated,
    skipped,
  };
}
