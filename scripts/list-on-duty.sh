#!/usr/bin/env bash
set -euo pipefail

# Lists time cards that are still clocked in on the current checkout.
# Cards on unmerged branches appear only after that branch is checked out
# or fetched into this tree. Et can also scan open PR diffs for new cards.

root="$(cd "$(dirname "$0")/.." && pwd)"
dir="$root/agent-resources/timecards"

if [ ! -d "$dir" ]; then
  echo "No timecards directory at $dir"
  exit 0
fi

field() {
  local file="$1"
  local label="$2"
  # Match markdown table rows like: | Label | value |
  sed -n "s/^| ${label} | \\(.*\\) |$/\\1/p" "$file" | head -n 1 | sed 's/[[:space:]]*$//'
}

found=0
while IFS= read -r -d '' card; do
  if grep -q '| Clock out (UTC) | still clocked in |' "$card"; then
    found=1
    rel="${card#"$root"/}"
    call_me=$(field "$card" "Call me")
    last=$(field "$card" "Last name")
    role=$(field "$card" "Role")
    task=$(field "$card" "Task")
    branch=$(field "$card" "Repo and branch")
    printf '%s %s (%s)\n  branch: %s\n  task: %s\n  card: %s\n\n' \
      "$call_me" "$last" "$role" "$branch" "$task" "$rel"
  fi
done < <(find "$dir" -maxdepth 1 -type f -name '*.md' -print0 | sort -z)

if [ "$found" -eq 0 ]; then
  echo "No one is clocked in on this checkout."
  echo "Open PR branches may still hold active cards until they merge."
fi
