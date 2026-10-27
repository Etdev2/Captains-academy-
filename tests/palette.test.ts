import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ART, LIGHT_COLORS, PAIRS, PALETTE, contrast, hueSaturation } from '../src/game/ui/palette';

// The interface palette (DECISIONS.md G15) and the contrast table in
// docs/design/definitions-spec.md.

const root = join(import.meta.dirname, '..');
const isRedOrGreen = (hex: string): boolean => {
  const { hue, saturation } = hueSaturation(hex);
  if (saturation < 0.25) return false;
  return hue < 20 || hue > 340 || (hue > 80 && hue < 165);
};

describe('the interface palette', () => {
  it('meets WCAG AA for every pair the level draws', () => {
    for (const p of PAIRS) {
      const ratio = contrast(PALETTE[p.fg], PALETTE[p.bg]);
      expect(ratio, `${p.fg} on ${p.bg} (${p.where})`).toBeGreaterThanOrEqual(
        p.kind === 'text' ? 4.5 : 3,
      );
    }
  });

  it('matches the ratios printed in the design spec', () => {
    const spec = readFileSync(join(root, 'docs/design/definitions-spec.md'), 'utf8');
    for (const p of PAIRS) {
      const ratio = contrast(PALETTE[p.fg], PALETTE[p.bg]).toFixed(2);
      expect(spec).toContain(`| \`${p.fg}\` | \`${p.bg}\` | ${p.where} | ${ratio}:1 |`);
    }
  });

  it('matches the hex values printed in the design spec', () => {
    const spec = readFileSync(join(root, 'docs/design/definitions-spec.md'), 'utf8');
    for (const [token, hex] of Object.entries(PALETTE)) {
      expect(spec).toContain(`| \`${token}\` | \`${hex}\` |`);
    }
  });

  it('has no red or green token, because those mean port and starboard', () => {
    for (const [token, hex] of Object.entries(PALETTE)) {
      expect(isRedOrGreen(hex), token).toBe(false);
    }
  });

  it('keeps red, green and the feedback colors out of the vessel art', () => {
    const feedback = [PALETTE['gold-500'], PALETTE['blue-500'], PALETTE['purple-500']].map((h) =>
      parseInt(h.slice(1), 16),
    );
    for (const [name, value] of Object.entries(ART)) {
      const hex = `#${value.toString(16).padStart(6, '0')}`;
      expect(isRedOrGreen(hex), name).toBe(false);
      expect(feedback, name).not.toContain(value);
    }
  });

  it('computes the reference ratios', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrast('#ffffff', '#ffffff')).toBe(1);
  });
});

describe('red and green belong to the navigation lights alone (G15, Lights)', () => {
  it('has red and green only among the light colors', () => {
    const asHex = (v: number) => `#${v.toString(16).padStart(6, '0')}`;
    expect(isRedOrGreen(asHex(LIGHT_COLORS.red))).toBe(true);
    expect(isRedOrGreen(asHex(LIGHT_COLORS.green))).toBe(true);
    expect(isRedOrGreen(asHex(LIGHT_COLORS.white))).toBe(false);
    expect(isRedOrGreen(asHex(LIGHT_COLORS.yellow))).toBe(false);
  });

  it('uses the light colors in the lights drawing and nowhere else in the game', () => {
    const users = ['src/game/rapid/LightsView.ts', 'src/game/ui/palette.ts'];
    const files = readdirSync(join(root, 'src/game'), { recursive: true })
      .map(String)
      .filter((f) => f.endsWith('.ts'))
      .map((f) => `src/game/${f}`)
      .filter((f) => !f.startsWith('src/game/grok/'));
    expect(files.length).toBeGreaterThan(5);
    for (const f of files) {
      const text = readFileSync(join(root, f), 'utf8');
      if (users.includes(f)) continue;
      expect(text, f).not.toMatch(/LIGHT_COLORS|0xff3b30|0x2ee66b/i);
    }
  });

  it('keeps the sky, sea and horizon behind the lights free of red and green', () => {
    for (const k of ['sky', 'sea', 'horizon', 'star'] as const) {
      const hex = `#${ART[k].toString(16).padStart(6, '0')}`;
      expect(isRedOrGreen(hex), k).toBe(false);
    }
  });
});

describe('the rules page uses the palette', () => {
  it('declares every token as a CSS custom property with the same value', () => {
    const html = readFileSync(join(root, 'rules/index.html'), 'utf8');
    for (const [token, hex] of Object.entries(PALETTE)) {
      expect(html).toContain(`--${token}: ${hex};`);
    }
  });

  it('uses no color outside the palette in its styles', () => {
    const html = readFileSync(join(root, 'rules/index.html'), 'utf8');
    const values = new Set(Object.values(PALETTE).map((h) => h.toLowerCase()));
    const used = [...html.matchAll(/#[0-9a-f]{6}\b/gi)].map((m) => m[0].toLowerCase());
    for (const hex of used) expect(values.has(hex), hex).toBe(true);
  });
});
