import { describe, expect, it } from 'vitest';
import {
  BoardError,
  canSeeOthers,
  decide,
  dotsLeft,
  emptyBoard,
  exportBoard,
  heat,
  importBoard,
  myThumb,
  parseBoard,
  placeDot,
  removeDot,
  reviewerKey,
  setDone,
  setPhase,
  setThumb,
  visibleDots,
  visibleThumbs,
  addNote,
  type BoardState,
} from '../src/prototypes/board';

// The decision board (issue #72): everyone looks, places five dots, the team
// discusses the dotted concepts, and the decider makes the call. Dots point the
// discussion; they never pick the winner.

const at = (minute: number) => `2026-10-25T18:${String(minute).padStart(2, '0')}:00.000Z`;
const known = ['a', 'b', 'c', 'd'];
const voting = () => setPhase(emptyBoard(at(0)), 'vote', at(1));
let n = 0;
const dot = (itemId: string, x = 0.5, y = 0.5) => ({ id: `dot-${++n}`, itemId, x, y });

function dots(state: BoardState, reviewer: string, ...items: string[]): BoardState {
  return items.reduce((s, item, i) => placeDot(s, reviewer, dot(item), at(2 + i), known), state);
}

describe('placing dots', () => {
  it('gives each reviewer five dots, which may go on the same concept twice', () => {
    let s = dots(voting(), 'Ana', 'a', 'a', 'b');
    expect(dotsLeft(s, 'Ana')).toBe(2);
    s = dots(s, 'Ana', 'c', 'd');
    expect(dotsLeft(s, 'Ana')).toBe(0);
    expect(() => dots(s, 'Ana', 'a')).toThrow(BoardError);
    expect(dotsLeft(s, 'Ben')).toBe(5);
  });

  it('keeps a dot where it was placed on the image, inside the image', () => {
    const s = placeDot(voting(), 'Ana', dot('a', 1.4, -0.2), at(2), known);
    expect(visibleDots(s, 'Ana')).toEqual([expect.objectContaining({ x: 1, y: 0 })]);
  });

  it('takes dots only while voting, from a named reviewer, on a listed concept', () => {
    expect(() => placeDot(emptyBoard(at(0)), 'Ana', dot('a'), at(2), known)).toThrow(/voting/);
    expect(() => placeDot(voting(), '  ', dot('a'), at(2), known)).toThrow(/name/);
    expect(() => placeDot(voting(), 'Ana', dot('board'), at(2), known)).toThrow(
      /not on this board/,
    );
  });

  it("lets a reviewer take back their own dot, not someone else's", () => {
    let s = dots(voting(), 'Ana', 'a');
    s = dots(s, 'Ben', 'b');
    const [mine] = visibleDots(s, 'Ana').filter((d) => d.reviewer === 'Ana');
    const bens = s.reviewers.find((r) => r.reviewer === 'Ben')?.dots[0];
    if (!mine || !bens) throw new Error('missing dots');
    expect(() => removeDot(s, 'Ana', bens.id, at(9))).toThrow(BoardError);
    s = removeDot(s, 'Ana', mine.id, at(9));
    expect(dotsLeft(s, 'Ana')).toBe(5);
  });

  it('treats the same name typed differently as one reviewer', () => {
    expect(reviewerKey(' ana  LOPEZ')).toBe(reviewerKey('Ana Lopez'));
    const s = dots(dots(voting(), 'Ana Lopez', 'a'), ' ana  lopez', 'b');
    expect(s.reviewers).toHaveLength(1);
    expect(dotsLeft(s, 'Ana Lopez')).toBe(3);
  });
});

