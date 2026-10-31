import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { climbShotOf, interactiveHref, shotOf, variantShots } from '../src/prototypes/categories';
import {
  fillHillClimb,
  hillClimbBody,
  hillClimbFill,
  HILL_CLIMB_PROMPT_ID,
  showsHillClimb,
} from '../src/prototypes/hillClimb';
import { parseInventory, type Item } from '../src/prototypes/inventory';
import {
  climbedFromLabel,
  conceptId,
  deskHref,
  liveHref,
  parseClimb,
  parseConceptId,
} from '../src/prototypes/live/shared/routes';
import { categoryIds, variantIds } from '../src/prototypes/live/shared/types';
import { phases } from '../src/prototypes/board';
import { tileLabel } from '../src/prototypes/sections';

// The Hill climb (docs/prototypes/hill-climb.md): climbed-variant routes and
// concept ids, the button's rule and fill, and the task path files the scoring
// script replays. A/B/C URLs and ids are shared links and saved feedback keys,
// so they must stay exactly as they were.

describe('climbed-variant routes and concept ids', () => {
  it('leaves every A/B/C URL and concept id exactly as before', () => {
    for (const c of categoryIds) {
      for (const v of variantIds) {
        expect(liveHref(c, v)).toBe(`/prototypes/live/?category=${c}&variant=${v}`);
        expect(liveHref(c, v, 'review')).toBe(
          `/prototypes/live/?category=${c}&variant=${v}&screen=review`,
        );
        expect(liveHref(c, v, undefined, undefined)).toBe(liveHref(c, v));
        expect(conceptId(c, v)).toBe(`cl-live-${c}-${v}-desktop`);
        expect(conceptId(c, v, 'iphone')).toBe(`cl-live-${c}-${v}-iphone`);
        expect(conceptId(c, v, 'desktop', undefined)).toBe(conceptId(c, v));
        expect(deskHref(c, v)).toBe(`/prototypes/?concept=cl-live-${c}-${v}-desktop`);
      }
    }
    expect(variantShots.map((s) => s.href)).toEqual(
      categoryIds.flatMap((c) =>
        variantIds.map((v) => `/prototypes/live/?category=${c}&variant=${v}`),
      ),
    );
  });

  it('adds climb after variant in the URL, and its own concept id', () => {
    expect(liveHref('sea-time', 'b', undefined, 2)).toBe(
      '/prototypes/live/?category=sea-time&variant=b&climb=2',
    );
    expect(liveHref('license', 'c', 'missing', 1)).toBe(
      '/prototypes/live/?category=license&variant=c&climb=1&screen=missing',
    );
    expect(conceptId('sea-time', 'b', 'desktop', 2)).toBe('cl-climb-sea-time-b-2-desktop');
    expect(conceptId('sea-time', 'b', 'iphone', 2)).toBe('cl-climb-sea-time-b-2-iphone');
    expect(deskHref('arcade', 'a', 3)).toBe('/prototypes/?concept=cl-climb-arcade-a-3-desktop');
  });

  it('reads a climb number of 1 to 99 and nothing else', () => {
    expect(parseClimb('1')).toBe(1);
    expect(parseClimb('99')).toBe(99);
    for (const bad of [null, '', '0', '01', '100', '-1', '1.5', 'a', ' 1']) {
      expect(parseClimb(bad), String(bad)).toBeUndefined();
    }
  });

  it('reads back every concept id it writes, and no other', () => {
    for (const c of categoryIds) {
      for (const v of variantIds) {
        for (const device of ['desktop', 'iphone'] as const) {
          expect(parseConceptId(conceptId(c, v, device))).toEqual({
            category: c,
            variant: v,
            device,
          });
          expect(parseConceptId(conceptId(c, v, device, 7))).toEqual({
            category: c,
            variant: v,
            device,
            climb: 7,
          });
        }
      }
    }
    for (const bad of [
      'cl-live-sea-time-b-2-desktop',
      'cl-climb-sea-time-b-desktop',
      'cl-climb-boats-b-1-desktop',
      'cl-climb-study-d-1-desktop',
      'cl-climb-study-a-0-desktop',
      'cl-climb-study-a-1-tablet',
      'gpt-home-chart-house',
    ]) {
      expect(parseConceptId(bad), bad).toBeUndefined();
    }
  });

  it('labels a climbed variant with the variant it was climbed from', () => {
    expect(climbedFromLabel('b')).toBe('climbed from B');
    const shot = climbShotOf('cl-climb-sea-time-b-2-iphone');
    expect(shot).toEqual({
      category: 'sea-time',
      variant: 'b',
      climb: 2,
      climbedFrom: 'climbed from B',
      href: '/prototypes/live/?category=sea-time&variant=b&climb=2',
    });
    // A climbed variant is never mistaken for the A/B/C variant it came from.
    expect(shotOf('cl-climb-sea-time-b-2-iphone')).toBeUndefined();
    expect(climbShotOf('cl-live-sea-time-b-iphone')).toBeUndefined();
  });

  it('gives a climbed screenshot its own tile label and interactive link', () => {
    const item = {
      id: 'cl-climb-study-c-1-desktop',
      title: 'Study & Exam Prep, C climb 1',
    } as Item;
    expect(tileLabel(item)).toBe('Climb 1 · climbed from C');
    expect(interactiveHref(item)).toBe('/prototypes/live/?category=study&variant=c&climb=1');
  });
});

