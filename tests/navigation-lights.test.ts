import { describe, expect, it } from 'vitest';
import {
  AFT_EDGE,
  bearingUnits,
  isVisible,
  lateralOffset,
  relativeAspect,
  visibleLights,
  type LightArc,
  type LightSpec,
} from '../src/sim/navigation-lights';
import { HEADING_UNITS } from '../src/sim/trig';

// Rule 21 visibility on integer sectors (ADR 0004, issue #29). Aspect 0 is
// dead ahead of the vessel, 256 her starboard beam, 512 dead astern. The
// sector edges are exact in 1,024 units: 112.5 degrees is 320, 67.5 is 192.

const spec = (arc: LightArc): LightSpec => ({ id: arc, color: 'white', arc });
const masthead = spec('masthead');
const starboard = spec('starboard');
const port = spec('port');
const stern = spec('stern');
const allRound = spec('all-round');
/** Every aspect an observer can have: -511 to 512. */
const aspects = Array.from({ length: HEADING_UNITS }, (_, i) => i - 511);

describe('the Rule 21 sector edges, in whole units', () => {
  it('puts 112.5 degrees at exactly 320 units', () => {
    expect(AFT_EDGE).toBe(320);
    expect((112.5 / 360) * HEADING_UNITS).toBe(320);
    expect((67.5 / 360) * HEADING_UNITS).toBe(192);
    expect(512 - 192).toBe(AFT_EDGE);
  });

  // Inside, on and outside each edge. The aft edge, 320, belongs to the stern sector.
  const table: [string, LightSpec, number, boolean][] = [
    ['masthead at the center', masthead, 0, true],
    ['masthead one unit inside the aft edge', masthead, 319, true],
    ['masthead on the aft edge', masthead, 320, false],
    ['masthead one unit outside the aft edge', masthead, 321, false],
    ['masthead one unit inside the port aft edge', masthead, -319, true],
    ['masthead on the port aft edge', masthead, -320, false],
    ['masthead one unit outside the port aft edge', masthead, -321, false],
    ['starboard sidelight dead ahead', starboard, 0, true],
    ['starboard sidelight one unit across the bow', starboard, -1, false],
    ['starboard sidelight at its center', starboard, 160, true],
    ['starboard sidelight one unit inside the aft edge', starboard, 319, true],
    ['starboard sidelight on the aft edge', starboard, 320, false],
    ['starboard sidelight one unit outside the aft edge', starboard, 321, false],
    ['starboard sidelight on her port side', starboard, -160, false],
    ['port sidelight dead ahead', port, 0, true],
    ['port sidelight one unit across the bow', port, 1, false],
    ['port sidelight at its center', port, -160, true],
    ['port sidelight one unit inside the aft edge', port, -319, true],
    ['port sidelight on the aft edge', port, -320, false],
    ['port sidelight one unit outside the aft edge', port, -321, false],
    ['port sidelight on her starboard side', port, 160, false],
    ['sternlight at the center', stern, 512, true],
    ['sternlight one unit inside the starboard edge', stern, 321, true],
    ['sternlight on the starboard edge', stern, 320, true],
    ['sternlight one unit outside the starboard edge', stern, 319, false],
    ['sternlight on the port edge', stern, -320, true],
    ['sternlight one unit outside the port edge', stern, -319, false],
    ['sternlight at the other astern', stern, -512, true],
    ['all-round light ahead', allRound, 0, true],
    ['all-round light astern', allRound, 512, true],
    ['all-round light on the beam', allRound, -256, true],
  ];
  for (const [name, light, aspect, shown] of table) {
    it(`${name}: aspect ${aspect} is ${shown ? 'seen' : 'hidden'}`, () => {
      expect(isVisible(light, aspect)).toBe(shown);
    });
  }

  it('gives the aft edge to one sector only: a masthead light or a sternlight, never both or neither', () => {
    for (const a of aspects) {
      expect(isVisible(masthead, a) !== isVisible(stern, a), `aspect ${a}`).toBe(true);
    }
  });

  it('shows the sidelights together only at dead ahead, until an overlap is set', () => {
    const both = aspects.filter((a) => isVisible(starboard, a) && isVisible(port, a));
    expect(both).toEqual([0]);
    const withOverlap = aspects.filter((a) => isVisible(starboard, a, 4) && isVisible(port, a, 4));
    expect(withOverlap).toEqual([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
    expect(isVisible(starboard, 321, 4)).toBe(false);
  });

  it('keeps every sector whole: 225, 112.5 and 135 degrees', () => {
    const count = (l: LightSpec): number => aspects.filter((a) => isVisible(l, a)).length;
    expect(count(masthead)).toBe(639); // aspects -319 to 319: 225 degrees without the two aft edges
    expect(count(starboard)).toBe(320); // 0 to 319
    expect(count(port)).toBe(320); // -319 to 0
    expect(count(stern)).toBe(385); // 320 to 512 and -511 to -320: 135 degrees with both edges
    expect(count(allRound)).toBe(HEADING_UNITS);
  });
});

describe('port and starboard mirror each other', () => {
  it('shows the port sidelight at an aspect exactly when the starboard one shows at its mirror', () => {
    for (const a of aspects) {
      const mirrored = relativeAspect(0, -a);
      expect(isVisible(port, a), `aspect ${a}`).toBe(isVisible(starboard, mirrored));
      expect(isVisible(masthead, a), `aspect ${a}`).toBe(isVisible(masthead, mirrored));
      expect(isVisible(stern, a), `aspect ${a}`).toBe(isVisible(stern, mirrored));
    }
  });
});

describe('heading and bearing', () => {
  it('turns a heading and a bearing into a signed half-turn', () => {
    expect(relativeAspect(0, 0)).toBe(0);
    expect(relativeAspect(0, 256)).toBe(256);
    expect(relativeAspect(0, 768)).toBe(-256);
    expect(relativeAspect(0, 512)).toBe(512);
    expect(relativeAspect(512, 0)).toBe(512);
    expect(relativeAspect(0, 513)).toBe(-511);
  });

  it('wraps around north', () => {
    expect(relativeAspect(1000, 100)).toBe(124);
    expect(relativeAspect(100, 1000)).toBe(-124);
    expect(relativeAspect(1023, 0)).toBe(1);
    expect(relativeAspect(-24, 100)).toBe(124);
    expect(relativeAspect(2048 + 5, 5)).toBe(0);
  });

  it('does not change when both the heading and the bearing turn together', () => {
    for (const turn of [0, 1, 77, 256, 511, 512, 1023, -300]) {
      for (const a of [-511, -320, -1, 0, 1, 320, 512]) {
        expect(relativeAspect(300 + turn, 300 + a + turn)).toBe(a);
      }
    }
  });

  it('lists the visible lights in the order given, with the aspect it found', () => {
    const lights = [masthead, starboard, port, stern];
    expect(visibleLights(lights, 0, 0)).toEqual({
      aspect: 0,
      visible: ['masthead', 'starboard', 'port'],
    });
    expect(visibleLights(lights, 100, 100 + 512)).toEqual({ aspect: 512, visible: ['stern'] });
    expect(visibleLights(lights, 1000, 100)).toEqual({
      aspect: 124,
      visible: ['masthead', 'starboard'],
    });
  });

  it('shows nothing from an empty list of lights', () => {
    expect(visibleLights([], 0, 100)).toEqual({ aspect: 100, visible: [] });
  });

  it('finds the integer bearing from a position offset', () => {
    expect(bearingUnits(0, 1)).toBe(0);
    expect(bearingUnits(1, 0)).toBe(256);
    expect(bearingUnits(0, -1)).toBe(512);
    expect(bearingUnits(-1, 0)).toBe(768);
    expect(bearingUnits(1, 1)).toBe(128);
    expect(bearingUnits(-5, 5)).toBe(896);
    expect(bearingUnits(0, 0)).toBe(0);
    expect(() => bearingUnits(0.5, 1)).toThrow(RangeError);
  });
});

describe('where a light sits across the view', () => {
  it('puts her starboard side on the observer left when she heads toward the observer', () => {
    expect(lateralOffset(2, 0, 0)).toBe(-2);
    expect(lateralOffset(-2, 0, 0)).toBe(2);
  });

  it('flips from the stern, and shows only depth side-on', () => {
    expect(lateralOffset(2, 0, 512)).toBe(2);
    expect(lateralOffset(2, 0, 256)).toBe(0);
    expect(lateralOffset(0, 4, 256)).toBe(4);
    expect(lateralOffset(0, 4, 0)).toBe(0);
  });
});
