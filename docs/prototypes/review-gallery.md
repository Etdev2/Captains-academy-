# Prototype review gallery

The page at `/prototypes/` (issue #72) lets developers and collaborators compare the Claude and ChatGPT prototype images, rate them and leave comments. It is an internal design review. Elliott makes the final selection, and no score approves building anything.

The page has `noindex`, but anyone with the address can open it. It stays on a draft pull request until Elliott decides whether it goes public.

## What gets rated

[`INVENTORY.md`](INVENTORY.md) lists all 76 items. The gallery rates 55 of them:

- 41 visual concepts: ChatGPT's directions and Claude's mockups, Harbor Run and Night Harbor Run screens.
- 14 screenshots of the app as built.

It does not rate the 18 reference items: comparison boards, decks, wireframes, superseded build screenshots and the two PDFs. A board's concepts are rated one by one as extracted details, so rating the board as well would count them twice. Three directions named in the brief have no image and are listed as unavailable.

The playable Night Harbor Run is a private Claude page, linked under Reference. Ask Elliott for access. It is not rated; its screenshots are.

## Rating

Each reviewer types a name, then answers one question per item: "How strongly do you support this visual direction for Captain's Academy?" The scale runs from 1 (strongly oppose this direction) through 5 (mixed or undecided) to 10 (strongly support this direction). A comment and a favorite mark are optional.

- Each reviewer has one current rating per item. Saving again replaces it.
- Names match without regard to case or extra spaces, so "ana" and "Ana " are one reviewer.
- An unrated item has no average and is never counted as zero.
- An item's results stay hidden until you have rated it.
- Results show the average to two decimals with the number of reviewers beside it, the spread of scores from 1 to 10, the favorites and the comments.
- Items with the same exact average share a rank, shown as "=2", and stay in gallery order. The number of reviewers never breaks a tie.

The rules live in `src/prototypes/ratings.ts` and are tested in `tests/prototype-ratings.test.ts`.

## Where ratings are saved

Ratings are saved on the device, in the browser's `localStorage`, and nowhere else. The site has no server or shared database yet, so the page says "Saved on this device" and never calls its results team results. Clearing site data deletes the ratings. If the browser blocks storage, as some private windows do, the page says ratings are not saved and last only until the tab closes.

No database migration or new service was added.

## Combining a team's ratings

1. Each reviewer opens Results and presses "Export my ratings". The file is named `captains-academy-prototype-ratings-<name>-<date>.json`.
2. They send the file to Elliott.
3. Elliott opens Results and presses "Import a ratings file" once per file.

Import keeps the newer rating when the same reviewer rated the same item twice. It skips ratings for items the gallery does not list and says how many it added, updated and skipped. Results then say how many reviewers they combine. "Export all ratings on this device" writes one file with every rating on the device, so the combined set can move to another computer.

A shared store would need a server and a migration. That is a separate decision for Elliott, not part of this page.

## Changing the inventory

1. Add or change the item in `inventory.json`. Never rename an id: saved and exported ratings point at ids.
2. Run `python3 scripts/prototype-thumbnails.py` to rebuild the previews.
3. Run `node scripts/prototype-inventory.ts` to rewrite `INVENTORY.md`.
4. `npx vitest run tests/prototype-inventory.test.ts` checks that every file exists, that ids are unique and that nothing is rated twice.
