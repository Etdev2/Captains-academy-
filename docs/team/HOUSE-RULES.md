# House Rules

Shared by every agent. Read once, at the start of your task. Do not copy this file's
contents into other files. Link to it.

These rules add to [Sweet Potato's agent environment contract](https://github.com/Etdev2/sweet-potato/blob/main/docs/agent-environment.md).
Where the two disagree, the stricter rule wins.

## 1. The team is horizontal

There is no chain of command for *ideas*. Anyone may challenge anyone, in any field.
A UX objection to a database schema is valid. An architect's objection to a button
label is valid.

There IS a chain of command for *decisions*:

- Scope / "are we building this at all" -> CEO
- Sequencing / "what happens this week" -> COO
- Code structure / "where does this file live" -> Architect
- Implementation behavior -> Head Developer
- Merge order and integration readiness -> Git Integration Agent
- Merge to `main` -> Et, the only merge authority on product repositories

Disagree, state it once in the channel, then commit to the decision.

## 2. Read the framework's own docs

Before writing app code, read the documentation for the framework version this repo
pins, not your memory of it. `AGENTS.md` names where those docs live. This overrides
your training data.

## 3. Git

- Never commit directly to `main`. Branch: `<role>/<short-slug>` e.g.
  `ux-ui/signup-form-a11y`.
- Branches belong to independent write workstreams, not to agent identities. Read-only
  work needs no branch. Helpers in the same workstream normally share its branch.
- Every initiative has one coordinating COO. Every active write lane has one assigned
  runtime, role, branch, worktree, and exclusive file set. The durable assignment format
  and cross-runtime protocol are in `AI-OPERATING-SYSTEM.md`.
- **Create and push a write-workstream branch when work starts, not when it finishes.**
  An empty pushed branch is a public claim on the work.
- One concern per branch. Small PRs integrate; big PRs rot.
- Simultaneous write workstreams use separate worktrees. Never switch branches inside
  another active agent's worktree, and never assign concurrent edits to the same file.
- Never stage, commit, revert, restore, push, or otherwise preserve another lane's work.
  On unexpected foreign changes, stop touching the affected paths and notify the
  coordinating COO. Read-only inspection may be shared.
- PR body = what changed, why, how it was checked. Three bullets are enough.
- Workers may commit and push only their assigned branch. They do not merge into `main`.
- `code-reviewer` reviews, `test-agent` verifies, and `git-integrator` alone owns rebase,
  merge order, integration readiness, and completed branch/worktree cleanup. Et merges.
- `git-integrator` may resolve mechanical conflicts such as imports, formatting, and
  documentation. It must return semantic conflicts to `head-dev` or `architect`; it
  never guesses which business logic is correct.
- **Push before you stop, finished or not.** Committed is not saved. A session can end
  mid-sentence on a usage limit, and unpushed work exists on one machine only. Ending a
  session without pushing is the single most expensive mistake in this repo.
- Never commit `.env.local`, keys, tokens, webhook URLs or a real user's personal data.

**Before you stop, always:**

```
git push -u origin HEAD && git status --short
```

Blank status plus a successful push means your work is safe. Nothing else does.

## 4. Definition of done

The verification command in `AGENTS.md` passes, along with the lane's required checks.
The pull request carries a `PASS` proof bundle from `scripts/write-proof.sh`. You have
used the real application, or you say plainly that you have not.

## 5. The channel

One file per message in `docs/team/channel/`. **Never append to a shared file.** Shared
files cause a merge conflict whenever two agents write at once. Create
`YYYY-MM-DD-NN-fromrole-to-torole.md` and use it when you find something *another role*
needs, not to narrate your own work.

```
### 2026-10-20 | architect -> ux-ui
The form saves through the sync queue, so a save can succeed offline and fail an
hour later. The screen needs a pending state, not just success and error.
```

Reply by creating a new file addressed back to them. Never edit or delete anyone else's
file. Read only your own mail: `ls docs/team/channel/ | grep -- '-to-.*<yourrole>'`.
Full conventions in `docs/team/CHANNEL.md`.

## 6. The worklog and the time card

Clock in on a time card in `agent-resources/timecards/` before work and clock out after.
See `agent-resources/README.md`. The card records who worked, the outcome and the tokens.

The worklog tells the story. One file per session in `docs/team/worklog/`, named
`YYYY-MM-DD-NN-yourrole.md`. **Never append to a shared file.** Plain English, written so
a person who does not code can read it and know what happened.

```
### 2026-10-20 | head-dev | 40m
- The sign-up form crashed when the date was left empty. Fixed.
- Turned on the type checker in CI so this kind of bug stops at the pull request.
- Files: src/features/signup/form.tsx, .github/workflows/ci.yml
- Next: nobody has tested the form on a real phone yet.
```

Rules: no jargon, no ticket numbers, say the honest time, say what is still broken.
Full conventions in `docs/team/WORKLOG.md`.

## 7. Token discipline (CFO enforces)

- Do not read a file you do not need. Do not re-read a file you just wrote.
- Search with `grep`/`rg` for the line, then read around it. Do not cat 900-line files.
- Facts that outlive the session go in git, not in a long conversation. Git is free
  to store and cheap to grep; conversation context is paid for on every single turn.
- `CLAUDE.md` and `AGENTS.md` load into *every* session. Keep them tiny. Point to
  paths, do not `@`-import docs.
- Use the configured LOW agent for deterministic transformation and search, MEDIUM for
  ordinary implementation and judgment, and HIGH only where deeper reasoning materially
  changes the outcome. Full routing rules are in `AI-OPERATING-SYSTEM.md`.
- Spawn only when a bounded specialist context or genuine independent parallelism saves
  more than the extra agent costs. Agent count is not productivity.
- Assignments and handoffs use only the compact record in `AI-OPERATING-SYSTEM.md`.
  Do not forward the parent's transcript.
- Employee names are platform-neutral. Use the active platform's matching adapter unless
  the user requests Claude-only, Codex-only, or mixed execution. Cross-platform work uses
  repository artifacts; never pretend one vendor's local subagent is the other vendor.
- One COO coordinates each initiative across runtimes. Agents stay inside their recorded
  write lanes; the architect decides structure and the Git Integration Agent alone
  integrates completed lanes.
- Finish in your own lane. Escalate an unresolved decision; do not duplicate reasoning
  across several equally powerful agents.

## 8. Agent escalation

The default ladder is LOW -> MEDIUM -> HIGH. After one or two materially different
failed attempts, escalate instead of retrying at the same tier. HIGH normally returns a
decision or plan downward for execution. Role boundaries, permissions, and escalation
targets are defined in `AI-OPERATING-SYSTEM.md` and `.claude/agents/`.
