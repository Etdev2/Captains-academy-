# Definitions level design spec (Chapter 1, level 1)

Owner: `ux-ui`. Issue #47. Written 2026-10-23 for Stage 1 to build against.

This spec sets how the Definitions level looks and behaves on a phone held upright and on a desktop. It covers the visual system, the layout, each screen in mockup 01, every component state, and what to keep from the old branch `head-dev/ch1-definitions` at `3c67dd4`. The card text, the answer labels and the question wording come from [`docs/product/definitions-regs-check-2026-10-23.md`](../product/definitions-regs-check-2026-10-23.md). Where this spec and that check disagree on any words, the check wins.

Settled decisions this spec builds on: G6, G8, G11, G12, G13, G15, G16 and G20 in [`DECISIONS.md`](../product/DECISIONS.md). It uses nothing that is parked. ADR 0003, ADR 0005 and ADR 0008 are proposed, not settled; the spec follows their direction and says where.

## Who it is for

AGENTS.md names the hardest user: a working mariner on deck, in sun or spray, maybe in gloves, with one hand free. For this level that means a phone held upright in one hand, answered with the thumb of that hand, often with the sound off. The level must also work for a cadet at a desk with a keyboard.

## Decisions this spec makes

1. **The interface is HTML, and Phaser draws only the vessel.** The old scene drew every button and line of text into one 720 by 1280 canvas and scaled it to fit. On a 390 px wide phone that canvas shrinks to 54%, so its 20 px text renders at 11 CSS px and its 17 px "International only" note at 9 CSS px. Canvas text also cannot be found by a screen reader, by the axe check Stage 1 must run, or by a tap-target test. So the header, the card's text, the question, the answer buttons, the explanation panel and the end screens are HTML elements styled with the tokens below. Phaser draws the vessel inside the card. This is a front-end call inside the `ux-ui` lane. If `architect` wants the whole level in the canvas, every size in this spec still applies in CSS pixels after scaling, and the axe and tap-target checks still have to pass.
2. **The question reads "Which Rule 3 term fits her best?"** Finding F2 of the regs check: "What is she?" has two true answers for 9 of the 16 shared cards.
3. **Five answer buttons, with a six-button variant.** Finding F1 of the regs check recommends moving the constrained-by-draft card to the International differences level under G6. The default layout has five buttons. If Et keeps the card in level 1, the six-button variant below applies. The deck has 16 cards by default and 17 in the variant.
4. **The mockup's three gold icons are hull hearts, not crowns.** G11 gives the player three hull hearts. The icons in mockup 01 and the old build are boat hulls, and the old build empties one on a miss. The end-of-level rating uses stars (G12). This spec calls them hearts and stars throughout.

## Visual system

The world is a night ocean (G15). The level is always dark, whatever the device theme, because the vessel art and future light levels depend on it.

### Color tokens

Stage 1 puts these in one typed module, `src/game/ui/palette.ts` as ADR 0008 proposes, and in matching CSS custom properties. No interface token is red or green (G15). Port and starboard colors exist only in navigation-world art, and this level draws no navigation lights.

| Token | Hex | Use |
| --- | --- | --- |
| `ocean-900` | `#06121f` | Page background. Matches `main.ts` and the sea-log dark theme |
| `ocean-800` | `#0b1a2b` | Answer button fill, menu sheet |
| `ocean-700` | `#0f2236` | Card fill, pressed button fill, progress track |
| `ink-100` | `#eaf2fa` | Main text |
| `ink-300` | `#a9bdd1` | Secondary text |
| `ink-400` | `#8aa3bb` | Key hints, empty icons. Never for sentences |
| `line-500` | `#5b82a8` | Button and chip borders |
| `blue-300` | `#8fd0ff` | Rule-set chip text, citation text, focus ring |
| `blue-500` | `#4fc3ff` | Rule-set chip border, progress fill |
| `gold-500` | `#f4d06f` | Wins: correct border, check icon, combo, points, stars, primary button fill |
| `gold-tint` | `#3a3418` | Fill of a correct answer |
| `purple-300` | `#c9b3ff` | Miss text |
| `purple-500` | `#b48cff` | Miss border, countdown bar |
| `purple-tint` | `#1e1240` | Explanation panel fill, fill of a wrong pick |

Gold and electric blue mark wins, and purple or white marks misses (G15). Gold here means "right" and nothing else in the interface, apart from the static hull hearts, which keep the gold of the mockup.

### Contrast

