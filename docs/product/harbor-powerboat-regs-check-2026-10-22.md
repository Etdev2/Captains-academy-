# Harbor powerboat regulation check, 2026-10-22

Claude, acting as `uscg-regs`, checked the lines the powerboat needs for her return to the harbor course (issue #56, part of #46). The check covers the verified Rule 15 crossing line, a new Rule 13 line for when she is overtaking, and the moment an encounter's class is fixed. It replaces nothing in the [harbor traffic check](harbor-traffic-regs-check-2026-10-22.md) and resolves that check's must-fix 4 by its second route: the banner gives a Rule 13 line when she is overtaking. No game code, mission or replay was changed.

The tables hold 8 items, and all 8 are `verified`. The two PR #54 cases are `verified` as well. One new line is ready for stage B. The check also finds two situations the powerboat can reach on routes out of gate 3 for which no checked line exists yet: she can be on the player's port side when risk begins, and she can meet the player nearly head-on. Stage B must not show either checked line in those cases. See "Must fix in stage B". The Coast Guard and the NMC still have the last word.

| Field | Value |
| --- | --- |
| Source of the lines | The powerboat's mission entry and lesson string at PR #54's head `b8784da`, before her removal in `b36b6ff`. The 7df4aec case was read on branch `head-dev/harbor-traffic-course` at `7df4aec` |
| Files read | `missions/long-beach-traffic.json` (the powerboat entry and its `lesson`), `src/game/HarborScene.ts` (the hit banner prints `Hit by the <name>.`, then the lesson, and wraps at `VIEW_W - 380`), `tests/helpers/encounter.ts` (`riskStart`, `sampleAt`), and the replays named below |
| How the geometry was read | Two scratch worktrees, one at `b8784da` and one at `7df4aec`, outside the repository. A throwaway probe ran each replay headless with the sim's own `trace`, and called PR #54's `riskStart` and `sampleAt`. It also measured the player's bearing from the powerboat's bow. The probe and both worktrees were deleted and nothing was committed to either commit's branch |
| Risk of collision in the sim | PR #54's helper: the first frame at which the predicted closest approach is under 12 m within 60 s. Rule 7 gives no number. That threshold is a design choice for `architect`, not rule text |
| Heading convention | As in the harbor traffic check. 0 is north and angles grow clockwise. Relative bearings are measured from the player's bow, positive to starboard |
| International text read | NavCen amalgamated rules page |
| Inland text read | 33 CFR part 83 through Cornell LII's copy of the eCFR text |
| Date checked | 2026-10-22 PT (2026-10-23 UTC) |

## How the sources were used

- This session's shell could not reach `ecfr.gov` or `navcen.uscg.gov`, and eCFR's API refused the web reader under its robots rules. So the text came through a web reader, in short verbatim pieces that were joined back together, and no file was saved or hashed. The Sources table has no SHA-256 column for that reason.
- The Inland paragraphs were read on Cornell LII, which republishes the eCFR text. The words quoted below match the words the harbor traffic check quoted from eCFR wherever both quote the same paragraph, including the "must not cross" of 83.09(d).
- The International paragraphs were read on the NavCen amalgamated page. That page marks no International and Inland difference in Rules 8(d), 13(b), 13(c), 13(d), 16 or 17. The harbor traffic check read the same page, last changed 2024-08-21, and found it matched the Handbook.
- The Handbook was not read again. The harbor traffic check's reading of it, corrected 2024-08-12, stands for every paragraph cited here.
- Rule 15(a) differs in one word. International 15(a) reads "on her own starboard side". LII's Inland 83.15(a) reads "on her starboard side". The duty is the same.

In the tables, "Int" means the International text and "Inland 83.N" means 33 CFR 83.N. A rule number with neither prefix reads the same in both rule sets.

## Sources

| URL | What it is | Version date | Read directly |
| --- | --- | --- | --- |
| https://www.navcen.uscg.gov/navigation-rules-amalgamated | NavCen amalgamated International and Inland rules | Page last changed 2024-08-21 | Yes, Rules 7, 8(d), 13, 15, 16, 17 |
| https://www.law.cornell.edu/cfr/text/33/83.13 | 33 CFR 83.13, Overtaking (Rule 13) | Current eCFR text as republished by LII | Yes, (a) to (d) |
| https://www.law.cornell.edu/cfr/text/33/83.15 | 33 CFR 83.15, Crossing situation (Rule 15) | As above | Yes, (a) |
| https://www.law.cornell.edu/cfr/text/33/83.07 | 33 CFR 83.07, Risk of collision (Rule 7) | As above | Yes, (a), (c), (d)(i) |
| https://www.law.cornell.edu/cfr/text/33/83.08 | 33 CFR 83.08, Action to avoid collision (Rule 8) | As above | Yes, (d), (e) |
| https://www.law.cornell.edu/cfr/text/33/83.09 | 33 CFR 83.09, Narrow channels (Rule 9) | As above | Yes, (d), to compare with the harbor traffic check's eCFR quote |

## The rule text this check rests on

- Rule 13(a), Inland 83.13(a): "Notwithstanding anything contained in Rules 4 through 18 (§§ 83.04 through 83.18), any vessel overtaking any other shall keep out of the way of the vessel being overtaken."
- Rule 13(b): "A vessel shall be deemed to be overtaking when coming up with another vessel from a direction more than 22.5 degrees abaft her beam; that is, in such a position with reference to the vessel she is overtaking, that at night she would be able to see only the sternlight of that vessel but neither of her sidelights."
- Rule 13(c): "When a vessel is in any doubt as to whether she is overtaking another, she shall assume that this is the case and act accordingly."
- Rule 13(d): "Any subsequent alteration of the bearing between the two vessels shall not make the overtaking vessel a crossing vessel within the meaning of these Rules or relieve her of the duty of keeping clear of the overtaken vessel until she is finally past and clear."
- Rule 15(a), Inland 83.15(a): "When two power-driven vessels are crossing so as to involve risk of collision, the vessel which has the other on her starboard side shall keep out of the way and shall, if the circumstances of the case admit, avoid crossing ahead of the other vessel."
- Rule 7(a): "If there is any doubt such risk shall be deemed to exist."
- Rule 8(d): "The effectiveness of the action shall be carefully checked until the other vessel is finally past and clear."
- Rule 17(a)(i): "Where one of two vessels is to keep out of the way, the other shall keep her course and speed."
- Rule 17(b), in part: when the stand-on vessel "finds herself so close that collision cannot be avoided by the action of the give-way vessel alone, she shall take such action as will best aid to avoid collision."

22.5 degrees abaft the beam is 112.5 degrees relative, on either side.

## Summary

| Status | Count |
| --- | --- |
| Items checked | 8 |
| `verified` | 8 |
| `wrong` | 0 |
| `unverified` | 0 |

### Must fix in stage B

1. **No line for the port-side crossing.** On PR #54's 12,376-route sweep, head-dev's handoff reports the powerboat's bearing at the start of risk from -4.2 to 166.1 degrees for her last placement. A negative bearing puts her on the player's port side. Then Rule 15(a) makes her the give-way vessel and the player stands on under Rule 17(a)(i). The Rule 15 line ("so you give way") would be wrong there, and so would the Rule 13 line. Stage B must show neither line when she is forward of the player's port beam at the start of risk. Either the geometry rules that case out with a test, or the banner shows no rule line for it until `uscg-regs` checks one.
2. **No line for a near head-on meeting.** Routes out of gate 3 run on every heading from 270 through north to 090. A player heading near 090 meets her, on 270, nearly end on. Rule 14 may then apply instead of Rule 15. The ferry's verified Rule 14 line exists, but this check did not test the powerboat's geometry against Rule 14(b). The same choice applies as in item 1.

## The two banner lines

| Item | Line | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Rule 15 line, text | "She crossed from your starboard side, so you give way: slow down or pass astern (Rule 15)." | Unchanged from the harbor traffic check, where it is `verified`. It holds only when the encounter's class at the start of risk is a crossing with the powerboat on the player's starboard side, forward of 112.5 degrees. Both vessels are power-driven under Rule 3(b), as that check found | None | `verified` | Rules 3(b), 8(e), 15(a), 16 |
| Rule 15 line, citation | "Rule 15" | Right | Optional, as before: "Rules 15(a), 16" | `verified` | Rules 15(a), 16 |
| Rule 13 line, text | New: "She was overtaking from more than 22.5 degrees abaft your beam, so she had to keep out of your way (Rule 13). Hold course and speed, but act if she can't avoid you alone (Rules 17(a), 17(b))." | "More than 22.5 degrees abaft your beam" is 13(b)'s test, measured from the overtaken vessel, which is the player. "Keep out of your way" is 13(a)'s duty in its own words. "Hold course and speed" is the overtaken vessel's duty under 17(a)(i). "Act if she can't avoid you alone" is 17(b). The line leaves out 17(a)(ii), which permits earlier action and requires none, so leaving it out does not teach anything wrong. The banner shows only after a hit, so 17(b) is the paragraph the player most needs. The line uses "degrees" in words because the banner's font has not been checked for the degree sign. It is 191 characters. The ship's line is 157 and wraps in the same banner, so `ux-ui` checks the wrap (see Open items) | Stage B uses this string exactly | `verified` | Rules 13(a), 13(b), 17(a)(i), 17(b) |
| Rule 13 line, citation | "Rule 13" and "Rules 17(a), 17(b)" | Rule 13 needs no paragraph letters, because (a) and (b) both carry the first sentence and (c) and (d) support it. Rule 17 has four paragraphs and the line uses two | None | `verified` | Rules 13, 17 |

## When an encounter's class is fixed

| Item | Question | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Overtaking is fixed at the start of risk and held | Does an overtaking vessel stay overtaking if the bearing later moves forward of 112.5 degrees? | Yes. 13(d) says no "subsequent alteration of the bearing" makes the overtaking vessel a crossing vessel, and she keeps the duty "until she is finally past and clear". So the sim classifies the encounter when risk begins and holds the class to the end of the encounter | None | `verified` | Rule 13(d) |
| A crossing is fixed at the start of risk and held | Does a crossing become an overtaking if the bearing later moves past 112.5 degrees? | 13(d) speaks only of the overtaking vessel and does not answer this in its own words. The other paragraphs do. 15(a) applies "when two power-driven vessels are crossing so as to involve risk of collision", which ties the crossing to the moment risk exists. 13(b) asks where the overtaking vessel is "coming up" from, which is her approach. 8(d) keeps the give-way vessel checking her action "until the other vessel is finally past and clear". Nothing in Rules 13 to 17 lets the give-way vessel end her duty by her own turn. So holding the crossing class agrees with the text. The NMC question below asks for confirmation | None | `verified` | Rules 8(d), 13(b), 15(a), 16 |
| The 112.5 degree boundary and the doubt case | Which class does a bearing at the line get? | Over 112.5 degrees on either side is overtaking under 13(b). At 112.5 degrees exactly, the sternlight and the sidelight's edge are both in view, which is doubt. 13(c) settles doubt toward overtaking, and it binds the vessel coming up, which is the powerboat. Rule 7(a) settles doubt about risk itself toward risk existing, which moves the start of risk earlier, never later. So stage B classifies a bearing of 112.5 degrees or more, on either side, as overtaking. The sim's integer test must put the tie on the overtaking side | Overtaking when the bearing at the start of risk is 112.5 degrees or more, port or starboard | `verified` | Rules 7(a), 13(b), 13(c) |
| Who measures the bearing | From whose bow? | 13(b) measures from the vessel being overtaken, "abaft her beam". The powerboat is overtaking when she is abaft the player's beam, so the sim uses the powerboat's bearing from the player's bow. The reverse case, the player overtaking the powerboat, is the player's bearing from the powerboat's bow. In every replay below the player stays forward of the powerboat's beam, so that case did not arise | None | `verified` | Rule 13(b) |

## The two cases from PR #54

### The 7df4aec case

Clean replay `long-beach-traffic-docks` at `7df4aec`, run with PR #54's `riskStart` and `sampleAt`. The powerboat runs 270 the whole time.

| Seconds before the closest approach | Frame | Range | Powerboat relative bearing | Player heading | Player from the powerboat's bow |
| --- | --- | --- | --- | --- | --- |
| 20.9 (risk begins) | 3451 | 72.3 m | 64.7 | 350.6 | 34.7 to port |
| 15 | 3803 | 51.0 m | 112.0 | 298.4 | 39.5 to port |
| 10 | 4103 | 39.0 m | 116.1 | 286.3 | 47.6 to port |
| 5 | 4403 | 29.8 m | 100.8 | 287.0 | 62.2 to port |
| 0 (closest approach, no contact) | 4703 | 21.5 m | 8.6 | 341.3 | 100.1 to port |

Finding: when risk begins she is 64.7 degrees on the player's starboard bow, so the encounter is a crossing with the player as the give-way vessel. Her bearing then moves to 112.0 and 116.1 degrees because the player turns to port, from 350.6 to 286.3, while she holds 270. She does not come up from abaft the beam. The player's own turn swings her aft. Under the hold-at-start rule above, the encounter stays a crossing, so a hit in this geometry shows the Rule 15 line. In this replay no hit happens. She passes 21.5 m ahead. That agrees with Rule 15(a)'s "avoid crossing ahead". `verified`. Sources: Rules 8(d), 13(b), 15(a).

This supersedes the harbor traffic check's reading of the same numbers. That check judged the bearing at 15 and 10 seconds before the closest approach and called her overtaking. Judged at the start of risk, which is where 13(b) and 15(a) put it, she is crossing.

### The review's probe

`long-beach-traffic-overtaken-from-gate-3` at `b8784da`, the replay from the first review of PR #54. The powerboat runs 270.

| Seconds before the hit | Frame | Range | Powerboat relative bearing | Player heading | Player from the powerboat's bow |
| --- | --- | --- | --- | --- | --- |
| 31.7 (risk begins) | 4658 | 97.8 m | 134.1 | 305.6 | 10.3 to port |
| 20 | 5358 | 64.7 m | 133.4 | 306.9 | 9.6 to port |
| 10 | 5958 | 36.2 m | 134.7 | 306.9 | 8.4 to port |
| 5 | 6258 | 22.3 m | 136.1 | 306.9 | 7.0 to port |
| 0 (hit) | 6558 | 8.4 m | 142.6 | 306.9 | 0.5 to port |

Finding: when risk begins she is 134.1 degrees relative, 21.6 degrees past the 112.5 line, coming up on the player's starboard quarter. The player is nearly dead ahead of her the whole time. She is the overtaking vessel under 13(b) and keeps out of the way under 13(a). The class holds under 13(d). A hit here shows the Rule 13 line, never the Rule 15 line. `verified`. Sources: Rules 13(a), 13(b), 13(d).

### The other two powerboat replays at `b8784da`

These pin the crossing side for stage B's goldens.

| Replay | Risk begins | Bearing then | What happens | Class |
| --- | --- | --- | --- | --- |
| `long-beach-traffic-hit-by-powerboat` | frame 7143, 90.1 m | 34.0, player on 044.8 | Player holds course and is hit at frame 8225, with her at 97.5 | Crossing from starboard. Rule 15 line |
| `long-beach-traffic-docks` | frame 5362, 81.8 m | 61.3, player on 019.0 | Player stops and she passes ahead, closest 11.2 m. No hit | Crossing from starboard. No banner |

The hold-course hit replay is the Rule 15 golden that #56 asks for. Its bearing passes 97.5 degrees at contact, which is the reason the every-frame check failed. Judged at the start of risk, the class is a crossing.

## Boundary cases for stage B's tests

- The class is decided once, at the frame risk begins, from the powerboat's relative bearing on that frame. It never changes after that (Rules 13(d), 15(a)).
- A bearing of 112.5 degrees or more, port or starboard, is overtaking. A tie goes to overtaking (Rule 13(c)).
- The review's probe gives overtaking at 134.1 degrees and shows the Rule 13 line. It never shows the Rule 15 line.
- The hold-course hit replay gives a crossing at 34.0 degrees and shows the Rule 15 line.
- The 7df4aec geometry, a crossing at 64.7 degrees followed by the player's turn to port, stays a crossing.
- A bearing forward of 112.5 degrees on the port side shows no checked line (must-fix 1).
- A near head-on meeting shows no checked line until checked against Rule 14 (must-fix 2).
- If the sweep comes back, it asserts on every route that the class matches the bearing at the start of risk, and that no route reaches a banner line its class does not match.

The sea-time cases this role normally tests do not apply. This check affects no license and no sea-time entry.

## Open items

Unverified: none of the 8 items.

For the NMC, through `uscg-regs`:

- Does the NMC agree that a crossing is fixed when risk of collision begins, so that a give-way vessel's own later turn does not make the stand-on vessel an overtaking vessel? 13(d) states the hold for overtaking only.
- The NMC question from the Night Harbor Run check, on a power-driven vessel meeting a vessel under oars, is still open.

For other roles:

- `architect`: the sim's start of risk is PR #54's 12 m in 60 s threshold. Stage B fixes the class on that frame. Whether that threshold stays, and where the class lives in sim state, is the stage B boundary the #56 prompt asks `architect` to record.
- `head-dev`: must-fix 1 and 2 above decide whether stage B needs geometry tests that rule out the port-side and head-on cases, or a banner that shows no rule line for them.
- `ux-ui`: the Rule 13 line is the longest banner line so far. Check that it wraps cleanly on a phone.

This check concerns Chapter 1 game content only. It touches no sea-time rule.
