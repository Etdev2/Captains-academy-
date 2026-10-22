# Night Harbor Run regulation check, 2026-10-22

Lantern Halyard, a subagent of Bight Halyard acting as `uscg-regs`, checked the Night Harbor Run prototype against the printed Navigation Rules on 2026-10-22 for issue #45. This file replaces the first pass written earlier the same day by Sheave Halyard. That pass had no rule text to read, so it marked 165 of its 190 items `unverified`. This pass read the governing paragraph for every item, and every row now says `verified` or `wrong`.

The check covers every question, keyed answer, wrong option, explanation, rule citation, spoken phrase and horn pattern in the 15 gates. It also covers the Rule 21 arc constants, the light positions the renderer uses, and the start-screen copy. No game code was changed and no file in the repository was edited.

| Field | Value |
| --- | --- |
| File checked | `for-engineer/night-harbor-run/night-harbor-run.html` in the zip Et supplied |
| SHA-256 | `b0f14e5beee0f8d9bd0325c1278c655b1da98194047561394d4f50b267b64d73` (matched before reading) |
| How it was read | As data. The file was not run. Encounter data is lines 264 to 367, vessel types 234 to 253, spawn specs 371 to 386, arc logic 212 to 231, horn playback 439 to 470, renderer 750 to 800, start screen 155 to 175 |
| Rule set in the prototype | International (COLREGS 1972, as amended) for the whole lap |
| International text read | Coast Guard Navigation Rules and Regulations Handbook, corrected 2024-08-12, and the NavCen amalgamated rules page, last changed 2024-08-21 |
| Inland text read | eCFR 33 CFR parts 83, 84 and 88, version of 2026-10-19, and part 80 for the demarcation lines |
| Date checked | 2026-10-22 |

## How the sources were used

- The International rules are not in the CFR. This check read them in two Coast Guard printings. The Handbook is the "Navigation Rules book" that decision G10 names. The NavCen page is the Coast Guard's web amalgamation of both rule sets. Every International paragraph behind a `wrong` row, a must-fix item or a judgment call was read in both, and the two agree apart from layout.
- The NavCen page marks International-only words with single angle brackets and Inland-only words with double angle brackets in italics. It puts paragraphs that differ side by side in a double-line frame. Braces mark Coast Guard notes. The page says it was last changed on 08/21/2024, prints the rules "as amended June 12th, 2023", and disclaims any guarantee of its own accuracy. It has typos that touch no finding: International Rule 34(a) reads "When vessels are in sight of one," and "One short blasts", and International Rule 24(g)(i) is missing. The Handbook has the correct wording in both places.
- The Inland rules were read in eCFR. The eCFR version list shows part 83 was last amended on 2022-09-06, and title 33 is up to date as of 2026-10-20.
- The 2004 `navrules.pdf` was not used.
- The first pass's web-search leads are dropped. None of them is cited here.
- Not read: the IMO's own text of the COLREGS, and the 1977 proclamation at 42 FR 17112. The U.S. Code at 33 U.S.C. 1602 says the proclamation carries the regulations but does not print them. The Handbook's record of changes lists IMO amendments through resolution A.1085(28) of 2013-12-04. This check did not confirm that no later IMO amendment has entered into force. See Open items.

In the tables, "Int" means the International text and "Inland 83.N" means 33 CFR 83.N. A rule number with neither prefix reads the same in both rule sets. Each Source cell names the paragraphs read on 2026-10-22, plus prototype line numbers where the finding rests on the code.

## Sources

| URL | What it is | Version date | SHA-256 | Read directly |
| --- | --- | --- | --- | --- |
| https://navcen.uscg.gov/sites/default/files/pdf/navRules/Handbook/Nav%20Rules%20Handbook_Corrected_08-12-2024.pdf (the `www.navcen.uscg.gov` link on the NavCen page answers with a 301 to this host) | Navigation Rules and Regulations Handbook, International and Inland side by side, 202 pages | Corrected 2024-08-12 (PDF modified 2024-08-12 19:18 UTC) | `dcc7eb6d279be614a4fd4e18cbea6bbf55b44f0322ba0a0a07f2f0265dd633e2` | Yes |
| https://www.navcen.uscg.gov/navigation-rules-amalgamated | NavCen amalgamated International and Inland rules and annexes, fetched 2026-10-22 by the caller | Page last changed 2024-08-21 | `7fec3b88df084a52b6c7589f630beb3ff29ac3bcababd8eac9c15350d6f928d0` | Yes |
| https://www.ecfr.gov/api/versioner/v1/full/2026-10-19/title-33.xml?part=83 | eCFR 33 CFR part 83, Inland Rules 1 to 38, fetched 2026-10-22 by the caller | 2026-10-19 | `0f25e0a75accf2c84e51f61fe49642a51381a019794f28b1783b0abba7c3b228` | Yes |
| https://www.ecfr.gov/api/versioner/v1/full/2026-10-19/title-33.xml?part=84 | eCFR 33 CFR part 84, Inland Annex I. Two attempts returned 503, the third returned 200 | 2026-10-19 | `78370dca12b7a3c23907b290542a6001c9f2874f4baacc11a79bcca4028d7d75` | Yes |
| https://www.ecfr.gov/api/versioner/v1/full/2026-10-19/title-33.xml?part=88 | eCFR 33 CFR part 88, Inland Annex V. Same retry history | 2026-10-19 | `cc97c136ef89c973fa3fbc2ed4c299725dbaa1a6ea3396b6bf5206512bb347f0` | Yes |
| https://www.ecfr.gov/api/versioner/v1/full/2026-10-19/title-33.xml?part=80 | eCFR 33 CFR part 80, COLREGS demarcation lines. Three attempts returned 503, the fourth returned 200 | 2026-10-19 | `b130a4a0b68b155293cb62d72ae604fc9923e479bc616a2352b2c5c658a37b7d` | Yes, sections 80.01 and 80.1114 |
| https://www.ecfr.gov/api/versioner/v1/versions/title-33.json?part=83 | eCFR amendment history for part 83 | Latest entry 2022-09-06 | `afc6452785c4df3f1b840f62f2eec3b3f8363b22c2521f406cab77231518e7a1` | Yes |
| https://www.ecfr.gov/api/versioner/v1/titles.json | eCFR title status | Title 33 up to date as of 2026-10-20 | `356d9b079cba906e089d1001d773ab40680664ef70174a0fc0a74553df5d8256` | Yes |
| https://www.govinfo.gov/content/pkg/USCODE-2024-title33/html/USCODE-2024-title33-chap30-sec1602.htm (reached through https://www.govinfo.gov/link/uscode/33/1602?link-type=html) | 33 U.S.C. 1602 and its notes. Confirms the regulations take effect by proclamation; does not print them | 2024 edition | `c913bef84a305dfb7e9e5d3af9cf09c3b3db4175cec9257f0dbadb2a5f7a79ab` | Yes |
| https://www.govinfo.gov/content/pkg/USCODE-2024-title33/html/USCODE-2024-title33-chap34-sec1602.htm and the 2023 equivalent | Wrong chapter in the URL. GovInfo redirected to its error page | Not applicable | Not kept | No |
| `navrules.pdf` supplied by the caller | Navigation Rules, 2004 edition | 2004 | `faa5875b91f3fbc727633ef711243ccd188f5384c6b1114bf1f757a3007b655d` | No, not current |

## Summary

| Status | This pass | First pass |
| --- | --- | --- |
| Items checked | 190 | 190 |
| `verified` | 167 | 1 |
| `wrong` | 23 | 24 |
| `unverified` | 0 | 165 |

The 190 items are the same set the first pass counted. The 18 quizzed encounters have 41 question steps, with four items each: the answer with its wrong options, the explanation, the citation and the spoken phrase. That makes 164. Then come 6 horn patterns, 11 arc and geometry items, 4 start-screen items and the 5 corrections from the session before the first pass.

Against the first pass:

- 179 rows confirmed. The status became `verified` or stayed `wrong` for the reason the first pass gave.
- 6 rows corrected. The status stands, but the first pass's citation, reasoning or priority changes:
  - Gate 1 Q3 citation and gate 2 Q3 citation. The first pass suggested "Rule 34(a)(i)". International Rule 34(a) has no subparagraph (i); only Inland 83.34(a) does. Keep "Rule 34(a)".
  - Gate 6 Q1 phrase. Still `wrong`, with the alternatives now cited exactly (Int 23(d)(ii) for a power-driven vessel under 7 m whose maximum speed does not exceed 7 knots). It moves from should-fix to must-fix.
  - Gate 8 pilot Q2 phrase. Still `verified`, but the first pass said "The Rules never use 'right of way'". The International text does not. The Inland text does, in 83.09(a)(ii) and 83.14(d).
  - Gate 9 pushing Q1 answer. Still `wrong`. The first pass thought depth might tell the two tows apart. The renderer draws no depth (lines 756 to 761), so the stem cannot be answered. It moves to must-fix.
  - Gate 10 Q1 explanation. Still `wrong`, but the governing paragraph is Rule 20(c), not 20(b).
- 5 rows overturned:
  - Gate 6 Q2 explanation, `wrong` to `verified`. Nothing in it conflicts with the text, and Rule 2(b) names "the limitations of the vessels involved".
  - Gate 6 Q2 citation, `wrong` to `verified`. Rules 6 and 8 do support "slow down and pass well clear". A fuller citation is optional.
  - Gate 11 Q2 citation, `wrong` to `verified`. Rule 2 carries the duty, and 30(d) is how the player knows she is aground. A fuller citation is optional.
  - Gate 8 seaplane Q1 explanation, no defect to `wrong`. It describes wingtip sidelights the code does not show at this aspect.
  - Gate 15 Q2 phrase, no defect to `wrong`. It repeats the explanation's mix-up of Rule 19(d) and 19(e).

The Inland-differences table, which is outside the 190, had three rows that pointed at the wrong paragraph and one closing sentence that was wrong. See that section.

This check touches no sea-time rule and releases no license in the sea-time log.

### Must fix before any port

