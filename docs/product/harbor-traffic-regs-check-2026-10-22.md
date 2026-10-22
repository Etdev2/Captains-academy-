# Harbor traffic course regulation check, 2026-10-22

Claude, acting as `uscg-regs`, checked the lesson lines and traffic situations of the issue #46 harbor course against the printed Navigation Rules on 2026-10-22. The check covers Rules 5, 6, 9, 14 and 15, which the lesson lines cite, and the paragraphs those rules depend on: Rule 3(b) for "power-driven", Rule 8(f) for "not impede", Rule 13(b) for the overtaking sector, Rules 16 and 17 for the give-way and stand-on duties, and 33 CFR 80.1114 for the demarcation line at Long Beach. No game code was changed.

Of 13 items, 9 are `verified` and 4 are `wrong`. Every `wrong` item is a must-fix before the level ships. With those four fixed, the lesson lines appear to meet the paragraphs they cite. The Coast Guard and the NMC still have the last word.

| Field | Value |
| --- | --- |
| Source of the lines | Branch `head-dev/harbor-traffic-course` at `7df4aec` |
| Files read | `missions/long-beach-traffic.json` (traffic tracks, sizes, speeds, start gates and the four `lesson` strings), `src/game/HarborScene.ts` (the hit banner and the course coaching line), `src/sim/course.ts` and `src/sim/sim.ts` (how traffic moves and what counts as a hit), `.claude/skills/verify-captains-academy/features/harbor-course.md`, and the two golden replays |
| How the geometry was read | The two golden replays, `long-beach-traffic-docks` and `long-beach-traffic-hit-by-ferry`, were run headless in a scratch worktree at `7df4aec`. A throwaway probe sampled the player's heading and each vessel's course, relative bearing and range at 15, 10 and 5 seconds before the closest approach. The probe was deleted and nothing was committed to that branch |
| Heading convention | 0 is north (toward smaller `y`) and angles grow clockwise. The probe confirmed this from the boat's motion. Relative bearings are measured from the player's bow, positive to starboard |
| International text read | Coast Guard Navigation Rules and Regulations Handbook, corrected 2024-08-12, and the NavCen amalgamated rules page |
| Inland text read | eCFR 33 CFR part 83, and parts 80 and 89 for the demarcation line and the waters where the Inland-only paragraphs apply |
| Date checked | 2026-10-22 |

## How the sources were used

- The Handbook and the NavCen page are byte-identical to the copies that the [Night Harbor Run check](night-harbor-run-regs-check-2026-10-22.md) read earlier on 2026-10-22. The SHA-256 values in the Sources table match that check's values. Part 83 and part 80 also match that check's copies.
- Every International paragraph cited below was read in both the Handbook and the NavCen page. The two agree apart from layout.
- The Inland rules were read in eCFR. Part 83 was last amended on 2022-09-06, part 80 on 2025-03-17 and part 89 on 2019-06-28. eCFR shows title 33 up to date as of 2026-10-20.
- The Handbook's Inland Rule 9(d) prints "A vessel shall not cross". eCFR 83.09(d) prints "A vessel must not cross". The duty is the same. This check quotes eCFR for Inland.
- Not read: the IMO's own COLREGS text. The Night Harbor Run check's open item about IMO amendments after resolution A.1085(28) still applies.

In the tables, "Int" means the International text and "Inland 83.N" means 33 CFR 83.N. A rule number with neither prefix reads the same in both rule sets.

## Sources

