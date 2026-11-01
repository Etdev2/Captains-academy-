# Prototype Studio plan

Status: proposed, awaiting Et's approval. Nothing here is built. Written 2026-10-28 from an audit of `main` at `ba090b1` and a 14-question interview with Et.

The Prototype Studio replaces the Decision Desk at `/prototypes/`. Reviewers sign in, drop green and red dots on prototypes, and Et approves, rejects and marks what is live. It is built so another app can copy it later.

## 1. Existing system audit

### What exists

| Area | How it works today | Where |
| --- | --- | --- |
| Board | A React, Tailwind and shadcn page at `/prototypes/`. Items are grouped by screen under sticky headers, laid out in a masonry grid, and open in a full-screen viewer with swipe, arrow keys and zoom | `src/prototypes/BoardView.tsx`, `ConceptDialog.tsx`, `Masonry.tsx` |
| Storage of prototypes | Images are files in `docs/prototypes/**`. `inventory.json` lists each one with a permanent `id`, title, creator, style, feature, kind (`concept`, `app-screenshot`, `reference`), size and dominant color | `docs/prototypes/inventory.json`, `src/prototypes/inventory.ts` |
| Adding a prototype | Five manual steps: edit `inventory.json`, run `scripts/prototype-thumbnails.py`, edit `sections.ts`, run `scripts/prototype-inventory.ts`, run two tests | `docs/prototypes/decision-board.md` |
| Rating | One round, `frontend-direction-1`, runs four phases: look silently, dot vote, discuss, decider's call. Each reviewer has 5 "like" dots placed at fractional x and y, one thumbs up or down per item, and notes. Others' dots stay hidden until a reviewer finishes. The 1 to 10 rating gallery was removed on 25 October | `src/prototypes/board.ts`, `round.ts` |
| Comparing | No side-by-side view. The heat panel ranks items by dot count | `OtherViews.tsx` |
| Identity | A typed name kept in `localStorage`. The decider check compares that name to the string `Elliott`, so anyone who types it can decide | `BoardContext.tsx`, `round.ts` |
| Sharing | None. Everything lives in the browser. Reviewers export a JSON file, send it to Et, and Et imports it | `store.ts` |
| Decision | One decision per round, for the whole board, with a written reason | `board.ts` |
| Letters | Only the 15 interactive prototypes have letters. A, B and C are fixed styles (Night Bridge, Clean & Light, Guided Mentor), not prototypes | `src/prototypes/live/shared/routes.ts` |
| Filters | Category chips with links such as `?category=sea-time`, and a Style filter. One chip at a time | `categories.ts`, `sections.ts` |
| Production | Not marked. The "As built" row holds app screenshots, but nothing ties them to a deploy | `sections.ts` |
| Auth | Optional Supabase email sign-in with a link and a 6-digit code at `/account/`. One client, PKCE, guests keep their user ID when they add an email | `src/auth/`, ADR 0010 |
| Database | `main` has none. Draft PR #75 adds `prototype_assets` and `prototype_feedback` (one 1 to 10 rating and comment per user and item). Its row-level security lets each user read only their own feedback, so a team view is impossible | PR #75 migration |

### What is missing or too complicated

1. Feedback does not reach anyone without a file handoff.
2. A typed name decides, and anyone can type it.
3. Nothing distinguishes the deployed design from candidates.
4. Letters describe styles, so a second Night Bridge attempt has no letter.
5. One decision covers the whole board. Items have no status of their own.
6. A dot means only "I like this" and carries no reason.
7. Adding a prototype needs Git and two scripts.
8. Phases need someone to advance them by hand.
9. PR #89 also edits `sections.ts` and `categories.ts`, so studio work conflicts with it until it merges.

### What can be reused

- `board.ts` has no UI code. Its normalized dot coordinates, limits and Zod schemas carry over.
- `DotImage.tsx` (placing dots, a keyboard "Add a dot" path), `Masonry.tsx` and the viewer in `ConceptDialog.tsx`.
- The URL-state pattern (`?concept=`, `?category=`).
- `board.css` touch and focus rules: 44px targets, a solid focus ring, no shadows.
- Category ids, round config and the decider name are academy-specific and move into one config file.

## 2. Owner decisions

