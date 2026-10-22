---
status: proposed
---

# Navigation semantics are shared presentation components

G15 reserves red and green for real navigation lights. G16 requires a visual partner for every horn. Chapter 1 will have Phaser scenes on two routes, so scene-local color and signal code would be easy to misuse.

## Decision

- `src/game/ui/palette.ts` exports interface color tokens. Its type has no red or green token. Gold, electric blue, purple, white and neutral ocean colors cover interface states from G15.
- Navigation-world renderers receive a separate `NavigationColor` type. Only authentic vessel lights and navigation aids may import it. Buttons, chips, hearts, chapter-map nodes, radar and answer feedback use interface tokens.
- `src/game/ui/SignalPulse.ts` renders the visual partner for a sound event. `src/game/sound.ts` and the pulse consume the same frame-based signal event from the simulation.
- A signal event has a stable ID, start frame, end frame and signal kind. The audio layer may start late because of browser scheduling, but it cannot change the graded duration or the pulse.
- Muting audio leaves the pulse and answer grading unchanged. Reduced-motion mode replaces expansion or camera shake with a static high-contrast pulse and text label.
- Shared component tests render every signal kind with sound disabled. A palette test and lint boundary reject red or green interface tokens outside navigation-world art.

These module boundaries are proposed. The color meaning and sound pairing are decided by G15 and G16.

## Considered options

- Rely on review to catch interface red and green. The rule spans every scene, so a typed palette and import boundary are cheaper than repeated manual checks.
- Trigger the pulse from Web Audio callbacks. Muted play and audio scheduling would then change visible behavior.
- Give each level its own horn animation. Timing and accessibility behavior would drift.

## Consequences

- A signal has one timing source and two output adapters, audio and visual.
- Interface feedback cannot accidentally reuse port or starboard colors through the normal typed API. Authentic red and green buoys remain navigation-world art, not interface state.
- Art tests still need image review. Types cannot detect red or green baked into an image asset.
