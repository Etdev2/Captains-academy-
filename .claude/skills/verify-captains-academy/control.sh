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

launch() {
  ours && die "an instance from this script is already running (pid $(cat "$pid_file")). Run stop first."
  if curl -fsS -o /dev/null "$url" 2>/dev/null; then
    die "port $port already answers and this script did not start it. Pick another VERIFY_PORT."
  fi
  mkdir -p "$state_dir"
  [ -d node_modules ] || npm ci --no-audit --no-fund
  npx --no-install vite build --logLevel error
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
  local built head
  built="$(cat "$state_dir/build-commit")"
  head="$(git rev-parse HEAD)"
  if [ "$built" != "$head" ]; then
    echo "warning: the bundle was built at ${built:0:7}, but HEAD is ${head:0:7}. Run stop, then launch." >&2
  fi
  if ! git diff --quiet -- src missions play public; then
    echo "warning: src, missions, play or public has uncommitted changes the bundle may not include." >&2
  fi
  echo "ok: $url (pid $(cat "$pid_file"), build ${built:0:7})"
}

drive() {
  local steps="${1:?usage: control.sh drive STEPS.json}"
  ours || die "no instance from this script is running. Run launch."
  [ -f "$steps" ] || die "no steps file at $steps."
  local run="${VERIFY_RUN:-$(date -u +%Y%m%dT%H%M%SZ)}"
  local out="$root/verify-artifacts/$run"
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
  rm -f "$pid_file" "$state_dir/build-commit"
}

case "${1:-}" in
  launch) launch ;;
  doctor) doctor ;;
  drive) shift; drive "$@" ;;
  stop) stop ;;
  *) sed -n '4,13p' "$0" | sed 's/^# \{0,1\}//' >&2; exit 2 ;;
esac