1. Gate 4, first question. A lone white light also fits "A small vessel at anchor" (Rule 30(b): a vessel under 50 m "may exhibit an all-round white light where it can best be seen") and "A vessel under oars" (Rule 25(d)(ii), a torch or lantern). The stem has to rule them out, for example "Radar shows her moving the same way as you, slower."
2. Gate 15, first question. Int 35(d) makes "a vessel engaged in fishing, when at anchor, and a vessel restricted in her ability to maneuver when carrying out her work at anchor" sound the 35(c) signal, so "A vessel at anchor" is also a possible answer. The keyed answer also leaves out "pushing", which 35(c) lists.
3. Gate 15, second question, explanation and phrase. Rule 19(e) is the hearing rule: least speed to keep course, all way off if necessary, extreme caution. The limit on turning to port is Rule 19(d)(i), and it applies to a vessel "which detects by radar alone the presence of another vessel". The game has a radar that shows contacts within 1,500 m (line 836), so 19(d) does apply, and the explanation must say she is on radar.
4. Gate 3, third question, explanation and citation. Rule 17(a)(ii) says the stand-on vessel "may" act alone once it is apparent the give-way vessel is not acting. Rule 17(b) says she "shall" act only when "so close that collision cannot be avoided by the action of the give-way vessel alone". Rule 17(c) says a power-driven vessel acting under 17(a)(ii) in a crossing "shall, if the circumstances of the case admit, not alter course to port for a vessel on her own port side". That is this gate.
5. Gate 6, first question, explanation and phrase. The explanation reverses Rule 25(d)(ii). The phrase teaches that a lone low white light is a rowboat, which Rules 30(b), 25(d)(i) and Int 23(d)(ii) contradict, and which gate 4 contradicts too.
6. Gate 8, the seaplane. The first question asks the player to identify her by "sidelights very far apart". At this spawn the code shows only her green sidelight and masthead light, the same lights as gate 3's power-driven vessel, and "Power-driven vessel under 50 m" is one of the wrong options. Rule 31 gives no light pattern to identify her by. The second explanation and the phrase drop "in general" from Rule 18(e). See judgment call 2.
7. Gate 9, not under command, phrase. "Everyone keeps clear" is not Rule 18. Rule 18(a)(i), (b)(i) and (c)(i) bind power-driven, sailing and fishing vessels. No paragraph binds a vessel restricted in her ability to maneuver, and Rules 9, 10 and 13 come first.
8. Gate 9, pushing ahead, first question. Seen from ahead, a vessel towing astern with a tow under 200 m also shows two masthead lights in a vertical line and two pairs of sidelights (Rules 24(a)(i), 24(a)(ii), 24(e)(i)). The renderer projects every light of a vessel at one scale with no depth (lines 756 to 761), so the barge's sidelights cannot appear "ahead". Either add a cue the player can see, or replace the option.
9. Gate 13, second question, citation. "Keep to your starboard side of the channel" is Rule 9(a). The citation leaves it out and cites 9(b), which applies only to "a vessel of less than 20 meters in length or a sailing vessel".
10. Start screen, own vessel. The game never says what the player's boat is. Rules 14(a), 15(a), 17(c), 18(a), Int 34(a) and 35(a) apply to a power-driven vessel, and 9(b) to a vessel under 20 m. Several keyed answers depend on it. State it, for example "You are driving a power-driven vessel under 20 m."

Item 8 is new, and item 5 now covers the phrase but not the second question.

### Should fix

- Gates 2 and 11 say "50 m or more". Rule 23(a)(ii) lets a power-driven vessel under 50 m carry a second masthead light. Rule 30(a) requires two anchor lights at any length, and 30(b) only allows a vessel under 50 m to show one instead. Write "probably 50 m or more".
- Gate 10, first explanation. "By day, shapes replace lights" conflicts with Rule 20(c): lights "shall, if carried, also be exhibited from sunrise to sunset in restricted visibility and may be exhibited in all other circumstances when it is deemed necessary."
- Gate 14, third phrase. "I will overtake" is not the signal's meaning. Int 34(c)(i) says "I intend to overtake you on your port side", and the overtaken vessel agrees under 34(c)(ii).
- The gillnetter's gear light sits 7 m to port of her red and white lights (line 240). Annex I section 4(a), in both rule sets, sets "not less than 2 meters and not more than 6 meters".
- The eyebrow says "Rules 20 to 31" (the prototype prints an en dash). The lap also tests Rules 2, 3, 6 to 9, 13 to 19, 32, 34 and 35.
- The prolonged blast is 4 s, the bottom of Rule 32(c)'s "four to six seconds". With the 0.06 s ramp and 0.1 s fade (lines 461 to 462), full volume lasts about 3.84 s. Use 5 s.
- Several vessels sit below Annex I light heights. None changes an answer. See "Renderer geometry against Annex I".

### Optional wording

