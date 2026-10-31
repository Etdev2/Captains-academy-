#!/usr/bin/env node
/* global document, window, HTMLElement, HTMLInputElement */
// Scores one live prototype variant, or one climbed variant, for a Hill climb
// on the Decision Desk (docs/prototypes/hill-climb.md).
//
//   node scripts/hill-climb-score.mjs --category <c> --variant <a|b|c> [--climb <n>] --url <preview base URL>
//
// It opens the variant in a Playwright iPhone viewport (Chromium), replays the
// variant's task path file, and checks that the category's main task ended in
// its end state. The end-state checks are fixed in this file. A climbing agent
// must not edit this script, the end-state checks or the A/B/C task paths.
//
// The gate runs on every screen the path visits: the first screen, the screen
// after each tap and the end state. It has two checks:
//   1. every visible interactive control is at least 44 by 44 CSS pixels;
//   2. axe-core's color-contrast rule (WCAG AA) reports no violations.
// A variant that fails the gate gets no score. The climb score is the number
// of taps in the path. When two candidates tie on taps, the lower median
// seconds over 3 timed runs wins. Lower is better for both.
//
// It prints one JSON line:
//   {"gate":"pass"|"fail","failures":[...],"taps":n,"medianSeconds":s}
// `taps` and `medianSeconds` are null when the gate fails or the end state is
// not reached. Exit codes: 0 scored, 1 gate failed or end state not reached,
// 2 the arguments, the path file or the page could not be used.
//
// For this script's own tests only, --page <path> and --path-file <file>
// replace the variant's URL and task path with a fixture. A run that uses them
// says so on stderr and is not a climb score.

import AxeBuilder from '@axe-core/playwright';
import { chromium, devices } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const CATEGORIES = ['console', 'license', 'sea-time', 'study', 'arcade'];
export const VARIANTS = ['a', 'b', 'c'];
export const MIN_TARGET = 44;
export const TIMED_RUNS = 3;
const ROLES = ['button', 'link', 'radio', 'checkbox', 'tab', 'switch', 'menuitem', 'option'];

// The iPhone the climb score is measured on, run in Chromium.
const IPHONE = { ...devices['iPhone 13'] };
delete IPHONE.defaultBrowserType;

// ------------------------------------------------------------ end states
// The fixed end state of each category's main task. Each check returns null
// when the page is in the end state, or a sentence saying what is missing.

const visible = (locator) => locator.filter({ visible: true }).count();

/** @type {Record<string, { task: string, timeoutMs: number, check: (page: import('@playwright/test').Page) => Promise<string | null> }>} */
export const END_STATES = {
  console: {
    task: 'From home, open the next action.',
    timeoutMs: 5_000,
    async check(page) {
      const n = await visible(
        page.getByRole('link', { name: 'Go to the form review', exact: true }),
      );
      return n > 0
        ? null
        : 'The next action is not open: no "Go to the form review" link is visible.';
    },
  },
  license: {
    task: 'Pick a license and reach the "what\'s missing" view.',
    timeoutMs: 5_000,
    async check(page) {
      const heading = await visible(page.getByRole('heading', { level: 1, name: /missing/i }));
      const pressed = await visible(
        page.getByRole('button', { name: /^still missing\b/i, pressed: true }),
      );
      const checked = await visible(
        page.getByRole('checkbox', { name: /still missing/i, checked: true }),
      );
      return heading + pressed + checked > 0
        ? null
        : 'The "what\'s missing" view is not showing: no level-1 heading names what is missing, and no "still missing" filter is on.';
    },
  },
  'sea-time': {
    task: 'Check in to a sea-time entry.',
    timeoutMs: 5_000,
    async check(page) {
      const n = await visible(page.getByRole('button', { name: /^check out\b/i }));
      return n > 0 ? null : 'Not checked in: no "Check out" button is visible.';
    },
  },
  study: {
    task: 'Answer one practice question and see its explanation.',
    timeoutMs: 5_000,
    async check(page) {
      const answered = await visible(page.getByRole('button', { name: /(your|right) answer$/i }));
      const answeredRadio = await visible(
        page.getByRole('radio', { name: /(your|right) answer$/i }),
      );
      const next = await visible(
        page.getByRole('button', { name: /^(next question|see score|finish and debrief)$/i }),
      );
      const citation = await visible(page.getByText(/33 CFR 83\.\d+/));
      if (answered + answeredRadio === 0)
        return 'No practice answer is marked as answered ("Your answer" or "Right answer").';
      if (citation === 0) return 'The explanation and its 33 CFR 83 citation are not visible.';
      if (next === 0) return 'No "Next question" button follows the explanation.';
      return null;
    },
  },
  arcade: {
    task: 'Start a docking challenge and reach the debrief.',
    timeoutMs: 120_000,
    async check(page) {
      const text = await page.evaluate(() => document.body.innerText);
      if (!/Your time:?\s*\d+:\d{2}/.test(text)) return 'No docking debrief shows "Your time".';
      if (!/Long Beach|Crosswind slip/.test(text)) return 'The debrief names no docking challenge.';
      return null;
    },
  },
};

