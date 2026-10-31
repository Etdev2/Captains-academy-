# Hill climb

A Hill climb improves one live variant on the Decision Desk in small steps. A script, not an opinion, decides whether each step is better. The method follows OPRO (Yang et al., "Large Language Models as Optimizers", 2023, as surveyed in Sahoo et al., arXiv 2402.07927): the agent rereads every earlier attempt and its score before proposing the next ones. The team then dot-votes on the climbed variants. A climbed variant is design input and approves nothing. Terms are defined in [`GLOSSARY.md`](../../GLOSSARY.md).

## The button

In the discuss and decide steps of a round, the viewer of every live-variant screenshot (A, B or C of a category, desktop or iPhone) has a Hill climb button. It copies the `hill-climb` prompt from [`public/collaborate/prompts.json`](../../public/collaborate/prompts.json), filled in with the category, the variant and the concept id, and says so in the viewer's status line. It starts nothing. A person pastes the prompt into a coding agent. The button is hidden while people look and vote, so a climb never changes what is being voted on. The rule lives in [`src/prototypes/hillClimb.ts`](../../src/prototypes/hillClimb.ts).

The collaboration page at `/collaborate/` lists the same prompt with its placeholders unfilled.

## Main tasks and end states

Each category has one main task. [`scripts/hill-climb-score.mjs`](../../scripts/hill-climb-score.mjs) holds a fixed end-state check for each, which a climbing agent must not edit.

| Category | Main task | End state the script checks |
| --- | --- | --- |
| console | From home, open the next action. | A "Go to the form review" link is visible. |
| license | Pick a license and reach the "what's missing" view. | A level-1 heading names what is missing, or a "Still missing" filter button is pressed, or a "still missing" checkbox is checked. |
| sea-time | Check in to a sea-time entry. | A button starting "Check out" is visible. |
| study | Answer one practice question and see its explanation. | An answer is marked "Your answer" or "Right answer", a 33 CFR 83 citation is visible, and a "Next question", "See score" or "Finish and debrief" button follows. |
| arcade | Start a docking challenge and reach the debrief. | The page shows "Your time" with a time, and names Long Beach or Crosswind slip. |

The arcade path uses the autopilot button, because the script can tap but cannot steer. Each arcade run takes about 45 seconds while the autopilot docks.

## Task paths

A task path is a JSON file that lists the taps finishing the main task, each by accessible role and exact name:

```json
{
  "category": "sea-time",
  "variant": "a",
  "taps": [{ "role": "button", "name": "Check in · start trip" }]
}
```

The A/B/C paths are `src/prototypes/live/<category>/<variant>.path.json`. A climbed variant's path is `path.json` in its own folder, with `"climb": <n>` added.

## The score

```sh
npx vite build && npx vite preview &
node scripts/hill-climb-score.mjs --category sea-time --variant b [--climb 1] --url http://localhost:4173
```

The script opens the variant with `frame=0` in an iPhone 13 viewport in Chromium. It replays the path once with the gate on every screen: the first screen, the screen after each tap and the end state. The gate fails when a visible, enabled interactive control is smaller than 44 by 44 CSS pixels, or when axe-core's `color-contrast` rule reports a violation. A checkbox or radio button counts as the box around it and its label, because tapping the label works too. If the gate passes and the end state is reached, the script times 3 more runs from opening the page to the end state.

It prints one JSON line:

```json
{"gate":"pass","failures":[],"taps":1,"medianSeconds":0.52}
```

`taps` and `medianSeconds` are null when the gate fails or the end state is not reached, because such a candidate gets no score. The exit code is 0 for a score, 1 for a gate failure or a missed end state, and 2 for bad arguments, a missing path file or a page that does not load. Fewer taps wins. On a tie, the lower median seconds wins.

`--page` and `--path-file` exist for the script's own tests in `e2e/hill-climb.spec.ts`. A run that uses them says on stderr that it is not a climb score.

## Climbed variants

A kept result becomes climbed variant `<n>` of the variant it started from:

- code in `src/prototypes/live/<category>/climbs/<variant>-<n>/index.tsx`, which default-exports one component taking the same props as a variant, and `path.json` beside it;
- URL `/prototypes/live/?category=<c>&variant=<v>&climb=<n>`. The live shell finds the folder by name, so no other file changes;
- concept ids `cl-climb-<c>-<v>-<n>-desktop` and `cl-climb-<c>-<v>-<n>-iphone`, with screenshots in `docs/prototypes/interactive/climbs/`;
- in `inventory.json`, `"climbedFrom": "A"`, `"B"` or `"C"` and `interactive` set to the climb URL. The Decision Desk labels the tile "Climb <n> · climbed from B" and puts it after A, B and C in its category's row.

A climb never edits or renames the A/B/C code, task paths or ids. See "Changing the inventory" in [`decision-board.md`](decision-board.md) to add the screenshots.

## Baseline

The 15 A/B/C variants as of 31 October 2026, against a local production preview:

| Category | A | B | C |
| --- | --- | --- | --- |
| console | 1 tap, 0.52 s | 1 tap, 0.53 s | 1 tap, 0.49 s |
| license | gate fails | gate fails | gate fails |
| sea-time | 1 tap, 0.52 s | 1 tap, 0.56 s | 1 tap, 0.64 s |
| study | 2 taps, 0.59 s | 4 taps, 0.73 s | 2 taps, 0.56 s |
| arcade | 2 taps, 43.2 s | 3 taps, 43.2 s | 5 taps, 43.3 s |

All three license variants fail the gate on the same controls: the glossary term buttons "MMC", "OUPV" and "Six-pack" in the license summary are 23 to 28 pixels tall. Their paths are 4 taps (A and B) and 3 taps (C). Fixing those buttons is outside the Hill climb ticket.

Seconds vary with the machine. Compare them only between runs on the same machine.
