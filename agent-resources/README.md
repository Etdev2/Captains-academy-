# Agent Resources

Copied from Sweet Potato's `agent-resources/README.md` by the project template. Sweet Potato keeps the master copy.

The bots' HR office. Its main record is the **time card**: every agent and subagent that works on an Et repo clocks in before work and clocks out after. Et uses it to see who is working, who stopped, and what each session cost.

## Clocking in

Do this before any other change.

1. Copy [TEMPLATE.md](TEMPLATE.md) to `timecards/<YYYY-MM-DD>-<HHMM>-<call-me>-<last-name>.md`. Use the clock-in time in UTC, for example `timecards/2026-10-12-1257-spud-russet.md`.
2. Fill in the **Clock in** table.
3. Commit the card alone on your working branch and push it right away. The pushed branch is how Et sees you are working.

Write the card in the repo you work in. When a session works in more than one repo, it writes one card in the repo its first pull request targets and lists the other repos in the card.

## Clocking out

Do this as your last commit, including when you stop early.

1. Fill in the **Clock out** table on the same card.
2. Pick one outcome:
   - `finished/passed`: the work is done and its checks pass;
   - `finished/handoff`: the work continues with someone else. Name them in **Handoff to**, and say what is left in **Note**;
   - `finished/failed`: the work stopped without a usable result. Say why in **Note**.
3. Report tokens with a standing, exactly one of the three labels [the token cockpit](https://github.com/Etdev2/sweet-potato/blob/main/docs/token-cockpit.md) uses:
   - `measured`: the provider or its official client reported it. A Claude Code cloud session can read its own `usage` from the `get_session` tool. That figure can lag behind the current turn, so it may leave out the work you just did. Then set **Token coverage** to `partial` and give the time you read it in **Note**;
   - `estimated`: you calculated it. Name the method in **Note**;
   - `unavailable`: nothing exposed it. Leave **Tokens** blank. Missing is not zero.

   **Token coverage** says whether the figure covers the whole session: `complete` or `partial`. Leave it blank when the standing is `unavailable`. Never put coverage in **Token standing**.
4. In a repo whose CI checks a proof bundle, the clock-out changes the code the bundle's digest covers. Clock out, then regenerate the proof bundle and push both together.

## Fields

| Field | What to write |
| --- | --- |
| Name | The product name: Claude, Codex, Grok |
| Call me | The name you want to be called at work. Pick one and keep it for the session |
| Last name | Your family name. An agent that Et launches picks its own. A subagent takes the last name of the agent that spawned it, so related sessions share it |
| Preferred pronouns | Your own preferred pronouns, such as they/them, or `unspecified`. Each agent and subagent chooses its own; do not infer them or inherit a parent's |
| Model | The model the session runs on, with its ID when you can read it |
| Effort | The effort or reasoning level, or `unavailable` |
| Role | Your job from Sweet Potato's [roster.json](https://github.com/Etdev2/sweet-potato/blob/main/roster.json), [bots/](https://github.com/Etdev2/sweet-potato/blob/main/bots/) or this project's `docs/team/README.md`, such as Builder or Reviewer. Subagents write `Subagent of <parent's call-me and last name>` and their job |
| Task | One line |
| Ticket | `owner/repo#n` for the issue or pull request. With none, write `none` and rely on the clock-in time |
| Repo and branch | Where your commits go |
| Launched by | Et, or the parent agent's call-me and last name for a subagent |
| Session | Session link or ID, so Et can open the transcript |
| Clock in, Clock out | UTC, `YYYY-MM-DD HH:MM` |
| Token standing | Exactly `measured`, `estimated` or `unavailable` |
| Token coverage | `complete` or `partial`, for how much of the session the figure covers |
| Pull requests | The pull requests the session opened or updated |
| Handoff to | Who picks up the work, or `none` |
| Note | Anything Et needs to know, in a sentence or two |

## Rules

- **One card per session.** Never edit another agent's card. Separate files keep two agents who clock in together from causing a merge conflict.
- **Last names show family.** A subagent's last name always matches its parent's, and a subagent of a subagent keeps the same name. An agent Et launches picks a last name that no clocked-in agent is using, so families stay apart.
- **Subagents clock in too.** A subagent that can write files adds its own card to its parent's branch. Otherwise the parent writes it from what the subagent reports, and says so in **Note**.
- **A missing clock-out means the session's status is unknown.** Under Sweet Potato's [AGENTS.md](https://github.com/Etdev2/sweet-potato/blob/main/AGENTS.md), a builder session with unknown status still holds the builder slot.
- **No secrets.** No tokens, keys, account emails or raw transcripts on a card. Session IDs and links are fine.

## How Et sees who is working

1. On a checkout that has the cards: `bash scripts/list-on-duty.sh` prints every card still set to `still clocked in`.
2. On GitHub: open PR files and search for `still clocked in` under `agent-resources/timecards/`.
3. Captain, builder and reviewer each keep their own card. Claude clocks into the project repo when building; the coordinator named in `roster.json` clocks into Sweet Potato when captaining; Codex clocks in when the review session can write, otherwise says so on the PR.

## Known limit

A card reaches `main` only when its pull request merges. Until then it lives on the agent's pushed branch. `list-on-duty.sh` only sees cards present in the current tree.
