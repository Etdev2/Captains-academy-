import * as React from 'react';
import {
  CATEGORIES,
  DEFINITIONS,
  categoryLabel,
  type Category,
  type DefinitionCard,
} from '../../../sim/chapter1/definitions';
import { mockExam, studyTopics, weakSpots, type StudyTopic } from '../shared/sample';

// Everything the three Study variants share: the question set, the lessons,
// the mock-exam breakdown and the session state. Demo only. State lives in
// React and nothing is saved.

export { CATEGORIES, categoryLabel, mockExam, studyTopics };
export type { Category, DefinitionCard, StudyTopic };

export const PASS_MARK_NOTE = `Pass mark ${mockExam.passMark}% is illustrative. The Coast Guard sets the real one.`;
export const NOT_EXAM_NOTE =
  'Practice scores do not predict the Coast Guard exam. They only show what to study next.';

export const QUESTION_TEXT = 'Which Rule 3 term fits her best?';

// ------------------------------------------------------------- practice set

const PRACTICE_IDS = [
  'rule3:sails-furled',
  'rule3:trawler',
  'rule3:trolling',
  'rule3:engine-failed',
  'rule3:dredge',
  'rule3:motorsailing',
  'rule3:spinnaker',
  'rule3:heavy-tow',
] as const;

export const practiceCards: readonly DefinitionCard[] = PRACTICE_IDS.map(
  (id) => DEFINITIONS.find((c) => c.id === id) as DefinitionCard,
);

/** A nudge that does not give the answer away. Written for the prototype. */
export const hints: Record<string, string> = {
  'rule3:sails-furled': 'Look at what is pushing her along right now.',
  'rule3:trawler': 'Does her gear limit how well she can steer?',
  'rule3:trolling': 'Do two trolling lines stop her from maneuvering?',
  'rule3:engine-failed': 'Is this her work, or something that went wrong?',
  'rule3:dredge': 'Is her work the reason she cannot easily turn?',
  'rule3:motorsailing': 'The engine is running. What does that change?',
  'rule3:spinnaker': 'Check whether the engine is in use.',
  'rule3:heavy-tow': 'Think about what the tow does to her room to turn.',
};

// ------------------------------------------------------------------ lessons

export interface Lesson {
  readonly n: number;
  readonly title: string;
  readonly done: boolean;
  /** The lesson whose practice uses checked Rule 3 questions. */
  readonly checked: boolean;
}

const titles: Record<string, readonly string[]> = {
  rules: [
    'Why the rules exist',
    'Rule 3: Vessel definitions',
    'Look-out and safe speed (Rules 5, 6)',
    'Risk of collision (Rule 7)',
    'Action to avoid collision (Rule 8)',
    'Narrow channels (Rule 9)',
    'Overtaking (Rule 13)',
    'Head-on (Rule 14)',
    'Crossing (Rule 15)',
    'Give-way and stand-on (Rules 16, 17)',
    'Responsibilities between vessels (Rule 18)',
    'Lights: the basics (Rules 20, 21)',
    'Power-driven vessel lights (Rule 23)',
    'Lights of towing vessels (Rule 24)',
    'Sailing and fishing lights (Rules 25, 26)',
    'Anchored and aground lights (Rule 30)',
    'Sound signals (Rules 32 to 34)',
    'Restricted visibility (Rule 35)',
  ],
  'deck-safety': [
    'Man overboard',
    'Fire prevention and fighting',
    'Life jackets and throwables',
    'Visual distress signals',
    'Fire extinguishers',
    'Pollution rules',
    'Bilge and discharge',
    'Hypothermia and first aid',
    'Stability basics',
    'Anchoring',
    'Line handling and knots',
    'Weather basics',
    'Radio distress calls',
    'Docking and undocking',
  ],
  navigation: [
    'Compass and variation',
    'Deviation',
    'Chart symbols',
    'Aids to navigation',
    'Buoyage system',
    'Tides',
    'Currents',
    'Dead reckoning',
    'Piloting',
    'Radar basics',
    'GPS and its limits',
    'Publications',
  ],
  plotting: [
    'Dividers and parallel rules',
    'Latitude and longitude',
    'Course and distance',
    'Speed, time and distance',
    'Fixes from bearings',
    'Running fix',
    'Set and drift',
    'Plotting practice exam',
  ],
};

