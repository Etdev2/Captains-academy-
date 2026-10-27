import { describe, expect, it } from 'vitest';
import { LIGHTS, PATTERNS, PAR_MS, shownLights, type PatternId } from '../src/sim/chapter1/lights';
import { answer, currentCard, runStars, startRun, type RapidRun } from '../src/sim/rapid';

// Golden replays for the Lights level (issue #29). The deck, the seed and a
// scripted run of right and wrong taps are all integers and fixed text, so the
// order of the cards, the lights each one shows and the result never drift.
// Change an inline snapshot only when the deck or the Rule 21 sectors change on
// purpose, and say why in the pull request.

const ids = LIGHTS.map((c) => c.id);

/** Plays a script of taps. A wrong tap is any pick but the card's answer; the trace names each step. */
function replay(seed: number, script: string): { trace: string[]; run: RapidRun } {
  let run = startRun(ids, seed);
  const trace: string[] = [];
  for (const tap of script) {
    const id = currentCard(run);
    if (!id) break;
    const right = tap === 'r';
    const { run: next } = answer(run, right);
    trace.push(`${id} ${right ? 'right' : 'miss'} hearts=${next.hearts}`);
    run = next;
  }
  return { trace, run };
}

describe('the seeded Lights order', () => {
  it('pins the shuffle for seed 29', () => {
    expect(startRun(ids, 29).queue).toMatchInlineSnapshot(`
      [
        "rule24:towing-long",
        "rule26:trawling-head-on",
        "rule24:towing-astern",
        "rule24:towing-short",
        "rule26:fishing-port-bow",
        "rule23:power-long",
        "rule23:power-starboard-bow",
        "rule27:nuc-under-way",
        "rule25:sailing-red-over-green",
        "rule25:sailing-head-on",
        "rule27:ram-under-way",
        "rule23:power-port-beam",
        "rule23:power-head-on",
        "rule25:sailing-starboard-beam",
        "rule27:nuc-stopped",
        "rule26:trawling-starboard-beam",
        "rule30:anchor-small",
        "rule27:ram-stopped",
        "rule30:anchor-long",
      ]
    `);
  });

  it('is the same for the same seed and different for another', () => {
    expect(startRun(ids, 29).queue).toEqual(startRun(ids, 29).queue);
    expect(startRun(ids, 29).queue).not.toEqual(startRun(ids, 30).queue);
  });
});

describe('golden runs', () => {
  it('a clean run clears with three stars inside the par time', () => {
    const { trace, run } = replay(29, 'r'.repeat(ids.length));
    expect(run).toMatchObject({ outcome: 'cleared', misses: 0, hearts: 3 });
    expect(runStars(run, PAR_MS, PAR_MS)).toBe(3);
    expect(trace).toMatchInlineSnapshot(`
      [
        "rule24:towing-long right hearts=3",
        "rule26:trawling-head-on right hearts=3",
        "rule24:towing-astern right hearts=3",
        "rule24:towing-short right hearts=3",
        "rule26:fishing-port-bow right hearts=3",
        "rule23:power-long right hearts=3",
        "rule23:power-starboard-bow right hearts=3",
        "rule27:nuc-under-way right hearts=3",
        "rule25:sailing-red-over-green right hearts=3",
        "rule25:sailing-head-on right hearts=3",
        "rule27:ram-under-way right hearts=3",
        "rule23:power-port-beam right hearts=3",
        "rule23:power-head-on right hearts=3",
        "rule25:sailing-starboard-beam right hearts=3",
        "rule27:nuc-stopped right hearts=3",
        "rule26:trawling-starboard-beam right hearts=3",
        "rule30:anchor-small right hearts=3",
        "rule27:ram-stopped right hearts=3",
        "rule30:anchor-long right hearts=3",
      ]
    `);
  });

  it('a miss comes back and the run still clears with two stars', () => {
    const { trace, run } = replay(29, `w${'r'.repeat(ids.length)}`);
    expect(run).toMatchObject({ outcome: 'cleared', misses: 1, hearts: 2 });
    expect(runStars(run, 1000, PAR_MS)).toBe(2);
    expect(trace).toMatchInlineSnapshot(`
      [
        "rule24:towing-long miss hearts=2",
        "rule26:trawling-head-on right hearts=2",
        "rule24:towing-astern right hearts=2",
        "rule24:towing-short right hearts=2",
        "rule24:towing-long right hearts=2",
        "rule26:fishing-port-bow right hearts=2",
        "rule23:power-long right hearts=2",
        "rule23:power-starboard-bow right hearts=2",
        "rule27:nuc-under-way right hearts=2",
        "rule25:sailing-red-over-green right hearts=2",
        "rule25:sailing-head-on right hearts=2",
        "rule27:ram-under-way right hearts=2",
        "rule23:power-port-beam right hearts=2",
        "rule23:power-head-on right hearts=2",
        "rule25:sailing-starboard-beam right hearts=2",
        "rule27:nuc-stopped right hearts=2",
        "rule26:trawling-starboard-beam right hearts=2",
        "rule30:anchor-small right hearts=2",
        "rule27:ram-stopped right hearts=2",
        "rule30:anchor-long right hearts=2",
      ]
    `);
  });

  it('three misses end the run out of hearts with no stars', () => {
    const { trace, run } = replay(29, 'wrw' + 'w');
    expect(run).toMatchObject({ outcome: 'out-of-hearts', hearts: 0, misses: 3 });
    expect(runStars(run, 1000, PAR_MS)).toBe(0);
    expect(trace).toMatchInlineSnapshot(`
      [
        "rule24:towing-long miss hearts=2",
        "rule26:trawling-head-on right hearts=2",
        "rule24:towing-astern miss hearts=1",
        "rule24:towing-short miss hearts=0",
      ]
    `);
  });
});

