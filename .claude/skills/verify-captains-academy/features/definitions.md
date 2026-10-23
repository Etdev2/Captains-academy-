# Definitions level

Chapter 1, level 1 of the Rules of the Road lives at `/rules/` and plays upright with one thumb, sideways, or with a keyboard. One vessel at a time is drawn top-down with a one-line cue, and the player picks which Rule 3 term fits her best from five answers, or presses keys 1 to 5. A right answer flashes gold and builds a combo. A miss costs one of three hull hearts, outlines the detail that decides the card, and shows a five-second explanation with the answer, a one-line reason and the citation. The player can pause it. That card comes back three cards later. The run ends cleared, with stars, or out of hearts. The interface is HTML; Phaser draws only the vessel. The design is `docs/design/definitions-spec.md` and the card text is `docs/product/definitions-regs-check-2026-10-23.md`.

## Sub-features

- `definitions-answer` counts a right answer, adds to the combo and shows the next card.
- `definitions-miss` takes a heart, shows the explanation with the citation, and brings the card back three cards later with an "Again" tag.
- `definitions-pause` keeps the explanation on screen until the player presses Next.
- `definitions-end` clears the level with stars saved on the device (`captains-academy:stars:ch1-definitions`), or ends it out of hearts with none.
- `definitions-mastery` saves each answer per card under `captains-academy:mastery:<card id>`.

## How to get to it (user POV)

- Open the front page and tap Rules of the Road, or go straight to `/rules/`.

## Driving it with control.sh

Preconditions:

- `control.sh doctor` passes. `launch` serves `/play/`, and `open` with `"path":"/rules/?seed=47"` opens this level on the same server with a fixed shuffle.

- **A run with one miss, phone.** `features/steps/definitions-phone-390.steps.json` opens the level at 390 x 844, answers two cards right, misses one, pauses the explanation for 5.5 s, presses Next and answers the rest. It ends `cleared` with 2 stars and takes the screenshots `first-card`, `correct`, `wrong-explanation` and `cleared`.
- **The same run, desktop.** `features/steps/definitions-desktop-wide.steps.json` does the same at 1440 x 900.
- **Clean run, out of hearts, keys, menu, axe, contrast, tap targets and reduced motion.** `e2e/rules.spec.ts` covers them on all three Playwright projects.
- State is on `window.__captainsAcademyQuiz`: `phase` (`question`, `right`, `highlight`, `replay`, `done`), `card` (the card id), `hearts`, `combo`, `score`, `misses`, `answered`, `remaining`, `outcome` (`playing`, `cleared`, `out-of-hearts`), `stars`, `paused`, `elapsedMs` and `seed`.

## Gotchas

- Without `?seed=` the deck shuffles differently each visit, so steps answer by the card on screen, never by position.
- `answerRight` and `answerWrong` press the real HTML button for the card on screen, using `definitions.answers.json`. `tests/rapid.test.ts` fails when that file drifts from the deck.
- After a miss the detail outline shows for 0.6 s before the explanation covers the card, and Next works only after a further 0.8 s.
- The `correct` screenshot must be taken within 380 ms of the tap, before the next card comes in.
