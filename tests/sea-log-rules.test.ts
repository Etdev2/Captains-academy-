import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CACHE_NAME } from '../src/offline/offline';

// Project rules from AGENTS.md and DECISIONS.md A3 and G18, checked over the
// source so a change that breaks one fails here as well as in review.

const root = join(import.meta.dirname, '..');

function filesUnder(...dirs: string[]): string[] {
  return dirs.flatMap((dir) =>
    readdirSync(join(root, dir), { recursive: true, encoding: 'utf8' })
      .map((name) => join(root, dir, name))
      .filter((path) => statSync(path).isFile()),
  );
}

const read = (path: string): string => readFileSync(path, 'utf8');
const where = (path: string): string => relative(root, path);

function importsOf(source: string): string[] {
  return [...source.matchAll(/\b(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)].map(
    (match) => match[1] ?? '',
  );
}

describe('wording', () => {
  // The app says logged sea time "appears to meet" a requirement and never
  // that a user qualifies (G18, AGENTS.md project rules).
  it('no page, script or mission says qualify, qualifies or qualified', () => {
    const offenders = [
      ...filesUnder('src', 'log', 'play', 'public', 'missions'),
      join(root, 'index.html'),
    ]
      .filter((path) => /qualif/i.test(read(path)))
      .map(where);
    expect(offenders).toEqual([]);
  });
});

describe('tonnage', () => {
  // Only the official tonnage from the vessel's documents can be entered.
  // Any other way of working it out waits on open decision D5.
  it('no page or script of the log offers a tonnage estimate', () => {
    const offenders = filesUnder('src/log', 'log')
      .filter((path) => /estimat/i.test(read(path)))
      .map(where);
    expect(offenders).toEqual([]);
  });
});

describe('roles', () => {
  // How a role counts toward a license is open decision D4. Until it is
  // settled, nothing in the log maps a role to credit.
  it('the log maps no role to credit', () => {
    const offenders = filesUnder('src/log', 'log')
      .filter((path) => /credit(s|ed)?\s*[:=]|creditFactor|creditsToward/i.test(read(path)))
      .map(where);
    expect(offenders).toEqual([]);
  });
});

describe('rules engine wording', () => {
  // The engine shows progress, never a verdict: "appears to meet ...; the NMC
  // decides" (G18, issue #42).
  it('src/log/rules says no qualify, eligible for or you meet', () => {
    const files = filesUnder('src/log/rules');
    expect(files.length).toBeGreaterThan(0);
    const offenders = files
      .filter((path) => /qualif|eligible for|\byou meet\b/i.test(read(path)))
      .map(where);
    expect(offenders).toEqual([]);
  });

  it('src/log/rules imports nothing from the game, the simulator or missions', () => {
    const offenders = filesUnder('src/log/rules').flatMap((path) =>
      importsOf(read(path))
        .filter((spec) => /(^|\/)(game|sim|missions)(\/|$)|^phaser/.test(spec))
        .map((spec) => `${where(path)} imports ${spec}`),
    );
    expect(offenders).toEqual([]);
  });
});

describe('eligibility wording', () => {
  // An entry may be flagged "Not eligible: under 4 hours" (D1), but nothing
  // ever says a user is eligible for a license.
  it('no page or script says someone is eligible for something', () => {
    const offenders = [
      ...filesUnder('src', 'log', 'play', 'public', 'missions'),
      join(root, 'index.html'),
    ]
      .filter((path) =>
        /\b(is|are|you're|you are) eligible\b|\beligible for\b|\byou meet\b/i.test(read(path)),
      )
      .map(where);
    expect(offenders).toEqual([]);
  });
});

describe('credited days are never stored', () => {
  // The rules engine works them out each time (PR 4). No entry field holds them.
  it('no entry, vessel or preference field mentions credit or days', () => {
    const source = read(join(root, 'src/log/entry.ts'));
    const fields = [...source.matchAll(/^\s+(\w+):\s/gm)].map((match) => match[1] ?? '');
    expect(fields.filter((name) => /credit|days/i.test(name))).toEqual([]);
  });
});

describe('game time is never sea time', () => {
  it('the sea-time log imports nothing from the game or the simulator', () => {
    const offenders = filesUnder('src/log').flatMap((path) =>
      importsOf(read(path))
        .filter((spec) => /(^|\/)(game|sim)(\/|$)|^phaser/.test(spec))
        .map((spec) => `${where(path)} imports ${spec}`),
    );
    expect(offenders).toEqual([]);
  });

  it('the game and the simulator import nothing from the sea-time log', () => {
    const offenders = filesUnder('src/game', 'src/sim').flatMap((path) =>
      importsOf(read(path))
        .filter((spec) => /(^|\/)log(\/|$)/.test(spec))
        .map((spec) => `${where(path)} imports ${spec}`),
    );
    expect(offenders).toEqual([]);
  });
});

describe('no account and no backend', () => {
  // The log works on the device alone. Sync with Supabase arrives with the
  // academy login (A4) in a later change.
  it('the log and its store make no network calls', () => {
    const network =
      /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|supabase|https?:\/\//i;
    const offenders = filesUnder('src/log', 'src/store')
      .filter((path) => network.test(read(path)))
      .map(where);
    expect(offenders).toEqual([]);
  });
});

describe('offline', () => {
  it('the page and the service worker use the same cache', () => {
    const sw = read(join(root, 'public/sw.js'));
    expect(sw.match(/const CACHE = '([^']+)';/)?.[1]).toBe(CACHE_NAME);
  });

  it('the build includes the sea-time log page', () => {
    expect(read(join(root, 'vite.config.ts'))).toContain("log: 'log/index.html'");
  });
});

describe('front page', () => {
  // The site root links to both parts of the app, so nothing may send / elsewhere.
  it('the build includes the front page, and nothing redirects the root away', () => {
    expect(read(join(root, 'vite.config.ts'))).toContain("home: 'index.html'");
    const vercel = JSON.parse(read(join(root, 'vercel.json'))) as {
      redirects?: { source: string }[];
      rewrites?: { source: string }[];
    };
    const rules = [...(vercel.redirects ?? []), ...(vercel.rewrites ?? [])];
    expect(rules.filter((rule) => rule.source === '/')).toEqual([]);
  });

  it('links only to pages the build makes', () => {
    const links = [...read(join(root, 'index.html')).matchAll(/href="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(links).toEqual(['/play/', '/rules/', '/log/']);
    const config = read(join(root, 'vite.config.ts'));
    for (const link of links) expect(config).toContain(`'${link?.slice(1)}index.html'`);
  });
});
