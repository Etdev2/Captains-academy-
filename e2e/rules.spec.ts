import { expect, test, type Page } from '@playwright/test';
import { CATEGORIES, DEFINITIONS } from '../src/sim/chapter1/definitions';

// Chapter 1, level 1 at /rules (issue #47): name each vessel with one tap or
// key, a miss costs a heart and plays the replay, and the run ends cleared or
// out of hearts. It plays upright, so every project runs it.

const state = (page: Page) => page.evaluate(() => window.__captainsAcademyQuiz);
const keyFor = (cardId: string | null | undefined): string => {
  const card = DEFINITIONS.find((c) => c.id === cardId);
  if (!card) throw new Error(`unknown card ${String(cardId)}`);
  return String(CATEGORIES.findIndex((c) => c.id === card.answer) + 1);
};
const wrongKeyFor = (cardId: string | null | undefined): string =>
  String((Number(keyFor(cardId)) % CATEGORIES.length) + 1);

async function ready(page: Page) {
  await expect.poll(async () => (await state(page))?.phase).toBe('question');
}
async function press(page: Page, key: string) {
  const before = (await state(page))?.answered ?? 0;
  await page.keyboard.press(key);
  await expect.poll(async () => (await state(page))?.answered).toBe(before + 1);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/rules/');
  await expect(page.locator('#game canvas')).toBeVisible();
});

test('a clean run names every vessel and earns three stars', async ({ page }) => {
  await ready(page);
  const start = await state(page);
  expect(start).toMatchObject({
    hearts: 3,
    remaining: DEFINITIONS.length,
    level: 'ch1-definitions',
  });
  for (let i = 0; i < DEFINITIONS.length; i++) {
    await expect.poll(async () => (await state(page))?.phase).toMatch(/question/);
    await press(page, keyFor((await state(page))?.card));
  }
  await expect.poll(async () => (await state(page))?.phase).toBe('done');
  expect(await state(page)).toMatchObject({ outcome: 'cleared', misses: 0, stars: 3 });
  expect(
    await page.evaluate(() => localStorage.getItem('captains-academy:stars:ch1-definitions')),
  ).toBe('3');
});

test('a miss costs a heart, plays the replay and brings the card back', async ({ page }) => {
  await ready(page);
  const missed = (await state(page))?.card;
  await press(page, wrongKeyFor(missed));
  expect(await state(page)).toMatchObject({ phase: 'replay', hearts: 2, combo: 0 });
  const record = await page.evaluate(
    (id) => localStorage.getItem(`captains-academy:mastery:${id}`),
    missed ?? '',
  );
  expect(JSON.parse(record ?? '{}')).toMatchObject({ wrong: 1, streak: 0 });
  // The replay runs about five seconds on its own.
  await expect.poll(async () => (await state(page))?.phase, { timeout: 8000 }).toBe('question');
  for (let i = 0; i < 3; i++) {
    expect((await state(page))?.card).not.toBe(missed);
    await press(page, keyFor((await state(page))?.card));
    await ready(page);
  }
  expect((await state(page))?.card).toBe(missed);
});

test('three misses end the run with no stars', async ({ page }) => {
  for (let i = 0; i < 3; i++) {
    await ready(page);
    await press(page, wrongKeyFor((await state(page))?.card));
    if (i < 2) {
      // Enter skips the rest of the replay once it has shown for a moment.
      await page.waitForTimeout(900);
      await page.keyboard.press('Enter');
    }
  }
  await expect.poll(async () => (await state(page))?.phase, { timeout: 8000 }).toBe('done');
  expect(await state(page)).toMatchObject({ outcome: 'out-of-hearts', hearts: 0, stars: 0 });
});
