# Night Harbor Run regulation check, 2026-10-22

Sheave Halyard, a subagent of Bight Halyard acting as `uscg-regs`, checked the Night Harbor Run prototype on 2026-10-22 for issue #45. This is the first "Before building" box on that issue. The check covers every question, keyed answer, wrong option, explanation, rule citation, spoken phrase and horn pattern in the 15 gates. It also covers the Rule 21 arc constants in the code and the start-screen copy. No game code was changed.

| Field | Value |
| --- | --- |
| File checked | `for-engineer/night-harbor-run/night-harbor-run.html` in the zip Et supplied |
| SHA-256 | `b0f14e5beee0f8d9bd0325c1278c655b1da98194047561394d4f50b267b64d73` (matched before reading) |
| How it was read | As data. The file was not run. Encounter data is lines 264 to 367, spawn specs 371 to 386, arc logic 212 to 231, horn playback 439 to 470, start screen 155 to 175 |
| Rule set in the prototype | International (COLREGS 1972, as amended) for the whole lap |
| Date checked | 2026-10-22 |

## Read this first: no primary rule text could be reached

Every primary source was blocked from this session. The shell proxy refused eCFR, NavCen, NOAA, IMO and GovInfo with HTTP 403 on CONNECT. The web fetch tool could not resolve any of those hosts. The secondary mirrors (Cornell LII, the House U.S. Code site, federal-regs.com, customsmobile.com) were blocked the same way. The repo holds no copy of the rule text.

So nothing in this report is a sign-off. Each finding compares the prototype with the rule text as this checker expects it to read. Each one names the rule paragraph to confirm. The status words mean the following.

- `verified`: confirmed against a primary source read directly. Only the Rule 32 blast lengths qualify, from Beacon Shoal's direct reading on 2026-10-20 in `arcade-regs-check-2026-10-20.md`.
- `unverified`: no defect found against the expected text, but the printed rule was not read. Some of these rows carry a suggested wording change that is optional.
- `wrong`: a defect. Either a wrong option is also right, the explanation or phrase teaches something the rule does not say, the citation names the wrong paragraph, or the content contradicts the prototype's own code. Where a `wrong` finding depends on rule wording, it must be confirmed against the printed rule before anyone treats it as settled.

Web searches were used as leads on six wording points. Search summaries are not the rule, and the report never cites one as the rule.

The fastest way to settle this check is the route the NMC guide took on 2026-10-20. Et supplies a copy of the Coast Guard's Navigation Rules book, or the 33 CFR part 83 PDF, and the next session reads each flagged paragraph.

## Sources

| URL | Tool | Result | Read? |
| --- | --- | --- | --- |
| https://www.ecfr.gov/current/title-33/chapter-I/subchapter-E/part-83 | curl | 403 on CONNECT | No |
| https://www.ecfr.gov/api/versioner/v1/full/2026-10-20/title-33.xml?part=83 | curl | 403 on CONNECT | No |
| https://www.ecfr.gov/api/versioner/v1/versions/title-33.json?part=83 | curl | 403 on CONNECT | No |
| https://www.ecfr.gov/current/title-33/chapter-I/subchapter-E/part-83/subpart-D/section-83.34 | web fetch | Host not found | No |
| https://navcen.uscg.gov/navigation-rules-amalgamated | curl | 403 on CONNECT | No |
| https://www.navcen.uscg.gov/navigation-rules-amalgamated | web fetch | Host not found | No |
| https://www.navcen.uscg.gov/sites/default/files/pdf/navRules/navrules.pdf | curl | 403 on CONNECT | No |
| https://nauticalcharts.noaa.gov/publications/coast-pilot/files/cp8/CPB8_AppendixA_WEB.pdf | curl and web fetch | 403, then host not found | No |
| https://www.imo.org/en/About/Conventions/Pages/COLREG.aspx | curl and web fetch | 403, then host not found | No |
| https://www.govinfo.gov/link/cfr/33/83?link-type=pdf&year=mostrecent | curl | 403 on CONNECT | No |
| https://www.govinfo.gov/content/pkg/CFR-2024-title33-vol1/xml/CFR-2024-title33-vol1-part83.xml | web fetch | Host not found | No |
| https://www.law.cornell.edu/cfr/text/33/83.34 (secondary) | web fetch | Host not found | No |
| https://www.law.cornell.edu/uscode/text/33/2018 (secondary) | curl | 403 on CONNECT | No |
| https://uscode.house.gov/ | curl | 403 on CONNECT | No |
| https://federal-regs.com/title/33/part-83/83.18/ (mirror) | curl and web fetch | 403, then host not found | No |
| https://www.customsmobile.com/regulations/33/83.18 (mirror) | curl and web fetch | 403, then host not found | No |
| `docs/product/arcade-regs-check-2026-10-20.md`, section 4 | repo | Rule 32(b) and 32(c), Inland and International, read directly by Beacon Shoal on 2026-10-20 | Yes, by that session |

Search leads only, not read and not cited as the rule:

- Annex I section 4, the gear light 2 to 6 metres from the red and white lights. Lead from a South African copy of the regulations, https://shop.acts.co.za/merchant-shipping-act-1951/r566_4__details_of_location_of.php
- Inland Rule 24(c)(iii), two towing lights for a vessel pushing ahead, and 24(f)(i), the special flashing light. Leads pointed to https://www.law.cornell.edu/cfr/text/33/83.24 and a 2017 GPO PDF.
- Inland Rule 35(c), its list of vessels without constrained by draft. Lead pointed to https://www.law.cornell.edu/cfr/text/33/83.35
- Inland Rule 34(c)(i), one short and two short blasts for overtaking. Lead pointed to https://www.law.cornell.edu/cfr/text/33/83.34
- Rule 18(e), "in general, keep well clear". Lead from https://www.customsmobile.com/regulations/33/83.18
- Rule 6(a)(v) and (vi). Lead from https://www.steamshipmutual.com/colregs-rule-6-safe-speed

## Summary

| Count | Items |
| --- | --- |
| Checked | 190 |
| `verified` correct | 1 |
| `wrong` | 24 |
| `unverified`, no defect found | 165 |

The 190 items break down as follows. The 18 quizzed encounters have 41 question steps, and each step has four items: the answer with its wrong options, the explanation, the citation and the spoken phrase. That makes 164. Then come 6 horn patterns, 11 arc and geometry items, 4 start-screen items and the 5 corrections from the previous session.

These numbers should not be read as "165 correct". They mean 165 items show no defect against the expected text, and none of them is confirmed.

### Must fix before any port

