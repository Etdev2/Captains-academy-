# Decision board

The page at `/prototypes/` (issue #72) is where the team judges the Claude and ChatGPT prototype images. It is an internal design review. Elliott makes the final call, and no dot approves building anything. The page has `noindex`, but anyone with the address can open it, so it stays on a draft pull request until Elliott decides whether it goes public.

It is the first app screen built with React, Tailwind CSS and shadcn/ui ([ADR 0009](../adr/0009-app-screens-use-react-tailwind-and-shadcn.md)). The arcade game does not use any of them.

## How a round runs

The board follows the "decide" steps of Google Ventures' Design Sprint. Whoever runs the review moves the round from step to step.

1. **Look silently.** Everyone looks through the concepts and writes sticky notes. Nobody can place a dot yet.
2. **Dot vote.** Each reviewer has 5 dots. Open a concept, then tap a spot on its image to drop a dot there, so the dots build a heat map of what people like. The Add a dot button puts a dot in the middle of the image for keyboard and screen-reader users. Two dots may go on the same concept. Tapping your own dot takes it back. Dots show on the tiles too. Other people's dots stay hidden until you press Done voting or place all 5, so nobody follows the crowd.
3. **Discuss top dots.** Everyone sees every dot. The heat panel ranks concepts by dots, and concepts with the same number share a rank, shown as "=3". Only dotted concepts narrows the board to what people chose.
4. **Decider's call.** Only the decider, Elliott, can pick one concept and write why. The decision shows at the top of the board and goes to a build ticket next.

## What is on the board

[`INVENTORY.md`](INVENTORY.md) lists all 76 items. The board holds 55 of them: 41 visual concepts (ChatGPT's directions and Claude's mockups, Harbor Run and Night Harbor Run screens) and 14 screenshots of the app as built.

The board groups them by screen: Home, Definitions, Lights, Night Harbor and Docking, each under a header that sticks to the top while you scroll through it. The app's own screenshots sit in an "As built" row at the end of their section. The Definitions screen was captured twice, on a phone and on a desktop, at the same four moments. The board shows each moment once, as the phone capture, and its viewer opens the desktop twin, so 51 tiles cover all 55 concepts. Dots and notes on either capture still count. [`src/prototypes/sections.ts`](../../src/prototypes/sections.ts) holds the grouping, and `tests/prototype-sections.test.ts` checks that every concept appears exactly once and every tile has a label of its own.

## How the page looks and behaves

- Each tile is its image, edge to edge at the image's own proportions, with a one-line label and one line of tags. Tapping anywhere on the tile opens it.
- Tiles of the same shape (wide strips, landscape screens, phone screens) share a masonry grid that adds each tile to the shortest column, so no tile leaves a hole beside a taller one. On a phone held sideways, a tall tile stays short enough to see whole.
- Every image box has the image's width and height, so nothing moves as images load, and it is painted in the image's dominant color until the file arrives. The first four tiles load at once and the rest load as they near the screen.
- The page sits on the app's dark navy (#06121F page, #0B1A2B surfaces, #EAF2FA and #A9BDD1 text) whatever the phone's setting, so dark mockups are judged on the ground they were drawn for. Focus shows as a solid #4FC3FF ring. Surfaces have edges and no shadows. Every control is at least 44px each way. These rules live in [`src/prototypes/board.css`](../../src/prototypes/board.css) and apply to this page only; the shared shadcn components keep their standard sizes elsewhere.
- The viewer fills the screen and fits the image to it. Notes and the item's details open in a sheet over the bottom of the image. Swipe sideways, use the arrow keys or the Previous and Next buttons to step through the board in the order it shows its tiles. Zoom shows the image at two and a half times its fitted size, for reading a wide strip on an upright phone. On a phone held sideways the controls move into a rail at the side. The page header stays hidden while the viewer is open, and Escape closes it.

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
2. Run `python3 scripts/prototype-thumbnails.py` to rebuild the previews and record each image's width, height and dominant color.
3. Put a new concept in its section in `src/prototypes/sections.ts`.
4. Run `node scripts/prototype-inventory.ts` to rewrite `INVENTORY.md`.
5. `npx vitest run tests/prototype-inventory.test.ts tests/prototype-sections.test.ts` checks that every file exists at its recorded size, that ids are unique and that nothing is on the board twice.
