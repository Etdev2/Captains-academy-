# Lights level design spec (Chapter 1, level 2)

Issue #29. Lights is the second rapid-fire level of Chapter 1, at `/rules/?level=lights`. It uses the Definitions level's flow, color tokens, type, spacing and components unchanged (see [definitions-spec.md](definitions-spec.md)); this spec only says what is different. Card text and citations come from [lights-regs-check-2026-10-23.md](../product/lights-regs-check-2026-10-23.md).

## Who it is for

The same person as Definitions: a mariner working toward a license, on a phone, one thumb, often in poor light. Lights adds a second reason for the night scene: the player is learning to read a small cluster of dots against the dark, so the picture is big, high contrast and never crowded.

## Decisions this spec makes

- The picture is a bridge view of a night horizon (G2, G15): a dark sky, a slightly lighter sea and a thin horizon line. Only the lights are bright. The canvas carries no text.
- One vessel at a time, seen from one angle. The cue under the picture says where she is heading and whether she is moving, in words ("Heading straight at you", "Making way, her bow angled to your left").
- Which lights show comes from Rule 21 (`src/sim/navigation-lights.ts`), never from the card. A vessel seen from astern does not show her masthead light. The explanation says the same thing the picture shows.
- Seven answers in one fixed order, keys 1 to 7: Power-driven, Sailing, Towing, Engaged in fishing, Not under command, At anchor, Restricted in her ability to maneuver. The order never changes between cards, so the thumb and the keys learn it (G20).
- A right answer shows its citation under the picture (`#rule-line`), because every Lights situation names its rule (G6, G20). Definitions leaves this line empty. The line is always reserved on Lights, so the card does not jump when it fills.
- The rule set chip reads "Inland + International" on every card. Lights is a shared level; Inland-only and International-only material waits for the differences levels (G6). Constrained by draft (Rule 28) is checked but kept out.
- No red or green in the interface (G15). Red and green appear only as navigation lights, drawn from `LIGHT_COLORS` in `src/game/ui/palette.ts`. `tests/palette.test.ts` fails if any other game file uses them.

## Visual system

Tokens, contrast pairs, type and spacing are Definitions'. The Lights picture adds these art colors, all in `ART`:

| Part | Hex | Note |
| --- | --- | --- |
| Sky | `#050b14` | Behind the lights. Darker than any interface surface |
| Sea | `#0a1a2c` | Below the horizon |
| Horizon line | `#1b3a58` | Two pixels, so the eye finds the level |
| Stars | `#c9d3db` | Faint dots at 35 percent, so none is mistaken for a white light |

The light colors, in `LIGHT_COLORS`: white `#ffffff`, red `#ff3b30`, green `#2ee66b`, yellow `#ffd23f`. Each light is a filled dot with a soft halo. They are the only red and green on any screen.

The sky, sea, horizon and star colors are not red or green; `tests/palette.test.ts` checks that. The art is decoration, so it has no text contrast requirement; the cue and answers below it keep Definitions' pairs.

## Layout

### Phone, portrait first (G8)

Same stack as Definitions: header, hearts and combo, progress, the card, then the answer buttons under the thumb. The seven answers sit two across in the Definitions grid, and the seventh, the longest label, spans the full width. Each is 64 px tall or more, and a label that runs long wraps to two lines inside its button. The card shrinks to leave room, and the page scrolls only inside the explanation sheet, which has `max-height: 100%` and scrolls its own content.

The picture is 660 by 480 drawing units scaled to the card width. Lights sit 30 units apart across and 15 up, so two lights are always far enough apart to tell at 390 wide.

### Desktop

The same centered column as Definitions, with the card above the answers. Keys 1 to 7 answer, Enter skips the replay once it can be skipped, Esc opens the menu. The line under the grid reads "Keys 1 to 7 answer. Enter goes to the next card. Esc opens the menu." On a short window, such as 1280 by 768, the card gives up height to the seven answers and the picture draws small; at 1440 by 900 it is about 300 px wide.

## Screens

