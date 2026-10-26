# Interactive prototypes

Five parts of Captain's Academy, each built three ways so Elliott and collaborators can pick a design direction. They are clickable React pages, not pictures. Every variant shows the same fictional sailor, Jordan Sample, with the same numbers, so differences come from the design and not the data.

Nothing here is a decision, and nothing is saved. The OUPV near-coastal sea-service amounts (360 days, 90 near coastal) come from the app's checked rules engine. Every other license figure, form rule, exam pass mark and deadline is marked illustrative on screen. No screen says a sailor qualifies, and every screen leaves the call to the National Maritime Center.

## Where to look

| Page | Address |
| --- | --- |
| Decision Desk, all prototypes | `/prototypes/` |
| Decision Desk, one category | `/prototypes/?category=console`, `license`, `sea-time`, `study` or `arcade` |
| One screenshot in the viewer | `/prototypes/?concept=cl-live-<category>-<a\|b\|c>-desktop` (or `-iphone`) |
| Index of all 15 interactive variants | `/prototypes/live/` |
| One interactive variant | `/prototypes/live/?category=<category>&variant=<a\|b\|c>` |
| One step of a variant's journey | add `&screen=<id>` from the table below |

To run it locally, `npm ci`, then `npm run dev` and open `http://localhost:5173/prototypes/`. For the production build, `npm run build && npm run preview` and use port 4173.

On the Decision Desk, each category's section opens with its A, B and C screenshots side by side. Tap one to enlarge it. The viewer's A, B and C buttons switch between the three. **Open interactive prototype** goes to the live page, and the live page's **Decision Desk** link comes back to the same screenshot. Dots, thumbs and notes work on these screenshots as on every other concept. On a phone held sideways, A, B and C sit in the viewer's Notes and details sheet.

## The three directions

| Variant | Name | Idea |
| --- | --- | --- |
| A | Night Bridge | A dark instrument panel that develops the Captain's Console mockups in [`../captains-console/`](../captains-console/). Dense, with gauges and a passage-plan strip, and an amber lamp for the next step. |
| B | Clean & Light | A bright workspace built for reading in daylight. Sidebars or list and detail on desktop, large type and plain headlines. |
| C | Guided Mentor | Task first. One next action fills the screen, with a mentor's plain voice, a route that says "you are here", and wizards that ask one thing at a time. |

## Checklist: 15 variants

Every variant was opened at 390×844 and 1440×900 with no console errors, no sideways scrolling and no axe violations on its primary screen. The first screen id is the primary screen, which is the one in the screenshots.

| Category | Variant | Screens (`screen=`) | Empty state |
| --- | --- | --- | --- |
| Captain's Console | A Night Bridge | `home`, `next`, `tasks`, `credential`, `needed` | Tasks, filter Overdue |
| | B Clean & Light | `home`, `next`, `tasks`, `credential`, `needed` | Tasks, filter Overdue |
| | C Guided Mentor | `home`, `next`, `queue`, `credential`, `needed` | Queue, filter Overdue |
| License Navigator & Forms | A Night Bridge | `navigator`, `choose`, `needs`, `review`, `status` | Choose, "Upgrades from one I hold"; or fix all three corrections in `review` |
| | B Clean & Light | `navigator`, `choose`, `needs`, `review`, `status` | Same as A |
| | C Guided Mentor | `navigator`, `have`, `missing`, `review`, `status` | The upgrades checkbox on `navigator`; or fix all corrections |
| Sea-Time Logbook | A Night Bridge | `overview`, `add`, `vessels`, `export` | Vessel Morro Dawn with waters Inland |
| | B Clean & Light | `logbook`, `trip`, `add`, `vessels`, `export` | Same as A |
| | C Guided Mentor | `home`, `trips`, `add`, `vessels`, `export`, `explain` | Trips, Morro Dawn and "Waiting on a signature" |
| Study & Exam Prep | A Night Bridge | `dashboard`, `topic`, `practice`, `results`, `review` | Clear every item in `review` |
| | B Clean & Light | `dashboard`, `topic`, `practice`, `results`, `review` | Same as A, or filter "Missed in practice" first |
| | C Guided Mentor | `today`, `topic`, `practice`, `results`, `review` | Clear every item in `review` |
| Arcade & Simulations | A Night Bridge | `select`, `dock-brief`, `dock-play`, `dock-result`, `rules-brief`, `rules-1`, `rules-2`, `rules-result` | Filter Navigation and Cleared |
| | B Clean & Light | Same, with `catalog` first | Same as A |
| | C Guided Mentor | Same, with `next` first | "See other challenges", then Navigation and Cleared |

