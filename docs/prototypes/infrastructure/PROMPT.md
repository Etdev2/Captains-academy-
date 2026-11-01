# Prompts: prototype the AI studio

Two throwaway prototypes test the riskiest parts of the plan before anyone buys hardware or more seats. Hand prompt 1 to a `head-dev` session. Prompt 2 is a checklist that needs Et and a second person at the keyboard.

Read [`README.md`](README.md) and open [`playable/infrastructure-prototype.html`](playable/infrastructure-prototype.html) first. The full plan is in [`reports/`](reports/).

## Prompt 1: hill-climb loop simulator

---

Build a throwaway logic prototype of the AI studio's hill-climbing loop, using the `mattpocock-skills:prototype` skill, logic branch.

Read first:

- `docs/prototypes/infrastructure/reports/01-infrastructure-design.pdf`, the section "The hill-climbing loop".
- `docs/prototypes/infrastructure/reports/gpt-review.md`, risks R3 to R7. The prototype exists to show whether the loop's rules handle them.
- `.claude/skills/unslop/SKILL.md` for every label and sentence on the page.

Build one file: `docs/prototypes/infrastructure/playable/loop-simulator.prototype.html`. It opens by double-click with no server, bundler or framework. Put the logic in one pure `<script>` block with no DOM access. Its main function takes a seed, the round settings and the current best, and returns the round's variants, scores, the keep or discard decision with its reason, and the ledger rows. The page calls that function and renders the result.

Simulate, do not call any model. Each variant has a hidden true gain and a measured score with random noise. Some variants cheat: one deletes a test, one special-cases the benchmark input, one exits early with a passing code.

The page shows, top to bottom: the settings (K variants per round, noise level, margin, seeds per paired re-run, weekly budget in rounds), a "Run one round" and a "Run until a stop rule fires" button, the score chart over rounds for the tuning, check and audit sets, the ledger table, and a state panel that names which stop rule fired.

Rules the logic must apply, each one visible on the page when it acts:

- Measure the noise margin from repeated baseline runs before the first round.
- Re-run the winner and the current best side by side across the set number of seeds, in random order. Keep the winner only if its paired gain beats the margin.
- Reject a variant whose test count dropped or whose evaluator hash changed. Flag it as cheating in the ledger.
- Use the audit set once, after the loop stops, and show it next to the tuning score.
- Stop on budget, on N rounds with no kept winner, when the check score falls while the tuning score rises, or when a past test fails.
- One writer for the ledger. Winners merge one at a time.

Hard rules:

- Save nothing. A refresh starts over.
- No tests, no error handling beyond what keeps it running.
- Phone width first, large tap targets, one accent color.

When it runs, run five seeded sessions and take one screenshot each into `docs/prototypes/infrastructure/images/`. Commit to a branch named `prototype/infrastructure-loop`, never to `main`. Report where the rules kept a cheater or threw away a real gain, then stop. Et reviews it next.

---

## Prompt 2: six-user Linux hub test (rollout step 5)

---

Run rollout step 5 from `docs/prototypes/infrastructure/reports/01-infrastructure-design.pdf` in an Ubuntu Server 24.04 VM on Et's MacBook Pro. Et types every password and does every login. Never read, print or copy a token.

1. Before changing anything, record the Mac's free disk space, the T3 Code version and the VM's memory and cores.
2. In the VM, create two test Linux users, not six. For each, run `sudo loginctl enable-linger <user>`, set its own `T3CODE_PORT` in `~/.t3/service.env`, and run `t3 service install`.
3. In each test user, sign in one Claude account and one Codex account, each with its own config folder. Confirm Claude Code and Codex report those accounts.
4. Run `t3 up` in each user and choose T3 Connect. From two phones on cellular, each phone must reach only its own user's service.
5. Test logout, VM reboot, Mac restart and network off then on. Write down what restarts by itself and what needs a person.
6. Repeat with six users only if two users pass every check. Record the VM's CPU and memory use with all six running one task.

Write the results to `docs/prototypes/infrastructure/hub-test.md`, one row per check with pass, fail and what a person had to do. Keep the VM, since its setup carries over to the tower. Delete the test users' logins when done. The result settles decision "Linux hub computer" on the infrastructure prototype page.

---
