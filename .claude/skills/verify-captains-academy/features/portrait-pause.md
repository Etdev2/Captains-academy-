# Portrait pause

Steering levels play in landscape (G8). On a phone held upright the page hides the game behind a prompt to rotate the phone, and the level does not run: no clock, no current, no drift.

## Sub-features

- `portrait-prompt` shows the rotate prompt on a phone held upright.
- `portrait-frozen` keeps the frame count at 0 while the prompt shows.

## How to get to it (user POV)

- Open `/play/` on a phone held upright.

## Driving it with control.sh

Preconditions:

- `control.sh doctor` passes.

- **Upright phone.** Open the page as a Pixel 7 in portrait and wait. Steps `{"do":"open","viewport":"phone-portrait"}`, `{"do":"wait","ms":2500}`, `{"do":"screenshot","name":"portrait"}`, `{"do":"expect","field":"frame","lt":1}`. The screenshot shows the rotate prompt and `frame` is still 0.
- **Recipe.** `features/steps/portrait-pause.steps.json`.

## Gotchas

- The canvas is hidden in portrait, so a step that waits for it to be visible times out. The `open` step skips that wait for `phone-portrait`.
- Rotating a real phone to landscape starts the level; Playwright cannot rotate a context, so this map proves only the paused side.
