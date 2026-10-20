---
status: accepted
---

# The arcade game is a separate product built on strict TypeScript, Phaser 4 and Vite

Et asked for the most optimal stack: strict enough to prevent bugs, easy for agents to write in, and no costly rewrites later. On 2026-10-20 Chief Of Staff and Claude settled the choice, after Claude's verified review and an independent Codex review (issue #18). Et approved it the same day.

## Decision

- **Separate product.** The top-down 2D arcade game (phone and web) is a separate product for now. It does not replace the simulator. Unity stays the simulator engine (DECISIONS.md, Simulator) until Et decides after the arcade game launches. Until then, no work builds on the arcade game replacing Unity.
- **Language and build:** strict TypeScript and Vite, in a fresh project. Compiler options: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`.
- **Engine:** Phaser 4, pinned to exactly 4.2.1. Node is pinned too, and installs use `npm ci`.
- **Web first.** The browser game ships first. Capacitor (8.x) packaging for iOS and Android, and native billing, wait until the browser game has validated the gameplay. Native builds and `cap sync` run in their own mobile workflow, not on the fast verification path.
- **Fresh project, not the old starter.** The official Capacitor Phaser starter pins Phaser 3, Capacitor 4, Vite 4 and TypeScript 4.9, and has not changed since January 2023. It is a reference for the native folder layout only.
- **Phaser-free `src/sim`.** `src/sim` is pure TypeScript with data in and data out: boat physics, markers, lights, right-of-way and scoring. It imports no Phaser, DOM, native or payment code, and never uses Phaser's physics. `src/game` is the Phaser renderer. `src/platform` holds purchases. Missions are JSON files validated with zod.
- **Determinism.** A fixed 60 Hz step and a seeded random number generator are not enough on their own. `src/sim` uses integer frame IDs, versioned inputs and state, and bounded or fixed-point math where results must match. It bans `Math.random`, `Date`, `performance.now` and `requestAnimationFrame`, and avoids transcendental functions such as `Math.sin` in replay-sensitive code. Golden replays are required, run headless in CI and across browsers, and fail if a replay file changes without an explicit update flag.
- **Payments.** One `Entitlements` interface in `src/platform` with two adapters: `@revenuecat/purchases-capacitor` (13.x, needs Capacitor 8 or later) on phones, and `@revenuecat/purchases-js` with Web Billing (Stripe) or Stripe directly on the web. The `@revenuecat/*` packages may be imported only inside `src/platform`. The Supabase user ID of the academy login is the stable purchaser identity (DECISIONS.md A4). Access is server-verified, with restore, refund and expiry handled. Et chooses the web provider later: Web Billing was labeled beta in the docs we could read.

## Guardrails

- **Game time never counts as sea time.** The game has no code path into the sea-time log.
- **The game never says a player qualifies.** It follows the same wording rule as the sea-time log ("appears to meet", with what is still needed).
- **No sharing with Fish Log Book.** The arcade game shares no code, database or accounts with it.

## Considered options

- **Bevy (Rust)** is rejected for now. Its API changed with breaking releases in 0.17 (Sep 2025), 0.18 (Jan 2026) and 0.19 (Jun 2026), and we found no first-party in-app purchases. The draft's other two reasons did not hold up. The 0.17 notes never mention WebGPU, and issue #23428 was an iOS simulator bug on unreleased `main`, fixed in March 2026. Neither is a reason to reject it.
- **Rust/WASM for `src/sim` later** stays possible behind the same interface, but it is not cheap. Float results differ across languages, so a port means regenerating every replay file and keeping inputs and state as plain serializable data. Do it only if profiling shows a need.
- **Phaser 3.90** is the fallback if Phaser 4, about six months old at this date, turns out to have gaps. Only `src/game` touches Phaser, so the swap stays contained.

## Consequences

- The academy has two engines for now, Phaser for the arcade game and Unity for the simulator. If Et later chooses Unity for the arcade game or the reverse, that is a new ADR that supersedes this one.
- The verification command (#12) must cover this stack. It runs, cheapest first: `npm ci`, `tsc --noEmit`, ESLint with `--max-warnings=0` and import-boundary rules, Prettier, Vitest with required replay tests, mission JSON validation, `vite build`, a minimal Playwright smoke test, and `npm audit --omit=dev`.
- Open for Et later: the web payment provider and cross-device sync, pricing, how realistic the physics should be, Apple and Google developer accounts, and a Coast Guard content reviewer.
- Before store launch, test on a real low-end Android WebView for frame time, memory, touch lag, pause and resume, and context loss.