1. Gate 4, first question. A single white light also fits "A small vessel at anchor" and "A vessel under oars", so two wrong options are also right. The stem must rule them out.
2. Gate 15, first question. A vessel engaged in fishing at anchor, or a vessel restricted in ability to maneuver working at anchor, also sounds one prolonged and two short (Rule 35(d)). So "A vessel at anchor" is a possible answer. The keyed answer also leaves out pushing.
3. Gate 15, second question. The explanation ties "don't turn to port" to hearing a fog signal. That limit is in Rule 19(d), for a vessel detected by radar. Hearing a signal forward of the beam brings in Rule 19(e), which is about speed.
4. Gate 3, third question. The explanation says the stand-on vessel "must act" once she sounds five short. Rule 17(a)(ii) says she may act. Rule 17(b) says she shall act only when collision cannot be avoided by the give-way vessel alone. It also leaves out Rule 17(c), which says not to turn to port for a vessel on your own port side. That is the exact situation in this gate.
5. Gate 6, both questions. The first explanation misstates Rule 25(d)(ii). The second explanation and its citation need the rewording in the judgment call below.
6. Gate 8, the seaplane. The stem says "sidelights very far apart", but at the spawn geometry the code's own arc function shows only her green sidelight. The phrase teaches an identification rule that is not in Rule 31. The second explanation and phrase drop "in general" from Rule 18(e). See the judgment call below.
7. Gate 9, not under command. The phrase "everyone keeps clear" overreaches. Rule 18 does not require a vessel restricted in ability to maneuver to keep clear of one not under command.
8. Gate 13, second question. Keeping to your starboard side of a channel is Rule 9(a), which the citation leaves out. Rule 9(b) applies only if your own boat is under 20 m or sailing.
9. The start screen never says what the player's own boat is. Rules 9(b), 14, 15, 18(a) and 34(a) depend on it. Several keyed answers assume a power-driven vessel under 20 m without saying so.

### Should fix

- Gates 2 and 11 say "50 m or more". Rule 23(a)(ii) lets a power-driven vessel under 50 m carry a second masthead light. Rule 30(b) lets a vessel under 50 m show the two anchor lights. The lights show "probably 50 m or more", not a measured length.
- Gate 6's first phrase says any lone low white light is a rowboat.
- Gate 9's pushing-ahead question. Seen from ahead, a vessel towing astern with a tow under 200 m shows the same two masthead lights and sidelights. The only difference is whether the barge's sidelights sit in front of the towboat or behind her, which the stem does not settle.
- Gate 10 says "By day, shapes replace lights." Rule 20(b) requires lights by day in restricted visibility and allows them at other times.
- Gate 11's second citation. Rule 30(d) covers lights only.
- Gate 14's third phrase says "I will overtake". The signal means "I intend to overtake" and needs the other vessel's agreement.
- The gillnetter's gear light sits 7 m from her other lights. Annex I section 4 sets 2 to 6 m (search lead, unverified).
- The eyebrow says "Rules 20–31", but the lap tests Rules 2 to 35.
- The prolonged blast is 4 s, at the bottom of Rule 32(c)'s 4 to 6 s range. After the 0.06 s ramp up and the 0.1 s fade, the full-volume part is about 3.84 s. Use 5 s, which the 2026-10-20 report already accepts for G16.

## Gate by gate

In every table, "Source" names the paragraph to confirm. "Not read" means the printed text was blocked this session. Rule numbers apply to both rule sets unless the row says otherwise. The Inland Rule N is 33 CFR 83.N.

### Gate 1, power-driven vessel head-on

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Power-driven vessel under 50 m, head-on". Others: seen from astern, sailing head-on, at anchor | Keyed answer fits one masthead light over both sidelights. No wrong option fits | None | `unverified` | Rules 21(a), 21(b), 23(a), not read |
| Q1 explanation | "You see red and green together only when she points straight at you." | Slight overreach. Rule 14(b) says ahead or nearly ahead, and Annex I lets sidelights cut off 1 to 3 degrees past dead ahead | "...only when she points at you or nearly at you." | `unverified` | Rule 14(b), Annex I section 9(a)(i), not read |
| Q1 citation | "Rules 21, 23(a)" | Right rules | "Rules 21(a), 21(b), 23(a)(i)" is more exact | `unverified` | Not read |
| Q1 phrase | "White over red and green: a power vessel, head on." | Accurate | None | `unverified` | Not read |
| Q2 answer and options | "Alter course to starboard". Others: port, hold course, stop | Keyed answer is Rule 14(a). Stopping is allowed by Rule 8(e) but is not the Rule 14 action | None | `unverified` | Rule 14(a), not read |
| Q2 explanation | Both alter to starboard and pass port to port | Accurate for two power-driven vessels | None | `unverified` | Rule 14(a), not read |
| Q2 citation | "Rule 14(a)" | Right | None | `unverified` | Not read |
| Q2 phrase | "Head on. Both turn to starboard." | Accurate | None | `unverified` | Not read |
| Q3 answer and options | "One short blast" | Right under International rules. The signal applies because the vessels are in sight, power-driven, under way and maneuvering as Rule 14 requires | None | `unverified` | Rule 34(a), not read |
| Q3 explanation | "One short blast means: I am altering my course to starboard." | Right under International rules. Inland wording differs (see Inland section) | None for International | `unverified` | Rule 34(a)(i), not read |
| Q3 citation | "Rule 34(a)" | Right | "Rule 34(a)(i)" | `unverified` | Not read |
| Q3 phrase | "One short blast. I am altering my course to starboard." | Right under International rules | None for International | `unverified` | Not read |
| Q3 horn | `S` | Right signal, and the signal applies | None | `unverified` | Rule 34(a), not read |

### Gate 2, large power-driven vessel crossing from starboard

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Power-driven vessel 50 m or more, crossing from your starboard". Others: two small vessels, under 50 m head-on, towing with tow under 200 m | Two masthead lights do not prove 50 m or more. A vessel under 50 m may carry the second one. The towing option is told apart only by vertical versus offset masthead lights, which the renderer must make readable | "Power-driven vessel, probably 50 m or more, crossing from your starboard" | `wrong` | Rule 23(a)(ii), Rule 24(a)(i), not read |
| Q1 explanation | Red means her port side, so she crosses from your right | Accurate on aspect. It does not say there is risk of collision, which Rule 15 needs | Add "and her bearing is steady" to the stem or the explanation | `unverified` | Rules 7(d)(i), 15, not read |
| Q1 citation | "Rules 21, 23(a)(ii)" | Right | None | `unverified` | Not read |
| Q1 phrase | "Two masthead lights and red: a big ship crossing from your right." | Acceptable | None | `unverified` | Not read |
| Q2 answer and options | "Give way: turn to starboard and pass astern of her" | Right. All three wrong options are wrong | None | `unverified` | Rules 15, 16, not read |
| Q2 explanation | Give-way vessel, act early, avoid crossing ahead | Accurate. Rule 15 says avoid crossing ahead "if the circumstances of the case admit" | None | `unverified` | Rules 15, 16, not read |
| Q2 citation | "Rules 15, 16" | Right | None | `unverified` | Not read |
| Q2 phrase | "If to starboard red appear, it is your duty to keep clear." | Traditional rhyme. Accurate for two power-driven vessels crossing | None | `unverified` | Rule 15, not read |
| Q3 answer and options | "One short blast". Others include "No signal in sight of her" | Right under International rules. Under Inland rules the "no signal" option could be right beyond half a mile (see Inland section) | None for International | `unverified` | Rule 34(a), not read |
| Q3 explanation | Altering to starboard in sight: one short | Right | None | `unverified` | Rule 34(a)(i), not read |
| Q3 citation | "Rule 34(a)" | Right | "Rule 34(a)(i)" | `unverified` | Not read |
| Q3 phrase | "One short blast." | Right | None | `unverified` | Not read |
| Q3 horn | `S` | Right, and applies | None | `unverified` | Rule 34(a), not read |

