import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { CATEGORIES, DEFINITIONS, PAR_MS, QUESTION } from '../src/sim/chapter1/definitions';
import { PALETTE, contrast } from '../src/game/ui/palette';

// Chapter 1, level 1 at /rules (issue #47), built to
// docs/design/definitions-spec.md: name each vessel with a tap or a key, a miss
// costs a heart and plays a pausable replay with the rule, and the run ends
// cleared or out of hearts. Every project runs it: phone upright, phone
// sideways and desktop.

type Quiz = NonNullable<Window['__captainsAcademyQuiz']>;
const state = (page: Page): Promise<Quiz> =>
  page.evaluate(() => window.__captainsAcademyQuiz as NonNullable<Window['__captainsAcademyQuiz']>);
const cardOf = (id: string | null) => {
  const card = DEFINITIONS.find((c) => c.id === id);
  if (!card) throw new Error(`unknown card ${String(id)}`);
  return card;
};
const rightIndex = (id: string | null): number =>
  CATEGORIES.findIndex((c) => c.id === cardOf(id).answer) + 1;
const wrongIndex = (id: string | null): number => (rightIndex(id) % CATEGORIES.length) + 1;
const button = (page: Page, n: number) => page.locator(`#answers [data-answer="${n}"]`);

async function question(page: Page): Promise<Quiz> {
  await expect.poll(async () => (await state(page)).phase).toBe('question');
  return state(page);
}
/** Taps (or clicks) an answer and waits until the run has counted it. */
async function tap(page: Page, n: number): Promise<void> {
  const before = (await state(page)).answered;
  await button(page, n).click();
  await expect.poll(async () => (await state(page)).answered).toBe(before + 1);
}
async function answerRest(page: Page): Promise<void> {
  for (;;) {
    const s = await state(page);
    if (s.phase === 'done') return;
    if (s.phase !== 'question') {
      await page.waitForTimeout(50);
      continue;
    }
    await tap(page, rightIndex(s.card));
  }
}

let errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/rules/?seed=47');
  await expect(page.locator('#art canvas')).toBeVisible();
});
test.afterEach(() => {
  expect(errors).toEqual([]);
});

test('the first card shows the rule set, the progress, the hearts and five answers', async ({
  page,
}) => {
  const s = await question(page);
  expect(s).toMatchObject({ level: 'ch1-definitions', hearts: 3, remaining: 16, seed: 47 });
  await expect(page.getByRole('heading', { name: '1 · Definitions' })).toBeVisible();
  await expect(page.locator('#chip')).toHaveText('Inland + International');
  await expect(page.locator('#chip')).toHaveAttribute(
    'aria-label',
    'Rule set: Inland and International',
  );
  await expect(page.locator('#progress-text')).toHaveText('1 of 16');
  await expect(page.locator('#hearts')).toHaveAttribute('aria-label', '3 of 3 hearts left');
  await expect(page.locator('#again')).toBeHidden();
  await expect(page.locator('#cue')).toHaveText(cardOf(s.card).cue);
  await expect(page.getByRole('heading', { name: QUESTION })).toBeVisible();
  await expect(page.getByRole('group', { name: QUESTION }).getByRole('button')).toHaveText(
    CATEGORIES.map((c) => new RegExp(c.label)),
  );
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/qualif|study aid|approved course/i);
});

test('a clean run names every vessel and clears with three stars', async ({ page }) => {
  let combo = 0;
  for (let i = 0; i < DEFINITIONS.length; i++) {
    const s = await question(page);
    await expect(page.locator('#progress-text')).toHaveText(`${i + 1} of 16`);
    const n = rightIndex(s.card);
    await tap(page, n);
    combo += 1;
    if (i < DEFINITIONS.length - 1) {
      await expect(button(page, n)).toHaveAttribute('data-state', 'correct');
      await expect(button(page, n)).toContainText('Right');
    }
    expect((await state(page)).combo).toBe(combo);
  }
  await expect.poll(async () => (await state(page)).phase).toBe('done');
  const end = await state(page);
  expect(end).toMatchObject({ outcome: 'cleared', stars: 3, misses: 0, hearts: 3 });
  expect(end.elapsedMs).toBeLessThanOrEqual(PAR_MS);
  expect(Number.isSafeInteger(end.elapsedMs)).toBe(true);
  const dialog = page.getByRole('dialog', { name: 'Level cleared' });
  await expect(dialog).toBeVisible();
  await expect(page.locator('#stars-text')).toHaveText('3 of 3 stars');
  await expect(page.locator('#next-star')).toBeHidden();
  await expect(page.locator('#review')).toBeHidden();
  await expect(page.locator('#end-title')).toBeFocused();
  const saved = await page.evaluate(() =>
    window.localStorage.getItem('captains-academy:stars:ch1-definitions'),
  );
  expect(saved).toBe('3');
  const mastery = await page.evaluate(() =>
    window.localStorage.getItem('captains-academy:mastery:rule3:motorboat'),
  );
  expect(JSON.parse(mastery ?? '{}')).toEqual({ right: 1, wrong: 0, streak: 1 });
});

