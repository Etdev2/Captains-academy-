---
status: proposed
---

# A level registry drives the chapter map and unlocks

The app has `/play` for landscape steering and `/rules` for the Definitions rapid-fire level. Main currently hard-codes the `/play` level array, and branch #47 creates a separate Definitions entry point. Adding level buttons, stars and unlock checks independently to both routes would create two chapter maps.

Et settled the product choices that constrain this proposal on 2026-10-22 from 7:11 to 7:17 AM PT, recorded in [PR #50's decision comment](https://github.com/Etdev2/Captains-academy-/pull/50#issuecomment-6343017518). Rule-set differences use separate levels, mixed-review stops follow level 5 and the difference levels, the timed exam remains the boss, Night Harbor Run follows it later, and beating the boss with unlimited retries unlocks later chapters. The registry module and entry shape remain proposed.

## Decision

- `src/game/levelRegistry.ts` is the chapter catalog. Each entry has a stable level ID, chapter ID, order, title, mode, route, content or mission ID, supported rule sets and star policy.
- An active registry entry requires a route and content or mission adapter.
- Chapter 1 uses these IDs in order: `ch1-definitions`, `ch1-lights`, `ch1-day-shapes`, `ch1-horn-signals`, `ch1-rule-18`, `ch1-review-one`, `ch1-steady-bearing`, `ch1-give-way`, `ch1-fog-narrow-channels`, `ch1-inland-differences`, `ch1-international-differences`, `ch1-review-two`, `ch1-boss`, then `ch1-night-harbor-run`.
- Rapid-fire, rule-set difference and mixed-review levels use `/rules`. Steering levels and Night Harbor Run use `/play`. The timed multiple-choice boss uses `/rules`.
- The chapter map reads registry entries and progress. A pre-boss entry opens when the previous entry has at least one star (G12). The boss opens only when every earlier Chapter 1 entry has at least two stars. Night Harbor Run opens after the boss is beaten.
- The boss permits unlimited retries. Beating it unlocks the later chapters. Night Harbor Run is not a condition for those chapter unlocks.
- Chapter 1 adapters report cleared state, semantic misses, elapsed frames and par frames. One Chapter 1 star policy gives three stars for no misses inside par, two for one miss and one for any clear. The docking prototype keeps its separate bump policy.
- Each scene receives its registry entry and parsed content or mission. It does not calculate its own unlock rule.
- Every play screen renders the entry's rule-set chip. `both`, `inland` and `international` are data values from the content model, not free-form labels.
- Adding a level means adding its parsed content or mission, its scene adapter, one registry entry, tests and a verification-skill feature. A registry integrity test rejects duplicate IDs or order, an unresolved entry, a boss that omits a pre-boss prerequisite, or a later chapter that unlocks before the Chapter 1 boss.

This registry and route assignment are proposed. The order, orientation, rule-set chip, star threshold and unlock rules are decided by G6, G7, G8 and G12.

## Considered options

- Give every level a URL. This adds routing work without a settled need for deep links.
- Let each route own its level list. The chapter map and unlock rules would have to merge two sources.
- Encode unlocks as arbitrary callbacks. Chapter 1 has two settled rules, so typed policies are smaller and easier to test.

## Consequences

- `/play` and `/rules` remain stable while the chapter grows.
- Stars use stable level IDs rather than scene or mission names. Existing docking progress keeps its current mission keys until a separate migration is needed.
- The boss is an active exam-format entry. Night Harbor Run is a separate later entry and cannot replace its completion requirement.
- The two mixed-review entries use checked situations from preceding levels and the same star and mastery rules.
