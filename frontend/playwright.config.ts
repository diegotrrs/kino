import {
  defineConfig,
  devices
}                 from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env.local' });

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts', // This is needed so the test user exists. Another option would be to just create it
  // , delete global-setup, document that it needs to be created. The problem with this is that it might fail in new envs (such as pipeline envs)
  timeout: 30_000,
  workers: process.env.CI ? 1 : 2, // all specs share one test user and each file's afterAll reset wipes its data, so parallel files race
  retries: process.env.CI ? 2 : 1,
  reporter: 'html',

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // CI builds beforehand and serves the production bundle — dev mode compiles routes on first hit, which flakes under the test timeout
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, //  CI is set automatically by CI platforms
    timeout: 120_000,
  },
});
