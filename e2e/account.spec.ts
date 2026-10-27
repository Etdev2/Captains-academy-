import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// The account screen at /account in a build without Supabase settings (issue
// #87): sign-in is not set up, and the front page shows no Account link.

test('without Supabase settings the account screen says sign-in is not set up', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/account/');
  await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();
  await expect(page.getByTestId('not-set-up')).toContainText('Sign-in is not set up');
  await expect(page.getByRole('textbox')).toHaveCount(0);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
  expect(errors).toEqual([]);
});

test('without Supabase settings the front page has no Account link', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Sea-time log/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Account/ })).toHaveCount(0);
});
