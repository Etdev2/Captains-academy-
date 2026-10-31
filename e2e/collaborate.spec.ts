import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('collaborators can select, personalize, and copy each prompt exactly', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          (window as Window & { copiedPrompt?: string }).copiedPrompt = value;
        },
      },
    });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto('/collaborate/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-prompt]')).toHaveCount(6);
  await page.getByLabel('Your name').fill('Riley $& <friend>');
  await page.getByLabel('Task or issue').fill('Forms workspace, #78');
  for (const id of ['onboard', 'claim', 'prototype', 'review', 'handoff']) {
    const card = page.locator(`[data-prompt="${id}"]`);
    await card.focus();
    await page.keyboard.press('Enter');
    await expect(card).toHaveAttribute('aria-pressed', 'true');
    const displayed = await page.locator('#prompt-text').inputValue();
    expect(displayed).toContain('Riley $& <friend>');
    expect(displayed).toContain('Forms workspace, #78');
    expect(displayed).not.toContain('{{collaborator}}');
    await page.getByRole('button', { name: 'Copy prompt' }).click();
    expect(
      await page.evaluate(() => (window as Window & { copiedPrompt?: string }).copiedPrompt),
    ).toBe(displayed);
    await expect(page.getByRole('status')).toContainText('Prompt copied');
  }
  await page.getByRole('button', { name: 'Design', exact: true }).click();
  // Prepare a prototype, and Hill climb a live prototype from the Decision Desk.
  await expect(page.locator('[data-prompt]')).toHaveCount(2);
  await expect(page.locator('#selected-title')).toHaveText('Prepare a prototype');
  await page.getByLabel('Find a prompt').fill('no-match-zz');
  await expect(page.locator('#empty')).toBeVisible();
  await page.getByLabel('Find a prompt').fill('');
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.locator('[data-prompt]')).toHaveCount(6);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  expect(errors).toEqual([]);
});

test('copy failure selects the prompt for manual copying', async ({ page }) => {
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
  await page.goto('/collaborate/');
  await page.getByRole('button', { name: 'Copy prompt' }).click();
  await expect(page.getByRole('status')).toContainText('Automatic copy is unavailable');
  expect(
    await page
      .locator('#prompt-text')
      .evaluate((el: HTMLTextAreaElement) => [el.selectionStart, el.selectionEnd]),
  ).toEqual([0, (await page.locator('#prompt-text').inputValue()).length]);
});

test('a failed prompt request offers a readable recovery path', async ({ page }) => {
  await page.route('**/collaborate/prompts.json', (route) =>
    route.fulfill({ status: 503, body: '' }),
  );
  await page.goto('/collaborate/');
  await expect(page.getByRole('alert')).toContainText('Prompts could not load');
  await expect(page.getByRole('alert').getByRole('link')).toHaveAttribute(
    'href',
    /Captains-academy-/,
  );
  await expect(page.getByRole('button', { name: 'Copy prompt' })).toBeDisabled();
});

test.describe('phone layout', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('fits the phone, keeps controls usable, and passes axe', async ({ page }, testInfo) => {
    await page.goto('/collaborate/');
    await expect(page.locator('[data-prompt]')).toHaveCount(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    for (const button of await page.getByRole('button').all()) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.locator('#prompts').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('collaborator-phone.png'), fullPage: true });
  });
});
