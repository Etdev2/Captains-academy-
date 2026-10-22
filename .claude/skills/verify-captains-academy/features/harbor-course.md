# Harbor course

Level 3 is a course in Long Beach harbor. The player runs five numbered gates in order, rounding three anchored boats on the side each gate shows, then docks in the open slip. Other vessels run fixed tracks: a container ship outside the breakwater from the start, a powerboat that crosses from starboard after gate 2, a ferry that comes head-on after gate 4 and turns to its own starboard, and a kayak near the slip. Any contact with one of them ends the run, and the banner names the vessel and gives a one-line lesson with its rule number. The next gate glows gold, passed gates dim, and the slip stays dark until the last gate.

## Sub-features

- `course-gates` counts the gates in order. The HUD shows `Gate n of 5` and the distance to it, the gold arrow points to the next gate, and the slip only counts after gate 5.
- `course-traffic-hit` ends the run when a traffic vessel touches the boat, even a boat at rest, and shows that vessel's name and lesson.
- `course-wrong-turn` is the ferry: a player who turns to port as it comes head-on steers into it. The golden replay `long-beach-traffic-hit-by-ferry` proves this path.
- `course-docks` is a clean run through all five gates into the slip, proven by the golden replay `long-beach-traffic-docks`.

## How to get to it (user POV)

- Earn a star on levels 1 and 2, then tap LEVEL 3 at the top-left of `/play/`.
- On the device the stars are the saved values `captains-academy:stars:long-beach-docking` and `captains-academy:stars:long-beach-crosswind`.

## Driving it with control.sh

Preconditions:

- `control.sh doctor` passes.
- Both stars are seeded with `storage`. Report that as a precondition, never as proof of docking.

- **Open.** Steps `{"do":"open","viewport":"desktop","storage":{...both stars...}}`, `{"do":"tap","x":60,"y":262}`, `{"do":"wait","ms":1500}`. `level` is 2 and `gates` is 5.
- **Traffic hit.** Set both levers to 50, wait until `yMm` is below 197000, back both levers to -80 until `speedMmPerS` is below 150, then press X. The boat sits in the container ship's lane. Wait for `outcome` to be `hit`: `struckBy` is `container ship` and the banner shows the Rule 9 lesson.
- **Recipe.** `features/steps/harbor-course.steps.json` drives both and takes the screenshots `course-start`, `stopped-in-the-ship-lane` and `hit-by-the-ship`.
- **Gates.** `e2e/play.spec.ts` holds the levers ahead from the start and waits for `gate` to reach 1 at the breakwater gap.

## Gotchas

- A headless browser runs the game slower than real time, so wait on state with `waitFor`, never on fixed times.
- The boat glides a long way after the levers come back to stop. Back the levers astern to stop it where you want it.
- `xMm` and `yMm` are the boat's position in mm, x east and y south. The ship's lane is y 189500 to 200500 in the first 30 seconds of play.
