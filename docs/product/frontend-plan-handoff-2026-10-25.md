# Frontend plan handoff, 25 October 2026

For the Chief of Staff, the COO and the agents who pick up frontend work. It records what Et decided on 25 October, what is built, and the order of the next work. Read it with [ADR 0009](../adr/0009-app-screens-use-react-tailwind-and-shadcn.md) and [`docs/prototypes/decision-board.md`](../prototypes/decision-board.md). Issue #72 is the ticket, and draft PR #73 carries the work.

## What Et decided

1. **App screens move to React, Tailwind CSS 4 and shadcn/ui.** That covers the front page at `/`, the sea-time log at `/log`, the prototype review page, and later sign-in and account screens. ADR 0009 records it and DECISIONS.md A5 points to it. The ADR stays proposed until Et merges it.
2. **The site stays on Vite. It does not become a Next.js app.** Supabase will be the backend (DECISIONS.md A1), so the app needs no server code of its own, and a static Vite build is the simplest to keep working offline.
3. **The arcade game stays as built.** `/play` and the Chapter 1 levels at `/rules` keep their HTML, CSS and Phaser code. An ESLint rule fails the build if `src/game` or `src/sim` imports React, shadcn components or app-screen code.
4. **Prototypes are judged on a decision board.** Et picked it from three wireframed options (decision board, head-to-head, scorecard). It follows the "decide" steps of Google Ventures' Design Sprint: look silently, dot vote, discuss the top dots, and the decider makes the call with a written reason. Et is the decider. Dots point the discussion and approve nothing.
5. **Standard shadcn control sizes.** Et dropped the 44 px glove-sized control rule for this work. `AGENTS.md` still describes the hardest user as a mariner possibly wearing gloves; whether that line stays is open for Et.
6. **A database is coming but is not built.** Until it exists, the board is saved on each device and a team combines boards by exporting and importing files.

## What is built

On branch `ux-ui/prototype-gallery`, draft PR #73:

- The decision board at `/prototypes/`, replacing the 1 to 10 rating gallery Et did not like. It shows the 55 concepts and current-app screenshots from `docs/prototypes/inventory.json`, with the 18 reference items and the 3 missing ChatGPT directions under a Reference tab.
- React 19.3.1, Tailwind CSS 4.3.3, `@vitejs/plugin-react` 5.2.0 (the release that supports the pinned Vite 7), and 12 shadcn/ui components in `src/components/ui/`. The shadcn CLI cannot reach its registry from the agents' containers, so the components came from the shadcn GitHub repository at commit `481d523374745e77d0cf9c53a4115ab5dd7c8481` with only their import paths changed.
- One theme file, `src/styles/theme.css`, with light and dark values that follow the phone's setting. It has no red or green tokens (G15), and shadcn's "destructive" color is amber.
- The board's rules in `src/prototypes/board.ts`, with 14 unit tests in `tests/decision-board.test.ts`. The page's browser tests are in `e2e/prototypes.spec.ts` and run on a desktop, a landscape phone and an upright phone.
- The service worker leaves the review page and its images out of the offline cache.

`scripts/verify.sh` passes, and PR #73 carries a PASS proof bundle with screenshots of each step on a desktop and a phone. PR #73 stays a draft, because the coordinator merges non-draft pull requests and a merge publishes the page.

## Order of the next work

1. **Et reviews PR #73.** Read ADR 0009, try the board on the Vercel preview, and settle the open questions below. PR #73 stays a draft until Et decides whether the page goes public.
2. **Run review round 1.** Reviewers place their dots and send their exported files to Et. Et imports them, runs the discussion and makes the call on the frontend direction.
3. **Apply the chosen direction to the theme.** `ux-ui` changes `src/styles/theme.css` only: colors, radius and type. No page restyles its own controls.
4. **Design the database.** `architect` proposes Supabase tables for review work across projects (projects, rounds, concepts, dots, notes and decisions) with sign-in by emailed link, so a reviewer's name cannot be faked. It replaces `src/prototypes/store.ts` behind the same board rules. Nothing is applied until Et approves the migration, and no production migration runs without Et.
5. **Build the review hub.** Once the database exists, the hub from the wireframes lists every project and its review rounds, and keeps a decision log.
6. **Move the sea-time log to the new stack.** `head-dev` with `ux-ui`, one pull request. The existing `/log` offline, storage and browser tests are the contract and must keep passing.
7. **Move the front page.** One small pull request.
8. **Later, only if needed.** The scorecard (rubric scores and critique notes) for comparing 2 or 3 finalists, then head-to-head for close calls.