test('a wrong answer costs a heart, explains the rule, and the card comes back', async ({
  page,
}) => {
  const s = await question(page);
  const card = cardOf(s.card);
  const wrong = wrongIndex(s.card);
  await tap(page, wrong);
  await expect(button(page, wrong)).toHaveAttribute('data-state', 'wrong');
  await expect(button(page, wrong)).toContainText('Your pick');
  await expect(button(page, rightIndex(s.card))).toHaveAttribute('data-state', 'answer');
  await expect(button(page, rightIndex(s.card))).toContainText('Answer');
  await expect(page.locator('#hearts')).toHaveAttribute('aria-label', '2 of 3 hearts left');
  await expect(page.locator('#hearts-label')).toHaveText('2 left');

  const panel = page.getByRole('region', { name: 'Not quite' });
  await expect(panel).toBeVisible();
  const label = CATEGORIES.find((c) => c.id === card.answer)?.label.toLowerCase() ?? '';
  await expect(page.locator('#panel-answer')).toHaveText(`She is ${label}.`);
  await expect(page.locator('#panel-why')).toHaveText(card.why);
  await expect(page.locator('#panel-citation')).toHaveText(card.citation);
  await expect(page.locator('#panel-back')).toHaveText('This one comes back in 3 cards.');
  await expect(page.locator('#live-assertive')).toContainText(card.citation);
  expect((await state(page)).phase).toBe('replay');

  // The replay ends on its own after 5 seconds.
  await expect.poll(async () => (await state(page)).phase, { timeout: 8000 }).toBe('question');
  await expect(panel).toBeHidden();

  for (let i = 0; i < 3; i++) await tap(page, rightIndex((await question(page)).card));
  const back = await question(page);
  expect(back.card).toBe(card.id);
  await expect(page.locator('#again')).toBeVisible();

  await answerRest(page);
  const end = await state(page);
  expect(end).toMatchObject({ outcome: 'cleared', stars: 2, misses: 1 });
  await expect(page.locator('#stars-text')).toHaveText('2 of 3 stars');
  await expect(page.locator('#next-star')).toHaveText('No misses inside 75 seconds earns 3 stars.');
  await expect(page.locator('#review-list li')).toHaveCount(1);
  await expect(page.locator('#review-list li')).toContainText(card.cue);
});

test('Pause keeps the explanation on screen until the player presses Next', async ({ page }) => {
  const s = await question(page);
  await tap(page, wrongIndex(s.card));
  await expect(page.locator('#panel')).toBeVisible();
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Resume' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('#countdown-text')).toHaveText(
    'Paused. Press Next when you are ready.',
  );
  await page.waitForTimeout(6000);
  expect((await state(page)).phase).toBe('replay');
  await expect(page.locator('#panel')).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect.poll(async () => (await state(page)).phase).toBe('question');
});

test('running out of hearts ends the run with no stars', async ({ page }) => {
  for (let i = 0; i < 3; i++) {
    const s = await question(page);
    await tap(page, wrongIndex(s.card));
    if (i < 2) {
      await expect.poll(async () => (await state(page)).phase).toBe('replay');
      await page.waitForTimeout(850);
      await page.getByRole('button', { name: 'Next' }).click();
    }
  }
  await expect(page.locator('#panel-back')).toHaveText('That was your last heart.');
  await expect.poll(async () => (await state(page)).phase, { timeout: 8000 }).toBe('done');
  expect(await state(page)).toMatchObject({ outcome: 'out-of-hearts', stars: 0, hearts: 0 });
  await expect(page.getByRole('dialog', { name: 'Out of hearts' })).toBeVisible();
  await expect(page.locator('#end-sub')).toHaveText('You cleared 0 of 16.');
  await expect(page.locator('#stars')).toBeHidden();
  await page.getByRole('button', { name: 'Try again' }).click();
  expect(await question(page)).toMatchObject({ hearts: 3, remaining: 16, answered: 0 });
});