export function lessonsFor(topic: StudyTopic): Lesson[] {
  const list = titles[topic.id] ?? [];
  const doneCount = Math.round((topic.lessons * topic.progress) / 100);
  return list.map((title, i) => ({
    n: i + 1,
    title,
    done: i < doneCount,
    checked: topic.id === 'rules' && i === 1,
  }));
}

export const topicById = (id: string): StudyTopic =>
  studyTopics.find((t) => t.id === id) ?? (studyTopics[0] as StudyTopic);

export const lessonsDone = (topic: StudyTopic): number =>
  lessonsFor(topic).filter((l) => l.done).length;

/** What to study next: the first lesson not done in the weakest topic that has a mock-exam link. */
export const nextLesson = (() => {
  const topic = topicById('rules');
  const lesson = lessonsFor(topic).find((l) => !l.done) as Lesson;
  return { topic, lesson };
})();

// --------------------------------------------------------------- mock exam

export interface ExamPart {
  readonly name: string;
  readonly questions: number;
  readonly correct: number;
}

/** Illustrative split of the sample mock exam. Sums to 50 questions, 34 correct. */
export const examParts: readonly ExamPart[] = [
  { name: 'Vessel definitions (Rule 3)', questions: 8, correct: 7 },
  { name: 'Look-out, narrow channels (Rules 5 to 10)', questions: 6, correct: 5 },
  { name: 'Steering and sailing (Rules 11 to 18)', questions: 14, correct: 9 },
  { name: 'Lights and shapes (Rules 20 to 31)', questions: 14, correct: 9 },
  { name: 'Sound signals (Rules 32 to 37)', questions: 8, correct: 4 },
];

export const partPct = (p: ExamPart): number => Math.round((p.correct / p.questions) * 100);

export interface MissedQuestion {
  readonly id: string;
  readonly part: string;
  readonly question: string;
  readonly yours: string;
  readonly right: string;
  readonly why: string;
  readonly cite: string;
  /** False only for the one question taken from the checked Rule 3 deck. */
  readonly illustrative: boolean;
}

export const examMissed: readonly MissedQuestion[] = [
  {
    id: 'm-rule15',
    part: 'Steering and sailing',
    question:
      'Two power-driven vessels cross. The other boat is on your starboard side. What do you do?',
    yours: 'Stand on',
    right: 'Keep out of the way',
    why: 'The vessel that has the other on her own starboard side is the give-way vessel.',
    cite: 'Rule 15, not yet checked',
    illustrative: true,
  },
  {
    id: 'm-rule35',
    part: 'Sound signals',
    question: 'In fog, a power-driven vessel is making way. What does she sound?',
    yours: 'Two prolonged blasts',
    right: 'One prolonged blast, about every 2 minutes',
    why: 'Two prolonged blasts are for a power-driven vessel under way but stopped.',
    cite: 'Rule 35, not yet checked',
    illustrative: true,
  },
  {
    id: 'm-rule24',
    part: 'Lights and shapes',
    question: 'What color is the towing light a tug shows above her stern light?',
    yours: 'White',
    right: 'Yellow',
    why: 'The towing light is yellow and has the same arc as the stern light.',
    cite: 'Rule 24, not yet checked',
    illustrative: true,
  },
  {
    id: 'm-heavy-tow',
    part: 'Vessel definitions',
    question:
      'Towing a heavy barge; she and her tow can hardly leave their course. Which term fits?',
    yours: 'Power-driven',
    right: 'Restricted in her ability to maneuver',
    why: 'A tow that severely restricts her and her tow from leaving their course makes her restricted.',
    cite: 'Rule 3(g)(vi), 33 CFR 83.03(g)(vi)',
    illustrative: false,
  },
];

export const examSeconds = mockExam.minutes * 60;

// ------------------------------------------------------------------- dates

