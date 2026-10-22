# Captain's Academy verification map

This directory is the maintained source for verifying what a player can do at `/play/` and in the Rules of the Road chapter at `/rules/`. The sea-time log at `/log/` isn't mapped yet. Read this index before driving the game, then use the matching feature file as the recipe.

## Baseline preconditions

- Launch with `control.sh launch` and pass `control.sh doctor` with no warnings.
- Each step file opens its own browser context, so saved progress starts empty unless the file seeds it with `storage`.
- Never drive an instance this script did not start.

## Driving conventions

- Coordinates are game coordinates in the 1280 x 768 view: the port lever at x 96, the starboard lever at x 1184, stop at y 473, and the level buttons at x 60 down the top-left from y 150 (level 1) in steps of 56.
- Read results from the state `drive.mjs` logs after every step: `frame`, `outcome` (`playing`, `docked`, `hit`), `speedMmPerS`, `level` (0-based), `port`, `starboard`, `muted` and `horn`.
- The SOUND button is at about (84, 38) and HORN at (60, 94) in game coordinates.
- Start every recipe from `open` unless it says otherwise.

## Proof and skip reporting

- Capture the input and the state it caused: a screenshot plus the logged state.
- Record the run folder and the step file used with every artifact.
- Report a path you could not reach with the step that failed and the unmet precondition.
- Do not report a path as verified through a different one. Docking success is proven by the golden replays, not by this map.

## Feature entry contract

Each feature file starts with an H1 title and one paragraph describing what the player sees. It then has four H2 sections in this order: `Sub-features`, `How to get to it (user POV)`, `Driving it with control.sh`, and `Gotchas`.

## Features

- [Engine levers](./engine-levers.md): the port and starboard levers by touch and by keyboard, splitting them to pivot, and stop.
- [A docking run](./docking-run.md): the level starts, the boat answers, a hard contact ends the run with the hit banner, and a tap retries.
- [Levels](./levels.md): level 2 stays locked until level 1 has a star, then opens from its button.
- [Portrait pause](./portrait-pause.md): on a phone held upright the level waits behind a rotate prompt.
- [Offline play](./offline-play.md): after one online visit the level loads and runs with no network.
- [Definitions level](./definitions.md): Chapter 1, level 1 at `/rules/`, played upright: name each vessel, a miss costs a heart and plays the replay, and the run ends cleared or out of hearts.
- [Horn and sound](./horn-and-sound.md): the SOUND and HORN buttons and their M and H keys, the saved sound setting, and the horn's rings.

Together these drive every control the game handles, each through its own recipe step: both touch levers; every lever key and alias (↑ ↓ ← →, W S A D, Q Z, E C) and X, in `keyboard.steps.json`; the SOUND, HORN and LEVEL buttons; M and H; and tap, Enter and Space to retry after a run.
