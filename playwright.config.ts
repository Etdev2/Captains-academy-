import { defineConfig, devices } from '@playwright/test';
import { AUTH_URL } from './e2e/auth-mock';

// Smoke tests against the production build (verify.sh builds first).

const SIGNED_IN_BUILD = '**/account-set-up.spec.ts';
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173' },
  webServer: [
    {
      command: 'npx --no-install vite preview',
      url: 'http://localhost:4173/play/',
      reuseExistingServer: !process.env.CI,
    },
    // A second build with Supabase settings for the account screen (issue #87).
    // The settings point at a host that does not exist; the tests answer every
    // Auth API call with page.route, so no real email is ever sent.
    {
      command:
        'npx --no-install vite build --outDir dist-auth --emptyOutDir && npx --no-install vite preview --outDir dist-auth --port 4174',
      env: {
        VITE_SUPABASE_URL: AUTH_URL,
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_e2e',
      },
      url: 'http://localhost:4174/account/',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, testIgnore: SIGNED_IN_BUILD },
    {
      name: 'phone-landscape',
      use: { ...devices['Pixel 7 landscape'] },
      testIgnore: SIGNED_IN_BUILD,
    },
    // The sea-time log, the front page, the Rules of the Road level at /rules,
    // the prototype review gallery and its interactive prototypes are used
    // upright with one thumb. The docking game at /play asks to be
    // turned sideways in portrait, so its tests don't run here.
    {
      name: 'phone-portrait',
      use: { ...devices['Pixel 7'] },
      testMatch: [
        '**/log.spec.ts',
        '**/vessels.spec.ts',
        '**/home.spec.ts',
        '**/entries.spec.ts',
        '**/rules.spec.ts',
        '**/prototypes.spec.ts',
        '**/prototypes-live.spec.ts',
        '**/lights.spec.ts',
        '**/account.spec.ts',
      ],
    },
    // The account screen with sign-in set up, upright with one thumb.
    {
      name: 'account-set-up',
      use: { ...devices['Pixel 7'], baseURL: 'http://localhost:4174' },
      testMatch: SIGNED_IN_BUILD,
    },
  ],
});
