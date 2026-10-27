import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { mockAuth } from './auth-mock';

// The account screen at /account in a build with Supabase settings (issue
// #87), upright on a phone. Every Auth API call is answered by e2e/auth-mock.ts.

const email = 'mate@example.com';

async function expectNoAxeViolations(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations, label).toEqual([]);
}

async function sendLink(page: Page): Promise<void> {
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
  await expect(page.getByTestId('code-form')).toContainText(email);
}

test('send a link, enter the code, see the signed-in state, then sign out', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const auth = await mockAuth(page);

  await page.goto('/');
  const account = page.getByRole('link', { name: /Account/ });
  await expect(account).toBeVisible();
  await account.click();
  await expect(page).toHaveURL(/\/account\/$/);
  await expect(page.getByTestId('email-form')).toBeVisible();
  await expectNoAxeViolations(page, 'signed out');

  // A gloved thumb needs tall controls.
  const send = page.getByRole('button', { name: 'Email me a sign-in link' });
  expect((await send.boundingBox())?.height).toBeGreaterThanOrEqual(48);

  await sendLink(page);
  expect(auth.otpRequests).toHaveLength(1);
  expect(auth.otpRequests[0]).toMatchObject({ email, create_user: true });
  // PKCE: the request carries a code challenge, and the link comes back to /account/.
  expect(auth.otpRequests[0]?.['code_challenge']).toEqual(expect.any(String));
  await expectNoAxeViolations(page, 'code sent');

  const code = page.getByLabel('6-digit code');
  await code.fill('12345');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByTestId('problem')).toContainText('6-digit code');
  expect(auth.verifyRequests).toHaveLength(0);

  await code.fill('123 456');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByTestId('signed-in')).toContainText(`Signed in as ${email}`);
  expect(auth.verifyRequests[0]).toMatchObject({ email, token: '123456', type: 'email' });
  await expectNoAxeViolations(page, 'signed in');

  // The session survives a reload, and the front page shows who is signed in.
  await page.reload();
  await expect(page.getByTestId('signed-in')).toContainText(email);
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Account/ })).toContainText(`Signed in as ${email}`);

  await page.goto('/account/');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByTestId('email-form')).toBeVisible();
  expect(auth.logouts).toBe(1);
  await page.reload();
  await expect(page.getByTestId('email-form')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a wrong or expired code says so and stays signed out', async ({ page }) => {
  await mockAuth(page, {
    verifyError: { code: 'otp_expired', msg: 'Token has expired or is invalid' },
  });
  await page.goto('/account/');
  await sendLink(page);
  await page.getByLabel('6-digit code').fill('000000');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByTestId('problem')).toContainText('wrong or has expired');
  await expect(page.getByTestId('signed-in')).toHaveCount(0);
});

test('offline, the screen says sign-in needs a connection', async ({ page, context }) => {
  await mockAuth(page);
  await page.goto('/account/');
  await expect(page.getByTestId('email-form')).toBeVisible();

  await context.setOffline(true);
  await expect(page.getByTestId('offline')).toContainText('Signing in needs a connection');
  await expect(page.getByTestId('offline')).toContainText('The rest of the app works without one');
  await expect(page.getByRole('button', { name: 'Email me a sign-in link' })).toBeDisabled();
  await expectNoAxeViolations(page, 'offline');

  await context.setOffline(false);
  await expect(page.getByTestId('offline')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Email me a sign-in link' })).toBeEnabled();
});