| URL | What it is | Version date | SHA-256 | Read directly |
| --- | --- | --- | --- | --- |
| https://www.navcen.uscg.gov/sites/default/files/pdf/navRules/Handbook/Nav%20Rules%20Handbook_Corrected_08-12-2024.pdf (answers with a 301 to `navcen.uscg.gov`) | Navigation Rules and Regulations Handbook, International and Inland side by side | Corrected 2024-08-12 | `dcc7eb6d279be614a4fd4e18cbea6bbf55b44f0322ba0a0a07f2f0265dd633e2` | Yes, Rules 5, 6, 9, 13 to 17 |
| https://www.navcen.uscg.gov/navigation-rules-amalgamated | NavCen amalgamated International and Inland rules | Page last changed 2024-08-21 | `7fec3b88df084a52b6c7589f630beb3ff29ac3bcababd8eac9c15350d6f928d0` | Yes, Rules 5, 6, 9, 14, 15 |
| https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-33.xml?part=83 | eCFR 33 CFR part 83, Inland Rules | 2026-10-01, same text as 2026-10-19 | `0f25e0a75accf2c84e51f61fe49642a51381a019794f28b1783b0abba7c3b228` | Yes, 83.03, 83.05 to 83.09, 83.13 to 83.18 |
| https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-33.xml?part=80 | eCFR 33 CFR part 80, COLREGS demarcation lines | 2026-10-01 | `b130a4a0b68b155293cb62d72ae604fc9923e479bc616a2352b2c5c658a37b7d` | Yes, 80.01 and 80.1114 |
| https://www.ecfr.gov/api/versioner/v1/full/2026-10-01/title-33.xml?part=89 | eCFR 33 CFR part 89, including 89.25 | 2026-10-01 | `001bdb5b23627835d6c539f0cfcc815066dc7ea8bf1651099181b89c0a719d3c` | Yes, 89.25 |
| https://www.ecfr.gov/api/versioner/v1/versions/title-33.json?part=83 | eCFR amendment history for part 83 | Latest entry 2022-09-06 | `afc6452785c4df3f1b840f62f2eec3b3f8363b22c2521f406cab77231518e7a1` | Yes |
| https://www.ecfr.gov/api/versioner/v1/titles.json | eCFR title status | Title 33 up to date as of 2026-10-20 | `356d9b079cba906e089d1001d773ab40680664ef70174a0fc0a74553df5d8256` | Yes |

## Summary

| Status | Count |
| --- | --- |
| Items checked | 13 |
| `verified` | 9 |
| `wrong` | 4 |
| `unverified` | 0 |

The 13 items are the four traffic vessels, each with its lesson text, its rule citation and its situation, plus the course coaching line that every traffic run starts with. A situation is the encounter the mission and the golden replays actually produce, judged against the rule the lesson names.

### Must fix before the level ships

1. **Ship situation.** The mission draws no narrow channel or fairway. As drawn, the ship comes from the player's port side on a crossing course. Under Rule 15(a), that makes the ship the give-way vessel and the player the stand-on vessel under Rule 17(a)(i), which is the opposite of the lesson. Rule 9(b) and 9(d) apply only to "a vessel which can safely navigate only within a narrow channel or fairway". Draw that channel or fairway as mission geometry, put the ship's track inside it, and have the player cross it. ADR 0007 already keeps channel boundaries in mission geometry.
2. **Ship lesson text.** "Can't stop or turn for you" is not what Rule 9 says, and Rule 8(f)(iii) keeps the ship "fully obliged" to follow Rules 4 to 19 once risk of collision exists. Rule 9's duty for a boat under 20 m is "shall not impede". See the ship rows for the corrected line.
3. **Ship citation.** "Rule 9" names a rule with seven paragraphs. Cite "Rules 9(b), 9(d)".
4. **Powerboat situation.** In the clean golden replay, the powerboat bears 112° and then 116° relative to the player at 51 m and 39 m. Rule 13(b) puts an overtaking vessel "more than 22.5 degrees abaft her beam", which is more than 112.5°. So the powerboat starts on the line of the overtaking sector and then comes up inside it. In that position the powerboat is overtaking and must keep out of the way under Rule 13(a), whatever Rule 15 says. A player who holds course there and is hit would read "you give way" under the wrong rule. Change the powerboat's start gate, start point or track so that it bears clearly forward of 112.5° whenever risk of collision begins, on any route through gates 2 to 4. Then add a golden replay of a hit by the powerboat that pins that bearing. If the geometry cannot be held, the lesson must change to Rule 13 when the powerboat is overtaking.

### Should fix

