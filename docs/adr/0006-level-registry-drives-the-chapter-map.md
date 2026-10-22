---
status: proposed
---

# A level registry drives the chapter map and unlocks

The app has `/play` for landscape steering and `/rules` for the Definitions rapid-fire level. Main currently hard-codes the `/play` level array, and branch #47 creates a separate Definitions entry point. Adding level buttons, stars and unlock checks independently to both routes would create two chapter maps.

## Decision

- `src/game/levelRegistry.ts` is the chapter catalog. Each entry has a stable level ID, chapter ID, order, title, mode, route, content or mission ID, supported rule sets and star policy.
- Chapter 1 uses these IDs in this order: `ch1-definitions`, `ch1-lights`, `ch1-day-shapes`, `ch1-horn-signals`, `ch1-rule-18`, `ch1-steady-bearing`, `ch1-give-way`, `ch1-fog-narrow-channels` and `ch1-boss`.
- Rapid-fire levels use `/rules`. Steering levels use `/play`. The boss route stays unresolved until Et decides the boss question. No new route is needed for levels 1 to 8.
- The chapter map reads registry entries and progress. A level opens when the previous level has at least one star (G12). The boss opens only when levels 1 to 8 each have at least two stars (G12).
- Each scene receives its registry entry and parsed content or mission. It does not calculate its own unlock rule.
- Every play screen renders the entry's rule-set chip. `both`, `inland` and `international` are data values from the content model, not free-form labels.
- Adding a level means adding its parsed content or mission, its scene adapter, one registry entry, tests and a verification-skill feature. A registry integrity test rejects duplicate IDs or order, a missing route adapter, a missing deck or mission, and an impossible boss prerequisite.

This registry and route assignment are proposed. The order, orientation, rule-set chip, star threshold and unlock rules are decided by G6, G7, G8 and G12.

## Considered options

- Give every level a URL. This adds routing work without a settled need for deep links.
- Let each route own its level list. The chapter map and unlock rules would have to merge two sources.
- Encode unlocks as arbitrary callbacks. Chapter 1 has two settled rules, so typed policies are smaller and easier to test.

## Consequences

- `/play` and `/rules` remain stable while the chapter grows.
- Stars use stable level IDs rather than scene or mission names. Existing docking progress keeps its current mission keys until a separate migration is needed.
- The boss entry can stay unavailable without choosing between the G10 exam and Night Harbor Run.
