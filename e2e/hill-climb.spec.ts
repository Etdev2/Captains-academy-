import { expect, test, type Page } from '@playwright/test';
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { promisify } from 'node:util';

// The Hill climb on the Decision Desk (docs/prototypes/hill-climb.md): the
// button that copies the climb prompt, and the scoring script that decides
// whether a climb step is better.

const root = join(import.meta.dirname, '..');
const run = promisify(execFile);

// The "In plain language" part of the prompt, word for word, example included.
const PLAIN_LANGUAGE = `The plain-language version is for a reader with no design or coding background, such as a first-year college student in a liberal arts program. Put it first in the report and in the pull request description, under the heading "In plain language". Rules:
- 150 to 250 words of whole sentences. No tables, file names, ids, code or abbreviations.
- Explain any needed term (tap target, contrast) in the same sentence that uses it.
- Cover, in this order: what the screen is for and who uses it; what you measured and why fewer taps matters to a mariner on a moving deck with one hand free; what the climb tried; what worked and what did not; what happens next (the team votes, and nothing is built yet).
- Every number in it must match the trajectory table. Check this before you report.

Example of the tone and length. The numbers in it are invented. Use your real results.

> This screen is where a boat crew member records that a stretch of time at sea has started, which counts toward their captain's license. They often do it standing on a moving deck with one hand holding on, so every extra tap matters. We counted how many taps it takes to finish that job. The original design took 6 taps. We tried 15 small redesigns, three at a time, and kept a change only when it lowered the count. Every version also had to pass two basic checks: each button had to be big enough to hit with a gloved thumb, and the text had to stand out from its background so it can be read in bright sun. The best version takes 3 taps, because it puts the check-in button on the first screen instead of two screens in. Two ideas failed. One made the buttons too small, and one hid information the check-in needs. None of this is in the real app yet. The team will look at the new versions next to the original and vote on which direction to take.`;

const viewer = (page: Page) => page.getByRole('dialog');
const hillClimb = (page: Page) => viewer(page).getByRole('button', { name: 'Hill climb' });

async function setStep(page: Page, step: RegExp) {
  await page.locator('#round-step').click();
  await page.getByRole('option', { name: step }).click();
  await expect(page.getByRole('listbox')).toHaveCount(0);
}

async function openConcept(page: Page, id: string) {
  await page.goto(`/prototypes/?concept=${id}`);
  await expect(viewer(page)).toBeVisible();
}

async function closeViewer(page: Page) {
  await page.keyboard.press('Escape');
  await expect(viewer(page)).toHaveCount(0);
}

test.describe('the Hill climb button', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (value: string) => {
            (window as Window & { copied?: string }).copied = value;
          },
        },
      });
    });
  });

  test('shows on live-variant concepts only in the discuss and decide steps', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/prototypes/');
    await page.getByLabel('Your name').fill('Ana');
    for (const [step, shown] of [
      [/Look/, false],
      [/Dot vote/, false],
      [/Discuss/, true],
      [/Decider's call/, true],
    ] as const) {
      await page.goto('/prototypes/');
      await setStep(page, step);
      for (const id of ['cl-live-sea-time-b-desktop', 'cl-live-study-c-iphone']) {
        await openConcept(page, id);
        await expect(hillClimb(page), `${id} in ${step}`).toHaveCount(shown ? 1 : 0);
        await closeViewer(page);
      }
    }
    // Never on a concept that is not a live variant.
    await openConcept(page, 'gpt-home-chart-house');
    await expect(hillClimb(page)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('copies the filled prompt, with no placeholder left, and says so in a live region', async ({
    page,
  }) => {
    await page.goto('/prototypes/');
    await setStep(page, /Discuss/);
    await openConcept(page, 'cl-live-sea-time-b-iphone');
    const button = hillClimb(page);
    const box = await button.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await button.click();
    const status = viewer(page).locator('#viewer-status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).toHaveText('Hill climb prompt copied. Paste it into a coding agent.');
    const copied = await page.evaluate(() => (window as Window & { copied?: string }).copied);
    expect(copied).toBeDefined();
    expect(copied).not.toContain('{{');
    expect(copied).toContain('Category: sea-time. Variant: b. Concept: cl-live-sea-time-b-iphone.');
    expect(copied).toContain('Copy variant b to climb 1');
    expect(copied).toContain('cl-climb-sea-time-b-<n>-desktop and -iphone');
    expect(copied).toContain(PLAIN_LANGUAGE);
  });

  test('says when the copy fails', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error('Clipboard denied');
          },
        },
      });
    });
    await page.goto('/prototypes/');
    await setStep(page, /Decider's call/);
    await openConcept(page, 'cl-live-console-a-desktop');
    await hillClimb(page).click();
    await expect(viewer(page).locator('#viewer-status')).toHaveText(
      /^Could not copy the Hill climb prompt\./,
    );
  });
});

