# Decisions register

Settled in grilling sessions with Et on 2026-10-19 and 2026-10-20. The arcade game section comes from a second session on 2026-10-20, which also changed A3, the simulator and the flashcards. The same record lives in Sweet Potato at `docs/coordination/captains-academy-handoff.md`. From now on this file is the master copy.

Changes to a settled decision need an explicit call from Et. A parked item is not a decision; do not build on it.

## Settled

### Product shape
- **A1.** The academy is a standalone product: its own repo, its own Supabase project (database and login). It shares nothing with Fish Log Book.
- **A2.** The academy owns the only sea-time log. Fish Log Book gets no sea-time feature.
- **A3.** Build the sea-time log first. The one exception is a one-level arcade prototype, built before the log to test whether the game is fun (see G19).
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

Build
- **G1.** A web game built with Phaser, separate from the realistic simulator. It lives in this repo at its own address (such as `/play`) and uses the academy login, Supabase project and mastery record.
- **G2.** 2D first: a top-down harbor for steering levels and a "bridge view" of lights on the horizon. 3D views come later only if players want them.
- **G3.** Players are 13 and up, to stay outside COPPA. `counsel` checks this before launch.
- **G4.** No account is needed to start playing. Progress saves on the device and works offline. Signing in with the academy login syncs progress and streaks across devices and joins leagues.

Chapters and levels
- **G5.** One chapter per Coast Guard exam module: Chapter 1 Rules of the Road, then Navigation General, Deck General and Safety, and Chart Plotting. Other licenses add chapters later.
- **G6.** Chapter 1 covers both Inland and International rules. Shared rules come first; the differences get their own levels. Every level shows which rule set is in force.
- **G7.** Chapter 1 levels, in order: definitions and lookout, lights rapid-fire, day shapes, horn signals, pecking order (Rule 18), steady bearing (Rule 7), who gives way (Rules 13 to 17), fog and narrow channels (Rules 9, 10 and 19), then the boss.
- **G8.** Level length and phone orientation depend on the level type. Rapid-fire levels play in portrait with one thumb; steering levels play in landscape. Mouse and keyboard work on desktop.
- **G9.** The game and the flashcards share one mastery record per rule and situation. A situation missed in one shows up in the other.
- **G10.** Each chapter ends in a boss level in exam format: timed multiple-choice questions from the Coast Guard's published sample questions. `uscg-regs` checks each one against the current Inland Rules (33 CFR 83) and COLREGS and tags it with its rule number. The player clears the boss by scoring at the exam's passing mark on two separate runs.

Feel
- **G11.** A wrong answer costs one of three hull hearts and plays a replay of about 5 seconds that shows the right move and cites the rule. The missed situation comes back later in the level and in later levels.
- **G12.** Each level gives 1 to 3 stars (3 for no misses and a fast time). One star unlocks the next level. The boss needs 2 or more stars on every level of the chapter. Ranks come from XP: Deckhand, Mate, First Mate, Captain, Admiral.
- **G13.** Engagement comes from skill-based rewards: effects and sounds on every correct answer, streaks with a streak freeze, a daily challenge, combo multipliers, a vessel logbook that fills as the player identifies vessels, and weekly leagues. No loot boxes or other random rewards, and nothing sold with random contents.
- **G14.** Notifications are off by default. A player who turns them on gets one daily reminder at a time they pick, plus a streak-saver alert before a streak ends. The tone is friendly and never guilt-trips.
- **G15.** The world is a night ocean where the real navigation lights are the bright colors. Wins flash gold and electric blue; misses flash purple or white with a camera shake. The interface never uses red or green, because those colors mean port and starboard.
- **G16.** Horn blasts use real lengths (a short blast about 1 second, a prolonged blast 4 to 6 seconds). Music builds with the player's combo. Every horn also shows as a visual pulse, so the game works muted and for deaf players.

Badges and the license screen
- **G17.** Chapter badges, such as "Rules of the Road Mastered", and license badges, such as "100-Ton Exam Ready", earned by clearing every chapter that license's exam covers. The game never says "qualified."
- **G18.** One license screen per license shows the Exam Ready badge, the sea-time status ("appears to meet" plus what is still needed) and the rest of the checklist (physical, drug test, TWIC, courses).

Order
- **G19.** First build one playable level, lights rapid-fire. Et plays it and decides whether it is fun enough. Then the sea-time log (A3), then the full game.

## Open (parked by Elliott)
- **Course type:** Coast Guard-approved course with our exam, study aid first, or partner with an approved school.
- **Pricing:** what's free and what's paid. To decide with the marketing team.
- **Realistic Unity simulator and Unity 3D flashcards:** parked on 2026-10-20 in favor of the web arcade game. Revisit after the arcade game ships.
- **Arcade game name:** to choose with the marketing team.

## To verify before building
The regulation sites (ecfr.gov, law.cornell.edu) were unreachable from the session, so these figures come from Coast Guard guidance and training-school summaries.
- Recency window for each license (commonly 90 days in the last 3 years; one source said 7 years).
- Tonnage thresholds for 25/50/100-ton Master ratings.
- Whether the Coast Guard has an accepted way to estimate tonnage for boats without an official figure.
- That Unreal Engine still has no web export (only matters if the Unity simulator comes back).
- What the Coast Guard requires to approve a course and its online proctored exam.
- The passing score for the Rules of the Road exam module (commonly cited as 90%).
- Which exam modules each license requires, so license badges map to the right chapters.
- That the Coast Guard's published sample exam questions are public domain and free to use.
- The official lengths of short and prolonged blasts (Rule 32).

## Next steps
1. Write the academy's verification command and required checks, so it can leave stage 0.
2. Settle the parked items: course type and pricing.
3. Verify the figures listed above against the current regulations.
4. Build the one-level arcade prototype (G19) once the web lane's verification command exists.