describe('golden sector edges: the lights Rule 21 shows at each aspect', () => {
  // 320 units is 112.5 degrees, the edge of the masthead and sidelight sectors.
  const aspects = [0, 1, -1, 255, 256, 257, 319, 320, 321, -319, -320, -321, 511, 512, -511];

  const table = (pattern: PatternId): string[] =>
    aspects.map((aspect) => {
      const shown = shownLights({ pattern, aspect })
        .map((l) => l.id)
        .join(',');
      return `${String(aspect).padStart(4)}: ${shown}`;
    });

  it('power-driven: masthead, sidelights and sternlight', () => {
    expect(table('power')).toMatchInlineSnapshot(`
      [
        "   0: masthead,starboard,port",
        "   1: masthead,starboard",
        "  -1: masthead,port",
        " 255: masthead,starboard",
        " 256: masthead,starboard",
        " 257: masthead,starboard",
        " 319: masthead,starboard",
        " 320: stern",
        " 321: stern",
        "-319: masthead,port",
        "-320: stern",
        "-321: stern",
        " 511: stern",
        " 512: stern",
        "-511: stern",
      ]
    `);
  });

  it('sailing: sidelights and sternlight, no masthead light', () => {
    expect(table('sailing')).toMatchInlineSnapshot(`
      [
        "   0: starboard,port",
        "   1: starboard",
        "  -1: port",
        " 255: starboard",
        " 256: starboard",
        " 257: starboard",
        " 319: starboard",
        " 320: stern",
        " 321: stern",
        "-319: port",
        "-320: stern",
        "-321: stern",
        " 511: stern",
        " 512: stern",
        "-511: stern",
      ]
    `);
  });

  it('towing astern: the towing light shares the sternlight sector', () => {
    expect(table('towing-short')).toMatchInlineSnapshot(`
      [
        "   0: masthead-1,masthead-2,starboard,port",
        "   1: masthead-1,masthead-2,starboard",
        "  -1: masthead-1,masthead-2,port",
        " 255: masthead-1,masthead-2,starboard",
        " 256: masthead-1,masthead-2,starboard",
        " 257: masthead-1,masthead-2,starboard",
        " 319: masthead-1,masthead-2,starboard",
        " 320: stern,towing",
        " 321: stern,towing",
        "-319: masthead-1,masthead-2,port",
        "-320: stern,towing",
        "-321: stern,towing",
        " 511: stern,towing",
        " 512: stern,towing",
        "-511: stern,towing",
      ]
    `);
  });

  it('not under command, under way: all-round reds with side and sternlights', () => {
    expect(table('nuc-under-way')).toMatchInlineSnapshot(`
      [
        "   0: nuc-upper,nuc-lower,starboard,port",
        "   1: nuc-upper,nuc-lower,starboard",
        "  -1: nuc-upper,nuc-lower,port",
        " 255: nuc-upper,nuc-lower,starboard",
        " 256: nuc-upper,nuc-lower,starboard",
        " 257: nuc-upper,nuc-lower,starboard",
        " 319: nuc-upper,nuc-lower,starboard",
        " 320: nuc-upper,nuc-lower,stern",
        " 321: nuc-upper,nuc-lower,stern",
        "-319: nuc-upper,nuc-lower,port",
        "-320: nuc-upper,nuc-lower,stern",
        "-321: nuc-upper,nuc-lower,stern",
        " 511: nuc-upper,nuc-lower,stern",
        " 512: nuc-upper,nuc-lower,stern",
        "-511: nuc-upper,nuc-lower,stern",
      ]
    `);
  });

  it('every pattern shows something from every aspect', () => {
    for (const pattern of Object.keys(PATTERNS) as PatternId[]) {
      for (const aspect of aspects) {
        expect(shownLights({ pattern, aspect }).length, `${pattern} at ${aspect}`).toBeGreaterThan(
          0,
        );
      }
    }
  });

  it('shows what each card shows, from the aspect the card is drawn at', () => {
    expect(
      LIGHTS.map(
        (c) =>
          `${c.id} @${c.art.aspect}: ${shownLights(c.art)
            .map((l) => l.id)
            .join(',')}`,
      ),
    ).toMatchInlineSnapshot(`
      [
        "rule23:power-head-on @0: masthead,starboard,port",
        "rule23:power-starboard-bow @128: masthead,starboard",
        "rule23:power-port-beam @-256: masthead,port",
        "rule23:power-long @-128: masthead-fwd,masthead-aft,port",
        "rule24:towing-short @128: masthead-1,masthead-2,starboard",
        "rule24:towing-long @-128: masthead-1,masthead-2,masthead-3,port",
        "rule24:towing-astern @512: stern,towing",
        "rule25:sailing-head-on @0: starboard,port",
        "rule25:sailing-starboard-beam @256: starboard",
        "rule25:sailing-red-over-green @-128: top-red,top-green,port",
        "rule26:trawling-head-on @0: trawl-green,trawl-white,starboard,port",
        "rule26:trawling-starboard-beam @256: trawl-green,trawl-white,starboard",
        "rule26:fishing-port-bow @-128: fish-red,fish-white,port",
        "rule27:nuc-stopped @200: nuc-upper,nuc-lower",
        "rule27:nuc-under-way @0: nuc-upper,nuc-lower,starboard,port",
        "rule27:ram-stopped @-200: ram-upper,ram-middle,ram-lower",
        "rule27:ram-under-way @128: ram-upper,ram-middle,ram-lower,masthead,starboard",
        "rule30:anchor-small @0: anchor",
        "rule30:anchor-long @128: anchor-fwd,anchor-aft",
      ]
    `);
  });
});
