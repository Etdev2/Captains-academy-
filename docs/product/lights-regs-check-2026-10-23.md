# Lights level regulation check, 2026-10-23

Claude, acting as `uscg-regs`, checked the 19 shared cards of the issue #29 Lights level, plus the one International-only card kept out of it, against the current Inland Rules 20 to 31 (33 CFR 83.20 to 83.31) on 2026-10-23. On 2026-10-24 a second pass read the eCFR text of 33 CFR 83 and the International Rules in the NavCen amalgamated rules, and compared the two paragraph by paragraph (see "How the sources were used"). Every card was checked for its answer, its cue, its one-line reason and its paragraph citation. The Rule 21 sectors the bridge view draws were checked too.

Of 19 cards, 17 are `verified` and 2 are `corrected`. No card is left open. The text below is the text the deck ships, word for word. With it, the cards appear to meet the paragraphs they cite. The Coast Guard and the NMC still have the last word.

| Field | Value |
| --- | --- |
| Source of the cards | `src/sim/chapter1/lights.ts` on branch `claude/issue-29-20261023-2037` |
| Fields checked per card | `cue`, `answer`, `citation`, `why`, `ruleSet`, the aspect it is drawn from, and the seven answer labels in `CATEGORIES` |
| Inland text read | Cornell LII copy of 33 CFR 83.20, 83.21, 83.23, 83.24, 83.25, 83.26, 83.27 and 83.30, read 2026-10-23 |
| Inland text, second read | eCFR full text of 33 CFR part 83 as of 2026-10-01, read 2026-10-24. SHA-256 of the XML response `0f25e0a75accf2c84e51f61fe49642a51381a019794f28b1783b0abba7c3b228` |
| International text read | NavCen amalgamated navigation rules page (`navcen.uscg.gov/navigation-rules-amalgamated`), Rules 20 to 31 and Annex I, read 2026-10-24. SHA-256 of the HTML response `cc26ac94b8ac02e82694c6ffb38167a56caddc3037b6a2b5041ae6f0da56cd9c` |
| Dates checked | 2026-10-23, 2026-10-24 |

## How the sources were used

- First pass, 2026-10-23: the session's web reader returned the Inland sections from Cornell LII. It could quote only short passages, so long paragraphs were checked from summaries plus short verbatim excerpts. That session's shell could not reach `ecfr.gov` or `navcen.uscg.gov`.
- Second pass, 2026-10-24: the shell fetched the eCFR XML of 33 CFR part 83 and the NavCen amalgamated rules page. Every paragraph in the tables below was read in full from both. The hashes in the table above identify the responses read.
- The NavCen page prints the two rule sets as one text. A paragraph or phrase that applies under one set only is labeled `International` or `Inland`, or set in single (International) or double (Inland) angle quotes. None of the paragraphs a played card cites carries such a label or quote mark. The only one inside them is in 83.21(a) and (b), an Inland-only phrase on where a vessel under 12 meters places her masthead light and combined lantern, which no card draws.
- Not read: the printed Handbook PDF and the IMO's own COLREGS text. NavCen's page is the Coast Guard's own publication of both rule sets.
- In the tables, "83.23" means 33 CFR 83.23.

## Rules 20 and 21: when lights show and what the sectors are

| Paragraph | Text read | Used by |
| --- | --- | --- |
| 83.20(a) | Rules 20 to 31 apply in all weather | Context only |
| 83.20(b) | The light rules apply from sunset to sunrise. Other lights may show only if they cannot be mistaken for the required lights | Every card is a night scene |
| 83.20(c) | Required lights, if carried, also show by day in restricted visibility | Not used |
| 83.20(d) | The rules on shapes apply by day | Day shapes are out of scope for this level |
| 83.21(a) | Masthead light: unbroken white light over 225 degrees, from right ahead to 22.5 degrees abaft the beam on each side | `masthead` arc: visible while the observer is within 112.5 degrees of her bow |
| 83.21(b) | Sidelights: green to starboard and red to port, each over 112.5 degrees, from right ahead to 22.5 degrees abaft the beam on its own side | `starboard` and `port` arcs |
| 83.21(c) | Sternlight: white, 135 degrees, 67.5 degrees from right aft on each side | `stern` arc |
| 83.21(d) | Towing light: yellow, same characteristics as the sternlight | `yellow` light with the `stern` arc |
| 83.21(e) | All-round light: unbroken light over 360 degrees | `all-round` arc |
| 83.21(f) | Flashing light: 120 flashes or more a minute | Not used |

