#!/usr/bin/env bash
set -euo pipefail

# Project verification for the web app, cheapest step first. Run from anywhere.
#
# Every step skips cleanly, saying why, while its target does not exist yet,
# and fails hard once it does. Once app code exists under src/, every step
# except mission validation is required, so a missing config fails instead of
# skipping. Any failure exits nonzero.
#
# Out of scope on purpose: `cap sync` and native builds. They run in a
# separate mobile CI later.
#
# Environment:
#   VERIFY_UPDATE_REPLAYS=1  allow golden-replay files to change (runs vitest -u)

cd "$(dirname "$0")/.."

REPLAY_DIR="tests/replays"
steps_run=0
steps_skipped=0

current_step=""
step() { current_step=$1; echo; echo "==> $1"; }
# A tool that fails ends the run through set -e. Name the step it failed in.
trap 'code=$?; [ "$code" = 0 ] || echo "FAIL: step \"$current_step\" exited $code." >&2' EXIT
skip() { echo "SKIP: $1"; steps_skipped=$((steps_skipped + 1)); }
ran() { steps_run=$((steps_run + 1)); }
fail() { echo "FAIL: $1" >&2; exit 1; }
have_any() { local f; for f in "$@"; do [ -e "$f" ] && return 0; done; return 1; }
# Local binaries only: never download a tool mid-verification.
run() { npx --no-install "$@"; }

has_package=false
[ -f package.json ] && has_package=true

# App code makes every tool's config mandatory.
app_exists=false
if [ -n "$(find src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' \) -print -quit 2>/dev/null)" ]; then
  app_exists=true
fi
# Skip while there is no app code; fail once there is.
absent() {
  if $app_exists; then fail "src/ has app code but $1."; fi
  skip "$1"
}

sha256() { if command -v sha256sum >/dev/null; then sha256sum; else shasum -a 256; fi; }

# 1. Node pin, then a clean install from the lockfile.
step "Node version and npm ci"
if ! $has_package; then
  absent "there is no package.json"
else
  if [ -f .nvmrc ]; then
    want="$(tr -d 'v \r\n' < .nvmrc)"
  else
    want="$(node -p '(require("./package.json").engines || {}).node || ""')"
  fi
  [ -n "$want" ] || fail "package.json exists but no Node pin. Add .nvmrc or engines.node."
  want_major="$(printf '%s' "$want" | grep -oE '[0-9]+' | head -n1 || true)"
  [ -n "$want_major" ] || fail "Cannot read a Node major version from '$want'."
  have_major="$(node -p 'process.versions.node.split(".")[0]')"
  [ "$have_major" = "$want_major" ] \
    || fail "Node $(node -v) running, but the project pins major $want_major."
  [ -f package-lock.json ] || fail "package.json exists but package-lock.json is missing."
  node -e '
    const p = require("./package.json");
    const deps = Object.assign({}, p.dependencies, p.devDependencies);
    if (deps.phaser !== undefined && !/^\d+\.\d+\.\d+$/.test(deps.phaser)) {
      console.error("phaser must be pinned exactly (no ^ or ~), found " + deps.phaser);
      process.exit(1);
    }' || fail "phaser is not pinned exactly."
  npm ci
  ran
fi

# 2. Type check. The strict flags are required, not just whatever tsconfig says.
step "tsc --noEmit"
if [ ! -f tsconfig.json ]; then
  absent "there is no tsconfig.json"
else
  cfg="$(run tsc --showConfig)"
  for opt in strict noUncheckedIndexedAccess exactOptionalPropertyTypes noImplicitOverride noFallthroughCasesInSwitch; do
    printf '%s' "$cfg" | node -e '
      let s = "";
      process.stdin.on("data", (d) => (s += d)).on("end", () => {
        const o = JSON.parse(s).compilerOptions || {};
        process.exit(o[process.argv[1]] === true ? 0 : 1);
      });' "$opt" \
      || fail "tsconfig must set $opt to true."
  done
  run tsc --noEmit
  ran
fi

# 3. ESLint, with the import boundaries present in the config.
step "eslint --max-warnings=0"
eslint_config=""
for f in eslint.config.js eslint.config.mjs eslint.config.cjs eslint.config.ts eslint.config.mts; do
  if [ -f "$f" ]; then eslint_config="$f"; break; fi
