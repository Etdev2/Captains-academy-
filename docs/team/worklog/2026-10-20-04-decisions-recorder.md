### 2026-10-20 | decisions recorder, then head-dev | 18:11 to 19:23 UTC

Tiller Mooring (Claude), recording decisions for Et. Docs only: no app code was built, since the project has no verification command yet. Et chose the second grilling session over the earlier call to keep the Unity simulator, so the records had to agree with it.

- Updated the decisions register: the first playable prototype is docking in Long Beach harbor, and three checks must pass before the six-pack exam boss level is built (the exam numbers confirmed by the Coast Guard's exam center, one exam code placed correctly, and a Coast Guard reviewer).
- Narrowed the open exam question to the exam center's confirmation, because its web page still links the 2014 exam guide.
- Rewrote the arcade game's technology record so it no longer keeps the Unity simulator, and fixed the points Codex raised on it.
- Made the boss-level rule about citing rule numbers apply to the Rules of the Road chapter only. Later chapters pick their own sources.
- Files: docs/product/DECISIONS.md, docs/product/arcade-regs-check-2026-10-20.md, docs/adr/0001-arcade-game-stack.md
- Then finished the project's check script, which another Claude run had written but could not run. It now runs, skips each check while there is nothing to check yet, and fails once app code exists without the matching setup. Added ten tests for the script and a GitHub check that runs both on every pull request.
- Files: scripts/verify.sh, scripts/verify.test.sh, .github/workflows/verify.yml
- Next: the check script has only been tested against small throwaway projects. The real test comes with the first game code. Et decides when that test is enough to leave stage 0.
- Built the first playable level while Et was driving: docking a six-pack charter boat in a stylized Long Beach harbor, in the browser at /play. It works with a keyboard or four big thumb buttons on a phone held sideways, and it remembers your best time on the device.
- The boat physics give exactly the same result in every browser. Two recorded runs, one that docks and one that hits the shore, must replay the same way every time, and the check script now runs all nine of its checks.
- Files: src/sim/, src/game/, missions/long-beach-docking.json, tests/, e2e/, play/index.html, and the project setup files
- Still open: Et has not played it yet. The harbor is drawn as a simple stylized layout, not traced from the chart, and the handling is a first guess. Et decides both after playing.
