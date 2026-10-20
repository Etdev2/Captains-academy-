#!/usr/bin/env bash
set -euo pipefail

# Tests scripts/verify.sh against small throwaway projects: it must skip while
# nothing exists and fail hard once a target does. Runs offline.
here="$(cd "$(dirname "$0")" && pwd)"
node_major="$(node -p 'process.versions.node.split(".")[0]')"
passed=0
failed=0

# Builds an empty project holding only verify.sh, then runs the setup command
# inside it.
fixture() {
  local dir
  dir="$(mktemp -d)"
  mkdir -p "$dir/scripts"
  cp "$here/verify.sh" "$dir/scripts/verify.sh"
  (cd "$dir" && eval "$1")
  printf '%s' "$dir"
}

# expect NAME WANT_EXIT WANT_TEXT SETUP
expect() {
  local name=$1 want_exit=$2 want_text=$3 setup=$4 dir out code=0
  dir="$(fixture "$setup")"
  out="$(bash "$dir/scripts/verify.sh" 2>&1)" || code=$?
  rm -rf "$dir"
  if { [ "$code" = "$want_exit" ] || { [ "$want_exit" = nonzero ] && [ "$code" != 0 ]; }; } && grep -qF -- "$want_text" <<< "$out"; then
    echo "ok   $name"
    passed=$((passed + 1))
  else
    echo "FAIL $name: wanted exit $want_exit and '$want_text', got exit $code:"
    sed 's/^/     /' <<< "$out"
    failed=$((failed + 1))
  fi
}

lock='{"name":"t","version":"1.0.0","lockfileVersion":3,"requires":true,"packages":{"":{"name":"t","version":"1.0.0"}}}'

expect "empty project skips all nine steps" 0 "0 step(s) ran, 9 skipped." ":"

expect "app code without package.json fails" 1 "src/ has app code but there is no package.json" \
  "mkdir src && echo 'export {};' > src/main.ts"

expect "package.json without a Node pin fails" 1 "no Node pin" \
  "echo '{\"name\":\"t\",\"version\":\"1.0.0\"}' > package.json"

expect "wrong Node major fails" 1 "the project pins major 1" \
  "echo '{\"name\":\"t\",\"version\":\"1.0.0\"}' > package.json && echo 1 > .nvmrc"

expect "missing lockfile fails" 1 "package-lock.json is missing" \
  "echo '{\"name\":\"t\",\"version\":\"1.0.0\"}' > package.json && echo $node_major > .nvmrc"

expect "phaser with a caret range fails" 1 "phaser is not pinned exactly" \
  "echo '{\"name\":\"t\",\"version\":\"1.0.0\",\"dependencies\":{\"phaser\":\"^4.2.1\"}}' > package.json \
   && echo $node_major > .nvmrc && echo '$lock' > package-lock.json"

expect "app code without tsconfig fails" 1 "src/ has app code but there is no tsconfig.json" \
  "echo '{\"name\":\"t\",\"version\":\"1.0.0\"}' > package.json && echo $node_major > .nvmrc \
   && echo '$lock' > package-lock.json && mkdir src && echo 'export {};' > src/main.ts"

expect "tsconfig without the tsc binary fails" nonzero 'FAIL: step "tsc --noEmit"' \
  "echo '{\"name\":\"t\",\"version\":\"1.0.0\"}' > package.json && echo $node_major > .nvmrc \
   && echo '$lock' > package-lock.json && echo '{}' > tsconfig.json"

expect "mission JSON without validate:missions fails" 1 "no validate:missions script" \
  "echo '{\"name\":\"t\",\"version\":\"1.0.0\"}' > package.json && echo $node_major > .nvmrc \
   && echo '$lock' > package-lock.json && mkdir missions && echo '{}' > missions/m1.json"

expect "a failing mission validation fails" nonzero 'FAIL: step "mission JSON validation" exited 3.' \
  "echo '{\"name\":\"t\",\"version\":\"1.0.0\",\"scripts\":{\"validate:missions\":\"exit 3\"}}' > package.json \
   && echo $node_major > .nvmrc && echo '$lock' > package-lock.json && mkdir missions && echo '{}' > missions/m1.json"

echo
echo "verify.test.sh: $passed passed, $failed failed."
[ "$failed" = 0 ]
