# Frontend directions from ChatGPT

Elliott supplied these on 25 October 2026 as `Captains_Academy_All_Prototypes.pdf` (seven pages, SHA-256 `4182ba10defb0622c520a8907bf3e05cbcd1676173d065ed86126c521bd2ebce`). ChatGPT made them. They are visual concepts. Their lesson text and navigation diagrams need checking before anyone uses them to teach.

The PDF itself is not committed: it is 17.5 MB and every image in it is here. Whether to commit it is an open question for Elliott.

## Where the images came from

Each PDF page holds one embedded image. `pdfimages` copied each one out losslessly, at its own pixel size, into `boards/`. Nothing was redrawn, resized or retouched.

| File | PDF page | Size | What it shows |
| --- | --- | --- | --- |
| `boards/p1-home-directions-coastal-precision-ocean.png` | 1 | 1536 × 1024 | Home screen in three directions: Coastal editorial, Precision marine, Ocean studio |
| `boards/p2-home-directions-chart-pacific-fieldbook.png` | 2 | 1536 × 1024 | Home screen in three directions: Chart house, Pacific modern, Academy fieldbook |
| `boards/p3-definitions-lesson-concepts.png` | 3 | 1536 × 1024 | The Definitions lesson in Chart house, Precision marine and Ocean studio |
| `boards/p4-lights-lesson-concepts.png` | 4 | 1536 × 1024 | The Lights lesson in the same three directions |
| `boards/p5-prototype-book-dark-cleanup.png` | 5 | 1426 × 1103 | Dark prototype-book cleanup: one concept across 16 book pages |
| `boards/p6-prototype-book-light-alternate.png` | 6 | 1426 × 1103 | Light coastal-field-guide alternate: one concept across six spreads |
| `boards/p7-original-prototype-book-reference.png` | 7 | 1320 × 1020 | A contact sheet of Claude's prototype book, the reference the two book concepts start from |

## Extracted details

Pages 1 to 4 are comparison boards with three directions stacked in rows. To judge each direction on its own, `extracted/` holds each row cropped at full width. The crop changes nothing else, and each extracted detail links back to its board on the decision board. The boards stay whole under Reference and are left off the board, so no concept is counted twice.

| Board | Row 1 (y) | Row 2 (y) | Row 3 (y) |
| --- | --- | --- | --- |
| p1 | Coastal editorial, 0 to 384 | Precision marine, 384 to 720 | Ocean studio, 720 to 1024 |
| p2 | Chart house, 0 to 356 | Pacific modern, 356 to 699 | Academy fieldbook, 699 to 1024 |
| p3 | Chart house, 0 to 362 | Precision marine, 362 to 694 | Ocean studio, 694 to 1024 |
| p4 | Chart house, 0 to 346 | Precision marine, 346 to 688 | Ocean studio, 688 to 1024 |

Pages 5 and 6 each show one concept, so each is on the board whole. Page 7 is reference.

## Labels and grouping

The decision board keeps ChatGPT's own names as the style labels. It groups nothing beyond that: the Chart house home screen and the Chart house Lights lesson share the style "Chart house", so the style filter shows them together. The two book concepts keep their full names, "Dark prototype-book cleanup" and "Light coastal-field-guide alternate", and are not merged with any home-screen direction.

## Not supplied

The review brief names three more directions: Clean maritime, Professional academy and Night bridge. Neither PDF contains them. The inventory lists them as unavailable with no image, and the decision board shows them under Reference. Nothing was made up to stand in for them.

## Errors to fix before any of this teaches

- The light alternate (page 6) labels a cylinder day shape "power-driven". A cylinder is the day shape of a vessel constrained by her draft, under International Rule 28. The Inland Rules reserve Rule 28 and have no such vessel.
- The Lights concepts (page 4) draw signal lights that nobody has checked against Rules 20 to 31. `uscg-regs` checks them before any of it reaches the app.

The full list of images, with ids, is in [`../INVENTORY.md`](../INVENTORY.md).