// ------------------------------------------------------------ arguments

function usage(message) {
  process.stderr.write(
    `${message}\nUsage: node scripts/hill-climb-score.mjs --category <${CATEGORIES.join('|')}> --variant <a|b|c> [--climb <n>] --url <preview base URL>\n`,
  );
  process.exit(2);
}

export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key?.startsWith('--') || value === undefined || value.startsWith('--')) {
      throw new Error(`Expected "--name value", got "${key ?? ''}".`);
    }
    out[key.slice(2)] = value;
  }
  const known = ['category', 'variant', 'climb', 'url', 'page', 'path-file'];
  for (const k of Object.keys(out))
    if (!known.includes(k)) throw new Error(`Unknown option --${k}.`);
  if (!CATEGORIES.includes(out.category)) throw new Error('--category is missing or unknown.');
  if (!VARIANTS.includes(out.variant)) throw new Error('--variant must be a, b or c.');
  if (out.climb !== undefined && !/^[1-9][0-9]?$/.test(out.climb)) {
    throw new Error('--climb must be a whole number from 1 to 99.');
  }
  if (!out.url) throw new Error('--url is missing.');
  return out;
}

/** Where a variant's task path file lives, next to its code. */
export function pathFileOf(category, variant, climb) {
  return climb === undefined
    ? join(root, 'src/prototypes/live', category, `${variant}.path.json`)
    : join(root, 'src/prototypes/live', category, 'climbs', `${variant}-${climb}`, 'path.json');
}

export function pageOf(category, variant, climb) {
  const q = new URLSearchParams({ category, variant });
  if (climb !== undefined) q.set('climb', climb);
  q.set('frame', '0');
  return `/prototypes/live/?${q.toString()}`;
}

/** Reads and checks a task path file: { category, variant, climb?, taps: [{ role, name }] }. */
export function readPath(file, expect) {
  if (!existsSync(file)) throw new Error(`No task path file at ${relative(root, file)}.`);
  const data = JSON.parse(readFileSync(file, 'utf8'));
  if (expect) {
    if (data.category !== expect.category || data.variant !== expect.variant) {
      throw new Error(`${relative(root, file)} names a different category or variant.`);
    }
    if (
      (data.climb ?? undefined) !== (expect.climb === undefined ? undefined : Number(expect.climb))
    ) {
      throw new Error(`${relative(root, file)} names a different climb.`);
    }
  }
  if (!Array.isArray(data.taps)) throw new Error('A task path needs a "taps" list.');
  for (const [i, t] of data.taps.entries()) {
    if (!ROLES.includes(t?.role) || typeof t.name !== 'string' || t.name === '') {
      throw new Error(`Tap ${i + 1} needs a role (${ROLES.join(', ')}) and a non-empty name.`);
    }
  }
  return data.taps;
}

// ------------------------------------------------------------ the gate

/** Every visible interactive control smaller than 44 by 44 CSS pixels. */
async function smallTargets(page, min) {
  return page.evaluate((min) => {
    const selector = [
      'a[href]',
      'button',
      'input:not([type="hidden"])',
      'select',
      'textarea',
      'summary',
      '[role="button"]',
      '[role="link"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="tab"]',
      '[role="switch"]',
      '[role="menuitem"]',
      '[role="option"]',
      '[role="slider"]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    const name = (el) =>
      (
        el.getAttribute('aria-label') ||
        el.labels?.[0]?.textContent ||
        el.textContent ||
        el.getAttribute('title') ||
        ''
      )
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 60) || el.tagName.toLowerCase();
    const shown = (el) =>
      el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) &&
      !el.closest('[inert],[aria-hidden="true"]');
    const out = [];
    for (const el of document.querySelectorAll(selector)) {
      if (!(el instanceof HTMLElement) || !shown(el)) continue;
      if (el.matches(':disabled') || el.getAttribute('aria-disabled') === 'true') continue;
      let box = el.getBoundingClientRect();
      const label = el instanceof HTMLInputElement ? (el.labels?.[0] ?? el.closest('label')) : null;
      if (label && /^(checkbox|radio)$/.test(el.type)) {
        // A checkbox or radio button is tapped through its label too, so its
        // target is the box around both. A visually hidden one is its label.
        const l = label.getBoundingClientRect();
        if (box.width <= 1 || box.height <= 1) box = l;
        else {
          const left = Math.min(box.left, l.left);
          const top = Math.min(box.top, l.top);
          const right = Math.max(box.right, l.right);
          const bottom = Math.max(box.bottom, l.bottom);
          box = { width: right - left, height: bottom - top };
        }
      } else if (box.width <= 1 && box.height <= 1) {
        continue;
      }
      const w = Math.round(box.width * 10) / 10;
      const h = Math.round(box.height * 10) / 10;
      if (w + 0.01 < min || h + 0.01 < min) {
        const role = el.getAttribute('role') || el.tagName.toLowerCase();
        out.push(`${role} "${name(el)}" is ${w} by ${h} px`);
      }
    }
    return out;
  }, min);
}

