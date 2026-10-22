---
status: proposed
---

# Mastery uses stable rule and situation keys

G9 requires one mastery record per rule and situation, shared by the game and flashcards. Branch #47 stores `{ right, wrong, streak }` under each Definitions card ID. A card ID alone cannot distinguish rule-set variants or a situation that tests more than one rule, and the value has no schema version.

## Decision

- A mastery objective is the pair of a canonical rule key and a stable situation ID. Its key is `chapter-1/<rule-set>/rule-<number>-<paragraph-parts>/<situation-id>`. Shared content uses `both`; Inland and International differences use their own rule-set segment. Rule keys use lowercase ASCII with parentheses removed and nested parts joined by hyphens. Rule 17(a)(ii) becomes `rule-17-a-ii`. Situation IDs cannot contain `/`.
- One content item may name several mastery objectives. An answer updates each objective that the item says it tests. Incidental citations used only in the explanation do not receive mastery credit.
- Device storage uses one versioned document under `captains-academy:mastery:v2`. Zod parses it before use.
- Each record contains:
  - `schemaVersion: 2`
  - `masteryKey`, `ruleKey`, `situationId` and `ruleSet`
  - `correct`, `incorrect` and `currentStreak`
  - `reviewStep`, `lastAnsweredAt` and `nextReviewAt` for shared spaced repetition
  - `revision` and `deviceId` for later sync
  - an optional `legacyImport` with the counters recovered from #47
- The game and flashcards call one storage service with an answer event and a source of `game` or `flashcards`. Scenes do not write local storage.
- A later academy-login sync stores device revisions under the same stable mastery key and folds them on the server. The exact conflict policy is deferred until sync work, but no content ID or local key must change.

This schema and key format are proposed. Device-first play and later academy-login sync are decided by G4. Shared mastery and spaced repetition are decided by G9 and G20.

## Migration from branch #47

1. Preserve every #47 card ID exactly as the new Definitions situation ID.
2. On the first version 2 read, enumerate those situation IDs from the parsed deck.
3. Read `captains-academy:mastery:<card-id>` for each ID.
4. Validate non-negative integer `right`, `wrong` and `streak` values.
5. Build every version 2 record in memory. Put the old counters in `legacyImport`, because the old aggregate cannot reconstruct answer order or dates.
6. Replace the complete version 2 document with one local-storage write and mark migration inside that document. This avoids a partial write across several objectives.
7. Keep old keys for one release so a rollback does not erase progress, then delete them in a later versioned migration.
8. If the document write fails, leave the prior document and every old key untouched, then retry on the next load.

## Considered options

- Keep the card ID as the mastery key. Rewording or splitting a card would either erase mastery or merge two learning objectives.
- Store one record per rule only. That would treat all Rule 15 crossings as the same skill and break G9's situation requirement.
- Invent timestamps for #47 attempts. The old aggregate has no ordering evidence, so synthetic history would be false.

## Consequences

- A game miss can schedule the same rule and situation in flashcards.
- Rule-set variants do not overwrite shared or other-rule-set progress.
- The future sync service can identify records without changing client keys. Its merge policy still needs its own design before implementation.
- Migration tests use valid data, malformed JSON, negative counters, interrupted writes and a repeated migration.
