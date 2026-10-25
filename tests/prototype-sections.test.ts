import { describe, expect, it } from 'vitest';
import { concepts } from '../src/prototypes/round';
import {
  byShape,
  layout,
  order,
  sections,
  shapeOf,
  tileIds,
  tileLabel,
  twinOf,
} from '../src/prototypes/sections';

// The decision board groups its concepts by screen (issue #72). Every concept
// on the board must sit in exactly one place, so none goes missing and none is
// shown twice, and every tile must carry a label of its own.

describe('the decision board sections', () => {
  it('places every concept once: as a tile, or as the twin of one', () => {
    const tiles = tileIds();
    const twins = sections.flatMap((s) => s.asBuilt.flatMap((a) => (a.twin ? [a.twin] : [])));
    const placed = [...tiles, ...twins];
    expect(new Set(placed).size).toBe(placed.length);
    expect([...placed].sort()).toEqual(concepts.map((c) => c.id).sort());
  });

  it('groups by screen in the agreed order', () => {
    expect(sections.map((s) => s.title)).toEqual([
      'Home',
      'Definitions',
      'Lights',
      'Night Harbor',
      'Docking',
    ]);
  });

  it('puts only current-app screenshots in the as-built rows, and every one of them there', () => {
    const asBuilt = new Set(sections.flatMap((s) => s.asBuilt.map((a) => a.id)));
    for (const c of concepts) {
      if (asBuilt.has(c.id)) expect(c.kind, c.id).toBe('app-screenshot');
      else if (twinOf(c.id) === undefined) expect(c.kind, c.id).toBe('concept');
    }
  });

  it('pairs each phone capture of the Definitions screen with its desktop twin', () => {
    const phone = concepts.find((c) => c.id === 'app-definitions-phone-390-2-correct');
    const desk = concepts.find((c) => c.id === 'app-definitions-desktop-wide-2-correct');
    expect(phone && twinOf(phone.id)?.id).toBe(desk?.id);
    expect(desk && twinOf(desk.id)?.id).toBe(phone?.id);
    expect(phone?.title).toBe(desk?.title);
  });

  it('labels every tile, and no two tiles in a section alike', () => {
    for (const s of layout(() => true)) {
      const labels = order([s]).map(tileLabel);
      for (const l of labels) expect(l.trim().length, s.section.id).toBeGreaterThan(1);
      expect(new Set(labels).size, s.section.id).toBe(labels.length);
    }
  });

  it('keeps the level number on the Chapter 1 mockups', () => {
    const fog = concepts.find((c) => c.id === 'cl-mock-ch1-08-fog');
    expect(fog && tileLabel(fog)).toBe('8 · Fog');
  });

  it('gives each shape its own grid, in first-seen order', () => {
    const night = layout(() => true).find((s) => s.section.id === 'night-harbor');
    const levels = night?.groups[0];
    expect(levels?.buckets.map((b) => b.shape)).toEqual(['portrait', 'landscape']);
    for (const g of night?.groups ?? [])
      for (const b of g.buckets) for (const i of b.items) expect(shapeOf(i)).toBe(b.shape);
    expect(byShape([]).length).toBe(0);
  });

  it('drops empty sections when a filter leaves nothing in them', () => {
    const onlyHome = layout((i) => i.feature === 'Home');
    expect(onlyHome.map((s) => s.section.id)).toEqual(['home']);
    expect(onlyHome[0]?.count).toBe(6);
  });
});