Every text and background pair the level uses, computed with the WCAG 2.x relative-luminance formula. Text needs 4.5:1 (AA, normal text). Borders, icons and bars need 3:1 (WCAG 1.4.11). All pass. Stage 1 adds a unit test that recomputes this table from `palette.ts`, so a token change that breaks a pair fails the build.

| Foreground | Background | Where | Ratio | Needs | Result |
| --- | --- | --- | --- | --- | --- |
| `ink-100` | `ocean-900` | Body text, level title, overlay text | 16.68:1 | 4.5:1 | Pass |
| `ink-300` | `ocean-900` | Secondary text: progress count, hearts label | 9.77:1 | 4.5:1 | Pass |
| `ink-100` | `ocean-700` | Cue under the art | 14.27:1 | 4.5:1 | Pass |
| `ink-300` | `ocean-700` | Card meta text | 8.36:1 | 4.5:1 | Pass |
| `blue-300` | `ocean-700` | Rule-set chip text on the card | 9.70:1 | 4.5:1 | Pass |
| `blue-500` | `ocean-700` | Rule-set chip border | 8.13:1 | 3:1 | Pass |
| `ink-100` | `ocean-800` | Answer label, idle and pressed | 15.52:1 | 4.5:1 | Pass |
| `ink-400` | `ocean-800` | Key hint digit on an answer | 6.72:1 | 4.5:1 | Pass |
| `line-500` | `ocean-900` | Answer border against the page | 4.67:1 | 3:1 | Pass |
| `line-500` | `ocean-800` | Answer border against its own fill | 4.35:1 | 3:1 | Pass |
| `blue-300` | `ocean-900` | Focus ring | 11.34:1 | 3:1 | Pass |
| `ink-100` | `gold-tint` | Answer label, correct or answer state | 11.03:1 | 4.5:1 | Pass |
| `gold-500` | `gold-tint` | "Right" or "Answer" sublabel and check icon | 8.37:1 | 4.5:1 | Pass |
| `gold-500` | `ocean-900` | Correct border and ring against the page | 12.66:1 | 3:1 | Pass |
| `ink-100` | `purple-tint` | Answer label, wrong state; explanation body | 15.28:1 | 4.5:1 | Pass |
| `purple-300` | `purple-tint` | "Your pick", "Not quite", "Comes back" lines | 9.36:1 | 4.5:1 | Pass |
| `purple-500` | `ocean-900` | Wrong border against the page | 7.30:1 | 3:1 | Pass |
| `purple-500` | `purple-tint` | Countdown bar on the panel | 6.69:1 | 3:1 | Pass |
| `ink-300` | `purple-tint` | Cue line inside the explanation | 8.95:1 | 4.5:1 | Pass |
| `blue-300` | `ocean-900` | Citation chip text | 11.34:1 | 4.5:1 | Pass |
| `gold-500` | `ocean-900` | Combo, points, star icons, cleared title | 12.66:1 | 4.5:1 | Pass |
| `ink-400` | `ocean-900` | Lost heart and empty star outline | 7.21:1 | 3:1 | Pass |
| `ocean-900` | `gold-500` | Primary button label (Play again, Next) | 12.66:1 | 4.5:1 | Pass |
| `blue-500` | `ocean-700` | Progress fill against its track | 8.13:1 | 3:1 | Pass |
| `ink-100` | `ocean-800` | Menu sheet text | 15.52:1 | 4.5:1 | Pass |

Two pairs in the old build fail and are replaced: the key hint `#5f7a94` on `#07111f` is 4.24:1, and the button border `#2c4a68` on `#06121f` is 2.05:1.

### Type

One family, `system-ui, sans-serif`, the same as the rest of the app, so nothing downloads and it works offline. Sizes are CSS pixels and set in `rem`, so OS and browser text size settings scale them. Nothing is ever below 16 px.

| Token | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| `display` | 32 / 38 | 700 | End screen titles |
| `answer-line` | 26 / 32 | 700 | "She is engaged in fishing." in the explanation |
| `title` | 22 / 28 | 600 | Level title, "Not quite" |
| `body-lg` | 20 / 28 | 400 | Cue, reason line |
| `body` | 18 / 24 | 600 for buttons, 400 otherwise | Answer labels, question, base text |
| `small` | 16 / 22 | 500 | Chip, progress count, hearts label, key hints, sublabels, citation |

### Spacing

A 4 px base: `4, 8, 12, 16, 24, 32, 48`. The page gutter is 16 px. Tappable things are at least 12 px apart.