| # | Topic | Decision |
| --- | --- | --- |
| 1 | Who reviews | Sign-in required to review, with Google or an email link through Supabase. A profile page sets a username once, and every dot, note and decision carries it |
| 1b | Session length | Stay signed in on that device until sign-out, which is Supabase's default |
| 2 | Production look | Green border and a `CURRENT PRODUCTION` badge |
| 3 | Who marks production | Et and maintainers Et grants. One production mark per product area, theme and environment |
| 4 | Filters | Status and product area |
| 5 | Filter behavior | Multi-select chips. The address bar holds the filter so any view is a shareable link |
| 6 | Dots | Green (keep this) and red (change this) |
| 7 | Dot notes | A red dot needs a reason. A green dot can be a bare tap. Dots can be marked resolved |
| 8 | Deciding | Et approves or rejects each prototype with a reason, and compares prototypes side by side. The 1 to 10 rating is dropped |
| 9 | Stages | Experimental, Under Review, Approved, Production, plus Rejected and Archived |
| 10 | Collaboration, in order | Assignment with task status, GitHub links, handoff prompts, notifications |
| 11 | Versions | Revisions stay under one card as v1, v2, v3 with a change summary and a before/after compare. Nothing is deleted |
| 12 | Reuse | One self-contained folder with a config file and its own migration. It becomes a package when a second app adopts it |
| 13 | Adding prototypes | An Add prototype button in the studio. Images go to Supabase Storage and land as Experimental with the next free letter |
| 14 | Rounds | No phases. A reviewer sees others' dots on a prototype after placing their own or pressing Show others |
| 15 | Direction | Phased: A, then B, then C |

Two things follow from these. Thumbs up and down retire, because green and red dots and Et's call replace them. ADR 0010 needs an amendment for Google sign-in and usernames.

## 3. Proposed experience

A new collaborator gets a link, signs in with Google, picks a username, and lands on the studio filtered to Under Review.

- **Top bar.** Product area chips and status chips, both multi-select, plus an Add prototype button. The URL reads like `/prototypes/?area=sea-log,arcade&status=review,experimental`.
- **Cards.** The image, its letter and title (`Sea Logbook B`), its status, a count of green and red dots, and the assignee. The production card for each area has a thick green border and a `CURRENT PRODUCTION` badge with its live link and deploy date. It stays in view whatever the status filter.
- **Viewer.** A Dot Mode toggle. In Dot Mode, a tap opens a two-button picker for Keep (green, check mark) or Change (red, cross). Red asks for a one-line reason. Tapping a dot opens its reason, author, Resolve and Delete in a bottom sheet. Others' dots appear after you place one or press Show others.
- **Compare.** Select two or three cards and press Compare. They show side by side on a desktop and stacked on a phone, each with its dots.
- **Decide.** Et and maintainers see Approve and Reject, each needing a reason, and Mark as production, which needs a live URL and deploy date. The reason shows on the card and in its history.

## 4. Design directions

| | A. Minimal Decision Desk | B. Collaborative Design Studio | C. Full Prototype Command Center |
| --- | --- | --- | --- |
| Adds | Sign-in and profile, shared database, status and area filters, production border, upload, approve and reject with reason | Dot Mode, hide-until-reviewed, compare, letters per area, assignment and task status, GitHub links | Versions with before/after, maintainer roles, deploy-verified production, handoff prompts, notifications, a package |
| Workflow | Filter, open, decide | Dot, compare, decide, assign | Revise, compare versions, ship, verify, hand off |
| Phone | Current viewer with scrollable chip bar | Dot sheet at the bottom, compare stacks | Same as B, with a version slider |
| Pros | Ends the file juggling in one cycle | Covers most of the brief | Covers all of it |
| Cons | No visual critique yet | About twice A's work | Email and deploy webhooks to run and maintain |
| Complexity | Low to medium | Medium | High |
| Maintenance | Low | Medium | High |
| Reuse | Medium | High | Highest |

Et chose the phased path. Each phase is usable alone and ships as its own reviewed pull requests.

## 5. Recommended feature set

Phase 1 and 2 cover what reviewers touch every day. Phase 3 and 4 add workflow and portability once the team uses the studio. Retire the four-phase round, thumbs, file export and import, and the 1 to 10 table from PR #75. Keep a one-time export of the current local boards so nobody loses their dots.

