---
status: proposed
---

# Rule 21 visibility uses integer sectors in one pure module

The Lights level, Night Harbor Run and the flashcards must agree on which navigation lights an observer can see. The prototype uses floating-point degree comparisons and lets several lights own the same aft boundary. The regulation check says to choose and test one boundary convention before a port.

## Decision

- `src/sim/navigation-lights.ts` is the sole Rule 21 visibility module. It imports no Phaser, DOM or audio code.
- Inputs are a vessel heading, observer bearing and a list of light specifications. Headings and bearings use the existing 1,024 units per turn from `src/sim/trig.ts`. A caller with positions uses the module's integer bearing helper before asking for visibility.
- The module normalizes relative aspect to a signed integer half-turn. Rule 21 boundaries are exact in this representation: 112.5 degrees is 320 units and 67.5 degrees is 192 units.
- Sector tests use integer comparisons. They do not use `atan2`, floating-point epsilon values or rounded degree strings.
- Sectors are half-open where an aft boundary meets another sector. The aft sector owns exactly 112.5 degrees, so one input has one documented result. The masthead and sidelight sectors exclude that aft endpoint; the stern or towing sector includes it. Both sidelights may show at or close to dead ahead when the configured forward cutoff allows it.
- The nominal Rule 21 sectors and any Annex I forward cutoff are separate inputs. `uscg-regs` must check the cutoff and exact endpoint convention before this ADR can become accepted.
- Outputs are the normalized aspect and stable IDs of visible lights. Renderers choose placement and brightness, but they cannot override visibility.

This shared module and endpoint convention are proposed. Pure deterministic simulation is decided by G1 and ADR 0001. Real navigation-light colors are decided in the Flashcards section and G15.

## Tests and replays

- Table tests cover every light at its center, one unit inside each edge, exactly on each edge and one unit outside.
- Tests cover heading wraparound, port and starboard mirroring, rotational invariance, all-round lights and an empty light list.
- Content tests pass fixed flashcard aspects through the same function.
- The Lights level golden replay crosses each sector edge in both directions and pins visible light IDs by frame.
- Night Harbor Run golden replays pin the head-on, starboard-crossing and overtaking gates named in issue #45.
- A replay update requires the repository's explicit replay-update flag. A sector change cannot pass as an art-only change.

## Considered options

- Compare JavaScript degree values with an epsilon. Different call sites would choose different epsilon values and boundary ownership.
- Let each renderer decide visibility. The three products would drift and flashcards could teach a pattern that the game does not draw.
- Use continuous trigonometry in replay-sensitive code. ADR 0001 excludes that approach where results must match.

## Consequences

- Rule 21 changes in one place. Flashcards and both games can use different art while sharing visibility.
- The input bearing is quantized to about 0.35 degrees. That is finer than the game's visual resolution and keeps every sector boundary deterministic.
- The regulation check remains a release gate. The current 2026-10-22 check could not read the primary rule text and is not sign-off.
