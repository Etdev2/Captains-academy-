# Captain's Academy

The words the team uses for the academy's product and its design review. Each term has one name. The words under _Avoid_ mean the same thing and should not be used.

## Design review

**Decision Desk**:
The page at `/prototypes/` where the team dot-votes on prototype concepts and the decider picks one.
_Avoid_: decision board, gallery, rating page

**Hill climb**:
A bounded run of steps that improves one live prototype variant. Each step proposes candidates, rejects any that fail the gate, and keeps a candidate only if it beats the best climb score so far.
_Avoid_: auto-improve, optimization run, iteration loop

**Gate**:
The pass/fail checks a hill-climb candidate must pass before it gets a climb score. Today the gate is two checks: every control is at least 44 by 44 pixels, and text meets WCAG AA contrast.
_Avoid_: filter, threshold

**Climb score**:
The number of taps needed to finish a category's main task. Fewer taps is better, and the median seconds over three runs breaks ties.
_Avoid_: fitness, rating, grade

**Main task**:
The one fixed task per product category that the climb score measures, such as checking in to a sea-time entry in the Sea-Time Logbook.
_Avoid_: user journey, flow, happy path

**Climbed variant**:
The best result of a hill climb. It goes on the Decision Desk as a new concept marked with the A, B or C variant it was climbed from. It is design input for dot voting and does not replace that variant.
_Avoid_: variant D, winner, improved variant
