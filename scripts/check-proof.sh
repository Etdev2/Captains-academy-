#!/usr/bin/env bash
set -euo pipefail

# Fails a pull request whose proof bundle is missing, malformed, not PASS, or
# captured for different code than the pull request now contains.
repo="${1:-.}"
here="$(cd "$(dirname "$0")" && pwd)"

fail() {
  echo "::error file=proof/manifest.json::$1"
  exit 1
}

# Passes only when $1 is exactly one committed regular file. A literal pathspec
# stops "proof/*.log" matching by pattern, and the mode check stops a symlink
# or submodule standing in for bytes that were never committed.
committed_file_mode() {
  local entry
  # -z prints the raw path, so core.quotePath can't escape non-ASCII names.
  # Read only the first NUL-terminated record.
  IFS= read -r -d '' entry \
    < <(git -C "$repo" ls-files -z --full-name --format='%(objectmode) %(path)' -- ":(top,literal)$1") \
    || return 1
  [ "${entry#* }" = "$1" ] || return 1
  case "${entry%% *}" in
    100644|100755) return 0 ;;
    *) return 2 ;;
  esac
}

code=0
committed_file_mode proof/manifest.json || code=$?
case "$code" in
  0) ;;
  1) [ -e "$repo/proof/manifest.json" ] \
       || fail "No proof bundle. Run the project's verification skill, then commit proof/manifest.json and its evidence."
     fail "proof/manifest.json is not committed. Commit the manifest with its evidence." ;;
  *) fail "proof/manifest.json is not a regular file. Commit the manifest itself, not a symlink." ;;
esac

# Validate the committed manifest, not whatever the working tree holds now.
manifest=$(mktemp)
trap 'rm -f "$manifest"' EXIT
git -C "$repo" show ":proof/manifest.json" > "$manifest"
jq empty "$manifest" 2>/dev/null || fail "proof/manifest.json is not valid JSON."

problems=$(jq -r '
  def nonempty: type == "string" and length > 0;
  def kinds: ["screenshot", "video", "trace", "log", "terminal"];

  (select(.schemaVersion != 1) | "schemaVersion must be 1."),
  (select(.ticket | nonempty and test("^[^/]+/[^/#]+#[0-9]+$") | not)
    | "ticket must look like owner/repo#123."),
  (select(.sourceDigest | nonempty and test("^sha256:[0-9a-f]{64}$") | not)
    | "sourceDigest must come from scripts/proof-digest.sh."),
  (select(.capturedAt | nonempty | not) | "capturedAt is missing."),
  (select(.result | IN("PASS", "FAIL", "INCONCLUSIVE") | not)
    | "result must be PASS, FAIL or INCONCLUSIVE."),
  (select(.result | IN("FAIL", "INCONCLUSIVE"))
    | "Verification reported \(.result). Only a PASS bundle can merge. Fix the change or the environment and re-run verification."),
  (select((.verification.command | nonempty) and (.verification.fixture | nonempty) | not)
    | "verification needs the command that was run and the fixture it used."),
  (select((.commands | type) != "array" or (.commands | length) == 0)
    | "commands must list every check run, with its exit code."),
  (.commands[]? | select((.command | nonempty | not) or (.exitCode | type) != "number")
    | "Each command needs command and exitCode."),
  (.commands[]? | select((.exitCode | type) == "number" and .exitCode != 0)
    | "\(.command) exited \(.exitCode). Proof needs every check to pass."),
  (select((.behaviorChanged | type) != "boolean") | "behaviorChanged must be true or false."),
  (select(.behaviorChanged == true and ((.evidence | type) != "array" or (.evidence | length) == 0))
    | "Behavior changed, so evidence from the real artifact is required."),
  (select(.behaviorChanged == false and (.noBehaviorReason | nonempty | not))
    | "behaviorChanged is false, so noBehaviorReason must say why no user-visible proof applies."),
  (.evidence[]? | select((.path | nonempty and startswith("proof/") and (contains("..") | not)) | not)
    | "Evidence path \(.path | tojson) must sit inside proof/."),
  (.evidence[]? | select(.path | type == "string" and test("[[:cntrl:]]"))
    | "Evidence path \(.path | tojson) must not contain a newline or other control character."),
  (.evidence[]? | select(.kind | IN(kinds[]) | not)
    | "Evidence kind \(.kind | tojson) must be one of: \(kinds | join(", ")).")
  , (.evidence[]? | select(.shows | nonempty | not)
    | "Evidence \(.path) needs shows: what a reader should see in it.")
' "$manifest")

if [ -n "$problems" ]; then
  while IFS= read -r problem; do
    echo "::error file=proof/manifest.json::$problem"
  done <<< "$problems"
  exit 1
fi

while IFS= read -r path; do
  code=0
  committed_file_mode "$path" || code=$?
  case "$code" in
    0) ;;
    2) fail "Evidence $path is not a regular file. Commit the evidence itself, not a symlink or submodule." ;;
    *) fail "Evidence $path is not committed." ;;
  esac
done < <(jq -r '.evidence[]?.path' "$manifest")

# Count the committed bytes in proof/, not whatever the working tree points to.
cap=$((5 * 1024 * 1024))
size=$(git -C "$repo" ls-files --format='%(objectsize)' -- ':(top)proof' | awk '{ total += $1 } END { print total + 0 }')
[ "$size" -le "$cap" ] \
  || fail "proof/ holds $size bytes, over the 5 MB cap. Compress screenshots, trim logs, or link a long video from the pull request instead."

claimed=$(jq -r '.sourceDigest' "$manifest")
actual=$("$here/proof-digest.sh" "$repo")
[ "$claimed" = "$actual" ] \
  || fail "Proof is stale. It was captured for $claimed, but the code is now $actual. Re-run verification on the current code and commit a new bundle."

echo "Proof bundle is valid: $(jq -r '.result' "$manifest") for $(jq -r '.ticket' "$manifest")."
