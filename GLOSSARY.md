# Captain's Academy

A sea-time log, Coast Guard license prep, navigation-light flashcards and a ship simulator for people working toward a U.S. Coast Guard captain's license. This glossary starts with the design-review terms. Add other terms as they are settled.

## Design review

**Decision Desk**:
The page at `/prototypes/` where the team dot-votes on prototype concepts, discusses the top dots and records the decider's call. It saves on the device only.
_Avoid_: Decision board (older name, still in some file names), gallery, rating page

**Live variant**:
One of the three coded prototypes, A, B or C, of a product category at `/prototypes/live/?category=<c>&variant=<a|b|c>`.
_Avoid_: Interactive mockup, option

**Hill climb**:
A run that improves one live variant in small steps, keeping a step only when the scoring script says it beat the best so far. At most 5 steps of 3 candidates, stopping after 2 steps in a row with no gain.
_Avoid_: Optimization, auto-design, OPRO run

**Main task**:
The one job a category's climb score measures, such as checking in to a sea-time entry. Each category has exactly one.
_Avoid_: User flow, journey, scenario

**Gate**:
The pass/fail check every candidate must pass before it gets a score: every interactive control is at least 44 by 44 CSS pixels, and axe-core's color-contrast rule reports no violations.
_Avoid_: Accessibility score, lint

**Climb score**:
The number of taps that finish the main task in a Playwright iPhone viewport, with the median seconds over 3 runs breaking a tie. Lower is better.
_Avoid_: Rating, grade, UX score

**Climbed variant**:
A kept result of a hill climb, with its own URL (`&climb=<n>`) and concept ids (`cl-climb-<c>-<v>-<n>-desktop` and `-iphone`), labelled "climbed from A", "B" or "C". It never replaces the variant it came from.
_Avoid_: Variant D, optimized variant, winner

**Task path**:
The list of taps, each named by accessible role and name, that finishes a variant's main task. It sits next to the variant's code.
_Avoid_: Script, test, recording
