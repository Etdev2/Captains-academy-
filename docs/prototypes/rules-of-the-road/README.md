# Rules of the Road game: prototypes, mockups and builds

This page holds everything from the 21 to 22 October 2026 design and build session for Chapter 1 of the arcade game. It covers the game map, every mockup, the playable Night Harbor Run prototype, the two levels built on branches, wireframes with layout numbers, and what is still open. Every image sits in `images/` next to this file, so GitHub renders this page and any agent can open the files directly.

The original handoff PDF is in [`handoff/rules-of-the-road-handoff-2026-10-22.pdf`](handoff/rules-of-the-road-handoff-2026-10-22.pdf). This page carries the same content as text, so agents can read it without opening the PDF.

Nothing on this page is a settled decision unless [`docs/product/DECISIONS.md`](../../product/DECISIONS.md) says so. Build only on settled decisions. The rules content in every mockup and prototype is a draft until `uscg-regs` checks it against the current rule text.

![Night Harbor Run, a power-driven vessel head-on at night](images/night-harbor-run/02-head-on-lights.png)

## Contents

1. [Status at a glance](#1-status-at-a-glance)
2. [Moving to production](#2-moving-to-production)
3. [Product rules the game must keep](#3-product-rules-the-game-must-keep)
4. [The game map](#4-the-game-map)
5. [Chapter 1 mockups](#5-chapter-1-mockups)
6. [Content decks: lights and day shapes](#6-content-decks-lights-and-day-shapes)
7. [Harbor Run course design](#7-harbor-run-course-design)
8. [Night Harbor Run prototype](#8-night-harbor-run-prototype)
9. [Built: level 3 harbor course (#46)](#9-built-level-3-harbor-course-46)
10. [Built: Chapter 1, level 1 Definitions (#47)](#10-built-chapter-1-level-1-definitions-47)
11. [Wireframes with layout numbers](#11-wireframes-with-layout-numbers)
12. [Verification](#12-verification)
13. [Open questions, rules to check, corrections](#13-open-questions-rules-to-check-corrections)
14. [Files in this folder](#14-files-in-this-folder)

## 1. Status at a glance

| Piece | Where it lives | State | Ticket |
| --- | --- | --- | --- |
| Docking levels 1 and 2 at `/play` | `main` | Merged before this session | #25, #26 |
| Level 3, harbor course with traffic | branch `head-dev/harbor-traffic-course` | Built, `verify.sh` green, proof committed, no pull request | #46 |
| Chapter 1, level 1 Definitions at `/rules` | branch `head-dev/ch1-definitions` | Built, `verify.sh` green, proof committed, no pull request | #47 |
| Night Harbor Run | [`playable/night-harbor-run.html`](playable/night-harbor-run.html) | Prototype Et approved. Not part of the app build | #45 |
| Chapter 1 mockups, content decks, Harbor Run course design | `images/` in this folder | Mockups only | none |

Merge note: both branches edit `.claude/skills/verify-captains-academy/drive.mjs`, its `SKILL.md` and `features/README.md`. Whichever merges second needs those files merged by hand and a fresh proof bundle. Keep `LEVER_HALF = 135` from #46.

## 2. Moving to production

Each piece below names where it goes in the app and what has to happen first. Nothing here changes a decision.

| Piece | Lands in | Blocked on |
| --- | --- | --- |
| Level 3 harbor course | `/play`, from `head-dev/harbor-traffic-course` | Et opens and merges the pull request. `uscg-regs` checks the four traffic lessons (Rules 5, 6, 9, 14, 15) |
| Definitions level | `/rules`, from `head-dev/ch1-definitions` | Et opens and merges the pull request. `uscg-regs` checks all 17 cards and their Rule 3 citations |
| Night Harbor Run | A Phaser port inside `/play`, per issue #45's first slice: the Rule 21 arc renderer with unit tests and three gates (head-on, crossing from starboard, overtaking) | The ten must-fix items in the regs check, and Et's calls on sequencing, rule set, audience and the boss (#45) |
| Lights level (Chapter 1, level 2) | Portrait rapid-fire on `src/sim/rapid.ts` from #47, with a bridge view that draws only lights whose Rule 21 arcs face the player | #47 merged, the lights deck checked by `uscg-regs`, a playtest of level 1 |
| Levels 3 to 8 and the boss | Mockups only | Design per level, and the G10 boss question in #45 |

Two parts of #47 are written to be reused: the pure rapid-fire logic in `src/sim/rapid.ts` (shuffle, combo, hearts, miss return, stars) and the per-card mastery record in `src/game/storage.ts`. Later rapid-fire levels (lights, day shapes, horn signals) need a new deck file and a new drawing, not a new engine.

## 3. Product rules the game must keep

From [`docs/product/DECISIONS.md`](../../product/DECISIONS.md).

| Rule | What it means for engineering |
| --- | --- |
| G1, ADR 0001 | Strict TypeScript, Phaser 4.2.1 pinned exactly, Vite. `src/sim` is pure and deterministic, with no Phaser, DOM, `Math.random`, `Date` or `performance.now`. Golden replays are required |
| G6 | Every level shows which rule set is in force: Inland, International or both |
| G7 | Chapter 1 order is definitions, lights, day shapes, horn signals, pecking order, steady bearing, who gives way, fog and narrow channels, then the boss |
| G8 | Rapid-fire levels play portrait with one thumb. Steering levels play landscape. Mouse and keyboard work on desktop |
| G9 | One mastery record per rule and situation, shared with the flashcards |
| G10 | The boss is in exam format. The player passes at the module mark (90% for Rules of the Road) on two runs. `uscg-regs` checks every question |
| G11, G12 | Three hull hearts. A miss plays a replay of about 5 seconds and the situation comes back. 1 to 3 stars, and one star unlocks the next level |
| G15, G16 | The interface never uses red or green, because those colors mean port and starboard. Every sound has a visual partner |
| A3 and guardrails | Game time never counts as sea time. The game never says a player qualifies |

## 4. The game map

One chapter per exam module (G5). Each chapter is a port on a chart, its levels are buoys along the channel, and the boss is the harbor entrance. Three level types repeat across chapters.

| Level type | Phone | Teaches by |
| --- | --- | --- |
| Rapid-fire | Portrait, one thumb | Fast classification of what the player sees, with instant feedback |
| Steering | Landscape, twin levers | Applying a rule under time pressure |
| Plot | Landscape or tablet | Working chart problems (Chapter 5) |

| Chapter | Exam subject | Level ideas (draft) |
| --- | --- | --- |
| 1 | Rules of the Road | Definitions, lights, day shapes, horn signals, Rule 18 pecking order, Rule 7 steady bearing, Rules 13 to 17, fog and narrow channels, boss |
| 2 | Navigation General | Buoy run, compass correction (TVMDC), tides and currents, weather and electronics |
| 3 | Deck General | Docking (the Long Beach prototype), anchoring scope, knots, stability, towing |
| 4 | Deck Safety | Man overboard turn, fire classes, VHF calls, distress signals, pollution placards |
| 5 | Chart Plotting | Plot problems: latitude and longitude, distance, dead reckoning, fixes, set and drift |

<img src="images/mockups/ch1-map.jpg" alt="Chapter 1 map with cleared levels in gold, the next level glowing and the boss locked" width="260">

Proposals still waiting on Et:

- Clearing Chapter 1 unlocks Chapters 2 to 4 in any order, and Chapter 5 after Chapter 2.
- A mixed-review stop every 2 to 3 levels.
- Inland and International "differences" levels after horn signals and after narrow channels.
- Topics that cannot be made fun go to the flashcards instead of a level (G20).

## 5. Chapter 1 mockups

Mockups, not built. One screen per level. Portrait screens are rapid-fire. Landscape screens are steering levels with a lever under each thumb.

| | | | |
| --- | --- | --- | --- |
| <img src="images/mockups/ch1-01-definitions.jpg" alt="Level 1 Definitions" width="190"> | <img src="images/mockups/ch1-02-lights.jpg" alt="Level 2 Lights" width="190"> | <img src="images/mockups/ch1-03-day-shapes.jpg" alt="Level 3 Day shapes" width="190"> | <img src="images/mockups/ch1-04-horn-signals.jpg" alt="Level 4 Horn signals" width="190"> |
| 1. Definitions. Tap what the vessel is | 2. Lights. What is she, and which way is she heading | 3. Day shapes. Gold flash and a rule line on a right answer | 4. Horn. Hold to sound, with real blast lengths |
| <img src="images/mockups/ch1-05-pecking-order.jpg" alt="Level 5 Pecking order" width="190"> | <img src="images/mockups/ch1-replay-steering-miss.jpg" alt="Steering miss replay" width="190"> | <img src="images/mockups/ch1-replay-lights-miss.jpg" alt="Lights miss replay" width="190"> | <img src="images/mockups/ch1-boss-exam.jpg" alt="Boss exam" width="190"> |
| 5. Rule 18. Flick away the vessel that gives way | A steering miss. Head-on replay, Rule 14 | A lights miss. The pattern is said out loud | Boss. Timed multiple choice at 90% |

| Level | Mockup |
| --- | --- |
| 6. Steady bearing, Rule 7 | ![Level 6 Steady bearing](images/mockups/ch1-06-steady-bearing.jpg) |
| 7. Crossing, Rules 13 to 17 | ![Level 7 Who gives way](images/mockups/ch1-07-who-gives-way.jpg) |
| 8. Fog, Rule 19 | ![Level 8 Fog](images/mockups/ch1-08-fog.jpg) |

## 6. Content decks: lights and day shapes

Mockups, not built. These are the patterns each level draws from, and the lists `uscg-regs` checks.

The lights deck has 17 patterns from Rules 23 to 30. Inland-only patterns go to a later differences level.

![Lights deck, 17 patterns from Rules 23 to 30](images/decks/lights-deck.jpg)

The day shapes deck has every ball, cone, diamond and cylinder, with rule numbers.

![Day shapes deck](images/decks/day-shapes-deck.jpg)

## 7. Harbor Run course design

Mockup, not built. A race course on the Long Beach prototype with eight checkpoints, vessels showing day shapes, a dredge fork where steering is the answer, and a docking finish. It became the basis for level 3 (section 9).

![Harbor Run, the full course](images/harbor-run/course.jpg)

| | | |
| --- | --- | --- |
| ![Pass the dredge on the diamond side](images/harbor-run/dredge-diamond-side.jpg) | ![Call the vessel while steering](images/harbor-run/call-while-steering.jpg) | ![Finish with splits, stars and a ghost](images/harbor-run/finish-splits.jpg) |
| Pass the dredge on the diamond side | Call the vessel while steering | Finish with splits, stars and a ghost race |

## 8. Night Harbor Run prototype

Prototype. One self-contained HTML file using a plain canvas, with no backend, for desktop and phone. One night lap runs through 15 gates, and each gate triggers an encounter. The rule set is International (COLREGS) throughout. Distances, Rule 22 ranges and fog-signal intervals are compressed. Vertical light spacing is exaggerated so it reads on a phone.

To play it, download [`playable/night-harbor-run.html`](playable/night-harbor-run.html) and open it in a browser. GitHub shows the source, not the game. The file loads the Barlow fonts from Google Fonts and falls back to system fonts offline. It is not part of the Vite build and does not deploy with the app.

### Light rendering (Rule 21)

For each light the game computes the observer's aspect, which is the bearing from the vessel to the player relative to the vessel's heading. A light draws only if its arc covers that aspect:

- masthead light: within 112.5 degrees either side of ahead, 225 degrees in total
- starboard sidelight: from ahead to 112.5 degrees on the starboard side, and the port sidelight mirrors it
- sternlight and towing light: within 67.5 degrees of astern, 135 degrees in total
- all-round lights: always

Each light is placed from its fore-and-aft and athwartships offset, so range lights and sidelight spacing show the vessel's heading. The lights change as the player moves around a vessel.

### Encounter at each gate

The game pauses at about 270 m, or earlier when the player taps CALL IT for a bonus. It asks what the vessel is, what to do, and the sound signal where one applies. Feedback shows the right answer, the rule and a short phrase that is also spoken. Collisions, crossing a towline, the dredge pipeline and the shoal cost points.

| Gate | Encounter | Rules |
| --- | --- | --- |
| 1 | Power-driven under 50 m, head-on | 14, 34(a) |
| 2 | Power-driven 50 m or more, crossing from starboard | 15, 16, 34(a) |
| 3 | Power-driven crossing from port, five short blasts | 15, 17, 34(d) |
| 4 | Overtaking, sternlight only | 13 |
| 5 | Sailing vessel, red over green | 25, 18 |
| 6 | Vessel under oars, torch | 25(d) |
| 7 | Trawler, then a gillnetter with a gear light | 26(b), 26(c) |
| 8 | Pilot vessel, then a seaplane | 29, 31, 18(e) |
| 9 | Not under command, then a towboat pushing ahead | 27(a), 24(c), 14 |
| 10 | Day leg: RAM ball-diamond-ball, and an anchored ball | 20, 27(b) |
| 11 | Aground at night on a shoal | 30(d) |
| 12 | Dredge in the narrow channel | 9, 27(d) |
| 13 | Constrained by draft, inbound | 28, 9, 18(d) |
| 14 | Tug and tow from astern, overtaking signal | 24, 13, 34(c) |
| 15 | Fog: one prolonged and two short, unseen | 35, 19 |

`uscg-regs` checked every answer, explanation, citation and spoken phrase against the printed rules on 2026-10-22, in [`night-harbor-run-regs-check-2026-10-22.md`](../../product/night-harbor-run-regs-check-2026-10-22.md). The sources were the Coast Guard's Navigation Rules Handbook (corrected 12 August 2024), NavCen's amalgamated rules page, and 33 CFR parts 80, 83, 84 and 88 on eCFR. Of 190 items, 167 are `verified` and 23 are `wrong`, and ten must be fixed before any port. The Coast Guard and the NMC still have the last word; the check lists three questions for the NMC.

![Night Harbor Run course layout: 15 gates, a day leg for shapes, a narrow channel on legs 12 to 14 and a fog leg played by sound only](images/night-harbor-run/course-layout.png)

| | |
| --- | --- |
| ![Start screen with light arcs, controls and the draft note](images/night-harbor-run/01-start-screen.png) | ![Called early: what is she?](images/night-harbor-run/03-call-it-question.png) |
| Start screen with light arcs, controls and the draft note | Called early. What is she? |
| ![Answer with the rule and the spoken phrase](images/night-harbor-run/04-answer-and-rule.png) | <img src="images/night-harbor-run/05-phone.png" alt="Phone, portrait" width="240"> |
| Answer with the rule and the spoken phrase | Phone, portrait |
| ![Crossing from starboard](images/night-harbor-run/06-crossing-from-starboard.png) | ![Sailing vessel](images/night-harbor-run/07-sailing-vessel.png) |
| Crossing from starboard | Sailing vessel |
| ![Day leg, shapes](images/night-harbor-run/08-day-leg-shapes.png) | ![Dredge in the channel](images/night-harbor-run/09-channel-dredge.png) |
| Day leg, shapes | Dredge in the channel |
| ![Tug and tow from astern](images/night-harbor-run/10-tug-and-tow-from-astern.png) | ![Fog leg](images/night-harbor-run/11-fog-leg.png) |
| Tug and tow from astern | Fog leg, by sound |

## 9. Built: level 3 harbor course (#46)

Built on branch `head-dev/harbor-traffic-course`, not merged. A third level in `/play` has five gates in order (three round anchored boats), then docking. Traffic runs fixed tracks, and any contact ends the run with a banner naming the vessel and its lesson. The ferry meets the player head-on and turns to its own starboard, so a turn to port steers into it.

Architecture:

- `src/sim/mission.ts` adds optional `gates` (line segments) and `traffic` (name, kind, length, beam, speed, `startAfterGate`, lesson, path), checked with zod.
- `src/sim/course.ts` holds integer track poses, hull circles and an integer segment-crossing test. Lengths use `Math.sqrt`, which every engine rounds correctly.
- `src/sim/sim.ts` adds optional `course` state (gates passed, start frame per vessel, struck-by index). Levels without a course serialize and hash exactly as before, so the three older golden replays are byte for byte unchanged. The slip counts only after the last gate.
- `src/game/HarborScene.ts` draws gates (gold for the next one, dim once passed), top-down traffic with navigation lights, chart dots, a pointer to the next gate, a "Gate n of 5" HUD and the hit banner with its lesson. Debug state adds `xMm`, `yMm`, `gate`, `gates` and `struckBy`.

| Vessel | Size (m) | Speed (m/s) | Starts | Lesson on hit (draft) |
| --- | --- | --- | --- | --- |
| Container ship | 60 x 11 | 3.5 | start | A ship in the channel can't stop or turn for you. Stay out of her way (Rule 9). |
| Powerboat | 10 x 3.5 | 4.5 | gate 2 | She crossed from your starboard side, so you give way. Slow down or pass astern (Rule 15). |
| Ferry | 30 x 8 | 4 | gate 4 | Head-on, both boats turn to starboard and pass port to port (Rule 14). |
| Kayak | 4 x 0.9 | 1.2 | gate 4 | Small craft are hard to see. Keep a lookout and slow down near them (Rules 5 and 6). |

The world is 300 x 230 m. Par is 150 s for three stars. The golden replays are `long-beach-traffic-docks`, where a scripted helmsman docks in about 205 s, and `long-beach-traffic-hit-by-ferry`, which turns to port and is struck by the ferry.

![Level 3 course layout from the mission file](images/built/level-3-layout.png)

| | |
| --- | --- |
| ![Level 3 start, gate 1 is the breakwater gap](images/built/04-level-3-course-start.png) | ![Stopped in the container ship lane](images/built/05-level-3-container-ship.png) |
| Level 3 start. Gate 1 is the breakwater gap | Stopped in the container ship lane |
| ![Hit by the container ship, with the Rule 9 lesson](images/built/06-level-3-hit-by-ship.png) | ![Level 1 docking on main](images/built/01-level-1-docking-desktop.png) |
| Hit by the ship, with its name and the Rule 9 lesson | Level 1 docking on `main`, for comparison |
| ![Level 1 docking on a phone in landscape](images/built/02-level-1-docking-phone-landscape.png) | ![Level 2 crosswind slip](images/built/03-level-2-crosswind-slip.png) |
| Level 1 docking on a phone in landscape (`main`) | Level 2 crosswind slip (`main`) |

## 10. Built: Chapter 1, level 1 Definitions (#47)

Built on branch `head-dev/ch1-definitions`, not merged. A new page at `/rules/`, linked from the front page and offline like the others. Portrait, one thumb, and keys 1 to 6 on desktop.

Architecture:

- `src/sim/rapid.ts` holds the pure rapid-fire logic. It has a seeded Mulberry32 shuffle and 3 hearts. A right answer scores 100 times the combo, up to 5 times. A miss puts the card back 3 cards later. The outcome is cleared or out of hearts. Stars are 3 for no misses inside par (75 s, counting question time only), 2 for one miss, and 1 for clearing.
- `src/sim/chapter1/definitions.ts` has 6 categories and 17 cards (id, art, cue, answer, rule, reason, rule set).
- `src/game/rapid/DefinitionsScene.ts` and `vesselArt.ts` hold the Phaser scene and the top-down drawings. `src/game/storage.ts` adds a mastery record per card id.

| Card id | Cue | Answer | Rule |
| --- | --- | --- | --- |
| `rule3:motorboat` | Motoring across the harbor | Power-driven | 3(b) |
| `rule3:container-ship` | Container ship under way at sea | Power-driven | 3(b) |
| `rule3:sailing` | Sails full, engine off | Sailing | 3(c) |
| `rule3:spinnaker` | Racing downwind under spinnaker | Sailing | 3(c) |
| `rule3:motorsailing` | Sails up, engine running | Power-driven | 3(c) |
| `rule3:sails-furled` | Sails furled, motoring home | Power-driven | 3(b) |
| `rule3:trawler` | Towing a trawl net astern | Engaged in fishing | 3(d) |
| `rule3:longliner` | Setting a longline over the stern | Engaged in fishing | 3(d) |
| `rule3:trolling` | Trolling two lines for salmon | Power-driven | 3(d) |
| `rule3:engine-failed` | Engine failed, drifting | Not under command | 3(f) |
| `rule3:steering-failed` | Steering gear broken, circling | Not under command | 3(f) |
| `rule3:buoy-tender` | Lifting a navigation buoy aboard | Restricted in ability to maneuver | 3(g)(i) |
| `rule3:dredge` | Dredging the channel | Restricted in ability to maneuver | 3(g)(ii) |
| `rule3:divers` | Tending divers working below | Restricted in ability to maneuver | 3(g)(ii) |
| `rule3:heavy-tow` | Heavy tow, she can't turn off her course | Restricted in ability to maneuver | 3(g)(vi) |
| `rule3:replenishment` | Transferring cargo to another ship, under way | Restricted in ability to maneuver | 3(g)(iii) |
| `rule3:deep-draft` | Deep tanker in a narrow channel, little water under her | Constrained by her draft | 3(h), International |

| | | |
| --- | --- | --- |
| ![A card, phone upright](images/built/07-rules-level-1-definitions-card.png) | ![A miss, heart lost and a 5 s replay with the rule](images/built/08-rules-level-1-miss-replay.png) | ![Cleared with two stars](images/built/09-rules-level-1-cleared.png) |
| A card, phone upright | A miss. A heart is lost and a 5 s replay shows the rule | Cleared with two stars |

![All 17 vessel drawings](images/built/10-rules-level-1-all-17-vessels.jpg)

Screen flow:

```mermaid
flowchart LR
  Q[Question] --> R["Right: +points, 380 ms"]
  Q --> M["Miss: heart -1, replay 5 s"]
  R --> N[Next card]
  M --> N
  N -->|queue not empty| Q
  N --> C["Cleared: stars saved"]
  M --> O["Out of hearts: 0 stars"]
```

## 11. Wireframes with layout numbers

Grayscale wireframes drawn from the coordinates in the code. The numbers an engineer needs are listed under each one as text.

### `/play` docking and course levels (landscape)

![Wireframe of /play in landscape](images/wireframes/play-landscape.png)

- Game space 1280 x 768, Phaser `Scale.FIT`.
- Levers at x 96 and x 1184. Stop at y 473. Track 338 to 608 on #46, 298 to 648 on `main`.
- Level buttons at x 16, y 128 + 56n.
- A gold arrow on a 130 px ring points to the next gate or the slip.
- Keys: W/S or the arrows move both levers, A/D split them, Q/Z port, E/C starboard, X stop, H horn, M sound, Enter retry.
- On a portrait phone a rotate prompt shows and the sim pauses.

### `/rules` rapid-fire level (portrait)

![Wireframe of /rules in portrait](images/wireframes/rules-portrait.png)

- Game space 720 x 1280, portrait, Phaser `Scale.FIT`.
- Card at x 30, y 170, 660 x 520.
- Buttons 322 x 112 with a 16 gap, in columns at x 30 and x 368, first row at y 790. Button n centre is (191 or 529, 846 + 128 x row).
- Keys 1 to 6 answer. Enter skips the replay.
- A miss shows a purple replay over the card for 5 s, and a tap skips it after 0.8 s. The right button turns gold and the wrong pick purple. The card returns 3 cards later.
- A right answer scores 100 times the combo (up to 5 times), then a 380 ms pause.
- The end overlay shows stars, Play again and Home.
- State is exposed on `window.__captainsAcademyQuiz`.

### Night Harbor Run (landscape, stacks on a phone)

![Wireframe of Night Harbor Run](images/wireframes/night-harbor-run.png)

- The horizon sits at 42% of the height (36% in portrait). Field of view is 70 to 100 degrees, 62 in portrait.
- The quiz sheet rises from the bottom when paused: step n of 3, the question, 4 options, then feedback, the spoken phrase and the rule.

## 12. Verification

1. Install with `npm ci`. If the lockfile must change, use `npx npm@11.21.0 install`, because npm 10 fails on this dependency tree.
2. `bash scripts/verify.sh` runs npm ci, tsc with strict flags, ESLint with import boundaries, Prettier, mission validation, Vitest with golden replays, the Vite build, Playwright on desktop, phone landscape and phone portrait, and npm audit. It passed on both branches.
3. Drive the real build with `.claude/skills/verify-captains-academy/control.sh launch | doctor | drive STEPS.json | stop`. The recipes are `harbor-course.steps.json` (#46) and `definitions.steps.json` (#47).
4. Every pull request commits a PASS proof bundle from `scripts/write-proof.sh`, and CI runs `scripts/check-proof.sh`. Agents clock in and out on time cards in `agent-resources/timecards/`.
5. Golden replay files change only on purpose, with `VERIFY_UPDATE_REPLAYS=1 bash scripts/verify.sh`.

| Test | Covers |
| --- | --- |
| `tests/course.test.ts` | Gate crossing, traffic tracks and start triggers, the slip waiting for the last gate, a traffic hit at rest, the ferry replay |
| `tests/replays.test.ts` | Five golden replays, with the older three unchanged |
| `tests/rapid.test.ts` | Shuffle determinism, combo, miss return, hearts, stars, deck integrity, the answer key in step with the deck |
| `e2e/play.spec.ts` | Level 3 opens after level 2 and counts gate 1 |
| `e2e/rules.spec.ts` | A clean run with 3 stars, a miss and its replay, out of hearts, on all three device projects |
| `e2e/home.spec.ts` | The front page has three links |

## 13. Open questions, rules to check, corrections

Waiting on Et (issue #45):

1. Sequencing. A3 and G19 put the sea-time log before the full game. Building Chapter 1 now was taken as Et's call and needs confirming.
2. Rule set. International only, or an Inland variant too?
3. Audience. License candidates, Coast Guard Academy cadets, or both?
4. Boss. Does the race course replace the G10 multiple-choice boss, or run alongside it?
5. Whether to open pull requests for #46 and #47.

Rules content still to check by `uscg-regs` against 33 CFR 83 and COLREGS:

- All 17 Definitions cards: answers, reasons and Rule 3 citations.
- The level 3 traffic lessons citing Rules 5, 6, 9, 14 and 15.
- The Night Harbor Run answers are checked in [`night-harbor-run-regs-check-2026-10-22.md`](../../product/night-harbor-run-regs-check-2026-10-22.md). The rowboat answer stands under Rules 2(b), 7 and 8. The seaplane question must change, because the code does not draw the wingtip sidelights it asks about, and the explanation must keep Rule 18(e)'s "in general".
- G10a. NMC confirms the exam numbers, and a Coast Guard reviewer reviews the game, before the OUPV boss and launch.

Corrections made during the session. Green over white is trawling. A sailing vessel shows sidelights and a sternlight and may add red over green. Three white masthead lights belong to the towing vessel when the tow is over 200 m, not to the vessel being towed. Red-white-red is restricted in ability to maneuver. Three reds is constrained by draft, International only.

Known limits:

- The level 3 golden replay helmsman is slow (about 205 s against a 150 s par), so a skilled player beats it.
- The lever tracks on #46 are shorter (half-travel 135 instead of 175) to fit the LEVEL 3 button.

## 14. Files in this folder

| Path | What it is |
| --- | --- |
| `handoff/rules-of-the-road-handoff-2026-10-22.pdf` | The original 25-page handoff PDF |
| `handoff/prototype-book-2026-10-25.pdf` | The 16-page prototype book, as supplied to the review gallery (#72) |
| `playable/night-harbor-run.html` | The Night Harbor Run prototype. Download and open in a browser. SHA-256 `b0f14e5beee0f8d9bd0325c1278c655b1da98194047561394d4f50b267b64d73` |
| `images/mockups/` | Chapter 1 map and the eleven level mockups |
| `images/decks/` | Lights deck and day shapes deck |
| `images/harbor-run/` | Harbor Run course design |
| `images/night-harbor-run/` | Night Harbor Run screenshots and course layout |
| `images/built/` | Screenshots from the production build driven by the verification skill, and the level 3 layout |
| `images/wireframes/` | Grayscale wireframes for `/play`, `/rules` and Night Harbor Run |

The mockups, decks and Harbor Run images were rendered from a private Claude design canvas. The built screenshots come from the production build driven by `verify-captains-academy`. The wireframes and layouts were drawn from coordinates in the code and the mission file.
