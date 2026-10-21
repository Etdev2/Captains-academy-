---
name: verify-captains-academy
description: Launch, drive and capture proof of the Captain's Academy arcade game at /play (a Phaser canvas game on a Vite production build). Use before claiming a game change works, to reproduce a game bug, or to prove a feature from the feature map with screenshots and the game's own state.
---

# Verify Captain's Academy

This skill drives the arcade game at `/play/`: a top-down night harbor where the player docks a twin-engine boat with an engine lever under each thumb. The app also serves the sea-time log at `/log/` (added in #33). The log isn't in this feature map yet. Map it before using this skill to prove a log change. It is a canvas game, so there are no DOM handles inside it. The game publishes its state on `window.__captainsAcademy` (`frame`, `outcome`, `speedMmPerS`, `level`, `port`, `starboard`, `muted`, `horn`), and the driver reads that after every step.

`bash scripts/verify.sh` is the project's verification command and runs the unit tests, golden replays and e2e tests. This skill is for driving the real build by hand, feature by feature, and keeping the evidence.

Everything below runs from the repository root. The helper is `.claude/skills/verify-captains-academy/control.sh`; call it `control.sh` below.

## Launch

```bash
.claude/skills/verify-captains-academy/control.sh launch
```

It runs a clean `npm ci` from the lockfile every time, builds the production bundle with `vite build`, and serves it with `vite preview` on `127.0.0.1:4180` (`VERIFY_PORT` changes the port). It is ready when it prints `ready: http://127.0.0.1:4180/play/`. It refuses to start if the port already answers, so it never drives a server someone else started. Port 4173 belongs to the e2e tests in `verify.sh`; keep away from it.

## Doctor

```bash
.claude/skills/verify-captains-academy/control.sh doctor
```

It is read-only. It checks that the instance this script started is alive and that the page has the `#game` element. It also fails when the bundle is stale. At launch the script records a digest of every file in the checkout as it sits on disk, tracked, untracked or ignored, so staged edits, new files and Vite `.env` files all count. It leaves out only folders a build never reads: `.git`, `node_modules` (launch reinstalls it from the lockfile, which counts), `dist`, `verify-artifacts`, `test-results`, `playwright-report`, `proof`, `agent-resources`, `docs`, `.claude`, `.codex`, `.github`, `tests`, `e2e` and `scripts`. Doctor compares that digest with the files now. After a failure, run `stop` and `launch` so you drive the code you mean to prove. Run doctor before the first drive and after any drive that failed. `drive` runs the same freshness check and refuses a stale bundle.

## Drive

```bash
VERIFY_RUN=levers-check .claude/skills/verify-captains-academy/control.sh drive .claude/skills/verify-captains-academy/features/steps/engine-levers.steps.json
```

`drive.mjs` runs a JSON list of steps in Chromium and stops at the first failure. Coordinates are in the game's 1280 x 768 space and are scaled to the canvas, so the same steps work at every viewport. On the phone viewports, `lever` and `tap` send touch input (a touch drag through the Chrome DevTools Protocol, and Playwright's touchscreen tap), so the game receives `pointerType: "touch"` as it would from a thumb. On `desktop` they use the mouse.

| Step | Does |
| --- | --- |
| `{"do":"open","viewport":"desktop"}` | New browser context and page at `/play/`. Viewports: `desktop` (1280 x 768), `phone-landscape` and `phone-portrait` (Pixel 7). `"storage": {"key": "value"}` seeds the device's saved progress first |
| `{"do":"lever","side":"port","to":80}` | Drags a lever from stop to a setting from -100 (full astern) to 100 (full ahead). `side` is `port` (left thumb, x 96) or `starboard` (right thumb, x 1184) |
| `{"do":"key","key":"ArrowUp","ms":800}` | Holds a key |
| `{"do":"tap","x":60,"y":206}` | Taps a point on the canvas |
| `{"do":"wait","ms":2000}` | Lets the game run |
| `{"do":"waitFor","field":"outcome","eq":"hit","timeoutMs":40000}` | Waits for a state field to equal a value |
| `{"do":"expect","field":"port","gt":50}` | Fails unless a state field is `eq`, `gt` or `lt` a value |
| `{"do":"offline","on":true}`, `{"do":"reload"}`, `{"do":"waitForOfflineCache"}` | Network and service-worker steps for offline play |
| `{"do":"screenshot","name":"after-split"}` | Saves `<name>.png` in the run folder |

The feature map in `features/` says which steps prove each feature, and `features/steps/` holds ready-made step files.

## Evidence

Each drive writes to `verify-artifacts/<VERIFY_RUN>/` (a UTC timestamp by default), and refuses a run folder that already holds files, so evidence from an earlier drive can't pass as new. Use a fresh `VERIFY_RUN` for each drive. It writes `steps.log.json` with every step and the game state after it, the screenshots the steps asked for, and `failed-step-<n>.png` when a step fails. `verify-artifacts/` is ignored by git. Copy what a pull request needs into `proof/` and list it in the proof manifest.

Proof standards:

- Drive the real user path: the levers, keys and taps a player uses. Never call game internals or set `window.__captainsAcademy`.
- Capture the action and the result: a screenshot after the input and the state change in `steps.log.json`, not only a final screen.
- Seeding saved progress with `storage` is a precondition, not proof. Say so when a proof relies on it.
- A docking from the player's side is too fiddly to script by hand. The golden replays in `tests/replays/` prove both levels can be docked; this skill proves the controls and the outcomes a player sees.

## Cleanup

```bash
.claude/skills/verify-captains-academy/control.sh stop
```

It stops only the server this script started, using its saved process ID, and keeps `verify-artifacts/` with every run's evidence. Run it after every failed attempt too.

## Helpers

- `control.sh launch | doctor | drive STEPS.json | stop`: the commands above. Running it with no argument prints its usage.
- `drive.mjs URL STEPS.json OUT_DIR`: the driver `control.sh drive` calls. Run it directly only against an instance you started.
