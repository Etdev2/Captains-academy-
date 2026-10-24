# Contributing to Captain's Academy

This file is for human contributors with Write access. Agents follow `AGENTS.md`, and so do you where it applies.

## Who merges

Only Et merges into `main` by default. Contributors may open pull requests and review each other's pull requests, but may not merge, including their own.

A bot may merge only after Et approves or asks for it, and only when all of these hold on the pull request's current head commit:

- Codex reviewed that exact head SHA and left no unresolved P0 or P1 finding.
- A Verifier reported PASS on that same head SHA.
- Every check is green.

A new commit resets all three.

## Review gates

Your pull requests go through the same gates as bot pull requests: a Codex review and a Verifier PASS on the same head commit, plus the `verify`, `proof` and Vercel checks. `.github/CODEOWNERS` names Et as the owner of every path.

## Branches and pull requests

- Branch from current `main` in this repository, not a fork. Name the branch by kind, for example `feat/harbor-lights`, `fix/sea-time-rounding` or `docs/glossary`.
- One ticket per pull request. Link the issue with `Etdev2/Captains-academy-#N` in the body.
- Open the pull request ready for review, not as a draft, once the checks pass locally.
- Never force-push a branch someone has reviewed. Add commits instead.

## Run the checks locally

Use Node 22 (see `.nvmrc`).

```bash
npm ci
npx playwright install chromium
bash scripts/verify.test.sh
bash scripts/verify.sh
```

`npm install` fails with npm 10 on this tree. If you must regenerate the lockfile, use `npx npm@11.21.0 install`.

## Proof bundle

Every pull request commits a proof bundle in `proof/`, and the `proof` check runs `scripts/check-proof.sh` on it. Write it after your last code change, then commit it:

```bash
scripts/write-proof.sh --ticket Etdev2/Captains-academy-#N \
  --fixture "what the commands ran against" \
  --shows "what the output proves" \
  --verification "bash scripts/verify.sh" \
  -- "bash scripts/verify.sh"
git commit -m "proof: ..."
bash scripts/check-proof.sh .
```

For a change with no behavior change, such as docs, add `--no-behavior-change "reason"`. Any later code change makes the bundle stale, so write it again.

## Product rules

Read the project rules in `AGENTS.md`. In particular, game and simulator time never counts as sea time, and the app never tells a user "you qualify."