## 6. Reusable architecture

**One folder.** `src/studio/` holds the UI, rules and data access with no academy words in it. `src/studio/config.ts` is the only academy-specific file. It lists product areas, themes, environments, the app name and the owner's user ID. The page entry at `/prototypes/` imports the studio and the config.

**One migration.** `supabase/migrations/<ts>_studio.sql` creates every table with a `studio_` prefix, so another app can run the same file in its own Supabase project. It shares no database with any other app, which keeps the rule that the academy shares nothing with Fish Log Book.

**Pure rules.** Letter assignment, filter parsing, status transitions and dot validation are pure functions in `src/studio/rules/`, tested with Vitest, as `board.ts` is today.

**Tables.** All new and additive. PR #75 has not merged, so its prototype tables are reworked on that branch rather than dropped from a live database.

| Table | Holds | Who can write |
| --- | --- | --- |
| `studio_profiles` | user ID, unique username, avatar URL | the user, for their own row |
| `studio_roles` | user ID and role (`owner`, `maintainer`) | owner only |
| `studio_prototypes` | stable UUID, legacy inventory id, area, theme, display letter, title, status, assignee, task status, GitHub links | signed-in reviewers create. Owner and maintainers change status |
| `studio_versions` | prototype, version number, image path, size, color, change summary | the prototype's creator or a maintainer. Never deleted |
| `studio_dots` | version, user, x and y from 0 to 1, color, note (required when red), resolved by and at | the author edits or deletes their own. Owner and maintainers resolve |
| `studio_decisions` | version, approve or reject, reason, decider, time | owner and maintainers insert. No update or delete |
| `studio_production` | area, theme and environment as primary key, version, live URL, deployed at, set by | owner and maintainers. The primary key allows one production mark per combination |
| `studio_events` | append-only log of status, production and role changes, written by triggers | nobody directly |

Display letters come from a database function that takes the next free letter within an area and never reuses one. References use the UUID, and the letter is only for people.

**Access.** Row-level security on every table. Writes require a signed-in, non-anonymous user (`auth.jwt() ->> 'is_anonymous'` is false). Roles are read from `studio_roles` in policies, never from the client. Others' dots come from a function that returns them only after the caller has dotted that version or pressed Show others. Images go to a private Storage bucket with a 10 MB limit and image types only. The browser makes the thumbnail before upload, so no server function is needed.

## 7. Phased plan

### Phase 1. Quick wins (direction A)

- **Features.** Google sign-in next to the email link. A profile page at `/account/` for username and avatar. The studio schema with row-level security. A seed script that imports `inventory.json`, keeping each old id as `legacy_id`. The studio reads from the database. Status and area multi-select filters in the URL. The production border and badge. Approve and reject with a reason. Add prototype with upload. Thumbs, rounds and file import and export retire, after a one-time "Download my old board" button.
- **Dependencies.** A Google Cloud OAuth client and the Supabase Google provider, which Et creates or approves. PR #75 reworked or replaced. PR #89 merged first, or rebased onto this work.
- **Data changes.** New `studio_*` tables and a Storage bucket. No changes to `study_progress`.
- **Risks.** Seeding the "As built" screenshots as Production would claim deploys nobody verified, so they seed as Under Review until Et marks them. Google sign-in on a phone opens a new browser tab, which needs the same redirect URLs as the email link.
- **Tests.** SQL tests for every policy: a reviewer cannot change status, cannot mark production, cannot edit another's dot, an anonymous user cannot write, and the second production mark for one combination fails. Vitest for filter URL parsing and letter assignment. Playwright with a mocked Supabase, as in #87, on desktop and phone.
- **Acceptance.** A new reviewer signs in with Google, sets a username, filters to Under Review in Sea Logbook, and sees the production card with its green border, in under two minutes. A second browser sees the first reviewer's work without any file exchange. Only Et's account sees Approve, Reject and Mark as production, and the database refuses those writes from anyone else.
- **Effort.** Four pull requests: schema and access, sign-in and profile, studio reads and filters, upload.

### Phase 2. Collaboration (direction B)

