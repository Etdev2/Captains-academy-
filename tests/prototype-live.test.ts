import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ASSET_ID, assetRow } from '../src/prototypes/catalog';
import { shotOf, siblingsOf, variantShots } from '../src/prototypes/categories';
import {
  categories,
  conceptId,
  deskHref,
  liveHref,
  variants,
} from '../src/prototypes/live/shared/routes';
import * as sample from '../src/prototypes/live/shared/sample';
import { categoryIds, variantIds } from '../src/prototypes/live/shared/types';
import { byId, concepts } from '../src/prototypes/round';
import { categoryOf } from '../src/prototypes/sections';

// The interactive prototypes at /prototypes/live and their place on the
// Decision Desk. Their URLs and concept ids are shared links and saved
// feedback keys, so they must never drift.

describe('interactive prototype links', () => {
  it('has five categories, each in variants A, B and C', () => {
    expect(categories.map((c) => c.id)).toEqual([...categoryIds]);
    expect(variants.map((v) => `${v.letter} ${v.name}`)).toEqual([
      'A Night Bridge',
      'B Clean & Light',
      'C Guided Mentor',
    ]);
    expect(variantShots).toHaveLength(15);
  });

  it('gives every variant a stable URL and concept id', () => {
    expect(liveHref('sea-time', 'b')).toBe('/prototypes/live/?category=sea-time&variant=b');
    expect(liveHref('license', 'c', 'review')).toBe(
      '/prototypes/live/?category=license&variant=c&screen=review',
    );
    expect(conceptId('console', 'a')).toBe('cl-live-console-a-desktop');
    expect(conceptId('console', 'a', 'iphone')).toBe('cl-live-console-a-iphone');
    expect(deskHref('arcade', 'c')).toBe('/prototypes/?concept=cl-live-arcade-c-desktop');
  });

  it('switches between A, B and C on the same device', () => {
    expect(siblingsOf('cl-live-study-b-iphone').map((s) => s.id)).toEqual([
      'cl-live-study-a-iphone',
      'cl-live-study-b-iphone',
      'cl-live-study-c-iphone',
    ]);
    expect(shotOf('gpt-home-chart-house')).toBeUndefined();
  });

  it('keeps the screenshot script in step with the routes', () => {
    const script = readFileSync('scripts/prototype-live-screenshots.mjs', 'utf8');
    for (const c of categories) {
      expect(script).toMatch(new RegExp(`\\['${c.id}', ["']${c.title}["']\\]`));
    }
    for (const v of variants) expect(script).toContain(`['${v.id}', '${v.letter}', '${v.name}']`);
  });

  it('exports three variant components from every category', async () => {
    for (const id of categoryIds) {
      const mod = (await import(`../src/prototypes/live/${id}/index.tsx`)) as {
        default: Record<string, unknown>;
      };
      expect(Object.keys(mod.default).sort(), id).toEqual([...variantIds]);
      for (const v of variantIds) expect(typeof mod.default[v], `${id} ${v}`).toBe('function');
    }
  });
});

describe('interactive prototypes on the Decision Desk', () => {
  const captured = variantShots.filter((s) => byId.has(s.desktop));

  it('registers a desktop and an iPhone capture for every variant', () => {
    expect(captured).toHaveLength(15);
    for (const s of variantShots) {
      for (const id of [s.desktop, s.iphone]) {
        const item = byId.get(id);
        expect(item, id).toBeDefined();
        expect(item?.interactive, id).toBe(s.href);
        expect(item?.style, id).toBe(s.name);
        expect(item?.kind, id).toBe('concept');
        expect(item?.image, id).toMatch(/^docs\/prototypes\/interactive\/images\//);
        expect(concepts.some((c) => c.id === id)).toBe(true);
        expect(categoryOf(id), id).toBe(s.category);
      }
    }
  });

  it('keeps reference images apart from screenshots of the new implementation', () => {
    for (const c of concepts) {
      // Climbed variants (cl-climb-...) are screenshots of new code too.
      const isLive = /^cl-(live|climb)-/.test(c.id);
      expect(c.image?.startsWith('docs/prototypes/interactive/') ?? false, c.id).toBe(isLive);
    }
  });

  it('maps every board image to a valid row for the rating backend', () => {
    const rows = concepts.flatMap((c) => {
      const row = assetRow(c);
      return row ? [row] : [];
    });
    expect(rows).toHaveLength(concepts.length);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    for (const r of rows) {
      expect(r.id).toMatch(ASSET_ID);
      expect(r.image_url).toMatch(/^\/[^/\s]\S*$/);
      expect(r.title.length).toBeLessThanOrEqual(160);
      expect(r.category.length).toBeGreaterThan(0);
    }
    const consoleA = byId.get('cl-live-console-a-desktop');
    expect(consoleA && assetRow(consoleA)?.category).toBe("Captain's Console");
  });
});

describe('the sample sailor', () => {
  const { seaTime, vessels, trips } = sample;

  it('takes the OUPV near-coastal amounts from the checked rules engine', () => {
    expect(sample.targetLicense.verified).toBe(true);
    expect(sample.targetLicense.totalDays).toBe(360);
    expect(sample.targetLicense.nearCoastalDays).toBe(90);
    expect(sample.licenses.filter((l) => l.verified)).toHaveLength(1);
  });

  it('adds up, so every variant tells the same story', () => {
    expect(seaTime.gpsDays + seaTime.backfilledDays).toBe(seaTime.creditedDays);
    expect(seaTime.nearCoastalDays + seaTime.inlandDays).toBe(seaTime.creditedDays);
    expect(seaTime.creditedDays + seaTime.fourToEightDays + seaTime.underFourDays).toBe(
      seaTime.recordedDays,
    );
    expect(vessels.reduce((n, v) => n + v.creditedDays, 0)).toBe(seaTime.creditedDays);
    expect(vessels.reduce((n, v) => n + v.signedDays, 0)).toBe(seaTime.signedDays);
    expect(seaTime.totalToGo).toBe(62);
    expect(seaTime.nearCoastalToGo).toBe(29);
    expect(
      trips.filter((t) => t.source === 'backfilled').every((t) => t.vesselId === 'kelp-runner'),
    ).toBe(true);
  });

  it('never claims a verdict', () => {
    const text = JSON.stringify(sample);
    expect(text).not.toMatch(
      /qualif|you are eligible|you are approved|application approved|approved to/i,
    );
    expect(sample.NMC_NOTICE).toContain('appears to meet');
  });
});
