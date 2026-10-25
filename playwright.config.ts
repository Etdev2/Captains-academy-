import { defineConfig, devices } from '@playwright/test';

// Smoke tests against the production build (verify.sh builds first).
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npx --no-install vite preview',
    url: 'http://localhost:4173/play/',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone-landscape', use: { ...devices['Pixel 7 landscape'] } },
    // The sea-time log, the front page and the Rules of the Road level at /rules
    // are used upright with one thumb. The docking game at /play asks to be
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
        '**/lights.spec.ts',
      ],
    },
  ],
});
