import { z } from 'zod';
import type { Phase } from './board';
import { shotOf } from './categories';

// The Hill climb button on the Decision Desk (docs/prototypes/hill-climb.md).
// It copies a prompt that asks a coding agent to lower one live variant's
// climb score, and starts nothing itself. The prompt's text is the
// `hill-climb` entry of public/collaborate/prompts.json, which the
// collaboration page lists too.

export const HILL_CLIMB_PROMPT_ID = 'hill-climb';
export const PROMPTS_URL = '/collaborate/prompts.json';

/** The round's steps in which the button shows: everyone sees every dot by then. */
export const hillClimbPhases: readonly Phase[] = ['discuss', 'decide'];

/**
 * The button shows on a live-variant concept (A, B or C of a category, desktop
 * or iPhone) once the round reaches the discuss or decide step.
 */
export const showsHillClimb = (phase: Phase, itemId: string): boolean =>
  hillClimbPhases.includes(phase) && shotOf(itemId) !== undefined;

export interface HillClimbFill {
  readonly category: string;
  readonly variant: string;
  readonly conceptId: string;
}

/** The fill for a live-variant concept, or undefined for any other concept. */
export function hillClimbFill(itemId: string): HillClimbFill | undefined {
  const shot = shotOf(itemId);
  return shot && { category: shot.category, variant: shot.variant, conceptId: itemId };
}

/** Replaces {{category}}, {{variant}} and {{conceptId}} everywhere in the body. */
export const fillHillClimb = (body: string, fill: HillClimbFill): string =>
  body
    .replaceAll('{{category}}', () => fill.category)
    .replaceAll('{{variant}}', () => fill.variant)
    .replaceAll('{{conceptId}}', () => fill.conceptId);

const promptsSchema = z.object({
  prompts: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      title: z.string(),
      description: z.string(),
      duration: z.string(),
      body: z.string().min(1),
    }),
  ),
});

/** The `hill-climb` body out of a prompts.json document. */
export function hillClimbBody(data: unknown): string {
  const found = promptsSchema.parse(data).prompts.find((p) => p.id === HILL_CLIMB_PROMPT_ID);
  if (!found) throw new Error('prompts.json has no hill-climb prompt.');
  return found.body;
}

/** Fetches the `hill-climb` body from the collaboration page's prompts. */
export async function loadHillClimbBody(fetcher: typeof fetch = fetch): Promise<string> {
  const response = await fetcher(PROMPTS_URL);
  if (!response.ok) throw new Error(`The prompts answered ${response.status}.`);
  return hillClimbBody(await response.json());
}