export const dayLabel = (iso: string): string => {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

export const clock = (sec: number): string =>
  `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

// --------------------------------------------------------- practice session

export interface Practice {
  readonly cards: readonly DefinitionCard[];
  readonly card: DefinitionCard;
  readonly index: number;
  readonly total: number;
  readonly picked: Category | undefined;
  readonly correct: boolean | undefined;
  readonly finished: boolean;
  readonly score: number;
  readonly answered: number;
  readonly missed: DefinitionCard[];
  readonly run: number;
  readonly elapsed: number;
  readonly choose: (c: Category) => void;
  readonly next: () => void;
  readonly restart: () => void;
}

export function usePractice(): Practice {
  const cards = practiceCards;
  const [answers, setAnswers] = React.useState<Record<string, Category>>({});
  const [index, setIndex] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);
  const finished = index >= cards.length;

  React.useEffect(() => {
    if (finished) return;
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [finished]);

  const card = cards[Math.min(index, cards.length - 1)] as DefinitionCard;
  const picked = answers[card.id];
  const results = cards.map((c) =>
    answers[c.id] === undefined ? undefined : answers[c.id] === c.answer,
  );
  let run = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i] === true) run++;
    else if (results[i] === false) break;
  }

  return {
    cards,
    card,
    index,
    total: cards.length,
    picked,
    correct: picked === undefined ? undefined : picked === card.answer,
    finished,
    score: results.filter((r) => r === true).length,
    answered: results.filter((r) => r !== undefined).length,
    missed: cards.filter((_c, i) => results[i] === false),
    run,
    elapsed,
    choose: (c) => {
      if (finished) return;
      setAnswers((a) => (a[card.id] === undefined ? { ...a, [card.id]: c } : a));
    },
    next: () => setIndex((i) => Math.min(i + 1, cards.length)),
    restart: () => {
      setAnswers({});
      setIndex(0);
      setElapsed(0);
    },
  };
}

// ------------------------------------------------------------ weak topics

export interface ReviewItem {
  readonly id: string;
  readonly kind: 'spot' | 'missed';
  readonly title: string;
  readonly note: string;
  readonly cite: string;
  readonly answer?: string;
  /** True when no one has checked the note against the regulations. */
  readonly illustrative: boolean;
}

const spotNotes: readonly { note: string; cite: string }[] = [
  {
    note: 'A vessel towing shows a yellow towing light above her stern light, plus masthead lights that match the length of the tow.',
    cite: 'Rule 24, not yet checked',
  },
  {
    note: 'In fog, a power-driven vessel making way sounds one prolonged blast at least every 2 minutes.',
    cite: 'Rule 35, not yet checked',
  },
  {
    note: 'When two vessels cross, the one that has the other on her starboard side keeps out of the way.',
    cite: 'Rule 15, not yet checked',
  },
  {
    note: 'The course you steer and the track you make good differ by set and drift. Plot both.',
    cite: 'Plotting practice, not yet checked',
  },
];

export const spotItems: readonly ReviewItem[] = weakSpots.map((title, i) => ({
  id: `spot-${i}`,
  kind: 'spot',
  title,
  note: (spotNotes[i] as { note: string }).note,
  cite: (spotNotes[i] as { cite: string }).cite,
  illustrative: true,
}));

export interface Review {
  readonly all: readonly ReviewItem[];
  readonly open: readonly ReviewItem[];
  readonly clearedCount: number;
  readonly clear: (id: string) => void;
  readonly defer: (id: string) => void;
  readonly restore: () => void;
}

/** Sample weak spots plus anything missed in this session's practice. */
export function useReview(missed: readonly DefinitionCard[]): Review {
  const [cleared, setCleared] = React.useState<readonly string[]>([]);
  const [deferred, setDeferred] = React.useState<readonly string[]>([]);
  const missedItems: ReviewItem[] = missed.map((c) => ({
    id: `missed-${c.id}`,
    kind: 'missed',
    title: c.cue,
    note: c.why,
    cite: c.citation,
    answer: categoryLabel(c.answer),
    illustrative: false,
  }));
  const all = [...missedItems, ...spotItems];
  const open = all.filter((i) => !cleared.includes(i.id));
  // Deferred items sink to the end in the order they were deferred.
  const ordered = [
    ...open.filter((i) => !deferred.includes(i.id)),
    ...deferred.map((id) => open.find((i) => i.id === id)).filter((i): i is ReviewItem => !!i),
  ];
  return {
    all,
    open: ordered,
    clearedCount: all.length - open.length,
    clear: (id) => setCleared((c) => (c.includes(id) ? c : [...c, id])),
    defer: (id) => setDeferred((d) => [...d.filter((x) => x !== id), id]),
    restore: () => {
      setCleared([]);
      setDeferred([]);
    },
  };
}