- **Ferry geometry.** In the clean replay, the ferry bears 22° to 25° on the player's port bow at 89 m and 63 m. The player bears about 20° on the ferry's port bow, so each vessel sees only the other's port sidelight. Rule 14(b)'s test is "ahead or nearly ahead", with masthead lights in line and/or both sidelights by night. That case is a close port-to-port pass. Rule 14(c) still supports the lesson ("in any doubt ... she shall assume that it does exist"), and the hit replay has the ferry dead ahead at 83 m. Move the ferry's first leg closer to the player's line to gate 5, so the ferry is within a few degrees of dead ahead before its starboard turn. Then pin the relative bearing in the `long-beach-traffic-hit-by-ferry` result.
- **Rule set.** 33 CFR 80.1114(b) draws the Long Beach demarcation line "from Long Beach Channel Entrance Light 2 to Long Beach Light", across a breakwater entrance. 80.01(b) makes the water inside the line Inland Rules waters and the water outside it COLREGS waters. If the course's breakwater gap stands for that entrance, the ship meets the player in COLREGS waters and the other three vessels meet the player in Inland waters. The corrected lines read the same in both rule sets with two exceptions. Int 9(d) says the ship "may use" the Rule 34(d) signal if in doubt, and Inland 83.09(d) says she "must use" it. Inland 83.14(a) begins "Unless otherwise agreed", and Int 14(a) does not. If the ship ever sounds the danger signal, the level needs the Inland "must" only inside the line. 89.25 does not list Long Beach, so Inland 9(a)(ii), 14(d) and 15(b) do not apply. Which rule-set chip the level shows (G6) is a question for `architect` and `ux-ui`, not an error in the lines.

### Optional wording

These rows are `verified`. A change would make them tighter, not correct an error. They are the powerboat lesson text and citation, the ferry citation, and the kayak citation.

## Vessel by vessel

### Container ship, outside the breakwater

Track: east along `y` 195000 from `x` 40000, 60 m long, 11 m beam, 3.5 m/s, moving from the start of the run. The player starts at (150000, 212000) heading 000 and crosses the ship's track to reach gate 1 in the breakwater gap.

| Item | #46 says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Lesson text | "A ship in the channel can't stop or turn for you. Stay out of her way (Rule 9)." | Rule 9(b) says "A vessel of less than 20 meters in length ... shall not impede the passage of a vessel which can safely navigate only within a narrow channel or fairway". The player's boat is 9 m (`boat.lengthMm` 9000), so 9(b) applies once a channel exists. 9(d) says a vessel "shall not cross a narrow channel or fairway if such crossing impedes the passage" of that vessel. The rule's test is that the ship can navigate safely only inside the channel. "Can't stop or turn" states a fact about big ships that the rule does not say. Rule 8(f)(iii) keeps the ship "fully obliged" to follow Rules 4 to 19 once risk of collision exists, so a player should not learn that the ship has no duties. "Stay out of her way" is close to "not impede", but the exam's term is "not impede" | "You're under 20 m. Don't impede a ship that can navigate only inside the channel, and don't cross ahead of her if that would impede her (Rules 9(b), 9(d))." | `wrong` | Rule 9(b), 9(d); Rule 8(f)(i), 8(f)(iii); mission `boat.lengthMm` |
| Citation | "Rule 9" | Rule 9 has paragraphs (a) to (g). Only (b) and (d) carry this lesson | "Rules 9(b), 9(d)" | `wrong` | Rule 9 |
| Situation | No channel or fairway is drawn. The ship runs east, parallel to the breakwater, and the player crosses its track heading north. The feature recipe stops the boat in the ship's lane and the ship hits it | Rule 9 has nothing to apply to without a narrow channel or fairway. Without one, the ship approaching from the west has the player on her own starboard side. Under Rule 15(a) the ship keeps out of the way, and under Rule 17(a)(i) the player keeps course and speed, so the banner teaches the reverse. The clean replay never brings the two close: at the closest approach the player is inside the breakwater, 44 m away, with the ship 110° on the starboard side | Draw the channel or fairway the ship can navigate only within, such as the entrance channel through the breakwater gap, run the ship's track inside it, and have the player cross it. If the course's gap stands for Long Beach's entrance, the ship meets the player in COLREGS waters (see Should fix) | `wrong` | Rules 9(b), 9(d), 15(a), 17(a)(i); 33 CFR 80.1114(b), 80.01(b); clean replay frame 2817 |

