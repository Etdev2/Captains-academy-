# Lights level

Chapter 1, level 2 of the Rules of the Road lives at `/rules/?level=lights` and plays upright with one thumb, sideways, or with a keyboard. It opens once Definitions has a star. One vessel at a time shows her lights on a night horizon, drawn by the Rule 21 module from the angle the cue names, and the player picks which vessel shows them from seven answers, or presses keys 1 to 7. Every card is a shared card, so the chip reads "Inland + International". A right answer flashes gold, builds a combo and shows the rule it cites under the picture. A miss costs one of three hull hearts, rings the lights that decide the card, and shows a five-second explanation with the answer, a one-line reason and the citation. The player can pause it. That card comes back three cards later. The run ends cleared, with stars, or out of hearts. The design is `docs/design/lights-spec.md` and the card text is `docs/product/lights-regs-check-2026-10-23.md`.

## Sub-features

- `lights-unlock` keeps the level shut until `captains-academy:stars:ch1-definitions` is 1 or more. A shut `?level=lights` address opens Definitions instead, and the menu link says why it is locked.
- `lights-answer` counts a right answer, adds to the combo, fills `#rule-line` with the citation and shows the next card.
- `lights-miss` takes a heart, rings the deciding lights for 0.6 s, shows the explanation with the citation, and brings the card back three cards later with an "Again" tag.
- `lights-pause` keeps the explanation on screen until the player presses Next.
- `lights-end` clears the level with stars saved on the device (`captains-academy:stars:ch1-lights`), or ends it out of hearts with none. Lights is the last level for now, so the cleared screen has no Next level button.
- `lights-mastery` saves each answer per card under `captains-academy:mastery:<card id>`.

## How to get to it (user POV)

- Clear Definitions with at least one star, then press Next level on its cleared screen, or open the menu and pick 2 · Lights.
- With a star already saved, go straight to `/rules/?level=lights`.

## Driving it with control.sh

Preconditions:

- `control.sh doctor` passes. `launch` serves `/play/`, and `open` with `"path":"/rules/?level=lights&seed=29"` opens this level on the same server with a fixed shuffle.
- Both step files seed `"storage": {"captains-academy:stars:ch1-definitions": "1"}` to open the level. That is a precondition, not proof of the unlock. `e2e/lights.spec.ts` proves the locked case.

- **A run with one miss, phone.** `features/steps/lights-phone-390.steps.json` opens the level at 390 x 844, checks it is `ch1-lights` with 3 hearts and 19 cards, answers two cards right, misses one, pauses the explanation for 5.5 s, presses Next and answers the rest. It ends `cleared` with 2 stars and takes the screenshots `phone-390-1-first-card`, `phone-390-2-correct`, `phone-390-3-wrong-explanation` and `phone-390-4-cleared`.
- **The same run, desktop.** `features/steps/lights-desktop-wide.steps.json` does the same at 1440 x 900, with the `desktop-wide-` screenshots. The screenshots in `docs/design/screenshots/lights/` come from these two files.
- **Clean run, out of hearts, a locked address, a muted run on keys, axe, contrast and tap targets.** `e2e/lights.spec.ts` covers them on all three Playwright projects.
- **Which lights show from each angle.** `tests/lights-replays.test.ts` pins the lights shown at 15 aspects around the 112.5-degree sector edges, and `tests/navigation-lights.test.ts` covers the Rule 21 module. This map does not re-prove them.
- State is on `window.__captainsAcademyQuiz`, the same fields as Definitions: `level` (`ch1-lights`), `phase` (`question`, `right`, `highlight`, `replay`, `done`), `card` (the card id, such as `rule24:towing-astern`), `hearts`, `combo`, `score`, `misses`, `answered`, `remaining`, `outcome` (`playing`, `cleared`, `out-of-hearts`), `stars`, `paused`, `elapsedMs` and `seed`.

## Gotchas

- Without `?seed=` the deck shuffles differently each visit, so steps answer by the card on screen, never by position.
- `answerRight` and `answerWrong` press the real HTML button for the card on screen. `drive.mjs` reads `definitions.answers.json` and `lights.answers.json` together, since card ids never repeat across levels, and counts the buttons on the page to pick a wrong one. `tests/lights.test.ts` fails when `lights.answers.json` drifts from the deck.
- Without the seeded star the page plays Definitions, and `answerRight` still works there, so check `level` is `ch1-lights` before trusting a run. Both step files do.
- After a miss the ringed lights show for 0.6 s before the explanation covers the card, and Next works only after a further 0.8 s.
- The `correct` screenshot must be taken within 380 ms of the tap, before the next card comes in.
- The `desktop` viewport (1280 x 768) is short for seven answers, so the picture draws small there. Use `desktop-wide` for screenshots.
