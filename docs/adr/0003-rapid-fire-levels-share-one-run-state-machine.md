---
status: proposed
---

# Rapid-fire levels share one run state machine

Branch #47 adds `src/sim/rapid.ts` for shuffle order, hearts, combos, missed-item return and stars. Levels 2 to 5 use different pictures and controls, but they use the same run rules from G11 and G12.

## Decision

- Keep `src/sim/rapid.ts` as the only rapid-fire run state machine. It receives situation IDs and evaluated right or wrong results. It does not know about Phaser, art, buttons, flicks or audio.
- Keep the existing queue, scoring, three hearts, missed-item return and star calculation. Rename card-specific terms to situation terms when #47 integrates, without changing behavior.
- Add a schema version to rapid-run state and replay input. Add a state hash and golden replay runner before level 2. The fixed seed and ordered input frames must reproduce the same queue, score, hearts and outcome.
- Each level supplies an adapter that renders a parsed deck item and turns an interaction into an evaluated result. Lights and day shapes use choice adapters. Rule 18 uses a two-vessel flick adapter.
- Horn signals add a pure frame-based hold evaluator. Press and release frames produce blast durations and gaps. That evaluator returns right or wrong to the shared run state machine. Web Audio follows the result but never measures the answer.
- Scene flow, miss replay and input controls move out of the Definitions scene into shared rapid-fire scene code before level 2 copies them.

This module reuse is proposed. Portrait play, one-thumb input, three hearts, miss return and stars are already decided by G8, G11 and G12.

## Considered options

- Copy `rapid.ts` per level. That would create five scoring and retry implementations.
- Put horn timing into `rapid.ts`. Most rapid levels have no timed hold, so that would mix one level's input rules with the shared run rules.
- Let Web Audio timestamps grade horn duration. Audio clocks are outside deterministic simulation and cannot produce portable replays.

## Consequences

- The state machine from #47 generalizes to levels 2, 3 and 5 after naming and replay changes. Its scoring core does not need a rewrite.
- Level 4 reuses the run state machine but needs the hold evaluator and a blast-pattern input adapter.
- A level can change its drawing or controls without changing scoring. A scoring change updates one state machine and its golden replays.
- Integration should refactor the Definitions scene before another rapid-fire scene is added. This costs one extraction and avoids four later extractions.
