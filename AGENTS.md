# Captain's Academy

A sea-time log, Coast Guard license prep, navigation-light flashcards and a ship simulator for people working toward a U.S. Coast Guard captain's license. It is a standalone product with its own Supabase project, and it shares nothing with Fish Log Book.

This repository is a Sweet Potato project. It follows the rules in Sweet Potato's [AGENTS.md](https://github.com/Etdev2/sweet-potato/blob/main/AGENTS.md) and [agent environment contract](https://github.com/Etdev2/sweet-potato/blob/main/docs/agent-environment.md). This file adds the project's own rules. Where the two disagree, the stricter rule wins.

## Registration

| Field | Value |
| --- | --- |
| Registry entry | `projects.json` in Sweet Potato, name `Captain's Academy`, added by the pull request that moves the academy to stage 1 |
| Trust stage | `stage-1-supervised`: one ticket at a time while Et watches each transition. Et reviews the proof and merges |
| Language lane | `typescript-web` for the web app. The Unity simulator has no lane yet and needs a Sweet Potato ADR before simulator work starts |
| Verification command | `bash scripts/verify.sh`. The project-local verification skill is `.claude/skills/verify-captains-academy/` |
| Required checks | `verify` and `proof`, the GitHub Actions jobs in `.github/workflows/`. Branch protection is not available on the current GitHub plan, so they do not block a merge by themselves: Et merges only when both are green on the head commit |
| Merge authority | Et |

## Before work

- Clock in on a time card in `agent-resources/timecards/`. See `agent-resources/README.md`.
- Read `docs/team/HOUSE-RULES.md`. Before choosing or spawning a role, read `docs/team/AI-OPERATING-SYSTEM.md`.
- Read `docs/product/DECISIONS.md`. Build only on settled decisions, never on parked ones.
- Before game work, look at `docs/prototypes/`: mockups, playable prototypes, wireframes and handoffs for the arcade game. They are design input, not decisions.
- Use the vocabulary in `GLOSSARY.md` and the decisions in `docs/adr/` once they exist. See `docs/agents/domain.md`.
- Framework docs for the pinned versions in `package.json`:
  - Phaser 4.2.1: the agent skill files in `node_modules/phaser/skills/` and the types in `node_modules/phaser/types/phaser.d.ts`, plus https://docs.phaser.io. Check skill advice against those types before relying on it.
  - Vite 7: https://vite.dev. Vitest 4: https://vitest.dev. Playwright 1.56: https://playwright.dev. Zod 4: https://zod.dev. typescript-eslint 8: https://typescript-eslint.io.
- Run `bash scripts/verify.sh` before every push. Install with `npm ci`. npm 10's `npm install` fails on this dependency tree with `Cannot read properties of null (reading 'edgesOut')`, so regenerate the lockfile with `npx npm@11.21.0 install`.

## Who the product is for

The hardest real user is a working mariner checking in to a sea-time entry on deck: often offline, in sun or spray, possibly wearing gloves, with one hand free. `ux-ui` designs for this person.

Proposed, awaiting Et: checking in or out of a sea-time entry takes under 10 seconds with one thumb, offline.

## Project rules

| Rule | Enforcement |
| --- | --- |
| The app says a user's logged sea time "appears to meet" a requirement and lists what is still needed. It never says "you qualify." | Soft rule: review |
| Backfilled sea time is always labeled as backfilled and never shown as GPS-verified. | Soft rule: review |
| Simulator time never counts as sea time. | Soft rule: review |
| A license's rules appear in the app only after `uscg-regs` checks them against the current 46 CFR text and they have tests. Every rule in code cites its CFR section. | Soft rule: review until the rules engine exists |
| The academy shares no code, database or accounts with Fish Log Book. | Soft rule: review |

## Team

Roles live in `.claude/agents/` (Claude) and `.codex/agents/` (Codex). Both adapt the same named roles listed in `docs/team/README.md`, including the academy's own `uscg-regs` specialist. Use the cheapest adequate role and spawn only bounded work.

## Skills

`.claude/skills/` holds the skills pinned in Sweet Potato's `skills/registry.json`, copied under [ADR 0009](https://github.com/Etdev2/sweet-potato/blob/main/docs/adr/0009-copy-pinned-skills-into-a-project-template.md). Do not edit them here. To update them, move the pin in Sweet Potato and copy the folder again.

The one exception is `verify-captains-academy/`, the project's own verification skill. It belongs to this repository and changes with the game: update its feature map in the same pull request as a change to what a player can do, and keep it honest with `/maintain-verification-skill`. Use it to drive the real build and capture proof before claiming a game change works.

- Prose follows `.claude/skills/unslop/SKILL.md`. That skill cannot be invoked as a tool, so read it before writing prose for this repository.
- The issue tracker is GitHub Issues. See `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`.

## Proof

Every implementation pull request commits a proof bundle from `scripts/write-proof.sh`, and CI runs `scripts/check-proof.sh` on it. See Sweet Potato's [ADR 0005](https://github.com/Etdev2/sweet-potato/blob/main/docs/adr/0005-commit-a-proof-bundle-with-every-pull-request.md).