### Gate 3, power-driven vessel crossing from port

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Power-driven vessel under 50 m, crossing from your port" | Right. No wrong option fits | None | `unverified` | Rules 21, 23(a), not read |
| Q1 explanation | Masthead and green means her starboard side, crossing from your left | Accurate | None | `unverified` | Not read |
| Q1 citation | "Rules 21, 23(a)" | Right | None | `unverified` | Not read |
| Q1 phrase | "Masthead and green: crossing from your left." | Accurate | None | `unverified` | Not read |
| Q2 answer and options | "Stand on: hold course and speed" | Right. "Stop engines" is wrong for the stand-on vessel at this stage | None | `unverified` | Rule 17(a)(i), not read |
| Q2 explanation | She gives way, you keep course and speed | Accurate | None | `unverified` | Rules 15, 17(a)(i), not read |
| Q2 citation | "Rules 15, 17(a)" | Right | "Rules 15, 17(a)(i)" | `unverified` | Not read |
| Q2 phrase | "Green on your left: she keeps clear. You stand on." | Accurate | None | `unverified` | Not read |
| Q3 answer and options | "Five or more short, rapid blasts" | Right. "At least five" in the rule means the same | None | `unverified` | Rule 34(d), not read |
| Q3 explanation | "If she still does nothing, you must act to avoid collision yourself." | Merges two duties. Rule 17(a)(ii) says the stand-on vessel may act once it is apparent the other is not acting. Rule 17(b) says she shall act only when collision cannot be avoided by the give-way vessel alone. It also leaves out Rule 17(c). She is on your port side, so if you act you should not turn to port | "Five short says you doubt she is doing enough. Once it is clear she is not acting, you may maneuver yourself, but not to port for a vessel on your port side. If she gets so close that her action alone cannot avoid collision, you must act." | `wrong` | Rules 17(a)(ii), 17(b), 17(c), not read |
| Q3 citation | "Rules 34(d), 17(b)" | Leaves out the paragraphs the situation turns on | "Rules 34(d), 17(a)(ii), 17(b), 17(c)" | `wrong` | Not read |
| Q3 phrase | "Five short blasts. I doubt your intentions." | Accurate | None | `unverified` | Rule 34(d), not read |
| Q3 horn | `SSSSS` | Right, and applies to vessels in sight approaching each other | None | `unverified` | Rule 34(d), not read |

### Gate 4, overtaking a power-driven vessel

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Only one white light shows ahead, and you are closing on it slowly." Keyed sternlight. Others include "A small vessel at anchor", "A vessel under oars" | Two wrong options also fit. A vessel at anchor under 50 m may show one all-round white light. A vessel under oars may show a white torch. If the player is slow, closing slowly does not exclude an anchored vessel | Make the stem rule them out, for example "Radar shows her moving the same way as you, slower." Or ask "What could it be?" and key an answer that names all three | `wrong` | Rules 21(c), 25(d)(ii), 30(b), not read |
| Q1 explanation | Sternlight 135°, seeing it alone puts you more than 22.5° abaft her beam | Accurate | None | `unverified` | Rules 21(c), 13(b), not read |
| Q1 citation | "Rules 21(c), 13(b)" | Right | None | `unverified` | Not read |
| Q1 phrase | "Only her sternlight: you are overtaking." | Accurate once the stem is fixed | None | `unverified` | Rule 13(b), not read |
| Q2 answer and options | "Keep out of her way until you are past and clear" | Right | None | `unverified` | Rule 13(a), 13(d), not read |
| Q2 explanation | Overtaking vessel keeps clear "whatever kind either one is" | Accurate. Rule 13(a) overrides Part B sections I and II | None | `unverified` | Rule 13(a), not read |
| Q2 citation | "Rule 13(a)" | "Past and clear" is 13(d) | "Rule 13(a), 13(d)" | `unverified` | Not read |
| Q2 phrase | "Overtaking? You keep clear." | Accurate | None | `unverified` | Not read |

### Gate 5, sailing vessel

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Sailing vessel, crossing from your starboard" | Right. Red over green with no white masthead light is a sailing vessel | None | `unverified` | Rules 25(a), 25(c), not read |
| Q1 explanation | Red over green is optional, no white masthead light | Accurate. It could add that red over green is never shown with the combined lantern | Optional: "...and never with a combined lantern." | `unverified` | Rule 25(b), 25(c), not read |
| Q1 citation | "Rules 25(a), 25(c)" | Right | None | `unverified` | Not read |
| Q1 phrase | "Red over green, sailing machine." | Traditional rhyme, accurate | None | `unverified` | Not read |
| Q2 answer and options | "Keep out of her way: you are power-driven, she is sailing" | Right in open water | None | `unverified` | Rule 18(a)(iv), not read |
| Q2 explanation | Power-driven keeps out of the way of sail | Accurate in open water. Rule 18 yields to Rules 9, 10 and 13 | None | `unverified` | Rule 18, not read |
| Q2 citation | "Rule 18(a)(iv)" | Right | None | `unverified` | Not read |
| Q2 phrase | "Power gives way to sail." | Mild overreach, because in a narrow channel a sailing vessel must not impede (Rule 9(b)) | Optional: "In open water, power gives way to sail." | `unverified` | Rules 9(b), 18, not read |

### Gate 6, vessel under oars

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "A small boat under oars showing a torch". Others: sailing vessel from astern, aground, pilot | Best answer. A sailing vessel under 7 m may also use a torch (25(d)(i)). The "seen from astern" option implies a steady sternlight, so it stays wrong | None needed. The explanation can mention small sailboats | `unverified` | Rule 25(d), not read |
| Q1 explanation | "A vessel under oars may show a hand torch or lantern, shown in time to prevent collision, instead of sidelights." | Misstates the rule. She may show a sailing vessel's lights. If she does not, she shall have a white torch or lantern ready and show it in time to prevent collision. The torch is required if she has no sailing lights, and it is not a substitute for sidelights alone | "A vessel under oars may show a sailing vessel's lights. If she does not, she must have a white torch or lantern ready and show it in time to prevent collision." | `wrong` | Rule 25(d)(ii), not read |
| Q1 citation | "Rule 25(d)" | Right rule | "Rule 25(d)(ii)" | `unverified` | Not read |
| Q1 phrase | "A lone low white light: a small boat under oars." | Teaches a false rule. A lone low white light could also be a small vessel at anchor, a sailboat under 7 m, or a small power-driven vessel under 7 m | "A torch flicks on, low and close: a small boat, maybe under oars." | `wrong` | Rules 23(d), 25(d), 30(b), not read |
| Q2 answer and options | "Slow down and pass well clear of her" | Defensible. See the judgment call below | None | `unverified` | Rules 2, 7, 8, not read |
| Q2 explanation | "A rowing boat cannot get out of your way quickly. Take early, obvious action and slow down." | Gives no rule basis, and can be read as a right of way for the rowboat. No steering rule ranks a vessel under oars | Wording in the judgment call below | `wrong` | Rules 2, 3, 7, 8, 13 to 18, not read |
| Q2 citation | "Rules 6, 8" | The duty comes from Rules 7 and 8 and good seamanship. Rule 6 is safe speed in general | "Rules 2(a), 7, 8(a), 8(d), 8(e)" | `wrong` | Not read |
| Q2 phrase | "Slow down. Give the rowboat room." | Accurate as advice, and claims no right of way | None | `unverified` | Not read |