### Motion

| Token | Duration | Easing | Use |
| --- | --- | --- | --- |
| `press` | 100 ms | `cubic-bezier(0.2, 0, 0, 1)` | Button press feedback |
| `flash` | 200 ms | `cubic-bezier(0.2, 0, 0, 1)` | Gold ring on a right answer |
| `right-hold` | 380 ms | none, a pause | Time a right answer stays on screen before the next card. Kept from the old build |
| `card-in` | 200 ms | `cubic-bezier(0.2, 0, 0, 1)` | Next card fades and rises 8 px |
| `shake` | 240 ms, 6 px | `cubic-bezier(0.3, 0, 1, 1)` | Camera shake of the card on a miss (G15) |
| `replay` | 5000 ms | linear | Explanation panel and countdown bar (G11) |
| `replay-skip` | 800 ms | none | Earliest a tap can skip the replay. Kept from the old build |

With `prefers-reduced-motion: reduce`: no shake, no scale, no rise, no ring animation and no float of the points text. The same states still show, as static borders, icons and text, for the same durations. The countdown bar is replaced by the text "Next card in 5 s", which counts down once a second. Timing and grading do not change.

## Layout

### Phone, portrait first (G8)

Reference size 390 by 844 CSS px, with the top and bottom safe areas respected through `env(safe-area-inset-*)`. Top to bottom:

| Region | Height | Contents |
| --- | --- | --- |
| Header row 1 | 48 | Menu button left, level title centered, combo right |
| Header row 2 | 32 | Hull hearts with "2 left" on the left, progress count "7 of 16" on the right |
| Progress bar | 6 | Full width |
| Gap | 12 | |
| Card | Fills the rest, at least 160 | Rule-set chip, "Again" tag when shown, vessel art, cue |
| Gap | 16 | |
| Question | 24 | "Which Rule 3 term fits her best?" |
| Gap | 12 | |
| Answer grid | 240 | Five buttons. See below |
| Bottom padding | 16 | Plus the safe area |

On a 390 by 844 phone the card is about 345 px tall. The answer grid sits in the bottom 40% of the screen, where a thumb rests. The menu button is the only control at the top, and a player needs it rarely.

Answer grid, default five buttons: two columns with a 12 px gap. Rows 1 and 2 hold Power-driven, Sailing, Engaged in fishing and Not under command. Row 3 is one full-width button, "Restricted in her ability to maneuver", because that label wraps to three lines in a half-width button. Each row is 72 px tall. At 390 px wide a half-width button is 173 by 72 px.

Six-button variant: three rows of two. Row 3 holds "Restricted in her ability to maneuver" and "Constrained by her draft" with the "International only" note under it. Row 3 grows to fit its label, 88 px at 390 wide. The order of the buttons never changes between cards, so the keys and the thumb learn the positions.

Tap targets: every tappable element is at least 48 by 48 px, the `ux-ui` minimum, which is stricter than the 44 px in the issue. Answer buttons are at least 64 px tall because they are the level's main action. Stage 1's tap-target test measures every `button` and fails under 48 by 48, or under 64 tall for an answer.

Small screens: at 320 by 568 the header row 2 and the progress bar stay, the card shrinks to its 160 px minimum, and below that the page scrolls with the answer grid kept in view at the bottom (`position: sticky`). At 200% browser zoom the page reflows the same way and nothing is cut off. Zoom is never disabled.

Landscape on a phone: the level stays usable without a rotate prompt. The card and the grid sit side by side, card left and grid right, so the thumb of the hand holding the right side reaches every answer.

### Desktop

A centered column 480 px wide on the night ocean background, the same order as the phone. The card grows to at most 440 px tall. Each answer button shows its key digit, 1 to 5 (1 to 6 in the variant). Under the grid one `small` line in `ink-300` reads "Keys 1 to 5 answer. Enter goes to the next card. Esc opens the menu." Mouse hover gives a `line-500` to `blue-500` border change, which is never the only sign of anything.

## Screens

Mockup 01 shows the question screen. The others follow from G11 and G12 and from the old build's screenshots.

### 1. Question

What the player sees on every card, matching mockup 01:

- Header: menu, "1 · Definitions", combo when it is 2 or more ("×3 combo").
- Hearts: three hull icons and "3 left". Progress: "7 of 16" and the bar. The count is cards cleared plus one, over the deck size. A missed card coming back does not change the total.
- Card: the rule-set chip "Inland + International" top left (G6). The vessel drawn top-down, bow up. The cue under it in `body-lg`, such as "Towing a trawl net astern". A card that returns after a miss shows an "Again" tag top right, with a circular-arrow icon and the word.
- The question, then the answer grid in its idle state.