## Rules for agents doing this work

- Never touch `src/game`, `src/sim`, `/play` or `/rules` for this initiative. The lint rule enforces it.
- shadcn components in `src/components/ui/` belong to the repo. Change them there. Add new ones from the same pinned commit of the shadcn repository and change only the import paths.
- Keep every package pinned to an exact version. Install with `npm ci`, and regenerate the lockfile with `npx npm@11.21.0 install`.
- Fonts come from the system or from files in the repo, never from the network, so pages work offline.
- Anything saved only on a device says "Saved on this device" and is never shown as shared team data.
- Each pull request runs `bash scripts/verify.sh`, commits a proof bundle from `scripts/write-proof.sh`, and stays a draft while Et has open questions on it.

## Open for Et

- Whether app screens follow the no-red, no-green rule. ADR 0009 proposes yes.
- Whether `AGENTS.md` keeps the mariner-in-gloves description of the hardest user.
- Whether the review page may go public on the live site.
- Whether Vercel preview protection is on. If it is off, anyone with the preview link can open the board.
- Whether to commit the 17.5 MB ChatGPT concepts PDF. Its images are already in the repo.
- Who besides Et gets access to the private Night Harbor Run page linked from the board.

## Known issues

- The board loads 137 KB of compressed JavaScript and 9 KB of compressed CSS. The game pages load none of it.
- `npm audit` reports a high-severity advisory in Vite 7.3.6 and a moderate one in `@vitest/mocker`. Both are development tools and were already on `main`. The production audit that `verify.sh` runs finds none.
- `inventory.json` still carries the old 1 to 10 rating question, which the board does not use.
- The wireframes for all three review options are on a private Claude design canvas. Ask Et for access.

## Assignment records

```text
INITIATIVE: Frontend stack and prototype review (ADR 0009, issue #72)
COORDINATOR: COO, from this handoff file
RUNTIME: CLAUDE or CODEX, as the COO assigns
ROLE: architect
MODEL TIER: HIGH
BRANCH: assigned by the COO when Et approves the database work
WORKTREE: assigned by the COO
ALLOWED WRITES: a design doc and a proposed migration file, not applied
DEPENDENCIES: PR #73 merged; Et's go on the Supabase project (DECISIONS.md A1)
STATUS: BLOCKED
SOURCE / CONSTRAINTS: src/prototypes/board.ts rules stay as tested; no production migration without Et
TASK / EXPECTED ARTIFACT: Supabase schema and access rules for review rounds across projects, with emailed-link sign-in
DONE CRITERIA: Et approves the proposal; the board's unit tests still describe the rules
```

```text
INITIATIVE: Frontend stack and prototype review (ADR 0009, issue #72)
COORDINATOR: COO, from this handoff file
RUNTIME: CLAUDE or CODEX, as the COO assigns
ROLE: ux-ui
MODEL TIER: MEDIUM
BRANCH: assigned by the COO after round 1 is decided
WORKTREE: assigned by the COO
ALLOWED WRITES: src/styles/theme.css, and docs for the chosen direction
DEPENDENCIES: Et's decision in review round 1
STATUS: BLOCKED
SOURCE / CONSTRAINTS: no red or green tokens unless Et relaxes G15 for app screens; system or repo fonts only
TASK / EXPECTED ARTIFACT: the chosen frontend direction applied to the shared theme
DONE CRITERIA: verify.sh passes, axe finds no violations, and the proof bundle shows the board in light and dark
```

```text
INITIATIVE: Frontend stack and prototype review (ADR 0009, issue #72)
COORDINATOR: COO, from this handoff file
RUNTIME: CLAUDE or CODEX, as the COO assigns
ROLE: head-dev, with ux-ui for design
MODEL TIER: MEDIUM
BRANCH: assigned by the COO after the theme lands
WORKTREE: assigned by the COO
ALLOWED WRITES: src/log, log/index.html, src/components/ui, e2e tests for /log
DEPENDENCIES: ADR 0009 merged; the chosen theme applied
STATUS: BLOCKED
SOURCE / CONSTRAINTS: the existing /log offline, storage and browser tests are the contract; the log never imports the game
TASK / EXPECTED ARTIFACT: the sea-time log rebuilt with React and shadcn, behaving as it does today
DONE CRITERIA: every existing /log test passes unchanged except where Et approved a change in behavior; verify.sh and proof pass
```
