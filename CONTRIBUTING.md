# Collaborating on Captain's Academy

Elliott and the collaborators review prototypes before implementation starts. Give your agent the prompt in [README.md](README.md), or use the [Collaborator start page source](public/collaborate/index.html) at `/collaborate/` on the web app.

## Get access and run the app

Use your own GitHub account. Ask Elliott for repository access if needed. Do not share passwords, tokens, or production environment files.

Clone the repository into your own working copy. Use the Node version in `.nvmrc`, then run `npm ci` and `npm run dev -- --host 127.0.0.1`. Open the local URL Vite prints. These public app pages do not need a production database to explore the UI. Never invent environment values to bypass a missing service.

Read [AGENTS.md](AGENTS.md), the [house rules](docs/team/HOUSE-RULES.md), the [operating system](docs/team/AI-OPERATING-SYSTEM.md), [product decisions](docs/product/DECISIONS.md), and the applicable ADRs before editing. Agent sessions follow [the time-card instructions](agent-resources/README.md).

## Agree on the assignment

Check open issues, PRs, and existing assignment records with Sweet Potato. Every workstream has an issue, owner, branch, worktree, allowed files, dependencies, acceptance criteria, and reviewer. Use the compact assignment record in the operating system. Do not assume that a topic is independent merely because it has a different name.

Keep your branch in your own checkout or worktree. Never switch branches inside another agent's working copy. Shared navigation, styles, dependencies, migrations and configuration need one owner at a time. Request a sequence or ownership transfer when work overlaps. Existing builder limits still apply.

## Prepare and review prototypes

Use the assigned visual direction. Label alternatives and fictional data. Provide mobile and desktop screens, source files, and a short explanation of the task, tradeoffs, and static versus interactive behavior.

The Decision Desk workstream currently lives on [PR #73](https://github.com/Etdev2/Captains-academy-/pull/73). Use the preview linked in that PR. Follow its current asset inventory, IDs, dimensions, thumbnails and sections. If another agent owns those files, hand them the assets and integration steps. Do not create a second gallery or change the feedback model.

Leave a design PR as a draft while Elliott and collaborators compare concepts. Elliott records the selected concept and reason. Votes inform the decision. They do not approve implementation or a merge. Implementation follows as a separately approved task.

## Verify and hand off

Run `bash scripts/verify.test.sh` and `bash scripts/verify.sh`. The latter must run every required stage without skipping. Install the pinned Playwright browser when your environment needs it. Use the project's verification skill for changed behavior and capture the actual result.

Clock out before regenerating proof. Run `scripts/write-proof.sh --ticket Etdev2/Captains-academy-#<issue>` with the required fixture, shows and real verification commands, then `bash scripts/check-proof.sh`. See the script's usage for all arguments. Commit proof last. A later code or time-card edit requires another proof rewrite.

Open a draft PR with the issue, base/head SHAs, changes, screenshots, preview, commands and results, and missing evidence. Distinguish your local tests from CI and another builder's transcript. Never claim PASS for an unexecuted check.

An independent model family reviews the builder's work. Follow the current merge rule in AGENTS.md and Elliott's direct instructions. Sweet Potato can merge only the reviewed current head with no unresolved P0/P1, required checks green, and a mergeable, non-draft PR. Collaborators and their agents do not gain merge or production authority by onboarding.

## Maintain the prompt page

The canonical page prompts are in `public/collaborate/prompts.json`. Keep the README onboarding prompt equal to its first entry. The page is static and ships through Vite's public directory at `/collaborate/`. It does not store collaborator details or send prompts to an agent. Copying a prompt does not execute it.