### Gate 7, vessel trawling

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Vessel trawling, making way" | Right | None | `unverified` | Rule 26(b), not read |
| Q1 explanation | Green over white is trawling, sidelight means making way | Accurate. At 35 m the extra masthead light is optional | None | `unverified` | Rule 26(b)(i) to (iii), not read |
| Q1 citation | "Rule 26(b)" | Right | None | `unverified` | Not read |
| Q1 phrase | "Green over white, trawling tonight." | Traditional rhyme, accurate | None | `unverified` | Not read |
| Q2 answer and options | "Keep out of her way and clear of her gear" | Right | None | `unverified` | Rule 18(a)(iii), not read |
| Q2 explanation | Power keeps out of the way of fishing and clear of the trawl | Accurate | None | `unverified` | Not read |
| Q2 citation | "Rule 18(a)(iii)" | Right | None | `unverified` | Not read |
| Q2 phrase | "Fishing boats stand on. Keep clear of the net." | Mild overreach. A fishing vessel must not impede in a narrow channel or a traffic lane (Rules 9(c), 10(i)) | Optional: "Keep clear of a fishing boat and her net." | `unverified` | Not read |

### Gate 7, fishing vessel with gear out

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Fishing, not trawling, gear out over 150 m, not making way" | Right | None | `unverified` | Rule 26(c), not read |
| Q1 explanation | Red over white, lower white to one side toward the gear, no sidelights | Accurate | None | `unverified` | Rule 26(c)(i) to (iii), not read |
| Q1 citation | "Rule 26(c)" | Right | None | `unverified` | Not read |
| Q1 phrase | "Red over white, fishing tonight." | Traditional rhyme, accurate | None | `unverified` | Not read |
| Q2 answer and options | "The side away from the extra white light" | Right | None | `unverified` | Rule 26(c)(ii), not read |
| Q2 explanation | The extra light shows the direction of gear over 150 m | Accurate | None | `unverified` | Not read |
| Q2 citation | "Rule 26(c)(ii)" | Right | None | `unverified` | Not read |
| Q2 phrase | "Stay off the side of the gear light." | Accurate | None | `unverified` | Not read |

### Gate 8, pilot vessel on duty

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Pilot vessel on duty, under way" | Right | None | `unverified` | Rule 29(a), not read |
| Q1 explanation | White over red, green sidelight, crossing from port | Accurate | None | `unverified` | Rule 29(a)(i), (ii), not read |
| Q1 citation | "Rule 29(a)" | Right | None | `unverified` | Not read |
| Q1 phrase | "White over red, pilot ahead." | Traditional rhyme, accurate | None | `unverified` | Not read |
| Q2 answer and options | "Stand on: she is crossing from your port side" | Right. Rule 18 gives a pilot vessel no special place | None | `unverified` | Rules 15, 17, 18, not read |
| Q2 explanation | No special place in Rule 18, crossing rule applies | Accurate | None | `unverified` | Not read |
| Q2 citation | "Rules 15, 17, 29" | Right | None | `unverified` | Not read |
| Q2 phrase | "A pilot boat has no special right of way." | Accurate. The Rules never use "right of way", so the game may prefer "stand-on" for consistency (a `ceo` wording call) | Optional: "A pilot boat gets no special rank." | `unverified` | Not read |

### Gate 8, seaplane on the water

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | Stem "Sidelights very far apart, low on the water." Keyed seaplane | The stem describes lights the player cannot see. The seaplane spawns at aspect +40°, so the code's `arcVisible` shows only her green sidelight and masthead light. A side calculation of the approach, assuming the player holds the leg heading at 3 to 13 m/s, puts the aspect at 31° to 66° when the question fires. That is still one sidelight. Rule 31 also gives a seaplane no light pattern of her own, so the Rules give no basis for identifying her by her lights | Tell the player what it is and ask only what to do, for example "A seaplane is taxiing toward you on your port bow." Or move the encounter to the day leg, where the aircraft is visible | `wrong` | Rules 21(b), 31, not read. Code lines 226 to 227, 242, 379 |
| Q1 explanation | "A seaplane shows lights as close as it can to a vessel's. Here the sidelights are on the wingtips..." | Rule 31 applies where it is impracticable to carry the prescribed lights. The wingtip placement describes this scene, not the rule | "Where a seaplane cannot carry a vessel's lights in the usual places, Rule 31 has her show lights as close to them as she can." | `unverified` | Rule 31, not read |
| Q1 citation | "Rule 31" | Right | None | `unverified` | Not read |
| Q1 phrase | "Lights too wide for a hull: a seaplane." | Teaches an identification rule that is not in the Rules, about lights the player cannot see | Drop it, or "A seaplane shows lights as close to a vessel's as she can." | `wrong` | Rule 31, not read |
| Q2 answer and options | "Hold course, expect her to keep well clear, and be ready to act" | Right for this geometry, because she is on your port bow showing her starboard side. See the judgment call | None | `unverified` | Rules 3(a), 3(e), 15, 17, 18(e), not read |
| Q2 explanation | "A seaplane on the water keeps well clear of all vessels. If risk of collision develops, the steering rules apply to her too." | Drops "in general". It also does not say how the steering rules then sort the two vessels. Once risk of collision exists she is a vessel propelled by machinery and is treated as power-driven, so Rule 15 decides by side | Wording in the judgment call below | `wrong` | Rule 18(e), not read |
| Q2 citation | "Rule 18(e)" | Right rule. The answer also rests on 3(a), 3(e), 15 and 17 | "Rules 18(e), 15, 17" | `unverified` | Not read |
| Q2 phrase | "Seaplanes keep clear of vessels." | Overreach. It drops "in general" and the risk-of-collision clause | "Seaplanes, in general, keep clear. Close in, the steering rules apply." | `wrong` | Rule 18(e), not read |

### Gate 9, not under command

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Not under command, making way" | Right. No masthead light, which matches Rule 27(a) | None | `unverified` | Rule 27(a), not read |
| Q1 explanation | Two all-round reds, sidelight means making way | Accurate | None | `unverified` | Rule 27(a)(i), (iii), not read |
| Q1 citation | "Rule 27(a)" | Right | None | `unverified` | Not read |
| Q1 phrase | "Red over red, the captain is dead." | Traditional rhyme, accurate in meaning. Whether it suits players aged 13 and up is a `ceo` and `ux-ui` call, not a rules call | None on the rules | `unverified` | Not read |
| Q2 answer and options | "Keep out of her way" | Right | None | `unverified` | Rule 18(a)(i), not read |
| Q2 explanation | Power-driven and sailing vessels keep out of her way | Accurate. A fishing vessel must also, so far as possible (18(c)) | None | `unverified` | Rule 18(a)(i), 18(b)(i), 18(c)(i), not read |
| Q2 citation | "Rule 18(a)(i)" | Right | None | `unverified` | Not read |
| Q2 phrase | "Not under command: everyone keeps clear." | Wrong. Rule 18 does not require a vessel restricted in ability to maneuver to keep clear of her, and Rules 9, 10 and 13 still apply | "Not under command: power, sail and fishing keep clear." | `wrong` | Rule 18, not read |