1. **Question.** Night horizon with the vessel's lights, the cue, a blank reserved rule line, the question "Which vessel shows these lights?" and seven answers.
2. **Right answer.** The tapped answer turns gold and says "Right". A gold flash crosses the card, points float up, the combo ticks, and the rule line shows the citation, for example "Rule 23(a), 33 CFR 83.23(a)". The next card follows after a short hold.
3. **Wrong answer and miss replay.** A purple flash and a short camera shake (none under reduced motion). The tapped answer says "Your pick" and the right one says "Answer". The lights that decide the card are ringed in white for 0.6 s, then the explanation opens: "Those are the lights of a vessel at anchor.", one line of reason, the citation, and "This one comes back in 3 cards." The replay runs 5 s, can be paused, and Next works after 0.8 s. Nothing blocks the player longer than that.
4. **Level cleared.** Stars, score, best combo, misses, time, and a review list of missed cards with their answer and citation. Lights is the last level of Chapter 1 for now, so there is no "Next" button.
5. **Out of hearts.** No stars. "Try again" starts a new shuffle.
6. **Menu.** Sound, Restart, a link to 1 · Definitions, Home and Close. Level links show "locked" with the reason while a level is shut.

## Components

Lights reuses `LevelHeader`, `HullHearts`, `ComboBadge`, `RuleSetChip`, `ProgressCount`, `AnswerButton`, `ExplanationPanel`, `LevelEndOverlay` and `MenuSheet` unchanged. Two parts differ:

- **`LightsView`** (`src/game/rapid/LightsView.ts`) replaces `VesselCard`'s art. It places each shown light from the vessel's pattern and the aspect, and rings the deciding lights on a miss. A steady ring under reduced motion, a pulsing one otherwise.
- **`RuleLine`** (`#rule-line`) is new: one line of small blue text under the cue, centered, holding the citation after a right answer. It is empty on Definitions and hidden there.

## Sound

The same sounds as Definitions: a chime for right, a low bump for wrong. Sound is on by default and mutable from the menu. Every state is shown in words and color as well, so a muted run loses nothing.

## Keyboard and screen readers

Keys 1 to 7 answer. The cue, the question and the answers are real text. The right answer announces "Right. Power-driven. Rule 23(a), 33 CFR 83.23(a). Plus 100." and a miss announces the answer line, reason and citation in full at once, so a player who skips the replay still hears the rule.

## Checks this spec must pass

- `e2e/lights.spec.ts` on phone upright, phone sideways and desktop: first card, clean run, miss and replay, muted run, out of hearts, a locked address, axe with no violations, contrast of every text against a palette token pair, and tap targets of at least 48 px (64 px tall for answers).
- `tests/palette.test.ts`: no red or green outside the lights.
- `tests/lights.test.ts` and `tests/lights-replays.test.ts`: the deck matches the regs check word for word, and the lights shown at every sector edge are pinned.

## Screenshots

Taken from the real build on 2026-10-24 with `features/steps/lights-phone-390.steps.json` (390 by 844) and `features/steps/lights-desktop-wide.steps.json` (1440 by 900), seed 29. Both runs answer two cards right, miss the third, pause the explanation and clear with 2 stars.

| Screen | Phone 390 | Desktop wide |
| --- | --- | --- |
| First card | [phone-390-1-first-card.png](screenshots/lights/phone-390-1-first-card.png) | [desktop-wide-1-first-card.png](screenshots/lights/desktop-wide-1-first-card.png) |
| Right answer | [phone-390-2-correct.png](screenshots/lights/phone-390-2-correct.png) | [desktop-wide-2-correct.png](screenshots/lights/desktop-wide-2-correct.png) |
| Wrong answer with explanation | [phone-390-3-wrong-explanation.png](screenshots/lights/phone-390-3-wrong-explanation.png) | [desktop-wide-3-wrong-explanation.png](screenshots/lights/desktop-wide-3-wrong-explanation.png) |
| Cleared | [phone-390-4-cleared.png](screenshots/lights/phone-390-4-cleared.png) | [desktop-wide-4-cleared.png](screenshots/lights/desktop-wide-4-cleared.png) |

## Out of scope

Day shapes, sound signals, Inland-only and International-only lights, flashing and special-purpose lights, and later Chapter 1 levels.
