# Decisions register

Settled in grilling sessions with Et on 2026-10-19 and 2026-10-20. The arcade game section comes from a second session on 2026-10-20, which also changed A3, the simulator and the flashcards. The same record lives in Sweet Potato at `docs/coordination/captains-academy-handoff.md`. From now on this file is the master copy.

Changes to a settled decision need an explicit call from Et. A parked item is not a decision; do not build on it.

Et settled the Chapter 1 follow-up decisions on 2026-10-22 from 7:11 to 7:17 AM PT. They are recorded in [PR #50's decision comment](https://github.com/Etdev2/Captains-academy-/pull/50#issuecomment-6343017518).

## Settled

### Product shape
- **A1.** The academy is a standalone product: its own repo, its own Supabase project (database and login). It shares nothing with Fish Log Book.
- **A2.** The academy owns the only sea-time log. Fish Log Book gets no sea-time feature.
- **A3.** Et parked the arcade-style track on 2026-10-22 (9:35-9:46 PM PT) to focus on the real training. Build order: finish Definitions (#47, branch `head-dev/ch1-definitions`) first, then Lights (#29). The arcade track (#45, #46 remainder, #56, PR #58) stays open but parked; resume only on Et's go. Et changed the earlier serial order on 2026-10-22 and again on 2026-10-23.
- **A4.** One academy login across the web app and the Unity app.

### Sea-time log
- **Licenses:** all of them, STCW included. Each license appears only after its rules are checked against the current regulations and tested.
- **Recording time:** live check-in and check-out; backfilled days are tapped on a calendar, with an hours range asked for each day (under 4, 4–8, 8–12, 12+). The app calculates credited days from stored times.
- **Waters:** GPS suggests inland, near coastal or Great Lakes; the user confirms.
- **Role aboard:** picked from a list, with an optional default per vessel. The list includes deck and engine jobs, because STCW is in scope.
- **Backfill:** allowed, and always labeled as backfilled, never as GPS-verified.
- **Vessels:** full record (name, registration or official number, gross tonnage, length, propulsion, owner, photo, horsepower) plus a tonnage estimator. Missing details can be filled in later, but must be complete before the forms print.
- **Eligibility wording:** "Your logged sea time appears to meet the requirement for X", plus a checklist of what's still needed (physical, drug test, TWIC, exam, courses). Never "you qualify."
- **Printouts:** CG-719S for vessels under 200 GRT; a pre-filled employer sea service letter for larger vessels, for the employer or master to review and sign.
- **Built as:** an offline-capable, phone-friendly web app that syncs later.

### Simulator
- **Realistic Unity simulator: parked.** The arcade game below replaces it as the game we build. The earlier choices (Unity; browser, desktop and mobile; real NOAA harbors; chart navigation and Rules of the Road as the first module) stand as notes for when it comes back. See the Parked list.
- **Simulator time is never sea time.** Proposed as a firm line; objections welcome. It covers the arcade game too.

### Flashcards
- **Colors mean real navigation-light colors.** Example: a red and a green light together means a vessel heading straight at you.
- **Scope:** night lights, day shapes and sound signals.
- **Each card asks:** what vessel is it, which way is it heading, and what should you do?
- **Study method:** spaced repetition.
- **Where:** a web version. The 3D cards inside a Unity app are parked with the simulator.
- **Mastery:** the flashcards and the arcade game share one mastery record per rule and situation (G9).

### Arcade game
The aim: a player who clears every level of a chapter can pass that part of the Coast Guard exam. Working title "Rules of the Road Arcade"; the real name is chosen with marketing.

The stack, decided in issue #18, is strict TypeScript, Phaser 4.2.1 (pinned) and Vite, web first. See [ADR 0001](../adr/0001-arcade-game-stack.md).

Build
- **G1.** A web game built with Phaser, separate from the realistic simulator. It lives in this repo at its own address (such as `/play`) and uses the academy login, Supabase project and mastery record.
- **G2.** 2D first: a top-down harbor for steering levels and a "bridge view" of lights on the horizon. 3D views come later only if players want them.
- **G3.** Players are 13 and up, to stay outside COPPA. The audience includes license candidates and cadets. `counsel` checks this before launch.
- **G4.** No account is needed to start playing. Progress saves on the device and works offline. Signing in with the academy login syncs progress and streaks across devices and joins leagues.

Chapters and levels
- **G5.** One chapter per exam subject: Chapter 1 Rules of the Road, then Navigation General, Deck General, Deck Safety, and Chart Plotting. The exam modules differ by license (OUPV takes Deck General and Safety as one module; Master under 100 GRT takes them as two), so each license badge lists the chapters it needs. Where a module differs by waters (near coastal versus Great Lakes and inland), the waters are a setting inside the level, the way G6 handles rule sets. Other licenses add chapters later.
- **G6.** Chapter 1 covers both Inland and International rules. Shared rules come first. Inland differences and International differences use separate levels, not a selector inside one level. Every level shows which rule set is in force.
- **G7.** Chapter 1 shared levels, in order: definitions and lookout (Rules 3 and 5), lights rapid-fire, day shapes, horn signals, pecking order (Rule 18), steady bearing (Rule 7), who gives way (Rules 13 to 17), and fog, traffic separation schemes and narrow channels (Rules 9, 10 and 19). A mixed-review stop follows level 5. After the shared levels come the separate Inland and International difference levels, another mixed-review stop, then the boss.
- **G8.** Level length and phone orientation depend on the level type. Rapid-fire levels play in portrait with one thumb; steering levels play in landscape. Mouse and keyboard work on desktop.
- **G9.** The game and the flashcards share one mastery record per rule and situation. A situation missed in one shows up in the other.
- **G10.** Each chapter's completion gate is a boss level in exam format: timed multiple-choice questions. A post-boss level does not replace that gate. The academy writes its own questions. For Chapter 1 it writes them from the official rule text (the Coast Guard's Navigation Rules book, which prints COLREGS and the Inland Rules in 33 CFR 83). The Coast Guard's sample exams are too few to reuse and some of their content may be copyrighted, so they guide question style only and nothing is copied from them. `uscg-regs` checks each Chapter 1 question against the current rule text and tags it with its rule number. Each later chapter's boss names its own source and citation, a CFR section where one applies, when that chapter is planned, and `uscg-regs` checks those questions the same way. The player clears the boss by scoring at the real module's passing mark on two separate runs: 90% for Rules of the Road, 70% for most other modules, and 90% for Chart Plotting, pending verification.
- **G10a.** Before the OUPV (six-pack) boss level is built, the NMC confirms the exam numbers and Q301 remains listed only under Limited OUPV (GLI08). The Q301 listing is already correct in `arcade-regs-check-2026-10-20.md`. A Coast Guard reviewer reviews the game before launch (Et decided this on 2026-10-20, 10:26 to 10:52 AM PT). For now `uscg-regs` is the only rules reviewer. G10a has no named human Coast Guard reviewer yet.
- **G10b.** Night Harbor Run is a later level after the Chapter 1 boss. It does not replace the timed multiple-choice boss.

Feel
- **G11.** A wrong answer costs one of three hull hearts and plays a replay of about 5 seconds that shows the right move and cites the rule. The missed situation comes back later in the level and in later levels.
- **G12.** Each level gives 1 to 3 stars (3 for no misses and a fast time). One star unlocks the next level. The boss needs 2 or more stars on every pre-boss level of the chapter. Mixed-review stops occur after level 5 and before the boss and follow the same star rules. The boss allows unlimited retries. Beating the Chapter 1 boss unlocks the later chapters. Ranks come from XP: Deckhand, Mate, First Mate, Captain, Admiral.
- **G13.** Engagement comes from skill-based rewards: effects and sounds on every correct answer, streaks with a streak freeze, a daily challenge, combo multipliers, a vessel logbook that fills as the player identifies vessels, and weekly leagues. No loot boxes or other random rewards, and nothing sold with random contents.
- **G14.** Notifications are off by default. A player who turns them on gets one daily reminder at a time they pick, plus a streak-saver alert before a streak ends. The tone is friendly and never guilt-trips.
- **G15.** The world is a night ocean where the real navigation lights are the bright colors. Wins flash gold and electric blue; misses flash purple or white with a camera shake. The interface never uses red or green, because those colors mean port and starboard.
- **G16.** Horn blasts use real lengths (a short blast about 1 second, a prolonged blast 4 to 6 seconds). Music builds with the player's combo. Every horn also shows as a visual pulse, so the game works muted and for deaf players.

Badges and the license screen
- **G17.** Chapter badges, such as "Rules of the Road Mastered", and license badges, such as "100-Ton Exam Ready", earned by clearing every chapter that license's exam covers. The 25, 50 and 100 GRT ratings share one exam, so "100-Ton Exam Ready" covers all three. An OUPV-to-Master upgrade takes one combined module and needs its own chapter mapping. The game never says "qualified."
- **G18.** One license screen per license shows the Exam Ready badge, the sea-time status ("appears to meet" plus what is still needed) and the rest of the checklist (physical, drug test, TWIC, courses).

Order
- **G19.** The Long Beach docking prototype proved the game direction. The arcade track is now parked (see A3); Chapter 1 continues with Definitions then Lights.
- **G19a.** #47 (Definitions) is the first Chapter 1 build: stage 0 is a docs-only `ux-ui` design pass (UI spec) plus a `uscg-regs` check of the 17 cards, then stage 1 build in small pull requests. #29 (Lights) follows. #46's remaining work is parked with the arcade track. Status 2026-10-23: #47 stage 1 has merged to `main` via PR #63.

Teaching
- **G20.** The game teaches with four methods from learning research. Perceptual learning: many fast visual examples, each classified by the player with instant feedback, until recognition is automatic. Retrieval practice: the player recalls every answer instead of rereading it. Spaced repetition: missed situations come back at growing intervals. Interleaving: levels mix situation types so the player learns to tell them apart. Every visual is paired with words and its citation: the rule number in Chapter 1, and the chapter's own source citation in later chapters (G10). Three rules keep it fun: all teaching happens through play, in the replay after a miss and a one-line rule citation; nothing stops the player for more than 5 seconds to read or watch; and a level that is correct but boring gets redesigned, never shipped.

## Open (parked by Elliott)
- **Course type:** Coast Guard-approved course with our exam, study aid first, or partner with an approved school.
- **Pricing:** what's free and what's paid. To decide with the marketing team.
- **Realistic Unity simulator and Unity 3D flashcards:** parked on 2026-10-20 in favor of the web arcade game. Revisit after the arcade game ships.
- **Arcade game name:** to choose with the marketing team.
- **League safety (idea, not decided):** leagues show only a display name and rank, with no chat or direct messages, because teenagers and strangers share them. Et asked to keep it in mind and decide later.

## To verify before building
The items below still need primary-source verification.
- Recency window for each license (commonly 90 days in the last 3 years; one source said 7 years).
- Tonnage thresholds for 25/50/100-ton Master ratings.
- Whether the Coast Guard has an accepted way to estimate tonnage for boats without an official figure.
- That Unreal Engine still has no web export (only matters if the Unity simulator comes back).
- What the Coast Guard requires to approve a course and its online proctored exam.
The 2026-10-20 follow-up verified both Rule 32 blast lengths. Et's supplied NMC guide, MCP-MA-NMC2-08(01) of August 2014, gives the exam tables. Chief Of Staff found that the NMC examinations page, refreshed in September 2026, still links that guide, and found no later notice that replaces it. See `arcade-regs-check-2026-10-20.md`.
- Get the NMC to confirm the guide's exam counts, passing marks, module mappings and the Q165 and Q352 upgrade conditions before the OUPV boss level is built (G10a). Chief Of Staff did not open the announcement PDFs or check the NVICs, MMIBs and CFR one by one.

## Next steps
1. Done on 2026-10-21: the verification command (`bash scripts/verify.sh`), the required checks (`verify` and `proof`) and the verification skill exist, and the academy moves to stage 1 when Et merges that pull request and its Sweet Potato registry entry.
2. Settle the parked items: course type and pricing.
3. Verify the figures listed above against the current regulations.
4. Done on 2026-10-21: the Long Beach docking prototype (G19) merged in #26, with twin engine levers and a second level. Et liked it and called it still a prototype; #25 stays open for later rounds.
5. Finish Definitions (#47) then Lights (#29) under A3, G19 and G19a; arcade track parked.