describe('climbed variants in the inventory', () => {
  const base = JSON.parse(readFileSync('docs/prototypes/inventory.json', 'utf8')) as {
    items: Record<string, unknown>[];
  };
  const live = base.items.find((i) => i.id === 'cl-live-sea-time-b-desktop');
  if (!live) throw new Error('cl-live-sea-time-b-desktop is missing');
  const climbed = {
    ...live,
    id: 'cl-climb-sea-time-b-1-desktop',
    title: 'Sea-Time Logbook, B climb 1, climbed from B',
    interactive: '/prototypes/live/?category=sea-time&variant=b&climb=1',
    climbedFrom: 'B',
  };

  it('accepts a climbed variant with its climbedFrom and climb URL', () => {
    expect(() => parseInventory({ ...base, items: [...base.items, climbed] })).not.toThrow();
  });

  it('requires climbedFrom on a climbed variant and refuses it anywhere else', () => {
    const noFrom: Record<string, unknown> = { ...climbed };
    delete noFrom.climbedFrom;
    expect(() => parseInventory({ ...base, items: [...base.items, noFrom] })).toThrow(
      /climbedFrom/,
    );
    const liveWithFrom = { ...live, climbedFrom: 'B' };
    const items = base.items.map((i) => (i.id === live.id ? liveWithFrom : i));
    expect(() => parseInventory({ ...base, items })).toThrow(/climbedFrom/);
  });
});

describe('the Hill climb button', () => {
  const prompts = JSON.parse(readFileSync('public/collaborate/prompts.json', 'utf8')) as {
    prompts: Record<string, string>[];
  };

  it('shows on live-variant concepts in the discuss and decide steps only', () => {
    const shown = phases.filter((p) => showsHillClimb(p, 'cl-live-arcade-c-iphone'));
    expect(shown).toEqual(['discuss', 'decide']);
    for (const p of phases) {
      expect(showsHillClimb(p, 'gpt-home-chart-house')).toBe(false);
    }
  });

  it('has a hill-climb prompt with the existing fields and every placeholder', () => {
    const entry = prompts.prompts.find((p) => p.id === HILL_CLIMB_PROMPT_ID);
    expect(Object.keys(entry ?? {}).sort()).toEqual(
      ['body', 'category', 'description', 'duration', 'id', 'title'].sort(),
    );
    const body = hillClimbBody(prompts);
    for (const p of ['{{category}}', '{{variant}}', '{{conceptId}}']) expect(body).toContain(p);
  });

  it('fills every placeholder for a live variant', () => {
    const fill = hillClimbFill('cl-live-license-a-iphone');
    expect(fill).toEqual({
      category: 'license',
      variant: 'a',
      conceptId: 'cl-live-license-a-iphone',
    });
    if (!fill) return;
    const text = fillHillClimb(hillClimbBody(prompts), fill);
    expect(text).not.toContain('{{');
    expect(text).toContain('Category: license. Variant: a. Concept: cl-live-license-a-iphone.');
    expect(text).toContain('as cl-climb-license-a-<n>-desktop and -iphone');
    expect(hillClimbFill('gpt-home-chart-house')).toBeUndefined();
  });
});

describe('task paths for the scoring script', () => {
  const roles = ['button', 'link', 'radio', 'checkbox', 'tab', 'switch', 'menuitem', 'option'];

  it('has one task path per A/B/C variant, next to its code, naming each tap by role and name', () => {
    for (const c of categoryIds) {
      for (const v of variantIds) {
        const file = `src/prototypes/live/${c}/${v}.path.json`;
        const path = JSON.parse(readFileSync(file, 'utf8')) as {
          category: string;
          variant: string;
          taps: { role: string; name: string }[];
        };
        expect(path.category, file).toBe(c);
        expect(path.variant, file).toBe(v);
        expect(path.taps.length, file).toBeGreaterThan(0);
        for (const t of path.taps) {
          expect(roles, file).toContain(t.role);
          expect(t.name.length, file).toBeGreaterThan(0);
        }
      }
    }
  });

  it('keeps an end state in the script for every category', () => {
    const script = readFileSync('scripts/hill-climb-score.mjs', 'utf8');
    for (const c of categoryIds) expect(script).toMatch(new RegExp(`^  '?${c}'?: \\{$`, 'm'));
  });
});
