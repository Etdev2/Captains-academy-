import type { Page, Request } from '@playwright/test';

// A stand-in for the Supabase Auth API (issue #87). The account-set-up build
// points at this host, which does not exist, and the tests answer every call.

export const AUTH_URL = 'https://auth.example.test';

export interface AuthMock {
  otpRequests: Record<string, unknown>[];
  verifyRequests: Record<string, unknown>[];
  logouts: number;
}

function fakeJwt(sub: string, email: string): string {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub, email, exp, role: 'authenticated' })}.sig`;
}

function body(request: Request): Record<string, unknown> {
  return (request.postDataJSON() as Record<string, unknown> | null) ?? {};
}

export async function mockAuth(
  page: Page,
  options: { verifyError?: { code: string; msg: string } } = {},
): Promise<AuthMock> {
  const mock: AuthMock = { otpRequests: [], verifyRequests: [], logouts: 0 };
  const json = (status: number, data: unknown) => ({
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });

  await page.route(`${AUTH_URL}/auth/v1/otp*`, async (route) => {
    mock.otpRequests.push(body(route.request()));
    await route.fulfill(json(200, {}));
  });

  await page.route(`${AUTH_URL}/auth/v1/verify*`, async (route) => {
    const sent = body(route.request());
    mock.verifyRequests.push(sent);
    if (options.verifyError) {
      await route.fulfill(
        json(403, {
          code: 403,
          error_code: options.verifyError.code,
          msg: options.verifyError.msg,
        }),
      );
      return;
    }
    const email = String(sent['email']);
    const id = '00000000-0000-4000-8000-000000000087';
    const now = new Date().toISOString();
    await route.fulfill(
      json(200, {
        access_token: fakeJwt(id, email),
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: 'refresh-e2e',
        user: {
          id,
          aud: 'authenticated',
          role: 'authenticated',
          email,
          email_confirmed_at: now,
          is_anonymous: false,
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: {},
          identities: [],
          created_at: now,
          updated_at: now,
        },
      }),
    );
  });

  await page.route(`${AUTH_URL}/auth/v1/logout*`, async (route) => {
    mock.logouts += 1;
    await route.fulfill({ status: 204 });
  });

  return mock;
}