### Powerboat, after gate 2

Track: west along `y` 100000 from `x` 290000, 10 m long, 4.5 m/s, starting when the player passes gate 2.

| Item | #46 says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Lesson text | "She crossed from your starboard side, so you give way: slow down or pass astern (Rule 15)." | Right for a crossing. Rule 15(a): "the vessel which has the other on her own starboard side shall keep out of the way and shall, if the circumstances of the case admit, avoid crossing ahead of the other vessel". "Slow down or pass astern" matches 15(a) and Rule 8(e). Both boats are power-driven under Rule 3(b): the player's boat has twin engines and the other is a powerboat. "Crossed" is past tense, and the banner shows only after a hit | Optional: "She's crossing from your starboard side, so you keep out of her way. Slow down or turn to pass astern of her (Rules 15(a), 16)." | `verified` | Rules 3(b), 8(e), 15(a), 16 |
| Citation | "Rule 15" | Right. Rule 16 says how the give-way vessel acts: "early and substantial action to keep well clear" | Optional: "Rules 15(a), 16" | `verified` | Rules 15(a), 16 |
| Situation | Issue #46: "The powerboat crosses from starboard, so a player who holds course into it gets hit." No golden replay shows a hit by the powerboat | In the clean replay the player heads 298 and then 286 while the powerboat runs 270. The powerboat bears 112° relative at 51 m (15 s before the closest approach), 116° at 39 m (10 s) and 100° at 30 m (5 s). Rule 13(b): "A vessel shall be deemed to be overtaking when coming up with another vessel from a direction more than 22.5 degrees abaft her beam", which is more than 112.5° relative. Inland 83.13(a) applies "Notwithstanding anything contained in Rules 4 through 18", and Int 13(a) applies "Notwithstanding anything contained in the Rules of Part B, Sections I and II". So in that sector the powerboat keeps out of the way. Rule 13(d) keeps her the give-way vessel even after the bearing moves forward. The closest approach is 21.5 m with the powerboat 8° on the bow, passing ahead from starboard to port | Must-fix 4. Start or route the powerboat so that it bears forward of 112.5° relative, with margin, whenever risk of collision begins. Add a golden replay of a player who holds course and is hit, and pin the relative bearing at the start of risk of collision | `wrong` | Inland 83.13(a), Int 13(a); Rules 13(b), 13(d), 15(a); clean replay frames 3804 to 4704 |

### Ferry, after gate 4

Track: east along `y` 55000 from `x` 30000, then a turn to its own starboard onto `y` 68000, 30 m long, 4.0 m/s, starting when the player passes gate 4. The player crosses gate 5, a north-south line at `x` 180000, heading west.

| Item | #46 says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Lesson text | "Head-on: both boats turn to starboard and pass port to port (Rule 14)." | Rule 14(a): "each shall alter her course to starboard so that each shall pass on the port side of the other". It applies to two power-driven vessels. The player's boat has twin engines and the ferry is power-driven, so Rule 3(b) is met. Inland 83.14(a) adds "Unless otherwise agreed". The line does not need that phrase | None | `verified` | Rule 14(a); Inland 83.14(a); Rule 3(b) |
| Citation | "Rule 14" | Right | Optional: "Rule 14(a)" | `verified` | Rule 14(a) |
| Situation | Issue #46: "The ferry meets the player head-on and turns to its own starboard, so a player who turns to port steers into it." Golden replay `long-beach-traffic-hit-by-ferry` | In the hit replay, the ferry is dead ahead at 83 m while the player heads 261 and the ferry is making its starboard turn. The player then turns to port (241, then 236) and is hit. In the clean replay, the courses are 274 and 090, 4° off reciprocal, and the vessels pass port to port at 21.9 m. The ferry's turn to starboard is the Rule 14(a) action. Before it, the ferry bears 22° to 25° on the player's port bow, which is at the edge of "ahead or nearly ahead" in 14(b). Rule 14(c) covers that doubt | Should fix: bring the ferry's first leg closer to dead ahead and pin the bearing in the hit replay | `verified` | Rules 14(a), 14(b), 14(c); hit replay frames 7899 to 8499; clean replay frames 7898 to 8798 |

