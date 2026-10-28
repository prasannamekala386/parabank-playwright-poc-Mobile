import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const baseURL = process.env.BASE_URL?.trim().replace(/\/index\.htm$/i, '/');

const androidProjects = ['emulator-5554', 'emulator-5556', 'emulator-5558'].map((serial) => ({
  name: `android-${serial}`,
  testMatch: '**/*.spec.ts',
  testIgnore: ['**/api/**', '**/day1.smoke.android.spec.ts'],
  metadata: { androidSerial: serial },
  use: {
    browserName: 'chromium' as const,
    trace: 'off' as const,
    screenshot: 'off' as const,
    video: 'off' as const,
  },
}));

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
    testIgnore: '**/day1.smoke.android.spec.ts',
    use: {
      ...devices['Desktop Chrome'],
    },
  },

  ...androidProjects,

  // Android Devices
  // {
  //   name: 'Pixel 7',
  //   use: {
  //     ...devices['Pixel 7'],
  //     viewport: { width: 412, height: 915 },
  //   },
  // },

  // {
  //   name: 'Samsung Galaxy S23',
  //   use: {
  //     ...devices['Galaxy S23'],
  //     viewport: { width: 393, height: 852 },
  //   },
  // },

  // // iOS Devices
  // {
  //   name: 'iPhone 14',
  //   use: {
  //     ...devices['iPhone 14'],
  //     viewport: { width: 390, height: 844 },
  //   },
  // },

  // {
  //   name: 'iPhone 15 Pro',
  //   use: {
  //     ...devices['iPhone 15 Pro'],
  //     viewport: { width: 393, height: 852 },
  //   },
  // },

  // {
  //   name: 'iPad Pro 11',
  //   use: {
  //     ...devices['iPad Pro 11'],
  //     viewport: { width: 834, height: 1194 },
  //   },
  // },

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
