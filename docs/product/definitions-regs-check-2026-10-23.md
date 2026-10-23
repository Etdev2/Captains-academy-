# Definitions level regulation check, 2026-10-23

Claude, acting as `uscg-regs`, checked the 17 Rule 3 cards of the issue #47 Definitions level against the current Inland Rule 3 (33 CFR 83.03) and International Rule 3 (COLREGS) on 2026-10-23. Every card was checked for its answer, its cue, its one-line reason and its paragraph citation. No game code was changed.

Of 17 cards, 12 are `verified` and 5 are `corrected`. No card is left open. The corrected text below is the text Stage 1 must ship, word for word. With those corrections, the cards appear to meet the paragraphs they cite. The Coast Guard and the NMC still have the last word.

Two findings sit above single cards and need Et's eye: where the constrained-by-draft card lives under G6 (finding F1), and the wording of the question (finding F2).

| Field | Value |
| --- | --- |
| Source of the cards | Branch `head-dev/ch1-definitions` at `3c67dd4`, file `src/sim/chapter1/definitions.ts` |
| Fields checked per card | `cue`, `answer`, `rule`, `why`, `ruleSet`, and the six answer labels in `CATEGORIES` |
| International text read | NavCen "USCG Amalgamated Navigation Rules International & U.S. Inland", Rule 3 |
| Inland text read | eCFR 33 CFR 83.03, shown "up to date as of 10/21/2026" |
| Date checked | 2026-10-23 |

## How the sources were used

- Both pages were read through the session's web reader on 2026-10-23. The session's shell could not reach `ecfr.gov` or `navcen.uscg.gov` (the egress proxy refused both), so this check has no SHA-256 values for its copies. The [harbor traffic check](harbor-traffic-regs-check-2026-10-22.md) hashed the same NavCen page and the eCFR part 83 text on 2026-10-22. eCFR shows part 83 last amended on 2022-09-06, so its Rule 3 text is the same one that check read.
- Not read: the printed Handbook PDF and the IMO's own COLREGS text. NavCen prints the U.S. spelling "draft" and "maneuver". The IMO text prints "draught" and "manoeuvre". The meaning is the same.
- In the tables, "Int" means the International text and "83.03" means 33 CFR 83.03.

## Rule 3 paragraphs the cards use

| Paragraph | Int | 83.03 | Difference |
| --- | --- | --- | --- |
| (b) power-driven vessel | Any vessel propelled by machinery | Same | None |
| (c) sailing vessel | Under sail, with propelling machinery, if fitted, not being used | Same | None |
| (d) vessel engaged in fishing | Fishing with nets, lines, trawls or other apparatus that restrict maneuverability. Excludes trolling lines and other apparatus that do not | Same | 83.03 prints "restricts" in the singular. No difference in meaning |
| (f) vessel not under command | Through some exceptional circumstance unable to maneuver as the Rules require, so unable to keep out of the way | Same | None |
| (g) vessel restricted in her ability to maneuver | From the nature of her work, restricted in her ability to maneuver, so unable to keep out of the way. The list "includes but is not limited to" (i) to (vi) | Same, items (i) to (vi) in the same order | Int (g)(i) prints "navigational mark"; 83.03(g)(i) prints "navigation mark". No difference in meaning |
| (g)(i) | Laying, servicing or picking up a navigation mark, submarine cable or pipeline | Same | See above |
| (g)(ii) | Dredging, surveying or underwater operations | Same | None |
| (g)(iii) | Replenishment or transferring persons, provisions or cargo while underway | Same | None |
| (g)(vi) | A towing operation that severely restricts the towing vessel and her tow in their ability to deviate from their course | Same | None |
| (h) vessel constrained by her draft | A power-driven vessel which, because of her draft in relation to the available depth and width of navigable water, is severely restricted in her ability to deviate from the course she is following | `[Reserved]` | International only. Inland Rule 3 has no constrained-by-draft vessel |

Inland-only terms in 83.03, none of which any card uses: (n) Western Rivers, (o) Great Lakes, (p) Secretary, (q) Inland Waters, (r) Inland Rules, (s) International Regulations. Paragraphs (a), (e) and (i) to (m) are shared, apart from lettering after (h). None of those is a card answer either.

## Card by card

The "Citation to show" column is the exact citation string Stage 1 shows on the card and in the miss replay. A shared card cites the International rule number and the Inland CFR paragraph, so a player on either rule set can find it.

