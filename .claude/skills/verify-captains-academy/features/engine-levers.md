# Engine levers

The boat has twin engines and no wheel. The port engine lever sits under the left thumb and the starboard lever under the right. Each lever stays where the player leaves it. Both ahead drive the boat ahead, both astern drive it astern, and split levers turn it, even when it is stopped. A blue line behind each engine shows which way it pushes.

## Sub-features

- `lever-touch` moves one lever by dragging it, leaving the other where it was.
- `lever-hold` keeps a lever's setting after the finger lifts.
- `lever-split` turns the boat: port ahead with starboard astern swings the bow to starboard.
- `lever-keys` moves the levers from the keyboard: up and down (W, S) both, left and right (A, D) split, Q and Z port, E and C starboard, X stops both.

## How to get to it (user POV)

- Open `/play/` on a phone held sideways and drag a lever with a thumb.
- Open `/play/` on a desktop and use the mouse or the keys above.

## Driving it with control.sh

Preconditions:

- `control.sh doctor` passes.

- **Port alone.** Drag the port lever to 80. Step `{"do":"lever","side":"port","to":80}`. The log shows `port` above 70 and `starboard` at 0.
- **Split to pivot.** Drag the starboard lever to -60, wait two seconds and take a screenshot. Steps `{"do":"lever","side":"starboard","to":-60}`, `{"do":"wait","ms":2000}`, `{"do":"screenshot","name":"split"}`. `starboard` is below -50, and the screenshot shows the bow swung to starboard with wash ahead of the starboard side.
- **Keys.** Press X, then hold the up arrow. Steps `{"do":"key","key":"x"}`, `{"do":"key","key":"ArrowUp","ms":800}`. `port` and `starboard` are equal and above 50, and `speedMmPerS` grows over the next steps.
- **Every key.** Hold each lever key for 0.8 s (about 96 percent of travel), check the levers, then press X. `features/steps/keyboard.steps.json` does this on a desktop for ↑ and W (both ahead), ↓ and S (both astern), → and D (port ahead, starboard astern), ← and A (the reverse), Q and Z (port alone, ahead and astern) and E and C (starboard alone), and checks X returns both to 0 after each.
- **Recipe.** `features/steps/engine-levers.steps.json` runs the touch and keyboard basics on a phone in landscape, so the lever drags are real touch input. `features/steps/keyboard.steps.json` covers every lever key and alias.

## Gotchas

- A drag that starts more than 90 game pixels sideways from a lever's track, or above the AHEAD or below the ASTERN label, grabs nothing.
- Within 8 percent of stop a lever snaps to stop, so a setting of 5 reads as 0.
- On `desktop` a lever step is a mouse drag, which does not prove touch. Prove `lever-touch` on a phone viewport.
- The keyboard moves levers at 120 percent per second, so an 800 ms hold from stop lands near 96, not exactly 100.
