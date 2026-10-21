# A docking run

A run starts with the boat in open water, a gold arrow pointing to the glowing slip, and a coaching hint under the title. The run ends when the boat holds steady in the slip (docked, with stars) or hits something faster than the level allows (hit, with a purple banner and a camera shake). Tapping the water or pressing Enter after a run starts a new one.

## Sub-features

- `run-start` begins at frame 0 with the outcome `playing` and the boat stopped.
- `run-hit` ends the run when the boat hits a pier, the shore or a moored boat too fast.
- `run-retry` restarts the level from its start after a run ends.
- `run-docked` ends the run with stars when the boat holds in the slip. Proven by the golden replays, not by this map.

## How to get to it (user POV)

- Open `/play/`. Level 1 starts by itself.
- After a run, tap anywhere on the water away from the levers, or press Enter or Space.

## Driving it with control.sh

Preconditions:

- `control.sh doctor` passes.

- **Start.** Open the page. Step `{"do":"open","viewport":"desktop"}`. The log shows `outcome` `playing`, `level` 0 and `speedMmPerS` 0.
- **Hit.** Push both levers full ahead and wait. Steps `{"do":"lever","side":"port","to":100}`, `{"do":"lever","side":"starboard","to":100}`, `{"do":"waitFor","field":"outcome","eq":"hit","timeoutMs":45000}`, `{"do":"screenshot","name":"hit"}`. The boat reaches the docks in about 25 seconds, `outcome` becomes `hit`, and the screenshot shows the banner "Hit too hard. Come in slower."
- **Retry.** Tap the water. Steps `{"do":"tap","x":640,"y":420}`, `{"do":"wait","ms":1500}`. `outcome` is `playing` again and `frame` is small.
- **Recipe.** `features/steps/docking-run.steps.json`.

## Gotchas

- A tap on a lever or above y 190 does not retry, so the top-left buttons are never hit by accident.
- After the retry the levers return to stop.
- Level 1 has gusts, so the hit takes a slightly different time each run of the real game clock. Wait on `outcome`, never on a fixed time.
