---
status: proposed
---

# Steering levels compose deterministic course systems

Branch #46 adds gates, fixed-track traffic and collision state to the docking simulation. The three shared steering lessons need the same helm and traffic, plus bearing observations, encounter grading, radar and fog signals. Adding those concerns directly to `HarborScene` would bind the lesson to one renderer and make headless replay checks incomplete.

Et settled the product choices that constrain this proposal on 2026-10-22 from 7:11 to 7:17 AM PT, recorded in [PR #50's decision comment](https://github.com/Etdev2/Captains-academy-/pull/50#issuecomment-6343017518). Level 9, fog, traffic separation schemes and narrow channels, includes Rule 10 with Rules 9 and 19 (Et's decision calls it level 8, from the earlier G7 list without the first mixed-review stop), #46 becomes checked, split build pull requests before #47, and Night Harbor Run is a later level after the boss. The simulation composition remains proposed.

## Decision

- Reuse #46's mission gates, fixed-track traffic, integer hull contacts, course progress and twin-lever helm after `uscg-regs` checks its lessons and the branch is split into small pull requests.
- Keep lesson state in pure `src/sim` modules. The renderer reads state and emits versioned frame inputs. It does not decide whether a bearing is steady, which vessel gives way, or whether a fog maneuver is correct.
- Level 7 adds a bearing log. It samples quantized relative bearing on declared frames and reports whether bearing change stays within a mission tolerance while range closes.
- Level 8 adds encounter objectives to traffic. Each objective names the vessels, applicable rule-set content, expected give-way or stand-on role and a success region. Traffic paths remain deterministic.
- Level 9 adds radar contacts and scheduled sound signals for Rules 9, 10 and 19. Fog can hide world art, but it does not remove contacts or the visual pulse paired with each signal. Narrow-channel and traffic-separation boundaries and gates stay mission geometry.
- Each subsystem has versioned serializable state and contributes to the replay hash. No subsystem reads wall-clock time, Web Audio time or Phaser state.
- Reuse comes before adding code. If a #46 field already represents the needed state, extend its schema. Add a module only when its state and tests are independent of course progress.

This composition is proposed. Pure deterministic simulation and golden replays are decided by G1 and ADR 0001. Landscape steering is decided by G8. Sound's visual partner is decided by G16.

## Golden replays

- Level 7 has one replay that detects a constant bearing and acts in time, and one that holds course until the miss threshold.
- Level 8 has a correct replay for overtaking, head-on and crossing encounters, plus one canonical wrong action for each role.
- Level 9 has a narrow-channel success, a radar-only fog success and a replay that turns the wrong way or keeps unsafe speed after the signal.
- Replays pin the trace hash, final stars, encounter outcomes, bearing samples, radar contacts and emitted signal events.

## Considered options

- Script outcomes in Phaser scenes. Headless tests could not prove the teaching rule.
- Build three separate steering simulations. Boat handling, traffic and collision behavior would diverge.
- Add reactive traffic first. Fixed paths are enough for controlled teaching and are cheaper to replay. Reactive vessels need a later requirement and ADR.

## Consequences

- #46 is a base for the shared steering lessons, not a complete Rules of the Road engine.
- Night Harbor Run later composes the same checked systems after the boss. It does not become a prerequisite for the boss or later chapters.
- Bearing, radar and sound state can be unit-tested without rendering.
- Mission schemas grow only for behavior that level data must select. Regulation content stays in the Chapter 1 content files from ADR 0002.