async function contrastFailures(page) {
  const result = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
  return result.violations.flatMap((v) =>
    v.nodes.map((n) => {
      const data = n.any[0]?.data ?? {};
      const ratio = data.contrastRatio ? `, ratio ${data.contrastRatio}` : '';
      const text = (n.html ?? '').replace(/\s+/g, ' ').slice(0, 80);
      return `color-contrast: ${n.target.join(' ')}${ratio} (${text})`;
    }),
  );
}

async function gate(page, screen) {
  const failures = [];
  for (const f of await smallTargets(page, MIN_TARGET))
    failures.push(`target-size on ${screen}: ${f}`);
  for (const f of await contrastFailures(page)) failures.push(`${f} on ${screen}`);
  return failures;
}

// ------------------------------------------------------------ replay

async function settle(page) {
  await page.evaluate(
    () => new Promise((r) => window.requestAnimationFrame(() => window.requestAnimationFrame(r))),
  );
  // Let entry transitions finish, so colors are read at rest.
  await page.waitForTimeout(350);
}

async function tap(page, step, index) {
  const target = page
    .getByRole(step.role, { name: step.name, exact: true })
    .filter({ visible: true });
  try {
    await target.first().waitFor({ state: 'visible', timeout: 5_000 });
  } catch {
    throw new Error(`Tap ${index + 1}: no visible ${step.role} named "${step.name}".`);
  }
  await target.first().tap({ timeout: 5_000 });
}

async function waitForEnd(page, end) {
  const stop = Date.now() + end.timeoutMs;
  for (;;) {
    const last = await end.check(page);
    if (last === null) return null;
    if (Date.now() > stop) return last;
    await page.waitForTimeout(100);
  }
}

async function openPage(browser, url) {
  const context = await browser.newContext({ ...IPHONE, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const response = await page.goto(url, { waitUntil: 'load' });
  if (!response || !response.ok())
    throw new Error(`${url} answered ${response?.status() ?? 'nothing'}.`);
  return { context, page };
}

/** One untimed pass with the gate on every screen. */
async function gatedRun(browser, url, taps, end) {
  const { context, page } = await openPage(browser, url);
  const failures = [];
  try {
    await settle(page);
    failures.push(...(await gate(page, 'the first screen')));
    for (const [i, step] of taps.entries()) {
      await tap(page, step, i);
      await settle(page);
      const where = `the screen after tap ${i + 1} (${step.role} "${step.name}")`;
      if (i < taps.length - 1) failures.push(...(await gate(page, where)));
    }
    const missing = await waitForEnd(page, end);
    if (missing !== null) return { failures, reached: false, missing };
    await settle(page);
    failures.push(...(await gate(page, 'the end state')));
    return { failures, reached: true };
  } catch (error) {
    return { failures, reached: false, missing: error.message };
  } finally {
    await context.close();
  }
}

/** One timed pass without the gate, from opening the page to the end state. */
async function timedRun(browser, url, taps, end) {
  const start = performance.now();
  const { context, page } = await openPage(browser, url);
  try {
    for (const [i, step] of taps.entries()) await tap(page, step, i);
    const missing = await waitForEnd(page, end);
    if (missing !== null) throw new Error(missing);
    return (performance.now() - start) / 1000;
  } finally {
    await context.close();
  }
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

export async function score({ url, taps, end }) {
  const browser = await chromium.launch();
  try {
    const run = await gatedRun(browser, url, taps, end);
    const failures = [...new Set(run.failures)];
    if (!run.reached) failures.push(`end-state: ${run.missing}`);
    if (failures.length > 0 || !run.reached) {
      return {
        gate: run.failures.length > 0 ? 'fail' : 'pass',
        failures,
        taps: null,
        medianSeconds: null,
      };
    }
    const seconds = [];
    for (let i = 0; i < TIMED_RUNS; i++) {
      try {
        seconds.push(await timedRun(browser, url, taps, end));
      } catch (error) {
        const failure = `end-state on timed run ${i + 1}: ${error.message}`;
        return { gate: 'pass', failures: [failure], taps: null, medianSeconds: null };
      }
    }
    return {
      gate: 'pass',
      failures: [],
      taps: taps.length,
      medianSeconds: Math.round(median(seconds) * 1000) / 1000,
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    usage(error.message);
  }
  const fixture = args.page !== undefined || args['path-file'] !== undefined;
  if (fixture) {
    process.stderr.write('Fixture mode (--page or --path-file): this run is not a climb score.\n');
  }
  let taps;
  try {
    taps = readPath(
      args['path-file'] ?? pathFileOf(args.category, args.variant, args.climb),
      fixture ? undefined : args,
    );
  } catch (error) {
    usage(error.message);
  }
  const base = args.url.replace(/\/$/, '');
  const url = base + (args.page ?? pageOf(args.category, args.variant, args.climb));
  let result;
  try {
    result = await score({ url, taps, end: END_STATES[args.category] });
  } catch (error) {
    usage(`Could not score ${url}: ${error.message}`);
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(result.gate === 'pass' && result.taps !== null ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