The par timer runs only while this screen waits for an answer (the old build's rule) and pauses while the menu is open.

### 2. Right answer

- The tapped button takes the `correct` state: gold border, gold-tinted fill, check icon in place of the key digit, sublabel "Right".
- A gold ring flashes around the card (`flash`). "+300" appears over the card in `gold-500`, `title` size, and rises 16 px (`right-hold`).
- The combo badge counts up. The level's sound plays a short chime, and its visual partner is the ring and the check, so the answer reads the same muted (G16).
- A polite live region says "Right. Engaged in fishing. Plus 300."
- After 380 ms the next card comes in (`card-in`).

### 3. Wrong answer and miss replay

This is the G11 replay, about 5 seconds.

- The card shakes (`shake`). One hull heart empties and its label updates, "2 left".
- The tapped button takes the `wrong` state. The right answer takes the `answer` state. The other buttons are disabled for the replay.
- The vessel art shows its deciding detail: the trawl net, the buoy on the crane, the furled sails, the slack steering cables. A white pulse outlines that detail twice. Reduced motion shows a steady white outline instead. Stage 1 adds a `detail` region to each drawing for this.
- The explanation panel covers the card. See the component below.
- The panel's countdown bar runs for 5 s, then the next card comes in. From 0.8 s a tap on the panel, the panel's "Next" button or the Enter key ends it early. The miss sound has the shake and the purple panel as its visual partner.
- An assertive live region reads the panel's heading and answer line.
- The missed card returns three cards later with the "Again" tag (G11).
- If that miss empties the last heart, the replay still plays in full, and then the out-of-hearts screen follows.

### 4. Level cleared

A full screen overlay on `ocean-900`.

- Title "Level cleared" in `display`, `gold-500`.
- Stars: three star icons, filled `gold-500` or outlined `ink-400`, and the words "2 of 3 stars".
- One line on the next star, only when the player has fewer than three: "No misses inside 75 seconds earns 3 stars." or "One miss or fewer earns 2 stars."
- Score, best combo, misses and time, as label and value pairs in `body`.
- "Worth another look": the cards the player missed this run, each with its cue and its answer. Empty on a clean run, and then the heading is not shown.
- Primary button "Play again", 56 px tall, `gold-500` fill. Secondary button "Home". When level 2 exists, a line says it is open; this spec does not add level 2.

### 5. Out of hearts

Same overlay. Title "Out of hearts" in `purple-300` with an empty hull icon. "You cleared 9 of 16." The "Worth another look" list. Primary "Try again", secondary "Home". No stars are saved (G12).

### 6. Menu

A bottom sheet on `ocean-800`, opened by the menu button or Esc. It pauses the par timer. It holds "Sound: on" or "Sound: off" (a toggle with its state in words), "Restart level", "Home", and "Close". Every row is a 56 px button.

## Components

Props are the data each component reads. The renderer only reads run state from `src/sim`; no component decides scoring, combo, hearts or stars.

### `LevelHeader`

Props: `title`, `hearts`, `heartsTotal`, `combo`, `position`, `total`, `onMenu`.
States: idle; combo visible (combo 2 or more); a heart just lost (the emptied icon pulses once in white, static in reduced motion).

### `HullHearts`

Props: `remaining`, `total` (3).
Each heart is a hull icon: filled `gold-500` or outlined `ink-400`. The visible text "2 left" sits beside the icons, so the count never depends on the icons alone. Accessible name: "2 of 3 hearts left".

### `ComboBadge`

Props: `combo`, `multiplier`.
Hidden under 2. Shows "×3 combo" in `gold-500`, `body` 700. At the cap it reads "×5 combo, max". It scales to 1.1 for 100 ms on each step, and in reduced motion it does not scale.

### `RuleSetChip`

Props: `ruleSet` (`both` or `international`).
Text "Inland + International" or "International only", `small`, `blue-300`, 2 px `blue-500` border, pill shape, 32 px tall. It is not tappable and has no hover state. Accessible name: "Rule set: Inland and International".

### `ProgressCount`

Props: `position`, `total`.
Text "7 of 16" and a 6 px bar, `blue-500` fill on an `ocean-700` track. Exposed as `role="progressbar"` with `aria-valuenow` and `aria-valuemax`.

### `VesselCard`

Props: `art`, `cue`, `ruleSet`, `again`, `highlightDetail`.
`ocean-700` fill, 16 px corner radius, no border. The Phaser canvas fills the art area. The cue is HTML under it. The card's accessible name is the cue. The art never uses gold, electric blue or purple, so the feedback colors keep one meaning. It uses the neutral art tokens in the reuse audit below.

### `AnswerButton`

Props: `index` (1 to 6), `label`, `note` (optional, such as "International only"), `state`, `onAnswer`.
A real `button`, at least 64 px tall, 12 px corner radius, label centered in `body` 600, key digit at the left in `small` `ink-400`.

| State | Fill | Border | Icon at left | Sublabel | Notes |
| --- | --- | --- | --- | --- | --- |
| `idle` | `ocean-800` | 2 px solid `line-500` | Key digit | Note, if any, in `blue-300` | |
| `hover` (pointer only) | `ocean-800` | 2 px solid `blue-500` | Key digit | | Never the only cue |
| `focus-visible` | as current state | plus a 3 px `blue-300` outline, 2 px offset | | | Keyboard and switch users |
| `pressed` | `ocean-700` | 2 px solid `blue-500` | Key digit | | Scales to 0.98 for `press`; no scale in reduced motion |
| `correct` | `gold-tint` | 4 px solid `gold-500` | Check in a circle, `gold-500` | "Right" | The pick was right |
| `answer` | `gold-tint` | 4 px solid `gold-500` | Check in a circle, `gold-500` | "Answer" | Shown on the right answer after a miss |
| `wrong` | `purple-tint` | 4 px dashed `purple-500` | Cross in a circle, `purple-300` | "Your pick" | The pick was wrong |
| `disabled` | `ocean-800` | 2 px solid `line-500` | Key digit | | During feedback; label stays `ink-100`, `aria-disabled="true"` |

Right and wrong differ by border style (solid or dashed), by icon shape (check or cross) and by words ("Right", "Answer", "Your pick"), as well as by color. A player who cannot tell gold from purple, or who sees the screen in grayscale, can still read every result.

### `ExplanationPanel`

The miss replay's text. Props: `cue`, `answerLabel`, `why`, `citation`, `returnsIn`, `elapsedMs`, `onNext`.
`purple-tint` fill, 4 px dashed `purple-500` border, covering the card. Top to bottom:

1. Cross icon and "Not quite", `title`, `purple-300`.
2. The cue, `body`, `ink-300`.
3. "She is engaged in fishing." `answer-line`, `ink-100`. The answer label in lower case, from the regs check.
4. The reason, `body-lg`, `ink-100`, from the regs check word for word.
5. The citation chip: a book icon and the citation string from the regs check, such as "Rule 3(g)(i), 33 CFR 83.03(g)(i)", `small`, `blue-300` on `ocean-900`, 2 px `line-500` border.
6. "This one comes back in 3 cards." `small`, `purple-300`.
7. The countdown bar, 6 px, `purple-500`, emptying over 5 s. In reduced motion, the text "Next card in 5 s".
8. "Next" button, full panel width, 56 px, `gold-500` fill and `ocean-900` text, enabled from 0.8 s.

Nothing in the panel needs more than 5 seconds to read at the sizes above (G20). The longest reason line in the regs check is 24 words.

### `LevelEndOverlay`

Props: `outcome` (`cleared` or `out-of-hearts`), `stars`, `score`, `bestCombo`, `misses`, `seconds`, `missed` (a list of card ids), `onPlayAgain`, `onHome`.
States: cleared with 1, 2 or 3 stars; out of hearts. Focus moves to the title when it opens, and Tab reaches "Play again" first.

### `MenuSheet`

Props: `soundOn`, `onToggleSound`, `onRestart`, `onHome`, `onClose`.
Traps focus while open, closes on Esc, and returns focus to the menu button.

## Sound

Every sound has a visual partner, and the level plays fully muted (G16). The level shares the mute setting of `/play` through `src/game/sound.ts`: sound is on by default, audio starts on the first touch or key, and the choice is saved on the device under `captains-academy:muted`.

| Sound | Visual partner |
| --- | --- |
| Right-answer chime, pitch rising with the combo | Gold ring, check icon, "+points", combo badge step |
| Miss thud | Card shake (or static purple border), heart empties, explanation panel |
| Level cleared fanfare | Cleared overlay and stars |

## Keyboard and screen readers

- Keys 1 to 5 (1 to 6 in the variant) answer. Enter goes to the next card from the replay or presses the focused button. Esc opens and closes the menu.
- Focus moves to the first answer button when a card comes in, except when a screen reader user is inside the panel, where focus stays until they press Next.
- The question is the grid's group label: `role="group"` with `aria-labelledby` on the question.

## Reuse audit of `head-dev/ch1-definitions` at `3c67dd4`

The branch is 3 commits ahead of `main` and 54 behind. Stage 1 ports what is sound onto a fresh branch and does not merge the old one.

| Part | Decision | Why |
| --- | --- | --- |
| `src/sim/rapid.ts` | Keep, then rework | Pure, seeded (Mulberry32 with integer math), no DOM, and its queue, hearts, combo, miss return and stars match G11 and G12. Rework per ADR 0003 before level 2: situation terms instead of card terms, serializable state. One fix now: `runStars` takes `seconds` as a number. Pass integer milliseconds or frames instead, so replays never depend on a float (G1) |
| `tests/rapid.test.ts` | Keep and extend | It covers the shuffle, scoring and stars. Add one test per card and per answer, as Stage 1 requires |
| `src/sim/chapter1/definitions.ts` | Keep the ids and answers, replace the text | Every card id stays as the mastery key (ADR 0005, build plan). Cue, reason, citation and labels come from the regs check. The deck moves to `content/chapter-1/definitions.json` when ADR 0002 lands; Stage 1 can keep the TypeScript file if ADR 0002 has not merged |
| `src/game/storage.ts` mastery record | Keep | A small, safe per-card record that survives blocked storage. Migrate its key per ADR 0005 when that ADR lands |
| `src/game/rapid/DefinitionsScene.ts` | Rework | It draws the whole interface in the canvas. Text renders at 9 to 16 CSS px on a 390 px phone, under the 16 px floor. The key hint color fails contrast at 4.24:1 and the button border at 2.05:1. Right and wrong differ mainly by fill color. Canvas content is invisible to axe and to screen readers. Keep its timing constants (380 ms, 5 s, 0.8 s) and its `window.__captainsAcademyQuiz` debug state, which the verification skill reads |
| `src/game/rapid/vesselArt.ts` | Keep the drawings, rework the colors | The 17 drawings are clear top-down hulls and show the detail each card turns on. They use `gold`, `blue` and `purple` in about ten places (lines 164 to 439 on `3c67dd4`), which are now feedback colors. Swap those for neutral art tokens: `art-hull #e8eef3`, `art-deck #9aa8b4`, `art-cabin #c9d3db`, `art-sail #f4f6f8`, `art-line #b8c6d2`, `art-wake #8fd0ff`, `art-buoy #c9a46a`, `art-bank #2a2f2a`. Add a `detail` region per drawing for the miss highlight. The art draws no navigation lights or day shapes, so it teaches nothing wrong about Rules 20 to 30 |
| `rules/index.html`, `src/game/rapid/main.ts`, `vite.config.ts` entry | Keep | The `/rules` page, its offline entry and the front page link work. Rebuild the page body to hold the HTML components |
| `e2e/rules.spec.ts` | Keep the flows, rewrite the selectors | It covers a clean run, a miss with its replay and running out of hearts. Point it at the HTML buttons and add the cleared screen, the axe check and the tap-target check |
| `.claude/skills/verify-captains-academy/` changes | Port by hand | The old branch edited `drive.mjs`, and #46's merged slices have changed it on `main` since. Port the Definitions feature onto the current `main` file. Nothing here waits on #46's remaining work, which is parked (G19a) |
| `proof/` and the old time card | Drop | The proof covers an old head and is stale. The time card belongs to the old branch's history |

## Out of scope

- Rule 5 lookout content. G7 puts lookout in level 1, and the build plan's Ticket 1 adds it. It needs its own regs check first (regs check finding F3) and a spec addendum here.
- The International differences level that would receive the constrained-by-draft card.
- Level 2, Lights (#29), which gets its own spec through the same process.

## Checks Stage 1 must pass against this spec

- Screenshots at 390 by 844 and 1440 by 900 of: the first card, a right answer, a wrong answer with the panel, and the cleared screen.
- An axe check of `/rules` with no violations on the question, the panel and both end screens.
- The contrast test that recomputes the table above from `palette.ts`.
- The tap-target test: every button at least 48 by 48, every answer at least 64 tall.
- A muted run and a reduced-motion run that still show every state above.
