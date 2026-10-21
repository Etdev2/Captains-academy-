import { z } from 'zod';

// A lights rapid-fire level is data: a bank of navigation-light situations, each
// with its answer, its rule set and its rule citation. Chapter 1 covers both the
// Inland and the International rules; shared rules come first and the
// differences get their own, flagged situations (DECISIONS.md G6).
//
// Every rule number and paragraph below comes from the Navigation Rules text
// (COLREGS Rules 20 to 31, mirrored for inland waters in 33 CFR Part 83). None
// of it is checked yet: `uscg-regs` must check each situation against the
// current rule text before launch (DECISIONS.md G10). No NMC exam values are used
// here; if any are added, label them unverified (G10a).
//
// This file imports only zod so scripts/validate-missions.ts can load it.

export const lightsMissionSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('lights-rapid-fire'),
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    // The level that must earn at least one star before this one opens (G12).
    unlockedBy: z.string().regex(/^[a-z0-9-]+$/),
    // Seeds the order of the answer buttons, so a replay sees the same buttons.
    seed: z.number().int().min(0).max(0xffffffff),
    // A clean run within this much asking time earns three stars (G12).
    parSeconds: z.number().int().positive(),
    hearts: z.number().int().min(1).max(3),
    answers: z
      .array(z.object({ id: z.string().regex(/^[a-z0-9-]+$/), label: z.string().min(1) }).strict())
      .min(4),
    situations: z
      .array(
        z
          .object({
            id: z.string().regex(/^[a-z0-9-]+$/),
            // The rule set in force for this situation.
            ruleSet: z.enum(['inland', 'international']),
            // True when the Inland and International rules say the same thing.
            shared: z.boolean(),
            // Required when the two rule sets differ.
            differenceNote: z.string().min(1).optional(),
            rule: z
              .object({
                number: z.number().int().min(20).max(31),
                paragraph: z
                  .string()
                  .regex(/^\([a-z]\)(\([ivx]+\))?$/)
                  .optional(),
              })
              .strict(),
            // Seen from the observer's side. x grows to the observer's right and
            // y grows up from the vessel's base, both in -100..100 / 0..100 units.
            lights: z
              .array(
                z
                  .object({
                    role: z.enum(['masthead', 'sidelight', 'sternlight', 'all-round', 'towing']),
                    color: z.enum(['white', 'red', 'green', 'yellow']),
                    x: z.number().int().min(-100).max(100),
                    y: z.number().int().min(0).max(100),
                  })
                  .strict(),
              )
              .min(1)
              .max(6),
            answer: z.string(),
            distractors: z.array(z.string()).length(3),
            // One line shown in the replay after a miss.
            explain: z.string().min(1),
          })
          .strict(),
      )
      .min(4),
  })
  .strict()
  .superRefine((mission, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    const answerIds = new Set(mission.answers.map((a) => a.id));
    if (answerIds.size !== mission.answers.length) fail('answer ids must be unique');
    const situationIds = new Set(mission.situations.map((s) => s.id));
    if (situationIds.size !== mission.situations.length) fail('situation ids must be unique');
    let sawDifference = false;
    for (const s of mission.situations) {
      for (const id of [s.answer, ...s.distractors]) {
        if (!answerIds.has(id)) fail(`${s.id}: unknown answer "${id}"`);
      }
      if (new Set([s.answer, ...s.distractors]).size !== 4) {
        fail(`${s.id}: the answer and its three distractors must all differ`);
      }
      if (s.shared && s.differenceNote !== undefined) {
        fail(`${s.id}: a shared rule has no difference note`);
      }
      if (!s.shared && s.differenceNote === undefined) {
        fail(`${s.id}: a rule that differs needs a difference note`);
      }
      // Shared rules come first (G6).
      if (!s.shared) sawDifference = true;
      else if (sawDifference) fail(`${s.id}: shared situations must come before the differences`);
    }
  });

export type LightsMission = z.infer<typeof lightsMissionSchema>;
export type LightsSituation = LightsMission['situations'][number];
export type RuleSet = LightsSituation['ruleSet'];

/** Parses unknown JSON into a lights mission, or throws with every problem listed. */
export function parseLightsMission(data: unknown): LightsMission {
  return lightsMissionSchema.parse(data);
}

/** Names the rule set for the screen. */
export function ruleSetName(ruleSet: RuleSet): string {
  return ruleSet === 'inland' ? 'INLAND RULES' : 'INTERNATIONAL RULES';
}

/** The citation shown with a situation, in the form of the rule set in force. */
export function citeRule(ruleSet: RuleSet, rule: LightsSituation['rule']): string {
  const para = rule.paragraph ?? '';
  return ruleSet === 'inland'
    ? `33 CFR 83.${rule.number}${para}`
    : `COLREGS Rule ${rule.number}${para}`;
}