These rows are `verified`. A change would make them tighter, not correct an error: gate 1 Q1 explanation ("or nearly at you"); gate 2 Q1 explanation (a steady bearing, for Rule 15's risk of collision); gate 4 Q2 citation (add 13(d)); gate 5 Q2 phrase ("In open water"); gate 6 Q1 stem; gate 6 Q2 explanation and citation (judgment call 1); gate 7 trawler phrase; gate 8 pilot phrase; gate 11 Q2 citation; gate 13 Q1 explanation ("which she may show"); gate 13 Q2 explanation; gate 14 Q1 phrase; gate 14 Q2 citation; gate 14 Q3 explanation (the 9(e)(i) condition); gate 15 Q1 explanation and citation; gate 15 Q3 phrase.

## Gate by gate

### Gate 1, power-driven vessel head-on

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Power-driven vessel under 50 m, head-on". Others: seen from astern, sailing head-on, at anchor | One masthead light over both sidelights. A vessel of 50 m or more must carry the second masthead light, so one light fits "under 50 m". No wrong option fits: a sternlight alone, sidelights without a masthead light, and all-round whites without sidelights all look different | None | `verified` | Rules 21(a), 21(b), 23(a), 25(a), 30(a) |
| Q1 explanation | "One white masthead light above both sidelights. You see red and green together only when she points straight at you." | Close. Rule 14(b) says "ahead or nearly ahead". Annex I lets sidelights fade to cut-off "between 1 and 3 degrees outside the prescribed sectors", so both show when she points at you or nearly so | Optional: "...only when she points at you or nearly at you." | `verified` | Rule 14(b); Annex I section 9(a)(i), Inland 84.15(a)(i) |
| Q1 citation | "Rules 21, 23(a)" | Right | Optional: "Rules 21(a), 21(b), 23(a)" | `verified` | Rules 21, 23(a) |
| Q1 phrase | "White over red and green: a power vessel, head on." | Matches | None | `verified` | Rules 21, 23(a), 14(b) |
| Q2 answer and options | "Alter course to starboard". Others: to port, hold course and speed, stop and wait | Rule 14(a): "each shall alter her course to starboard so that each shall pass on the port side of the other". It applies to two power-driven vessels, which the game never says the player is (must-fix 10) | None | `verified` | Rule 14(a) |
| Q2 explanation | "In a head-on situation both vessels alter course to starboard and pass port to port." | Matches. Inland 83.14(a) adds "Unless otherwise agreed" | None for International | `verified` | Int 14(a), Inland 83.14(a) |
| Q2 citation | "Rule 14(a)" | Right | None | `verified` | Rule 14(a) |
| Q2 phrase | "Head on. Both turn to starboard." | Matches | None | `verified` | Rule 14(a) |
| Q3 answer and options | "One short blast". Others: two short, three short, one prolonged | Int 34(a): "When vessels are in sight of one another, a power-driven vessel underway, when maneuvering as authorized or required by these Rules, shall indicate that maneuver" by one short blast for a turn to starboard. Two short is a turn to port, three short is astern propulsion, one prolonged is the bend signal of 34(e) | None | `verified` | Int 34(a), 34(e) |
| Q3 explanation | "One short blast means: I am altering my course to starboard." | Word for word Int 34(a) | None for International | `verified` | Int 34(a) |
| Q3 citation | "Rule 34(a)" | Right. Corrected from the first pass, which suggested "34(a)(i)". International 34(a) has no (i) | None | `verified` | Int 34(a) |
| Q3 phrase | "One short blast. I am altering my course to starboard." | Matches | None | `verified` | Int 34(a) |
| Q3 horn | `S` | One blast of 1 s, which is "about one second" | None | `verified` | Rules 32(b), 34(a); line 440 |

### Gate 2, large power-driven vessel crossing from starboard

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Power-driven vessel 50 m or more, crossing from your starboard". Others: two small vessels in line, under 50 m head-on, towing with tow under 200 m | Two masthead lights do not prove 50 m. Rule 23(a)(ii): a vessel under 50 m "shall not be obliged to exhibit such light but may do so". The towing option is ruled out because her masthead lights are 50 m apart fore and aft and seen at aspect -55°, so they separate on screen instead of standing in a vertical line | "Power-driven vessel, probably 50 m or more, crossing from your starboard" | `wrong` | Rules 23(a)(ii), 24(a)(i); lines 236, 373 |
| Q1 explanation | Two masthead lights, the after one higher, and her red sidelight; she crosses from your right; the offset lights show her heading | Matches Rule 23(a)(ii), "abaft of and higher than the forward one", and Rule 21(b) | Optional, for Q2: add "and her bearing is steady". Rule 15(a) applies only when crossing "so as to involve risk of collision", and Rule 7(d)(i) ties that to a steady bearing | `verified` | Rules 7(d)(i), 15(a), 21(b), 23(a)(ii) |
| Q1 citation | "Rules 21, 23(a)(ii)" | Right | None | `verified` | Rules 21, 23(a)(ii) |
| Q1 phrase | "Two masthead lights and red: a big ship crossing from your right." | Acceptable. "Big" makes no length claim | None | `verified` | Rule 23(a)(ii) |
| Q2 answer and options | "Give way: turn to starboard and pass astern of her". Others: stand on, turn to port and cross ahead, speed up to cross ahead | Rule 15(a): the vessel with the other on her own starboard side "shall keep out of the way and shall, if the circumstances of the case admit, avoid crossing ahead of the other vessel". Each wrong option breaks that or Rule 16 | None | `verified` | Rules 15(a), 16 |
| Q2 explanation | She has you on her port side, so you give way; act early; avoid crossing ahead | Matches. Rule 16 says "early and substantial action to keep well clear" | None | `verified` | Rules 15(a), 16 |
| Q2 citation | "Rules 15, 16" | Right | None | `verified` | Rules 15, 16 |
| Q2 phrase | "If to starboard red appear, it is your duty to keep clear." | Matches Rule 15(a) for two power-driven vessels | None | `verified` | Rule 15(a) |
| Q3 answer and options | "One short blast". Others: two short, five short, "No signal in sight of her" | Int 34(a) applies whenever vessels are in sight of one another. Inland 83.34(a) applies only "at a distance within half a mile", so "No signal" could be right under Inland | None for International | `verified` | Int 34(a), Inland 83.34(a) |
| Q3 explanation | "Altering course to starboard in sight of another vessel: one short blast." | Matches Int 34(a) | None | `verified` | Int 34(a) |
| Q3 citation | "Rule 34(a)" | Right. Corrected from the first pass's "34(a)(i)", which does not exist in the International text | None | `verified` | Int 34(a) |
| Q3 phrase | "One short blast." | Matches | None | `verified` | Int 34(a) |
| Q3 horn | `S` | Right | None | `verified` | Rules 32(b), 34(a) |

### Gate 3, power-driven vessel crossing from port

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Power-driven vessel under 50 m, crossing from your port". Others: sailing vessel from port, pilot vessel, at anchor | Right. A sailing vessel shows no masthead light, a pilot vessel shows white over red all-round, and an anchored vessel shows all-round whites with no sidelights | None | `verified` | Rules 21, 23(a), 25(a), 29(a)(i), 30(a) |
| Q1 explanation | Masthead light and green sidelight; she crosses from your left | Matches | None | `verified` | Rules 21(a), 21(b) |
| Q1 citation | "Rules 21, 23(a)" | Right | None | `verified` | Rules 21, 23(a) |
| Q1 phrase | "Masthead and green: crossing from your left." | Matches | None | `verified` | Rule 21(b) |
| Q2 answer and options | "Stand on: hold course and speed". Others: give way hard to starboard, turn to port toward her, stop engines | Rule 17(a)(i): "the other shall keep her course and speed". Stopping breaks that at this stage | None | `verified` | Rules 15(a), 17(a)(i) |
| Q2 explanation | She has you on her starboard side, so she gives way; you keep course and speed and watch her | Matches | None | `verified` | Rules 15(a), 17(a)(i) |
| Q2 citation | "Rules 15, 17(a)" | Right | Optional: "Rules 15, 17(a)(i)" | `verified` | Rules 15, 17(a) |
| Q2 phrase | "Green on your left: she keeps clear. You stand on." | Matches | None | `verified` | Rules 15(a), 17(a)(i) |
| Q3 answer and options | "Five or more short, rapid blasts". Others: one prolonged, two short, three short | Rule 34(d): "at least five short and rapid blasts". "Five or more" means the same | None | `verified` | Rule 34(d) |
| Q3 explanation | "Five short blasts says you doubt she is taking enough action. If she still does nothing, you must act to avoid collision yourself." | Merges two duties. Rule 17(a)(ii) says the stand-on vessel "may" act alone "as soon as it becomes apparent" the other is not acting. Rule 17(b) says she "shall" act only when "so close that collision cannot be avoided by the action of the give-way vessel alone". It also leaves out Rule 17(c): when she acts in a crossing under 17(a)(ii), a power-driven vessel shall if possible "not alter course to port for a vessel on her own port side". She is on your port side | "Five short says you doubt she is doing enough. Once it is clear she is not acting, you may maneuver to avoid her, but not to port for a vessel on your port side. If she gets so close that her action alone cannot avoid collision, you must act." | `wrong` | Rules 17(a)(ii), 17(b), 17(c) |
| Q3 citation | "Rules 34(d), 17(b)" | Leaves out the paragraphs the situation turns on | "Rules 34(d), 17(a)(ii), 17(b), 17(c)" | `wrong` | Rules 17, 34(d) |
| Q3 phrase | "Five short blasts. I doubt your intentions." | Matches Rule 34(d), which covers failing "to understand the intentions" and doubt "whether sufficient action is being taken" | None | `verified` | Rule 34(d) |
| Q3 horn | `SSSSS` | Five 1 s blasts with 1 s gaps. Right, and it applies to vessels in sight approaching each other | None | `verified` | Rules 32(b), 34(d); line 440 |

### Gate 4, overtaking a power-driven vessel

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | Stem "Only one white light shows ahead, and you are closing on it slowly." Keyed sternlight. Others include "A small vessel at anchor" and "A vessel under oars" | Two wrong options also fit. Rule 30(b): a vessel under 50 m at anchor "may exhibit an all-round white light where it can best be seen". Rule 25(d)(ii): a vessel under oars shows a white torch or lantern. Int 23(d)(ii) and 25(d)(i) add more lone white lights. Closing slowly does not rule out a stationary light when the player is slow | Make the stem rule them out, for example "Radar shows her moving the same way as you, slower." Or ask "What could it be?" and key an answer that names all three | `wrong` | Rules 21(c), 25(d), 30(b), Int 23(d)(ii) |
| Q1 explanation | Sternlight shows over 135°; seeing it alone puts you more than 22.5° abaft her beam | Matches Rule 21(c), "67.5 degrees from right aft on each side", and Rule 13(b) | None | `verified` | Rules 13(b), 21(c) |
| Q1 citation | "Rules 21(c), 13(b)" | Right | None | `verified` | Rules 13(b), 21(c) |
| Q1 phrase | "Only her sternlight: you are overtaking." | Matches Rule 13(b), "able to see only the sternlight of that vessel but neither of her sidelights", once the stem is fixed | None | `verified` | Rule 13(b) |
| Q2 answer and options | "Keep out of her way until you are past and clear". Others: she gives way, hold course, pass close and sound five short | Right | None | `verified` | Rules 13(a), 13(d) |
| Q2 explanation | The overtaking vessel keeps out of the way "whatever kind either one is" | Matches Rule 13(a), "Notwithstanding anything contained in Rules 4-18, any vessel overtaking any other" | None | `verified` | Rule 13(a) |
| Q2 citation | "Rule 13(a)" | Right. "Past and clear" is 13(d) | Optional: "Rules 13(a), 13(d)" | `verified` | Rule 13 |
| Q2 phrase | "Overtaking? You keep clear." | Matches | None | `verified` | Rule 13(a) |

### Gate 5, sailing vessel

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Sailing vessel, crossing from your starboard". Others: fishing not trawling, not under command, pilot vessel | Right. Red over green all-round with no masthead light is Rule 25(c). The others are red over white, red over red and white over red | None | `verified` | Rules 25(a), 25(c), 26(c)(i), 27(a)(i), 29(a)(i) |
| Q1 explanation | Red over green is her optional signal; no white masthead light | Matches Rule 25(c), "may". Rule 25(c) also says these lights "shall not be exhibited in conjunction with the combined lantern" | Optional: "...and never with a combined lantern." | `verified` | Rules 25(b), 25(c) |
| Q1 citation | "Rules 25(a), 25(c)" | Right | None | `verified` | Rule 25 |
| Q1 phrase | "Red over green, sailing machine." | Matches | None | `verified` | Rule 25(c) |
| Q2 answer and options | "Keep out of her way: you are power-driven, she is sailing". Others: stand on, hold course, turn to port across her bow | Right in open water | None | `verified` | Rule 18(a)(iv) |
| Q2 explanation | "A power-driven vessel under way keeps out of the way of a sailing vessel." | Matches Rule 18(a)(iv). Rule 18 opens "Except where Rules 9, 10, and 13 otherwise require" | None | `verified` | Rule 18 |
| Q2 citation | "Rule 18(a)(iv)" | Right | None | `verified` | Rule 18(a)(iv) |
| Q2 phrase | "Power gives way to sail." | Holds in open water. In a narrow channel Rule 9(b) says a sailing vessel "shall not impede", and an overtaking sailing vessel keeps clear under 13(a) | Optional: "In open water, power gives way to sail." | `verified` | Rules 9(b), 13(a), 18 |

### Gate 6, vessel under oars

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | Stem "A white light flicks on, low on the water, close ahead." Keyed "A small boat under oars showing a torch". Others: sailing vessel seen from astern, aground, pilot | Best answer. "Flicks on" is the only cue against the sternlight option, since a sternlight is fixed. A sailing vessel under 7 m may also use a torch (Rule 25(d)(i)), but no option says so. The code shows the torch only inside 380 m (lines 238, 795) | None. Keep "flicks on" if the stem is reworded | `verified` | Rules 21(c), 25(d), 27(a), 29(a), 30(d) |
| Q1 explanation | "A vessel under oars may show a hand torch or lantern, shown in time to prevent collision, instead of sidelights." | Reverses the rule. Rule 25(d)(ii): she "may exhibit the lights prescribed in this rule for sailing vessels, but if she does not, she shall have ready at hand an electric torch or lighted lantern showing a white light which shall be exhibited in sufficient time to prevent collision". The torch is required when she shows no sailing lights. It does not replace sidelights alone | "A vessel under oars may show a sailing vessel's lights. If she does not, she must have a white torch or lantern ready and show it in time to prevent collision." | `wrong` | Int 25(d)(ii) |
| Q1 citation | "Rule 25(d)" | Right | Optional: "Rule 25(d)(ii)" | `verified` | Rule 25(d) |
| Q1 phrase | "A lone low white light: a small boat under oars." | Teaches a false identification rule. A lone white light can also be a vessel under 50 m at anchor (30(b)), a sailing vessel under 7 m with a torch (25(d)(i)), a power-driven vessel under 7 m whose maximum speed does not exceed 7 knots (Int 23(d)(ii)), or a sternlight, which is gate 4's keyed answer. Corrected from the first pass, which did not cite 23(d)(ii), and moved to must-fix | "A torch flicks on, low and close: a small boat, maybe under oars." | `wrong` | Rules 21(c), 25(d), 30(b), Int 23(d)(ii) |
| Q2 answer and options | "Slow down and pass well clear of her". Others: hold course, she must keep clear; pass close to see what she is; sound three short | Right. See judgment call 1 | None | `verified` | Rules 2, 7, 8, 16 to 18 |
| Q2 explanation | "A rowing boat cannot get out of your way quickly. Take early, obvious action and slow down." | Overturned. Nothing here conflicts with the text, and it claims no right of way. Rule 2(b) says due regard shall be had to special circumstances, "including the limitations of the vessels involved". Rule 8(a) asks for action that is "positive, made in ample time", and 8(e) for slackening speed. A fuller explanation is optional | Optional, see judgment call 1 | `verified` | Rules 2(b), 8(a), 8(b), 8(e) |
| Q2 citation | "Rules 6, 8" | Overturned. Rule 6 (safe speed) and Rule 8(d), 8(e) support the answer | Optional: "Rules 2(b), 6, 7, 8(d), 8(e)" | `verified` | Rules 6, 8 |
| Q2 phrase | "Slow down. Give the rowboat room." | Matches, and claims no right of way | None | `verified` | Rule 8 |

### Gate 7, vessel trawling

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Vessel trawling, making way". Others: fishing not trawling, pilot, restricted | Right | None | `verified` | Rules 26(b), 26(c)(i), 27(b)(i), 29(a)(i) |
| Q1 explanation | Green over white all-round is trawling; her sidelight shows she is making way | Matches Rule 26(b)(i) and (iii). At 35 m the after masthead light is optional under 26(b)(ii) | None | `verified` | Rule 26(b) |
| Q1 citation | "Rule 26(b)" | Right | None | `verified` | Rule 26(b) |
| Q1 phrase | "Green over white, trawling tonight." | Matches | None | `verified` | Rule 26(b)(i) |
| Q2 answer and options | "Keep out of her way and clear of her gear". Others: stand on, pass close astern over her net, cross ahead and sound two short | Right | None | `verified` | Rule 18(a)(iii) |
| Q2 explanation | Power-driven keeps out of the way of a vessel engaged in fishing and well clear of the trawl | Matches Rule 18(a)(iii) | None | `verified` | Rule 18(a)(iii) |
| Q2 citation | "Rule 18(a)(iii)" | Right | None | `verified` | Rule 18(a)(iii) |
| Q2 phrase | "Fishing boats stand on. Keep clear of the net." | Holds for this gate. Rule 17(a)(i) makes her keep course and speed when 18(a)(iii) puts the duty on you. But status comes from "engaged in fishing" (Rule 3(d)), not from being a fishing boat, and she "shall not impede" in a narrow channel or traffic lane (9(c), 10(i)) | Optional: "Keep clear of a boat engaged in fishing, and her net." | `verified` | Rules 3(d), 9(c), 10(i), 17(a)(i), 18(a)(iii) |

### Gate 7, fishing vessel with gear out

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Fishing, not trawling, gear out over 150 m, not making way". Others: trawling, pilot at anchor, aground | Right | None | `verified` | Rule 26(c) |
| Q1 explanation | Red over white; a lower white light to one side points toward her gear; no sidelights, so not making way | Matches Rule 26(c)(i), (ii) "in the direction of the gear", and (iii) | None | `verified` | Rule 26(c) |
| Q1 citation | "Rule 26(c)" | Right | None | `verified` | Rule 26(c) |
| Q1 phrase | "Red over white, fishing tonight." | Matches | None | `verified` | Rule 26(c)(i) |
| Q2 answer and options | "The side away from the extra white light". Others: between her and the light, either side close aboard, hold course | Right | None | `verified` | Rule 26(c)(ii) |
| Q2 explanation | The extra light shows gear reaching more than 150 m; stay off that side | Matches Rule 26(c)(ii), "outlying gear extending more than 150 meters horizontally" | None | `verified` | Rule 26(c)(ii) |
| Q2 citation | "Rule 26(c)(ii)" | Right | None | `verified` | Rule 26(c)(ii) |
| Q2 phrase | "Stay off the side of the gear light." | Matches | None | `verified` | Rule 26(c)(ii) |

The gear light's position is checked under "Arc, geometry and horn checks".

### Gate 8, pilot vessel on duty

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Pilot vessel on duty, under way". Others: fishing not trawling, aground, restricted | Right | None | `verified` | Rule 29(a) |
| Q1 explanation | White over red at the masthead; green sidelight, crossing from your port | Matches Rule 29(a)(i) and (ii) | None | `verified` | Rule 29(a) |
| Q1 citation | "Rule 29(a)" | Right | None | `verified` | Rule 29(a) |
| Q1 phrase | "White over red, pilot ahead." | Matches | None | `verified` | Rule 29(a)(i) |
| Q2 answer and options | "Stand on: she is crossing from your port side". Others: give way because pilots have right of way, turn to port, stop and wait | Right. Rule 18 names no pilot vessel. Rule 15(a) makes her give way and 17(a)(i) makes you stand on | None | `verified` | Rules 15(a), 17(a)(i), 18 |
| Q2 explanation | No special place in Rule 18; the crossing rule applies; expect her to maneuver | Matches | None | `verified` | Rules 15, 18 |
| Q2 citation | "Rules 15, 17, 29" | Right | None | `verified` | Rules 15, 17, 29 |
| Q2 phrase | "A pilot boat has no special right of way." | Matches. Corrected reasoning: the first pass said the Rules never use "right of way". The International text does not. The Inland text does, in 83.09(a)(ii) and 83.14(d), and Inland Annex V 88.07 says "precedence or right of way". Whether to keep the phrase is a `ceo` wording call | Optional: "A pilot boat gets no special rank." | `verified` | Rule 18; Inland 83.09(a)(ii), 83.14(d), 88.07(a) |

### Gate 8, seaplane on the water

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | Stem "Sidelights very far apart, low on the water." Keyed seaplane. Others include "Power-driven vessel under 50 m" | The stem describes lights the player cannot see. She spawns at aspect +40° (line 379), where `arcVisible` shows only her green sidelight and masthead light (lines 221 to 229, 242). A run of the approach with the player holding the leg heading at 3 to 13 m/s gives aspect 31° to 66° at the 270 m trigger, still one sidelight. Those are the lights of gate 3's power-driven vessel, so "Power-driven vessel under 50 m" fits what the player sees. Rule 31 gives a seaplane no pattern of her own | Name her in the stem and ask only what to do, for example "A seaplane is taxiing on your port bow, showing a white light and her green sidelight." Or move her to the day leg | `wrong` | Rules 21(a), 21(b), 31; lines 221 to 229, 242, 379 |
| Q1 explanation | "A seaplane shows lights as close as it can to a vessel's. Here the sidelights are on the wingtips, far wider apart than on a hull this low." | Overturned. The second sentence describes two sidelights the code does not show at this aspect. The first drops Rule 31's condition, "Where it is impracticable" | "Where a seaplane cannot show a vessel's lights in the usual places, Rule 31 has her show lights as close to them as she can." | `wrong` | Rule 31; lines 221 to 229, 379 |
| Q1 citation | "Rule 31" | Right | None | `verified` | Rule 31 |
| Q1 phrase | "Lights too wide for a hull: a seaplane." | Teaches an identification rule that is not in the Rules, about lights the player cannot see | Drop it, or "A seaplane shows lights as close to a vessel's as she can." | `wrong` | Rule 31 |
| Q2 answer and options | "Hold course, expect her to keep well clear, and be ready to act". Others: give way because aircraft have right of way, speed up, three short | Right for this spawn. She is on your port bow showing her starboard side. See judgment call 2 | None | `verified` | Rules 3(a), 3(b), 3(e), 15(a), 17(a), 18(e) |
| Q2 explanation | "A seaplane on the water keeps well clear of all vessels. If risk of collision develops, the steering rules apply to her too." | Drops "in general". Rule 18(e): "shall, in general, keep well clear of all vessels and avoid impeding their navigation. In circumstances, however, where risk of collision exists, she shall comply with the Rules of this Part". It also does not say how Rules 15 and 17 then sort the two vessels, which is why "hold course" is right here | Wording in judgment call 2 | `wrong` | Rule 18(e) |
| Q2 citation | "Rule 18(e)" | Right. The answer also rests on 15 and 17 | Optional: "Rules 18(e), 15, 17" | `verified` | Rules 15, 17, 18(e) |
| Q2 phrase | "Seaplanes keep clear of vessels." | Drops "in general" and the risk-of-collision clause | "Seaplanes, in general, keep clear. Close in, the steering rules apply." | `wrong` | Rule 18(e) |

### Gate 9, not under command

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Not under command, making way". Others: restricted, constrained by draft, aground | Right. Two all-round reds with a sidelight and no masthead light. The others show red-white-red, three reds, or anchor lights with two reds | None | `verified` | Rules 27(a), 27(b)(i), 28, 30(d) |
| Q1 explanation | Two all-round reds; her sidelight shows she is making way | Matches Rule 27(a)(i) and (iii) | None | `verified` | Rule 27(a) |
| Q1 citation | "Rule 27(a)" | Right | None | `verified` | Rule 27(a) |
| Q1 phrase | "Red over red, the captain is dead." | A rhyme for two all-round reds, which is right. Whether it suits players aged 13 and up is a `ceo` and `ux-ui` call | None on the rules | `verified` | Rule 27(a)(i) |
| Q2 answer and options | "Keep out of her way". Others: hold course, cross close ahead, sound one prolonged and continue | Right | None | `verified` | Rule 18(a)(i) |
| Q2 explanation | She cannot maneuver as the rules require, so power-driven and sailing vessels keep out of her way | Matches Rules 3(f), 18(a)(i) and 18(b)(i). A fishing vessel also must "so far as possible" (18(c)(i)) | None | `verified` | Rules 3(f), 18(a)(i), 18(b)(i), 18(c)(i) |
| Q2 citation | "Rule 18(a)(i)" | Right | None | `verified` | Rule 18(a)(i) |
| Q2 phrase | "Not under command: everyone keeps clear." | Wrong. Rule 18 binds power-driven, sailing and fishing vessels. No paragraph binds a vessel restricted in her ability to maneuver, and Rules 9, 10 and 13 come first | "Not under command: power, sail and fishing keep clear." | `wrong` | Rule 18 |

### Gate 9, vessel pushing ahead

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "A towboat pushing a barge ahead, head-on". Others include "Vessel towing astern, tow under 200 m" | Seen from ahead, a vessel towing astern with a tow under 200 m also shows two masthead lights in a vertical line and her sidelights (24(a)(i), (ii)), and her tow shows sidelights (24(e)(i)). That is two masthead lights and two pairs of sidelights, the same as pushing ahead. Only the second pair's place, ahead or astern, tells them apart. Corrected: the renderer projects every light of a vessel at one scale and draws no depth (lines 756 to 761), so from ahead the player cannot see that place. Moved to must-fix | Add a cue the player can see, such as "Radar shows a long target reaching toward you from her lights". Or change the option to "Vessel towing astern, tow over 200 m", which shows three masthead lights | `wrong` | Int 24(a), 24(c), 24(e), 24(f)(i); lines 244, 756 to 761 |
| Q1 explanation | Two masthead lights in a vertical line, a second pair of sidelights low and well ahead at the barge's bow | Matches Int 24(c)(i) and 24(f)(i), "at the forward end, sidelights". Inland differs (see Inland differences) | None for International | `verified` | Int 24(c), 24(f)(i) |
| Q1 citation | "Rules 24(c), 24(f)" | Right | Optional: "Rules 24(c), 24(f)(i)" | `verified` | Rule 24 |
| Q1 phrase | "Two masthead lights and sidelights far out front: pushing ahead." | Matches under International rules | None | `verified` | Int 24(c), 24(f)(i) |
| Q2 answer and options | "Alter course to starboard, early and wide". Others: to port, hold course because tows always give way, pass close across the barge's bow | Right. A vessel pushing ahead is a power-driven vessel (Rule 3(b)), and Rule 18 does not rank her unless she is restricted under 3(g)(vi) | None | `verified` | Rules 3(b), 3(g)(vi), 14(a) |
| Q2 explanation | Both alter to starboard; leave room, "because the barge is far ahead of her lights" | Matches. "Her" is the towboat, and the barge is ahead of the towboat's lights | Optional: "...far ahead of her masthead lights." | `verified` | Rule 14(a) |
| Q2 citation | "Rule 14(a)" | Right | None | `verified` | Rule 14(a) |
| Q2 phrase | "Head on with a tow. Turn to starboard, wide." | Matches | None | `verified` | Rule 14(a) |

### Gate 10, restricted in ability to maneuver, by day

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Restricted in ability to maneuver: ball, diamond, ball". Others: NUC two balls, aground three balls, anchor one ball | Right, and each wrong option describes its own shapes correctly | None | `verified` | Rules 27(a)(ii), 27(b)(ii), 30(a)(i), 30(d)(ii) |
| Q1 explanation | "By day, shapes replace lights. Ball, diamond, ball means restricted... The small boat nearby with one ball is at anchor." | "Shapes replace lights" conflicts with Rule 20(c): lights "shall, if carried, also be exhibited from sunrise to sunset in restricted visibility and may be exhibited in all other circumstances when it is deemed necessary." The rest is right. Corrected: the first pass cited 20(b), which covers sunset to sunrise | "By day, vessels show shapes. Ball, diamond, ball means restricted in ability to maneuver..." | `wrong` | Rules 20(c), 20(d) |
| Q1 citation | "Rules 20, 27(b)" | Right | Optional: "Rules 20(d), 27(b)(ii)" | `verified` | Rules 20, 27(b) |
| Q1 phrase | "Ball, diamond, ball: restricted in ability to maneuver." | Matches | None | `verified` | Rule 27(b)(ii) |
| Q2 answer and options | "Keep out of her way". Others: pass close, hold course, sound five short | Right | None | `verified` | Rule 18(a)(ii) |
| Q2 explanation | Her work limits her, so a power-driven vessel keeps out of her way | Matches. A buoy tender at work is Rule 3(g)(i), "servicing... a navigational mark" | None | `verified` | Rules 3(g)(i), 18(a)(ii) |
| Q2 citation | "Rule 18(a)(ii)" | Right | None | `verified` | Rule 18(a)(ii) |
| Q2 phrase | "Restricted? Keep clear." | Matches | None | `verified` | Rule 18(a)(ii) |

### Gate 11, vessel aground

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Vessel aground, 50 m or more". Others: at anchor 50 m or more, NUC not making way, two small vessels at anchor | Aground is right. "50 m or more" overreaches. Rule 30(a) requires two anchor lights at any length, and 30(b) only allows a vessel under 50 m to show one instead | "Vessel aground, probably 50 m or more" | `wrong` | Rules 30(a), 30(b), 30(d) |
| Q1 explanation | Two anchor lights, the forward one higher, plus two all-round reds | Matches Rules 30(a)(i), 30(a)(ii) "at a lower level", and 30(d)(i) | None | `verified` | Rules 30(a), 30(d) |
| Q1 citation | "Rule 30(a), 30(d)" | Right | None | `verified` | Rule 30 |
| Q1 phrase | "Anchor lights and red over red: she is aground." | Matches | None | `verified` | Rule 30(d) |
| Q2 answer and options | "Slow down and stay well clear: the water near her is shallow". Others: pass close alongside, hold course, steer toward her | Right as seamanship | None | `verified` | Rules 2(a), 6(a)(v), 8(d) |
| Q2 explanation | Aground marks shoal water; wide berth; check the chart | Right as seamanship | None | `verified` | Rule 2(a) |
| Q2 citation | "Rules 30(d), 2" | Overturned. Rule 2(a) carries the duty, "the ordinary practice of seamen". Rule 30(d) is how the player knows she is aground. The fuller citation the first pass suggested is optional; its numbering is right, since 6(a)(v) is "proximity of navigational hazards" and 6(a)(vi) is "draft in relation to the available depth of water" | Optional: "Rules 2(a), 6(a)(v), 8(d), 30(d)" | `verified` | Rules 2(a), 6(a), 30(d) |
| Q2 phrase | "If she is aground, the shoal is right there." | Acceptable | None | `verified` | Rule 2(a) |

### Gate 12, dredge in a narrow channel

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Dredge at work: restricted, with an obstruction on one side". Others: aground, NUC, fishing with gear out | Right. The code puts the two reds on the pipe side and the greens on the open side (lines 249, 383) | None | `verified` | Rules 27(b)(i), 27(d)(i), 27(d)(ii) |
| Q1 explanation | Red, white, red; two reds mark the obstruction; two greens mark where to pass | Matches Rule 27(d)(i), "the side on which the obstruction exists", and 27(d)(ii), "the side on which another vessel may pass" | None | `verified` | Rule 27(d) |
| Q1 citation | "Rules 27(b), 27(d)" | Right | None | `verified` | Rule 27 |
| Q1 phrase | "Two greens, pass this side. Two reds, blocked." | Matches | None | `verified` | Rule 27(d) |
| Q2 answer and options | "The side with the two green lights, even if it is not your usual side". Others: your starboard side past the reds, stop in the channel, whichever is shorter | Right. In the course geometry the greens are on the player's port side | None | `verified` | Rules 9(a), 27(d)(ii) |
| Q2 explanation | Normally keep to starboard, but pass by the greens | Matches Rule 9(a), "as is safe and practicable" | None | `verified` | Rule 9(a) |
| Q2 citation | "Rules 9(a), 27(d)" | Right | None | `verified` | Rules 9(a), 27(d) |
| Q2 phrase | "Pass on the greens." | Matches | None | `verified` | Rule 27(d)(ii) |

### Gate 13, constrained by her draft

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Constrained by draft, inbound (International rules)". Others: NUC making way, restricted, towing with tow over 200 m | Right | None | `verified` | Int 28, Rules 24(a)(i), 27(a), 27(b) |
| Q1 explanation | Power-driven lights plus three all-round reds; this signal exists only under International rules | Matches Int 28, which says she "may" show them. Inland 83.28 is reserved | Optional: "...three all-round reds, which she may show..." | `verified` | Int 28, Inland 83.28 |
| Q1 citation | "Rule 28" | Right | None | `verified` | Int 28 |
| Q1 phrase | "Three reds in a line: constrained by draft." | Matches under International rules | None | `verified` | Int 28 |
| Q2 answer and options | "Keep to your starboard side of the channel and don't impede her". Others: hold the middle, cross ahead of her, move over to her side | Right | None | `verified` | Rules 9(a), 9(d), Int 18(d)(i) |
| Q2 explanation | Vessels other than NUC or restricted avoid impeding her; in a channel keep to your starboard side | Matches Int 18(d)(i), which adds "if the circumstances of the case admit" | Optional: add that clause | `verified` | Int 18(d)(i), Rule 9(a) |
| Q2 citation | "Rules 9(b), 9(d), 18(d)" | Leaves out 9(a), the keep-to-starboard rule. Rule 9(b) applies only to "a vessel of less than 20 meters in length or a sailing vessel", which the game never says the player is. Rule 9(d) explains why crossing ahead is wrong | "Rules 9(a), 9(d), 18(d)(i)", plus 9(b) once the start screen states a boat under 20 m | `wrong` | Rule 9; Int 18(d) |
| Q2 phrase | "Do not impede a deep-draft ship." | Matches | None | `verified` | Int 18(d)(i) |

### Gate 14, tug and tow seen from astern

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "A tug towing astern, seen from astern, with her tow behind her". Others: two small vessels at anchor, two power-driven vessels from astern, pilot and fishing boat | Right. The yellow light rules out every other option | None | `verified` | Rules 21(d), 24(a)(iv), 24(e)(ii) |
| Q1 explanation | Yellow over white marks the tug; the nearer white is the tow's sternlight; her masthead lights don't show from astern | Matches Rules 21(a), 21(c), 21(d), and 24(a)(iv), "a towing light in a vertical line above the sternlight" | None | `verified` | Rules 21, 24(a) |
| Q1 citation | "Rules 21(c), 21(d), 24(a)" | Right | Optional: "Rules 21(c), 21(d), 24(a)(iv), 24(e)(ii)" | `verified` | Rules 21, 24 |
| Q1 phrase | "Yellow over white: a tug, with her tow behind." | Matches. "Behind" means behind the tug, which from the player's side is the nearer light | Optional: "Yellow over white: a tug. Her tow is between you and her." | `verified` | Rule 24(a)(iv) |
| Q2 answer and options | "Stay clear, and never pass between the tug and her tow". Others: pass between, hold course, overtake close | Right | None | `verified` | Rules 2(a), 13(a) |
| Q2 explanation | You are overtaking, so you keep clear; a towline joins the lights | Matches Rules 13(a) and 13(b) | None | `verified` | Rule 13 |
| Q2 citation | "Rules 13, 24" | Right. Rule 24 explains the lights that show the towline | Optional: "Rules 2(a), 13(a), 24(a)" | `verified` | Rules 13, 24 |
| Q2 phrase | "Never cut between a tug and her tow." | Matches as seamanship | None | `verified` | Rule 2(a) |
| Q3 answer and options | "Two prolonged blasts, then two short". Others: two prolonged and one short, two short, prolonged-short-prolonged-short | Right under International rules. Int 34(c)(i): "two prolonged blasts followed by two short blasts to mean 'I intend to overtake you on your port side'". Under Inland rules "Two short blasts" becomes the answer | None for International | `verified` | Int 34(c)(i), Inland 83.34(c)(i) |
| Q3 explanation | Two prolonged and two short means "I intend to overtake you on your port side"; she answers prolonged, short, prolonged, short if she agrees | Matches Int 34(c)(i) and (ii). Int 9(e)(i) calls for the signal only "when overtaking can take place only if the vessel to be overtaken has to take action to permit safe passing" | Optional: add "when she has to move over to let you pass" to the stem | `verified` | Int 9(e)(i), 34(c) |
| Q3 citation | "Rules 9(e), 34(c)" | Right | Optional: "Rules 9(e)(i), 34(c)(i), 34(c)(ii)" | `verified` | Int 9(e), 34(c) |
| Q3 phrase | "Two long, two short: I will overtake you on your port side." | The signal says "I intend to overtake", and she must agree under 34(c)(ii) | "Two long, two short: I intend to overtake you on your port side." | `wrong` | Int 34(c) |
| Q3 horn | `PPSS` | Right, and applies in a narrow channel | None | `verified` | Rules 32, Int 34(c)(i) |

### Gate 15, fog signal, vessel unseen

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | Keyed "Not under command, restricted, constrained by draft, sailing, fishing, or towing". Others: power-driven making way, "A vessel at anchor", a vessel being towed | Int 35(d): "A vessel engaged in fishing, when at anchor, and a vessel restricted in her ability to maneuver when carrying out her work at anchor" sound the 35(c) signal. So "A vessel at anchor" is a possible answer to "What could she be?". The key also leaves out "pushing", which 35(c) lists | Key "Not under command, restricted, constrained by draft, sailing, fishing, or towing or pushing". Replace the anchor option with "A vessel at anchor ringing her bell" or "A vessel stopped, two prolonged" | `wrong` | Int 35(c), 35(d), 35(g) |
| Q1 horn, her fog signal | `PSS` from a sailing vessel | Right | None | `verified` | Rule 35(c) |
| Q1 explanation | One prolonged and two short covers all of those; sound alone can't tell which | Matches Rule 35(c) | Add "including fishing or working at anchor" with the fix above | `verified` | Int 35(c), 35(d) |
| Q1 citation | "Rule 35(c)" | Right for the current text | "Rules 35(c), 35(d)" with the fix above | `verified` | Int 35(c), 35(d) |
| Q1 phrase | "One long, two short: she is limited somehow." | A loose memory aid. A sailing vessel is not restricted in the Rule 3(g) sense, but the phrase makes no rule claim | None | `verified` | Rule 35(c) |
| Q2 answer and options | "Slow to bare steerage way, and don't turn to port for her". Others: full speed, turn hard to port, stop and sound five short | Right. The radar shows her (line 836), so Rule 19(d)(i) applies, and she is heard forward of the beam, so 19(e) applies. Five short is wrong because Rule 34(d) is for vessels in sight | None | `verified` | Rules 19(d)(i), 19(e), 34(d) |
| Q2 explanation | "When you hear a fog signal forward of the beam, slow to the least speed you can steer at. Avoid turning to port for a vessel forward of the beam." | Joins two triggers. Rule 19(e) is the hearing rule: reduce speed "to the minimum at which she can be kept on her course", take all way off if necessary, navigate with extreme caution. The limit on turning to port is 19(d)(i), for "a vessel which detects by radar alone the presence of another vessel" | "You hear her forward of the beam, so slow to the least speed you can steer at, and stop if you need to. She is on your radar and not in sight, so if you alter course, avoid turning to port for a vessel forward of the beam." | `wrong` | Rules 19(d), 19(e) |
| Q2 citation | "Rules 19(d), 19(e)" | Right | None | `verified` | Rule 19 |
| Q2 phrase | "Fog signal ahead: slow down, don't turn to port." | Overturned. It ties the turn-to-port limit to the fog signal, the same mix-up as the explanation | "Fog signal ahead: slow down. On radar, don't turn to port." | `wrong` | Rules 19(d)(i), 19(e) |
| Q3 answer and options | "One prolonged blast at least every 2 minutes". Others: two prolonged, prolonged and two short, rapid bell | Right. "At least every 2 minutes" means intervals of not more than 2 minutes. The key assumes the player's boat is power-driven (must-fix 10) | None | `verified` | Rules 35(a), 35(b), 35(c), 35(g) |
| Q3 explanation | "...sounds one prolonged blast at intervals of not more than 2 minutes." | Word for word Rule 35(a) | None | `verified` | Rule 35(a) |
| Q3 citation | "Rule 35(a)" | Right | None | `verified` | Rule 35(a) |
| Q3 phrase | "One prolonged blast, every two minutes." | Sounding every two minutes meets the rule | Optional: "One prolonged blast, at least every two minutes." | `verified` | Rule 35(a) |
| Q3 horn | `P` | Right. Length is checked below | None | `verified` | Rules 32(c), 35(a) |

## Judgment call 1: gate 6, the rowboat

The keyed answer "Slow down and pass well clear of her" stands, as the first pass said. The first pass's `wrong` on the explanation and the citation is overturned. Neither conflicts with the text, so its rewrite becomes optional.

What the text says, read 2026-10-22:

- Rule 3(a): "The word 'vessel' includes every description of watercraft". Rule 3(b): a power-driven vessel is "any vessel propelled by machinery". Rule 3(c): a sailing vessel is "any vessel under sail provided that propelling machinery, if fitted, is not being used". A boat under oars is neither.
- Rule 18 lists power-driven vessels, sailing vessels, vessels engaged in fishing, vessels not under command, vessels restricted in their ability to maneuver, vessels constrained by their draft (International only), seaplanes and WIG craft. It does not mention a vessel under oars.
- Rule 12 covers "two sailing vessels". Rules 14(a) and 15(a) cover "two power-driven vessels". Rule 13(a) covers "any vessel overtaking any other", which gate 6 is not.
- Rule 17(a)(i) applies "Where one of two vessels is to keep out of the way". No rule puts that duty on either vessel here, so neither is the stand-on vessel.
- That leaves the rules that bind every vessel. Rule 2(a), the ordinary practice of seamen. Rule 2(b), due regard to special circumstances "including the limitations of the vessels involved". Rule 7, risk of collision. Rule 8(a), action "positive, made in ample time", 8(d), "passing at a safe distance", and 8(e), slackening speed. Rule 6, safe speed.

So the keyed answer is the action Rules 2(b), 7 and 8 point to for the vessel that can maneuver far better. "Hold course and speed: she must keep clear" stays wrong, because no rule makes her keep clear. "Sound three short blasts" stays wrong as the response. If the player went astern, though, Int 34(a) would call for three short.

The current explanation, "A rowing boat cannot get out of your way quickly. Take early, obvious action and slow down", is Rule 2(b) and Rule 8 in plain words. It does not claim a right of way. If the team wants the reason the "hold course" option is wrong to be explicit, this optional wording does that:

- Explanation: "No steering rule ranks a vessel under oars, so neither of you is the stand-on vessel. Rules 2, 7 and 8 bind you both. You can maneuver far better than she can, so act early: slow down and pass well clear."
- Citation: "Rules 2(b), 6, 7, 8(d), 8(e)".
- Phrase: keep "Slow down. Give the rowboat room."

The reading that no stand-on vessel exists here comes from what Rules 12 to 18 leave out, not from a sentence that says so. It goes to the NMC below.

## Judgment call 2: gate 8, the seaplane

The first pass's recommendation stands, and the printed text makes it firmer. Keep the keyed answer to the second question for this geometry and rewrite its explanation and phrase. Replace the first question.

What the text says, read 2026-10-22:

- Rule 18(e): "A seaplane on the water shall, in general, keep well clear of all vessels and avoid impeding their navigation. In circumstances, however, where risk of collision exists, she shall comply with the Rules of this Part." Inland 83.18(e) reads the same, with "the Rules of this Subpart (Rules 4-19)". The prototype drops "in general" in both the explanation and the phrase.
- Rule 3(a) counts seaplanes as vessels. Rule 3(e): "The word 'seaplane' includes any aircraft designed to maneuver on the water." Rule 3(b): a power-driven vessel is "any vessel propelled by machinery". A seaplane taxiing on her engine meets 3(b), so once risk of collision exists, Rules 14 and 15 apply to her as to any power-driven vessel. This is a reading of the definitions, not a quoted sentence, and it goes to the NMC below.
- In this spawn she is on the player's port bow showing her starboard side. If risk of collision develops, Rule 15(a) makes her give way and Rule 17(a)(i) makes the player stand on. If she came from starboard, the same rules would make the player give way. The explanation should say so, so the player does not learn that a seaplane always gives way.
- Rule 31: "Where it is impracticable for a seaplane or a WIG craft to exhibit lights and shapes of the characteristics or in the positions prescribed in the Rules of this Part she shall exhibit lights and shapes as closely similar in characteristics and position as is possible." It says nothing about wingtips. Nothing in the Rules lets a mariner identify a seaplane by her lights. At this aspect the code shows one sidelight and a masthead light, which is a power-driven vessel's pattern (see the gate 8 seaplane table).

Suggested wording:

- Q1: name her in the stem, for example "A seaplane is taxiing on your port bow, showing a white light and her green sidelight." Then ask what to do. Or move her to the day leg.
- Q1 explanation, if Q1 stays in some form: "Where a seaplane cannot show a vessel's lights in the usual places, Rule 31 has her show lights as close to them as she can."
- Q2 explanation: "A seaplane on the water should, in general, keep well clear and not impede vessels. If risk of collision develops, the steering rules apply to her like any power-driven vessel. She is on your port side, so she gives way and you stand on, ready to act."
- Q2 citation: "Rules 18(e), 15, 17".
- Q2 phrase: "Seaplanes, in general, keep clear. Close in, the steering rules apply."

## Inland differences that would change content

Every row below was read in eCFR on 2026-10-22, at the 2026-10-19 version. They matter only if the game adds Inland levels (decision G6) or sets a lap in real U.S. inland waters. The International rules "do not apply to vessels while in the waters of the United States shoreward of the navigational demarcation lines" (33 U.S.C. 1604(a), as printed on the NavCen page). Under 33 CFR 80.01(b), "The waters inside of the lines are Inland Rules waters."

| Gate | Inland paragraph | What would change | Change from first pass |
| --- | --- | --- | --- |
| 1, 2 | 83.34(a)(i), (ii) | Whistle signals apply "When power-driven vessels are in sight of one another and meeting or crossing at a distance within half a mile". One short means "I intend to leave you on my port side". The other vessel answers with the same signal if she agrees, or the danger signal if she doubts the maneuver. The explanations and phrases quoting "I am altering my course to starboard" would change. In gate 2, "No signal in sight of her" could be right beyond half a mile | Confirmed |
| 1, 2, 3, 14 | 83.34(h) | A vessel that reaches agreement by radiotelephone "is not obliged to sound the whistle signals prescribed by this Rule, but may do so". The signal questions would need that context | Confirmed |
| 1 | 83.14(a) | Adds "Unless otherwise agreed" | New row |
| 1, 9 | 83.14(d), 83.09(a)(ii) | On the Great Lakes, Western Rivers and waters the Secretary specifies, a power-driven vessel downbound with a following current "shall have the right-of-way over an upbound vessel", proposes the manner of passage and starts the signals. The specified waters are listed in 33 CFR 89.25, which the NavCen page prints | Confirmed |
| 2, 3 | 83.15(b) | On the same waters, a power-driven vessel crossing a river keeps out of the way of a power-driven vessel ascending or descending it | Confirmed |
| 4 | 83.23(e) | On the Great Lakes a power-driven vessel may carry an all-round white light in place of the second masthead light and sternlight, so a lone white light from astern may be that light | Corrected. The first pass cited 23(d). The Great Lakes light is 83.23(e). Inland 83.23(d) is the under-12 m all-round white light with sidelights |
| 4, 6 | 83.25(d)(i), (ii) | A sailing vessel under 7 m and a vessel under oars may "exhibit an all-round white light" as well as use a torch. Gate 6's first explanation would need that option, and a steady lone white light fits even more vessels in gate 4 | New row. It also overturns the first pass's claim that gate 6 reads the same under both rule sets |
| 4, 6 | Int 23(d)(ii), no Inland match | The International rules let a power-driven vessel under 7 m whose maximum speed does not exceed 7 knots show only an all-round white light. Inland 83.23(d) has no such clause | New row |
| 4, 14 | 83.34(c), 83.09(e)(i) | Overtaking signals apply between power-driven vessels in sight of each other anywhere, not only in narrow channels. One short means "I intend to overtake you on your starboard side", two short means port side, and the overtaken vessel agrees with "a similar sound signal". Gate 14's keyed answer would become "Two short blasts", which is a wrong option today. Inland 9(e)(i) also drops the International condition that the overtaken vessel must have to act | Confirmed, with the 9(e)(i) point added |
| 9, pushing | 83.24(c)(iii), 83.24(f)(i), 83.24(j) | A vessel pushing ahead shows "Two towing lights in a vertical line" in place of the sternlight. The pushed barge shows "at the forward end, sidelights and a special flashing light", which 83.21(g) defines as yellow, 50 to 70 flashes a minute. On the Western Rivers, "except below the Huey P. Long Bridge at mile 106.1 Above Head of Passes", and on waters the Secretary specifies, the pushing vessel shows sidelights and two towing lights and no masthead lights. The vessel spec, the explanation and the phrase would change. The special flashing light would also settle must-fix 8 | Corrected. The first pass cited 24(i) for the Western Rivers rule. It is 24(j). The wording is "except below" the bridge, plus the specified waters in 33 CFR 89.27 |
| 10 | 83.30(g), 83.35(l) | A vessel under 20 m at anchor in a special anchorage area designated by the Coast Guard need not show anchor lights or shapes, or sound the bell. This affects only the anchored decor boat | Confirmed, with 35(l) added |
| 12 | 83.27(d)(iv) | Floating dredge pipelines show, at night and in restricted visibility, a row of yellow lights flashing 50 to 70 times a minute, all-round, visible 2 miles, 1 to 3.5 m above the water, roughly evenly spaced and "Not more than 10 meters apart where the pipeline crosses a navigable channel". Each end has two red lights 1 m apart in a vertical line. The prototype's pipe crosses the channel unlit | Corrected. The first pass placed this in Annex V, 33 CFR part 88. Part 88 holds only the law enforcement and public safety lights. The pipeline lights are Inland Rule 27(d)(iv). There is no International equivalent |
| 13 | 83.03(h), 83.18(d), 83.28 | All reserved. No constrained-by-draft vessel or signal exists. The gate would need a different vessel, such as a deep-draft ship showing only Rule 23 lights, with Rules 9(b) and 9(d). Inland 83.09(d) also says the vessel in the channel "must use" the five-short signal if in doubt, where the International text says "may" | Confirmed, with 9(d) added |
| 9, 15 | 83.35(c), 83.35(d) | The one-prolonged-two-short list has no constrained-by-draft vessel. It names "a vessel restricted in her ability to maneuver, whether underway or at anchor" and "a vessel engaged in fishing, whether underway or at anchor". 83.35(d) is reserved. Gate 15's keyed answer would drop constrained by draft. The "A vessel at anchor" option is a possible answer under Inland too. Gate 9's "Constrained by draft" option would not exist | Confirmed |

Under both rule sets, gates 5, 7, 8, 10 and 11 read the same: the sailing, trawling, fishing, pilot, seaplane, restricted and aground lights, shapes and duties. Gate 6 does not, because of Inland 83.25(d)(ii). The first pass listed gate 6 as the same; that is corrected.

## Arc, geometry and horn checks

| Item | Prototype | Finding | Status | Source |
| --- | --- | --- | --- | --- |
| Masthead light | `abs(aspect) <= 112.5`, so 225° from right ahead to 22.5° abaft each beam | Matches Rule 21(a), "225 degrees... from right ahead to 22.5 degrees abaft the beam on either side" | `verified` | Rule 21(a); line 225 |
| Sidelights | Starboard from -1.5° to 112.5°, port mirrored | 112.5° each, plus 1.5° across the bow. Annex I lets the forward cut-off fall "between 1 and 3 degrees outside the prescribed sectors", so 1.5° fits. Aft, Annex I 9(a)(ii) lets the light fade to cut-off "not more than 5 degrees outside" 22.5° abaft the beam. The code's hard edge is a fair model | `verified` | Rule 21(b); Annex I section 9(a), Inland 84.15(a); lines 226 to 227 |
| Sternlight | `abs(aspect) >= 112.5`, so 135° over the stern | Matches Rule 21(c), "135 degrees... 67.5 degrees from right aft on each side". At exactly 112.5° the masthead light, the sidelight and the sternlight all show. Pick one convention for that boundary and test it | `verified` | Rule 21(c); line 228 |
| Towing light | Same arc as the sternlight, yellow, above it | Matches Rule 21(d), "the same characteristics as the 'sternlight'", and 24(a)(iv), "in a vertical line above the sternlight" | `verified` | Rules 21(d), 24(a)(iv); lines 219, 251 |
| All-round lights | Always visible | Matches Rule 21(e) | `verified` | Rule 21(e); line 224 |
| Vertical order of lights | Aft masthead light higher on the large ship; forward anchor light higher on the grounded ship; towing light above sternlight; red over green, white over red, green over white, red over white | All match: 23(a)(ii) "abaft of and higher than the forward one", 30(a)(ii) "at a lower level", 24(a)(iv), 25(c) "the upper being red", 29(a)(i) "the upper being white", 26(b)(i) "the upper being green", 26(c)(i) "the upper being red". Heights are checked separately below | `verified` | Rules 23 to 30; lines 234 to 253 |
| Tow length | Barge centre 220 m behind the tug centre; barge 60 m, tug 30 m | The tow measured "from the stern of the towing vessel to the after end of the tow" is about 235 m, over 200 m, so three masthead lights in a vertical line is right | `verified` | Rule 24(a)(i); lines 251, 252, 385 |
| Gillnetter's gear light | 7 m to port of the red and white lights, 4 m high, below the 6.5 m white | Annex I section 4(a): "not less than 2 meters and not more than 6 meters away from the two all-round red and white lights", and "not higher than the all-round white light... and not lower than the sidelights". The height is fine. The 7 m distance is not. Move it to 6 m or less | `wrong` | Annex I section 4(a), Inland 84.04(a); line 240 |
| Rule 22 ranges | Not modelled, apart from the oar torch showing inside 380 m | Every spawn range in the lap (300 to 780 m) is inside the shortest minimum in Rule 22, 1 mile for a sidelight on a vessel under 12 m. So showing every light at those ranges is right. The oar torch is not a Rule 22 light. The start screen discloses the compression | `verified` | Rule 22, Inland 83.22; lines 173, 238, 795 |
| Blast lengths | Short 1 s, prolonged 4 s | Within Rule 32(b), "about one second", and 32(c), "from four to six seconds". The 4 s blast sits at the lower limit, and after its 0.06 s ramp and 0.1 s fade full volume lasts about 3.84 s. Use 5 s | `verified` | Rule 32(b), (c), Inland 83.32; lines 440, 461 to 462 |
| Gap between blasts | 1 s in every signal | Rules 32 and 34 set no gap between whistle blasts. Rule 35(b) sets "an interval of about 2 seconds" between the two prolonged blasts of a vessel stopped in fog. That signal is only a wrong option today, but if a port plays it, use a 2 s gap. The fog interval is compressed from 2 minutes to about 11 s, which the start screen discloses | `verified` | Rules 32, 34, 35(b); lines 451, 466, 615 |

## Renderer geometry against Annex I

These are not in the 190 count and none changes an answer. The player sees only the order of lights, which is right. But the port's data should hold real values, so they are listed for the engineer. Heights are metres above the water in the code; "above the hull" subtracts the vessel's `deck` value. The International figure is given, with Inland where it differs.

| Vessel | Code | Annex I | Gap |
| --- | --- | --- | --- |
| Large power-driven, gate 2 (L 110 m, B 18 m) | Forward masthead light 10 m above the hull | Section 2(a)(i): at least the breadth, capped at 12 m. Inland 84.02(a)(i) caps at 8 m | 2 m low under International |
| Constrained by draft, gate 13 (L 160 m, B 26 m) | Forward masthead light 10 m above the hull | Same, 12 m. Inland caps at 8 m | 2 m low under International |
| Small power-driven, gates 1, 3, 4 (L 30 m, B 7 m) | Masthead light 6.5 m above the hull | At least the breadth, 7 m. Inland the same here: at least 5 m and the breadth, capped at 8 m | 0.5 m low under both |
| Tug, gate 14 (L 30 m, B 9 m) | Lowest masthead light 6.5 m above the hull | At least the breadth, 9 m. Inland at least the breadth, capped at 8 m | 2.5 m low under International, 1.5 m under Inland |
| Aground, gate 11 (L 80 m) | Forward anchor light 4 m above the after one, and 5 m above the hull | Section 2(k): "not less than 4.5 meters above the after one", and on a vessel of 50 m or more "not less than 6 meters above the hull". Same in Inland 84.02(k) | 0.5 m and 1 m low |

The start screen says "Vertical spacing of lights is exaggerated". On screen that holds, because the renderer's vertical scale has a higher floor than its horizontal scale (line 756). The stored heights above are below the Annex I minimums, though, so the note describes the drawing and not the data.

## Start screen

| Item | Prototype says | Finding | Status | Source |
| --- | --- | --- | --- | --- |
| Eyebrow | "Rules of the Road · Lights and Shapes · Rules 20 to 31" (en dash in the prototype) | The lap also tests Rules 2, 3, 6 to 9, 13 to 19, 32, 34 and 35. Suggest "Rules of the Road · Lights, shapes, steering and sound". Separately, and not a rules point, "one encounter at each" gate is not accurate, because gates 7, 8 and 9 each have two quizzed vessels | `wrong` | Part titles in the Handbook contents; lines 157, 159, 378 to 380 |
| Light key | "masthead 225°, stern 135°, all-round 360°", "Red port 112.5°", "Green starboard 112.5°", "Yellow towing light" | Matches Rule 21(a) to (e) | `verified` | Rule 21; lines 160 to 164 |
| Draft note and rule-set chip | "has not been checked against the official Navigation Rules text"; chip "International rules (COLREGS)" | The chip is right, because the content follows the International text. The note was true when written. After this check its literal claim is out of date, but the wording is still a draft with the defects above, so keep a draft note until they are fixed and re-checked. Any new wording is a disclaimer question for `counsel` | `verified` | Rule 1(a); line 173 |
| Own vessel | Not stated anywhere | Rules 14(a) and 15(a) apply to "two power-driven vessels". Rule 17(c) applies to "A power-driven vessel". Rule 18(a) applies to "A power-driven vessel underway". Int 34(a) applies to "a power-driven vessel underway". Rule 35(a) applies to "A power-driven vessel making way". Rule 9(b) applies to "a vessel of less than 20 meters in length". The keyed answers in gates 1, 2, 3, 5, 15 and others assume a power-driven vessel, and gate 5's answer says so. State it, for example "You are driving a power-driven vessel under 20 m." | `wrong` | Rules 9(b), 14(a), 15(a), 17(c), 18(a), Int 34(a), 35(a) |

## The earlier corrections

These are the five corrections from the session before the first pass.

| Correction | Finding | Status | Source |
| --- | --- | --- | --- |
| Green over white is trawling | Matches Rule 26(b)(i), "the upper being green and the lower white" | `verified` | Rule 26(b)(i) |
| A sailing vessel shows sidelights and a sternlight and may add red over green | Matches Rule 25(a) and 25(c). The red over green "shall not be exhibited in conjunction with the combined lantern" | `verified` | Rule 25(a), (b), (c) |
| Three white masthead lights in a vertical line belong to the towing vessel when the tow exceeds 200 m | Matches Rule 24(a)(i), measured "from the stern of the towing vessel to the after end of the tow". In the code that is about 235 m | `verified` | Rule 24(a)(i) |
| Red, white, red is restricted in ability to maneuver | Matches Rule 27(b)(i), "The highest and lowest of these lights shall be red and the middle light shall be white" | `verified` | Rule 27(b)(i) |
| Three reds in a vertical line is constrained by draft, International only | Matches Int 28, which says she "may" show them. Inland 83.28 is reserved | `verified` | Int 28, Inland 83.28 |

## Boundary cases for the port's tests

The first slice in #45 adds tests for the arc function. These cases follow from the findings above, and each test should cite its rule.

- Masthead light visible at aspects 0°, +112.5° and -112.5°, and not at ±112.6° (Rule 21(a)).
- Starboard sidelight visible from -1.5° to 112.5°, and not at -1.6° or 112.6°. Port mirrored (Rule 21(b), Annex I section 9(a)).
- Sternlight and towing light visible at 180° and ±112.5°, and not at ±112.4° (Rule 21(c), 21(d)). Decide and document which lights show at exactly 112.5°.
- All-round light visible at every aspect (Rule 21(e)).
- Three masthead lights when the tow from the tug's stern exceeds 200 m, and two at exactly 200 m (Rule 24(a)(i)).
- Gear light between 2 m and 6 m horizontally from the red and white lights, and not higher than the white (Annex I section 4(a)).
- Forward anchor light at least 4.5 m above the after one, and at least 6 m above the hull at 50 m or more (Annex I section 2(k)).
- Prolonged blast 4 to 6 s at full volume, short blast about 1 s (Rule 32). Two prolonged blasts for a stopped vessel spaced about 2 s (Rule 35(b)).
- Seaplane and pushing-tow geometry: at the moment each question opens, the lights the stem describes are the lights `arcVisible` returns. A test of this kind would have caught must-fix 6 and 8.

The sea-time cases this role normally tests (the 4-hour day under 100 GRT, the 8-hour day, the 1.5-day two-watch credit, recency windows and tonnage limits) do not apply. This check affects no license.

## Open items

Unverified: none of the 190 items. What this check did not read:

- The IMO's own COLREGS text and the 1977 proclamation at 42 FR 17112. The International wording here comes from the Coast Guard Handbook and the NavCen page, which agree with each other.
- Whether any IMO amendment to the COLREGS after resolution A.1085(28) of 2013 has entered into force. The Handbook, corrected 2024-08-12, lists none. A later amendment could change a paragraph cited here. `uscg-regs` should check the IMO's list of COLREG amendments before launch.

For the NMC, through `uscg-regs`:

- When a power-driven vessel meets a vessel under oars and neither is overtaking, does the NMC treat the case under Rules 2, 7 and 8 only, with no stand-on vessel?
- Does the NMC treat a seaplane taxiing on the water as a power-driven vessel for Rules 14 and 15 once risk of collision exists?
- Do NMC exam answers treat two masthead lights as "50 m or more", or as "50 m or more, or a smaller vessel carrying the optional light"? The same question applies to two anchor lights.

For other roles:

- `ceo`: whether to keep "right of way" in player-facing text (gate 8 pilot phrase), and the rhyme "the captain is dead" for players aged 13 and up (gate 9). Also the wording of the own-vessel line on the start screen, which the rules require but whose phrasing is a product call.
- `counsel`: the wording of the start-screen draft note once the fixes land and are re-checked.
- `architect`: if Et chooses an Inland variant, the encounter data needs a rule-set field. Vessel specs (gate 9 pushing, gate 12 pipeline, gate 6 oar light), keyed answers (gates 1, 2, 14, 15) and a whole encounter (gate 13) differ by rule set. Decision G19 places the first level in Long Beach harbor. 33 CFR 80.1114(b) draws the demarcation line "from Long Beach Channel Entrance Light 2 to Long Beach Light", and 80.01(b) makes the waters inside Inland Rules waters, so a lap inside the Long Beach breakwater would run under Inland rules. The arc boundary convention at exactly 112.5° also needs an owner.

This check concerns Chapter 1 game content only. It touches no sea-time rule and releases no license in the sea-time log.
