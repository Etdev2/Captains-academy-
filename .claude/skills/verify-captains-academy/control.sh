#!/usr/bin/env bash
set -euo pipefail

# Launch, check, drive and stop one verification instance of the /play game.
#
#   control.sh launch            build the production bundle and serve it
#   control.sh doctor            read-only health check of the instance this script started
#   control.sh drive STEPS.json  drive the game with Playwright; evidence goes to the run folder
#   control.sh stop              stop the instance this script started; evidence stays
#
# Environment:
#   VERIFY_PORT  port for the instance (default 4180, so it never meets the e2e server on 4173)
#   VERIFY_RUN   run folder name under verify-artifacts/ (default: UTC timestamp)

here="$(cd "$(dirname "$0")" && pwd)"
root="$(git -C "$here" rev-parse --show-toplevel)"
cd "$root"

port="${VERIFY_PORT:-4180}"
state_dir="$root/verify-artifacts/.instance"
pid_file="$state_dir/server.pid"
url="http://127.0.0.1:$port/play/"

die() { echo "control.sh: $*" >&2; exit 1; }

ours() {
  [ -f "$pid_file" ] && kill -0 "$(cat "$pid_file")" 2>/dev/null
}

# What vite build reads, as it sits on disk: tracked and untracked files alike,
# staged or not. A digest of their names and contents, so any edit, new file or
# deletion after launch shows up as a different value.
build_inputs_digest() {
  git ls-files -z -c -o --exclude-standard -- \
    src missions play public vite.config.ts tsconfig.json package.json package-lock.json |
    sort -z |
    while IFS= read -r -d '' f; do
      [ -f "$f" ] && sha256sum -- "$f"
    done |
    sha256sum | cut -d' ' -f1
}

# The bundle vite preview serves was built from the files on disk now.
require_fresh() {
  [ -f "$state_dir/build-inputs" ] || die "no record of what the bundle was built from. Run stop, then launch."
  [ "$(cat "$state_dir/build-inputs")" = "$(build_inputs_digest)" ] ||
    die "the build inputs changed since launch, so the bundle is stale. Run stop, then launch."
}

launch() {
  ours && die "an instance from this script is already running (pid $(cat "$pid_file")). Run stop first."
  if curl -fsS -o /dev/null "$url" 2>/dev/null; then
    die "port $port already answers and this script did not start it. Pick another VERIFY_PORT."
  fi
  mkdir -p "$state_dir"
  [ -d node_modules ] || npm ci --no-audit --no-fund
  local inputs
  inputs="$(build_inputs_digest)"
  npx --no-install vite build --logLevel error
  echo "$inputs" > "$state_dir/build-inputs"
  git rev-parse HEAD > "$state_dir/build-commit"
  # Its own session and process group, so stop can end npx and the server under it together.
  setsid nohup npx --no-install vite preview --host 127.0.0.1 --port "$port" --strictPort \
    > "$state_dir/server.log" 2>&1 < /dev/null &
  echo $! > "$pid_file"
  for _ in $(seq 1 60); do
    if curl -fsS -o /dev/null "$url" 2>/dev/null; then
      echo "ready: $url (pid $(cat "$pid_file"), build $(cut -c1-7 "$state_dir/build-commit"))"
      return 0
    fi
    sleep 0.5
  done
  die "the server did not answer at $url within 30 s. See $state_dir/server.log."
}

doctor() {
  ours || die "no instance from this script is running. Run launch."
  local html
  html="$(curl -fsS "$url")" || die "$url does not answer."
  grep -q 'id="game"' <<< "$html" || die "$url answers but has no #game element: wrong app on this port?"
  require_fresh
  local built
  built="$(cat "$state_dir/build-commit")"
  echo "ok: $url (pid $(cat "$pid_file"), built at ${built:0:7}, inputs $(cut -c1-12 "$state_dir/build-inputs"))"
}

drive() {
  local steps="${1:?usage: control.sh drive STEPS.json}"
  ours || die "no instance from this script is running. Run launch."
  [ -f "$steps" ] || die "no steps file at $steps."
  require_fresh
  local run="${VERIFY_RUN:-$(date -u +%Y%m%dT%H%M%SZ)}"
  local out="$root/verify-artifacts/$run"
  # A run folder holds one drive's evidence only, so nothing stale passes as new.
  if [ -d "$out" ] && [ -n "$(ls -A "$out")" ]; then
    die "verify-artifacts/$run already holds evidence from another drive. Pick a new VERIFY_RUN, or move that folder away first."
  fi
  mkdir -p "$out"
  node "$here/drive.mjs" "$url" "$steps" "$out"
}

stop() {
  if ours; then
    local pid
    pid="$(cat "$pid_file")"
    # vite preview runs a few processes deep under npx. launch made the first
    # one a process group leader, so ending the group ends them all.
    kill -- "-$pid" 2>/dev/null || true
    for _ in $(seq 1 20); do
      kill -0 -- "-$pid" 2>/dev/null || break
      sleep 0.25
    done
    if kill -0 -- "-$pid" 2>/dev/null; then
      kill -KILL -- "-$pid" 2>/dev/null || true
    fi
    echo "stopped process group $pid"
  else
    echo "no instance from this script is running"
  fi
  rm -f "$pid_file" "$state_dir/build-commit" "$state_dir/build-inputs"
}

case "${1:-}" in
  launch) launch ;;
  doctor) doctor ;;
  drive) shift; drive "$@" ;;
  stop) stop ;;
  *) sed -n '4,13p' "$0" | sed 's/^# \{0,1\}//' >&2; exit 2 ;;
esac