test('keys answer, Enter skips the replay and Esc opens the menu', async ({ page }) => {
  const s = await question(page);
  await page.keyboard.press(String(rightIndex(s.card)));
  await expect.poll(async () => (await state(page)).answered).toBe(1);
  const t = await question(page);
  await page.keyboard.press(String(wrongIndex(t.card)));
  await expect.poll(async () => (await state(page)).phase).toBe('replay');
  await page.waitForTimeout(850);
  await page.locator('body').press('Enter');
  await expect.poll(async () => (await state(page)).phase).toBe('question');

  await page.keyboard.press('Escape');
  const menu = page.getByRole('dialog', { name: 'Menu' });
  await expect(menu).toBeVisible();
  await expect(page.getByRole('button', { name: /Sound: (on|off)/ })).toBeFocused();
  await page.keyboard.press('1');
  expect((await state(page)).answered).toBe(2);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(page.locator('#menu-btn')).toBeFocused();
});

test('the page passes axe with no violations on the question, the replay and the end', async ({
  page,
}) => {
  const scan = async (label: string) => {
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, label).toEqual([]);
  };
  await question(page);
  await scan('question');
  await tap(page, wrongIndex((await state(page)).card));
  await expect(page.locator('#panel')).toBeVisible();
  await page.getByRole('button', { name: 'Pause' }).click();
  await scan('replay');
  await page.getByRole('button', { name: 'Next' }).click();
  await answerRest(page);
  await scan('cleared');
});

test('every visible text meets its contrast token pair', async ({ page }) => {
  await question(page);
  const tokens = Object.entries(PALETTE).map(([k, v]) => [k, v] as const);
  const pairs = await page.evaluate(() => {
    const rgb = (c: string) => {
      const m = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/.exec(c);
      return m
        ? {
            hex: `#${[m[1], m[2], m[3]].map((x) => Number(x).toString(16).padStart(2, '0')).join('')}`,
            a: m[4] === undefined ? 1 : Number(m[4]),
          }
        : null;
    };
    const out: { text: string; fg: string; bg: string; size: number }[] = [];
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim());
      if (!own || el.closest('[hidden]') || el.offsetParent === null) continue;
      const fg = rgb(getComputedStyle(el).color);
      let bg = null;
      for (let p: HTMLElement | null = el; p; p = p.parentElement) {
        const c = rgb(getComputedStyle(p).backgroundColor);
        if (c && c.a > 0.99) {
          bg = c;
          break;
        }
      }
      if (fg && bg)
        out.push({
          text: el.textContent?.trim().slice(0, 30) ?? '',
          fg: fg.hex,
          bg: bg.hex,
          size: parseFloat(getComputedStyle(el).fontSize),
        });
    }
    return out;
  });
  expect(pairs.length).toBeGreaterThan(10);
  for (const p of pairs) {
    expect(contrast(p.fg, p.bg), `${p.text}: ${p.fg} on ${p.bg}`).toBeGreaterThanOrEqual(4.5);
    expect(p.size, `${p.text} is at least 16 px`).toBeGreaterThanOrEqual(16);
    expect(
      tokens.some(([, v]) => v === p.fg),
      `${p.text} uses a palette color`,
    ).toBe(true);
  }
});

test('every control is a big enough tap target', async ({ page }) => {
  await question(page);
  const check = async (label: string) => {
    const sizes = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('button')]
        .filter((b) => b.offsetParent !== null && !b.closest('[hidden]'))
        .map((b) => {
          const r = b.getBoundingClientRect();
          return {
            name: b.textContent?.trim() ?? '',
            answer: b.matches('.answer'),
            w: r.width,
            h: r.height,
          };
        }),
    );
    expect(sizes.length, label).toBeGreaterThan(0);
    for (const s of sizes) {
      expect(s.w, `${label}: ${s.name} width`).toBeGreaterThanOrEqual(48);
      expect(s.h, `${label}: ${s.name} height`).toBeGreaterThanOrEqual(s.answer ? 64 : 48);
    }
  };
  await check('question');
  await tap(page, wrongIndex((await state(page)).card));
  await expect(page.locator('#panel')).toBeVisible();
  await check('replay');
  await page.getByRole('button', { name: 'Next' }).click({ delay: 900 });
  await page.keyboard.press('Escape');
  await check('menu');
});

test('reduced motion keeps every state, with no shake and a countdown in words', async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/rules/?seed=47');
  const s = await question(page);
  await tap(page, wrongIndex(s.card));
  await expect(page.locator('#card')).not.toHaveClass(/shake/);
  await expect(page.locator('#card')).toHaveClass(/missed/);
  await expect(page.locator('#countdown-text')).toHaveText(/Next card in \d s/);
  await expect(page.locator('#countdown')).toBeHidden();
  await expect(page.locator('#panel-citation')).toHaveText(cardOf(s.card).citation);
  await context.close();
});
