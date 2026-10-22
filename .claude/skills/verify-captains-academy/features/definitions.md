# Definitions level

Chapter 1, level 1 of the Rules of the Road lives at `/rules/` and plays upright with one thumb. One vessel at a time is drawn top-down with a one-line cue, and the player taps what she is from six Rule 3 terms, or presses keys 1 to 6. A right answer flashes gold and builds a combo. A miss costs one of three hull hearts and plays a five-second purple replay with the right answer, a one-line reason and the Rule 3 paragraph, and that card comes back three cards later. The run ends cleared, with stars, or out of hearts.

## Sub-features

- `definitions-answer` counts a right answer, adds to the combo and shows the next card.
- `definitions-miss` takes a heart, shows the replay with the rule, and brings the card back three cards later.
- `definitions-end` clears the level with stars saved on the device (`captains-academy:stars:ch1-definitions`), or ends it out of hearts with none.
- `definitions-mastery` saves each answer per card under `captains-academy:mastery:<card id>`.

## How to get to it (user POV)

- Open the front page and tap Rules of the Road, or go straight to `/rules/`.

## Driving it with control.sh

Preconditions:

- `control.sh doctor` passes. `launch` serves `/play/`, and `open` with `"path":"/rules/"` opens this page on the same server.

- **A run with one miss.** `features/steps/definitions.steps.json` opens `/rules/` on a phone held upright, answers three cards right, misses one, waits out the replay and answers the rest. It ends `cleared` with 2 stars and takes the screenshots `first-card`, `combo`, `miss-replay` and `cleared`.
- **Clean run and out of hearts.** `e2e/rules.spec.ts` covers both with the keys 1 to 6.
- State is on `window.__captainsAcademyQuiz`: `phase` (`question`, `right`, `replay`, `done`), `card` (the card id), `hearts`, `combo`, `score`, `misses`, `answered`, `remaining`, `outcome` (`playing`, `cleared`, `out-of-hearts`) and `stars`.

## Gotchas

- The deck is shuffled differently each visit, so steps answer by the card on screen, never by position in the deck.
- Game coordinates here are 720 x 1280. The answer buttons are two columns of three, button 1 centered at (191, 846), button 2 at (529, 846), each row 128 lower.
- A tap during the replay skips it only after 0.8 seconds.
- `definitions.answers.json` must match the deck. `tests/rapid.test.ts` fails when it drifts.
