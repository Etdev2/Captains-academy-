---
status: proposed
---

# Chapter 1 content is validated data with recorded rule review

Chapter 1 needs one content shape for rapid-fire cards, steering situations and boss questions. The existing Definitions branch stores typed objects in `src/sim/chapter1/definitions.ts`, but those objects omit distractors, spoken phrases and review evidence. Copying that shape into each level would make rule review and flashcard reuse depend on scene code.

Et settled the product choices that constrain this proposal on 2026-10-22 from 7:11 to 7:17 AM PT, recorded in [PR #50's decision comment](https://github.com/Etdev2/Captains-academy-/pull/50#issuecomment-6343017518). Inland and International differences use separate levels, the audience includes candidates and cadets, and `uscg-regs` is the only rules reviewer for now. The storage location and schema remain proposed.

## Decision

- Content files live in `content/chapter-1/` as versioned JSON. `src/sim/content.ts` owns the zod schema and parsing. Phaser scenes receive parsed content and do not contain answer keys or citations.
- A deck has a stable deck ID, schema version and one or more items. Each item has a stable situation ID, kind (`card`, `situation` or `question`), interaction, art reference, cue, answer, distractors, explanation, spoken phrase, rule citations, rule set and review status.
- Interaction is a discriminated union. Choice and flick-choice items have an answer option and at least two real distractor options. A timed-signal item has an answer pattern and an empty distractor list because the player performs the answer.
- An answer option has a stable option ID, player-facing label and an optional art reference. Zod rejects a repeated option ID or an answer also listed as a distractor.
- Every citation names the rule and paragraph. A bare rule number does not pass the schema. Annex I may add a citation but cannot replace the applicable rule paragraph. An item has at least one citation. Its interaction type determines whether distractors are required.
- Rule set is one of `both`, `inland` or `international` (G6). It is content data, not text inferred from a cue.
- Review status is a discriminated union. `draft` carries no approval claim. `checked` requires `reviewer: "uscg-regs"`, the check date, source title or edition, and the citations checked. The schema cannot represent a checked item without review evidence. A per-item human-review field is not required under current G10a. G10a's human Coast Guard review is a launch gate for the game, not a content field.
- Shared decks and the separate Inland and International difference decks use the same schema. They remain distinct deck and level IDs, not runtime variants of one level.
- Art references are IDs, not file paths. Each level adapter resolves only the art IDs it supports. A deck-integrity test rejects an unresolved art ID.
- The Definitions content from branch #47 moves into this schema before another deck copies its narrower interface. This is a proposed file and schema choice. G6, G9, G10 and G20 already decide the rule-set, shared-mastery, boss-source and cited-teaching requirements.

## Considered options

- Keep TypeScript arrays beside each scene. This gives compile-time literals, but it lets each level invent a different review shape and couples content edits to rendering code.
- Put content in mission JSON. Missions describe a world and its motion. Rule questions are also used by flashcards, so they need their own files and schema.
- Use one unstructured `metadata` object for level-specific fields. Zod could accept illegal combinations. Discriminated item and answer types make each supported interaction explicit.

## Consequences

- Content review can happen without opening Phaser code. The same parsed item can feed a game level, a flashcard and a spoken replay.
- Tests parse every file, check the interaction-specific answer and distractor rules, check unique option IDs, resolve art IDs, require paragraph citations and enforce review evidence.
- A schema change increments the deck schema version and adds an explicit parser migration. Content IDs do not change when wording or art changes.
- `uscg-regs` still decides whether the content is correct. Zod proves only that the evidence fields exist and the data shape is valid.
