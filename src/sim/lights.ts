import type { LightsMission, LightsSituation } from './lights-mission';
import { FRAMES_PER_SECOND } from './sim';

// The lights rapid-fire level as a pure state machine, stepped once per frame at
// 60 Hz like the docking sim. The player classifies one set of navigation lights
// at a time. A right answer moves straight on. A wrong answer costs a hull heart
// and plays a replay that shows the right answer and its rule citation. The replay
// never lasts longer than 5 seconds (DECISIONS.md G11, G20), and the player can
// skip it sooner. A missed situation comes back later in the same level, at
// growing gaps (G20). Nothing here touches the sea-time log: playing is practice,
// never sea time (ADR 0001, G17).

/** The longest any replay can hold the player (G20). */
export const REPLAY_FRAMES = 5 * FRAMES_PER_SECOND;
/** A missed situation returns after this many other situations... */
export const RETURN_GAP_START = 3;
/** ...and this many more each time the same one is missed again. */
export const RETURN_GAP_GROWTH = 2;
export const POINTS_PER_ANSWER = 100;
/** Extra points per answer in a row, up to STREAK_BONUS_CAP answers. */
export const STREAK_BONUS = 10;
export const STREAK_BONUS_CAP = 9;

export type Stars = 0 | 1 | 2 | 3;
export type LightsPhase = 'asking' | 'replay';
export type LightsOutcome = 'playing' | 'cleared' | 'out-of-hearts';

export interface LightsLevel {
  readonly mission: LightsMission;
  readonly parFrames: number;
}

export interface LightsState {
  readonly frame: number;
  /** Frames spent asking. The replay after a miss does not run the clock. */
  readonly askingFrames: number;
  readonly phase: LightsPhase;
  readonly outcome: LightsOutcome;
  /** Situation indexes still to ask. The first is the one on screen. */
  readonly queue: readonly number[];
  /** Answer ids on the buttons, in screen order. Empty once the level ends. */
  readonly options: readonly string[];
  readonly hearts: number;
  readonly misses: number;
  readonly correct: number;
  readonly streak: number;
  readonly bestStreak: number;
  readonly points: number;
  /** How many times each situation has been missed. */
  readonly missCounts: readonly number[];
  readonly replayFramesLeft: number;
  /** The situation being replayed after a miss, or null. */
  readonly missed: number | null;
  /** How many button sets have been dealt, so each deal shuffles differently. */
  readonly dealt: number;
  readonly seed: number;
}

export type LightsInput =
  | { readonly kind: 'answer'; readonly pick: string }
  | { readonly kind: 'skip' }
  | null;

export function compileLightsLevel(mission: LightsMission): LightsLevel {
  return { mission, parFrames: mission.parSeconds * FRAMES_PER_SECOND };
}