The deck does not pick which lights show. `shownLights` in `src/sim/chapter1/lights.ts` asks the Rule 21 module, so the cue and the drawing cannot disagree with the sectors. The edges fall on exact turn units: 112.5 degrees is 320 of 1,024 units. A card never sits on an edge, so no card depends on the edge rule.

Annex I (the cutoff of the lights at their sector edges): the sidelights' intensity "shall decrease to reach practical cut-off between 1 and 3 degrees outside the prescribed sectors" in the forward direction, and every sector light shall reach practical cut-off "at not more than 5 degrees outside the prescribed sectors" at its other edges. `isVisible` takes an `overlap` that defaults to none, so the sidelights meet exactly at dead ahead and every sector ends on its Rule 21 edge. No card sits inside those bands: the cards are drawn at 0, 45, 70, 90 and 180 degrees from the bow, and the nearest edge to any of them is more than 20 degrees away. Dead ahead shows both sidelights under either reading. `verified` for the deck as it stands. A card added within 5 degrees of an edge would need the Annex I band modeled first.

## Rules 23 to 30 paragraphs the cards use

| Paragraph | Text read | Difference from International |
| --- | --- | --- |
| 83.23(a) | A power-driven vessel under way shows a masthead light forward, a second masthead light abaft of and higher than the forward one (a vessel under 50 meters need not show it but may), sidelights and a sternlight | None found |
| 83.24(a) | A power-driven vessel towing astern shows two masthead lights in a vertical line instead of the 83.23(a)(i) or (ii) light, three when the tow measures over 200 meters, plus sidelights, a sternlight, a towing light in a vertical line above the sternlight, and a diamond when the tow is over 200 meters | None found |
| 83.25(a) | A sailing vessel under way shows sidelights and a sternlight | None found |
| 83.25(c) | A sailing vessel may also show two all-round lights in a vertical line near the masthead, red above green. Not with the combined lantern of 83.25(b) | None found |
| 83.26(b) | A vessel trawling shows two all-round lights in a vertical line, green above white, a masthead light abaft and higher (a vessel under 50 meters need not), and, when making way, sidelights and a sternlight | None found |
| 83.26(c) | A vessel fishing other than trawling shows two all-round lights in a vertical line, red above white, and, when making way, sidelights and a sternlight | None found |
| 83.27(a) | A vessel not under command shows two all-round red lights in a vertical line, and, when making way, sidelights and a sternlight | None found |
| 83.27(b) | A vessel restricted in her ability to maneuver shows three all-round lights in a vertical line, the highest and lowest red and the middle white, and, when making way, a masthead light or lights, sidelights and a sternlight. Mine clearance is excepted | None found |
| 83.30(a) | A vessel at anchor shows an all-round white light in the fore part, and one at or near the stern, lower than the forward one | None found |
| 83.30(b) | A vessel under 50 meters may show one all-round white light instead | None found |
| 83.28 | `[Reserved]` in the Inland Rules. The 33 CFR 83 subpart C table of contents prints it so | International only: Rule 28 vessel constrained by her draft |

Paragraphs not used by any card: 83.23(b) air-cushion vessel, 83.24(b) and (c) pushing and towing alongside, 83.25(b) combined lantern, 83.25(d) small sailing vessels and vessels under oars, 83.26(d), 83.27(c) severely restrictive towing, 83.29 pilot vessels and 83.31 seaplanes. The NMC's open questions on oars, seaplanes and an optional second masthead light are left out of this level. The only optional masthead light that appears is the second masthead on the `rule23:power-long` card, which is shown as a vessel that carries it.

