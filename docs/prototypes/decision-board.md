# Decision board

The page at `/prototypes/` (issue #72) is where the team judges the Claude and ChatGPT prototype images. It is an internal design review. Elliott makes the final call, and no dot approves building anything. The page has `noindex`, but anyone with the address can open it, so it stays on a draft pull request until Elliott decides whether it goes public.

It is the first app screen built with React, Tailwind CSS and shadcn/ui ([ADR 0009](../adr/0009-app-screens-use-react-tailwind-and-shadcn.md)). The arcade game does not use any of them.

## How a round runs

The board follows the "decide" steps of Google Ventures' Design Sprint. Whoever runs the review moves the round from step to step.

1. **Look silently.** Everyone looks through the concepts and writes sticky notes. Nobody can place a dot yet.
2. **Dot vote.** Each reviewer has 5 dots. Clicking a spot on an image drops a dot there, so the dots build a heat map of what people like. The Add a dot button puts a dot in the middle of the image for keyboard and screen-reader users. Two dots may go on the same concept. Clicking your own dot takes it back. Other people's dots stay hidden until you press Done voting or place all 5, so nobody follows the crowd.
3. **Discuss top dots.** Everyone sees every dot. The heat panel ranks concepts by dots, and concepts with the same number share a rank, shown as "=3". Only dotted concepts narrows the board to what people chose.
4. **Decider's call.** Only the decider, Elliott, can pick one concept and write why. The decision shows at the top of the board and goes to a build ticket next.

## What is on the board

[`INVENTORY.md`](INVENTORY.md) lists all 76 items. The board holds 55 of them: 41 visual concepts (ChatGPT's directions and Claude's mockups, Harbor Run and Night Harbor Run screens) and 14 screenshots of the app as built.

The Reference tab holds the other 18: comparison boards, decks, wireframes, superseded build screenshots and the two PDFs. A comparison board's concepts are on the board one by one as extracted details, so the board itself is left off to avoid counting them twice. Three directions named in the brief have no image and are listed as unavailable. The playable Night Harbor Run is a private Claude page linked under Reference. Ask Elliott for access.

The rules live in `src/prototypes/board.ts` and are tested in `tests/decision-board.test.ts`. The page is tested in `e2e/prototypes.spec.ts` on a desktop and on phones.

## Where the board is saved

The board is saved on the device, in the browser's `localStorage`, and nowhere else. The site has no server or shared database yet, so the page says "Saved on this device". Clearing site data deletes it. If the browser blocks storage, as some private windows do, the page says the board is not saved and lasts only until the tab closes.

No database migration or new service was added. A shared database (DECISIONS.md A1) will replace the files below.

## Combining a team's dots

1. Each reviewer places their dots, opens Share and presses Export my dots and notes. The file is named `decision-board-frontend-direction-1-<name>-<date>.json`.
2. They send the file to Elliott.
3. Elliott opens Share and presses Import a board file once per file. For each reviewer, the newer copy wins. Dots and notes on concepts the board does not list are skipped and counted.
4. Elliott runs the discussion and the decision from the combined board. Export everything on this device writes one file with every reviewer, to move the combined board to another computer.

## Changing the inventory

1. Add or change the item in `inventory.json`. Never rename an id: saved and exported boards point at ids.
2. Run `python3 scripts/prototype-thumbnails.py` to rebuild the previews and record each image's width and height.
3. Run `node scripts/prototype-inventory.ts` to rewrite `INVENTORY.md`.
4. `npx vitest run tests/prototype-inventory.test.ts` checks that every file exists at its recorded size, that ids are unique and that nothing is on the board twice.
