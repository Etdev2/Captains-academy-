import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// The interactive prototypes at /prototypes/live: five categories, each in
// variants A (Night Bridge), B (Clean & Light) and C (Guided Mentor), behind a
// frame with an A/B/C switcher. On the Decision Desk at /prototypes, category
// chips narrow the board, every concept has its own link, and a variant's
// screenshot opens with an A/B/C switcher and its interactive prototype.

const categories = [
  ['console', "Captain's Console"],
  ['license', 'License Navigator & Forms'],
  ['sea-time', 'Sea-Time Logbook'],
  ['study', 'Study & Exam Prep'],
  ['arcade', 'Arcade & Simulations'],
] as const;
const variants = [
  ['a', 'A', 'Night Bridge'],
  ['b', 'B', 'Clean & Light'],
  ['c', 'C', 'Guided Mentor'],
] as const;

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return errors;
}

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test('the index lists every category in all three variants', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/prototypes/live/');
  await expect(page.getByRole('heading', { name: 'Interactive prototypes' })).toBeVisible();
  for (const [id, title] of categories) {
    const card = page.locator(`#category-${id}`);
    await expect(card.getByRole('heading', { name: title })).toBeVisible();
    await expect(card.getByRole('link')).toHaveCount(3);
  }
  expect(await overflow(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

for (const [category, title] of categories) {
  test(`${title}: A, B and C open, fit the screen and switch`, async ({ page }) => {
    const errors = watchErrors(page);
    for (const [variant, letter, name] of variants) {
      await page.goto(`/prototypes/live/?category=${category}&variant=${variant}`);
      const root = page.locator(`#variant-root[data-variant="${variant}"]`);
      await expect(page.locator('.live-loading')).toHaveCount(0);
      await expect
        .poll(() => root.evaluate((r) => r.getBoundingClientRect().height))
        .toBeGreaterThan(400);
      await expect(
        root
          .getByText(/sample/i)
          .filter({ visible: true })
          .first(),
      ).toBeVisible();
      const switcher = page.getByRole('navigation', { name: `${title} design variants` });
      await expect(
        switcher.getByRole('link', { name: new RegExp(`${letter}\\s*${name}`) }),
      ).toHaveAttribute('aria-current', 'page');
      expect(await overflow(page), `${category} ${variant} scrolls sideways`).toBeLessThanOrEqual(
        0,
      );
    }
    // The switcher keeps the category and changes the variant.
    await page
      .getByRole('navigation', { name: `${title} design variants` })
      .getByRole('link', { name: /A\s*Night Bridge/ })
      .click();
    await expect(page).toHaveURL(new RegExp(`category=${category}&variant=a`));
    expect(errors).toEqual([]);
  });
}

test('a variant links back to its screenshot on the Decision Desk', async ({ page }) => {
  await page.goto('/prototypes/live/?category=sea-time&variant=b');
  await page.getByRole('link', { name: /Decision Desk/ }).click();
  await expect(page).toHaveURL(/\/prototypes\/\?concept=cl-live-sea-time-b-desktop/);
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('category chips narrow the board, and the choice has its own link', async ({ page }) => {
  await page.goto('/prototypes/?category=study');
  await expect(page.locator('.category-chips [aria-current="page"]')).toHaveText(
    /Study & Exam Prep/,
  );
  await expect(page.locator('#board section > h2')).toHaveText([
    /^Study & Exam Prep/,
    /^Definitions/,
    /^Lights/,
  ]);
  await expect(page.locator('#section-study li[data-id]')).toHaveCount(3);
  await page.locator('.category-chips a[data-category="arcade"]').click();
  await expect(page).toHaveURL(/category=arcade/);
  await expect(page.locator('#board section > h2').first()).toHaveText(/^Arcade & Simulations/);
  await page.locator('.category-chips a[data-category="all"]').click();
  await expect(page).not.toHaveURL(/category=/);
  await expect(page.locator('#board section > h2')).toHaveCount(9);
});

test('a variant screenshot opens with an A/B/C switcher and its interactive prototype', async ({
  page,
}) => {
  const errors = watchErrors(page);
  await page.goto('/prototypes/?concept=cl-live-console-a-desktop');
  const viewer = page.getByRole('dialog');
  await expect(viewer).toBeVisible();
  // A phone held sideways keeps A, B and C in the Notes and details sheet.
  const top = viewer.locator('.viewer-top');
  const sideways = !(await top
    .getByRole('group', { name: 'Design variants A, B and C' })
    .isVisible());
  const notes = viewer.getByRole('button', { name: /^Notes and details/ });
  if (sideways) await notes.click();
  const group = viewer
    .getByRole('group', { name: 'Design variants A, B and C' })
    .filter({ visible: true });
  await expect(group.getByRole('button')).toHaveCount(3);
  await expect(group.getByRole('button', { name: 'Variant A: Night Bridge' })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await group.getByRole('button', { name: 'Variant C: Guided Mentor' }).click();
  await expect(page).toHaveURL(/concept=cl-live-console-c-desktop/);
  if (sideways && !(await viewer.locator('#viewer-sheet').isVisible())) await notes.click();
  const open = viewer
    .getByRole('link', { name: 'Open interactive prototype' })
    .filter({ visible: true })
    .first();
  await expect(open).toHaveAttribute('href', '/prototypes/live/?category=console&variant=c');
  await open.click();
  await expect(page).toHaveURL(/\/prototypes\/live\/\?category=console&variant=c/);
  await expect(page.locator('#variant-root[data-variant="c"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the prototype index and every primary screen pass axe', async ({ page }) => {
  await page.goto('/prototypes/live/');
  const index = await new AxeBuilder({ page }).analyze();
  expect(index.violations.map((v) => v.id)).toEqual([]);
  for (const [category] of categories) {
    for (const [variant] of variants) {
      await page.goto(`/prototypes/live/?category=${category}&variant=${variant}`);
      await expect(page.locator('.live-loading')).toHaveCount(0);
      await expect
        .poll(() => page.locator('#variant-root').evaluate((r) => r.getBoundingClientRect().height))
        .toBeGreaterThan(400);
      const result = await new AxeBuilder({ page }).analyze();
      expect(
        result.violations.map((v) => `${v.id}: ${v.nodes.length}`),
        `${category} ${variant}`,
      ).toEqual([]);
    }
  }
});