The pictures leave out a few lights the rules allow or require, and the cards say nothing that contradicts them: the optional masthead light abaft the trawler's green light (83.26(b)), the white light toward the gear of a long fishing net (83.26(c)), the second masthead on a 50-meter-or-less vessel and the towing diamond, which is a day shape. A light the rules require and a card omits would be a defect. None is omitted: sidelights and sternlights show whenever the vessel is under way and the angle lets them.

## Card by card

The "Citation to show" column is the exact citation string the deck shows on the card and in the miss replay. A shared card cites the International rule number and the Inland CFR paragraph.

| # | Card id | Answer | Citation to show | Status |
| --- | --- | --- | --- | --- |
| 1 | `rule23:power-head-on` | Power-driven | Rule 23(a), 33 CFR 83.23(a) | `verified` |
| 2 | `rule23:power-starboard-bow` | Power-driven | Rule 23(a), 33 CFR 83.23(a) | `verified` |
| 3 | `rule23:power-port-beam` | Power-driven | Rule 23(a), 33 CFR 83.23(a) | `verified` |
| 4 | `rule23:power-long` | Power-driven | Rule 23(a), 33 CFR 83.23(a) | `verified` |
| 5 | `rule24:towing-short` | Towing | Rule 24(a), 33 CFR 83.24(a) | `verified` |
| 6 | `rule24:towing-long` | Towing | Rule 24(a), 33 CFR 83.24(a) | `verified` |
| 7 | `rule24:towing-astern` | Towing | Rule 24(a), 33 CFR 83.24(a) | `verified` |
| 8 | `rule25:sailing-head-on` | Sailing | Rule 25(a), 33 CFR 83.25(a) | `verified` |
| 9 | `rule25:sailing-starboard-beam` | Sailing | Rule 25(a), 33 CFR 83.25(a) | `verified` |
| 10 | `rule25:sailing-red-over-green` | Sailing | Rule 25(c), 33 CFR 83.25(c) | `corrected` |
| 11 | `rule26:trawling-head-on` | Engaged in fishing | Rule 26(b), 33 CFR 83.26(b) | `verified` |
| 12 | `rule26:trawling-starboard-beam` | Engaged in fishing | Rule 26(b), 33 CFR 83.26(b) | `corrected` |
| 13 | `rule26:fishing-port-bow` | Engaged in fishing | Rule 26(c), 33 CFR 83.26(c) | `verified` |
| 14 | `rule27:nuc-stopped` | Not under command | Rule 27(a), 33 CFR 83.27(a) | `verified` |
| 15 | `rule27:nuc-under-way` | Not under command | Rule 27(a), 33 CFR 83.27(a) | `verified` |
| 16 | `rule27:ram-stopped` | Restricted in her ability to maneuver | Rule 27(b), 33 CFR 83.27(b) | `verified` |
| 17 | `rule27:ram-under-way` | Restricted in her ability to maneuver | Rule 27(b), 33 CFR 83.27(b) | `verified` |
| 18 | `rule30:anchor-small` | At anchor | Rule 30(b), 33 CFR 83.30(b) | `verified` |
| 19 | `rule30:anchor-long` | At anchor | Rule 30(a), 33 CFR 83.30(a) | `verified` |

### Shipped cue and reason for every card

