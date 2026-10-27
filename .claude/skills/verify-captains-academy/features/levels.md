# Levels

The level buttons down the top-left list the three levels with the stars earned on each. Level 2, the crosswind slip, stays locked until level 1 has at least one star saved on the device, and level 3, the harbor course, until level 2 has one. Tapping an open level's button starts it.

## Sub-features

- `levels-locked` shows level 2 as locked and ignores taps on it without a star on level 1.
- `levels-open` starts level 2 from its button once level 1 has a star.
- `levels-unlock-all` is a testing switch. `/play/?unlock=all` opens every level with no stars saved. It saves nothing, so a visit without it is locked by stars again.

## How to get to it (user POV)

- Open `/play/` and tap LEVEL 2 at the top-left.
- Earn a star by docking level 1. On the device that is the saved value `captains-academy:stars:long-beach-docking`.

## Driving it with control.sh

Preconditions:

- `control.sh doctor` passes.

- **Locked.** Open the page with no saved progress and tap LEVEL 2. Steps `{"do":"open","viewport":"desktop"}`, `{"do":"tap","x":60,"y":206}`, `{"do":"wait","ms":1000}`. `level` stays 0.
- **Open.** Open the page with one star saved on level 1 and tap LEVEL 2. Steps `{"do":"open","viewport":"desktop","storage":{"captains-academy:stars:long-beach-docking":"1"}}`, `{"do":"tap","x":60,"y":206}`, `{"do":"wait","ms":1500}`, `{"do":"screenshot","name":"level-2"}`. `level` becomes 1 and the screenshot shows the crosswind level's title.
- **Unlock all.** Open the page with no saved progress at `?unlock=all` and tap LEVEL 3. Steps `{"do":"open","viewport":"desktop","query":"?unlock=all"}`, `{"do":"tap","x":60,"y":262}`, `{"do":"wait","ms":1500}`, `{"do":"screenshot","name":"unlock-all-level-3"}`. `level` becomes 2.
- **Recipe.** `features/steps/levels.steps.json`.

## Gotchas

- Seeding the star stands in for docking level 1. Report it as a precondition, never as proof of docking.
- `?unlock=all` is for testing. It is not how a player opens a level, so never report it as proof that the star lock works.
- The LEVEL 2 button's centre is at about (60, 206) in game coordinates. LEVEL 1 is at (60, 150) and LEVEL 3 at (60, 262). [Harbor course](./harbor-course.md) opens level 3.