### Gate 9, vessel pushing ahead

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "A towboat pushing a barge ahead, head-on". One other option is "Vessel towing astern, tow under 200 m" | From ahead, a vessel towing astern with a tow under 200 m shows the same two masthead lights in a vertical line and sidelights. Her tow's sidelights show behind her. Only the depth of the second pair tells them apart | Add a cue to the stem, such as "Radar shows a long target ahead of her lights", or change the option to "Vessel towing astern, tow over 200 m" | `wrong` | Rules 24(a), 24(c), 24(e), 24(f), not read |
| Q1 explanation | Two masthead lights, second pair of sidelights at the barge's bow | Accurate under International rules. Inland is different (see Inland section) | None for International | `unverified` | Rules 24(c), 24(f)(i), not read |
| Q1 citation | "Rules 24(c), 24(f)" | Right | "Rules 24(c), 24(f)(i)" | `unverified` | Not read |
| Q1 phrase | "Two masthead lights and sidelights far out front: pushing ahead." | Accurate under International rules | None | `unverified` | Not read |
| Q2 answer and options | "Alter course to starboard, early and wide" | Right. A vessel pushing ahead is power-driven unless she is restricted in ability to maneuver | None | `unverified` | Rule 14(a), not read |
| Q2 explanation | "...the barge is far ahead of her lights." | The barge carries its own sidelights, so it is ahead of the towboat's masthead lights, not of all lights | "...the barge reaches far ahead of her masthead lights." | `unverified` | Not read |
| Q2 citation | "Rule 14(a)" | Right | None | `unverified` | Not read |
| Q2 phrase | "Head on with a tow. Turn to starboard, wide." | Accurate | None | `unverified` | Not read |

### Gate 10, restricted in ability to maneuver, by day

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Restricted in ability to maneuver: ball, diamond, ball". Others name NUC two balls, aground three balls, anchor one ball | Right. Each wrong option describes its own shapes accurately | None | `unverified` | Rules 27(a)(ii), 27(b)(ii), 30(a), 30(d), not read |
| Q1 explanation | "By day, shapes replace lights." | Wrong as a general statement. Lights are also required from sunrise to sunset in restricted visibility and may be shown at other times. The anchored boat's one ball is accurate | "By day, vessels show shapes. Ball, diamond, ball means restricted in ability to maneuver..." | `wrong` | Rule 20(b), 20(d), not read |
| Q1 citation | "Rules 20, 27(b)" | Right rules | "Rules 20(d), 27(b)(ii)" | `unverified` | Not read |
| Q1 phrase | "Ball, diamond, ball: restricted in ability to maneuver." | Accurate | None | `unverified` | Not read |
| Q2 answer and options | "Keep out of her way" | Right | None | `unverified` | Rule 18(a)(ii), not read |
| Q2 explanation | Her work limits her, so power keeps clear | Accurate | None | `unverified` | Rule 3(g), 18(a)(ii), not read |
| Q2 citation | "Rule 18(a)(ii)" | Right | None | `unverified` | Not read |
| Q2 phrase | "Restricted? Keep clear." | Accurate | None | `unverified` | Not read |

### Gate 11, vessel aground

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Vessel aground, 50 m or more" | Aground is right. "50 m or more" overreaches, because a vessel under 50 m may also show both anchor lights | "Vessel aground, probably 50 m or more" | `wrong` | Rule 30(a), 30(b), 30(d), not read |
| Q1 explanation | Two anchor lights, forward higher, plus two reds | Accurate | None | `unverified` | Rule 30(a), 30(d)(i), not read |
| Q1 citation | "Rule 30(a), 30(d)" | Right | None | `unverified` | Not read |
| Q1 phrase | "Anchor lights and red over red: she is aground." | Accurate | None | `unverified` | Not read |
| Q2 answer and options | "Slow down and stay well clear: the water near her is shallow" | Right as seamanship | None | `unverified` | Rules 2(a), 6(a), 8, not read |
| Q2 explanation | Aground marks shoal water, wide berth, check the chart | Accurate as seamanship | None | `unverified` | Not read |
| Q2 citation | "Rules 30(d), 2" | Rule 30(d) covers lights only. The duty comes from good seamanship and safe speed near hazards | "Rules 2(a), 6(a)(v), 6(a)(vi), 8" | `wrong` | Rule 6(a), not read (search lead agrees on the numbering) |
| Q2 phrase | "If she is aground, the shoal is right there." | Acceptable | None | `unverified` | Not read |

### Gate 12, dredge in a narrow channel

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Dredge at work: restricted, with an obstruction on one side" | Right. The code puts the two reds on the pipe side and the greens on the open side | None | `unverified` | Rule 27(b), 27(d), not read |
| Q1 explanation | Red, white, red; two reds obstruction; two greens pass | Accurate | None | `unverified` | Rule 27(d)(i), (ii), not read |
| Q1 citation | "Rules 27(b), 27(d)" | Right | None | `unverified` | Not read |
| Q1 phrase | "Two greens, pass this side. Two reds, blocked." | Accurate | None | `unverified` | Not read |
| Q2 answer and options | "The side with the two green lights, even if it is not your usual side" | Right. In the course geometry the greens are on the player's port side | None | `unverified` | Rules 9(a), 27(d), not read |
| Q2 explanation | Normally keep to starboard, but pass by the greens | Accurate. Rule 9(a) says "as is safe and practicable" | None | `unverified` | Not read |
| Q2 citation | "Rules 9(a), 27(d)" | Right | None | `unverified` | Not read |
| Q2 phrase | "Pass on the greens." | Accurate | None | `unverified` | Not read |

### Gate 13, constrained by her draft

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "Constrained by draft, inbound (International rules)" | Right | None | `unverified` | Rule 28, not read |
| Q1 explanation | Power-driven lights plus three reds, International only | Accurate. The signal is optional ("may"), so a vessel constrained by her draft may show only Rule 23 lights | Optional: "...three all-round reds, which she may show..." | `unverified` | Rule 28, not read |
| Q1 citation | "Rule 28" | Right | None | `unverified` | Not read |
| Q1 phrase | "Three reds in a line: constrained by draft." | Accurate under International rules | None | `unverified` | Not read |
| Q2 answer and options | "Keep to your starboard side of the channel and don't impede her" | Right | None | `unverified` | Rules 9(a), 18(d)(i), not read |
| Q2 explanation | Vessels other than NUC or RAM avoid impeding her. Keep to starboard | Accurate. Rule 18(d)(i) adds "if the circumstances of the case admit" | Optional: add that clause | `unverified` | Not read |
| Q2 citation | "Rules 9(b), 9(d), 18(d)" | Leaves out 9(a), which is the keep-to-starboard rule. Rule 9(b) applies only if your boat is under 20 m or sailing, which the game never states | "Rules 9(a), 9(d), 18(d)(i)", plus 9(b) once the player's boat is stated as under 20 m | `wrong` | Not read |
| Q2 phrase | "Do not impede a deep-draft ship." | Accurate | None | `unverified` | Not read |