| # | Card id | Answer | Citation to show | Status |
| --- | --- | --- | --- | --- |
| 1 | `rule3:motorboat` | Power-driven | Rule 3(b), 33 CFR 83.03(b) | `verified` |
| 2 | `rule3:container-ship` | Power-driven | Rule 3(b), 33 CFR 83.03(b) | `verified` |
| 3 | `rule3:sailing` | Sailing | Rule 3(c), 33 CFR 83.03(c) | `verified` |
| 4 | `rule3:spinnaker` | Sailing | Rule 3(c), 33 CFR 83.03(c) | `verified` |
| 5 | `rule3:motorsailing` | Power-driven | Rule 3(b) and (c), 33 CFR 83.03(b) and (c) | `corrected` |
| 6 | `rule3:sails-furled` | Power-driven | Rule 3(b), 33 CFR 83.03(b) | `verified` |
| 7 | `rule3:trawler` | Engaged in fishing | Rule 3(d), 33 CFR 83.03(d) | `corrected` |
| 8 | `rule3:longliner` | Engaged in fishing | Rule 3(d), 33 CFR 83.03(d) | `verified` |
| 9 | `rule3:trolling` | Power-driven | Rule 3(b) and (d), 33 CFR 83.03(b) and (d) | `corrected` |
| 10 | `rule3:engine-failed` | Not under command | Rule 3(f), 33 CFR 83.03(f) | `verified` |
| 11 | `rule3:steering-failed` | Not under command | Rule 3(f), 33 CFR 83.03(f) | `verified` |
| 12 | `rule3:buoy-tender` | Restricted in her ability to maneuver | Rule 3(g)(i), 33 CFR 83.03(g)(i) | `verified` |
| 13 | `rule3:dredge` | Restricted in her ability to maneuver | Rule 3(g)(ii), 33 CFR 83.03(g)(ii) | `verified` |
| 14 | `rule3:divers` | Restricted in her ability to maneuver | Rule 3(g)(ii), 33 CFR 83.03(g)(ii) | `verified` |
| 15 | `rule3:heavy-tow` | Restricted in her ability to maneuver | Rule 3(g)(vi), 33 CFR 83.03(g)(vi) | `corrected` |
| 16 | `rule3:replenishment` | Restricted in her ability to maneuver | Rule 3(g)(iii), 33 CFR 83.03(g)(iii) | `verified` |
| 17 | `rule3:deep-draft` | Constrained by her draft | Rule 3(h), International only | `corrected` |

### Verified cards

Each verified card keeps its `cue` and `why` exactly as on `3c67dd4`. Only the citation string changes to the form above, which is a display format, not a content fix.

| Card id | Cue | Why | Note |
| --- | --- | --- | --- |
| `rule3:motorboat` | Motoring across the harbor | Any vessel driven by machinery is a power-driven vessel. | Matches (b) |
| `rule3:container-ship` | Container ship under way at sea | Size makes no difference: driven by machinery, she is power-driven. | Matches (b). Rule 3 has no size test |
| `rule3:sailing` | Sails full, engine off | Under sail with no engine in use: a sailing vessel. | Matches (c) |
| `rule3:spinnaker` | Racing downwind under spinnaker | Any sail counts while the engine is not in use: a sailing vessel. | Matches (c). The cue does not say the engine is off. A racing yacht under racing rules does not use her engine, and the reason states the condition, so the card stands |
| `rule3:sails-furled` | Sails furled, motoring home | A sailboat under engine alone is a power-driven vessel. | Matches (b) |
| `rule3:longliner` | Setting a longline over the stern | Lines that limit her maneuvering make her engaged in fishing. | Matches (d), which names lines. A longline being set restricts maneuverability |
| `rule3:engine-failed` | Engine failed, drifting | An exceptional circumstance leaves her unable to maneuver: not under command. | Matches (f) |
| `rule3:steering-failed` | Steering gear broken, circling | A breakdown, not her work, stops her maneuvering: not under command. | Matches (f). The "not her work" contrast with (g) is correct and useful |
| `rule3:buoy-tender` | Lifting a navigation buoy aboard | Her work servicing a navigation mark limits her maneuvering: restricted. | Matches (g)(i) |
| `rule3:dredge` | Dredging the channel | Dredging is work that limits her maneuvering: restricted. | Matches (g)(ii) |
| `rule3:divers` | Tending divers working below | Underwater operations limit her maneuvering: restricted. | Matches (g)(ii) |
| `rule3:replenishment` | Transferring cargo to another ship, under way | Transferring cargo under way limits her maneuvering: restricted. | Matches (g)(iii) |

### Corrected cards

Stage 1 ships the text in the "Ship" column.

**`rule3:motorsailing`.** The answer is right, but the old citation, Rule 3(c), only says why she is not a sailing vessel. Rule 3(b) is what makes her power-driven.

| Field | Was | Ship |
| --- | --- | --- |
| Citation | Rule 3(c) | Rule 3(b) and (c), 33 CFR 83.03(b) and (c) |
| Cue | Sails up, engine running | Sails up, engine running |
| Why | With her engine in use she is power-driven, sails or not. | With her engine in use she is power-driven, sails or not. |

**`rule3:trawler`.** The answer is right. A trawler under way is also propelled by machinery, so a player who taps "Power-driven" has read Rule 3(b) correctly. The reason must say why "Engaged in fishing" is the better term, or the card teaches that the player's reading of (b) was wrong. See finding F2.

| Field | Was | Ship |
| --- | --- | --- |
| Citation | Rule 3(d) | Rule 3(d), 33 CFR 83.03(d) |
| Cue | Towing a trawl net astern | Towing a trawl net astern |
| Why | Her trawl limits how she can maneuver: engaged in fishing. | She has an engine too, but a trawl that restricts her maneuvering makes her a vessel engaged in fishing. |

