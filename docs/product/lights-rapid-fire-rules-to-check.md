# Lights rapid-fire: rules waiting for `uscg-regs`

Chapter 1, level 2 (`missions/chapter-1-lights-rapid-fire.json`) is the first set of navigation-light situations. The builder picked them from Rules 20 to 31 of the Navigation Rules from memory. **None is checked yet.** DECISIONS.md G10 and the project rules say a rule appears in the app only after `uscg-regs` checks it against the current text, so this list is the work order for that check.

Each row names the rule set the level shows for it. "Same" means the builder believes the Inland and International rules read the same; `uscg-regs` should confirm that too. Inland citations read `33 CFR 83.<rule>`, International ones `COLREGS Rule <rule>`.

| Situation | Lights shown | Rule cited | Rule set shown | Inland vs International |
| --- | --- | --- | --- | --- |
| `power-head-on` | white masthead, red and green sidelights | 23(a) | Inland | Same |
| `sailing-head-on` | red and green sidelights, no masthead | 25(a) | International | Same |
| `power-port` | white masthead, red sidelight | 23(a) | International | Same |
| `trawling` | all-round green over all-round white | 26(b) | Inland | Same |
| `power-starboard` | white masthead, green sidelight | 23(a) | Inland | Same |
| `nuc` | two all-round reds | 27(a) | International | Same |
| `astern` | one white sternlight | 21(c) | Inland | Same |
| `pilot` | all-round white over all-round red | 29(a) | International | Same |
| `fishing-other` | all-round red over all-round white | 26(c) | Inland | Same |
| `anchored-one` | one all-round white | 30(b) | International | Same |
| `sailing-red-over-green` | all-round red over green, with sidelights | 25(c) | Inland | Same |
| `rram` | all-round red, white, red | 27(b) | International | Same |
| `power-50m-astern` | two masthead lights, rear one higher, and a sternlight | 23(a) | Inland | Same |
| `anchored-two` | two all-round whites, forward one higher | 30(a) | International | Same |
| `towing-astern` | two masthead lights, yellow towing light over the sternlight | 24(a) | Inland | Same |
| `aground` | two all-round reds over the anchor lights | 30(d) | International | Same |
| `constrained-by-draft` | three all-round reds | 28 | International | **Differs.** The builder believes the Inland Rules reserve Rule 28 and have no such signal |

## Open questions for `uscg-regs`

- Paragraph letters: every paragraph in the table is from memory.
- Whether two vertical masthead lights on a vessel towing (24(a)) and on a power-driven vessel of 50 m or more (23(a)) look the same from astern except for the yellow towing light, as the level assumes.
- Whether the Inland Rules differ from the International Rules in any other light signal the level shows. The level flags only Rule 28.
- Whether more Inland-only differences belong in this level (for example towing and pushing signals) or in the later "differences" levels from G7.
- How much of the rule number the level may show before the player answers. It now shows the rule set before the answer and the rule citation right after it, so the citation does not give the answer away (retrieval practice, G20).

## What this level does not use

No NMC exam value from MCP-MA-NMC2-08(01) is used. If one is added later, label it unverified in code and docs (G10a).