- **Features.** Dot Mode with green and red, a reason required on red, resolve, delete own, and filters by color, reviewer and resolved state. Hide until reviewed. Overlapping dots grouped into a count bubble that expands on tap. Compare two or three. Assignment and task status (Open, In Progress, Needs Review, Done). GitHub issue, branch and PR links.
- **Dependencies.** Phase 1.
- **Data changes.** Columns on `studio_prototypes` for assignee, task status and links. `studio_dots` is already in the phase 1 schema.
- **Risks.** Dots covering controls on small images. The studio scales dot size with the image and adds a Hide dots toggle. Done must never move a card's status, and tests pin that.
- **Tests.** Dot coordinates stay put across viewport sizes. Others' dots stay hidden until the reviewer dots or presses Show others. A red dot without a note is rejected by the database and the form. Keyboard and screen reader path for placing a dot.
- **Acceptance.** A reviewer on a phone places a red dot with a reason in under 10 seconds. Et compares B and C with their dots and approves one.
- **Effort.** Three pull requests.

### Phase 3. Decision workflow (direction C, part 1)

- **Features.** Versions under one card with change summaries and a before/after slider. Restore makes an old version current again. Maintainer role management. Production marks checked against a Vercel deployment of the linked PR. Copy handoff prompt for Claude, Codex and Grok Bot, built from the prototype, its open red dots and the decision.
- **Dependencies.** Phase 2. A Vercel token or webhook for deploy checks.
- **Data changes.** Uses `studio_versions` and `studio_production` as built. Adds a deployment id column.
- **Risks.** Deploy verification needs a secret held server-side, so it needs an Edge Function or a GitHub Action. That is the first server code in the studio.
- **Tests.** Restore never deletes a version. A production mark without a verified deploy shows as unverified. Handoff text snapshot tests.
- **Acceptance.** Et revises B to v2, compares v1 and v2, and copies a handoff prompt that names every open red dot.
- **Effort.** Three pull requests.

### Phase 4. Portable module (direction C, part 2)

- **Features.** Notifications for needs-review and needs-decision, sent by email once custom SMTP is connected and shown in the studio. An install guide, migration and config template so a second app can adopt the studio. Publishing a package waits until a second app actually adopts it.
- **Dependencies.** Custom SMTP, also needed by sign-in.
- **Risks.** Copies drifting between apps. A version number in `src/studio/VERSION` and a changelog keep track.
- **Acceptance.** A fresh Vite app runs the migration, adds the config, and shows its own studio with no academy code.
- **Effort.** Two pull requests, plus the adopting app's own.

### Across all phases

- **Accessibility.** Dots differ by shape as well as color (check and cross). 44px targets. Every dot action works by keyboard. Statuses use text, not color alone. WCAG AA contrast on the navy ground.
- **Auditability.** Decisions and events are append-only and name the user ID.
- **Security.** Only the publishable key reaches the browser. Every rule lives in row-level security, and the client hides buttons only for convenience.
- **Cost.** Supabase free tier: 1 GB Storage and 50,000 monthly active users. No new paid services until phase 3's deploy check.

## 8. Open questions and risks

1. Should viewing the studio need sign-in, or only reviewing? The images are already public in the repo, but the studio's notes and decisions are not.
2. Which product areas does the config start with? The brief lists Dashboard, Definitions, Navigation Lights, Forms, Sea Logbook, Arcade Game and Captain's Console. Today's five categories differ.
3. What becomes of the interactive prototypes' fixed A, B and C styles once letters belong to prototypes? Proposal: each variant becomes a prototype with its style as its theme.
4. Who are the first maintainers?
5. The Supabase built-in mailer sends a few emails an hour, which limits email sign-in until custom SMTP is connected. Google sign-in avoids that limit.
6. PR #75 and PR #89 overlap this work and need an order agreed before phase 1 starts.

## 9. First GitHub issue

**Prototype Studio 1a: shared schema and access rules.** Add the `studio_*` tables, Storage bucket, letter function and row-level security in one migration, with SQL tests for every policy, and a seed script from `inventory.json`. Rework PR #75's prototype tables into it and drop its 1 to 10 rating table before that PR merges. No UI. Acceptance: the SQL tests prove that only the owner and maintainers change status or production, that a red dot needs a note, that anonymous users cannot write, and that a second production mark for one area, theme and environment fails.