The core journeys:

- **Console.** Read the dashboard, open the next action, filter tasks, look at a credential, see what is still needed, and go to any other category.
- **License & Forms.** Pick a target license or upgrade, see what you hold and what is missing, explore the forms, and pre-check the CG-719B. Apply or keep each correction and type the missing ZIP, and the status moves to "Pre-check passed". Then follow the application's stages and who decides each one.
- **Sea Time.** Check in or add a trip. Validation and a live credit preview update the summary, and Undo reverses the save. Then manage vessels and signatures, and preview a CG-719S-style summary for the owner. All three variants keep recorded days (316), days that appear to count (298), days an owner has signed (61) and NMC-verified days (none) apart.
- **Study.** Use the dashboard and learning path, pick a topic, and answer eight practice questions from the regs-checked Rule 3 definitions, with explanation and citation. Then read the mock-exam report and review weak topics.
- **Arcade.** Pick a challenge and dock a boat with engine and rudder against the wind, or press **Show me** for the autopilot. Then read lights in the dark and choose the maneuver, and get a debrief. The game says its time never counts as sea time.

## Screenshots

`images/` holds screenshots of this implementation, taken by `scripts/prototype-live-screenshots.mjs` with the frame hidden: `<category>-<variant>-desktop.png` (1440 wide, full page up to 3000 px) and `-iphone.png` (390×844 at 2×). Reference images stay in their own folders (`../captains-console/images/`, `../rules-of-the-road/images/`, `../frontend-directions/`) and are not changed. A test checks that only these screenshots live under `interactive/images/`. To refresh them after a change, build, run `npx vite preview`, run the script, then `python3 scripts/prototype-thumbnails.py` and `node scripts/prototype-inventory.ts`.

## Starting points the lead recommends

These are the lead builder's recommendations, not decisions. The dots on the Desk decide what gets discussed.

| Category | Start from | Why |
| --- | --- | --- |
| Captain's Console | C Guided Mentor | The home screen's job is the next useful action, and C makes it impossible to miss on a phone. Borrow A's passage-plan strip for overall progress. |
| License Navigator & Forms | C Guided Mentor | A first-time applicant does not know what an MMC, REC or NMC is. The wizard explains each one at the step that needs it. B's form review is the best "check my CG-719B" screen and could be C's review step. |
| Sea-Time Logbook | B Clean & Light | The log is used on deck in sun, where light screens read better than dark ones, and B's four-bar ledger makes recorded, counted, signed and verified days clearest. Keep A's thumb-sized check-in button. |
| Study & Exam Prep | C Guided Mentor | "Today's 15 minutes" removes the choice of what to study, and its weak-topic-first order suits short sessions between watches. |
| Arcade & Simulations | A Night Bridge | The game is played at night and in harbor scenes. A dark cabin keeps the lights readable and matches `/play` and `/rules`. |

## Decisions and assumptions

- The prototypes run inside the existing Vite and React stack (ADR 0009) as one extra page, `prototypes/live/index.html`. Each category loads as its own chunk, so one category's error cannot break another.
- The Decision Desk is on unmerged PR #73. This work is stacked on that branch and changes the board only through category chips, concept links, the viewer's A/B/C switcher and the new sections.
- Existing ids, images, dots and notes are unchanged. New screenshots get new ids (`cl-live-…`), and boards saved on a device keep working.
- The board's feedback is dots, thumbs and notes, saved on each device as the page says. The 1 to 10 rating backend in draft PR #75 is not wired. [`src/prototypes/catalog.ts`](../../../src/prototypes/catalog.ts) turns every board image into a row for its `prototype_assets` table with the same id, and a test checks those rows against the migration's limits.
- Who built what: five builder subagents, one per category, each with its own folder under `src/prototypes/live/`. The lead built the shell, the shared sample data, the Desk integration and the tests. [`BRIEF.md`](BRIEF.md) and [`assignments.md`](assignments.md) hold the brief and the assignment records.

## Known gaps

- Demo state lives in React only, so a reload resets filters and forms.
- Every Study lesson opens the same Rule 3 question set, and only the Rule 3 lesson has reading text.
- Arcade's docking wind is a demo value, not the 15 knots in the challenge blurb. Harbor traffic and Rule 3 link to the real game at `/play/` and `/rules/`, and Fog leg is locked.
- Nobody has tried them on a real iPhone, at 200% zoom or with a keyboard alone. Playwright used emulated phones.
- Rules content in the Arcade night scenario and every illustrative figure need a `uscg-regs` check before any of it ships.
