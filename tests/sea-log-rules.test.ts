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
    const offenders = filesUnder('src', 'log', 'play', 'public', 'missions')
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
