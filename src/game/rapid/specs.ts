import * as definitions from '../../sim/chapter1/definitions';
import * as lights from '../../sim/chapter1/lights';
import type { LevelSpec } from './spec';

// Each rapid-fire level's deck, buttons and wording, in the shape the shared
// page controller reads. No DOM and no Phaser here, so tests can import it.

export const DEFINITIONS_SPEC: LevelSpec<definitions.Art> = {
  id: definitions.LEVEL_ID,
  title: '1 · Definitions',
  question: definitions.QUESTION,
  categories: definitions.CATEGORIES,
  cards: definitions.DEFINITIONS,
  parMs: definitions.PAR_MS,
  answerLine: (_card, label) => `She is ${label.toLowerCase()}.`,
  citeOnRight: false,
};

export const LIGHTS_SPEC: LevelSpec<lights.LightsArt> = {
  id: lights.LEVEL_ID,
  title: lights.TITLE,
  question: lights.QUESTION,
  categories: lights.CATEGORIES,
  cards: lights.LIGHTS,
  parMs: lights.PAR_MS,
  answerLine: (card) => lights.answerLine(card as lights.LightsCard),
  citeOnRight: true,
};