done
if [ -z "$eslint_config" ]; then
  absent "there is no ESLint config"
else
  if [ -d src/sim ]; then
    # Rule text is checked here so a config that quietly drops a boundary fails.
    for needle in phaser src/platform '@revenuecat' Math.random Date performance.now requestAnimationFrame; do
      grep -qF -- "$needle" "$eslint_config" \
        || fail "$eslint_config has no rule mentioning '$needle'. src/sim may not import phaser, DOM globals or src/platform; @revenuecat/* only in src/platform; Math.random, Date, performance.now and requestAnimationFrame are banned in src/sim."
    done
  fi
  run eslint . --max-warnings=0
  ran
fi

# 4. Prettier.
step "prettier --check"
prettier_configured=false
if have_any .prettierrc .prettierrc.json .prettierrc.yaml .prettierrc.yml .prettierrc.js .prettierrc.cjs .prettierrc.mjs \
     prettier.config.js prettier.config.cjs prettier.config.mjs; then
  prettier_configured=true
elif $has_package && node -e 'process.exit(require("./package.json").prettier ? 0 : 1)'; then
  prettier_configured=true
fi
if $prettier_configured; then
  run prettier --check .
  ran
else
  absent "there is no Prettier config"
fi

# 5. Mission JSON schema validation (zod), through the project's own script.
step "mission JSON validation"
if [ ! -d missions ] || [ -z "$(find missions -name '*.json' -print -quit)" ]; then
  skip "no mission JSON yet"
else
  node -e 'process.exit(((require("./package.json").scripts) || {})["validate:missions"] ? 0 : 1)' \
    || fail "missions/ has JSON but package.json has no validate:missions script (zod schema check)."
  npm run --silent validate:missions
  ran
fi

# 6. Vitest, with golden replays frozen unless an update is asked for.
step "vitest (unit, adversarial, golden replay)"
tests_exist=false
if [ -n "$(find src tests -type f \( -name '*.test.ts' -o -name '*.spec.ts' \) -print -quit 2>/dev/null)" ]; then
  tests_exist=true
fi
if [ -d src/sim ] && [ -z "$(find "$REPLAY_DIR" -type f -print -quit 2>/dev/null)" ]; then
  fail "src/sim exists but $REPLAY_DIR has no golden replays. They are mandatory."
fi
if ! $tests_exist; then
  absent "there are no Vitest test files"
else
  replay_hash() {
    if [ -d "$REPLAY_DIR" ]; then
      # Names and contents both count, so a rename or swap is caught too.
      find "$REPLAY_DIR" -type f -print0 | sort -z \
        | while IFS= read -r -d '' f; do printf '%s\0' "$f"; cat "$f"; done | sha256
    else
      echo none
    fi
  }
  before="$(replay_hash)"
  if [ "${VERIFY_UPDATE_REPLAYS:-}" = "1" ]; then
    echo "VERIFY_UPDATE_REPLAYS=1: replay files may change."
    run vitest run -u
  else
    run vitest run
    [ "$(replay_hash)" = "$before" ] \
      || fail "A replay file under $REPLAY_DIR changed. Rerun with VERIFY_UPDATE_REPLAYS=1 if the change is intended."
  fi
  ran
fi

# 7. Production build.
step "vite build"
if have_any vite.config.ts vite.config.js vite.config.mts vite.config.mjs; then
  run vite build
  ran
else
  absent "there is no Vite config"
fi

# 8. Browser smoke test. Browsers are installed by CI, not here.
step "playwright smoke test"
if have_any playwright.config.ts playwright.config.js playwright.config.mts playwright.config.mjs; then
  run playwright test
  ran
else
  absent "there is no Playwright config"
fi

# 9. Known vulnerabilities in shipped dependencies.
step "npm audit --omit=dev"
if [ -f package-lock.json ]; then
  npm audit --omit=dev
  ran
else
  skip "no package-lock.json yet"
fi

echo
echo "verify.sh passed: $steps_run step(s) ran, $steps_skipped skipped."