**`rule3:trolling`.** The answer depends on the boat being under power, and the old cue never says so. A sailboat trolling lines is a sailing vessel under (c). The citation also needs (b), which supplies the answer, beside (d), which rules out fishing.

| Field | Was | Ship |
| --- | --- | --- |
| Citation | Rule 3(d) | Rule 3(b) and (d), 33 CFR 83.03(b) and (d) |
| Cue | Trolling two lines for salmon | Motoring slowly, trolling two lines for salmon |
| Why | Trolling lines do not limit maneuvering, so she is not engaged in fishing. She is power-driven. | Trolling lines do not restrict her maneuvering, so she is not engaged in fishing. Under engine, she is power-driven. |

**`rule3:heavy-tow`.** (g)(vi) says the tow "severely restricts" the ability to deviate from course. The old cue says she "can't" turn off her course, which is stronger than the rule and also gives the answer away. Being a towing vessel does not make a vessel restricted by itself; the restriction does, and the reason says so.

Amended on 2026-10-23 for issue #62. (g)(vi) requires the towing operation to severely restrict both the towing vessel and her tow. The first corrected cue named only the barge, so the player could not tell the answer from the cue. The cue now names both. `uscg-regs` re-read 83.03(g)(vi) and International Rule 3(g)(vi) for this change; both read the same.

| Field | Was | Ship |
| --- | --- | --- |
| Citation | Rule 3(g)(vi) | Rule 3(g)(vi), 33 CFR 83.03(g)(vi) |
| Cue | Heavy tow: she can't turn off her course | Towing a heavy barge; she and her tow can hardly leave their course |
| Why | A tow that severely limits turning from her course makes her restricted. | A tow that severely restricts her and her tow from leaving their course makes her restricted. |

**`rule3:deep-draft`.** The answer and the International-only marking are right. Rule 3(h) applies only to a power-driven vessel, and the tanker is one. The old reason's "pins her to her course" overstates "severely restricted in her ability to deviate". The Inland line is right: 83.03(h) is reserved.

| Field | Was | Ship |
| --- | --- | --- |
| Citation | Rule 3(h), International | Rule 3(h), International only |
| Cue | Deep tanker in a narrow channel, little water under her | Deep tanker in a narrow channel, little water under her |
| Why | Her draft against the depth and width of water pins her to her course. Inland rules have no such term. | Her draft, against the depth and width of the channel, severely restricts her from leaving her course. The Inland Rules have no such term. |

### Answer labels

| Category id | Was | Ship | Status |
| --- | --- | --- | --- |
| `power` | Power-driven | Power-driven | `verified` |
| `sailing` | Sailing | Sailing | `verified` |
| `fishing` | Engaged in fishing | Engaged in fishing | `verified` |
| `nuc` | Not under command | Not under command | `verified` |
| `ram` | Restricted in ability to maneuver | Restricted in her ability to maneuver | `corrected`. Rule 3(g) defines "restricted in her ability to maneuver". The old label dropped "her" while the draft label kept it |
| `cbd` | Constrained by her draft | Constrained by her draft | `verified`, International only. See F1 |

## Findings above single cards

**F1. The constrained-by-draft card and button belong in the International differences level under G6.** G6 says "Inland differences and International differences use separate levels, not a selector inside one level", and the build plan lists constrained-by-draft content among the differences levels' material. Definitions is a shared level. A sixth button tagged "International only" inside it is a per-card rule-set switch, which G6 rules out. Recommendation: Stage 1 ships 16 shared cards and five answer buttons, and the `rule3:deep-draft` card, with the text above, moves to `ch1-international-differences` (level 11). The card's content is verified either way. If Et wants it kept in level 1, the spec's six-button variant applies and the card shows the "International only" chip. Et decides.

**F2. The question must ask for the best-fitting term.** Rule 3(b) covers any vessel propelled by machinery, so the trawler, the buoy tender, the dredge, the dive boat, the tug and both not-under-command vessels can all be power-driven at the same time as their special status. "What is she?" has more than one true answer for 9 of the 16 shared cards. The exam asks which status governs. Stage 1 asks "Which Rule 3 term fits her best?" and the trawler's reason above shows the pattern for explaining it.

**F3. Rule 5 lookout is not covered.** G7 names level 1 "definitions and lookout (Rules 3 and 5)", and the build plan's Ticket 1 adds Rule 5 material. Branch `3c67dd4` has no Rule 5 card, so this check has none to verify. Any Rule 5 card needs its own `uscg-regs` check before it ships.

**F4. Spoken phrases and distractors.** The build plan asks `uscg-regs` to check spoken phrases too. The old branch speaks nothing, so there is nothing to check. Every distractor on every card is one of the six labels above, and no card lists its answer among its distractors.

## Open questions for the NMC

None from this check. Rule 3 is printed text with no NMC interpretation needed for these cards.
