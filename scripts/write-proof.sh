#!/usr/bin/env bash
set -euo pipefail

# Writes a proof bundle for the current change, as ADR 0005 requires:
# replaces proof/ with the real output of the given commands and a manifest
# tied to the staged code. The result is PASS only when every command exits 0.
#
#   scripts/write-proof.sh --ticket owner/repo#123 --fixture TEXT --shows TEXT \
#     [--verification CMD] [--no-behavior-change REASON] [--repo DIR] \
#     -- "first command" "second command" ...
#
# It stages every change outside proof/, runs each command from the repository
# root, then stages proof/. Commit afterwards. It exits 0 only for a PASS
# bundle that scripts/check-proof.sh accepts.

usage() {
  sed -n '8,10p' "$0" | sed 's/^# \{0,1\}//' >&2
  exit 2
}

repo=.
ticket=""
fixture=""
shows=""
verification=""
no_behavior_reason=""
while [ $# -gt 0 ]; do
  case "$1" in
    --ticket) ticket=${2:?}; shift 2 ;;
    --fixture) fixture=${2:?}; shift 2 ;;
    --shows) shows=${2:?}; shift 2 ;;
    --verification) verification=${2:?}; shift 2 ;;
    --no-behavior-change) no_behavior_reason=${2:?}; shift 2 ;;
    --repo) repo=${2:?}; shift 2 ;;
    --) shift; break ;;
    *) usage ;;
  esac
done
[ -n "$ticket" ] && [ -n "$fixture" ] && [ -n "$shows" ] && [ $# -gt 0 ] || usage

here="$(cd "$(dirname "$0")" && pwd)"
root=$(git -C "$repo" rev-parse --show-toplevel)
cd "$root"
[ -n "$verification" ] || verification=$1

# A symlinked proof/ would send every write below outside the repository.
if [ -L proof ] || { [ -e proof ] && [ ! -d proof ]; }; then
  echo "proof is a symlink or not a directory. Replace it with a real directory, then run this script again." >&2
  exit 1
fi

# Each pull request replaces the previous bundle. The final `git add` records
# the old files' removal.
if [ -d proof ]; then
  find proof -mindepth 1 -delete
fi
mkdir -p proof

# The drift check must not call a repository file, because a verification
# command could replace it. This function lives in this shell, out of the
# commands' reach. It hashes the same listing as scripts/proof-digest.sh.
staged_digest() {
  printf 'sha256:%s\n' "$(git ls-files --stage -z --full-name -- ':/' ':(top,exclude)proof' | sha256sum | cut -d' ' -f1)"
}

# After staging, the only difference left between the index and the working
# tree is uncommitted work inside a submodule, which the digest can't see.
require_clean_submodules() {
  git diff --quiet --ignore-submodules=none -- ':(top,exclude)proof' && return 0
  echo "A submodule has uncommitted changes the digest can't see. Commit them in the submodule, then run this script again." >&2
  exit 1
}

# Files marked assume-unchanged (lowercase tag) or skip-worktree (S) are
# skipped by `git add`, so their changes would never reach the digest.
require_plain_index() {
  # Read whole NUL-terminated records, so a filename containing a newline
  # can't pose as a flagged entry. The loop never stops early, so git can't
  # die of SIGPIPE, and a git failure stops this script under pipefail.
  # Some locales let [a-z] match capitals such as H; [[:lower:]] never does.
  local flagged entry
  flagged=$(git ls-files -v -z | while IFS= read -r -d '' entry; do
    case "$entry" in
      [[:lower:]]' '* | 'S '*) echo flagged ;;
    esac
  done)
  [ -n "$flagged" ] || return 0
  echo "Some tracked files are marked assume-unchanged or skip-worktree, so git can't see their changes. Clear those flags, then run this script again." >&2
  exit 1
}

# The check at the top, repeated after the commands have run.
require_own_proof_dir() {
  [ ! -L proof ] && [ -d proof ] && return 0
  echo "A command replaced proof/ with a symlink or a file, so nothing was written there. Restore proof/ as a real directory, then run this script again." >&2
  exit 1
}

git add -A -- ':(top,exclude)proof'
require_clean_submodules
require_plain_index
digest=$(staged_digest)
if [ "$("$here/proof-digest.sh" .)" != "$digest" ]; then
  echo "scripts/proof-digest.sh disagrees with this script's digest. Fix it before writing proof." >&2
  exit 1
fi

# A command can replace proof/ or a file in it with a link to somewhere
# else. So the log builds outside the repository, and this script writes into
# proof/ only after the last command, through require_own_proof_dir.
evidence=proof/verification.txt
log=$(mktemp)
trap 'rm -f "$log"' EXIT
# mktemp follows TMPDIR, which could point inside the repository.
case "$(cd "$(dirname "$log")" && pwd -P)/" in
  "$(pwd -P)/"*)
    echo "TMPDIR is inside the repository, where a command could redirect the log. Point TMPDIR outside the repository, then run this script again." >&2
    exit 1 ;;
esac
# Open the log once, so a command that replaces its path can't redirect
# these writes or the final read. The commands themselves don't get the
# descriptors.
exec 3>> "$log" 4< "$log"
commands='[]'
result=PASS
for command in "$@"; do
  code=0
  {
    [ "$commands" = '[]' ] || printf '\n'
    printf '$ %s\n' "$command"
    bash -c "$command" 2>&1 3>&- 4<&- || code=$?
    printf '[exit %s]\n' "$code"
  } >&3
  commands=$(jq -c --arg c "$command" --argjson e "$code" '. + [{command: $c, exitCode: $e}]' <<< "$commands")
  [ "$code" -eq 0 ] || result=FAIL
done

# Verification must not change the code it verified.
require_plain_index
git add -A -- ':(top,exclude)proof'
require_clean_submodules
if [ "$(staged_digest)" != "$digest" ]; then
  echo "A command changed files outside proof/. Review and stage those changes, then run this script again." >&2
  exit 1
fi

require_own_proof_dir
# Remove before writing, so a link a command left in proof/ is replaced
# rather than written through.
rm -f -- "$evidence" proof/manifest.json
cat <&4 > "$evidence"
jq -n \
  --arg ticket "$ticket" \
  --arg digest "$digest" \
  --arg at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg result "$result" \
  --arg verification "$verification" \
  --arg fixture "$fixture" \
  --argjson commands "$commands" \
  --arg evidence "$evidence" \
  --arg shows "$shows" \
  --arg reason "$no_behavior_reason" '
  {
    schemaVersion: 1,
    ticket: $ticket,
    sourceDigest: $digest,
    capturedAt: $at,
    result: $result,
    verification: {command: $verification, fixture: $fixture},
    commands: $commands,
    behaviorChanged: ($reason == ""),
    evidence: [{path: $evidence, kind: "terminal", shows: $shows}]
  }
  + (if $reason == "" then {} else {noBehaviorReason: $reason} end)' > proof/manifest.json

git add -- proof
echo "Wrote a $result proof bundle for $ticket. Commit proof/ with the change."
[ "$result" = PASS ] || exit 1
"$here/check-proof.sh" .