describe("seeing other people's dots", () => {
  it('hides them until you finish voting, so nobody follows the crowd', () => {
    let s = dots(voting(), 'Ben', 'b', 'b');
    s = dots(s, 'Ana', 'a');
    expect(canSeeOthers(s, 'Ana')).toBe(false);
    expect(visibleDots(s, 'Ana').map((d) => d.itemId)).toEqual(['a']);
    s = setDone(s, 'Ana', true, at(9));
    expect(canSeeOthers(s, 'Ana')).toBe(true);
    expect(visibleDots(s, 'Ana')).toHaveLength(3);
  });

  it('shows them once all five are placed, and to everyone after voting closes', () => {
    let s = dots(voting(), 'Ana', 'a', 'a', 'b', 'c', 'd');
    expect(canSeeOthers(s, 'Ana')).toBe(true);
    s = setPhase(s, 'discuss', at(20));
    expect(canSeeOthers(s, 'Cy')).toBe(true);
  });

  it('locks dots once you are done, until you reopen your vote', () => {
    let s = setDone(dots(voting(), 'Ana', 'a'), 'Ana', true, at(9));
    expect(() => dots(s, 'Ana', 'b')).toThrow(/done/);
    s = setDone(s, 'Ana', false, at(10));
    expect(dotsLeft(dots(s, 'Ana', 'b'), 'Ana')).toBe(3);
  });
});

describe('heat', () => {
  it('ranks concepts by dots, shares a rank on a tie, and leaves undotted ones unranked', () => {
    let s = dots(voting(), 'Ana', 'b', 'b', 'c');
    s = dots(s, 'Ben', 'c', 'a');
    const h = heat(s, known);
    expect(h.map((r) => [r.itemId, r.dots, r.reviewers, r.rank, r.tied])).toEqual([
      ['b', 2, 1, 1, true],
      ['c', 2, 2, 1, true],
      ['a', 1, 1, 3, false],
      ['d', 0, 0, null, false],
    ]);
  });
});

describe('thumbs up and down', () => {
  const thumb = (s: BoardState, who: string, itemId: string, value: 'up' | 'down' | null) =>
    setThumb(s, who, { itemId, value }, at(5), known);

  it('keeps one thumb per reviewer per concept, which a new one replaces and null takes back', () => {
    let s = thumb(emptyBoard(at(0)), 'Ana', 'a', 'up');
    expect(myThumb(s, 'Ana', 'a')).toBe('up');
    s = thumb(s, 'ana ', 'a', 'down');
    expect(myThumb(s, 'Ana', 'a')).toBe('down');
    expect(visibleThumbs(s, 'Ana', 'a')).toEqual({ up: 0, down: 1 });
    s = thumb(s, 'Ana', 'a', null);
    expect(myThumb(s, 'Ana', 'a')).toBeUndefined();
  });

  it('opens in every step before the call, for a named reviewer, on a listed concept', () => {
    for (const phase of ['look', 'vote', 'discuss'] as const) {
      const s = setPhase(emptyBoard(at(0)), phase, at(1));
      expect(myThumb(thumb(s, 'Ana', 'a', 'up'), 'Ana', 'a')).toBe('up');
    }
    const deciding = setPhase(emptyBoard(at(0)), 'decide', at(1));
    expect(() => thumb(deciding, 'Ana', 'a', 'up')).toThrow(/decider decides/);
    expect(() => thumb(emptyBoard(at(0)), ' ', 'a', 'up')).toThrow(/name/);
    expect(() => thumb(emptyBoard(at(0)), 'Ana', 'board', 'up')).toThrow(/not on this board/);
  });

  it("hides others' thumbs until you finish voting, like dots", () => {
    let s = thumb(voting(), 'Ben', 'a', 'up');
    s = thumb(s, 'Ana', 'a', 'down');
    expect(visibleThumbs(s, 'Ana', 'a')).toEqual({ up: 0, down: 1 });
    s = setDone(s, 'Ana', true, at(6));
    expect(visibleThumbs(s, 'Ana', 'a')).toEqual({ up: 1, down: 1 });
  });

  it('reads boards saved before thumbs existed, and drops thumbs on unlisted concepts on import', () => {
    const old = {
      phase: 'look',
      phaseUpdatedAt: at(0),
      reviewers: [{ reviewer: 'Ana', dots: [], notes: [], doneVoting: false, updatedAt: at(1) }],
      decision: null,
    };
    expect(parseBoard(old).reviewers[0]?.thumbs).toEqual([]);
    let ben = thumb(emptyBoard(at(0)), 'Ben', 'a', 'up');
    ben = setThumb(ben, 'Ben', { itemId: 'gone', value: 'down' }, at(6), [...known, 'gone']);
    const file = JSON.stringify(exportBoard(ben, 'Ben', at(7)));
    const result = importBoard(emptyBoard(at(0)), file, known);
    expect(result.skipped).toBe(1);
    expect(result.state.reviewers[0]?.thumbs).toEqual([{ itemId: 'a', value: 'up' }]);
  });
});