test.describe('the Hill climb scoring script', () => {
  // The script launches its own iPhone-sized Chromium, so the desktop project is enough.
  test.skip(({ isMobile }) => isMobile, 'The script brings its own iPhone viewport.');
  test.setTimeout(120_000);

  let server: Server;
  let base = '';
  test.beforeAll(async () => {
    const dir = join(root, 'tests/fixtures/hill-climb');
    server = createServer((req, res) => {
      const name = (req.url ?? '/').replace(/^\//, '').replace(/\?.*$/, '');
      if (!/^[a-z-]+\.html$/.test(name)) {
        res.writeHead(404).end();
        return;
      }
      try {
        const body = readFileSync(join(dir, name));
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(body);
      } catch {
        res.writeHead(404).end();
      }
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  test.afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  async function score(fixture: string) {
    const args = [
      'scripts/hill-climb-score.mjs',
      ...['--category', 'sea-time', '--variant', 'a', '--url', base],
      ...['--page', `/${fixture}.html`],
      ...['--path-file', 'tests/fixtures/hill-climb/check-in.path.json'],
    ];
    try {
      const { stdout } = await run('node', args, { cwd: root });
      return { code: 0, result: JSON.parse(stdout) as Record<string, unknown> };
    } catch (error) {
      const e = error as { code: number; stdout: string };
      return { code: e.code, result: JSON.parse(e.stdout) as Record<string, unknown> };
    }
  }

  test('scores a page that passes the gate and reaches the end state', async () => {
    const { code, result } = await score('passes');
    expect(code).toBe(0);
    expect(result).toMatchObject({ gate: 'pass', failures: [], taps: 1 });
    expect(typeof result.medianSeconds).toBe('number');
  });

  test('fails a 30px button', async () => {
    const { code, result } = await score('small-button');
    expect(code).not.toBe(0);
    expect(result).toMatchObject({ gate: 'fail', taps: null, medianSeconds: null });
    expect(result.failures).toContain(
      'target-size on the first screen: button "Check in" is 30 by 30 px',
    );
  });

  test('fails a low-contrast label', async () => {
    const { code, result } = await score('low-contrast');
    expect(code).not.toBe(0);
    expect(result).toMatchObject({ gate: 'fail', taps: null, medianSeconds: null });
    expect(JSON.stringify(result.failures)).toMatch(/color-contrast: #go/);
  });

  test('fails a page that never reaches the end state', async () => {
    const { code, result } = await score('never-ends');
    expect(code).not.toBe(0);
    expect(result).toMatchObject({ gate: 'pass', taps: null, medianSeconds: null });
    expect(result.failures).toEqual([
      'end-state: Not checked in: no "Check out" button is visible.',
    ]);
  });

  test('refuses unknown arguments with exit code 2', async () => {
    const failed = await run('node', ['scripts/hill-climb-score.mjs', '--category', 'boats'], {
      cwd: root,
    }).catch((e: { code: number }) => e);
    expect((failed as { code: number }).code).toBe(2);
  });
});