| Card id | Cue | Why | Note |
| --- | --- | --- | --- |
| `rule23:power-head-on` | Heading straight at you | A masthead light with a red and a green sidelight: a power-driven vessel under way. | Matches 83.23(a). Dead ahead shows both sidelights. The sternlight is hidden |
| `rule23:power-starboard-bow` | Closing, her bow angled to your right | A masthead light with one sidelight: a power-driven vessel under way. | Matches 83.23(a). At 45 degrees the starboard sidelight and the masthead light show |
| `rule23:power-port-beam` | Crossing, her bow pointing to your left | A masthead light with one sidelight: a power-driven vessel under way. | Matches 83.23(a). At 90 degrees the port sidelight and the masthead light show |
| `rule23:power-long` | Closing, her bow angled to your left | Two masthead lights, the after one higher, with a sidelight: a power-driven vessel under way. | Matches 83.23(a)(i) and (ii). The second light is optional under 50 meters, so the card shows a vessel that carries it |
| `rule24:towing-short` | Closing, her bow angled to your right | Two masthead lights in a vertical line with a sidelight: a power-driven vessel towing astern. | Matches 83.24(a)(i). The picture shows a tow of 200 meters or less. The yellow towing light is hidden at this angle |
| `rule24:towing-long` | Closing, her bow angled to your left | Three masthead lights in a vertical line with a sidelight: a power-driven vessel towing astern with a long tow. | Matches 83.24(a)(i). Three lights mean a tow over 200 meters |
| `rule24:towing-astern` | Heading away from you | A yellow towing light above a white sternlight: a power-driven vessel towing astern. | Matches 83.24(a)(iii) and (iv). From astern only the sternlight and the towing light show |
| `rule25:sailing-head-on` | Heading straight at you | A red and a green sidelight with no masthead light: a sailing vessel under way. | Matches 83.25(a) |
| `rule25:sailing-starboard-beam` | Crossing, her bow pointing to your right | One sidelight and no masthead light: a sailing vessel under way. | Matches 83.25(a). At 90 degrees the sternlight is out of its sector |
| `rule25:sailing-red-over-green` | Closing, her bow angled to your left | Red over green, all-round, near the top of the mast, with a sidelight: a sailing vessel under way. | Corrected, see below |
| `rule26:trawling-head-on` | Making way, heading straight at you | Green over white, all-round, with sidelights: a vessel engaged in fishing, trawling. | Matches 83.26(b). The optional masthead light is not drawn |
| `rule26:trawling-starboard-beam` | Making way, her bow pointing to your right | Green over white, all-round, with a sidelight: a vessel engaged in fishing, trawling. | Corrected, see below |
| `rule26:fishing-port-bow` | Making way, her bow angled to your left | Red over white, all-round, with a sidelight: a vessel engaged in fishing, not trawling. | Matches 83.26(c) |
| `rule27:nuc-stopped` | Not moving, no way on | Two red lights in a vertical line and no others: a vessel not under command, with no way on. | Matches 83.27(a). With no way on, no sidelights or sternlight show |
| `rule27:nuc-under-way` | Making way, heading straight at you | Two red lights in a vertical line, with sidelights: a vessel not under command, making way. | Matches 83.27(a) |
| `rule27:ram-stopped` | Not moving, no way on | Red, white, red in a vertical line and no others: a vessel restricted in her ability to maneuver, with no way on. | Matches 83.27(b)(i). Mine clearance, which has other lights, is not a card |
| `rule27:ram-under-way` | Making way, her bow angled to your right | Red, white, red in a vertical line, with a masthead light and a sidelight: a vessel restricted in her ability to maneuver, making way. | Matches 83.27(b)(i) and (iii). The first pass cited (ii), which is the shapes; corrected on the second pass |
| `rule30:anchor-small` | Not moving, riding to her anchor | One white light seen all round: a vessel at anchor. | Matches 83.30(b). The rule allows it for a vessel under 50 meters, which the cue does not state; a vessel under oars or a small sailboat could also show one white light, but neither is an answer |
| `rule30:anchor-long` | Not moving, riding to her anchor | Two white lights all round, the after one lower: a vessel at anchor. | Matches 83.30(a)(i) and (ii) |

### Corrected cards

The deck ships the text in the "Ship" column.

**`rule25:sailing-red-over-green`.** The old reason said "at the masthead". Rule 25(c) puts the red-over-green pair "at or near the top of the mast", so it was loose. It also did not say the pair is all-round, which is what separates it from a masthead light.

| Field | Was | Ship |
| --- | --- | --- |
| Citation | Rule 25(c), 33 CFR 83.25(c) | Rule 25(c), 33 CFR 83.25(c) |
| Cue | Closing, her bow angled to your left | Closing, her bow angled to your left |
| Why | Red over green at the masthead, with a sidelight: a sailing vessel under way. | Red over green, all-round, near the top of the mast, with a sidelight: a sailing vessel under way. |