### Gate 14, tug and tow seen from astern

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | "A tug towing astern, seen from astern, with her tow behind her" | Right. No wrong option fits, because the yellow light rules them out | None | `unverified` | Rules 21(d), 24(a)(iv), 24(e), not read |
| Q1 explanation | Yellow over white marks the tug, nearer white is the tow's sternlight, masthead lights hidden | Accurate | None | `unverified` | Rules 21(a), 21(c), 21(d), not read |
| Q1 citation | "Rules 21(c), 21(d), 24(a)" | Right | "Rules 21(c), 21(d), 24(a)(iv), 24(e)(ii)" | `unverified` | Not read |
| Q1 phrase | "Yellow over white: a tug, with her tow behind." | Accurate, but "behind" is ambiguous, because from the player's view the tow is the nearer light | Optional: "Yellow over white: a tug. Her tow is between you and her." | `unverified` | Not read |
| Q2 answer and options | "Stay clear, and never pass between the tug and her tow" | Right | None | `unverified` | Rules 2(a), 13(a), not read |
| Q2 explanation | You are overtaking; a towline joins the lights | Accurate | None | `unverified` | Not read |
| Q2 citation | "Rules 13, 24" | Rule 24 covers lights only. Not passing between is seamanship | "Rules 2(a), 13(a)" | `unverified` | Not read |
| Q2 phrase | "Never cut between a tug and her tow." | Accurate | None | `unverified` | Not read |
| Q3 answer and options | "Two prolonged blasts, then two short" | Right under International rules. Under Inland rules the "Two short blasts" option becomes the right one | None for International | `unverified` | Rule 34(c)(i), not read |
| Q3 explanation | Two prolonged and two short; agreement is prolonged, short, prolonged, short | Accurate. Rule 9(e)(i) uses the signal only when the overtaken vessel must act to let you pass | Optional: add "when she has to move over to let you pass" | `unverified` | Rules 9(e)(i), 34(c), not read |
| Q3 citation | "Rules 9(e), 34(c)" | Right | "Rules 9(e)(i), 34(c)(i), 34(c)(ii)" | `unverified` | Not read |
| Q3 phrase | "Two long, two short: I will overtake you on your port side." | The signal means "I intend to overtake", and she must agree first | "Two long, two short: I intend to overtake you on your port side." | `wrong` | Rule 34(c)(i), not read |
| Q3 horn | `PPSS` | Right, and applies in a narrow channel | None | `unverified` | Rule 34(c)(i), not read |

### Gate 15, fog signal, vessel unseen

| Item | Prototype says | Finding | Correct wording or citation if it changes | Status | Source |
| --- | --- | --- | --- | --- | --- |
| Q1 answer and options | Keyed "Not under command, restricted, constrained by draft, sailing, fishing, or towing". Others include "A vessel at anchor" | A vessel engaged in fishing at anchor, or a vessel restricted in ability to maneuver working at anchor, also sounds one prolonged and two short. So "A vessel at anchor" is a possible answer to "What could she be?". The keyed answer also leaves out pushing | Key "Not under command, restricted, constrained by draft, sailing, fishing, or towing or pushing". Replace the anchor option with "A vessel at anchor ringing her bell" or "A vessel stopped, two prolonged" | `wrong` | Rule 35(c), 35(d), 35(g), not read |
| Q1 explanation | One prolonged and two short covers all of those; sound alone can't tell which | Accurate | Add "including fishing or working at anchor" | `unverified` | Not read |
| Q1 citation | "Rule 35(c)" | Right | "Rule 35(c), 35(d)" | `unverified` | Not read |
| Q1 phrase | "One long, two short: she is limited somehow." | Loose, since a sailing vessel is grouped here without being restricted. Acceptable as a mnemonic | None | `unverified` | Not read |
| Q1 horn, the vessel's fog signal | `PSS` from a sailing vessel | Right | None | `unverified` | Rule 35(c), not read |
| Q2 answer and options | "Slow to bare steerage way, and don't turn to port for her" | Right as an answer, because the game has radar and she shows on it | None | `unverified` | Rule 19(d), 19(e), not read |
| Q2 explanation | "When you hear a fog signal forward of the beam, slow to the least speed you can steer at. Avoid turning to port for a vessel forward of the beam." | Joins two different triggers. Hearing a fog signal forward of the beam brings in 19(e): least steerage speed, all way off if needed, extreme caution. The limit on turning to port is 19(d)(i), for a vessel detected by radar and not in sight | "You hear her forward of the beam, so slow to the least speed you can steer at, and stop if you need to. She is on your radar and not in sight, so if you alter course, avoid turning to port for a vessel forward of the beam." | `wrong` | Rule 19(d)(i), 19(e), not read |
| Q2 citation | "Rules 19(d), 19(e)" | Right once the explanation is fixed | None | `unverified` | Not read |
| Q2 phrase | "Fog signal ahead: slow down, don't turn to port." | Acceptable once the explanation is fixed | None | `unverified` | Not read |
| Q3 answer and options | "One prolonged blast at least every 2 minutes" | Right. "At least every 2 minutes" means intervals of not more than 2 minutes | None | `unverified` | Rule 35(a), not read |
| Q3 explanation | Making way: one prolonged at intervals of not more than 2 minutes | Accurate | None | `unverified` | Not read |
| Q3 citation | "Rule 35(a)" | Right | None | `unverified` | Not read |
| Q3 phrase | "One prolonged blast, every two minutes." | Slightly loose, since the rule sets a maximum interval | Optional: "One prolonged blast, at least every two minutes." | `unverified` | Not read |
| Q3 horn | `P` | Right | None | `unverified` | Rule 35(a), not read |

## Judgment call 1: gate 6, the rowboat

Recommendation: keep the keyed answer "Slow down and pass well clear of her". Rewrite the explanation and the citation so the game does not claim either vessel has the right of way. All of the rule text below is the expected text, not read this session.

What the rules say, as expected:

- Rule 3(a) makes a vessel under oars a "vessel". Rule 3(b) defines a power-driven vessel as one propelled by machinery. Rule 3(c) defines a sailing vessel as one under sail with no machinery in use. A boat under oars is neither, so she has no Rule 3 category beyond "vessel".
- Rule 18 sets who keeps out of whose way for power-driven vessels, sailing vessels, vessels engaged in fishing, vessels not under command, vessels restricted in ability to maneuver, vessels constrained by draft and seaplanes. It does not name a vessel under oars on either side.
- Rule 12 covers only two sailing vessels. Rules 14 and 15 cover only two power-driven vessels. Neither applies here.
- Rule 13 covers any vessel overtaking any other. If the player were overtaking the rowboat, Rule 13 would make the player keep clear. Gate 6 is a crossing, so Rule 13 does not apply.
- Rules 16 and 17 apply only "where one of two vessels is to keep out of the way", that is, when another rule has assigned that duty. No rule assigns it here. So neither vessel is the stand-on vessel, and neither has a duty to hold course and speed.
- That leaves the rules that bind every vessel. Rule 2(a) covers the ordinary practice of seamen. Rule 7 covers risk of collision. Rule 8 requires action that is positive, in ample time, large enough to be readily apparent, and that results in passing at a safe distance. Under Rule 8(e) a vessel slackens speed or takes all way off if needed to avoid collision or allow more time. Rule 6 covers safe speed. All of these bind the rowboat too.
- In a narrow channel, Rule 9(b) would add that a vessel under 20 m must not impede a vessel that can navigate safely only inside the channel. Gate 6 is in open water.

