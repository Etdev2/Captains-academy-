import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { CATEGORIES, LIGHTS, PAR_MS, QUESTION } from '../src/sim/chapter1/lights';
import { PALETTE, contrast } from '../src/game/ui/palette';

// Chapter 1, level 2 at /rules/?level=lights (issue #29): name the vessel from
// its lights with a tap or a key. A right answer cites its rule, a miss costs a
// heart and plays a pausable replay with the rule, and the run ends cleared or
// out of hearts. Every project runs it: phone upright, phone sideways, desktop.

type Quiz = NonNullable<Window['__captainsAcademyQuiz']>;
const state = (page: Page): Promise<Quiz> =>
  page.evaluate(() => window.__captainsAcademyQuiz as NonNullable<Window['__captainsAcademyQuiz']>);
const cardOf = (id: string | null) => {
  const card = LIGHTS.find((c) => c.id === id);
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
  // One star on level 1 opens level 2 (G12).
  await page.addInitScript(() => {
    if (!window.localStorage.getItem('captains-academy:stars:ch1-definitions'))
      window.localStorage.setItem('captains-academy:stars:ch1-definitions', '1');
  });
  await page.goto('/rules/?level=lights&seed=29');
  await expect(page.locator('#art canvas')).toBeVisible();
});
test.afterEach(() => {
  expect(errors).toEqual([]);
});

test('the first card shows the rule set, the progress, the hearts and seven answers', async ({
  page,
}) => {
  const s = await question(page);
  expect(s).toMatchObject({ level: 'ch1-lights', hearts: 3, remaining: LIGHTS.length, seed: 29 });
  await expect(page.getByRole('heading', { name: '2 · Lights' })).toBeVisible();
  await expect(page.locator('#chip')).toHaveText('Inland + International');
  await expect(page.locator('#progress-text')).toHaveText(`1 of ${LIGHTS.length}`);
  await expect(page.locator('#cue')).toHaveText(cardOf(s.card).cue);
  await expect(page.locator('#rule-line')).toHaveText('');
  await expect(page.getByRole('heading', { name: QUESTION })).toBeVisible();
  await expect(page.getByRole('group', { name: QUESTION }).getByRole('button')).toHaveText(
    CATEGORIES.map((c) => new RegExp(c.label)),
  );
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/qualif|study aid|approved course|sea[- ]time/i);
});

test('a locked Lights level opens Definitions instead', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/rules/?level=lights&seed=29');
  expect((await question(page)).level).toBe('ch1-definitions');
});

test('a clean run names every vessel, cites each rule and clears with three stars', async ({
  page,
}) => {
  for (let i = 0; i < LIGHTS.length; i++) {
    const s = await question(page);
    await expect(page.locator('#progress-text')).toHaveText(`${i + 1} of ${LIGHTS.length}`);
    await tap(page, rightIndex(s.card));
    if (i < LIGHTS.length - 1)
      await expect(page.locator('#rule-line')).toHaveText(cardOf(s.card).citation);
  }
  await expect.poll(async () => (await state(page)).phase).toBe('done');
  const end = await state(page);
  expect(end).toMatchObject({ outcome: 'cleared', stars: 3, misses: 0, hearts: 3 });
  expect(end.elapsedMs).toBeLessThanOrEqual(PAR_MS);
  await expect(page.getByRole('dialog', { name: 'Level cleared' })).toBeVisible();
  await expect(page.locator('#stars-text')).toHaveText('3 of 3 stars');
  await expect(page.locator('#next-level-btn')).toBeHidden();
  expect(
    await page.evaluate(() => window.localStorage.getItem('captains-academy:stars:ch1-lights')),
  ).toBe('3');
  // Definitions keeps the star it had: Lights writes nothing else, and never the sea-time log.
  expect(
    await page.evaluate(() =>
      window.localStorage.getItem('captains-academy:stars:ch1-definitions'),
    ),
  ).toBe('1');
});

test('a wrong answer costs a heart, explains the rule, and the card comes back', async ({
  page,
}) => {
  const s = await question(page);
  const card = cardOf(s.card);
  const wrong = wrongIndex(s.card);
  await tap(page, wrong);
  await expect(button(page, wrong)).toHaveAttribute('data-state', 'wrong');
  await expect(button(page, rightIndex(s.card))).toHaveAttribute('data-state', 'answer');
  await expect(page.locator('#hearts')).toHaveAttribute('aria-label', '2 of 3 hearts left');

  const panel = page.getByRole('region', { name: 'Not quite' });
  await expect(panel).toBeVisible();
  const phrase = CATEGORIES.find((c) => c.id === card.answer)?.phrase ?? '';
  await expect(page.locator('#panel-answer')).toHaveText(`Those are the lights of ${phrase}.`);
  await expect(page.locator('#panel-why')).toHaveText(card.why);
  await expect(page.locator('#panel-citation')).toHaveText(card.citation);
  await expect(page.locator('#panel-back')).toHaveText('This one comes back in 3 cards.');
  await expect(page.locator('#live-assertive')).toContainText(card.citation);
  expect((await state(page)).phase).toBe('replay');

  // The replay ends on its own after about 5 seconds, so nothing blocks longer.
  await expect.poll(async () => (await state(page)).phase, { timeout: 8000 }).toBe('question');
  await expect(panel).toBeHidden();

  for (let i = 0; i < 3; i++) await tap(page, rightIndex((await question(page)).card));
  expect((await question(page)).card).toBe(card.id);

  await answerRest(page);
  const end = await state(page);
  expect(end).toMatchObject({ outcome: 'cleared', stars: 2, misses: 1 });
  await expect(page.locator('#review-list li')).toHaveCount(1);
  await expect(page.locator('#review-list li')).toContainText(card.citation);
});

test('a muted run plays through with the keys, the same as a loud one', async ({ page }) => {
  await question(page);
  await page.keyboard.press('Escape');
  const menu = page.getByRole('dialog', { name: 'Menu' });
  await expect(menu).toBeVisible();
  const sound = page.getByRole('button', { name: /Sound: (on|off)/ });
  if ((await sound.textContent()) === 'Sound: on') await sound.click();
  await expect(sound).toHaveText('Sound: off');
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();

  const s = await question(page);
  await page.keyboard.press(String(wrongIndex(s.card)));
  await expect.poll(async () => (await state(page)).phase).toBe('replay');
  await page.waitForTimeout(850);
  await page.locator('body').press('Enter');
  await answerRest(page);
  expect(await state(page)).toMatchObject({ outcome: 'cleared', misses: 1 });
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
  await expect.poll(async () => (await state(page)).phase, { timeout: 8000 }).toBe('done');
  expect(await state(page)).toMatchObject({ outcome: 'out-of-hearts', stars: 0, hearts: 0 });
  await expect(page.getByRole('dialog', { name: 'Out of hearts' })).toBeVisible();
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
  const tokens: string[] = Object.values(PALETTE);
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
    expect(tokens.includes(p.fg), `${p.text} uses a palette color`).toBe(true);
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
