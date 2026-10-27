# Captain's Academy

A sea-time log, Coast Guard license prep, navigation-light flashcards and a ship simulator for people working toward a U.S. Coast Guard captain's license.

The web app includes the arcade game, Rules of the Road practice, and a sea-time log. The settled product decisions are in [docs/product/DECISIONS.md](docs/product/DECISIONS.md). Agents start with [AGENTS.md](AGENTS.md).

This repository started from Sweet Potato's project template.

| Path | What it holds |
| --- | --- |
| `AGENTS.md` | Project rules on top of Sweet Potato's |
| `docs/product/DECISIONS.md` | Settled and parked product decisions |
| `.claude/agents/`, `.codex/agents/` | The team roles, one adapter per runtime |
| `.claude/skills/` | Pinned skills copied from Sweet Potato. Do not edit here |
| `docs/team/` | House rules, routing, channel, worklog, backlog |
| `docs/agents/` | Issue tracker, triage labels and domain-doc layout the skills read |
| `docs/adr/` | Architecture decisions |
| `docs/prototypes/` | Arcade game mockups, playable prototypes, wireframes and handoffs |
| `agent-resources/timecards/` | One time card per agent session |
| `scripts/` | Proof bundle scripts and the on-duty list |
| `proof/` | The proof bundle for the current pull request |

## Collaborating with friends

Start at the [Collaborator start page source](public/collaborate/index.html) at `/collaborate/` on the web app. It holds copyable onboarding, workstream, prototype, review, and handoff prompts. Until this branch merges, use its Vercel preview rather than the production site.

For the setup steps and review process, read [CONTRIBUTING.md](CONTRIBUTING.md). Review designs in the existing Decision Desk. The prompts do not grant implementation, merge, deployment, or access authority.

### Give this prompt to your agent

Replace the collaborator and task placeholders before sharing it. The same prompt is available on the Collaborator start page.

```text
You are joining Captain's Academy as an agent working with one of Elliott's collaborators.
Repository: Etdev2/Captains-academy-
Human collaborator: {{collaborator}}
Assigned task or issue: {{task}}

Our current collaboration phase is prototype review. A prototype is design input, not permission to implement the feature.

1. Read the current AGENTS.md, agent-resources/README.md, docs/team/HOUSE-RULES.md, docs/team/AI-OPERATING-SYSTEM.md, docs/product/DECISIONS.md, and applicable ADRs. Use the repository's pinned tools and skills.
2. Inspect open issues, pull requests, and workstream assignments. Identify your human collaborator, runtime/model, role, assigned task, dependencies, and allowed files. Ask your collaborator for missing identity or scope. Do not duplicate active work.
3. Coordinate the assignment with Sweet Potato. Follow the current builder limit. Onboarding does not add a builder slot. A direct owner instruction supersedes older repository rules only within its stated scope.
4. Before editing, record your assignment and clock in as the repository requires. Use your own branch and checkout or worktree. Never switch branches in another agent's working copy or change another workstream's files. Agree on shared interfaces before dependent work begins.
5. For an assigned design task, create mobile and desktop prototypes with fictional sample data clearly labeled. Use settled decisions and the selected Captain's Console direction where applicable. Label alternative explorations. Explain the user flow, tradeoffs, and what is static versus interactive.
6. Submit images through the existing Decision Desk inventory and feedback process. If another agent owns those files, hand over an asset pack with stable IDs, dimensions, source paths, categories, and integration instructions. Do not create another gallery or change its voting model.
7. Open a draft PR with the task, branch, exact base/head SHAs, changed files, screenshots, preview link when available, checks personally run, missing evidence, and decisions for Elliott. Do not claim a preview or test passed without observing it.
8. Wait for Elliott to select a direction and approve an implementation task before building the proposed product feature. Keep game time separate from sea time. Never make licensing eligibility claims or guarantee NMC acceptance.
9. Follow current independent-review and merge authority. Codex reviews Claude-built work; Codex-built work needs an independent reviewer. Sweet Potato may merge only a reviewed current head with no unresolved P0/P1, required Verify/Proof/Vercel checks green, and a mergeable, non-draft PR.
10. Do not push directly to main, share credentials, expose secrets, run paid APIs, or change production, access, workflows, or settings without separate authorization.

First return a short onboarding receipt: what you read, your assignment, proposed branch/worktree, allowed files, dependencies, current blockers, and the next action. Do not begin unassigned implementation.
```

