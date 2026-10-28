# Arcade game handoff for Nick

Elliott is handing the arcade game to Nick as a collaboration project, starting 27 October 2026. Nick played the game for about 15 minutes before this handoff. This page says what is built, what Elliott thinks of it, where the prototypes are and what is still open.

## Where to look first

1. Play the game at `/play/?unlock=all`. The `unlock=all` switch opens all three levels without earning stars first. It saves nothing, so a later visit without it is locked again.
2. Open the decision board at `/prototypes/?category=arcade`. The Docking section holds fresh screenshots of all three levels, taken on 27 October from the current build, and each opens the game with **Play this level**. The Helm View Options and Night Harbor Run tiles open their playable prototypes with **Play the prototype**.
3. Read [`rules-of-the-road/README.md`](rules-of-the-road/README.md) for the full Chapter 1 design: the game map, mockups, Harbor Run, Night Harbor Run and the open questions.
4. Read [`docs/adr/0001-arcade-game-stack.md`](../adr/0001-arcade-game-stack.md) before touching code. The game is strict TypeScript, Phaser 4.2.1 and Vite. `src/sim` holds the physics and rules with no Phaser in it, and `src/game` draws it.

## What is built

| Level | Mission file | What the player does | Elliott's view |
| --- | --- | --- | --- |
| 1. Long Beach docking | `missions/long-beach-docking.json` | Dock a twin-engine six-pack boat in the open slip with port and starboard engine levers, in light gusts | Good |
| 2. Crosswind slip | `missions/long-beach-crosswind.json` | Dock in the end slip with a stronger crosswind and current | Good |
| 3. Harbor course with traffic | `missions/long-beach-traffic.json` | Run a harbor course past moving traffic, including a container ship | Weak. The level needs rework before it ships |

All three are on `main`. The board's "As built" row under Docking holds their screenshots from 27 October. The 22 October build screenshots moved to the board's Reference tab.

## Prototypes on the board

The Arcade & Simulations category groups these sections:

- **Arcade & Simulations.** Interactive prototypes A (Night Bridge), B (Clean & Light) and C (Guided Mentor) of the arcade hub screen. Each opens at `/prototypes/live/?category=arcade&variant=a`, `b` or `c`.
- **Night Harbor.** The Chapter 1 map and level mockups, the Harbor Run course design and the Night Harbor Run screens. Every Night Harbor Run tile opens the playable prototype at `/prototypes/play/night-harbor-run.html`.
- **Docking.** Helm View Options at `/prototypes/play/helm-view-options.html`, which draws one boat three ways (fake 3-D in Phaser, a Three.js helm view, and a Three.js stand-in for Unity-level detail). Then the screenshots of levels 1 to 3, each linked to the game.

The two playable prototypes are single HTML files in `public/prototypes/play/`. Neither uses `src/sim`, so their physics differs from the game's.

## What Nick can explore

Elliott wants Nick to take the game somewhere new. These are starting points, not specs. Nick decides what to try, puts a mockup or playable prototype on the board, and Elliott dots and decides before anything is built.

- **Upgrades.** The boat's handling lives in each mission's `boat` block: top speed ahead and astern, acceleration, turn rate, twin-engine pivot rate and the speed the hull survives a bump at. An upgrade could change those numbers, such as a bow thruster that adds pivot, a stronger hull that forgives a harder bump, or a bigger engine. G13 allows skill-based rewards only, so upgrades are earned by play (stars, streaks, XP ranks under G12), never sold with random contents.
- **New courses.** A course is a JSON file in `missions/`, checked by the schema in `src/sim/mission.ts`. It sets the harbor size, start, current, wind gusts, obstacles (shore, breakwater, dock, moored boat), channels, gold gates, traffic and the slip. Add the file to the `levels` list in `src/game/main.ts` and it plays at `/play/?unlock=all`. Other harbors, a night run, a fuel dock, a narrow marina fairway or a timed gate slalom are all a JSON file away.
- **Hard mode, dodging traffic.** Traffic already moves on set paths: ships, ferries, powerboats and kayaks, each starting after a chosen gate. A dodge mode could add more traffic, faster crossings and tighter channels, and score the player for keeping clear. Level 3 is the base for this, and it is the level Elliott likes least, so it is the one most open to change.
- **Camera and look.** Helm View Options shows what a 3-D helm view could feel like. G2 keeps the game top-down 2D for now, so a 3-D view needs an ADR 0001 change that Elliott approves.

Whatever Nick builds keeps the product rules: game time never counts as sea time, the game never says a player qualifies, and red and green stay reserved for port and starboard (G15). Every new course or upgrade needs a golden replay in `tests/replays/`, because the sim is deterministic (ADR 0001).

## Decisions to know

- [DECISIONS.md](../product/DECISIONS.md) A3 parked the arcade track on 22 October to finish Definitions and Lights first. Both are now on `main` at `/rules`. This handoff is Elliott's go to restart the arcade track with Nick. A3 still reads "parked" until Elliott updates it.
- G2 keeps the game top-down 2D first. 3D views come later only if players ask for them.
- G8 plays steering levels in landscape and rapid-fire levels in portrait.
- G15 keeps red and green out of the interface, because those colors mean port and starboard.
- Game time never counts as sea time, and the game never says a player qualifies (ADR 0001 guardrails).
- Rules content in any level is a draft until `uscg-regs` checks it against the current rule text.

## Open arcade issues

| Issue | What it covers |
| --- | --- |
| #46 | Level 3 harbor course with moving traffic. The remaining work, and the place to record what makes level 3 weak |
| #56 | Bring the powerboat back to the harbor course with crossing and overtaking lessons |
| #45 | Night Harbor Run as a later Chapter 1 level after the boss (G10b) |
| #53, #55, #64 | Review follow-ups on the course code, recipe timing and golden replays |
| #35 | Drive every keyboard control in the verification skill |

## How to work on it

1. Start at `/collaborate/` and give your agent the onboarding prompt. It explains the time card, branch naming and proof bundle.
2. Install with `npm ci`, run `npm run dev` and open `/play/?unlock=all`.
3. Run `bash scripts/verify.sh` before every push. Use the `verify-captains-academy` skill to drive the game and capture proof of a change.
4. Put new mockups or screenshots on the board as [`decision-board.md`](decision-board.md) describes, so Elliott can dot and decide before anything is built.