The keyed answer is the action Rules 7 and 8 point to for the vessel that can maneuver far better. "Hold course and speed: she must keep clear" stays wrong, because no rule makes her keep clear. "Sound three short blasts" stays wrong as the response. If the player went astern, though, Rule 34(a) would call for three short.

Suggested wording:

- Explanation: "No steering rule ranks a vessel under oars. Rule 18 does not list her, and Rules 14 and 15 cover only two power-driven vessels, so neither of you is the stand-on vessel. Rules 7 and 8 bind you both. You can maneuver far better than she can, so act early: slow down and pass well clear."
- Citation: "Rules 2(a), 7, 8(a), 8(d), 8(e)".
- Phrase: keep "Slow down. Give the rowboat room."

## Judgment call 2: gate 8, the seaplane

Recommendation: keep the keyed answer to the second question for this geometry, but rewrite its explanation and phrase. Replace the first question, because it asks the player to identify the seaplane from lights the code does not show, by a cue the Rules do not give.

What the rules say, as expected:

- Rule 18(e) says a seaplane on the water shall, in general, keep well clear of all vessels and avoid impeding their navigation. Where risk of collision exists, she shall comply with the steering and sailing rules. The prototype drops "in general" in both the explanation and the phrase. A search lead agrees on that wording for Inland Rule 18(e).
- Rule 3(a) counts seaplanes as vessels, and Rule 3(e) defines a seaplane as any aircraft designed to maneuver on the water. A seaplane taxiing under her engine is propelled by machinery, so once risk of collision exists this checker reads her as a power-driven vessel for Rules 14 and 15. That last step is a reading of the definitions, not a quoted sentence. It goes to the NMC as an open question below.
- Here she is on the player's port bow showing her starboard side. If risk of collision develops, Rule 15 makes her the give-way vessel and Rule 17 makes the player stand on. So "Hold course... be ready to act" is right for this spawn. If she came from the starboard side, the same rules would make the player give way. The explanation should say so, so players do not learn that a seaplane always gives way.
- Rule 31 says only that where it is impracticable for a seaplane to show the prescribed lights in the prescribed positions, she shows lights as close in characteristics and position as possible. It says nothing about wingtips. Wingtip sidelights describe this scene, not the rule. Nothing in the Rules lets a mariner identify a seaplane from her lights, and at night the spacing of two sidelights cannot be judged without a known distance.

Suggested wording:

- Q1: replace it with a stem that names her, for example "A seaplane is taxiing on your port bow, showing a white light and her green sidelight." Then ask what to do. Or move her to the day leg.
- Q2 explanation: "A seaplane on the water should, in general, keep well clear and not impede vessels. If risk of collision develops, the steering rules apply to her like any power-driven vessel. She is on your port side, so she gives way and you stand on, ready to act."
- Q2 citation: "Rules 18(e), 15, 17".
- Q2 phrase: "Seaplanes, in general, keep clear. Close in, the steering rules apply."

## The previous session's corrections

| Correction | Finding | Status | Source |
| --- | --- | --- | --- |
| Green over white is trawling | Agrees | `unverified` | Rule 26(b)(i), not read |
| A sailing vessel shows sidelights and a sternlight and may add red over green | Agrees. Red over green is not shown with the combined lantern | `unverified` | Rule 25(a), 25(b), 25(c), not read |
| Three white masthead lights in a vertical line belong to the towing vessel when the tow exceeds 200 m | Agrees. The tow is measured from the tug's stern to the after end of the tow. In the code that is about 235 m | `unverified` | Rule 24(a)(i), not read |
| Red, white, red is restricted in ability to maneuver | Agrees | `unverified` | Rule 27(b)(i), not read |
| Three reds in a vertical line is constrained by draft, International only | Agrees. The signal is optional, and Inland has no Rule 28 signal | `unverified` | Rule 28, Inland Rule 28, not read |

## Inland differences that would change content

None of these is verified. Inland Rule N is 33 CFR 83.N. Where a search lead agrees, the row says so.

| Gate | Inland rule | What would change |
| --- | --- | --- |
| 1, 2 | Inland 34(a)(i), (ii) | Whistle signals are signals of intent between power-driven vessels meeting or crossing within half a mile. One short means "I intend to leave you on my port side", and the other vessel answers with the same signal if she agrees, or the danger signal if not. The explanations and phrases quoting "I am altering my course to starboard" would change. In gate 2, "No signal in sight of her" could be right if the vessels are more than half a mile apart |
| 1, 2, 3, 14 | Inland 34(h) | Vessels that agree by radiotelephone need not sound the whistle signals, but may. The signal questions would need that context |
| 1, 9 | Inland 14(d), Inland 9(a)(ii) | On the Great Lakes, Western Rivers and waters the Coast Guard specifies, a power-driven vessel downbound with a following current has the right of way over an upbound vessel. She proposes the manner of passage and starts the signals |
| 2, 3 | Inland 15(b) | On the same waters, a power-driven vessel crossing a river keeps out of the way of one going up or down the river |
| 4 | Inland 23(d) | On the Great Lakes, a power-driven vessel may show an all-round white light instead of the second masthead light and sternlight. A lone white light from astern may then be that light, not a sternlight |
| 4, 14 | Inland 34(c), Inland 9(e)(i) | Overtaking signals apply between power-driven vessels in sight of each other, not only in narrow channels. One short means "I intend to overtake you on your starboard side", two short means port side, and agreement is the same signal. Gate 14's keyed answer would become "Two short blasts", which is a wrong option today. Search lead agrees |
| 9, pushing | Inland 24(c)(iii), 24(f)(i), 24(i) | A vessel pushing ahead shows two yellow towing lights aft instead of a sternlight. The pushed barge shows sidelights and a yellow special flashing light at its forward end. On the Western Rivers above the Huey P. Long Bridge, the pushing vessel shows sidelights and two towing lights and no masthead lights. The vessel spec, explanation and phrase would change. Search lead agrees on 24(c)(iii) and 24(f)(i) |
| 10 | Inland 30, special anchorage areas | A vessel under 20 m at anchor in a designated special anchorage area need not show anchor lights or shapes. This affects only the anchored decor boat |
| 12 | Inland Annex V, 33 CFR part 88 | Floating dredge pipelines carry their own lights, a row of flashing yellow lights and red lights at the ends. The pipe in the prototype is unlit. The section number and wording are to be confirmed |
| 13 | Inland Rule 28 | No constrained-by-draft signal exists. The gate would need a different vessel, such as a deep-draft ship using only Rule 23 lights with Rules 9(b) and 9(d) |
| 9, 15 | Inland 35(c) | The one prolonged, two short list has no constrained-by-draft vessel, and it names restricted and fishing vessels "whether underway or at anchor". Gate 15's keyed answer would drop constrained by draft. Gate 9's "Constrained by draft" option would not exist. Search lead agrees |