describe('notes', () => {
  it('saves a trimmed note against a concept and refuses an empty one', () => {
    let s = addNote(
      emptyBoard(at(0)),
      'Ana',
      { id: 'n1', itemId: 'a', text: '  Reads well  ' },
      at(3),
      known,
    );
    expect(s.reviewers[0]?.notes).toEqual([
      { id: 'n1', itemId: 'a', text: 'Reads well', at: at(3) },
    ]);
    expect(() => addNote(s, 'Ana', { id: 'n2', itemId: 'a', text: ' ' }, at(4), known)).toThrow(
      BoardError,
    );
    s = setPhase(s, 'decide', at(5));
    expect(() => addNote(s, 'Ana', { id: 'n3', itemId: 'a', text: 'Late' }, at(6), known)).toThrow(
      /closed/,
    );
  });
});

describe("the decider's call", () => {
  const deciding = () => setPhase(dots(voting(), 'Ana', 'a'), 'decide', at(30));

  it("records the decider's pick with a reason", () => {
    const s = decide(
      deciding(),
      'elliott',
      { itemId: 'b', reason: 'Clearest in sun glare' },
      at(31),
      'Elliott',
      known,
    );
    expect(s.decision).toEqual({
      itemId: 'b',
      reason: 'Clearest in sun glare',
      decider: 'elliott',
      at: at(31),
    });
  });

  it('refuses anyone else, an empty reason, or a call before the decide step', () => {
    expect(() =>
      decide(deciding(), 'Ana', { itemId: 'b', reason: 'x' }, at(31), 'Elliott', known),
    ).toThrow(/decider/);
    expect(() =>
      decide(deciding(), 'Elliott', { itemId: 'b', reason: ' ' }, at(31), 'Elliott', known),
    ).toThrow(/reason/);
    expect(() =>
      decide(voting(), 'Elliott', { itemId: 'b', reason: 'x' }, at(31), 'Elliott', known),
    ).toThrow(/decide step/);
  });
});

describe('export and import', () => {
  it("merges another device's reviewers, keeping the newer copy of each", () => {
    const mine = dots(voting(), 'Ana', 'a');
    const theirs = dots(dots(voting(), 'Ben', 'b', 'c'), 'Ana', 'd', 'd');
    // Ana's copy on the other device is newer (minute 3 against minute 2).
    const result = importBoard(mine, JSON.stringify(exportBoard(theirs, undefined, at(40))), known);
    expect(result.added).toBe(1);
    expect(result.updated).toBe(1);
    expect(dotsLeft(result.state, 'Ben')).toBe(3);
    expect(dotsLeft(result.state, 'Ana')).toBe(3);
  });

  it('exports one reviewer on request, drops dots on concepts this board does not list, and refuses other files', () => {
    const s = dots(dots(voting(), 'Ana', 'a'), 'Ben', 'b');
    const file = exportBoard(s, 'ana', at(40));
    expect(file.reviewers.map((r) => r.reviewer)).toEqual(['Ana']);
    const result = importBoard(emptyBoard(at(0)), JSON.stringify(file), ['b']);
    expect(result.skipped).toBe(1);
    expect(dotsLeft(result.state, 'Ana')).toBe(5);
    expect(() => importBoard(s, '{"hello":1}', known)).toThrow(
      /not a Captain's Academy decision board file/,
    );
  });
});