/** A 32-bit integer hash: the same shuffles for the same seed in every browser. */
function mix(seed: number, k: number): number {
  let h = (seed ^ Math.imul(k, 0x9e3779b1)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export function situationAt(level: LightsLevel, index: number): LightsSituation {
  const situation = level.mission.situations[index];
  if (!situation) throw new Error(`no situation ${index}`);
  return situation;
}

export function answerLabel(level: LightsLevel, id: string): string {
  const answer = level.mission.answers.find((a) => a.id === id);
  if (!answer) throw new Error(`no answer ${id}`);
  return answer.label;
}

/** The answer ids for one situation, shuffled by a seeded Fisher-Yates. */
function shuffledOptions(
  level: LightsLevel,
  situationIndex: number,
  seed: number,
  dealt: number,
): string[] {
  const s = situationAt(level, situationIndex);
  const ids = [s.answer, ...s.distractors];
  for (let i = ids.length - 1; i > 0; i--) {
    const j = mix(seed, dealt * 16 + i) % (i + 1);
    const a = ids[i];
    const b = ids[j];
    if (a === undefined || b === undefined) continue;
    ids[i] = b;
    ids[j] = a;
  }
  return ids;
}

/** Deals the buttons for the first situation in the queue. */
function deal(level: LightsLevel, state: LightsState): LightsState {
  const head = state.queue[0];
  if (head === undefined) return { ...state, options: [] };
  return {
    ...state,
    options: shuffledOptions(level, head, state.seed, state.dealt),
    dealt: state.dealt + 1,
  };
}

/**
 * The start of a run. Situations come in the order the level lists them: shared
 * rules first, differences last, with unlike situations alternating (G6, G20).
 * A different `attempt` reshuffles the buttons only, so the content stays fixed.
 */
export function initialState(level: LightsLevel, attempt = 0): LightsState {
  const { mission } = level;
  return deal(level, {
    frame: 0,
    askingFrames: 0,
    phase: 'asking',
    outcome: 'playing',
    queue: mission.situations.map((_, i) => i),
    options: [],
    hearts: mission.hearts,
    misses: 0,
    correct: 0,
    streak: 0,
    bestStreak: 0,
    points: 0,
    missCounts: mission.situations.map(() => 0),
    replayFramesLeft: 0,
    missed: null,
    dealt: 0,
    seed: mix(mission.seed, attempt + 1),
  });
}

function answer(level: LightsLevel, state: LightsState, pick: string): LightsState {
  if (!state.options.includes(pick)) return state;
  const index = state.queue[0];
  if (index === undefined) return state;
  const situation = situationAt(level, index);
  const rest = state.queue.slice(1);

  if (pick === situation.answer) {
    const streak = state.streak + 1;
    const next: LightsState = {
      ...state,
      queue: rest,
      correct: state.correct + 1,
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
      points:
        state.points + POINTS_PER_ANSWER + STREAK_BONUS * Math.min(streak - 1, STREAK_BONUS_CAP),
    };
    return rest.length === 0 ? { ...next, outcome: 'cleared', options: [] } : deal(level, next);
  }

  // A miss: the situation returns later, at a growing gap (G11, G20).
  const missCounts = state.missCounts.slice();
  const timesMissed = (missCounts[index] ?? 0) + 1;
  missCounts[index] = timesMissed;
  const gap = Math.min(RETURN_GAP_START + RETURN_GAP_GROWTH * (timesMissed - 1), rest.length);
  return {
    ...state,
    queue: [...rest.slice(0, gap), index, ...rest.slice(gap)],
    hearts: state.hearts - 1,
    misses: state.misses + 1,
    streak: 0,
    missCounts,
    phase: 'replay',
    replayFramesLeft: REPLAY_FRAMES,
    missed: index,
  };
}

function endReplay(level: LightsLevel, state: LightsState): LightsState {
  const next: LightsState = { ...state, phase: 'asking', replayFramesLeft: 0 };
  if (state.hearts <= 0) return { ...next, outcome: 'out-of-hearts', options: [] };
  return deal(level, next);
}

/** Advances one frame. Answers only count while asking; a skip only ends a replay. */
export function step(level: LightsLevel, state: LightsState, input: LightsInput): LightsState {
  if (state.outcome !== 'playing') return state;
  const frame = state.frame + 1;
  if (state.phase === 'asking') {
    const next = { ...state, frame, askingFrames: state.askingFrames + 1 };
    return input?.kind === 'answer' ? answer(level, next, input.pick) : next;
  }
  const left = state.replayFramesLeft - 1;
  const next = { ...state, frame, replayFramesLeft: Math.max(left, 0) };
  return left <= 0 || input?.kind === 'skip' ? endReplay(level, next) : next;
}

/**
 * Stars for a finished run (G12): three for no misses within par time, two for at
 * most one miss within twice par, one for any other clear, none for running out
 * of hearts.
 */
export function starsFor(level: LightsLevel, state: LightsState): Stars {
  if (state.outcome !== 'cleared') return 0;
  if (state.misses === 0 && state.askingFrames <= level.parFrames) return 3;
  if (state.misses <= 1 && state.askingFrames <= level.parFrames * 2) return 2;
  return 1;
}

const outcomeCode: Record<LightsOutcome, number> = {
  playing: 0,
  cleared: 1,
  'out-of-hearts': 2,
};

function fold(h: number, value: number): number {
  let out = h;
  for (let shift = 0; shift < 32; shift += 8) {
    out = Math.imul(out ^ ((value >>> shift) & 0xff), 0x01000193) >>> 0;
  }
  return out;
}

/** FNV-1a over a state's integers and button ids, folded into a running hash. */
export function hashLightsState(state: LightsState, seed = 0x811c9dc5): number {
  let h = seed >>> 0;
  for (const value of [
    state.frame,
    state.askingFrames,
    state.phase === 'asking' ? 0 : 1,
    outcomeCode[state.outcome],
    state.hearts,
    state.misses,
    state.correct,
    state.streak,
    state.bestStreak,
    state.points,
    state.replayFramesLeft,
    state.missed ?? -1,
    state.dealt,
    ...state.queue,
    ...state.missCounts,
  ]) {
    h = fold(h, value);
  }
  for (const id of state.options) {
    for (let i = 0; i < id.length; i++) h = fold(h, id.charCodeAt(i));
  }
  return h;
}
