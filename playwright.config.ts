import { defineConfig, devices } from '@playwright/test';

// One smoke test against the production build (verify.sh builds first).
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
  ],
});
