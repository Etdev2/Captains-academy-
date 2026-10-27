# Lights stills for the prototype decision board

This pack holds nine still images from Et's Lights design session on 2026-10-25. The first three are alternative question-screen designs. The other six show the head-on maneuver, harder towing and crossing questions, and a trawling question. They are reference images, so a vote on the decision board selects a visual direction rather than grading each question.

The trawling screen has a companion audio sample, [trawling-mnemonic.mp3](trawling-mnemonic.mp3). It says, "Green over white, trawling at night." The screen prints the same words for muted play. White over green is a wrong-answer trap, not the trawling pattern.

These are static design drafts. The lesson text and vessel diagrams need a `uscg-regs` pass before they become teaching material. The source checks used for the drafts are in `docs/product/night-harbor-run-regs-check-2026-10-22.md` and PR #70's `docs/product/lights-regs-check-2026-10-23.md`.

## Add them to the board

The decision board is currently on draft PR #73. Keep this pack on its own branch while that work continues. Once the board branch includes this folder, run:

```sh
python3 design/prototypes/lights/decision-board/add-to-inventory.py
python3 scripts/prototype-thumbnails.py
node scripts/prototype-inventory.ts
npx vitest run tests/prototype-inventory.test.ts
```

The first command adds the nine entries from [inventory-additions.json](inventory-additions.json) to `docs/prototypes/inventory.json`. It verifies each PNG's dimensions and skips exact matches on a second run. It stops if an existing id has different content. The board's own scripts then create thumbnails, update `INVENTORY.md`, and check the inventory.

The board's Export and Import controls move votes and notes between devices. They do not add images. Adding images uses the inventory workflow above.