### Kayak, near the slip

Track: east along `y` 36000 from `x` 130000, 4 m long, 1.2 m/s, starting when the player passes gate 4.

| Item | #46 says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Lesson text | "Small craft are hard to see. Keep a lookout and slow down near them (Rules 5 and 6)." | Rule 5: "Every vessel shall at all times maintain a proper look-out by sight and hearing as well as by all available means appropriate ...". Rule 6 requires a safe speed and lists "the traffic density" (6(a)(ii)) and "the maneuverability of the vessel with special reference to stopping distance" (6(a)(iii)) among the factors. "Small craft are hard to see" is seamanship, not rule text. Rule 6(b)(iv) names the related case for radar, "small vessels ... may not be detected by radar at an adequate range". The line claims no right of way for the kayak, which is correct. A kayak is a vessel under Rule 3(a), but it is not power-driven, so Rules 14 and 15 do not apply to it. Rule 18 does not list it either | None | `verified` | Rules 3(a), 5, 6(a)(ii), 6(a)(iii), 6(b)(iv) |
| Citation | "Rules 5 and 6" | Right | Optional: "Rules 5, 6(a)". Add 8(e) if the line keeps "slow down" | `verified` | Rules 5, 6(a), 8(e) |
| Situation | Kayak crossing the approach to the slip | In the clean replay the kayak runs 090 against the player's 273, 10° to 40° on the starboard bow, and passes starboard to starboard at 9.9 m. That is close for a 9 m boat, which is the lesson's point. The PR #49 check's open NMC question on a power-driven vessel meeting a vessel under oars applies to a paddled kayak too. The lesson does not depend on the answer | None | `verified` | Rules 2, 5, 6, 7, 8; clean replay frames 8228 to 9128 |

## Course coaching line

| Item | #46 says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Start line | "Run the gold gates in order, then dock. Watch the traffic: a wrong turn gets you hit." | Makes no rule claim. "Watch the traffic" agrees with Rule 5 | None | `verified` | Rule 5 |

## Boundary cases for the port's tests

- The powerboat's relative bearing at the start of risk of collision is less than 112.5°, on the routes the golden replays take and on a route that holds course from gate 3 (Rule 13(b)).
- A hit by the powerboat has its own golden replay. Its result pins that bearing.
- The ferry is within a few degrees of dead ahead before its starboard turn, and the hit replay pins that bearing (Rule 14(b)).
- The ship's track lies inside a drawn channel or fairway, and the player's route crosses it (Rule 9(b), 9(d)).
- The player's boat stays under 20 m. At 20 m or more, Rule 9(b) no longer applies to it, though 9(d) still does.

The sea-time cases this role normally tests do not apply. This check affects no license and no sea-time entry.

## Open items

Unverified: none of the 13 items.

- Moored boats. The gates sit beside moored boats, which the mission data calls `moored-boat`, while issue #46 calls them "anchored". Rule 30 and the anchor shapes and lights were not in scope and were not checked.
- IMO amendments. Whether any amendment to the COLREGS after resolution A.1085(28) has entered into force is still open, as in the Night Harbor Run check.

For the NMC, through `uscg-regs`:

- When a power-driven vessel meets a kayak or another vessel under oars and neither is overtaking, does the NMC treat the case under Rules 2, 7 and 8 only, with no stand-on vessel? This is the same question the Night Harbor Run check raised.

For other roles:

- `architect` and `ux-ui`: the level crosses the 80.1114(b) demarcation line if its breakwater gap stands for Long Beach's entrance. Decide which rule-set chip the level shows under G6, and whether the ship encounter is tagged International.
- `head-dev`: the four must-fix items change mission geometry and one lesson string. Those changes are game work for the #46 build slice, after this check merges.

This check concerns Chapter 1 game content only. It touches no sea-time rule.