Gates 5 to 8, 10, 11 and the trawling, sailing, pilot and not-under-command lights should read the same under both rule sets. That is unverified.

## Arc, geometry and horn checks

| Item | Prototype | Finding | Status | Source |
| --- | --- | --- | --- | --- |
| Masthead light | `abs(aspect) <= 112.5`, so 225° from right ahead to 22.5° abaft each beam | Matches the expected Rule 21(a) | `unverified` | Rule 21(a), not read |
| Sidelights | Starboard from -1.5° to 112.5°, port mirrored | 112.5° each plus a 1.5° overlap across the bow. Annex I lets the forward cut-off fall 1 to 3 degrees outside the sector, so 1.5° fits | `unverified` | Rule 21(b), Annex I section 9(a)(i), not read |
| Sternlight | `abs(aspect) >= 112.5`, so 135° over the stern | Matches the expected Rule 21(c). At exactly 112.5° the masthead light, the sidelight and the sternlight all show. Pick one convention for that boundary and test it | `unverified` | Rule 21(c), not read |
| Towing light | Same arc as the sternlight, yellow, above it | Matches the expected Rule 21(d) and 24(a)(iv) | `unverified` | Not read |
| All-round lights | Always visible | Matches the expected Rule 21(e) | `unverified` | Not read |
| Vertical order of lights | Aft masthead higher on the large ship; forward anchor light higher on the grounded ship; towing light above sternlight; red over green, white over red, green over white, red over white | All match the expected Rules 23(a)(ii), 30(a)(ii), 24(a)(iv), 25(c), 29(a), 26(b), 26(c). The start screen says vertical spacing is exaggerated | `unverified` | Not read |
| Tow length | Barge centre 220 m behind the tug centre, barge 60 m, tug 30 m | Tow from tug stern to the tow's after end is about 235 m, so three masthead lights is consistent | `unverified` | Rule 24(a)(i), not read |
| Gillnetter's gear light | 7 m to port of the red and white lights | Annex I section 4 is expected to set 2 to 6 m horizontally, not higher than the all-round white and not lower than the sidelights. Move it to 6 m or less | `wrong` | Annex I section 4, not read (search lead agrees) |
| Rule 22 ranges | Not modelled, apart from the oar torch showing inside 380 m | Disclosed on the start screen | `unverified` | Rule 22, not read |
| Blast lengths | Short 1 s, prolonged 4 s, 1 s gaps | Within Rule 32(b) and 32(c). The 4 s prolonged blast sits at the lower limit, and after its 0.06 s ramp and 0.1 s fade the full-volume part is about 3.84 s. Use 5 s | `verified` | Rule 32(b), (c), read directly 2026-10-20 (`arcade-regs-check-2026-10-20.md`, section 4) |
| Gap between blasts | 1 s in every signal | Rules 32 and 34 set no gap for these signals. Rule 35(b), two prolonged blasts when stopped, is expected to set about 2 seconds. It is only a wrong option today, but if a port ever plays it, use a 2 s gap. The fog interval is compressed from 2 minutes to 11 s, which the start screen discloses | `unverified` | Rule 35(b), not read |

## Start screen

| Item | Prototype says | Finding | Status | Source |
| --- | --- | --- | --- | --- |
| Eyebrow | "Rules of the Road · Lights and Shapes · Rules 20–31" | The lap also tests Rules 2, 6 to 9, 13 to 19, 32, 34 and 35. Suggest "Rules of the Road · Lights, shapes, steering and sound". Separately, and not a rules point, "one encounter at each" gate is not accurate, because gates 7, 8 and 9 each have two quizzed vessels | `wrong` | Not read |
| Light key | "masthead 225°, stern 135°, all-round 360°", "Red port 112.5°", "Green starboard 112.5°", "Yellow towing light" | Matches the expected Rule 21 | `unverified` | Rule 21, not read |
| Draft note and rule-set chip | "has not been checked against the official Navigation Rules text"; chip "International rules (COLREGS)" | Still true after this check, because no primary text was read. Keep the note until the flagged items are confirmed. Any change to its wording is a disclaimer question for `counsel` | `unverified` | Not read |
| Own vessel | Not stated anywhere | Rules 14, 15 and 18(a) apply to a power-driven vessel. Rule 34(a) applies to a power-driven vessel under way. Rule 9(b) applies to a vessel under 20 m. The keyed answers assume a power-driven vessel, and gate 5's answer says so. State it on the start screen, for example "You are driving a power-driven vessel under 20 m." | `wrong` | Rules 9(b), 14, 15, 18(a), 34(a), not read |

## Boundary cases for the port's tests

The first slice in #45 adds tests for the arc function. These cases follow from the findings above. Each test should cite its rule.

- Masthead light visible at aspects 0°, ±112.5°, and not at ±112.6° (Rule 21(a)).
- Starboard sidelight visible from -1.5° to 112.5° and not at -1.6°. Port mirrored (Rule 21(b), Annex I section 9).
- Sternlight and towing light visible at 180° and ±112.5°, and not at ±112.4° (Rule 21(c), 21(d)). Decide and document which lights show at exactly 112.5°.
- All-round light visible at every aspect (Rule 21(e)).
- Three masthead lights when the tow from the tug's stern exceeds 200 m, and two at exactly 200 m (Rule 24(a)(i)).
- Prolonged blast at least 4 s and not over 6 s at full volume. Short blast about 1 s (Rule 32).

## Open questions

For the NMC, through `uscg-regs`:

- When a power-driven vessel meets a vessel under oars and neither is overtaking, does the NMC treat the case under Rules 2, 7 and 8 only, with no stand-on vessel?
- Does the NMC treat a seaplane taxiing on the water as a power-driven vessel for Rules 14 and 15 once risk of collision exists?
- Do NMC exam answers treat two masthead lights as meaning "50 m or more", or as "50 m or more, or a smaller vessel carrying the optional light"?

For other roles:

- `ceo`: whether to keep "right of way" in player-facing text (gate 8) and the rhyme "the captain is dead" for players aged 13 and up (gate 9).
- `counsel`: the wording of the start-screen note once the check is complete.
- `architect`: if Et chooses an Inland variant, the encounter data needs a rule-set field. The vessel specs (gate 9 pushing, gate 12 pipeline), keyed answers (gates 1, 2, 14, 15) and whole encounters (gate 13) differ by rule set.

This check concerns Chapter 1 game content only. It touches no sea-time rule and does not release any license in the sea-time log.

## What would settle this check

1. Get a readable copy of the Coast Guard's Navigation Rules book, or of 33 CFR part 83 and the International text, from Et or from a session that can reach eCFR or NavCen.
2. Read each paragraph named in the `wrong` rows and the must-fix list first, then the remaining rows, and change each status to `verified` or `wrong`.
3. Record the date the text was read and the edition.
