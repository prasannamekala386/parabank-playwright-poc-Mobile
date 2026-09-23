import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const baseURL = process.env.BASE_URL;

if (!baseURL) {
  throw new Error('BASE_URL is required in .env');
}

export default defineConfig({
  testDir: './tests',

  // Avoid excessive parallelism against shared ParaBank environment
  fullyParallel: false,

  // Prevent accidental commits with test.only()
  forbidOnly: !!process.env.CI,

  // Retries only in CI
  retries: process.env.CI ? 2 : 0,

  // Use fewer workers in CI to avoid ParaBank instability
  workers: process.env.CI ? 1 : 6,

  // Reporters
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', { resultsDir: 'allure-results' }],
  ],

  use: {
    baseURL,

    ignoreHTTPSErrors: true,

    // Better debugging when failures occur
    trace: 'retain-on-failure',

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',

    actionTimeout: 15000,

    navigationTimeout: 30000,
  },

  // Default timeout
  timeout: 60000,

  expect: {
    timeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Future expansion
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //   },
    // },

    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //   },
    // },
  ],
});
