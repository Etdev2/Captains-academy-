// What a rapid-fire level hands the shared page controller in level.ts: its
// cards, its answer buttons and how to say the answer. Definitions and Lights
// each fill one in; neither copies the other's flow (ADR 0003).

export type RuleSet = 'both' | 'inland' | 'international';

export interface RapidCard<A> {
  /** Also the mastery record's key (G9). */
  readonly id: string;
  /** What the level's view draws for this card. */
  readonly art: A;
  readonly cue: string;
  /** The id of the right answer button. */
  readonly answer: string;
  readonly citation: string;
  readonly why: string;
  readonly ruleSet: RuleSet;
}

export interface RapidCategory {
  readonly id: string;
  readonly label: string;
}

export interface LevelSpec<A> {
  /** The saved-stars key and the debug state's `level`. */
  readonly id: string;
  /** The page heading, such as "2 · Lights". */
  readonly title: string;
  readonly question: string;
  readonly categories: readonly RapidCategory[];
  readonly cards: readonly RapidCard<A>[];
  /** Three stars need a clean run inside this many milliseconds of question time (G12). */
  readonly parMs: number;
  /** "She is power-driven." The line the explanation panel leads with. */
  readonly answerLine: (card: RapidCard<A>, label: string) => string;
  /** Show the rule on a right answer too, so every situation names its rule (G6, G20). */
  readonly citeOnRight: boolean;
}

/** The part of a level that Phaser draws. */
export interface ArtView<A> {
  show(art: A): void;
  /** Outlines what decides the card. A steady outline when motion is reduced. */
  highlight(art: A, reducedMotion: boolean): void;
  clearHighlight(): void;
}

/** A way to another level, for the menu and the end screen. `href` is null while it is locked. */
export interface LevelLink {
  readonly label: string;
  readonly href: string | null;
  /** Why it is locked, in words. */
  readonly note: string;
}
