# Prototypes

Design work for the arcade game before it is built: mockups, playable prototypes, wireframes and handoffs. Each topic has its own folder with a README that GitHub renders with its images.

Nothing here is a decision. Settled decisions live in [`docs/product/DECISIONS.md`](../product/DECISIONS.md). Rules content in a prototype is a draft until `uscg-regs` checks it.

| Folder | What it holds | Session |
| --- | --- | --- |
| [`rules-of-the-road/`](rules-of-the-road/README.md) | Chapter 1 game map, eleven level mockups, the lights and day shapes decks, the Harbor Run course design, the playable Night Harbor Run prototype, screenshots of levels built on branches for #46 and #47, wireframes with layout numbers, and the open questions | 21 to 22 October 2026 |
| [`interactive/`](interactive/README.md) | Interactive prototypes at `/prototypes/live/`: five categories (Console, License & Forms, Sea Time, Study, Arcade), each in variants A Night Bridge, B Clean & Light and C Guided Mentor. `images/` holds screenshots of the implementation, not reference images | 26 October 2026 |
| [`arcade-handoff.md`](arcade-handoff.md) | Handoff of the arcade game to Nick: levels 1 to 3 as built and Elliott's view of each, the arcade prototypes on the board, decisions and open issues | 27 October 2026 |
| [`frontend-directions/`](frontend-directions/README.md) | ChatGPT's frontend directions: the seven page images from its PDF, the comparison-board rows cut out as extracted details, and the three named directions that were not supplied | 25 October 2026 |
| [`infrastructure/`](infrastructure/README.md) | Team tooling, not the game: the infrastructure prototype page for the six-person AI coding setup, its infrastructure map, hill-climbing loop, financials, GPT review and prototype prompts | 31 October 2026 |

## Decision board

The internal page at `/prototypes/` puts the images in [`INVENTORY.md`](INVENTORY.md) on a decision board: reviewers dot what they like, the team discusses, and Elliott decides. [`decision-board.md`](decision-board.md) says how a round runs, where the board is saved and how Elliott combines a team's dots. `inventory.json` is the list it reads, `INVENTORY.md` is generated from it, and `thumbnails/` holds the small previews.

To add a prototype, make a folder named for the topic, put images under `images/` and any playable file under `playable/`, and write a README that says what each image shows and what is still open. Link it from this table, and add its images to `inventory.json` as `decision-board.md` describes.
