# Decisions register

Settled in a grilling session with Et on 2026-10-19 and 2026-10-20. The same record lives in Sweet Potato at `docs/coordination/captains-academy-handoff.md`. From now on this file is the master copy.

Changes to a settled decision need an explicit call from Et. A parked item is not a decision; do not build on it.

## Settled

### Product shape
- **A1.** The academy is a standalone product: its own repo, its own Supabase project (database and login). It shares nothing with Fish Log Book.
- **A2.** The academy owns the only sea-time log. Fish Log Book gets no sea-time feature.
- **A3.** Build the sea-time log first.
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
- **Engine:** Unity.
- **Platforms:** browser, desktop and mobile from the start.
- **Realism:** a realistic core (boat handling, charts, lights, sound signals) with a game layer on top (missions, scores, streaks, ranks).
- **First module:** chart navigation and Rules of the Road together.
- **Waters:** real harbors from NOAA electronic charts, starting with one harbor.
- **Simulator time is never sea time.** Proposed as a firm line; objections welcome.

### Arcade game
Decided 2026-10-20 in issue #18. See [ADR 0001](../adr/0001-arcade-game-stack.md).
- **Separate product.** The top-down 2D arcade game (phone and web) is separate from the simulator. Unity stays the simulator engine until Et decides after the arcade game launches.
- **Stack:** strict TypeScript, Phaser 4.2.1 (pinned) and Vite, in a fresh project. Web first; Capacitor and native billing come after the browser game validates gameplay.
- **Architecture:** a Phaser-free `src/sim` (deterministic, no Phaser physics), `src/game` for rendering, `src/platform` for purchases. Both payment SDKs sit behind one Entitlements interface.
- **Game time is never sea time,** and the game never says a player qualifies.

### Flashcards
- **Colors mean real navigation-light colors.** Example: a red and a green light together means a vessel heading straight at you.
- **Scope:** night lights, day shapes and sound signals.
- **Each card asks:** what vessel is it, which way is it heading, and what should you do?
- **Study method:** spaced repetition.
- **Where:** a quick web version, plus 3D cards inside the Unity app that use the simulator's own models.

## Open (parked by Elliott)
- **Course type:** Coast Guard-approved course with our exam, study aid first, or partner with an approved school.
- **Pricing:** what's free and what's paid. To decide with the marketing team.
- **Arcade game follow-ups:** the web payment provider and cross-device sync, how realistic the physics should be, Apple and Google developer accounts, a Coast Guard content reviewer, and whether the arcade game later replaces Unity as the simulator engine (Et decides after launch).

## To verify before building
The regulation sites (ecfr.gov, law.cornell.edu) were unreachable from the session, so these figures come from Coast Guard guidance and training-school summaries.
- Recency window for each license (commonly 90 days in the last 3 years; one source said 7 years).
- Tonnage thresholds for 25/50/100-ton Master ratings.
- Whether the Coast Guard has an accepted way to estimate tonnage for boats without an official figure.
- That Unreal Engine still has no web export (this only confirms the Unity choice).
- What the Coast Guard requires to approve a course and its online proctored exam.

## Next steps
1. Write the academy's verification command and required checks, so it can leave stage 0.
2. Settle the parked items: course type and pricing.
3. Verify the figures listed above against the current regulations.
