import type { Light } from './LightsScene';

// Rules scenarios for the night-lights drill. The scenarios are made up for this
// prototype and have not been checked by uscg-regs. Rule numbers named here are
// the Inland and International steering and sailing rules: 14 head-on, 15
// crossing, 16 give-way, 17 stand-on, 23 lights of a power-driven vessel.

export const ILLUSTRATIVE = 'Illustrative scenario, not yet checked by uscg-regs.';

export interface Option {
  readonly id: string;
  readonly label: string;
  readonly correct: boolean;
  readonly why: string;
}

export interface RuleItem {
  readonly id: 'head-on' | 'crossing';
  readonly title: string;
  readonly lights: readonly Light[];
  /** The lights in words, so the scene never depends on colour alone. */
  readonly seen: string;
  readonly cite: string;
  readonly she: readonly Option[];
  readonly act: readonly Option[];
  readonly summary: string;
}

export const ITEMS: readonly RuleItem[] = [
  {
    id: 'head-on',
    title: 'Lights dead ahead',
    lights: [
      { x: 160, y: 78, color: 'white', r: 5 },
      { x: 138, y: 108, color: 'green', r: 5 },
      { x: 182, y: 108, color: 'red', r: 5 },
    ],
    seen: 'One white light high up, with a green light on your left and a red light on your right, straight ahead.',
    cite: 'Rule 23 (lights), Rule 14 (head-on)',
    she: [
      {
        id: 'power-head-on',
        label: 'A power-driven vessel coming straight at me',
        correct: true,
        why: 'A masthead light with both sidelights showing means you see her bow. Rule 23 gives a power-driven vessel these lights.',
      },
      {
        id: 'sail',
        label: 'A sailing vessel crossing from my right',
        correct: false,
        why: 'A crossing vessel shows only one sidelight. Two sidelights together means she is pointed at you.',
      },
      {
        id: 'anchor',
        label: 'A vessel at anchor',
        correct: false,
        why: 'A vessel at anchor shows white lights only. These lights include a red and a green sidelight.',
      },
    ],
    act: [
      {
        id: 'starboard',
        label: 'Turn to starboard. Pass port side to port side.',
        correct: true,
        why: 'Rule 14: when two power-driven vessels meet head-on, each alters course to starboard and passes port to port.',
      },
      {
        id: 'hold',
        label: 'Hold my course and speed',
        correct: false,
        why: 'Neither boat is the stand-on vessel in a head-on meeting. Both turn.',
      },
      {
        id: 'port',
        label: 'Turn to port',
        correct: false,
        why: 'Turning to port puts you across her bow. Rule 14 says both turn to starboard.',
      },
    ],
    summary: 'Both sidelights and a masthead light: she is head-on. Both boats turn to starboard.',
  },
  {
    id: 'crossing',
    title: 'One red light on your right',
    lights: [
      { x: 232, y: 80, color: 'white', r: 5 },
      { x: 244, y: 106, color: 'red', r: 5 },
    ],
    seen: 'A white light high up and a red light below it, to the right of your bow. No green light.',
    cite: 'Rules 15, 16 and 17 (crossing), Rule 23 (lights)',
    she: [
      {
        id: 'cross-right',
        label: 'A power-driven vessel crossing from my right',
        correct: true,
        why: 'A red sidelight is her port side. You can only see her port side if she is crossing in front of you from your right.',
      },
      {
        id: 'cross-left',
        label: 'A power-driven vessel crossing from my left',
        correct: false,
        why: 'From your left you would see her green starboard sidelight, not the red one.',
      },
      {
        id: 'meeting',
        label: 'A vessel meeting me head-on',
        correct: false,
        why: 'Head-on shows both sidelights. You see only one, so she is crossing.',
      },
    ],
    act: [
      {
        id: 'give-way',
        label: 'Give way. Slow down, or turn to starboard and pass behind her.',
        correct: true,
        why: 'Rule 15: the vessel that has the other on her starboard side keeps out of the way. Rule 16 says act early, and in a way she can see.',
      },
      {
        id: 'stand-on',
        label: 'Stand on. Keep my course and speed.',
        correct: false,
        why: 'Rule 17 makes her the stand-on vessel. She is on your right, so you are the one who gives way.',
      },
      {
        id: 'cross-ahead',
        label: 'Turn to port and cross in front of her',
        correct: false,
        why: 'Rule 15 says a give-way vessel avoids crossing ahead of the other vessel when she can.',
      },
    ],
    summary: 'A red light means her port side faces you. She is on your right, so you give way.',
  },
];

export interface Answer {
  she?: string;
  act?: string;
  checked: boolean;
}

export type Answers = Readonly<Record<string, Answer>>;

export const correctCount = (a: Answers): number =>
  ITEMS.reduce((n, item) => {
    const got = a[item.id];
    return (
      n +
      (item.she.find((o) => o.id === got?.she)?.correct ? 1 : 0) +
      (item.act.find((o) => o.id === got?.act)?.correct ? 1 : 0)
    );
  }, 0);

export const rulesStars = (right: number): 0 | 1 | 2 | 3 =>
  right === 4 ? 3 : right === 3 ? 2 : right >= 1 ? 1 : 0;

/** Shown when a reviewer opens the result screen without answering. */
export const SAMPLE_ANSWERS: Answers = {
  'head-on': { she: 'power-head-on', act: 'starboard', checked: true },
  crossing: { she: 'cross-right', act: 'stand-on', checked: true },
};