**`rule26:trawling-starboard-beam`.** Sidelights show only when the vessel is making way (83.26(b)). The old cue, "Crossing, her bow pointing to your right", did not say she was making way, yet the card shows a sidelight. A trawler stopped with her gear down shows only the green-over-white pair, so the cue could not tell the player which picture they were looking at.

| Field | Was | Ship |
| --- | --- | --- |
| Citation | Rule 26(b), 33 CFR 83.26(b) | Rule 26(b), 33 CFR 83.26(b) |
| Cue | Crossing, her bow pointing to your right | Making way, her bow pointing to your right |
| Why | Green over white, all-round, with a sidelight: a vessel engaged in fishing, trawling. | Green over white, all-round, with a sidelight: a vessel engaged in fishing, trawling. |

### Answer labels

Each id is the key the deck and the buttons use. The phrase is the object of "Those are the lights of ...".

| Category id | Label | Phrase | Status |
| --- | --- | --- | --- |
| `power` | Power-driven | a power-driven vessel under way | `verified` |
| `sailing` | Sailing | a sailing vessel under way | `verified` |
| `towing` | Towing | a power-driven vessel towing astern | `verified`. 83.24(a) says "power-driven vessel when towing astern" |
| `fishing` | Engaged in fishing | a vessel engaged in fishing | `verified` |
| `nuc` | Not under command | a vessel not under command | `verified` |
| `anchor` | At anchor | a vessel at anchor | `verified` |
| `ram` | Restricted in her ability to maneuver | a vessel restricted in her ability to maneuver | `verified`. Matches the Rule 3(g) label the Definitions check set |

## Constrained by draft: kept out of this level

| Field | Value |
| --- | --- |
| Id | `rule28:constrained-by-draft` |
| Cue | Deep tanker in a narrow channel, making way |
| Answer label | Constrained by her draft |
| Citation to show | Rule 28, International only |
| Why | Three red lights in a vertical line, with her power-driven lights: a vessel constrained by her draft. The Inland Rules have no such vessel. |
| Status | `verified`. 33 CFR 83.28 is `[Reserved]`. International Rule 28 gives the vessel three all-round red lights in a vertical line, in addition to her power-driven lights |

This follows finding F1 of the Definitions check. G6 says Inland and International differences use separate levels, not a selector inside one, so this card waits for the International differences level. Its text is checked here so it travels with the deck.

## Findings above single cards

**F1. Rule 28 is a difference and stays out.** See above. The NavCen text labels Rule 28 "International Rules Only" and gives the vessel, in addition to her Rule 23(a) lights, three all-round red lights in a vertical line, or a cylinder. eCFR prints 83.28 as `[Reserved]`. `verified`.

**F2. A shared card has to hold under both rule sets.** Every played card cites a paragraph that reads the same in the Inland and International rules: 21(a) to (e), 23(a), 24(a), 25(a) and (c), 26(b) and (c), 27(a) and (b), and 30(a) and (b). The only wording that differs is the CFR's cross-references, such as "(§§ 83.23(a)(i) and (ii))" in 83.24(a)(i). `verified` against the 2026-10-24 read. A difference found later would need a flagged card in a differences level.

**F3. A picture leaves out lights the rules allow.** See "Rules 23 to 30 paragraphs the cards use". The deck draws one version of each vessel. A player who knows a vessel can carry a longer version of the same pattern is not wrong. The test `shows from every card a picture that no other vessel in the answers shares` proves no two answers draw the same lights from the same angle.

**F4. Exam values.** No value from NMC guide MCP-MA-NMC2-08(01) is used. If one is added later it is treated as current and labeled unverified.

## Open questions for the NMC

1. The optional second masthead light on a vessel under 50 meters (83.23(a)(ii)): does the exam draw it? The deck draws it only on the `rule23:power-long` card.
2. Oars and seaplanes (83.25(d), 83.31): left out of this level.
